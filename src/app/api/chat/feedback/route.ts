import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * POST /api/chat/feedback
 * Submit feedback for a RAG query response
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { queryId, wasHelpful, feedbackText, userId } = body;

    // Validate required fields
    if (typeof wasHelpful !== 'boolean') {
      return NextResponse.json(
        { error: 'wasHelpful (boolean) is required' },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured || !supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    // If queryId provided, update specific query
    if (queryId) {
      const { error } = await supabase
        .from('rag_query_history')
        .update({
          was_helpful: wasHelpful,
          feedback_text: feedbackText || null,
        })
        .eq('id', queryId);

      if (error) {
        console.error('Failed to update feedback:', error);
        return NextResponse.json(
          { error: 'Failed to save feedback' },
          { status: 500 }
        );
      }
    } else if (userId) {
      // Update most recent query for user
      const { error } = await supabase
        .from('rag_query_history')
        .update({
          was_helpful: wasHelpful,
          feedback_text: feedbackText || null,
        })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Failed to update feedback:', error);
        return NextResponse.json(
          { error: 'Failed to save feedback' },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Either queryId or userId is required' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Feedback recorded. Thank you!',
    });
  } catch (error) {
    console.error('Feedback API error:', error);
    return NextResponse.json(
      { error: 'Failed to process feedback' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/chat/feedback/stats
 * Get feedback statistics (admin)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7', 10);

    if (!isSupabaseConfigured || !supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Get feedback stats
    const { data, error } = await supabase
      .from('rag_query_history')
      .select('was_helpful, query_type, user_level, confidence')
      .gte('created_at', cutoffDate.toISOString())
      .not('was_helpful', 'is', null);

    if (error) {
      console.error('Failed to fetch feedback stats:', error);
      return NextResponse.json(
        { error: 'Failed to fetch stats' },
        { status: 500 }
      );
    }

    // Calculate stats
    const total = data.length;
    const helpful = data.filter(d => d.was_helpful).length;
    const notHelpful = total - helpful;
    const helpfulRate = total > 0 ? ((helpful / total) * 100).toFixed(1) : '0.0';

    // By query type
    const byQueryType: Record<string, { helpful: number; total: number }> = {};
    for (const item of data) {
      const type = item.query_type || 'general';
      if (!byQueryType[type]) byQueryType[type] = { helpful: 0, total: 0 };
      byQueryType[type].total++;
      if (item.was_helpful) byQueryType[type].helpful++;
    }

    // By user level
    const byUserLevel: Record<string, { helpful: number; total: number }> = {};
    for (const item of data) {
      const level = item.user_level || 'intermediate';
      if (!byUserLevel[level]) byUserLevel[level] = { helpful: 0, total: 0 };
      byUserLevel[level].total++;
      if (item.was_helpful) byUserLevel[level].helpful++;
    }

    // By confidence
    const byConfidence: Record<string, { helpful: number; total: number }> = {};
    for (const item of data) {
      const conf = item.confidence || 'medium';
      if (!byConfidence[conf]) byConfidence[conf] = { helpful: 0, total: 0 };
      byConfidence[conf].total++;
      if (item.was_helpful) byConfidence[conf].helpful++;
    }

    return NextResponse.json({
      success: true,
      data: {
        period: `Last ${days} days`,
        total,
        helpful,
        notHelpful,
        helpfulRate: `${helpfulRate}%`,
        byQueryType,
        byUserLevel,
        byConfidence,
      },
    });
  } catch (error) {
    console.error('Feedback stats API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
