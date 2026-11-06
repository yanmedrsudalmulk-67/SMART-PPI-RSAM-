import React from 'react';

export interface BarSeries {
  name: string;
  color: string;
  values: number[];
}

interface OfficialGroupedBarChartProps {
  title: string;
  categories: string[];
  series: BarSeries[];
  minY?: number;
  maxY?: number;
  yTicks?: number[];
  height?: number;
  className?: string;
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

export default function OfficialGroupedBarChart({
  title,
  categories,
  series,
  minY = 60,
  maxY = 102,
  yTicks,
  height = 145,
  className = '',
}: OfficialGroupedBarChartProps) {
  const ticks = yTicks || [60, 63, 66, 69, 72, 75, 78, 81, 84, 87, 90, 93, 96, 99, 102];
  const chartWidth = 560;
  const paddingLeft = 32;
  const paddingRight = 14;
  const paddingTop = 15;
  const paddingBottom = 15;
  const plotWidth = chartWidth - paddingLeft - paddingRight;
  const plotHeight = height - paddingTop - paddingBottom;

  const groupWidth = plotWidth / categories.length;
  const barWidth = Math.min(10, (groupWidth * 0.75) / series.length);

  const getY = (val: number) => {
    const range = maxY - minY || 1;
    const clamped = Math.max(minY, Math.min(maxY, val));
    return paddingTop + plotHeight - ((clamped - minY) / range) * plotHeight;
  };

  const baselineY = getY(minY);

  return (
    <div className={`w-full border border-black p-2 bg-white text-black font-sans my-1.5 ${className}`}>
      {/* Title */}
      <div className="text-center font-bold text-[8.5pt] sm:text-[9pt] leading-tight mb-1 text-black uppercase">
        {title}
      </div>

      {/* SVG Bar Area */}
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
                  stroke="#e2e8f0"
                  strokeWidth="0.8"
                />
                <text
                  x={paddingLeft - 4}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="7"
                  fill="#475569"
                  fontFamily="sans-serif"
                >
                  {t}%
                </text>
              </g>
            );
          })}

          {/* Grouped Bars */}
          {categories.map((cat, catIdx) => {
            const groupCenterX = paddingLeft + catIdx * groupWidth + groupWidth / 2;
            const totalBarsWidth = series.length * barWidth;
            const startX = groupCenterX - totalBarsWidth / 2;

            return (
              <g key={catIdx}>
                {series.map((s, sIdx) => {
                  const val = s.values[catIdx] ?? 0;
                  const barY = getY(val);
                  const barH = Math.max(0, baselineY - barY);
                  const x = startX + sIdx * barWidth;

                  return (
                    <rect
                      key={sIdx}
                      x={x}
                      y={barY}
                      width={barWidth - 1}
                      height={barH}
                      fill={s.color}
                      rx="0.5"
                    />
                  );
                })}

                {/* Category X Label */}
                <text
                  x={groupCenterX}
                  y={baselineY + 11}
                  textAnchor="middle"
                  fontSize="7"
                  fill="#0f172a"
                  fontWeight="bold"
                  fontFamily="sans-serif"
                >
                  {formatCategory(cat)}
                </text>
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
          <tbody>
            {series.map((s, sIdx) => (
              <tr key={sIdx}>
                <td className="border border-black p-0.5 text-left pl-1.5 font-bold align-middle">
                  <div className="flex items-center gap-1.5 whitespace-nowrap overflow-hidden">
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-sm shrink-0"
                      style={{ backgroundColor: s.color }}
                    />
                    <span className="truncate">{s.name}</span>
                  </div>
                </td>
                {s.values.map((v, i) => (
                  <td key={i} className="border border-black p-0.5 font-medium align-middle">
                    {v}%
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
