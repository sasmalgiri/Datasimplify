'use client';

import { useState } from 'react';
import { X, Plus, Trash2, Bell, Send, Check } from 'lucide-react';
import { useDataLabStore } from '@/lib/datalab/store';
import { isFeatureAvailable } from '@/lib/datalab/modeConfig';
import { DATA_SOURCE_OPTIONS, type DataSource } from '@/lib/datalab/types';

type AlertOperator = 'above' | 'below' | 'crosses_above' | 'crosses_below';
type WebhookType = 'discord' | 'telegram' | 'slack' | 'custom';

interface AlertCondition {
  id: string;
  source: DataSource;
  operator: AlertOperator;
  value: number;
  enabled: boolean;
}

interface WebhookConfig {
  type: WebhookType;
  url: string;
  name: string;
}

interface AlertWebhookPanelProps {
  show: boolean;
  onClose: () => void;
}

export function AlertWebhookPanel({ show, onClose }: AlertWebhookPanelProps) {
  const dataLabMode = useDataLabStore((s) => s.dataLabMode);
  const coin = useDataLabStore((s) => s.coin);

  const [conditions, setConditions] = useState<AlertCondition[]>([]);
  const [webhook, setWebhook] = useState<WebhookConfig>({ type: 'discord', url: '', name: 'DataLab Alert' });
  const [testResult, setTestResult] = useState<string | null>(null);

  if (!isFeatureAvailable(dataLabMode, 'alertWebhooks')) return null;
  if (!show) return null;

  const addCondition = () => {
    setConditions((prev) => [
      ...prev,
      {
        id: `cond-${Date.now()}`,
        source: 'price',
        operator: 'above',
        value: 100000,
        enabled: true,
      },
    ]);
  };

  const removeCondition = (id: string) => {
    setConditions((prev) => prev.filter((c) => c.id !== id));
  };

  const updateCondition = (id: string, update: Partial<AlertCondition>) => {
    setConditions((prev) => prev.map((c) => c.id === id ? { ...c, ...update } : c));
  };

  const testWebhook = async () => {
    if (!webhook.url.trim()) {
      setTestResult('Please enter a webhook URL');
      return;
    }
    setTestResult('Sending test...');
    try {
      const payload = {
        content: `[DataLab Test] Alert test for ${coin.toUpperCase()} — ${new Date().toLocaleString()}`,
        embeds: [{
          title: 'DataLab Alert Test',
          description: `This is a test webhook from DataLab for ${coin.toUpperCase()}.`,
          color: 3447003,
        }],
      };

      const res = await fetch(webhook.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      setTestResult(res.ok ? 'Test sent successfully!' : `Failed: ${res.status}`);
    } catch (e: unknown) {
      setTestResult(`Error: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
    setTimeout(() => setTestResult(null), 5000);
  };

  const OPERATOR_LABELS: Record<AlertOperator, string> = {
    above: '> above',
    below: '< below',
    crosses_above: 'crosses above',
    crosses_below: 'crosses below',
  };

  const WEBHOOK_PLACEHOLDERS: Record<WebhookType, string> = {
    discord: 'https://discord.com/api/webhooks/...',
    telegram: 'https://api.telegram.org/bot.../sendMessage',
    slack: 'https://hooks.slack.com/services/...',
    custom: 'https://your-endpoint.com/webhook',
  };

  return (
    <div className="border-t border-white/[0.04] bg-white/[0.01] max-w-[1800px] mx-auto">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold text-white flex items-center gap-2">
            <Bell className="w-3.5 h-3.5 text-amber-400" />
            Alert Webhooks
            <span className="text-[10px] text-gray-500 font-normal ml-2">
              {coin.toUpperCase()} &middot; {conditions.filter((c) => c.enabled).length} active
            </span>
          </h4>
          <button type="button" title="Close alerts" onClick={onClose}
            className="text-gray-500 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Conditions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-gray-500 font-semibold uppercase">Conditions</span>
              <button type="button" onClick={addCondition}
                className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300">
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>

            {conditions.length === 0 ? (
              <p className="text-[11px] text-gray-600 text-center py-4 border border-dashed border-white/[0.06] rounded-lg">
                No conditions. Click Add to create one.
              </p>
            ) : (
              <div className="space-y-1.5">
                {conditions.map((cond) => (
                  <div key={cond.id} className="flex items-center gap-2 bg-white/[0.02] border border-white/[0.06] rounded-lg px-2.5 py-1.5">
                    <select
                      title="Source"
                      value={cond.source}
                      onChange={(e) => updateCondition(cond.id, { source: e.target.value as DataSource })}
                      className="bg-transparent border-none text-[10px] text-gray-300 focus:outline-none"
                    >
                      {DATA_SOURCE_OPTIONS.slice(0, 10).map((src) => (
                        <option key={src.source} value={src.source}>{src.label}</option>
                      ))}
                    </select>

                    <select
                      title="Operator"
                      value={cond.operator}
                      onChange={(e) => updateCondition(cond.id, { operator: e.target.value as AlertOperator })}
                      className="bg-transparent border-none text-[10px] text-gray-300 focus:outline-none"
                    >
                      {(Object.entries(OPERATOR_LABELS) as [AlertOperator, string][]).map(([op, label]) => (
                        <option key={op} value={op}>{label}</option>
                      ))}
                    </select>

                    <input
                      type="number"
                      title="Value"
                      value={cond.value}
                      onChange={(e) => updateCondition(cond.id, { value: Number(e.target.value) })}
                      className="w-20 bg-transparent border border-white/[0.06] text-[10px] text-gray-300 px-1.5 py-0.5 rounded focus:outline-none focus:border-blue-400/40"
                    />

                    <button type="button" title="Delete condition" onClick={() => removeCondition(cond.id)}
                      className="text-gray-600 hover:text-red-400 ml-auto">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Webhook Config */}
          <div>
            <span className="text-[10px] text-gray-500 font-semibold uppercase block mb-2">Webhook</span>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {(['discord', 'telegram', 'slack', 'custom'] as WebhookType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setWebhook((w) => ({ ...w, type: t }))}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium transition ${
                      webhook.type === t ? 'bg-white/[0.08] text-white' : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>

              <input
                type="text"
                placeholder={WEBHOOK_PLACEHOLDERS[webhook.type]}
                value={webhook.url}
                onChange={(e) => setWebhook((w) => ({ ...w, url: e.target.value }))}
                className="w-full bg-white/[0.04] border border-white/[0.06] text-gray-300 text-[10px] px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-blue-400/40 font-mono"
              />

              <div className="flex items-center gap-2">
                <button type="button" onClick={testWebhook}
                  className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-medium rounded-lg transition">
                  <Send className="w-3 h-3" />
                  Test Webhook
                </button>
                {testResult && (
                  <span className={`text-[10px] ${testResult.includes('success') ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {testResult}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <p className="text-[9px] text-gray-600 mt-3">
          Alerts run client-side and check conditions when data refreshes. For persistent alerts, enable Auto-Refresh.
        </p>
      </div>
    </div>
  );
}
