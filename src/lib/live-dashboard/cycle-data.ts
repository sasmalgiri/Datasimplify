// ─── BTC Halving Cycle Comparison Data ───
// Hardcoded historical BTC price data normalized to halving day price (100).
// Approximate monthly data points from ~3 months before halving to ~18 months after.

export interface CycleDataPoint {
  daysSinceHalving: number;
  normalizedPrice: number; // 100 = halving day price
}

export interface CycleDefinition {
  label: string;
  halvingDate: string; // ISO date
  bottomDate: string;
  bottomPrice: number;
  halvingPrice: number;
  color: string;
  data: CycleDataPoint[];
}

// ─── Halving Dates ───
export const HALVING_DATES = [
  '2012-11-28',
  '2016-07-09',
  '2020-05-11',
  '2024-04-19',
];

// ─── Cycle Definitions ───
// Prices normalized so halving day = 100.
// 2012 cycle: halving price ~$12.35, peaked ~$1,150 (~9,300% = ~9400 normalized)
// 2016 cycle: halving price ~$650, peaked ~$19,700 (~3,000% = ~3030 normalized)
// 2020 cycle: halving price ~$8,600, peaked ~$69,000 (~800% = ~802 normalized)
// 2024 cycle: halving price ~$63,800 (ongoing)

export const BTC_CYCLES: CycleDefinition[] = [
  // ─── 2012 Cycle ───
  {
    label: '2012 Cycle',
    halvingDate: '2012-11-28',
    bottomDate: '2011-11-18',
    bottomPrice: 2.01,
    halvingPrice: 12.35,
    color: '#f59e0b',
    data: [
      // ~3 months before halving
      { daysSinceHalving: -90, normalizedPrice: 82 },
      { daysSinceHalving: -75, normalizedPrice: 85 },
      { daysSinceHalving: -60, normalizedPrice: 88 },
      { daysSinceHalving: -45, normalizedPrice: 90 },
      { daysSinceHalving: -30, normalizedPrice: 89 },
      { daysSinceHalving: -15, normalizedPrice: 93 },
      { daysSinceHalving: 0, normalizedPrice: 100 },
      // Post-halving ramp-up
      { daysSinceHalving: 15, normalizedPrice: 108 },
      { daysSinceHalving: 30, normalizedPrice: 110 },
      { daysSinceHalving: 60, normalizedPrice: 130 },
      { daysSinceHalving: 90, normalizedPrice: 220 },
      { daysSinceHalving: 120, normalizedPrice: 370 },
      { daysSinceHalving: 150, normalizedPrice: 900 },
      { daysSinceHalving: 180, normalizedPrice: 1050 },
      { daysSinceHalving: 210, normalizedPrice: 850 },
      { daysSinceHalving: 240, normalizedPrice: 920 },
      { daysSinceHalving: 270, normalizedPrice: 1000 },
      { daysSinceHalving: 300, normalizedPrice: 1100 },
      { daysSinceHalving: 330, normalizedPrice: 1050 },
      { daysSinceHalving: 360, normalizedPrice: 7500 },
      { daysSinceHalving: 390, normalizedPrice: 9300 },
      { daysSinceHalving: 420, normalizedPrice: 5700 },
      { daysSinceHalving: 450, normalizedPrice: 4200 },
      { daysSinceHalving: 480, normalizedPrice: 4800 },
      { daysSinceHalving: 510, normalizedPrice: 3600 },
      { daysSinceHalving: 540, normalizedPrice: 3100 },
    ],
  },

  // ─── 2016 Cycle ───
  {
    label: '2016 Cycle',
    halvingDate: '2016-07-09',
    bottomDate: '2015-01-14',
    bottomPrice: 178,
    halvingPrice: 650,
    color: '#a78bfa',
    data: [
      // ~3 months before halving
      { daysSinceHalving: -90, normalizedPrice: 68 },
      { daysSinceHalving: -75, normalizedPrice: 70 },
      { daysSinceHalving: -60, normalizedPrice: 74 },
      { daysSinceHalving: -45, normalizedPrice: 78 },
      { daysSinceHalving: -30, normalizedPrice: 97 },
      { daysSinceHalving: -15, normalizedPrice: 104 },
      { daysSinceHalving: 0, normalizedPrice: 100 },
      // Post-halving
      { daysSinceHalving: 15, normalizedPrice: 92 },
      { daysSinceHalving: 30, normalizedPrice: 90 },
      { daysSinceHalving: 60, normalizedPrice: 95 },
      { daysSinceHalving: 90, normalizedPrice: 97 },
      { daysSinceHalving: 120, normalizedPrice: 110 },
      { daysSinceHalving: 150, normalizedPrice: 115 },
      { daysSinceHalving: 180, normalizedPrice: 145 },
      { daysSinceHalving: 210, normalizedPrice: 150 },
      { daysSinceHalving: 240, normalizedPrice: 165 },
      { daysSinceHalving: 270, normalizedPrice: 175 },
      { daysSinceHalving: 300, normalizedPrice: 210 },
      { daysSinceHalving: 330, normalizedPrice: 370 },
      { daysSinceHalving: 360, normalizedPrice: 385 },
      { daysSinceHalving: 390, normalizedPrice: 440 },
      { daysSinceHalving: 420, normalizedPrice: 625 },
      { daysSinceHalving: 450, normalizedPrice: 700 },
      { daysSinceHalving: 480, normalizedPrice: 1100 },
      { daysSinceHalving: 510, normalizedPrice: 2500 },
      { daysSinceHalving: 540, normalizedPrice: 3030 },
    ],
  },

  // ─── 2020 Cycle ───
  {
    label: '2020 Cycle',
    halvingDate: '2020-05-11',
    bottomDate: '2020-03-13',
    bottomPrice: 3850,
    halvingPrice: 8600,
    color: '#60a5fa',
    data: [
      // ~3 months before halving (includes COVID crash recovery)
      { daysSinceHalving: -90, normalizedPrice: 101 },
      { daysSinceHalving: -75, normalizedPrice: 107 },
      { daysSinceHalving: -60, normalizedPrice: 45 },  // COVID crash ~$3,850
      { daysSinceHalving: -45, normalizedPrice: 63 },
      { daysSinceHalving: -30, normalizedPrice: 77 },
      { daysSinceHalving: -15, normalizedPrice: 90 },
      { daysSinceHalving: 0, normalizedPrice: 100 },
      // Post-halving
      { daysSinceHalving: 15, normalizedPrice: 109 },
      { daysSinceHalving: 30, normalizedPrice: 112 },
      { daysSinceHalving: 60, normalizedPrice: 108 },
      { daysSinceHalving: 90, normalizedPrice: 136 },
      { daysSinceHalving: 120, normalizedPrice: 133 },
      { daysSinceHalving: 150, normalizedPrice: 126 },
      { daysSinceHalving: 180, normalizedPrice: 222 },
      { daysSinceHalving: 210, normalizedPrice: 340 },
      { daysSinceHalving: 240, normalizedPrice: 380 },
      { daysSinceHalving: 270, normalizedPrice: 540 },
      { daysSinceHalving: 300, normalizedPrice: 685 },
      { daysSinceHalving: 330, normalizedPrice: 690 },
      { daysSinceHalving: 360, normalizedPrice: 430 },
      { daysSinceHalving: 390, normalizedPrice: 395 },
      { daysSinceHalving: 420, normalizedPrice: 370 },
      { daysSinceHalving: 450, normalizedPrice: 560 },
      { daysSinceHalving: 480, normalizedPrice: 720 },
      { daysSinceHalving: 510, normalizedPrice: 790 },
      { daysSinceHalving: 540, normalizedPrice: 802 },
    ],
  },

  // ─── 2024 Cycle ───
  {
    label: '2024 Cycle',
    halvingDate: '2024-04-19',
    bottomDate: '2022-11-21',
    bottomPrice: 15479,
    halvingPrice: 63800,
    color: '#34d399',
    data: [
      // ~3 months before halving
      { daysSinceHalving: -90, normalizedPrice: 67 },   // ~$42,800 Jan 2024
      { daysSinceHalving: -75, normalizedPrice: 76 },   // ~$48,500
      { daysSinceHalving: -60, normalizedPrice: 82 },   // ~$52,300
      { daysSinceHalving: -45, normalizedPrice: 99 },   // ~$63,200
      { daysSinceHalving: -30, normalizedPrice: 109 },  // ~$69,600 BTC ATH run-up
      { daysSinceHalving: -15, normalizedPrice: 105 },  // ~$67,000
      { daysSinceHalving: 0, normalizedPrice: 100 },    // ~$63,800 halving day
      // Post-halving (real data up to approx Feb 2026)
      { daysSinceHalving: 15, normalizedPrice: 99 },    // ~$63,200
      { daysSinceHalving: 30, normalizedPrice: 101 },   // ~$64,400
      { daysSinceHalving: 60, normalizedPrice: 103 },   // ~$65,700
      { daysSinceHalving: 90, normalizedPrice: 91 },    // ~$58,100 summer dip
      { daysSinceHalving: 120, normalizedPrice: 94 },   // ~$60,000
      { daysSinceHalving: 150, normalizedPrice: 89 },   // ~$56,800
      { daysSinceHalving: 180, normalizedPrice: 97 },   // ~$61,900
      { daysSinceHalving: 210, normalizedPrice: 106 },  // ~$67,600
      { daysSinceHalving: 240, normalizedPrice: 113 },  // ~$72,100 Oct rally
      { daysSinceHalving: 270, normalizedPrice: 142 },  // ~$90,600 Nov breakout
      { daysSinceHalving: 300, normalizedPrice: 153 },  // ~$97,600 Dec 2024
      { daysSinceHalving: 330, normalizedPrice: 148 },  // ~$94,400 Jan 2025
      { daysSinceHalving: 360, normalizedPrice: 155 },  // ~$98,900 Feb 2025
      { daysSinceHalving: 390, normalizedPrice: 142 },  // ~$90,600 Mar 2025
      { daysSinceHalving: 420, normalizedPrice: 131 },  // ~$83,600 Apr 2025
      { daysSinceHalving: 450, normalizedPrice: 148 },  // ~$94,400 May 2025
      { daysSinceHalving: 480, normalizedPrice: 155 },  // ~$98,900 Jun 2025
      { daysSinceHalving: 510, normalizedPrice: 147 },  // ~$93,800 Jul 2025
      { daysSinceHalving: 540, normalizedPrice: 152 },  // ~$97,000 Aug 2025
      { daysSinceHalving: 570, normalizedPrice: 156 },  // ~$99,500 Sep 2025
      { daysSinceHalving: 600, normalizedPrice: 159 },  // ~$101,500 Oct 2025
    ],
  },
];
