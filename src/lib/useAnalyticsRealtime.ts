import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface AuditSession {
  id: string;
  indikator_id: string;
  nama_indikator: string;
  kategori?: string;
  tanggal_waktu: string;
  observer: string;
  unit: string;
  profesi?: string;
  jenis_tindakan?: string;
  jumlah_dinilai: number;
  jumlah_patuh: number;
  persentase: number;
  data_indikator?: any;
}

export function useAnalyticsRealtime() {
  const [sessions, setSessions] = useState<AuditSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSessionData = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('audit_sessions')
          .select('*')
          // Optional: order by date
          .order('tanggal_waktu', { ascending: false })
          // Limit or no limit? For analytics, we probably want all relevant data
          .limit(10000); 

        if (!error && data) {
          setSessions(data);
        }
      } catch (err) {
        console.error("Error fetching sessions for analytics:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessionData();

    // Supabase Realtime Subscription
    const handlePayload = (payload: any) => {
      if (payload.eventType === 'INSERT') {
        setSessions(prev => [payload.new as AuditSession, ...prev]);
      } else if (payload.eventType === 'UPDATE') {
        setSessions(prev => prev.map(s => s.id === payload.new.id ? (payload.new as AuditSession) : s));
      } else if (payload.eventType === 'DELETE') {
        setSessions(prev => prev.filter(s => s.id !== payload.old.id));
      }
    };

    const channel = supabase.channel('realtime_analytics_sessions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'audit_sessions' }, handlePayload)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { sessions, isLoading };
}
