export interface BlogTable {
  headers: string[];
  rows: string[][];
}

export interface BlogSection {
  id: string;
  heading: string;
  body: string[];
  bullets?: string[];
  note?: string;
  table?: BlogTable;
}

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  keywords: string[];
  publishDate: string;
  updatedDate?: string;
  author: string;
  category: string;
  readingTimeMinutes: number;
  coverEmoji: string;
  excerpt: string;
  sections: BlogSection[];
  relatedPosts?: string[];
  ctaHref: string;
  ctaLabel: string;
}

const POSTS: BlogPost[] = [
  {
    slug: 'crypto-fear-greed-index-explained',
    title: 'Crypto Fear and Greed Index Explained: What It Is and How to Use It',
    description:
      'What is the crypto Fear and Greed Index, how is it calculated from five data sources, how to read the 0–100 scale, and how traders use it to make better decisions.',
    keywords: [
      'crypto fear and greed index explained',
      'what is fear greed index',
      'bitcoin fear and greed index',
      'how to use fear and greed index',
      'crypto market sentiment indicator',
      'crypto sentiment analysis',
      'fear greed index trading strategy',
    ],
    publishDate: '2026-02-28',
    author: 'CryptoReportKit Team',
    category: 'Education',
    readingTimeMinutes: 7,
    coverEmoji: '\u{1F628}',
    excerpt:
      'The Fear and Greed Index is one of the most-watched sentiment indicators in crypto. Learn what it measures, how it\u2019s calculated from five data sources, and how traders use it to time entries and exits.',
    ctaHref: '/sentiment',
    ctaLabel: 'Track the Fear & Greed Index Live',
    relatedPosts: [],
    sections: [
      {
        id: 'what-is-fear-greed',
        heading: 'What Is the Crypto Fear and Greed Index?',
        body: [
          'The Crypto Fear and Greed Index is a single number between 0 and 100 that summarises the emotional state of the cryptocurrency market at any given moment. A score of 0 represents "Extreme Fear" while a score of 100 represents "Extreme Greed". It is published daily by Alternative.me and has become one of the most widely cited sentiment indicators in the industry.',
          'The concept is borrowed from the CNN Fear & Greed Index used in traditional stock markets. The logic is straightforward: when investors are fearful they sell \u2014 often below fair value. When they are greedy they buy \u2014 often above fair value. By measuring the prevailing emotion, the index helps you see whether the market is behaving rationally or emotionally.',
          'Legendary investor Warren Buffett famously advised investors to "be fearful when others are greedy, and greedy when others are fearful." The Fear and Greed Index turns that advice into a daily number you can actually track.',
        ],
      },
      {
        id: 'how-its-calculated',
        heading: 'How Is the Fear and Greed Index Calculated?',
        body: [
          'The index is a weighted composite of six data points, each measuring a different dimension of market sentiment. No single data source dominates \u2014 the blended approach makes the indicator more robust than any individual signal.',
        ],
        bullets: [
          'Volatility (25%) \u2014 Compares current Bitcoin price volatility and maximum drawdowns to 30-day and 90-day averages. Unusually high volatility is treated as a sign of a fearful market.',
          'Market Momentum / Volume (25%) \u2014 Compares current trading volume and market momentum to 30-day and 90-day averages. Strong buying volume in a rising market signals greed.',
          'Social Media (15%) \u2014 Analyses the rate of engagement and sentiment in crypto-related hashtags and posts, primarily on X (formerly Twitter). A surge in positive chatter correlates with greed.',
          'Surveys (15%) \u2014 Weekly online polls ask participants directly about their market outlook. This component is sometimes paused by Alternative.me.',
          'Bitcoin Dominance (10%) \u2014 Tracks Bitcoin\'s share of the total crypto market cap. Rising BTC dominance often signals fear as investors rotate out of riskier altcoins into Bitcoin.',
          'Google Trends (10%) \u2014 Monitors search volume for crypto-related terms such as "Bitcoin price manipulation". A spike in fearful search queries indicates growing concern.',
        ],
        note: 'Alternative.me adjusts the component weights occasionally. The percentages above reflect the most commonly published weightings as of early 2026.',
      },
      {
        id: 'how-to-read',
        heading: 'How to Read the Fear and Greed Index',
        body: [
          'The index uses four zones. Each zone has a distinct meaning and historically correlates with different market conditions.',
        ],
        table: {
          headers: ['Score', 'Zone', 'Market Condition', 'Historical Pattern'],
          rows: [
            [
              '0 \u2013 25',
              'Extreme Fear',
              'Panic selling, maximum pessimism',
              'Often coincides with market bottoms or deep corrections',
            ],
            [
              '25 \u2013 50',
              'Fear',
              'Cautious sentiment, bearish bias',
              'Common during downtrends or uncertain macro periods',
            ],
            [
              '50 \u2013 75',
              'Greed',
              'Optimistic sentiment, bullish bias',
              'Common during uptrends and bull market rallies',
            ],
            [
              '75 \u2013 100',
              'Extreme Greed',
              'FOMO buying, overconfidence',
              'Often coincides with market tops or exhaustion points',
            ],
          ],
        },
        note: 'A score in the Extreme Greed zone does not mean a crash is imminent. Markets can remain in Extreme Greed for weeks during strong bull cycles. Use the index as one input among many, not as a standalone signal.',
      },
      {
        id: 'trading-strategy',
        heading: 'How Traders Use the Fear and Greed Index',
        body: [
          'Experienced traders use the index as a contrarian indicator \u2014 a tool that tells them when the crowd is most likely to be wrong. The general approach is to look for confirmation: does the index reading match what price action, volume, and on-chain data are also suggesting?',
          'Dollar-cost averagers (DCA) often increase their regular buy amounts when the index enters Extreme Fear territory, on the basis that they are buying at a relative discount. Conversely, some traders reduce position size or take profits when Extreme Greed persists.',
          'The index is most powerful when compared to its own history. A reading of 75 means little in isolation; a reading that has moved from 20 to 75 over four weeks tells a story about the speed of sentiment recovery.',
        ],
        bullets: [
          'Do not use it in isolation \u2014 confirm with price structure and volume.',
          'Extreme readings are more actionable than middle-range readings.',
          'Track the direction of change, not just the current number.',
          'The index reflects Bitcoin-centric sentiment; it may lag during altcoin-led moves.',
          'Longer extreme periods (7+ days) carry more weight than single-day spikes.',
        ],
        note: 'Nothing in this article constitutes investment advice. The Fear and Greed Index is an educational tool. Always do your own research.',
      },
      {
        id: 'track-live',
        heading: 'Track the Fear & Greed Index on CryptoReportKit',
        body: [
          'CryptoReportKit\'s Sentiment Dashboard displays the live Fear and Greed Index value alongside a 30-day historical chart so you can spot trend shifts at a glance. The Command Center also surfaces the index in its Market Pulse Bar, giving you instant context alongside BTC price, market cap, and dominance.',
          'You can also export the data to Excel for deeper analysis using our Excel add-in with 83+ built-in crypto formulas.',
        ],
      },
    ],
  },
];

export function getAllPosts(): BlogPost[] {
  return POSTS.sort(
    (a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime(),
  );
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return POSTS.find((p) => p.slug === slug);
}

export function getAllSlugs(): string[] {
  return POSTS.map((p) => p.slug);
}
