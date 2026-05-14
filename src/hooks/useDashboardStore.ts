import { create } from 'zustand';

interface DashboardState {
  dashboardData: any;
  setDashboardData: (data: any) => void;
  analyticsData: any;
  setAnalyticsData: (data: any) => void;
  isDashboardLoaded: boolean;
  isAnalyticsLoaded: boolean;
  isGlobalLoading: boolean;
  setIsGlobalLoading: (loading: boolean) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  dashboardData: null,
  setDashboardData: (data) => set({ dashboardData: data, isDashboardLoaded: true, isGlobalLoading: false }),
  analyticsData: null,
  setAnalyticsData: (data) => set({ analyticsData: data, isAnalyticsLoaded: true }),
  isDashboardLoaded: false,
  isAnalyticsLoaded: false,
  isGlobalLoading: false,
  setIsGlobalLoading: (loading) => set({ isGlobalLoading: loading }),
}));
