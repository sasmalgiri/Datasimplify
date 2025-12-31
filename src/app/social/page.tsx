'use client';

import { SocialSentiment } from '@/components/features/SocialSentiment';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';

export default function SocialPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <FreeNavbar />
      <Breadcrumb />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">Social Sentiment</h1>
        <p className="text-gray-400 mb-8">
          Track what people are saying about crypto across social media.
        </p>

        <SocialSentiment showBeginnerTips={true} />
      </div>
    </div>
  );
}
