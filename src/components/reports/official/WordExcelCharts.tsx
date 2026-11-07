import React from 'react';
import { fmtIdNum } from '@/utils/officialChartNarratives';

export interface WordExcelSeries {
  name: string;
  color: string;
  values: number[];
  marker?: 'circle' | 'square' | 'triangle';
}

interface WordExcelBarChartProps {
  title: string;
  categories: string[];
  series: WordExcelSeries[];
  height?: number;
  className?: string;
  forcedMaxY?: number;
}

export function WordExcelBarChart({
  title,
  categories,
  series,
  height = 135,
  className = '',
  forcedMaxY,
}: WordExcelBarChartProps) {
  const allVals = series.flatMap((s) => s.values);
  const rawMax = Math.max(...allVals, 6);
  const maxY = forcedMaxY || (rawMax <= 14 ? 14 : Math.ceil(rawMax / 5) * 5);
  const step = maxY <= 14 ? 2 : Math.ceil(maxY / 6);
  const ticks: number[] = [];
  for (let t = 0; t <= maxY; t += step) {
    ticks.push(t);
  }
  if (ticks[ticks.length - 1] < maxY) {
    ticks.push(maxY);
  }

  const chartWidth = 560;
  const paddingLeft = 32;
  const paddingRight = 16;
  const paddingTop = 14;
  const paddingBottom = 16;
  const plotWidth = chartWidth - paddingLeft - paddingRight;
  const plotHeight = height - paddingTop - paddingBottom;

  const getY = (val: number) => {
    const clamped = Math.max(0, Math.min(maxY, val));
    return paddingTop + plotHeight - (clamped / maxY) * plotHeight;
  };

  const baselineY = getY(0);
  const groupWidth = plotWidth / categories.length;
  const barWidth = Math.min(14, (groupWidth * 0.7) / series.length);

  return (
    <div className={`w-full border border-slate-400 bg-white text-black font-sans p-2 ${className}`}>
      <div className="text-center font-bold text-[9pt] leading-tight mb-1 text-slate-800">
        {title}
      </div>

      <div className="w-full flex justify-center">
        <svg
          viewBox={`0 0 ${chartWidth} ${height}`}
          className="w-full h-auto max-h-[145px]"
          style={{ overflow: 'visible' }}
        >
          {/* Horizontal Gridlines */}
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
                  strokeWidth="0.75"
                />
                <text
                  x={paddingLeft - 4}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="7"
                  fill="#475569"
                  fontFamily="sans-serif"
                >
                  {t}
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
                    <g key={sIdx}>
                      <rect
                        x={x}
                        y={barY}
                        width={barWidth - 1}
                        height={barH}
                        fill={s.color}
                        stroke="#475569"
                        strokeWidth="0.5"
                      />
                      {/* Number label on bar */}
                      <text
                        x={x + (barWidth - 1) / 2}
                        y={barY > paddingTop + 8 ? barY - 3 : barY + 7}
                        textAnchor="middle"
                        fontSize="6.5"
                        fontWeight="bold"
                        fill="#0f172a"
                        fontFamily="sans-serif"
                      >
                        {fmtIdNum(val)}
                      </text>
                    </g>
                  );
                })}

                {/* Category Label below X-axis */}
                <text
                  x={groupCenterX}
                  y={baselineY + 11}
                  textAnchor="middle"
                  fontSize="7"
                  fontWeight="bold"
                  fill="#1e293b"
                  fontFamily="sans-serif"
                >
                  {cat}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Integrated Data Table attached to chart */}
      <div className="w-full mt-1">
        <table className="w-full table-fixed border-collapse border border-slate-500 text-center text-[7pt] sm:text-[7.5pt] leading-tight">
          <colgroup>
            <col style={{ width: '22%' }} />
            {categories.map((_, i) => (
              <col key={i} style={{ width: `${(100 - 22) / categories.length}%` }} />
            ))}
          </colgroup>
          <tbody>
            {series.map((s, sIdx) => (
              <tr key={sIdx} className={sIdx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                <td className="border border-slate-400 p-0.5 text-left pl-1.5 font-bold align-middle">
                  <div className="flex items-center gap-1.5 whitespace-nowrap overflow-hidden">
                    <span
                      className="inline-block w-2.5 h-2.5 shrink-0 border border-slate-600"
                      style={{ backgroundColor: s.color }}
                    />
                    <span className="truncate">{s.name}</span>
                  </div>
                </td>
                {s.values.map((v, i) => (
                  <td key={i} className="border border-slate-400 p-0.5 font-medium align-middle">
                    {fmtIdNum(v)}
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

interface WordExcelLineChartProps {
  title: string;
  categories: string[];
  series: WordExcelSeries[];
  height?: number;
  className?: string;
  forcedMaxY?: number;
  customTicks?: number[];
  categoriesInTable?: boolean;
}

export function WordExcelLineChart({
  title,
  categories,
  series,
  height = 135,
  className = '',
  forcedMaxY,
  customTicks,
  categoriesInTable = false,
}: WordExcelLineChartProps) {
  const allVals = series.flatMap((s) => s.values);
  const rawMax = Math.max(...allVals, 4);
  const maxY = forcedMaxY || (rawMax <= 18 ? (rawMax <= 6 ? 6 : 18) : Math.ceil(rawMax / 5) * 5);
  
  let ticks: number[] = [];
  if (customTicks && customTicks.length > 0) {
    ticks = customTicks;
  } else {
    const step = maxY <= 6 ? 1 : maxY <= 18 ? 2 : Math.ceil(maxY / 6);
    for (let t = 0; t <= maxY; t += step) {
      ticks.push(t);
    }
    if (ticks[ticks.length - 1] < maxY) {
      ticks.push(maxY);
    }
  }

  const chartWidth = 560;
  const paddingLeft = 32;
  const paddingRight = 16;
  const paddingTop = 14;
  const paddingBottom = categoriesInTable ? 8 : 16;
  const plotWidth = chartWidth - paddingLeft - paddingRight;
  const plotHeight = height - paddingTop - paddingBottom;

  const getY = (val: number) => {
    const clamped = Math.max(0, Math.min(maxY, val));
    return paddingTop + plotHeight - (clamped / maxY) * plotHeight;
  };

  const getX = (index: number) => {
    if (categories.length <= 1) return paddingLeft + plotWidth / 2;
    return paddingLeft + (index / (categories.length - 1)) * plotWidth;
  };

  const baselineY = getY(0);

  return (
    <div className={`w-full border border-slate-400 bg-white text-black font-sans p-2 ${className}`}>
      <div className="text-center font-bold text-[9pt] leading-tight mb-1 text-slate-800">
        {title}
      </div>

      <div className="w-full flex justify-center">
        <svg
          viewBox={`0 0 ${chartWidth} ${height}`}
          className="w-full h-auto max-h-[145px]"
          style={{ overflow: 'visible' }}
        >
          {/* Horizontal Gridlines */}
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
                  strokeWidth="0.75"
                />
                <text
                  x={paddingLeft - 4}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="7"
                  fill="#475569"
                  fontFamily="sans-serif"
                >
                  {fmtIdNum(t)}
                </text>
              </g>
            );
          })}

          {/* Series Lines and Markers */}
          {series.map((s, sIdx) => {
            const points = s.values.map((v, i) => `${getX(i)},${getY(v)}`).join(' ');
            return (
              <g key={sIdx}>
                <polyline
                  points={points}
                  fill="none"
                  stroke={s.color}
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />

                {s.values.map((val, i) => {
                  const cx = getX(i);
                  const cy = getY(val);
                  
                  // Avoid overlapping duplicate numbers if series 1 has identical value as series 0
                  const isDuplicateZero = sIdx === 1 && series[0]?.values[i] === val;
                  const labelY = sIdx === 0 ? cy - 5 : sIdx === 1 ? cy - 8 : cy - 5;

                  return (
                    <g key={i}>
                      <circle
                        cx={cx}
                        cy={cy}
                        r="3"
                        fill={s.color}
                        stroke="#ffffff"
                        strokeWidth="1"
                      />
                      {!isDuplicateZero && (
                        <text
                          x={cx}
                          y={labelY}
                          textAnchor="middle"
                          fontSize="6.5"
                          fontWeight="bold"
                          fill={s.color}
                          fontFamily="sans-serif"
                        >
                          {fmtIdNum(val)}
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            );
          })}

          {/* X Axis Category Labels (only if not rendered in table) */}
          {!categoriesInTable && categories.map((cat, i) => (
            <text
              key={i}
              x={getX(i)}
              y={baselineY + 11}
              textAnchor="middle"
              fontSize="7"
              fontWeight="bold"
              fill="#1e293b"
              fontFamily="sans-serif"
            >
              {cat}
            </text>
          ))}
        </svg>
      </div>

      {/* Integrated Data Table attached to line chart */}
      <div className="w-full mt-1">
        <table className="w-full table-fixed border-collapse border border-slate-500 text-center text-[7pt] sm:text-[7.5pt] leading-tight">
          <colgroup>
            <col style={{ width: '22%' }} />
            {categories.map((_, i) => (
              <col key={i} style={{ width: `${(100 - 22) / categories.length}%` }} />
            ))}
          </colgroup>
          {categoriesInTable && (
            <thead>
              <tr className="bg-white">
                <th className="border border-slate-400 p-0.5"></th>
                {categories.map((c, i) => (
                  <th key={i} className="border border-slate-400 p-0.5 font-bold text-slate-800 text-center">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {series.map((s, sIdx) => (
              <tr key={sIdx} className={sIdx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                <td className="border border-slate-400 p-0.5 text-left pl-1.5 font-bold align-middle">
                  <div className="flex items-center gap-1.5 whitespace-nowrap overflow-hidden">
                    <span className="relative inline-flex items-center justify-center w-3 h-2 shrink-0">
                      <span className="w-full h-[1.5px]" style={{ backgroundColor: s.color }} />
                      <span className="absolute w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                    </span>
                    <span className="truncate">{s.name}</span>
                  </div>
                </td>
                {s.values.map((v, i) => (
                  <td key={i} className="border border-slate-400 p-0.5 font-medium align-middle">
                    {fmtIdNum(v)}
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
