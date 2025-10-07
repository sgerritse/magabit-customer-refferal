import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BadgeDefinition {
  id: string;
  badge_id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  type: 'challenge' | 'action';
  trigger_type: 'challenge' | 'action';
  challenge_ids: string[];
  required_count?: number;
  action_trigger?: {
    type: string;
    condition: string;
    description: string;
  };
}

const defaultBadgeDefinitions: Omit<BadgeDefinition, 'id'>[] = [
  {
    badge_id: "commitment-maker",
    name: "Commitment Maker",
    description: "Made a clear commitment to being the best father for your child",
    icon: "🤝",
    points: 15,
    type: 'challenge',
    trigger_type: 'challenge',
    challenge_ids: ["1"]
  },
  {
    badge_id: "storyteller",
    name: "Storyteller",
    description: "Shared your child's beautiful origin story with them",
    icon: "📚",
    points: 20,
    type: 'challenge',
    trigger_type: 'challenge',
    challenge_ids: ["2"]
  },
  {
    badge_id: "brave-heart",
    name: "Brave Heart",
    description: "Courageously shared your first public post with the DadderUp community",
    icon: "🧡",
    points: 30,
    type: 'action',
    trigger_type: 'action',
    challenge_ids: [],
    action_trigger: {
      type: 'first_public_post',
      condition: 'user_makes_first_public_post',
      description: 'Awarded when user shares their first public post to the community'
    }
  },
  {
    badge_id: "public-declarer",
    name: "Public Declarer",
    description: "Shared video or audio content publicly with the community",
    icon: "📢",
    points: 25,
    type: 'action',
    trigger_type: 'action',
    challenge_ids: [],
    action_trigger: {
      type: 'public_media_post',
      condition: 'user_shares_video_or_audio_publicly',
      description: 'Awarded when user shares video or audio content publicly'
    }
  },
  {
    badge_id: "video-challenger",
    name: "Video Challenger", 
    description: "Created and shared video content",
    icon: "🎥",
    points: 20,
    type: 'action',
    trigger_type: 'action',
    challenge_ids: [],
    action_trigger: {
      type: 'video_content_creator',
      condition: 'user_creates_video_content',
      description: 'Awarded when user creates and shares video content'
    }
  },
  {
    badge_id: "visionary",
    name: "Visionary",
    description: "Created a clear vision for your future fatherhood",
    icon: "🎯",
    points: 20,
    type: 'challenge',
    trigger_type: 'challenge',
    challenge_ids: ["4"]
  },
  {
    badge_id: "anchor-setter",
    name: "Anchor Setter",
    description: "Established a personal mantra to guide your parenting journey",
    icon: "⚓",
    points: 18,
    type: 'challenge',
    trigger_type: 'challenge',
    challenge_ids: ["5"]
  },
  {
    badge_id: "consistency-champion",
    name: "Consistency Champion",
    description: "Completed challenges for 3 consecutive days",
    icon: "🔥",
    points: 25,
    type: 'action',
    trigger_type: 'action',
    challenge_ids: [],
    action_trigger: {
      type: 'streak_milestone',
      condition: 'user_reaches_3_day_streak',
      description: 'Awarded when user maintains a 3-day completion streak'
    }
  },
  {
    badge_id: "dedication-master",
    name: "Dedication Master",
    description: "Completed challenges for 7 consecutive days",
    icon: "🏆",
    points: 50,
    type: 'action',
    trigger_type: 'action',
    challenge_ids: [],
    action_trigger: {
      type: 'streak_milestone',
      condition: 'user_reaches_7_day_streak',
      description: 'Awarded when user maintains a 7-day completion streak'
    }
  },
  {
    badge_id: "community-engager",
    name: "Community Engager",
    description: "Actively shared multiple public posts with the community",
    icon: "🤗",
    points: 35,
    type: 'action',
    trigger_type: 'action',
    challenge_ids: [],
    action_trigger: {
      type: 'multiple_public_posts',
      condition: 'user_shares_3_public_posts',
      description: 'Awarded when user shares 3 or more public posts'
    }
  },
  {
    badge_id: "reflection-master",
    name: "Reflection Master",
    description: "Consistently provided thoughtful responses across all challenges",
    icon: "💭",
    points: 40,
    type: 'action',
    trigger_type: 'action',
    challenge_ids: [],
    action_trigger: {
      type: 'consistency_award',
      condition: 'user_completes_all_current_challenges',
      description: 'Awarded when user completes all available challenges with detailed responses'
    }
  },
  {
    badge_id: "habit-tracker",
    name: "Habit Tracker",
    description: "Created systems for tracking parenting progress",
    icon: "📊",
    points: 20,
    type: 'challenge',
    trigger_type: 'challenge',
    challenge_ids: ["6"]
  },
  {
    badge_id: "system-builder",
    name: "System Builder",
    description: "Built sustainable systems for family engagement",
    icon: "🛠️",
    points: 25,
    type: 'challenge',
    trigger_type: 'challenge',
    challenge_ids: ["6"]
  },
  {
    badge_id: "legacy-builder",
    name: "Legacy Builder",
    description: "Created meaningful symbols of commitment",
    icon: "🏆",
    points: 30,
    type: 'challenge',
    trigger_type: 'challenge',
    challenge_ids: ["7"]
  },
  {
    badge_id: "commitment-keeper",
    name: "Commitment Keeper",
    description: "Anchored commitment with meaningful gestures",
    icon: "💎",
    points: 25,
    type: 'challenge',
    trigger_type: 'challenge',
    challenge_ids: ["7"]
  }
];

export const useBadgeDefinitions = () => {
  const [badgeDefinitions, setBadgeDefinitions] = useState<BadgeDefinition[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBadgeDefinitions = async () => {
    try {
      const { data, error } = await supabase
        .from('badge_definitions')
        .select('id, badge_id, name, description, icon, points, type, challenge_ids, required_count, is_active, display_order')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        // Seed default badges if none exist
        const { data: seededData, error: seedError } = await supabase
          .from('badge_definitions')
          .insert(defaultBadgeDefinitions.map((badge, index) => {
            // Destructure to exclude action_trigger which isn't a DB column
            const { action_trigger, ...badgeData } = badge as any;
            return {
              ...badgeData,
              display_order: index,
              is_active: true
            };
          }))
          .select('id, badge_id, name, description, icon, points, type, challenge_ids, required_count, is_active, display_order');

        if (seedError) throw seedError;
        
        if (seededData) {
          setBadgeDefinitions(seededData.map(b => ({
            id: b.badge_id,
            badge_id: b.badge_id,
            name: b.name,
            description: b.description,
            icon: b.icon,
            points: b.points,
            type: b.type as 'challenge' | 'action',
            trigger_type: b.type as 'challenge' | 'action',
            challenge_ids: (b.challenge_ids as string[]) || [],
            required_count: b.required_count || 1
          })));
        }
      } else {
        setBadgeDefinitions(data.map(b => ({
          id: b.badge_id,
          badge_id: b.badge_id,
          name: b.name,
          description: b.description,
          icon: b.icon,
          points: b.points,
          type: b.type as 'challenge' | 'action',
          trigger_type: b.type as 'challenge' | 'action',
          challenge_ids: (b.challenge_ids as string[]) || [],
          required_count: b.required_count || 1
        })));
      }
    } catch (error) {
      console.error("Error loading badge definitions:", error);
      toast.error("Failed to load badge definitions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBadgeDefinitions();
  }, []);

  const updateBadgeDefinitions = async (newBadges: BadgeDefinition[]) => {
    // This is now handled by individual CRUD operations in BadgesAdmin
    setBadgeDefinitions(newBadges);
  };

  const getBadgeById = (id: string) => {
    return badgeDefinitions.find(badge => badge.badge_id === id || badge.id === id);
  };

  const getChallengeBadges = (challengeId: string) => {
    return badgeDefinitions.filter(badge => 
      badge.type === 'challenge' && 
      badge.challenge_ids.includes(challengeId)
    );
  };

  const getActionBadges = (actionType: string) => {
    return badgeDefinitions.filter(badge => 
      badge.type === 'action'
    );
  };

  return {
    badgeDefinitions,
    updateBadgeDefinitions,
    getBadgeById,
    getChallengeBadges,
    getActionBadges,
    loading,
    refetch: loadBadgeDefinitions
  };
};