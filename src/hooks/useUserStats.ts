import { useState, useEffect, useCallback, useMemo } from 'react';
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

export const useUserStats = () => {
  const [pointsHistory, setPointsHistory] = useState<PointsEntry[]>([]);
  const [badges, setBadges] = useState<BadgeEntry[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const { isInUserMode, switchedUserId } = useAdminSwitch();

  // Get authenticated user ID or switched user ID - memoized to prevent unnecessary calls
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
      if (process.env.NODE_ENV === 'development') {
        console.log('🚫 No authenticated user found');
      }
      setLoading(false);
      return;
    }

    // Prevent duplicate calls for the same user
    if (userId === currentUserId && !loading) {
      return;
    }

    setLoading(true);
    setUserId(currentUserId);
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Fetching user stats for user:', currentUserId);
    }

    try {
      // Fetch points history
      const { data: points, error: pointsError } = await supabase
        .from('user_points')
        .select('*')
        .eq('user_id', currentUserId)
        .order('created_at', { ascending: false })
        .limit(50); // Latest 50 entries

      if (pointsError) {
        console.error('❌ Error fetching points:', pointsError);
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Points fetched:', points?.length || 0, 'entries');
        }
        setPointsHistory(points || []);
        const total = (points || []).reduce((sum, entry) => sum + entry.points, 0);
        setTotalPoints(total);
        if (process.env.NODE_ENV === 'development') {
          console.log('💰 Total points calculated:', total);
        }
      }

      // Fetch badges
      const { data: badgeData, error: badgesError } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', currentUserId)
        .order('earned_at', { ascending: false });

      if (badgesError) {
        console.error('❌ Error fetching badges:', badgesError);
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.log('🏆 Badges fetched:', badgeData?.length || 0, 'badges');
        }
        setBadges(badgeData || []);
      }
    } catch (error) {
      console.error('💥 Error fetching user stats:', error);
    } finally {
      setLoading(false);
    }
  }, [getUserId, userId, loading]);

  const addPoints = async (points: number, reason: string, sourceType: string = 'manual', sourceId?: string) => {
    const currentUserId = await getUserId();
    
    if (!currentUserId) {
      console.error('🚫 No authenticated user found for adding points');
      return false;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('💰 Adding points:', { points, reason, sourceType, userId: currentUserId });
    }

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

      if (error) {
        console.error('❌ Error adding points:', error);
        return false;
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Points added successfully:', data);
      }
      // Update local state
      if (data) {
        setPointsHistory(prev => [data, ...prev]);
        setTotalPoints(prev => prev + points);
      }
      return true;
    } catch (error) {
      console.error('💥 Error adding points:', error);
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
    
    if (!currentUserId) {
      console.error('🚫 No authenticated user found for awarding badge');
      return false;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('🏆 Awarding badge:', { badgeId, badgeName, pointsAwarded, userId: currentUserId });
    }

    try {
      // Check if user already has this badge
      const { data: existingBadge } = await supabase
        .from('user_badges')
        .select('id')
        .eq('user_id', currentUserId)
        .eq('badge_id', badgeId)
        .single();

      if (existingBadge) {
        if (process.env.NODE_ENV === 'development') {
          console.log('⚠️ User already has this badge:', badgeId);
        }
        return false;
      }

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

      if (error) {
        console.error('❌ Error awarding badge:', error);
        return false;
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('🎉 Badge awarded successfully:', data);
      }
      // Update local state
      if (data) {
        setBadges(prev => [data, ...prev]);
        // Points will be automatically added by the database trigger
        setTotalPoints(prev => prev + pointsAwarded);
      }
      return true;
    } catch (error) {
      console.error('💥 Error awarding badge:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchUserStats();
    
    // Listen for auth state changes
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
  }, [fetchUserStats]);

  // Refresh data when admin switch context changes
  useEffect(() => {
    fetchUserStats();
  }, [fetchUserStats]);

  return {
    pointsHistory,
    badges,
    totalPoints,
    loading,
    addPoints,
    awardBadge,
    refreshStats: fetchUserStats
  };
};