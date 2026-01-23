/**
 * Recipe Execution API
 *
 * Executes RecipeV1 and returns Excel file or JSON preview
 *
 * POST /api/v1/report/execute
 *
 * Request body:
 * {
 *   recipe: RecipeV1,
 *   format?: 'excel' | 'json'  // Default: 'excel'
 * }
 *
 * Response:
 * - format=excel: Excel file download
 * - format=json: Execution result as JSON (for preview)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { decryptApiKey } from '@/lib/encryption';
import { validateRecipe, checkPlanCompatibility } from '@/lib/recipe/validation';
import { executeRecipe, type ExecutionContext } from '@/lib/recipe/executor';
import { generateWorkbook } from '@/lib/recipe/generator';
import type { RecipeV1 } from '@/lib/recipe/types';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request
    const body = await request.json();
    const { recipe, format = 'excel' } = body as {
      recipe: RecipeV1;
      format?: 'excel' | 'json';
    };

    if (!recipe) {
      return NextResponse.json(
        { error: 'Recipe is required' },
        { status: 400 }
      );
    }

    // Validate recipe
    const validation = validateRecipe(recipe);
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'Invalid recipe',
          validationErrors: validation.errors,
          validationWarnings: validation.warnings,
        },
        { status: 400 }
      );
    }

    // Check user's plan
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single();

    const userPlan = (profile?.plan || 'free') as 'free' | 'pro' | 'premium';

    // Check plan compatibility
    const planCheck = checkPlanCompatibility(recipe, userPlan);
    if (!planCheck.compatible) {
      return NextResponse.json(
        {
          error: 'Recipe requires higher plan',
          requiredPlan: planCheck.requiredPlan,
          reason: planCheck.reason,
        },
        { status: 403 }
      );
    }

    // Get user's API keys
    const { data: keys } = await supabase
      .from('provider_keys')
      .select('provider, encrypted_key, is_valid')
      .eq('user_id', user.id)
      .eq('is_valid', true);

    const userKeys: Record<string, string> = {};
    if (keys) {
      for (const key of keys) {
        try {
          userKeys[key.provider] = decryptApiKey(key.encrypted_key);
        } catch (err) {
          console.error(`Failed to decrypt key for ${key.provider}:`, err);
        }
      }
    }

    // Create execution context
    const context: ExecutionContext = {
      userId: user.id,
      userKeys,
      plan: userPlan,
    };

    // Execute recipe
    const executionResult = await executeRecipe(recipe, context);

    // Log usage event
    await supabase.from('usage_events').insert({
      user_id: user.id,
      event_type: 'recipe_execution',
      metadata: {
        recipeId: recipe.id,
        recipeName: recipe.name,
        datasetsExecuted: executionResult.metadata.datasetsExecuted,
        totalRows: executionResult.metadata.totalRows,
        executionTimeMs: executionResult.metadata.executionTimeMs,
        success: executionResult.success,
        format,
      },
    });

    // Return based on format
    if (format === 'json') {
      // Return JSON for preview
      return NextResponse.json({
        success: executionResult.success,
        datasets: executionResult.datasets,
        errors: executionResult.errors,
        warnings: executionResult.warnings,
        metadata: executionResult.metadata,
        validationWarnings: validation.warnings,
      });
    } else {
      // Generate Excel workbook
      const buffer = await generateWorkbook(recipe, executionResult);

      // Return as file download
      const filename = `${recipe.name.replace(/[^a-z0-9]/gi, '-')}-CRK-Pack.xlsx`;

      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          'Content-Type':
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': buffer.length.toString(),
        },
      });
    }
  } catch (err) {
    console.error('Error in POST /api/v1/report/execute:', err);
    return NextResponse.json(
      {
        error: 'Execution failed',
        details: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
