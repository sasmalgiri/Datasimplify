'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  MessageSquare,
  FileSpreadsheet,
  BookOpen,
  ExternalLink,
  HelpCircle,
  Lightbulb,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';

interface DiscussionTopic {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  posts: number;
  href?: string;
}

const discussionTopics: DiscussionTopic[] = [
  {
    id: 'templates',
    title: 'Excel Templates',
    description: 'Share tips and get help with DataSimplify Excel templates and CryptoSheets formulas.',
    icon: <FileSpreadsheet className="w-6 h-6" />,
    posts: 0,
  },
  {
    id: 'data-analysis',
    title: 'Data Analysis Techniques',
    description: 'Discuss data visualization methods, chart configurations, and analytical approaches.',
    icon: <Lightbulb className="w-6 h-6" />,
    posts: 0,
  },
  {
    id: 'help',
    title: 'Help & Support',
    description: 'Get help with setup, troubleshooting, and using DataSimplify tools.',
    icon: <HelpCircle className="w-6 h-6" />,
    posts: 0,
  },
  {
    id: 'feature-requests',
    title: 'Feature Requests',
    description: 'Suggest new features and improvements for DataSimplify.',
    icon: <MessageSquare className="w-6 h-6" />,
    posts: 0,
  },
];

const resources = [
  {
    title: 'Getting Started Guide',
    description: 'Learn how to use DataSimplify templates',
    href: '/template-requirements',
    icon: <BookOpen className="w-5 h-5" />,
  },
  {
    title: 'Community Guidelines',
    description: 'Rules and best practices for participation',
    href: '/community/guidelines',
    icon: <FileText className="w-5 h-5" />,
  },
  {
    title: 'FAQ',
    description: 'Frequently asked questions',
    href: '/faq',
    icon: <HelpCircle className="w-5 h-5" />,
  },
  {
    title: 'CryptoSheets Add-in',
    description: 'Required for Excel templates',
    href: 'https://www.cryptosheets.com/',
    icon: <ExternalLink className="w-5 h-5" />,
    external: true,
  },
];

export default function CommunityPage() {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
      <FreeNavbar />
      <Breadcrumb />

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-emerald-900/30 to-blue-900/30 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                <Users className="w-10 h-10 text-emerald-500" />
                Community
              </h1>
              <p className="text-gray-400 text-lg">
                Discuss data analysis techniques and get help with templates
              </p>
              <Link
                href="/community/guidelines"
                className="inline-flex items-center gap-2 mt-3 text-emerald-400 hover:text-emerald-300 text-sm font-medium"
              >
                <FileText className="w-4 h-4" />
                View Community Guidelines
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Important Notice */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-400 mb-1">Educational Purpose Only</h3>
              <p className="text-gray-300 text-sm">
                This community is for discussing data analysis techniques and sharing spreadsheet tips.
                Do not share investment advice, price targets, or trading recommendations.
                See our <Link href="/community/guidelines" className="text-emerald-400 hover:underline">Community Guidelines</Link> for details.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Discussion Topics */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-bold mb-4">Discussion Topics</h2>

            {discussionTopics.map((topic) => (
              <button
                type="button"
                key={topic.id}
                onClick={() => setSelectedTopic(topic.id === selectedTopic ? null : topic.id)}
                className={`w-full text-left bg-gray-800/50 border rounded-xl p-5 hover:bg-gray-800 transition ${
                  selectedTopic === topic.id ? 'border-emerald-500' : 'border-gray-700'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-emerald-900/30 rounded-lg text-emerald-400">
                    {topic.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white mb-1">{topic.title}</h3>
                    <p className="text-gray-400 text-sm">{topic.description}</p>
                  </div>
                </div>

                {selectedTopic === topic.id && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <div className="bg-gray-900/50 rounded-lg p-4 text-center">
                      <MessageSquare className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">
                        Community discussions coming soon.
                      </p>
                      <p className="text-gray-600 text-xs mt-1">
                        In the meantime, check out our FAQ and documentation.
                      </p>
                    </div>
                  </div>
                )}
              </button>
            ))}

            {/* Coming Soon Notice */}
            <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-6 mt-6">
              <h3 className="font-semibold text-white mb-2">Community Forum Coming Soon</h3>
              <p className="text-gray-400 text-sm mb-4">
                We&apos;re building a community space where you can share Excel tips, discuss data
                analysis techniques, and help each other get the most out of DataSimplify tools.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/faq"
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition"
                >
                  View FAQ
                </Link>
                <Link
                  href="/template-requirements"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-medium transition"
                >
                  Template Setup Guide
                </Link>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Resources */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-500" />
                Resources
              </h3>
              <div className="space-y-3">
                {resources.map((resource) => (
                  <Link
                    key={resource.title}
                    href={resource.href}
                    target={resource.external ? '_blank' : undefined}
                    rel={resource.external ? 'noopener noreferrer' : undefined}
                    className="flex items-start gap-3 p-3 bg-gray-900/50 rounded-lg hover:bg-gray-900 transition"
                  >
                    <div className="text-emerald-400 mt-0.5">{resource.icon}</div>
                    <div>
                      <p className="text-white text-sm font-medium">{resource.title}</p>
                      <p className="text-gray-500 text-xs">{resource.description}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Product Info */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-3">About DataSimplify</h3>
              <p className="text-gray-400 text-sm mb-4">
                DataSimplify provides software analytics tools and Excel templates for educational
                data visualization. Templates contain formulas only - data is fetched via the
                CryptoSheets add-in.
              </p>
              <div className="space-y-2 text-xs text-gray-500">
                <p>&#10003; Software analytics tooling</p>
                <p>&#10003; Excel templates with formulas</p>
                <p>&#10003; Educational visualization</p>
                <p>&#10007; Not a data vendor</p>
                <p>&#10007; Not financial advice</p>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <div className="space-y-2">
                <Link
                  href="/templates"
                  className="block px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition"
                >
                  Browse Templates
                </Link>
                <Link
                  href="/disclaimer"
                  className="block px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition"
                >
                  Disclaimer
                </Link>
                <Link
                  href="/terms"
                  className="block px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition"
                >
                  Terms of Service
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
