'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { markTopicComplete, PAGE_TO_TOPICS, getOverallProgress } from '@/lib/learningPath';

/**
 * ProgressTracker - Invisible component that auto-marks learning path topics
 * as complete when the user visits a relevant tool page.
 *
 * Place this once in the root layout or on individual pages.
 * It reads the current pathname and marks matching learning topics as done.
 */
export function ProgressTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const topicIds = PAGE_TO_TOPICS[pathname];
    if (!topicIds || topicIds.length === 0) return;

    // Small delay so it doesn't run on accidental navigations
    const timer = setTimeout(() => {
      let anyNew = false;
      for (const topicId of topicIds) {
        const progress = JSON.parse(localStorage.getItem('crk-learning-progress') || '{}');
        if (!progress[topicId]) {
          anyNew = true;
        }
        markTopicComplete(topicId);
      }

      // Show a subtle notification if new progress was made
      if (anyNew) {
        const overall = getOverallProgress();
        if (overall.completed > 0 && overall.completed <= overall.total) {
          // Dispatch a custom event that other components can listen to
          window.dispatchEvent(
            new CustomEvent('crk-progress', {
              detail: { completed: overall.completed, total: overall.total },
            })
          );
        }
      }
    }, 3000); // 3s delay = user actually spent time on the page

    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
}
