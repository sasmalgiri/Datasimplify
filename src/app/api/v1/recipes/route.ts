/**
 * Recipes API - List and Create
 *
 * GET /api/v1/recipes - List user's recipes
 * POST /api/v1/recipes - Create new recipe
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateRecipe } from '@/lib/recipe/validation';
import type { RecipeV1, SavedRecipe } from '@/lib/recipe/types';

// GET - List user's recipes
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's recipes from database
    const { data, error } = await supabase
      .from('report_recipes')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching recipes:', error);
      return NextResponse.json(
        { error: 'Failed to fetch recipes' },
        { status: 500 }
      );
    }

    // Transform database rows to SavedRecipe format
    const recipes: SavedRecipe[] = (data || []).map((row) => ({
      id: row.id,
      userId: row.user_id,
      recipe: row.recipe_json as RecipeV1,
      isDefault: row.is_default || false,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return NextResponse.json({ recipes });
  } catch (err) {
    console.error('Error in GET /api/v1/recipes:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new recipe
export async function POST(request: NextRequest) {
  try {
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
        .eq('user_id', user.id);
    }

    // Insert recipe
    const { data, error } = await supabase
      .from('report_recipes')
      .insert({
        user_id: user.id,
        name: recipe.name,
        recipe_json: recipe,
        is_default: isDefault || false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving recipe:', error);
      return NextResponse.json(
        { error: 'Failed to save recipe' },
        { status: 500 }
      );
    }

    const savedRecipe: SavedRecipe = {
      id: data.id,
      userId: data.user_id,
      recipe: data.recipe_json as RecipeV1,
      isDefault: data.is_default || false,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return NextResponse.json(
      { recipe: savedRecipe, validation },
      { status: 201 }
    );
  } catch (err) {
    console.error('Error in POST /api/v1/recipes:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
