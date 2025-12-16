// ============================================
// RAG SERVICE
// Retrieval Augmented Generation for DataSimplify
// ============================================
// This is the core AI system that:
// 1. Chunks and embeds all data
// 2. Stores in Supabase with vectors
// 3. Retrieves relevant context for queries
// 4. Generates intelligent responses

import { supabaseAdmin, isSupabaseConfigured } from './supabase';
import { 
  generateEmbedding, 
  generateEmbeddings,
  analyzeSentimentAI,
  summarizeContent,
  processRAGQuery,
  chat,
  ChatMessage,
} from './ollamaAI';

// ============================================
// TYPES
// ============================================

export interface DataChunk {
  content: string;
  contentType: string;
  categoryPath: string;
  coinSymbol?: string;
  source: string;
  sourceUrl?: string;
  dataDate: Date;
  metadata?: Record<string, unknown>;
}

export interface StoredChunk extends DataChunk {
  id: string;
  embedding: number[];
  aiSentiment?: number;
  aiSentimentLabel?: string;
  aiSummary?: string;
  aiTopics?: string[];
  aiEntities?: string[];
}

export interface SearchResult {
  id: string;
  content: string;
  contentType: string;
  categoryPath: string;
  coinSymbol?: string;
  source: string;
  dataDate: string;
  aiSentiment?: number;
  aiSummary?: string;
  similarity: number;
}

export interface RAGResponse {
  answer: string;
  sources: SearchResult[];
  confidence: number;
  tokensUsed?: number;
}

// ============================================
// DATA CHUNKING
// ============================================

// Split long content into chunks for better embedding
export function chunkContent(
  content: string,
  maxChunkSize: number = 500,
  overlap: number = 50
): string[] {
  if (content.length <= maxChunkSize) {
    return [content];
  }

  const chunks: string[] = [];
  let start = 0;

  while (start < content.length) {
    let end = start + maxChunkSize;
    
    // Try to break at sentence boundary
    if (end < content.length) {
      const lastPeriod = content.lastIndexOf('.', end);
      const lastNewline = content.lastIndexOf('\n', end);
      const breakPoint = Math.max(lastPeriod, lastNewline);
      
      if (breakPoint > start + maxChunkSize / 2) {
        end = breakPoint + 1;
      }
    }

    chunks.push(content.slice(start, end).trim());
    start = end - overlap;
  }

  return chunks.filter(c => c.length > 0);
}

// Create document representation for embedding
export function createDocumentText(chunk: DataChunk): string {
  const parts = [
    `Category: ${chunk.categoryPath}`,
    chunk.coinSymbol ? `Coin: ${chunk.coinSymbol}` : '',
    `Source: ${chunk.source}`,
    `Date: ${chunk.dataDate.toISOString().split('T')[0]}`,
    '',
    chunk.content,
  ];
  
  return parts.filter(p => p).join('\n');
}

// ============================================
// DATA INGESTION
// ============================================

// Store a single chunk with embedding
export async function storeChunk(chunk: DataChunk): Promise<StoredChunk | null> {
  if (!isSupabaseConfigured || !supabaseAdmin) {
    throw new Error('Supabase not configured');
  }

  try {
    // Generate embedding
    const docText = createDocumentText(chunk);
    const { embedding } = await generateEmbedding(docText);

    // Analyze sentiment with AI
    const sentiment = await analyzeSentimentAI(chunk.content);

    // Get category ID
    const { data: category } = await supabaseAdmin
      .from('data_categories')
      .select('id')
      .eq('path', chunk.categoryPath)
      .single();

    // Store in database
    const { data, error } = await supabaseAdmin
      .from('document_chunks')
      .upsert({
        category_id: category?.id,
        category_path: chunk.categoryPath,
        content: chunk.content,
        content_type: chunk.contentType,
        coin_symbol: chunk.coinSymbol,
        source: chunk.source,
        source_url: chunk.sourceUrl,
        data_date: chunk.dataDate.toISOString().split('T')[0],
        data_timestamp: chunk.dataDate.toISOString(),
        embedding: `[${embedding.join(',')}]`,
        ai_sentiment: sentiment.score,
        ai_sentiment_label: sentiment.label,
        ai_topics: sentiment.topics,
        ai_entities: sentiment.entities,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id',
      })
      .select()
      .single();

    if (error) throw error;

    return {
      ...chunk,
      id: data.id,
      embedding,
      aiSentiment: sentiment.score,
      aiSentimentLabel: sentiment.label,
      aiTopics: sentiment.topics,
      aiEntities: sentiment.entities,
    };
  } catch (error) {
    console.error('Failed to store chunk:', error);
    return null;
  }
}

// Batch store multiple chunks
export async function storeChunks(chunks: DataChunk[]): Promise<{
  stored: number;
  failed: number;
}> {
  let stored = 0;
  let failed = 0;

  for (const chunk of chunks) {
    const result = await storeChunk(chunk);
    if (result) {
      stored++;
    } else {
      failed++;
    }
    
    // Rate limiting
    await new Promise(r => setTimeout(r, 100));
  }

  return { stored, failed };
}

// ============================================
// SEMANTIC SEARCH
// ============================================

export async function searchSimilar(
  query: string,
  options?: {
    limit?: number;
    categoryPath?: string;
    coinSymbol?: string;
    dateFrom?: Date;
    dateTo?: Date;
    minSimilarity?: number;
  }
): Promise<SearchResult[]> {
  if (!isSupabaseConfigured || !supabaseAdmin) {
    throw new Error('Supabase not configured');
  }

  try {
    // Generate query embedding
    const { embedding } = await generateEmbedding(query);

    // Call search function
    const { data, error } = await supabaseAdmin.rpc('search_similar_chunks', {
      query_embedding: `[${embedding.join(',')}]`,
      match_count: options?.limit || 10,
      category_filter: options?.categoryPath,
      coin_filter: options?.coinSymbol,
      date_from: options?.dateFrom?.toISOString().split('T')[0],
      date_to: options?.dateTo?.toISOString().split('T')[0],
      min_similarity: options?.minSimilarity || 0.5,
    });

    if (error) throw error;

    return (data || []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      content: row.content as string,
      contentType: row.content_type as string,
      categoryPath: row.category_path as string,
      coinSymbol: row.coin_symbol as string | undefined,
      source: row.source as string,
      dataDate: row.data_date as string,
      aiSentiment: row.ai_sentiment as number | undefined,
      aiSummary: row.ai_summary as string | undefined,
      similarity: row.similarity as number,
    }));
  } catch (error) {
    console.error('Search failed:', error);
    return [];
  }
}

// Hybrid search (semantic + keyword)
export async function hybridSearch(
  query: string,
  options?: {
    limit?: number;
    semanticWeight?: number;
  }
): Promise<SearchResult[]> {
  if (!isSupabaseConfigured || !supabaseAdmin) {
    throw new Error('Supabase not configured');
  }

  try {
    const { embedding } = await generateEmbedding(query);

    const { data, error } = await supabaseAdmin.rpc('hybrid_search', {
      query_embedding: `[${embedding.join(',')}]`,
      query_text: query,
      match_count: options?.limit || 10,
      semantic_weight: options?.semanticWeight || 0.7,
    });

    if (error) throw error;

    return (data || []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      content: row.content as string,
      contentType: '',
      categoryPath: row.category_path as string,
      coinSymbol: row.coin_symbol as string | undefined,
      source: '',
      dataDate: '',
      similarity: row.combined_score as number,
    }));
  } catch (error) {
    console.error('Hybrid search failed:', error);
    return [];
  }
}

// ============================================
// RAG QUERY
// ============================================

export async function ragQuery(
  query: string,
  options?: {
    conversationHistory?: ChatMessage[];
    categoryPath?: string;
    coinSymbol?: string;
    maxContext?: number;
  }
): Promise<RAGResponse> {
  try {
    // 1. Search for relevant context
    const searchResults = await searchSimilar(query, {
      limit: options?.maxContext || 10,
      categoryPath: options?.categoryPath,
      coinSymbol: options?.coinSymbol,
    });

    if (searchResults.length === 0) {
      // No relevant context found, answer from general knowledge
      const response = await chat(
        [{ role: 'user', content: query }],
        {
          systemPrompt: 'You are DataSimplify\'s AI assistant for crypto markets. Answer based on your knowledge, but note that you don\'t have access to real-time data for this query.',
        }
      );

      return {
        answer: response.content,
        sources: [],
        confidence: 0.3,
        tokensUsed: response.tokensUsed,
      };
    }

    // 2. Prepare context
    const contextTexts = searchResults.map(r => 
      `[${r.source} - ${r.dataDate}] ${r.content}`
    );

    // 3. Generate response with context
    const response = await processRAGQuery(
      query,
      contextTexts,
      options?.conversationHistory
    );

    // 4. Calculate confidence based on similarity scores
    const avgSimilarity = searchResults.reduce((sum, r) => sum + r.similarity, 0) / searchResults.length;
    const confidence = Math.min(0.95, avgSimilarity * 1.2);

    return {
      answer: response.content,
      sources: searchResults.slice(0, 5), // Return top 5 sources
      confidence,
      tokensUsed: response.tokensUsed,
    };
  } catch (error) {
    console.error('RAG query failed:', error);
    throw error;
  }
}

// ============================================
// SPECIALIZED QUERIES
// ============================================

// Get coin analysis
export async function getCoinAnalysis(symbol: string): Promise<{
  analysis: string;
  sentiment: { score: number; label: string };
  recentNews: SearchResult[];
  priceContext: SearchResult[];
}> {
  const [newsResults, priceResults] = await Promise.all([
    searchSimilar(`${symbol} news updates`, {
      coinSymbol: symbol,
      categoryPath: 'sentiment',
      limit: 5,
    }),
    searchSimilar(`${symbol} price movement analysis`, {
      coinSymbol: symbol,
      categoryPath: 'market',
      limit: 5,
    }),
  ]);

  const allContext = [...newsResults, ...priceResults];
  
  // Calculate aggregate sentiment
  const sentimentScores = allContext
    .filter(r => r.aiSentiment !== undefined)
    .map(r => r.aiSentiment!);
  
  const avgSentiment = sentimentScores.length > 0
    ? sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length
    : 0;

  let sentimentLabel = 'neutral';
  if (avgSentiment > 0.3) sentimentLabel = 'bullish';
  else if (avgSentiment > 0.6) sentimentLabel = 'very_bullish';
  else if (avgSentiment < -0.3) sentimentLabel = 'bearish';
  else if (avgSentiment < -0.6) sentimentLabel = 'very_bearish';

  // Generate analysis
  const contextText = allContext.map(r => r.content).join('\n\n');
  const { summary } = await summarizeContent(contextText);

  return {
    analysis: summary,
    sentiment: { score: avgSentiment, label: sentimentLabel },
    recentNews: newsResults,
    priceContext: priceResults,
  };
}

// Get market overview
export async function getMarketOverviewAI(): Promise<{
  summary: string;
  topTrends: string[];
  sentiment: { score: number; label: string };
}> {
  const results = await searchSimilar('crypto market overview trends sentiment', {
    limit: 15,
    categoryPath: 'market',
  });

  const contextText = results.map(r => r.content).join('\n\n');
  const { summary, keyPoints, sentiment: summarysentiment } = await summarizeContent(contextText);

  const sentimentScores = results
    .filter(r => r.aiSentiment !== undefined)
    .map(r => r.aiSentiment!);
  
  const avgSentiment = sentimentScores.length > 0
    ? sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length
    : 0;

  return {
    summary,
    topTrends: keyPoints,
    sentiment: { 
      score: avgSentiment, 
      label: summarysentiment || 'neutral',
    },
  };
}

// ============================================
// DATA INDEXING (Sync data to vector store)
// ============================================

export async function indexMarketData(data: Array<{
  symbol: string;
  name: string;
  price: number;
  priceChange24h: number;
  volume24h: number;
  marketCap: number;
}>): Promise<{ indexed: number }> {
  const chunks: DataChunk[] = data.map(coin => ({
    content: `${coin.name} (${coin.symbol}) is currently trading at $${coin.price.toLocaleString()} with a ${coin.priceChange24h > 0 ? '+' : ''}${coin.priceChange24h.toFixed(2)}% change in 24 hours. 24h trading volume is $${(coin.volume24h / 1e6).toFixed(2)}M and market cap is $${(coin.marketCap / 1e9).toFixed(2)}B.`,
    contentType: 'market_summary',
    categoryPath: `market/${coin.symbol.toLowerCase()}`,
    coinSymbol: coin.symbol,
    source: 'binance',
    dataDate: new Date(),
  }));

  const result = await storeChunks(chunks);
  return { indexed: result.stored };
}

export async function indexSentimentPosts(posts: Array<{
  id: string;
  source: string;
  platform: string;
  title: string;
  content: string;
  coins: string[];
  timestamp: string;
}>): Promise<{ indexed: number }> {
  const chunks: DataChunk[] = posts.map(post => ({
    content: `${post.title}\n${post.content}`,
    contentType: 'social_post',
    categoryPath: `sentiment/${post.source}`,
    coinSymbol: post.coins[0], // Primary coin
    source: post.platform,
    dataDate: new Date(post.timestamp),
    metadata: { originalId: post.id, allCoins: post.coins },
  }));

  const result = await storeChunks(chunks);
  return { indexed: result.stored };
}

export async function indexWhaleTransactions(transactions: Array<{
  hash: string;
  blockchain: string;
  amount: number;
  amountUsd: number;
  type: string;
  timestamp: string;
}>): Promise<{ indexed: number }> {
  const chunks: DataChunk[] = transactions.map(tx => ({
    content: `Large ${tx.blockchain} transaction: ${tx.amount.toFixed(4)} ${tx.blockchain === 'ethereum' ? 'ETH' : 'BTC'} ($${tx.amountUsd.toLocaleString()}) - Type: ${tx.type}. This ${tx.type === 'exchange_inflow' ? 'may indicate selling pressure' : tx.type === 'exchange_outflow' ? 'suggests accumulation' : 'is a whale movement'}.`,
    contentType: 'whale_transaction',
    categoryPath: 'onchain/whales',
    coinSymbol: tx.blockchain === 'ethereum' ? 'ETH' : 'BTC',
    source: 'blockchain',
    dataDate: new Date(tx.timestamp),
    metadata: { txHash: tx.hash },
  }));

  const result = await storeChunks(chunks);
  return { indexed: result.stored };
}

// ============================================
// DAILY SUMMARY GENERATION
// ============================================

export async function generateDailySummary(
  date: Date,
  categoryPath: string,
  coinSymbol?: string
): Promise<void> {
  if (!isSupabaseConfigured || !supabaseAdmin) {
    throw new Error('Supabase not configured');
  }

  // Get all chunks for this date and category
  const { data: chunks } = await supabaseAdmin
    .from('document_chunks')
    .select('content, ai_sentiment')
    .eq('data_date', date.toISOString().split('T')[0])
    .like('category_path', `${categoryPath}%`)
    .eq('coin_symbol', coinSymbol || null);

  if (!chunks || chunks.length === 0) return;

  // Combine content and summarize
  const combinedContent = chunks.map(c => c.content).join('\n\n');
  const { summary, keyPoints, sentiment } = await summarizeContent(combinedContent);

  // Generate embedding for summary
  const { embedding } = await generateEmbedding(summary);

  // Calculate average sentiment
  const sentiments = chunks
    .filter(c => c.ai_sentiment !== null)
    .map(c => c.ai_sentiment);
  const avgSentiment = sentiments.length > 0
    ? sentiments.reduce((a, b) => a + b, 0) / sentiments.length
    : 0;

  // Store summary
  await supabaseAdmin
    .from('daily_summaries')
    .upsert({
      summary_date: date.toISOString().split('T')[0],
      category_path: categoryPath,
      coin_symbol: coinSymbol,
      title: `${categoryPath} Summary - ${date.toISOString().split('T')[0]}`,
      summary,
      key_points: keyPoints,
      embedding: `[${embedding.join(',')}]`,
      ai_sentiment: avgSentiment,
      ai_sentiment_label: sentiment,
      ai_outlook: sentiment,
    }, {
      onConflict: 'summary_date,category_path,coin_symbol',
    });
}
