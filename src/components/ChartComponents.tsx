import dynamic from 'next/dynamic';
import React from 'react';
import { 
  Bar as RechartsBar, 
  Area as RechartsArea, 
  Line as RechartsLine, 
  XAxis as RechartsXAxis, 
  YAxis as RechartsYAxis, 
  CartesianGrid as RechartsCartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend as RechartsLegend, 
  ReferenceLine as RechartsReferenceLine,
  Pie as RechartsPie, 
  Cell as RechartsCell
} from 'recharts';

const ResponsiveContainerComponent = dynamic<any>(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false });
const ComposedChartComponent = dynamic<any>(() => import('recharts').then(m => m.ComposedChart), { ssr: false });
const BarChartComponent = dynamic<any>(() => import('recharts').then(m => m.BarChart), { ssr: false });
const AreaChartComponent = dynamic<any>(() => import('recharts').then(m => m.AreaChart), { ssr: false });
const PieChartComponent = dynamic<any>(() => import('recharts').then(m => m.PieChart), { ssr: false });

export const ResponsiveContainer = (props: any) => <ResponsiveContainerComponent {...props} />;
export const ComposedChart = (props: any) => <ComposedChartComponent {...props} />;
export const BarChart = (props: any) => <BarChartComponent {...props} />;
export const AreaChart = (props: any) => <AreaChartComponent {...props} />;
export const PieChart = (props: any) => <PieChartComponent {...props} />;

export const Bar = RechartsBar;
export const Area = RechartsArea;
export const Line = RechartsLine;
export const XAxis = RechartsXAxis;
export const YAxis = RechartsYAxis;
export const CartesianGrid = RechartsCartesianGrid;
export const Tooltip = RechartsTooltip;
export const Legend = RechartsLegend;
export const ReferenceLine = RechartsReferenceLine;
export const Pie = RechartsPie;
export const Cell = RechartsCell;
