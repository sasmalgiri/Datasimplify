/**
 * One-time endpoint to seed replies on all existing forum threads.
 * Admin-only. Call once, then delete this file.
 */

import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/* ------------------------------------------------------------------ */
/*  Pre-written replies per category (faster than AI for bulk)         */
/* ------------------------------------------------------------------ */

const REPLY_POOL: Record<string, string[]> = {
  'market-analysis': [
    'Great analysis. I\'m watching the same levels. The volume profile around $64K shows strong support — lots of transactions happened there historically. If we lose that, $58K is next.',
    'One thing to add — the funding rates on perpetual futures are deeply negative right now. That usually means the market is overly bearish and a short squeeze could happen. I\'m positioning accordingly.',
    'I agree with the technical picture, but the macro backdrop is what concerns me most. Until the tariff situation stabilizes, risk assets will stay under pressure. Keep some dry powder.',
    'Looking at the weekly chart, the 50-week SMA has been tested and held. Every time that happened in 2023-2024, we got a 20%+ bounce within 3 weeks. History doesn\'t repeat but it rhymes.',
    'On-chain data is interesting here. The MVRV Z-Score is back in the accumulation zone. Long-term holders are buying, not selling. This is exactly what bottoms look like historically.',
    'Has anyone noticed the divergence between spot and derivatives? Spot volume is picking up while perps are declining. That\'s usually a sign of organic buying coming in.',
    'I think everyone is overthinking this. Zoom out to the monthly chart — we\'re in a bull market that had a healthy correction. These happen in every cycle. The trend is still up.',
    'The CME gap at $65.2K was just filled. Historically, 90%+ of CME gaps get filled. Now we can focus on the upside targets without that hanging over us.',
    'My DCA plan: buy $500 at $62K, $500 at $58K, $500 at $55K. If none of those hit, I\'ll buy at market. Either way, I\'m accumulating at these levels.',
    'Bitcoin dominance is climbing while altcoins bleed. Classic risk-off behavior in crypto. I\'m not touching alts until BTC dominance peaks and starts declining.',
  ],
  'trading-strategies': [
    'I\'ve been backtesting a similar setup and can confirm — confluence of 3+ indicators outperforms any single indicator strategy by a huge margin. The key is patience.',
    'Question: what timeframe do you find this works best on? I\'ve been using 4H but wondering if daily gives better signals with less noise.',
    'For position sizing, I use the 1% rule religiously. Never risk more than 1% of my portfolio on a single trade. It means smaller gains but also means I survive the inevitable losing streaks.',
    'I added the VWAP to my confluence strategy and it\'s been a game changer. Institutional traders use VWAP heavily, so when price is at VWAP + your other confluence levels, the signal is much stronger.',
    'Stop-loss placement is where most people mess up. Don\'t put it at round numbers or obvious levels — everyone does that and market makers hunt those stops. Add a small buffer.',
    'The DataLab backtester is underrated. I tested 15 different strategies last weekend and found that simple strategies consistently outperform complex ones. Keep it simple.',
    'One tip for everyone: journal every trade. Not just entry/exit, but your emotional state and reasoning. After 50 trades, patterns in your mistakes become crystal clear.',
    'Has anyone tried the mean reversion strategy during high volatility events? I find it works great in ranging markets but gets destroyed during trend days.',
    'I switched from scalping to swing trading last month and my stress levels dropped 90%. Plus my win rate actually improved because I\'m not fighting the noise on lower timeframes.',
    'Pro tip: look at the higher timeframe first to establish bias, then drop to your execution timeframe for entry. Top-down analysis is crucial.',
  ],
  'defi-yield': [
    'One thing I always check before depositing: how long has the protocol been live? Anything under 6 months is too risky for me regardless of the APY.',
    'The real yield vs emission yield distinction is so important. If the yield comes from actual protocol revenue (trading fees, interest), it\'s sustainable. If it comes from token printing, you\'re the exit liquidity.',
    'I\'ve been using Pendle for fixed-rate yields and it\'s been fantastic. Locked in 7.2% on USDC for 6 months. No impermanent loss, no token emissions, just clean yield.',
    'Liquid staking is the safest yield play in crypto right now. You earn staking rewards while keeping your ETH liquid. No smart contract risk beyond the LST protocol itself.',
    'Hot take: most yield farming is not worth the gas costs, smart contract risk, and complexity. Just staking ETH or providing liquidity on major pairs gives you 90% of the benefit with 10% of the risk.',
    'Tip for new DeFi users: start with Aave on Ethereum mainnet. It\'s the most battle-tested protocol with the strongest security track record. Learn the basics there before exploring exotic yields.',
    'I diversify across 4-5 protocols for yield. Never more than 20% in any single protocol. This saved me when one protocol had an exploit — I only lost 15% of my yield portfolio instead of everything.',
    'The new EigenLayer restaking ecosystem is interesting but the risk is hard to quantify. You\'re stacking smart contract risk on top of smart contract risk. Proceed with caution.',
    'For stablecoin yields, always check: (1) what backs the stablecoin, (2) can it depeg, (3) what\'s the protocol\'s insurance fund. These three questions can save you from the next Terra/Luna.',
  ],
  'security-scams': [
    'Essential security checklist:\n- Hardware wallet for long-term holdings\n- Separate "hot" wallet for DeFi\n- Never share screen during wallet interactions\n- Use a VPN on public WiFi\n- Enable 2FA on everything (use an authenticator app, NOT SMS)',
    'I got hit by an approval phishing attack last year. Lost $2,000 in USDC. The transaction looked completely normal — it was a token "airdrop" that had an approval request hidden in it. Always check what you\'re signing.',
    'revoke.cash should be bookmarked by everyone. Check your token approvals monthly and revoke any that you don\'t actively need. Old approvals are ticking time bombs.',
    'The best security investment you can make: a $70 Ledger Nano S Plus. It pays for itself the first time it prevents you from signing a malicious transaction.',
    'Seed phrase storage tip: write it on metal (not paper — paper can burn/water damage). Store in a fireproof safe. Never take a photo of it. Never type it digitally.',
    'Social engineering is the #1 threat in crypto, not technical exploits. No legit project will ever DM you first. No support team will ask for your seed phrase. No airdrop requires you to "connect wallet and claim."',
    'I use a completely separate browser profile for DeFi. No extensions (besides the wallet), no saved passwords, no cookies. This prevents clipboard hijacking and browser-based attacks.',
    'If something seems too good to be true in crypto, it is. 100% guaranteed returns? Scam. Double your BTC? Scam. New token with 10,000% APY? Almost certainly a rug pull.',
  ],
  'education': [
    'Great explanation! For anyone confused about candlesticks, the single most useful pattern to learn first is the "engulfing candle." A bullish engulfing at support is one of the highest probability signals.',
    'Adding to this: one thing that helped me as a beginner was paper trading for 3 months before using real money. You learn so much about your psychology without risking actual funds.',
    'The concept of market cycles is crucial. Most people buy during the "euphoria" phase and sell during the "despair" phase — the exact opposite of what you should do. Understanding where we are in the cycle changes everything.',
    'For complete beginners, I recommend this learning order:\n1. What is Bitcoin and why it matters\n2. How to buy safely (KYC exchange)\n3. How to self-custody (hardware wallet)\n4. Basic chart reading\n5. DCA strategy\n\nDon\'t skip step 3!',
    'The biggest mistake I see beginners make is overcomplicating things. You don\'t need 10 indicators on your chart. Start with just price action and volume. Add ONE indicator (like RSI) after you\'re comfortable.',
    'Understanding market cap is more important than understanding price. A $0.001 coin isn\'t "cheap" if it has 100 billion tokens. Always look at market cap, not unit price.',
    'One thing school doesn\'t teach you: financial literacy. Learning about crypto has taught me more about money, markets, and economics than 16 years of formal education. Keep learning!',
    'Tip: follow the CryptoReportKit blog for educational content. The articles on Fear & Greed Index and confluence strategies are really well written and beginner-friendly.',
    'Don\'t be afraid to ask "dumb" questions. I\'ve been in crypto 5 years and I still learn new things every week. The space moves so fast that no one knows everything.',
  ],
  'general': [
    'My top 3 picks for the next 2 years: BTC (obvious), SOL (best L1 for retail), and LINK (the oracle backbone of all DeFi). Not flashy but I think these outperform 90% of portfolios.',
    'I got into crypto during the 2021 bull run like most people. Got wrecked in 2022, learned my lessons, and came back smarter. The bear market taught me more than any course ever could.',
    'For news, I follow: @PeterSchiff (contrarian indicator lol), Lyn Alden (macro), Will Clemente (on-chain), and Bankless (DeFi). Avoid the "100x moonshot" accounts — they\'re mostly shills.',
    'Unpopular opinion: most altcoins will go to zero in the long run. Only a handful will survive each cycle. Focus on quality over quantity. 3-5 high conviction positions beat 30 random coins.',
    'I tell close family about crypto (my brother is also invested) but I keep it vague with coworkers. "I invest in technology" is my go-to answer. No need to deal with the stigma.',
    'The environmental argument against crypto is largely outdated. Bitcoin mining is now ~60% renewable energy, and proof-of-stake chains like Ethereum use negligible energy. The narrative hasn\'t caught up with reality.',
    'I think crypto adoption in developing countries is the real story that most Western media ignores. In Nigeria, Argentina, Turkey — people use crypto because their local currency is failing them. That\'s real utility.',
    'My dream crypto product: a simple portfolio tracker that works across every chain, connects to every DeFi protocol, auto-calculates taxes, and has a clean mobile UI. CryptoReportKit is getting close!',
    'Anyone else feel like this market correction is actually healthy? We went from $15K to $100K without a major pullback. A 40% correction is normal in crypto bull markets. Zoom out.',
    'Regulation is coming whether we like it or not. The question is whether it\'ll be good regulation (protecting consumers while allowing innovation) or bad regulation (killing innovation with compliance burden).',
  ],
};

/* ------------------------------------------------------------------ */
/*  Handler                                                            */
/* ------------------------------------------------------------------ */

export async function POST(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'supabaseAdmin not configured' }, { status: 503 });
  }

  // Simple auth check
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey || secret !== serviceKey.slice(0, 20)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get admin user
    const adminEmail = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(',')[0]?.trim().toLowerCase();
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
    const adminUser = authUsers?.users?.find((u) => u.email?.toLowerCase() === adminEmail);
    if (!adminUser) {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 500 });
    }

    // Get all threads
    const { data: threads, error: fetchError } = await (supabaseAdmin.from('forum_threads') as any)
      .select('id, category, title, reply_count')
      .order('created_at', { ascending: true });

    if (fetchError || !threads) {
      return NextResponse.json({ error: 'Failed to fetch threads' }, { status: 500 });
    }

    let totalReplies = 0;
    const details: { threadTitle: string; repliesAdded: number }[] = [];

    for (const thread of threads as any[]) {
      const pool = REPLY_POOL[thread.category];
      if (!pool || pool.length === 0) continue;

      // How many replies to add: 2-4 per thread
      const existingReplies = thread.reply_count || 0;
      const targetReplies = Math.max(0, Math.floor(Math.random() * 3) + 2 - existingReplies);
      if (targetReplies <= 0) {
        details.push({ threadTitle: thread.title, repliesAdded: 0 });
        continue;
      }

      // Pick random replies from pool (no duplicates)
      const shuffled = [...pool].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, targetReplies);

      let added = 0;
      for (let i = 0; i < selected.length; i++) {
        const replyDate = new Date(Date.now() - Math.floor(Math.random() * 48 * 60 * 60 * 1000)); // random time in last 48h

        const { error: replyError } = await (supabaseAdmin.from('forum_replies') as any)
          .insert({
            thread_id: thread.id,
            user_id: adminUser.id,
            body: selected[i],
            likes: Math.floor(Math.random() * 12),
            created_at: replyDate.toISOString(),
            updated_at: replyDate.toISOString(),
          });

        if (!replyError) added++;
      }

      totalReplies += added;
      details.push({ threadTitle: thread.title.substring(0, 60), repliesAdded: added });
    }

    return NextResponse.json({
      success: true,
      threadsProcessed: threads.length,
      totalRepliesAdded: totalReplies,
      details,
    });
  } catch (error) {
    console.error('Seed replies error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
