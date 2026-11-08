import React from 'react';
import { fmtIdNum } from '@/utils/officialChartNarratives';

export interface WordExcelSeries {
  name: string;
  color: string;
  values: (number | null)[];
  marker?: 'circle' | 'square' | 'triangle';
}

interface WordExcelBarChartProps {
  title: string;
  categories: string[];
  series: WordExcelSeries[];
  height?: number;
  className?: string;
  forcedMinY?: number;
  forcedMaxY?: number;
  customTicks?: number[];
  unit?: string;
  showTable?: boolean;
  legendBottom?: boolean;
}

export function WordExcelBarChart({
  title,
  categories,
  series,
  height = 135,
  className = '',
  forcedMinY,
  forcedMaxY,
  customTicks,
  unit = '',
  showTable = true,
  legendBottom = false,
}: WordExcelBarChartProps) {
  const allVals = series.flatMap((s) => s.values.filter((v): v is number => v !== null));
  const rawMax = Math.max(...allVals, 6);
  const effectiveMinY = forcedMinY ?? 0;
  const maxY = forcedMaxY || (rawMax <= 14 ? 14 : Math.ceil(rawMax / 5) * 5);
  
  let ticks: number[] = [];
  if (customTicks && customTicks.length > 0) {
    ticks = customTicks;
  } else {
    const step = maxY <= 14 ? 2 : Math.ceil((maxY - effectiveMinY) / 6);
    for (let t = effectiveMinY; t <= maxY; t += step) {
      ticks.push(t);
    }
    if (ticks[ticks.length - 1] < maxY) {
      ticks.push(maxY);
    }
  }

  const chartWidth = 560;
  const paddingLeft = showTable && !legendBottom ? 65 : 38;
  const paddingRight = showTable && !legendBottom ? 12 : 16;
  const paddingTop = 14;
  const paddingBottom = showTable && !legendBottom ? 8 : 16;
  const plotWidth = chartWidth - paddingLeft - paddingRight;
  const plotHeight = height - paddingTop - paddingBottom;
  const yRange = maxY - effectiveMinY || 1;

  const getY = (val: number) => {
    const clamped = Math.max(effectiveMinY, Math.min(maxY, val));
    return paddingTop + plotHeight - ((clamped - effectiveMinY) / yRange) * plotHeight;
  };

  const baselineY = getY(effectiveMinY);
  const groupWidth = plotWidth / categories.length;
  const maxBarW = categories.length <= 6 ? 20 : 13;
  const barWidth = Math.min(maxBarW, (groupWidth * 0.75) / series.length);

  return (
    <div className={`w-full border border-slate-400 bg-white text-black font-sans p-2 ${className}`}>
      <div className="text-center font-bold text-[10.5pt] leading-tight mb-1.5 text-slate-900">
        {title}
      </div>

      <div className="w-full flex justify-center">
        <svg
          viewBox={`0 0 ${chartWidth} ${height}`}
          className="w-full h-auto max-h-[155px]"
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
                  fontSize="6.5"
                  fill="#475569"
                  fontFamily="sans-serif"
                >
                  {fmtIdNum(t)}{unit}
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
                  const rawVal = s.values[catIdx];
                  if (rawVal === null || rawVal === undefined) {
                    return null;
                  }
                  const val = rawVal;
                  const x = startX + sIdx * barWidth;

                  // Zero value handling: if showTable (e.g. Gambar 4), show '0' above baseline
                  if (val === 0) {
                    if (showTable) {
                      return (
                        <g key={sIdx}>
                          <text
                            x={x + (barWidth - 1) / 2}
                            y={baselineY - 3}
                            textAnchor="middle"
                            fontSize="7"
                            fontWeight="bold"
                            fill="#1e293b"
                            fontFamily="sans-serif"
                          >
                            0
                          </text>
                        </g>
                      );
                    }
                    return null;
                  }

                  const barY = getY(val);
                  const barH = Math.max(0, baselineY - barY);

                  // Data label positioning: prevent collision when bars are narrow & close (e.g. APD in Gambar 5)
                  let labelY = barY - 3;
                  let labelFill = '#0f172a';
                  let labelFontSize = categories.length <= 6 ? '7.5' : '6';

                  if (legendBottom && categories.length >= 10 && series.length >= 2) {
                    if (sIdx === 0) {
                      // Series 0 (Pencapaian): placed above the bar
                      labelY = barY - 3;
                      labelFill = '#1e3a8a';
                      labelFontSize = '5.5';
                    } else {
                      // Series 1 (Target): placed INSIDE top of bar in white text
                      labelY = barY + 8;
                      labelFill = '#ffffff';
                      labelFontSize = '5.5';
                    }
                  }

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
                        rx="1"
                        ry="1"
                      />
                      {/* Number label on bar */}
                      <text
                        x={x + (barWidth - 1) / 2}
                        y={labelY}
                        textAnchor="middle"
                        fontSize={labelFontSize}
                        fontWeight="bold"
                        fill={labelFill}
                        fontFamily="sans-serif"
                      >
                        {fmtIdNum(val)}{unit}
                      </text>
                    </g>
                  );
                })}

                {/* Category Label below X-axis (only if table is not shown) */}
                {!showTable && (
                  <text
                    x={groupCenterX}
                    y={baselineY + 11}
                    textAnchor="middle"
                    fontSize="6.5"
                    fontWeight="bold"
                    fill="#1e293b"
                    fontFamily="sans-serif"
                  >
                    {cat}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Optional bottom centered legend matching Word/Excel (Image 2) */}
      {legendBottom && (
        <div className="flex justify-center items-center gap-4 mt-2 text-[7.5pt] font-sans">
          {series.map((s, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 inline-block shrink-0" style={{ backgroundColor: s.color }} />
              <span className="text-slate-700 font-medium">{s.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* Integrated Data Table attached to chart (Gambar No 4) */}
      {showTable && !legendBottom && (
        <div className="w-full mt-1">
          <table className="w-full table-fixed border-collapse border border-slate-500 text-center text-[7pt] sm:text-[7.5pt] leading-tight">
            <colgroup>
              <col style={{ width: `${(paddingLeft / chartWidth) * 100}%` }} />
              {categories.map((_, i) => (
                <col key={i} style={{ width: `${((plotWidth / categories.length) / chartWidth) * 100}%` }} />
              ))}
              {paddingRight > 0 && <col style={{ width: `${(paddingRight / chartWidth) * 100}%` }} />}
            </colgroup>
            <thead>
              <tr className="bg-white font-bold">
                <th className="border border-slate-400 p-0.5"></th>
                {categories.map((cat, i) => (
                  <th key={i} className="border border-slate-400 p-0.5 text-slate-800 font-bold">
                    {cat}
                  </th>
                ))}
                {paddingRight > 0 && <th className="border-0 p-0"></th>}
              </tr>
            </thead>
            <tbody>
              {series.map((s, sIdx) => (
                <tr key={sIdx} className="bg-white">
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
                      {v !== null && v !== undefined ? `${fmtIdNum(v)}${unit}` : '-'}
                    </td>
                  ))}
                  {paddingRight > 0 && <td className="border-0 p-0"></td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

interface WordExcelLineChartProps {
  title: string;
  categories: string[];
  series: WordExcelSeries[];
  height?: number;
  className?: string;
  forcedMinY?: number;
  forcedMaxY?: number;
  customTicks?: number[];
  categoriesInTable?: boolean;
  unit?: string;
  showTable?: boolean;
  xAxisLabel?: string;
  boxCategories?: boolean;
}

export function WordExcelLineChart({
  title,
  categories,
  series,
  height = 135,
  className = '',
  forcedMinY,
  forcedMaxY,
  customTicks,
  categoriesInTable = false,
  unit = '',
  showTable = true,
  xAxisLabel,
  boxCategories = false,
}: WordExcelLineChartProps) {
  const allVals = series.flatMap((s) => s.values.filter((v): v is number => v !== null));
  const rawMax = Math.max(...allVals, 4);
  const effectiveMinY = forcedMinY ?? 0;
  const maxY = forcedMaxY || (rawMax <= 18 ? (rawMax <= 6 ? 6 : 18) : Math.ceil(rawMax / 5) * 5);
  
  let ticks: number[] = [];
  if (customTicks && customTicks.length > 0) {
    ticks = customTicks;
  } else {
    const step = maxY <= 6 ? 1 : maxY <= 18 ? 2 : Math.ceil((maxY - effectiveMinY) / 6);
    for (let t = effectiveMinY; t <= maxY; t += step) {
      ticks.push(t);
    }
    if (ticks[ticks.length - 1] < maxY) {
      ticks.push(maxY);
    }
  }

  const chartWidth = 560;
  const paddingLeft = unit ? 38 : 32;
  const paddingRight = 16;
  const paddingTop = 14;
  const paddingBottom = (categoriesInTable || boxCategories) ? 8 : 16;
  const plotWidth = chartWidth - paddingLeft - paddingRight;
  const plotHeight = height - paddingTop - paddingBottom;
  const yRange = maxY - effectiveMinY || 1;

  const getY = (val: number) => {
    const clamped = Math.max(effectiveMinY, Math.min(maxY, val));
    return paddingTop + plotHeight - ((clamped - effectiveMinY) / yRange) * plotHeight;
  };

  const getX = (index: number) => {
    if (categories.length <= 1) return paddingLeft + plotWidth / 2;
    return paddingLeft + (index / (categories.length - 1)) * plotWidth;
  };

  const baselineY = getY(effectiveMinY);

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
                  fontSize="6.5"
                  fill="#475569"
                  fontFamily="sans-serif"
                >
                  {fmtIdNum(t)}{unit}
                </text>
              </g>
            );
          })}

          {/* Series Lines and Markers */}
          {series.map((s, sIdx) => {
            const validPoints = s.values
              .map((v, i) => (v !== null ? `${getX(i)},${getY(v)}` : null))
              .filter(Boolean)
              .join(' ');

            return (
              <g key={sIdx}>
                <polyline
                  points={validPoints}
                  fill="none"
                  stroke={s.color}
                  strokeWidth="2.2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />

                {s.values.map((rawVal, i) => {
                  if (rawVal === null) return null;
                  const val = rawVal;
                  const cx = getX(i);
                  const cy = getY(val);
                  
                  // Avoid overlapping duplicate numbers if series 1 has identical value as series 0
                  const isDuplicateZero = sIdx === 1 && series[0]?.values[i] === val;
                  // If sIdx === 0 and top line, place above; if sIdx === 1 and below, place below
                  const labelY = sIdx === 0 ? cy - 5 : cy + 10;

                  return (
                    <g key={i}>
                      <circle
                        cx={cx}
                        cy={cy}
                        r="3.5"
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
                          {fmtIdNum(val)}{unit}
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            );
          })}

          {/* X Axis Category Labels (only if not rendered in table or box) */}
          {!categoriesInTable && !boxCategories && categories.map((cat, i) => (
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

      {/* Excel-style boxed category row + X-axis label (Image 1) */}
      {boxCategories && (
        <div className="w-full mt-1.5 px-6">
          <table className="w-full border-collapse border border-slate-400 text-center text-[7.5pt] leading-tight">
            <tbody>
              <tr>
                {categories.map((c, i) => (
                  <td key={i} className="border border-slate-400 py-1 px-2 font-medium text-slate-800">
                    {c}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
          {xAxisLabel && (
            <div className="text-center text-[7.5pt] font-medium text-slate-700 mt-1">
              {xAxisLabel}
            </div>
          )}
        </div>
      )}

      {/* Integrated Data Table attached to line chart */}
      {showTable && !boxCategories && (
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
                      {v !== null ? `${fmtIdNum(v)}${unit}` : '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
