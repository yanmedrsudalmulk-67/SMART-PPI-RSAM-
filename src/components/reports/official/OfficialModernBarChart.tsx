import React from 'react';

export interface ChartDataItem {
  label: string;
  value: number;
  formattedValue?: string;
  color?: string;
}

interface OfficialModernBarChartProps {
  title: string;
  subtitle?: string;
  data: ChartDataItem[];
  unit?: string;
  maxValue?: number;
  yTicks?: number[];
  height?: number;
  className?: string;
}

export default function OfficialModernBarChart({
  title,
  subtitle,
  data,
  unit = '',
  maxValue,
  yTicks,
  height = 170,
  className = '',
}: OfficialModernBarChartProps) {
  // Palette matching Gambar No 3: Amber/Orange, Deep Navy, Teal/Turquoise
  const defaultColors = [
    '#f59e0b', // Amber/Orange (Bar 1)
    '#0f2942', // Deep Dark Navy Blue (Bar 2)
    '#20b2aa', // Teal / Turquoise Cyan (Bar 3)
    '#3b82f6', // Blue
    '#10b981', // Emerald
    '#8b5cf6', // Violet
    '#ec4899', // Pink
    '#6366f1', // Indigo
    '#14b8a6', // Teal
    '#f97316', // Orange
    '#0284c7', // Sky Blue
    '#059669', // Green
  ];

  // Determine maximum value for scaling
  const dataMax = Math.max(...data.map((d) => d.value), 0);
  const calculatedMax = maxValue !== undefined 
    ? maxValue 
    : dataMax > 0 
      ? Math.ceil(dataMax * 1.18) 
      : 100;

  // Auto-generate 5 ticks (0, 25%, 50%, 75%, 100% of max) if not provided
  const ticks = yTicks || [
    0,
    Math.round(calculatedMax * 0.25),
    Math.round(calculatedMax * 0.5),
    Math.round(calculatedMax * 0.75),
    calculatedMax,
  ];

  // Format tick labels with thousands separator or unit
  const formatTick = (val: number) => {
    if (unit === '%') return `${val}%`;
    if (unit === '‰') return `${val}‰`;
    if (val >= 1000) {
      return val.toLocaleString('id-ID');
    }
    return String(val);
  };

  return (
    <div className={`w-full bg-white my-3 select-none ${className}`}>
      {/* Chart Title matching Gambar No 3: Bold, uppercase, dark navy text */}
      <div className="w-full text-center mb-3">
        <h4 className="text-[10pt] sm:text-[10.5pt] font-black uppercase tracking-wide text-[#0f172a] leading-tight">
          {title}
        </h4>
        {subtitle && (
          <p className="text-[8.5pt] text-slate-500 font-semibold mt-0.5">
            {subtitle}
          </p>
        )}
      </div>

      {/* Main Chart Area with Y-Axis and Plot Area */}
      <div className="w-full flex items-stretch" style={{ height: `${height}px` }}>
        {/* Left Y-Axis labels */}
        <div className="flex flex-col-reverse justify-between pr-2.5 text-right flex-shrink-0 select-none pb-5">
          {ticks.map((t, idx) => (
            <span
              key={idx}
              className="text-[8pt] sm:text-[8.5pt] font-semibold text-[#64748b] leading-none"
            >
              {formatTick(t)}
            </span>
          ))}
        </div>

        {/* Plot Area with Horizontal Gridlines & Standing 3D Bars */}
        <div className="relative flex-1 flex flex-col justify-between">
          {/* Background Horizontal Grid Lines matching Gambar No 3 */}
          <div className="absolute inset-0 flex flex-col-reverse justify-between pointer-events-none pb-5">
            {ticks.map((_, idx) => (
              <div
                key={idx}
                className={`w-full ${
                  idx === 0 
                    ? 'border-b-2 border-[#94a3b8]' // Baseline at y=0
                    : 'border-b border-[#e2e8f0]/90' // Faint gridline
                }`}
                style={{ height: '0px' }}
              />
            ))}
          </div>

          {/* Bar Columns Container */}
          <div className="relative w-full h-full flex items-end justify-around px-2 sm:px-4 z-10 pb-5">
            {data.map((item, idx) => {
              const heightPercent = calculatedMax > 0 
                ? Math.min(Math.max((item.value / calculatedMax) * 100, 0), 100)
                : 0;
              const barColor = item.color || defaultColors[idx % defaultColors.length];
              const displayVal = item.formattedValue || (unit ? `${item.value}${unit}` : item.value.toLocaleString('id-ID'));

              return (
                <div
                  key={idx}
                  className="flex-1 flex flex-col items-center justify-end h-full px-1 max-w-[90px]"
                >
                  {/* Exact Value Label on Top of the Bar in bold dark navy text */}
                  <span className="text-[8.5pt] sm:text-[9.5pt] font-bold text-[#0f172a] mb-1 leading-none tracking-tight">
                    {displayVal}
                  </span>

                  {/* 3D Standing Pillar Bar with Soft Left Cast Shadow matching Gambar No 3 */}
                  <div
                    className="w-full relative transition-all duration-300"
                    style={{
                      height: `${Math.max(heightPercent, 2)}%`,
                      backgroundColor: barColor,
                      filter: 'drop-shadow(-7px 5px 6px rgba(15, 23, 42, 0.24))',
                      minHeight: item.value > 0 ? '4px' : '2px',
                    }}
                  />

                  {/* X-Axis Month / Category Label underneath each bar */}
                  <div className="absolute -bottom-0 transform translate-y-full text-center">
                    <span className="font-bold text-[#0f2942] text-[8pt] sm:text-[9pt] uppercase tracking-wider block mt-1.5 whitespace-nowrap">
                      {item.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Extra bottom spacer for the X-axis labels */}
      <div className="h-4" />
    </div>
  );
}
