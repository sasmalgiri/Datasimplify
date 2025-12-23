'use client';

import { useState } from 'react';
import {
  UserPreferencesProvider,
  JargonTooltip,
  AutoJargon,
  TrafficLight,
  StepGuide,
  SimpleMetric,
  LearningPath,
  WhatThisMeans,
  QuickAction,
  Breadcrumbs,
  UserLevelSelector,
} from '@/components/ui/SimplifiedUI';

// Sample getting started steps
const gettingStartedSteps = [
  {
    title: 'Understand the Basics',
    description: 'Learn what cryptocurrency is and how it works',
    action: 'Mark as Complete',
    tip: 'Start with our "What is Bitcoin?" guide - it takes just 5 minutes!',
  },
  {
    title: 'Set Up a Wallet',
    description: 'Create a secure place to store your crypto',
    action: 'Get Wallet Guide',
    tip: 'We recommend starting with a beginner-friendly wallet like Coinbase Wallet or MetaMask.',
  },
  {
    title: 'Make Your First Purchase',
    description: 'Buy a small amount of Bitcoin or Ethereum',
    action: 'See Exchange Guide',
    tip: 'Start small! Even $10-50 is enough to learn. Never invest more than you can afford to lose.',
  },
  {
    title: 'Track Your Investment',
    description: 'Use our tools to monitor your portfolio',
    action: 'Open Dashboard',
  },
];

export default function SimplifiedDemoPage() {
  const [currentStep, setCurrentStep] = useState(0);

  return (
    <UserPreferencesProvider>
      <div className="min-h-screen bg-gray-900 text-white p-8">
        {/* Header with user level selector */}
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Simplified Demo</h1>
              <p className="text-gray-400">See how everything is explained for beginners</p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-2">Your experience level:</p>
              <UserLevelSelector />
            </div>
          </div>

          {/* Breadcrumbs */}
          <Breadcrumbs items={[
            { label: 'Home', href: '/' },
            { label: 'Demo', href: '/demo' },
            { label: 'Simplified UX' },
          ]} />

          {/* Learning Path Progress */}
          <div className="mb-8">
            <LearningPath
              title="Your Learning Journey"
              current={currentStep}
              total={gettingStartedSteps.length}
            />
          </div>

          {/* Main Grid */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Metrics with Jargon Tooltips */}
            <div className="lg:col-span-2 space-y-6">
              {/* Market Overview */}
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                <h2 className="text-xl font-bold mb-4">📊 Market Overview</h2>
                
                {/* Metrics Grid */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  <SimpleMetric
                    label="BTC Price"
                    value="$97,245"
                    change={2.34}
                    status="good"
                    jargonTerm="bitcoin"
                    explanation="Bitcoin is up today! This is the main cryptocurrency that most people start with."
                  />
                  
                  <SimpleMetric
                    label="Market Cap"
                    value="$3.2T"
                    change={1.8}
                    status="good"
                    jargonTerm="market-cap"
                    explanation="The total value of all cryptocurrencies combined. Growing market cap is a positive sign."
                  />
                  
                  <SimpleMetric
                    label="BTC Dominance"
                    value="52.4%"
                    change={-0.3}
                    status="neutral"
                    jargonTerm="btc-dominance"
                    explanation="Bitcoin makes up about half of the total crypto market. When this drops, altcoins might be rallying."
                  />
                  
                  <SimpleMetric
                    label="Fear & Greed"
                    value="72"
                    status="warning"
                    jargonTerm="fear-greed-index"
                    explanation="Market is greedy right now. Historically, this means be careful - prices might be due for a pullback."
                  />
                  
                  <SimpleMetric
                    label="24h Volume"
                    value="$89.5B"
                    change={15.2}
                    status="good"
                    jargonTerm="volume"
                    explanation="Lots of trading activity today! High volume usually confirms price movements."
                  />
                  
                  <SimpleMetric
                    label="Active Wallets"
                    value="1.2M"
                    change={8.5}
                    status="good"
                    jargonTerm="wallet"
                    explanation="More people are using crypto wallets. This is a sign of growing adoption."
                  />
                </div>

                {/* What This Means */}
                <WhatThisMeans learnMoreLink="/learn/market-basics">
                  <strong>Overall:</strong> The market is healthy but getting a bit overheated. 
                  Bitcoin is leading the way with strong price action. The high Fear & Greed 
                  Index (72) suggests caution - consider waiting for a <JargonTooltip term="dip">dip</JargonTooltip> before 
                  making large purchases. Great time to learn, maybe not the best time to buy big.
                </WhatThisMeans>
              </div>

              {/* Sample Text with Auto-Highlighted Jargon */}
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                <h2 className="text-xl font-bold mb-4">📰 Latest Analysis</h2>
                <p className="text-gray-300 leading-relaxed">
                  <AutoJargon text="The cryptocurrency market is showing signs of a bull market continuation. Bitcoin dominance has decreased slightly as altcoins gain momentum. The Fear & Greed Index suggests the market is entering a greedy phase. Whales have been accumulating during recent dips, which is typically a bullish signal. DeFi TVL continues to grow as more users stake their assets for yield farming opportunities." />
                </p>
                
                <WhatThisMeans>
                  <strong>In plain English:</strong> Prices are going up and most people are making money. 
                  Big investors (whales) are buying, which usually means they expect higher prices. 
                  But be careful - when everyone is greedy, prices sometimes drop suddenly.
                </WhatThisMeans>
              </div>

              {/* Traffic Light Examples */}
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                <h2 className="text-xl font-bold mb-4">🚦 Signal Dashboard</h2>
                <p className="text-gray-400 text-sm mb-4">
                  Our traffic light system makes it easy to understand signals at a glance
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                    <span>Bitcoin Trend</span>
                    <TrafficLight 
                      status="good" 
                      label="Bullish" 
                      tooltip="Price is above key moving averages and trending upward"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                    <span>Market Sentiment</span>
                    <TrafficLight 
                      status="warning" 
                      label="Greed (72)" 
                      tooltip="Market is getting greedy - historically a time to be cautious"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                    <span>Whale Activity</span>
                    <TrafficLight 
                      status="good" 
                      label="Accumulating" 
                      tooltip="Big investors are buying - usually a positive sign"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                    <span><JargonTooltip term="rsi">RSI</JargonTooltip> Level</span>
                    <TrafficLight 
                      status="warning" 
                      label="68 (Near Overbought)" 
                      tooltip="RSI above 70 suggests the asset may be overbought"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                    <span><JargonTooltip term="exchange-flow">Exchange Outflow</JargonTooltip></span>
                    <TrafficLight 
                      status="good" 
                      label="Strong" 
                      tooltip="More crypto leaving exchanges means people are holding, not selling"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Getting Started */}
            <div className="space-y-6">
              {/* Step by Step Guide */}
              <StepGuide
                title="Getting Started"
                steps={gettingStartedSteps}
                currentStep={currentStep}
                onStepComplete={(step) => setCurrentStep(step + 1)}
              />

              {/* Quick Actions */}
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                <h3 className="font-bold mb-4">🚀 Quick Actions</h3>
                <div className="space-y-3">
                  <QuickAction
                    icon="🤖"
                    title="Ask AI"
                    description="Get answers in plain English"
                    href="/chat"
                    difficulty="beginner"
                  />
                  <QuickAction
                    icon="📚"
                    title="Learn Crypto"
                    description="Start with the basics"
                    href="/learn"
                    difficulty="beginner"
                  />
                  <QuickAction
                    icon="📖"
                    title="Glossary"
                    description="Look up any term"
                    href="/glossary"
                    difficulty="beginner"
                  />
                  <QuickAction
                    icon="📊"
                    title="View Charts"
                    description="See price movements"
                    href="/tools"
                    difficulty="intermediate"
                  />
                </div>
              </div>

              {/* Jargon Examples */}
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                <h3 className="font-bold mb-4">📝 Hover to Learn</h3>
                <p className="text-sm text-gray-400 mb-4">
                  Hover over any highlighted term to see a simple explanation:
                </p>
                <div className="flex flex-wrap gap-2">
                  <JargonTooltip term="bitcoin" />
                  <JargonTooltip term="ethereum" />
                  <JargonTooltip term="defi" />
                  <JargonTooltip term="staking" />
                  <JargonTooltip term="whale" />
                  <JargonTooltip term="hodl" />
                  <JargonTooltip term="dca" />
                  <JargonTooltip term="fomo" />
                  <JargonTooltip term="rug-pull" />
                  <JargonTooltip term="gas" />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section - Key Takeaways */}
          <div className="mt-8 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-6 border border-blue-500/30">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span>🎯</span>
              Key Takeaways for Today
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrafficLight status="good" />
                  <span className="font-medium">Market Health</span>
                </div>
                <p className="text-sm text-gray-400">
                  Overall positive trend. <JargonTooltip term="bitcoin">Bitcoin</JargonTooltip> and <JargonTooltip term="ethereum">Ethereum</JargonTooltip> both up.
                </p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrafficLight status="warning" />
                  <span className="font-medium">Caution Advised</span>
                </div>
                <p className="text-sm text-gray-400">
                  High <JargonTooltip term="fear-greed-index">Fear & Greed</JargonTooltip>. Don&apos;t <JargonTooltip term="fomo">FOMO</JargonTooltip> into positions.
                </p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrafficLight status="good" />
                  <span className="font-medium">Action Item</span>
                </div>
                <p className="text-sm text-gray-400">
                  Good time to learn. Consider <JargonTooltip term="dca">DCA</JargonTooltip> strategy for buying.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </UserPreferencesProvider>
  );
}
