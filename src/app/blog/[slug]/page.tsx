import Link from 'next/link';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import { ArrowLeft } from 'lucide-react';
import { getPostBySlugMerged, getAllSlugs } from '@/lib/blog/posts';
import type { BlogPost } from '@/lib/blog/posts';
import { FreeNavbar } from '@/components/FreeNavbar';
import type { Metadata } from 'next';

export const revalidate = 3600;
export const dynamicParams = true;

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cryptoreportkit.com';

// --- SEO ---
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlugMerged(slug);
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
  const post = await getPostBySlugMerged(slug);
  if (!post) notFound();

  const formattedDate = format(new Date(post.publishDate), 'MMMM d, yyyy');

  return (
    <>
      <ArticleJsonLdScript post={post} />
      <BreadcrumbJsonLdScript post={post} />

      <div className="min-h-screen bg-gray-900 text-white">
        <FreeNavbar />

        {/* Article Header */}
        <div className="bg-gray-800/50 border-b border-gray-700/50 py-10 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-400 mb-4">
              <Link
                href="/blog"
                className="flex items-center gap-1 hover:text-emerald-400 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Blog
              </Link>
              <span>&middot;</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium uppercase bg-emerald-400/10 text-emerald-400">
                {post.category}
              </span>
              <span>&middot;</span>
              <span>{post.readingTimeMinutes} min read</span>
              <span>&middot;</span>
              <time dateTime={post.publishDate}>{formattedDate}</time>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
              {post.title}
            </h1>
            <p className="text-lg text-gray-400 leading-relaxed">{post.description}</p>
          </div>
        </div>

        {/* Article Body */}
        <article className="max-w-3xl mx-auto px-4 py-10">
          {/* Table of Contents */}
          {post.sections.length > 2 && (
            <nav className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 mb-10">
              <p className="font-semibold text-white mb-3">Contents</p>
              <ol className="space-y-1.5 list-decimal list-inside text-sm">
                {post.sections.map((s) => (
                  <li key={s.id} className="text-gray-400">
                    <a
                      href={`#${s.id}`}
                      className="text-emerald-400 hover:text-emerald-300 transition-colors"
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
              <h2 className="text-2xl font-semibold text-white mb-4">{section.heading}</h2>

              {section.body.map((para, i) => (
                <p key={i} className="text-gray-300 leading-relaxed mb-4">
                  {para}
                </p>
              ))}

              {section.bullets && (
                <ul className="list-disc ml-5 space-y-2 text-gray-300 mb-4">
                  {section.bullets.map((b, i) => (
                    <li key={i} className="leading-relaxed">
                      {b}
                    </li>
                  ))}
                </ul>
              )}

              {section.note && (
                <div className="bg-emerald-400/5 border-l-4 border-emerald-400/50 p-4 rounded-r-lg mb-4">
                  <p className="text-emerald-300/90 text-sm leading-relaxed">{section.note}</p>
                </div>
              )}

              {section.table && (
                <div className="overflow-x-auto mb-4">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-white/[0.04]">
                        {section.table.headers.map((h) => (
                          <th
                            key={h}
                            className="text-left px-4 py-2.5 font-semibold text-white border-b border-white/[0.06]"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {section.table.rows.map((row, ri) => (
                        <tr key={ri} className="border-b border-white/[0.04]">
                          {row.map((cell, ci) => (
                            <td key={ci} className="px-4 py-2.5 text-gray-300">
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
          <div className="bg-emerald-400/10 border border-emerald-400/20 rounded-2xl p-8 text-center mt-12">
            <p className="text-2xl font-bold text-white mb-3">{post.ctaLabel}</p>
            <p className="text-gray-400 text-sm mb-6 max-w-md mx-auto">
              {post.excerpt.slice(0, 120)}...
            </p>
            <Link
              href={post.ctaHref}
              className="inline-block px-8 py-3 bg-emerald-500 hover:bg-emerald-400 rounded-xl font-semibold transition text-white"
            >
              Open Dashboard
            </Link>
          </div>

          {/* Back to Blog */}
          <div className="mt-10 pt-8 border-t border-white/[0.06]">
            <Link
              href="/blog"
              className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 text-sm font-medium transition-colors"
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
