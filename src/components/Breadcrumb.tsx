'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  ChevronRight,
  BarChart3,
  TrendingUp,
  Download,
  Brain,
  MessageSquare,
  GraduationCap,
  BookOpen,
  Scale,
  Wallet,
  Bell,
  Sparkles,
  Activity,
  Users,
  DollarSign,
  HelpCircle,
  LineChart,
  Shield,
  FileText,
  RefreshCw,
  Boxes,
  BarChart2,
  Target,
  Clock,
  Flame,
  TrendingDown,
  PieChart,
  Search,
  Layers,
  Wrench,
  Network,
  Coins,
  UserPlus,
  LogIn,
} from 'lucide-react';
import { ReactNode } from 'react';

// Icon mapping for each route
const routeIcons: Record<string, ReactNode> = {
  // Data
  market: <TrendingUp className="w-3.5 h-3.5" />,
  charts: <LineChart className="w-3.5 h-3.5" />,
  compare: <Scale className="w-3.5 h-3.5" />,
  download: <Download className="w-3.5 h-3.5" />,

  // Analysis
  monitor: <Brain className="w-3.5 h-3.5" />,
  predictions: <Sparkles className="w-3.5 h-3.5" />,
  dashboard: <Activity className="w-3.5 h-3.5" />,
  portfolio: <Wallet className="w-3.5 h-3.5" />,

  // Tools
  chat: <MessageSquare className="w-3.5 h-3.5" />,
  alerts: <Bell className="w-3.5 h-3.5" />,
  tools: <Wrench className="w-3.5 h-3.5" />,
  screener: <Search className="w-3.5 h-3.5" />,
  backtest: <Clock className="w-3.5 h-3.5" />,
  templates: <Layers className="w-3.5 h-3.5" />,

  // On-chain & DeFi
  onchain: <Network className="w-3.5 h-3.5" />,
  defi: <Boxes className="w-3.5 h-3.5" />,
  whales: <Coins className="w-3.5 h-3.5" />,

  // Analysis & Risk
  correlation: <BarChart2 className="w-3.5 h-3.5" />,
  technical: <BarChart3 className="w-3.5 h-3.5" />,
  sentiment: <Flame className="w-3.5 h-3.5" />,
  social: <Users className="w-3.5 h-3.5" />,
  risk: <Shield className="w-3.5 h-3.5" />,
  etf: <PieChart className="w-3.5 h-3.5" />,

  // Community
  community: <Users className="w-3.5 h-3.5" />,

  // Learn & Info
  learn: <GraduationCap className="w-3.5 h-3.5" />,
  glossary: <BookOpen className="w-3.5 h-3.5" />,
  faq: <HelpCircle className="w-3.5 h-3.5" />,

  // Business
  pricing: <DollarSign className="w-3.5 h-3.5" />,

  // Legal
  privacy: <Shield className="w-3.5 h-3.5" />,
  terms: <FileText className="w-3.5 h-3.5" />,
  refund: <RefreshCw className="w-3.5 h-3.5" />,

  // Auth
  login: <LogIn className="w-3.5 h-3.5" />,
  signup: <UserPlus className="w-3.5 h-3.5" />,

  // Coin pages
  coin: <Coins className="w-3.5 h-3.5" />,

  // Default
  advanced: <LineChart className="w-3.5 h-3.5" />,
};

// Pretty names for routes
const routeNames: Record<string, string> = {
  market: 'Market',
  charts: 'Charts',
  compare: 'Compare',
  download: 'Download Center',
  monitor: 'AI Monitor',
  predictions: 'AI Predictions',
  dashboard: 'Dashboard',
  portfolio: 'Portfolio Builder',
  chat: 'AI Chat',
  alerts: 'Price Alerts',
  tools: 'Tools',
  screener: 'Screener',
  backtest: 'Backtest',
  templates: 'Templates',
  onchain: 'On-Chain',
  defi: 'DeFi',
  whales: 'Whale Tracker',
  correlation: 'Correlation',
  technical: 'Technical Analysis',
  sentiment: 'Sentiment',
  social: 'Social Analysis',
  risk: 'Risk Analysis',
  etf: 'ETF Tracker',
  community: 'Community',
  learn: 'Academy',
  glossary: 'Glossary',
  faq: 'FAQ',
  pricing: 'Pricing',
  privacy: 'Privacy Policy',
  terms: 'Terms of Service',
  refund: 'Refund Policy',
  login: 'Login',
  signup: 'Sign Up',
  coin: 'Coin',
  advanced: 'Advanced Charts',
};

interface BreadcrumbProps {
  customTitle?: string;
}

export function Breadcrumb({ customTitle }: BreadcrumbProps) {
  const pathname = usePathname();

  // Don't show breadcrumb on home page
  if (pathname === '/') return null;

  // Split path and filter empty strings
  const segments = pathname.split('/').filter(Boolean);

  // Build breadcrumb items
  const items = segments.map((segment, index) => {
    const path = '/' + segments.slice(0, index + 1).join('/');
    const isLast = index === segments.length - 1;
    const name = routeNames[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
    const icon = routeIcons[segment] || null;

    return {
      name: isLast && customTitle ? customTitle : name,
      path,
      isLast,
      icon,
    };
  });

  return (
    <div className="bg-gray-900/50 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 py-2">
        <nav className="flex items-center gap-1.5 text-sm">
          {/* Home */}
          <Link
            href="/"
            className="flex items-center gap-1 text-gray-400 hover:text-emerald-400 transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>

          {/* Breadcrumb items */}
          {items.map((item, index) => (
            <div key={item.path} className="flex items-center gap-1.5">
              <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
              {item.isLast ? (
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  {item.icon}
                  <span>{item.name}</span>
                </span>
              ) : (
                <Link
                  href={item.path}
                  className="flex items-center gap-1 text-gray-400 hover:text-emerald-400 transition-colors"
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              )}
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
}

export default Breadcrumb;
