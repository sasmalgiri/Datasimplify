/**
 * Cron Job Handler for Scheduled Exports
 * This endpoint is called by Vercel Cron to process due scheduled exports
 *
 * Configure in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/export",
 *     "schedule": "0/15 * * * *"
 *   }]
 * }
 *
 * Security: Protected by CRON_SECRET environment variable
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { generateTemplate, type UserTemplateConfig } from '@/lib/templates/generator';
import { sendScheduledExportEmail } from '@/lib/email';

// Max exports to process per cron run (to stay within function timeout)
const MAX_EXPORTS_PER_RUN = 5;

// Validate cron secret
function validateCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error('CRON_SECRET not configured');
    return false;
  }

  return authHeader === `Bearer ${cronSecret}`;
}

/**
 * Calculate next run time from cron expression (simplified)
 */
function getNextRunTime(cronExpression: string): Date {
  const [minute, hour] = cronExpression.split(' ');

  const now = new Date();
  const next = new Date(now);

  const targetHour = hour === '*' ? now.getHours() : parseInt(hour, 10);
  const targetMinute = minute === '*' ? 0 : parseInt(minute, 10);

  next.setHours(targetHour, targetMinute, 0, 0);

  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }

  return next;
}


/**
 * Send webhook notification with download URL
 */
async function sendWebhook(
  url: string,
  payload: {
    schedule_id: string;
    schedule_name: string;
    filename: string;
    generated_at: string;
    // Note: For webhook, we'd typically upload to storage and send URL
    // For MVP, just send metadata
  }
): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CryptoReportKit-Cron/1.0',
      },
      body: JSON.stringify(payload),
    });

    return response.ok;
  } catch (error) {
    console.error('Webhook send error:', error);
    return false;
  }
}

// GET handler for cron job
export async function GET(request: NextRequest) {
  // Validate cron secret
  if (!validateCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Use service role for cron (bypasses RLS)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Supabase configuration missing');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const now = new Date();

  // Get due scheduled exports
  const { data: dueExports, error: fetchError } = await supabase
    .from('scheduled_exports')
    .select(`
      id,
      user_id,
      recipe_id,
      name,
      cron_expression,
      timezone,
      delivery_method,
      delivery_config,
      report_recipes (
        id,
        name,
        recipe_json
      )
    `)
    .eq('is_active', true)
    .lte('next_run_at', now.toISOString())
    .limit(MAX_EXPORTS_PER_RUN);

  if (fetchError) {
    console.error('Error fetching due exports:', fetchError);
    return NextResponse.json({ error: 'Failed to fetch due exports' }, { status: 500 });
  }

  if (!dueExports || dueExports.length === 0) {
    return NextResponse.json({
      message: 'No exports due',
      checked_at: now.toISOString(),
    });
  }

  const results: Array<{
    id: string;
    name: string;
    status: 'success' | 'error';
    error?: string;
  }> = [];

  // Process each due export
  for (const exportJob of dueExports) {
    try {
      // Get the recipe configuration
      // Supabase returns joined data - handle both array and object cases
      const recipeData = exportJob.report_recipes;
      const recipe = Array.isArray(recipeData) ? recipeData[0] : recipeData;

      if (!recipe || !recipe.recipe_json) {
        throw new Error('Recipe not found or invalid');
      }

      // Parse recipe JSON into UserTemplateConfig
      const recipeConfig = recipe.recipe_json as UserTemplateConfig;

      // Generate the Excel file with CRK formulas
      const buffer = await generateTemplate(
        {
          ...recipeConfig,
          formulaMode: 'crk', // Use CRK formulas for scheduled exports
        },
        'xlsx'
      );

      const timestamp = now.toISOString().split('T')[0];
      const filename = `${exportJob.name.replace(/\s+/g, '-')}-${timestamp}.xlsx`;

      // Deliver based on method
      let delivered = false;

      if (exportJob.delivery_method === 'email') {
        const email = exportJob.delivery_config?.email;
        if (email) {
          const result = await sendScheduledExportEmail({
            to: email,
            exportName: exportJob.name,
            buffer,
            filename,
          });
          delivered = result.success;
        }
      } else if (exportJob.delivery_method === 'webhook') {
        const webhookUrl = exportJob.delivery_config?.url;
        if (webhookUrl) {
          delivered = await sendWebhook(webhookUrl, {
            schedule_id: exportJob.id,
            schedule_name: exportJob.name,
            filename,
            generated_at: now.toISOString(),
          });
        }
      }

      // Calculate next run time
      const nextRun = getNextRunTime(exportJob.cron_expression);

      // Update schedule record
      await supabase
        .from('scheduled_exports')
        .update({
          last_run_at: now.toISOString(),
          next_run_at: nextRun.toISOString(),
          last_error: delivered ? null : 'Delivery failed',
          updated_at: now.toISOString(),
        })
        .eq('id', exportJob.id);

      results.push({
        id: exportJob.id,
        name: exportJob.name,
        status: delivered ? 'success' : 'error',
        error: delivered ? undefined : 'Delivery failed',
      });

      // Log usage event
      await supabase.from('usage_events').insert({
        user_id: exportJob.user_id,
        event_type: 'scheduled_export',
        metadata: {
          schedule_id: exportJob.id,
          recipe_id: exportJob.recipe_id,
          delivery_method: exportJob.delivery_method,
          success: delivered,
        },
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Update schedule with error
      await supabase
        .from('scheduled_exports')
        .update({
          last_error: errorMessage,
          updated_at: now.toISOString(),
        })
        .eq('id', exportJob.id);

      results.push({
        id: exportJob.id,
        name: exportJob.name,
        status: 'error',
        error: errorMessage,
      });

      console.error(`Export ${exportJob.id} failed:`, error);
    }
  }

  return NextResponse.json({
    processed: results.length,
    results,
    checked_at: now.toISOString(),
  });
}
