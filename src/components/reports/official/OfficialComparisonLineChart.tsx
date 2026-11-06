import React from 'react';

export interface LineSeries {
  name: string;
  color: string;
  marker: 'circle' | 'square' | 'triangle';
  values: number[];
}

interface OfficialComparisonLineChartProps {
  title: string;
  categories: string[];
  series: LineSeries[];
  minY?: number;
  maxY?: number;
  yTicks?: number[];
  height?: number;
  className?: string;
  unit?: string;
  formatValue?: (val: number) => string;
  hideValueLabels?: boolean;
}

const MONTH_SHORT_MAP: Record<string, string> = {
  'JANUARI': 'JAN',
  'FEBRUARI': 'FEB',
  'MARET': 'MAR',
  'APRIL': 'APR',
  'MEI': 'MEI',
  'JUNI': 'JUN',
  'JULI': 'JUL',
  'AGUSTUS': 'AGUST',
  'SEPTEMBER': 'SEP',
  'OKTOBER': 'OKT',
  'NOVEMBER': 'NOV',
  'DESEMBER': 'DES',
  // Variants & typos
  'JUM': 'JUN',
  'AGSTS': 'AGUST',
  'SEPT': 'SEP',
  'SIP': 'SEP',
  'OKTBR': 'OKT',
  'NOPMBR': 'NOV',
  'DESMBR': 'DES',
  'DIS': 'DES',
};

function formatCategory(cat: string): string {
  const upper = cat.trim().toUpperCase();
  return MONTH_SHORT_MAP[upper] || cat;
}

export default function OfficialComparisonLineChart({
  title,
  categories,
  series,
  minY = 0,
  maxY = 100,
  yTicks,
  height = 145,
  className = '',
  unit = '%',
  formatValue,
  hideValueLabels = false,
}: OfficialComparisonLineChartProps) {
  const ticks = yTicks || [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  const chartWidth = 560;
  const paddingLeft = 34;
  const paddingRight = 18;
  const paddingTop = 20;
  const paddingBottom = 15;
  const plotWidth = chartWidth - paddingLeft - paddingRight;
  const plotHeight = height - paddingTop - paddingBottom;

  const defaultFormat = (val: number) => {
    if (formatValue) return formatValue(val);
    const str = val.toString().replace('.', ',');
    return unit ? `${str}${unit}` : str;
  };

  const getX = (index: number) => {
    if (categories.length <= 1) return paddingLeft + plotWidth / 2;
    return paddingLeft + (index / (categories.length - 1)) * plotWidth;
  };

  const getY = (val: number) => {
    const range = maxY - minY || 1;
    const clamped = Math.max(minY, Math.min(maxY, val));
    return paddingTop + plotHeight - ((clamped - minY) / range) * plotHeight;
  };

  return (
    <div className={`w-full border border-black p-2 bg-white text-black font-sans my-1.5 ${className}`}>
      {/* Title inside chart */}
      <div className="text-center font-bold text-[8.5pt] sm:text-[9pt] leading-tight mb-1 text-black">
        {title}
      </div>

      {/* SVG Plot Area */}
      <div className="w-full flex justify-center">
        <svg
          viewBox={`0 0 ${chartWidth} ${height}`}
          className="w-full h-auto max-h-[155px]"
          style={{ overflow: 'visible' }}
        >
          {/* Horizontal Gridlines & Y-Axis Labels */}
          {ticks.map((t) => {
            const y = getY(t);
            return (
              <g key={t}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={chartWidth - paddingRight}
                  y2={y}
                  stroke="#cbd5e1"
                  strokeWidth="0.8"
                />
                <text
                  x={paddingLeft - 4}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="7.5"
                  fill="#475569"
                  fontFamily="sans-serif"
                >
                  {t}
                </text>
              </g>
            );
          })}

          {/* Series Lines and Points */}
          {series.map((s, sIdx) => {
            const points = s.values.map((v, i) => `${getX(i)},${getY(v)}`).join(' ');
            return (
              <g key={sIdx}>
                {/* Connecting Polyline */}
                <polyline
                  points={points}
                  fill="none"
                  stroke={s.color}
                  strokeWidth="2.2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />

                {/* Markers & Labels */}
                {s.values.map((val, i) => {
                  const cx = getX(i);
                  const cy = getY(val);
                  // Label offset: series 0 (blue) above, series 1 (orange) below, series 2 (gray target) centered above
                  const isFirst = sIdx === 0;
                  const isSecond = sIdx === 1;
                  const labelY = isFirst ? cy - 6 : isSecond ? cy + 10 : cy - 5;

                  return (
                    <g key={i}>
                      {s.marker === 'circle' && (
                        <circle cx={cx} cy={cy} r="3.2" fill={s.color} stroke="#ffffff" strokeWidth="1" />
                      )}
                      {s.marker === 'square' && (
                        <rect x={cx - 3} y={cy - 3} width="6" height="6" fill={s.color} stroke="#ffffff" strokeWidth="1" />
                      )}
                      {s.marker === 'triangle' && (
                        <polygon
                          points={`${cx},${cy - 3.5} ${cx - 3.5},${cy + 3} ${cx + 3.5},${cy + 3}`}
                          fill={s.color}
                          stroke="#ffffff"
                          strokeWidth="0.8"
                        />
                      )}
                      {/* Value label on point */}
                      {!hideValueLabels && (
                        <text
                          x={cx}
                          y={labelY}
                          textAnchor="middle"
                          fontSize="6.5"
                          fontWeight="bold"
                          fill={s.color}
                          fontFamily="sans-serif"
                        >
                          {val.toString().replace('.', ',')}{unit === '%' ? '%' : ''}
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Integrated Data Table attached to chart */}
      <div className="w-full mt-1 overflow-x-auto">
        <table 
          className="w-full table-fixed border-collapse border border-black text-center text-[7pt] sm:text-[7.5pt] leading-tight"
          style={{ borderCollapse: 'collapse' }}
        >
          <colgroup>
            <col style={{ width: categories.length === 12 ? '16%' : '24%' }} />
            {categories.map((_, i) => (
              <col 
                key={i} 
                style={{ 
                  width: categories.length === 12 
                    ? '7%' 
                    : `${(100 - 24) / categories.length}%` 
                }} 
              />
            ))}
          </colgroup>
          <thead>
            <tr className="bg-slate-50 font-bold">
              <th className="border border-black p-0.5 text-left pl-1.5"></th>
              {categories.map((cat, i) => (
                <th key={i} className="border border-black p-0.5 uppercase tracking-tight text-center font-bold">
                  {formatCategory(cat)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {series.map((s, sIdx) => (
              <tr key={sIdx}>
                <td className="border border-black p-0.5 text-left pl-1.5 font-bold align-middle">
                  <div className="flex items-center gap-1.5 whitespace-nowrap overflow-hidden">
                    <span
                      className="inline-block w-3 h-1.5 rounded-sm shrink-0"
                      style={{ backgroundColor: s.color }}
                    />
                    <span className="truncate">{s.name}</span>
                  </div>
                </td>
                {s.values.map((v, i) => (
                  <td key={i} className="border border-black p-0.5 font-medium align-middle">
                    {defaultFormat(v)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
