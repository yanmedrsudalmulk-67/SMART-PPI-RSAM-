import dynamic from 'next/dynamic';
import React, { useState, useEffect, useRef } from 'react';

const RechartsResponsiveContainer = dynamic(
  () => import('recharts').then((mod) => mod.ResponsiveContainer),
  { ssr: false }
);

export const ResponsiveContainer = ({ children, width = '100%', height = '100%', minHeight, minWidth, ...props }: any) => {
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ width, height, minHeight, minWidth }} className="recharts-lazy-wrapper">
      {inView ? <RechartsResponsiveContainer width={width} height={height} minHeight={minHeight} minWidth={minWidth} {...props}>{children}</RechartsResponsiveContainer> : null}
    </div>
  );
};

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
  Cell,
  LabelList
} from 'recharts';
