import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAdminSwitch } from '@/contexts/AdminSwitchContext';

export interface Challenge {
  id: number;
  title: string;
  description: string;
  tip: string;
  ordering: number;
  video_url?: string;
  badges: number[];
  reactions: number[];
  parentReactions: number[];
  pointsEarned: number;
  pointsBonus: number;
  shopPoints: number;
  imagePoints: number;
  videoPoints: number;
  audioPoints: number;
  shopButtonEnabled: boolean;
  shopType: 'general' | 'product' | 'none';
  shopProductId: string;
  shopUrl: string;
  wooCommerceProductId: string;
  submissionTypes: {
    image: boolean;
    video: boolean;
    audio: boolean;
    text: boolean;
  };
}

export const useChallenges = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [completedChallenges, setCompletedChallenges] = useState<number[]>([]);
  const [todaysChallenge, setTodaysChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { isInUserMode, switchedUserId } = useAdminSwitch();

  // Load completed challenges from Supabase
  useEffect(() => {
    const fetchCompletedChallenges = async () => {
      if (!user) return;
      
      const effectiveUserId = (isInUserMode && switchedUserId) ? switchedUserId : user.id;
      
      const { data, error } = await supabase
        .from('answer_logs')
        .select('challenge_id')
        .eq('user_id', effectiveUserId);
      
      if (!error && data) {
        const completedIds = [...new Set(data.map(log => log.challenge_id))];
        setCompletedChallenges(completedIds);
      }
    };

    fetchCompletedChallenges();
  }, [user, isInUserMode, switchedUserId]);

  // Load challenges from database
  useEffect(() => {
    const loadChallenges = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('challenges')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          const mappedChallenges: Challenge[] = data.map((c: any) => ({
            id: parseInt(c.challenge_id) || c.display_order,
            title: c.title,
            description: c.description || '',
            tip: c.tip || '',
            ordering: c.display_order,
            video_url: c.video_url || '',
            badges: Array.isArray(c.badges) ? c.badges : [],
            reactions: Array.isArray(c.reactions) ? c.reactions : [],
            parentReactions: Array.isArray(c.parent_reactions) ? c.parent_reactions : [],
            pointsEarned: c.points_earned || c.points || 10,
            pointsBonus: c.points_bonus || 5,
            shopPoints: c.shop_points || 5,
            imagePoints: c.image_points || 3,
            videoPoints: c.video_points || 10,
            audioPoints: c.audio_points || 5,
            shopButtonEnabled: c.shop_button_enabled || false,
            shopType: c.shop_type || 'none',
            shopProductId: c.shop_product_id || '',
            shopUrl: c.shop_url || '',
            wooCommerceProductId: c.woocommerce_product_id || '',
            submissionTypes: c.submission_types || {
              text: true,
              image: false,
              audio: false,
              video: false
            }
          }));

          setChallenges(mappedChallenges);
        }
      } catch (error) {
        console.error('Error loading challenges:', error);
      } finally {
        setLoading(false);
      }
    };

    loadChallenges();

    // Listen for changes from admin
    const handleChallengesChanged = () => {
      loadChallenges();
    };

    window.addEventListener('dadderup-challenges-changed', handleChallengesChanged);

    return () => {
      window.removeEventListener('dadderup-challenges-changed', handleChallengesChanged);
    };
  }, []);

  // Update today's challenge whenever challenges or completedChallenges change
  useEffect(() => {
    if (challenges.length === 0) {
      setTodaysChallenge(null);
      return;
    }

    const sortedChallenges = challenges.sort((a, b) => a.ordering - b.ordering);
    
    // Find the first uncompleted challenge
    for (const challenge of sortedChallenges) {
      if (!completedChallenges.includes(challenge.id)) {
        setTodaysChallenge(challenge);
        return;
      }
    }
    
    // If all challenges are completed, return the last one
    setTodaysChallenge(sortedChallenges[sortedChallenges.length - 1] || sortedChallenges[0]);
  }, [challenges, completedChallenges]);

  const updateChallenges = (newChallenges: Challenge[]) => {
    const sorted = [...newChallenges].sort((a, b) => a.ordering - b.ordering);
    setChallenges(sorted);
    // Trigger event to notify other components
    window.dispatchEvent(new Event('dadderup-challenges-changed'));
  };

  const getTodaysChallenge = () => {
    // Get challenges sorted by ordering
    const sortedChallenges = challenges.sort((a, b) => a.ordering - b.ordering);
    
    // Find the first uncompleted challenge
    for (const challenge of sortedChallenges) {
      if (!completedChallenges.includes(challenge.id)) {
        return challenge;
      }
    }
    
    // If all challenges are completed, return the last one
    return sortedChallenges[sortedChallenges.length - 1] || sortedChallenges[0];
  };

  const getChallengeForDay = (dayOffset: number) => {
    // dayOffset: 0 = Monday, 1 = Tuesday, etc.
    const challengeOrdering = dayOffset + 1;
    return challenges.find(challenge => challenge.ordering === challengeOrdering);
  };

  const isChallengeUnlocked = (challengeId: number) => {
    const sortedChallenges = challenges.sort((a, b) => a.ordering - b.ordering);
    const challengeIndex = sortedChallenges.findIndex(c => c.id === challengeId);
    
    if (challengeIndex === 0) return true; // First challenge is always unlocked
    
    // Check if all previous challenges are completed
    for (let i = 0; i < challengeIndex; i++) {
      if (!completedChallenges.includes(sortedChallenges[i].id)) {
        return false;
      }
    }
    return true;
  };

  const refreshCompletedChallenges = async () => {
    if (!user) return;
    
    const effectiveUserId = (isInUserMode && switchedUserId) ? switchedUserId : user.id;
    
    const { data, error } = await supabase
      .from('answer_logs')
      .select('challenge_id')
      .eq('user_id', effectiveUserId);
    
    if (!error && data) {
      const completedIds = [...new Set(data.map(log => log.challenge_id))];
      setCompletedChallenges(completedIds);
    }
  };

  return {
    challenges,
    updateChallenges,
    getTodaysChallenge: () => todaysChallenge,
    todaysChallenge,
    getChallengeForDay,
    completedChallenges,
    isChallengeUnlocked,
    refreshCompletedChallenges,
    loading
  };
};
