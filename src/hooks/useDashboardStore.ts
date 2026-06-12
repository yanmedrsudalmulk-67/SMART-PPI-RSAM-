import { create } from 'zustand';

interface DashboardState {
  dashboardData: any;
  setDashboardData: (data: any) => void;
  analyticsData: any;
  setAnalyticsData: (data: any) => void;
  reportsData: any;
  setReportsData: (data: any) => void;
  isDashboardLoaded: boolean;
  isAnalyticsLoaded: boolean;
  isReportsLoaded: boolean;
  isGlobalLoading: boolean;
  setIsGlobalLoading: (loading: boolean) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  dashboardData: null,
  setDashboardData: (data) => set({ dashboardData: data, isDashboardLoaded: true, isGlobalLoading: false }),
  analyticsData: null,
  setAnalyticsData: (data) => set({ analyticsData: data, isAnalyticsLoaded: true }),
  reportsData: null,
  setReportsData: (data) => set({ reportsData: data, isReportsLoaded: true }),
  isDashboardLoaded: false,
  isAnalyticsLoaded: false,
  isReportsLoaded: false,
  isGlobalLoading: false,
  setIsGlobalLoading: (loading) => set({ isGlobalLoading: loading }),
}));
