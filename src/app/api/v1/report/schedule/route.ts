/**
 * Scheduled Exports API
 * Allows Pro users to schedule automatic report generation and delivery
 *
 * POST /api/v1/report/schedule - Create a new schedule
 * GET /api/v1/report/schedule - List all schedules for the user
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  checkEntitlement,
  createEntitlementErrorResponse,
} from '@/lib/entitlements';

// Valid cron expression patterns (simplified validation)
const CRON_PRESETS: Record<string, string> = {
  daily_9am: '0 9 * * *',
  daily_5pm: '0 17 * * *',
  weekly_monday: '0 9 * * 1',
  weekly_friday: '0 17 * * 5',
  monthly_1st: '0 9 1 * *',
  monthly_15th: '0 9 15 * *',
};

/**
 * Simple cron expression validation
 * Validates basic 5-part cron expressions: minute hour day month weekday
 */
function isValidCronExpression(cron: string): boolean {
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return false;

  // Very basic validation - check each part has valid characters
  const patterns = [
    /^(\*|[0-5]?\d)$/, // minute: 0-59
    /^(\*|[01]?\d|2[0-3])$/, // hour: 0-23
    /^(\*|[1-9]|[12]\d|3[01])$/, // day: 1-31
    /^(\*|[1-9]|1[0-2])$/, // month: 1-12
    /^(\*|[0-6])$/, // weekday: 0-6
  ];

  for (let i = 0; i < 5; i++) {
    // Allow wildcards and simple values
    if (parts[i] !== '*' && !patterns[i].test(parts[i])) {
      // Allow comma-separated values and ranges
      if (!/^[\d,\-\*\/]+$/.test(parts[i])) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Calculate next run time from cron expression
 * Simplified implementation - returns next occurrence
 */
function getNextRunTime(cronExpression: string, timezone: string = 'UTC'): Date {
  const [minute, hour, dayOfMonth, month, dayOfWeek] = cronExpression.split(' ');

  const now = new Date();
  const next = new Date(now);

  // Parse hour and minute (simplified - only handles exact times)
  const targetHour = hour === '*' ? now.getHours() : parseInt(hour, 10);
  const targetMinute = minute === '*' ? 0 : parseInt(minute, 10);

  next.setHours(targetHour, targetMinute, 0, 0);

  // If the time has passed today, move to tomorrow
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }

  // Handle day of week
  if (dayOfWeek !== '*') {
    const targetDay = parseInt(dayOfWeek, 10);
    while (next.getDay() !== targetDay) {
      next.setDate(next.getDate() + 1);
    }
  }

  // Handle day of month
  if (dayOfMonth !== '*') {
    const targetDate = parseInt(dayOfMonth, 10);
    next.setDate(targetDate);
    if (next <= now) {
      next.setMonth(next.getMonth() + 1);
    }
  }

  return next;
}

// GET - List scheduled exports for the user
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('scheduled_exports')
    .select(`
      id,
      name,
      cron_expression,
      timezone,
      delivery_method,
      delivery_config,
      is_active,
      last_run_at,
      next_run_at,
      last_error,
      created_at,
      recipe_id,
      report_recipes (
        id,
        name
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching schedules:', error);
    return NextResponse.json({ error: 'Failed to fetch schedules' }, { status: 500 });
  }

  // Include preset options for convenience
  return NextResponse.json({
    schedules: data || [],
    presets: CRON_PRESETS,
  });
}

// POST - Create new scheduled export
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check entitlement for scheduled exports
  const entitlementCheck = await checkEntitlement(supabase, user.id, {
    requireScheduledExports: true,
  });
  if (!entitlementCheck.allowed) {
    return NextResponse.json(
      createEntitlementErrorResponse(entitlementCheck),
      { status: entitlementCheck.status || 403 }
    );
  }

  const entitlement = entitlementCheck.entitlement!;
  const maxSchedules = entitlement.scheduledExportsLimit;

  // Count existing schedules
  const { count } = await supabase
    .from('scheduled_exports')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);

  if ((count || 0) >= maxSchedules) {
    return NextResponse.json(
      {
        error: `Maximum ${maxSchedules} scheduled exports allowed on ${entitlement.tier} plan`,
        code: 'SCHEDULE_LIMIT_REACHED',
        current_count: count,
        limit: maxSchedules,
        upgrade_url: '/pricing',
      },
      { status: 402 }
    );
  }

  // Parse request body
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const {
    recipe_id,
    name,
    cron_expression,
    cron_preset,
    timezone = 'UTC',
    delivery_method = 'email',
    delivery_config = {},
  } = body;

  // Validate required fields
  if (!recipe_id) {
    return NextResponse.json({ error: 'recipe_id is required' }, { status: 400 });
  }

  if (!name || typeof name !== 'string' || name.length < 1 || name.length > 100) {
    return NextResponse.json({ error: 'name must be 1-100 characters' }, { status: 400 });
  }

  // Resolve cron expression from preset or validate custom
  let resolvedCron = cron_expression;
  if (cron_preset && CRON_PRESETS[cron_preset]) {
    resolvedCron = CRON_PRESETS[cron_preset];
  }

  if (!resolvedCron || !isValidCronExpression(resolvedCron)) {
    return NextResponse.json(
      {
        error: 'Invalid cron expression',
        valid_presets: Object.keys(CRON_PRESETS),
        example: '0 9 * * *',
      },
      { status: 400 }
    );
  }

  // Validate recipe exists and belongs to user
  const { data: recipe } = await supabase
    .from('report_recipes')
    .select('id')
    .eq('id', recipe_id)
    .eq('user_id', user.id)
    .single();

  if (!recipe) {
    return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
  }

  // Validate delivery method
  const validDeliveryMethods = ['email', 'webhook'];
  if (!validDeliveryMethods.includes(delivery_method)) {
    return NextResponse.json(
      { error: `Invalid delivery_method. Must be one of: ${validDeliveryMethods.join(', ')}` },
      { status: 400 }
    );
  }

  // Validate delivery config
  if (delivery_method === 'email') {
    const email = delivery_config.email || user.email;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email address required for email delivery' }, { status: 400 });
    }
    delivery_config.email = email;
  } else if (delivery_method === 'webhook') {
    if (!delivery_config.url || !delivery_config.url.startsWith('https://')) {
      return NextResponse.json({ error: 'Valid HTTPS webhook URL required' }, { status: 400 });
    }
  }

  // Calculate next run time
  const nextRunAt = getNextRunTime(resolvedCron, timezone);

  // Create the schedule
  const { data, error } = await supabase
    .from('scheduled_exports')
    .insert({
      user_id: user.id,
      recipe_id,
      name,
      cron_expression: resolvedCron,
      timezone,
      delivery_method,
      delivery_config,
      is_active: true,
      next_run_at: nextRunAt.toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating schedule:', error);
    return NextResponse.json({ error: 'Failed to create schedule' }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

// DELETE - Delete a scheduled export
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const scheduleId = searchParams.get('id');

  if (!scheduleId) {
    return NextResponse.json({ error: 'Schedule ID required' }, { status: 400 });
  }

  const { error } = await supabase
    .from('scheduled_exports')
    .delete()
    .eq('id', scheduleId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error deleting schedule:', error);
    return NextResponse.json({ error: 'Failed to delete schedule' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// PATCH - Update a scheduled export (toggle active, update settings)
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { id, is_active, name, cron_expression, cron_preset, delivery_config } = body;

  if (!id) {
    return NextResponse.json({ error: 'Schedule ID required' }, { status: 400 });
  }

  // Build update object
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (typeof is_active === 'boolean') {
    updates.is_active = is_active;
  }

  if (name && typeof name === 'string') {
    updates.name = name;
  }

  if (cron_expression || cron_preset) {
    let resolvedCron = cron_expression;
    if (cron_preset && CRON_PRESETS[cron_preset]) {
      resolvedCron = CRON_PRESETS[cron_preset];
    }

    if (resolvedCron && isValidCronExpression(resolvedCron)) {
      updates.cron_expression = resolvedCron;
      updates.next_run_at = getNextRunTime(resolvedCron).toISOString();
    }
  }

  if (delivery_config && typeof delivery_config === 'object') {
    updates.delivery_config = delivery_config;
  }

  const { data, error } = await supabase
    .from('scheduled_exports')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating schedule:', error);
    return NextResponse.json({ error: 'Failed to update schedule' }, { status: 500 });
  }

  return NextResponse.json(data);
}
