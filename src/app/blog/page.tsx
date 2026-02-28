import Link from 'next/link';
import { format } from 'date-fns';
import { ArrowRight, Clock } from 'lucide-react';
import { getAllPosts } from '@/lib/blog/posts';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cryptoreportkit.com';

export const metadata: Metadata = {
  title: 'Crypto Blog \u2014 Guides, Insights & Education',
  description:
    'Expert crypto guides, market analysis, and educational articles from CryptoReportKit. Learn about sentiment indicators, trading strategies, and portfolio management.',
  alternates: { canonical: `${siteUrl}/blog` },
  openGraph: {
    title: 'Crypto Blog | CryptoReportKit',
    description: 'Crypto guides, market education, and insights.',
    url: `${siteUrl}/blog`,
  },
};

export default function BlogListingPage() {
  const posts = getAllPosts();

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <FreeNavbar />

      {/* Hero */}
      <div className="bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <Breadcrumb customTitle="Blog" />
          <h1 className="text-3xl md:text-4xl font-bold mt-4 mb-3">Crypto Blog</h1>
          <p className="text-gray-400 text-lg max-w-2xl">
            Educational guides, market analysis, and crypto insights from the CryptoReportKit team.
          </p>
        </div>
      </div>

      {/* Post Grid */}
      <div className="max-w-6xl mx-auto px-4 py-10">
        {posts.length === 0 ? (
          <p className="text-gray-500 text-center py-20">No posts yet. Check back soon!</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group bg-gray-800/50 border border-gray-700/50 rounded-xl p-6 hover:border-emerald-400/30 hover:bg-gray-800/80 transition-all"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{post.coverEmoji}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium uppercase bg-emerald-400/10 text-emerald-400">
                    {post.category}
                  </span>
                </div>

                <h2 className="text-lg font-semibold text-white mb-2 group-hover:text-emerald-400 transition-colors leading-snug">
                  {post.title}
                </h2>

                <p className="text-sm text-gray-400 leading-relaxed mb-4 line-clamp-3">
                  {post.excerpt}
                </p>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {post.readingTimeMinutes} min read
                    </span>
                    <span>{format(new Date(post.publishDate), 'MMM d, yyyy')}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-emerald-400 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
