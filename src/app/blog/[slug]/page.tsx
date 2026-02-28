import Link from 'next/link';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import { ArrowLeft } from 'lucide-react';
import { getPostBySlug, getAllSlugs } from '@/lib/blog/posts';
import type { BlogPost } from '@/lib/blog/posts';
import { FreeNavbar } from '@/components/FreeNavbar';
import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cryptoreportkit.com';

// --- SEO ---
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: 'Post Not Found' };

  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    alternates: { canonical: `${siteUrl}/blog/${post.slug}` },
    openGraph: {
      type: 'article',
      url: `${siteUrl}/blog/${post.slug}`,
      title: post.title,
      description: post.description,
      publishedTime: post.publishDate,
      modifiedTime: post.updatedDate ?? post.publishDate,
      authors: [post.author],
      section: post.category,
      tags: post.keywords,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
    },
  };
}

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

// --- JSON-LD ---
function ArticleJsonLdScript({ post }: { post: BlogPost }) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    url: `${siteUrl}/blog/${post.slug}`,
    datePublished: post.publishDate,
    dateModified: post.updatedDate ?? post.publishDate,
    author: {
      '@type': 'Organization',
      name: 'CryptoReportKit',
      url: siteUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: 'CryptoReportKit',
      url: siteUrl,
      logo: { '@type': 'ImageObject', url: `${siteUrl}/favicon.svg` },
    },
    keywords: post.keywords.join(', '),
    articleSection: post.category,
    inLanguage: 'en-US',
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${siteUrl}/blog/${post.slug}` },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

function BreadcrumbJsonLdScript({ post }: { post: BlogPost }) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${siteUrl}/blog` },
      { '@type': 'ListItem', position: 3, name: post.title, item: `${siteUrl}/blog/${post.slug}` },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

// --- PAGE ---
export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const formattedDate = format(new Date(post.publishDate), 'MMMM d, yyyy');

  return (
    <>
      <ArticleJsonLdScript post={post} />
      <BreadcrumbJsonLdScript post={post} />

      <div className="min-h-screen bg-gray-50 text-gray-900">
        <FreeNavbar />

        {/* Article Header */}
        <div className="bg-white border-b border-gray-200 py-10 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 mb-4">
              <Link
                href="/blog"
                className="flex items-center gap-1 hover:text-emerald-600 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Blog
              </Link>
              <span>&middot;</span>
              <span>{post.category}</span>
              <span>&middot;</span>
              <span>{post.readingTimeMinutes} min read</span>
              <span>&middot;</span>
              <time dateTime={post.publishDate}>{formattedDate}</time>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
              {post.title}
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed">{post.description}</p>
          </div>
        </div>

        {/* Article Body */}
        <article className="max-w-3xl mx-auto px-4 py-10">
          {/* Table of Contents */}
          {post.sections.length > 2 && (
            <nav className="bg-white border border-gray-200 rounded-xl p-5 mb-10">
              <p className="font-semibold text-gray-900 mb-3">Contents</p>
              <ol className="space-y-1.5 list-decimal list-inside text-sm">
                {post.sections.map((s) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className="text-emerald-600 hover:text-emerald-700 transition-colors"
                    >
                      {s.heading}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          )}

          {/* Sections */}
          {post.sections.map((section) => (
            <section id={section.id} key={section.id} className="mb-10 scroll-mt-20">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{section.heading}</h2>

              {section.body.map((para, i) => (
                <p key={i} className="text-gray-700 leading-relaxed mb-4">
                  {para}
                </p>
              ))}

              {section.bullets && (
                <ul className="list-disc ml-5 space-y-2 text-gray-700 mb-4">
                  {section.bullets.map((b, i) => (
                    <li key={i} className="leading-relaxed">
                      {b}
                    </li>
                  ))}
                </ul>
              )}

              {section.note && (
                <div className="bg-emerald-50 border-l-4 border-emerald-400 p-4 rounded-r-lg mb-4">
                  <p className="text-emerald-800 text-sm leading-relaxed">{section.note}</p>
                </div>
              )}

              {section.table && (
                <div className="overflow-x-auto mb-4">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        {section.table.headers.map((h) => (
                          <th
                            key={h}
                            className="text-left px-4 py-2.5 font-semibold text-gray-900 border-b border-gray-200"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {section.table.rows.map((row, ri) => (
                        <tr key={ri} className="border-b border-gray-100">
                          {row.map((cell, ci) => (
                            <td key={ci} className="px-4 py-2.5 text-gray-700">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ))}

          {/* CTA Box */}
          <div className="bg-gray-900 text-white rounded-2xl p-8 text-center mt-12">
            <p className="text-2xl font-bold mb-3">{post.ctaLabel}</p>
            <p className="text-gray-400 text-sm mb-6 max-w-md mx-auto">
              See real-time sentiment data alongside BTC price, market cap, and dominance on our live dashboard.
            </p>
            <Link
              href={post.ctaHref}
              className="inline-block px-8 py-3 bg-emerald-500 hover:bg-emerald-400 rounded-xl font-semibold transition text-white"
            >
              Open Dashboard
            </Link>
          </div>

          {/* Back to Blog */}
          <div className="mt-10 pt-8 border-t border-gray-200">
            <Link
              href="/blog"
              className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 text-sm font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to all articles
            </Link>
          </div>
        </article>
      </div>
    </>
  );
}
