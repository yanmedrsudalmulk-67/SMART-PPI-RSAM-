import dynamic from 'next/dynamic';

export const ResponsiveContainer = dynamic(
  () => import('recharts').then((mod) => mod.ResponsiveContainer),
  { ssr: false }
);

export { 
  ComposedChart, 
  BarChart, 
  AreaChart, 
  PieChart, 
  Bar, 
  Area, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ReferenceLine, 
  Pie, 
  Cell 
} from 'recharts';
