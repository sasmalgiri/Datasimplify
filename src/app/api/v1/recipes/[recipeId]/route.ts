/**
 * Individual Recipe API
 *
 * GET /api/v1/recipes/[recipeId] - Get specific recipe
 * PUT /api/v1/recipes/[recipeId] - Update recipe
 * DELETE /api/v1/recipes/[recipeId] - Delete recipe
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateRecipe } from '@/lib/recipe/validation';
import type { RecipeV1, SavedRecipe } from '@/lib/recipe/types';

// GET - Get specific recipe
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ recipeId: string }> }
) {
  try {
    const { recipeId } = await context.params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('report_recipes')
      .select('*')
      .eq('id', recipeId)
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Recipe not found' },
        { status: 404 }
      );
    }

    const recipe: SavedRecipe = {
      id: data.id,
      userId: data.user_id,
      recipe: data.recipe_json as RecipeV1,
      isDefault: data.is_default || false,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return NextResponse.json({ recipe });
  } catch (err) {
    console.error('Error in GET /api/v1/recipes/[recipeId]:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update recipe
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ recipeId: string }> }
) {
  try {
    const { recipeId } = await context.params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { recipe, isDefault } = body as {
      recipe: RecipeV1;
      isDefault?: boolean;
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

    // If setting as default, unset other defaults first
    if (isDefault) {
      await supabase
        .from('report_recipes')
        .update({ is_default: false })
        .eq('user_id', user.id)
        .neq('id', recipeId);
    }

    // Update recipe
    const { data, error } = await supabase
      .from('report_recipes')
      .update({
        name: recipe.name,
        recipe_json: recipe,
        is_default: isDefault !== undefined ? isDefault : undefined,
        updated_at: new Date().toISOString(),
      })
      .eq('id', recipeId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error || !data) {
      console.error('Error updating recipe:', error);
      return NextResponse.json(
        { error: 'Failed to update recipe' },
        { status: 500 }
      );
    }

    const updatedRecipe: SavedRecipe = {
      id: data.id,
      userId: data.user_id,
      recipe: data.recipe_json as RecipeV1,
      isDefault: data.is_default || false,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return NextResponse.json({ recipe: updatedRecipe, validation });
  } catch (err) {
    console.error('Error in PUT /api/v1/recipes/[recipeId]:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete recipe
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ recipeId: string }> }
) {
  try {
    const { recipeId } = await context.params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabase
      .from('report_recipes')
      .delete()
      .eq('id', recipeId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting recipe:', error);
      return NextResponse.json(
        { error: 'Failed to delete recipe' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error in DELETE /api/v1/recipes/[recipeId]:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
