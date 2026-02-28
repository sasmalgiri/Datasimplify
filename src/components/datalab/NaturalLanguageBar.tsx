'use client';

import { useState } from 'react';
import { MessageSquare, Send, X } from 'lucide-react';
import { useDataLabStore } from '@/lib/datalab/store';
import { isFeatureAvailable } from '@/lib/datalab/modeConfig';
import { parseNaturalLanguageQuery } from '@/lib/datalab/nlQueryParser';
import { DATA_SOURCE_OPTIONS } from '@/lib/datalab/types';

export function NaturalLanguageBar() {
  const dataLabMode = useDataLabStore((s) => s.dataLabMode);
  const [query, setQuery] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [show, setShow] = useState(false);

  if (!isFeatureAvailable(dataLabMode, 'naturalLanguageQuery')) return null;

  const handleSubmit = () => {
    if (!query.trim()) return;

    const parsed = parseNaturalLanguageQuery(query);
    const store = useDataLabStore.getState();

    switch (parsed.action) {
      case 'add_indicator': {
        const source = parsed.params.source as string;
        const opt = DATA_SOURCE_OPTIONS.find((o) => o.source === source);
        if (opt) {
          const params: Record<string, number> = {};
          if (parsed.params.period) {
            const key = source === 'rsi' ? 'period' : 'window';
            params[key] = parsed.params.period as number;
          }
          store.addLayer({
            label: opt.label,
            source: opt.source,
            chartType: opt.chartType,
            yAxis: opt.yAxis,
            color: opt.color,
            visible: true,
            gridIndex: opt.gridIndex,
            params: Object.keys(params).length > 0 ? params : undefined,
          });
          store.recalculateLayers();
          setFeedback(`Added ${opt.label}`);
        } else {
          setFeedback(`Unknown indicator: ${source}`);
        }
        break;
      }

      case 'set_timerange': {
        const days = parsed.params.days as number;
        store.setDays(days);
        store.loadData();
        setFeedback(`Time range set to ${days} days`);
        break;
      }

      case 'set_coin': {
        const coin = parsed.params.coin as string;
        useDataLabStore.setState({ coin });
        store.loadData();
        setFeedback(`Switched to ${coin}`);
        break;
      }

      case 'toggle_feature': {
        const feature = parsed.params.feature as string;
        const toggleMap: Record<string, () => void> = {
          logScale: store.toggleLogScale,
          normalizeMode: store.toggleNormalize,
          showTable: store.toggleTable,
          showRegimes: store.toggleRegimes,
          showEvents: store.toggleEvents,
          showDivergences: store.toggleDivergences,
        };
        const toggle = toggleMap[feature];
        if (toggle) {
          toggle();
          setFeedback(`Toggled ${feature}`);
        } else {
          setFeedback(`Unknown feature: ${feature}`);
        }
        break;
      }

      default:
        setFeedback(parsed.description);
    }

    setQuery('');
    setTimeout(() => setFeedback(null), 3000);
  };

  if (!show) {
    return (
      <button
        type="button"
        onClick={() => setShow(true)}
        className="flex items-center gap-1.5 px-2.5 py-1 bg-white/[0.04] border border-white/[0.06] rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/[0.08] transition"
      >
        <MessageSquare className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Ask</span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1 max-w-xs">
        <MessageSquare className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit();
            if (e.key === 'Escape') { setShow(false); setQuery(''); }
          }}
          placeholder="e.g. add RSI 14, show 90 days..."
          className="w-full bg-white/[0.04] border border-white/[0.1] text-white text-[11px] pl-6 pr-8 py-1 rounded-lg focus:outline-none focus:border-violet-400/40"
          autoFocus
        />
        <button
          type="button"
          onClick={handleSubmit}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-violet-400"
        >
          <Send className="w-3 h-3" />
        </button>
      </div>
      <button
        type="button"
        onClick={() => { setShow(false); setQuery(''); }}
        className="text-gray-500 hover:text-white"
      >
        <X className="w-3 h-3" />
      </button>
      {feedback && (
        <span className="text-[10px] text-violet-400">{feedback}</span>
      )}
    </div>
  );
}
