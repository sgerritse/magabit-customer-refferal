import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminSwitch } from '@/contexts/AdminSwitchContext';

export interface PointsEntry {
  id: string;
  points: number;
  reason: string;
  source_type: string;
  source_id: string | null;
  created_at: string;
}

export interface BadgeEntry {
  id: string;
  badge_id: string;
  badge_name: string;
  badge_icon: string;
  badge_description: string;
  points_awarded: number;
  earned_at: string;
}

interface StatsContextType {
  pointsHistory: PointsEntry[];
  badges: BadgeEntry[];
  totalPoints: number;
  loading: boolean;
  refreshStats: () => Promise<void>;
  addPoints: (points: number, reason: string, sourceType?: string, sourceId?: string) => Promise<boolean>;
  awardBadge: (badgeId: string, badgeName: string, badgeIcon: string, badgeDescription: string, pointsAwarded?: number) => Promise<boolean>;
}

const StatsContext = createContext<StatsContextType | undefined>(undefined);

export const StatsProvider = ({ children }: { children: ReactNode }) => {
  const [pointsHistory, setPointsHistory] = useState<PointsEntry[]>([]);
  const [badges, setBadges] = useState<BadgeEntry[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const { isInUserMode, switchedUserId } = useAdminSwitch();

  const getUserId = useCallback(async () => {
    if (isInUserMode && switchedUserId) {
      return switchedUserId;
    }
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id || null;
  }, [isInUserMode, switchedUserId]);

  const fetchUserStats = useCallback(async () => {
    const currentUserId = await getUserId();
    
    if (!currentUserId) {
      setLoading(false);
      return;
    }

    if (userId === currentUserId && !loading) {
      return;
    }

    setLoading(true);
    setUserId(currentUserId);

    try {
      const [pointsResult, badgesResult] = await Promise.all([
        supabase
          .from('user_points')
          .select('*')
          .eq('user_id', currentUserId)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('user_badges')
          .select('*')
          .eq('user_id', currentUserId)
          .order('earned_at', { ascending: false })
      ]);

      if (!pointsResult.error) {
        setPointsHistory(pointsResult.data || []);
        const total = (pointsResult.data || []).reduce((sum, entry) => sum + entry.points, 0);
        setTotalPoints(total);
      }

      if (!badgesResult.error) {
        setBadges(badgesResult.data || []);
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setLoading(false);
    }
  }, [getUserId, userId, loading]);

  const addPoints = async (points: number, reason: string, sourceType: string = 'manual', sourceId?: string) => {
    const currentUserId = await getUserId();
    if (!currentUserId) return false;

    try {
      const { data, error } = await supabase
        .from('user_points')
        .insert({
          user_id: currentUserId,
          points,
          reason,
          source_type: sourceType,
          source_id: sourceId
        })
        .select()
        .single();

      if (error) return false;

      if (data) {
        setPointsHistory(prev => [data, ...prev]);
        setTotalPoints(prev => prev + points);
      }
      return true;
    } catch (error) {
      return false;
    }
  };

  const awardBadge = async (
    badgeId: string, 
    badgeName: string, 
    badgeIcon: string, 
    badgeDescription: string, 
    pointsAwarded: number = 0
  ) => {
    const currentUserId = await getUserId();
    if (!currentUserId) return false;

    try {
      const { data: existingBadge } = await supabase
        .from('user_badges')
        .select('id')
        .eq('user_id', currentUserId)
        .eq('badge_id', badgeId)
        .single();

      if (existingBadge) return false;

      const { data, error } = await supabase
        .from('user_badges')
        .insert({
          user_id: currentUserId,
          badge_id: badgeId,
          badge_name: badgeName,
          badge_icon: badgeIcon,
          badge_description: badgeDescription,
          points_awarded: pointsAwarded
        })
        .select()
        .single();

      if (error) return false;

      if (data) {
        setBadges(prev => [data, ...prev]);
        setTotalPoints(prev => prev + pointsAwarded);
      }
      return true;
    } catch (error) {
      return false;
    }
  };

  useEffect(() => {
    fetchUserStats();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          fetchUserStats();
        } else if (event === 'SIGNED_OUT') {
          setPointsHistory([]);
          setBadges([]);
          setTotalPoints(0);
          setUserId(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [isInUserMode, switchedUserId]);

  return (
    <StatsContext.Provider value={{
      pointsHistory,
      badges,
      totalPoints,
      loading,
      refreshStats: fetchUserStats,
      addPoints,
      awardBadge
    }}>
      {children}
    </StatsContext.Provider>
  );
};

export const useStats = () => {
  const context = useContext(StatsContext);
  if (!context) {
    throw new Error('useStats must be used within StatsProvider');
  }
  return context;
};
