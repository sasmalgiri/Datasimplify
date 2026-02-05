'use client';

import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, X } from 'lucide-react';

export interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
  preset: string;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
  minDate?: Date;
  maxDate?: Date;
}

const PRESETS = [
  { label: '24H', days: 1 },
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
  { label: '1Y', days: 365 },
  { label: 'YTD', days: 0, isYTD: true },
  { label: 'All', days: -1 },
];

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateForInput(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getPresetRange(preset: typeof PRESETS[number]): { start: Date; end: Date } {
  const end = new Date();
  let start: Date;

  if (preset.isYTD) {
    start = new Date(end.getFullYear(), 0, 1);
  } else if (preset.days === -1) {
    start = new Date(2013, 0, 1); // Bitcoin early history
  } else {
    start = new Date(end.getTime() - preset.days * 24 * 60 * 60 * 1000);
  }

  return { start, end };
}

export default function DateRangePicker({
  value,
  onChange,
  className = '',
  minDate,
  maxDate = new Date(),
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowCustom(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePresetClick = (preset: typeof PRESETS[number]) => {
    const range = getPresetRange(preset);
    onChange({
      startDate: range.start,
      endDate: range.end,
      preset: preset.label,
    });
    setIsOpen(false);
    setShowCustom(false);
  };

  const handleCustomSubmit = () => {
    if (customStart && customEnd) {
      const start = new Date(customStart);
      const end = new Date(customEnd);
      if (start <= end) {
        onChange({
          startDate: start,
          endDate: end,
          preset: 'Custom',
        });
        setIsOpen(false);
        setShowCustom(false);
      }
    }
  };

  const displayText = value.preset
    ? value.preset === 'Custom' && value.startDate && value.endDate
      ? `${formatDate(value.startDate)} - ${formatDate(value.endDate)}`
      : value.preset
    : 'Select Range';

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-750 transition-colors text-sm text-white"
      >
        <Calendar className="w-4 h-4 text-emerald-400" />
        <span>{displayText}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 min-w-[280px]">
          {/* Presets */}
          <div className="p-2 border-b border-gray-700">
            <div className="flex flex-wrap gap-1">
              {PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => handlePresetClick(preset)}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                    value.preset === preset.label
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Range Toggle */}
          <div className="p-2">
            <button
              onClick={() => setShowCustom(!showCustom)}
              className="w-full text-left text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              Custom Range
              <ChevronDown className={`w-3 h-3 ml-auto transition-transform ${showCustom ? 'rotate-180' : ''}`} />
            </button>

            {showCustom && (
              <div className="mt-3 space-y-3">
                <div>
                  <label htmlFor="date-range-start" className="block text-xs text-gray-400 mb-1">Start Date</label>
                  <input
                    id="date-range-start"
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    max={customEnd || formatDateForInput(maxDate)}
                    min={minDate ? formatDateForInput(minDate) : '2013-01-01'}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label htmlFor="date-range-end" className="block text-xs text-gray-400 mb-1">End Date</label>
                  <input
                    id="date-range-end"
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    min={customStart || (minDate ? formatDateForInput(minDate) : '2013-01-01')}
                    max={formatDateForInput(maxDate)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleCustomSubmit}
                  disabled={!customStart || !customEnd}
                  className="w-full py-2 bg-emerald-600 text-white text-sm font-medium rounded hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Apply Range
                </button>
              </div>
            )}
          </div>

          {/* Current Selection Display */}
          {value.startDate && value.endDate && (
            <div className="px-2 pb-2 pt-1 border-t border-gray-700">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{formatDate(value.startDate)} - {formatDate(value.endDate)}</span>
                <button
                  type="button"
                  aria-label="Clear date range"
                  onClick={() => {
                    onChange({ startDate: null, endDate: null, preset: '' });
                    setIsOpen(false);
                  }}
                  className="p-1 hover:bg-gray-700 rounded"
                >
                  <X className="w-3 h-3" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Compact inline version for forms
export function DateRangePresets({
  value,
  onChange,
  className = '',
}: {
  value: string;
  onChange: (preset: string, startDate: Date, endDate: Date) => void;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {PRESETS.map((preset) => {
        const range = getPresetRange(preset);
        return (
          <button
            key={preset.label}
            onClick={() => onChange(preset.label, range.start, range.end)}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              value === preset.label
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {preset.label}
          </button>
        );
      })}
    </div>
  );
}
