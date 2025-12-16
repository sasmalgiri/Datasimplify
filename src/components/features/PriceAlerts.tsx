'use client';

import { useState } from 'react';
import { BeginnerTip, InfoButton } from '../ui/BeginnerHelpers';

interface Alert {
  id: string;
  coin: string;
  coinName: string;
  type: 'price_above' | 'price_below' | 'percent_change' | 'rsi' | 'whale' | 'social';
  condition: string;
  value: number;
  currentValue: number;
  status: 'active' | 'triggered' | 'paused';
  createdAt: Date;
  notifyVia: ('email' | 'push' | 'telegram')[];
}

export function PriceAlerts({ showBeginnerTips = true }: { showBeginnerTips?: boolean }) {
  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: '1',
      coin: 'BTC',
      coinName: 'Bitcoin',
      type: 'price_above',
      condition: 'Price goes above',
      value: 100000,
      currentValue: 97245,
      status: 'active',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      notifyVia: ['email', 'push']
    },
    {
      id: '2',
      coin: 'ETH',
      coinName: 'Ethereum',
      type: 'price_below',
      condition: 'Price falls below',
      value: 3500,
      currentValue: 3890,
      status: 'active',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      notifyVia: ['email']
    },
    {
      id: '3',
      coin: 'BTC',
      coinName: 'Bitcoin',
      type: 'percent_change',
      condition: 'Drops more than',
      value: 10,
      currentValue: 2.3,
      status: 'active',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      notifyVia: ['telegram', 'push']
    },
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAlert, setNewAlert] = useState({
    coin: 'BTC',
    type: 'price_above' as Alert['type'],
    value: 100000,
    notifyVia: ['email'] as Alert['notifyVia']
  });

  const alertTypes = [
    { id: 'price_above', label: '📈 Price Goes Above', example: 'Alert when BTC > $100,000' },
    { id: 'price_below', label: '📉 Price Falls Below', example: 'Alert when BTC < $90,000' },
    { id: 'percent_change', label: '📊 % Change (24h)', example: 'Alert on 10%+ moves' },
    { id: 'rsi', label: '📐 RSI Level', example: 'Alert when RSI > 70 or < 30' },
    { id: 'whale', label: '🐋 Whale Movement', example: 'Alert on large transactions' },
    { id: 'social', label: '📱 Social Spike', example: 'Alert on trending buzz' },
  ];

  const coins = [
    { symbol: 'BTC', name: 'Bitcoin', price: 97245 },
    { symbol: 'ETH', name: 'Ethereum', price: 3890 },
    { symbol: 'SOL', name: 'Solana', price: 220 },
    { symbol: 'XRP', name: 'Ripple', price: 2.35 },
    { symbol: 'DOGE', name: 'Dogecoin', price: 0.41 },
  ];

  const deleteAlert = (id: string) => {
    setAlerts(alerts.filter(a => a.id !== id));
  };

  const togglePause = (id: string) => {
    setAlerts(alerts.map(a => 
      a.id === id ? { ...a, status: a.status === 'active' ? 'paused' as const : 'active' as const } : a
    ));
  };

  const createAlert = () => {
    const coin = coins.find(c => c.symbol === newAlert.coin);
    const newAlertObj: Alert = {
      id: Date.now().toString(),
      coin: newAlert.coin,
      coinName: coin?.name || newAlert.coin,
      type: newAlert.type,
      condition: alertTypes.find(t => t.id === newAlert.type)?.label.replace(/[📈📉📊📐🐋📱]\s/, '') || '',
      value: newAlert.value,
      currentValue: coin?.price || 0,
      status: 'active',
      createdAt: new Date(),
      notifyVia: newAlert.notifyVia
    };
    setAlerts([newAlertObj, ...alerts]);
    setShowCreateModal(false);
    setNewAlert({ coin: 'BTC', type: 'price_above', value: 100000, notifyVia: ['email'] });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            🔔 Price Alerts
            <InfoButton explanation="Set up custom alerts to notify you when specific conditions are met. Never miss a trading opportunity!" />
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Get notified when prices hit your targets
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
        >
          + Create Alert
        </button>
      </div>

      {/* Beginner Tip */}
      {showBeginnerTips && (
        <BeginnerTip title="💡 Why Use Price Alerts?">
          Price alerts help you:
          <br/>• <strong>Buy at your target price</strong> - Set alert for when BTC drops to your buy price
          <br/>• <strong>Take profits</strong> - Get notified when your coin hits your sell target
          <br/>• <strong>Protect against crashes</strong> - Alert when price drops significantly
          <br/><br/>
          You don&apos;t need to watch charts 24/7 - let us watch for you!
        </BeginnerTip>
      )}

      {/* Active Alerts */}
      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <span className="text-5xl">🔔</span>
            <p className="text-gray-500 mt-4">No alerts yet</p>
            <p className="text-gray-400 text-sm">Create your first alert to get started</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-lg border ${
                alert.status === 'paused' ? 'border-gray-200 bg-gray-50 opacity-60' :
                alert.status === 'triggered' ? 'border-green-200 bg-green-50' :
                'border-gray-200 bg-white'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${
                    alert.type === 'price_above' ? 'bg-green-100' :
                    alert.type === 'price_below' ? 'bg-red-100' :
                    'bg-blue-100'
                  }`}>
                    <span className="text-xl">
                      {alert.type === 'price_above' ? '📈' :
                       alert.type === 'price_below' ? '📉' :
                       alert.type === 'whale' ? '🐋' :
                       alert.type === 'social' ? '📱' : '📊'}
                    </span>
                  </div>
                  <div>
                    <p className="font-bold">{alert.coinName} ({alert.coin})</p>
                    <p className="text-sm text-gray-600">
                      {alert.condition} ${alert.value.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Current: ${alert.currentValue.toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Notification Methods */}
                  <div className="flex gap-1">
                    {alert.notifyVia.includes('email') && <span title="Email">📧</span>}
                    {alert.notifyVia.includes('push') && <span title="Push">📱</span>}
                    {alert.notifyVia.includes('telegram') && <span title="Telegram">✈️</span>}
                  </div>
                  
                  {/* Status Badge */}
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    alert.status === 'active' ? 'bg-green-100 text-green-700' :
                    alert.status === 'triggered' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {alert.status === 'active' ? '● Active' :
                     alert.status === 'triggered' ? '✓ Triggered' : '⏸ Paused'}
                  </span>
                  
                  {/* Actions */}
                  <button
                    onClick={() => togglePause(alert.id)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    title={alert.status === 'paused' ? 'Resume' : 'Pause'}
                  >
                    {alert.status === 'paused' ? '▶️' : '⏸️'}
                  </button>
                  <button
                    onClick={() => deleteAlert(alert.id)}
                    className="p-1 text-gray-400 hover:text-red-600"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              
              {/* Progress to Target */}
              {(alert.type === 'price_above' || alert.type === 'price_below') && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Current</span>
                    <span>Target</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${alert.type === 'price_above' ? 'bg-green-500' : 'bg-red-500'}`}
                      style={{ 
                        width: alert.type === 'price_above' 
                          ? `${Math.min((alert.currentValue / alert.value) * 100, 100)}%`
                          : `${Math.min((alert.value / alert.currentValue) * 100, 100)}%`
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1 text-center">
                    {alert.type === 'price_above' 
                      ? `${((alert.value - alert.currentValue) / alert.currentValue * 100).toFixed(1)}% to go`
                      : `${((alert.currentValue - alert.value) / alert.currentValue * 100).toFixed(1)}% buffer`
                    }
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Create Alert Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md m-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Create New Alert</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Coin Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Coin</label>
                <select
                  value={newAlert.coin}
                  onChange={(e) => setNewAlert({ ...newAlert, coin: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  {coins.map((coin) => (
                    <option key={coin.symbol} value={coin.symbol}>
                      {coin.name} ({coin.symbol}) - ${coin.price.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Alert Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alert Type</label>
                <select
                  value={newAlert.type}
                  onChange={(e) => setNewAlert({ ...newAlert, type: e.target.value as Alert['type'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  {alertTypes.map((type) => (
                    <option key={type.id} value={type.id}>{type.label}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {alertTypes.find(t => t.id === newAlert.type)?.example}
                </p>
              </div>

              {/* Value */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {newAlert.type.includes('percent') ? 'Percentage (%)' : 'Price ($)'}
                </label>
                <input
                  type="number"
                  value={newAlert.value}
                  onChange={(e) => setNewAlert({ ...newAlert, value: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              {/* Notification Methods */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notify Via</label>
                <div className="flex gap-4">
                  {[
                    { id: 'email' as const, label: '📧 Email' },
                    { id: 'push' as const, label: '📱 Push' },
                    { id: 'telegram' as const, label: '✈️ Telegram' },
                  ].map((method) => (
                    <label key={method.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={newAlert.notifyVia.includes(method.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewAlert({ ...newAlert, notifyVia: [...newAlert.notifyVia, method.id] });
                          } else {
                            setNewAlert({ ...newAlert, notifyVia: newAlert.notifyVia.filter(m => m !== method.id) });
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{method.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Create Button */}
              <button
                onClick={createAlert}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                Create Alert
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popular Alerts */}
      {showBeginnerTips && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-3">💡 Popular Alert Ideas</h3>
          <div className="grid md:grid-cols-2 gap-3 text-sm">
            <div className="bg-white p-3 rounded-lg">
              <p className="font-medium">🎯 BTC at $100K</p>
              <p className="text-gray-500">Get notified for this milestone</p>
            </div>
            <div className="bg-white p-3 rounded-lg">
              <p className="font-medium">📉 10% Drop Alert</p>
              <p className="text-gray-500">Protect against sudden crashes</p>
            </div>
            <div className="bg-white p-3 rounded-lg">
              <p className="font-medium">🐋 Whale Alert</p>
              <p className="text-gray-500">Know when big players move</p>
            </div>
            <div className="bg-white p-3 rounded-lg">
              <p className="font-medium">📱 Social Spike</p>
              <p className="text-gray-500">Catch trending coins early</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PriceAlerts;
