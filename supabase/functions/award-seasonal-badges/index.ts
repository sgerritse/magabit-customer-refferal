import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'
import { getCorsHeaders } from '../_shared/cors.ts'

interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  trigger_type: 'challenge' | 'action';
  challenge_ids: string[];
  action_trigger?: {
    type: string;
    condition: string;
    description: string;
  };
}

// Seasonal date checker functions
const isHalloween = (date: Date): boolean => {
  return date.getMonth() === 9 && date.getDate() === 31; // October 31st
}

const isChristmas = (date: Date): boolean => {
  return date.getMonth() === 11 && date.getDate() === 25; // December 25th
}

const isNewYear = (date: Date): boolean => {
  return date.getMonth() === 0 && date.getDate() === 1; // January 1st
}

const isThanksgiving = (date: Date): boolean => {
  // 4th Thursday of November
  const year = date.getFullYear();
  const november = new Date(year, 10, 1); // November 1st
  const firstThursday = new Date(november);
  firstThursday.setDate(1 + (4 - november.getDay()) % 7);
  const fourthThursday = new Date(firstThursday);
  fourthThursday.setDate(firstThursday.getDate() + 21);
  
  return date.getMonth() === 10 && date.getDate() === fourthThursday.getDate();
}

const isFathersDay = (date: Date): boolean => {
  // 3rd Sunday of June
  const year = date.getFullYear();
  const june = new Date(year, 5, 1); // June 1st
  const firstSunday = new Date(june);
  firstSunday.setDate(1 + (7 - june.getDay()) % 7);
  const thirdSunday = new Date(firstSunday);
  thirdSunday.setDate(firstSunday.getDate() + 14);
  
  return date.getMonth() === 5 && date.getDate() === thirdSunday.getDate();
}

const getSeasonalTriggerForToday = (date: Date): string | null => {
  if (isHalloween(date)) return 'seasonal_halloween';
  if (isChristmas(date)) return 'seasonal_christmas';
  if (isNewYear(date)) return 'seasonal_newyear';
  if (isThanksgiving(date)) return 'seasonal_thanksgiving';
  if (isFathersDay(date)) return 'seasonal_fathersday';
  return null;
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { user_id, challenge_completed } = await req.json()
    
    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const today = new Date();
    const todayTrigger = getSeasonalTriggerForToday(today);
    
    console.log(`Checking seasonal badges for user ${user_id} on ${today.toDateString()}`);
    console.log(`Today's trigger: ${todayTrigger}`);

    if (!todayTrigger) {
      return new Response(
        JSON.stringify({ message: 'No seasonal badges available today', date: today.toDateString() }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get badge definitions from user's localStorage (this would typically be stored in DB)
    // For now, we'll define the seasonal badges directly
    const seasonalBadges: BadgeDefinition[] = [
      {
        id: "halloween-dad",
        name: "Halloween Dad",
        description: "Completed a challenge on Halloween",
        icon: "🎃",
        points: 25,
        trigger_type: 'action',
        challenge_ids: [],
        action_trigger: {
          type: 'seasonal_halloween',
          condition: 'user_completes_challenge_on_halloween',
          description: 'Awarded when user completes a challenge on Halloween (October 31st)'
        }
      },
      {
        id: "christmas-dad",
        name: "Christmas Dad",
        description: "Completed a challenge on Christmas",
        icon: "🎄",
        points: 30,
        trigger_type: 'action',
        challenge_ids: [],
        action_trigger: {
          type: 'seasonal_christmas',
          condition: 'user_completes_challenge_on_christmas',
          description: 'Awarded when user completes a challenge on Christmas (December 25th)'
        }
      },
      {
        id: "newyear-dad",
        name: "New Year Dad",
        description: "Started the year strong with a challenge",
        icon: "🎉",
        points: 35,
        trigger_type: 'action',
        challenge_ids: [],
        action_trigger: {
          type: 'seasonal_newyear',
          condition: 'user_completes_challenge_on_newyear',
          description: 'Awarded when user completes a challenge on New Year\'s Day (January 1st)'
        }
      },
      {
        id: "thanksgiving-dad",
        name: "Thanksgiving Dad",
        description: "Showed gratitude with a challenge on Thanksgiving",
        icon: "🦃",
        points: 25,
        trigger_type: 'action',
        challenge_ids: [],
        action_trigger: {
          type: 'seasonal_thanksgiving',
          condition: 'user_completes_challenge_on_thanksgiving',
          description: 'Awarded when user completes a challenge on Thanksgiving'
        }
      },
      {
        id: "fathersday-dad",
        name: "Father's Day Champion",
        description: "Celebrated being a dad with a challenge on Father's Day",
        icon: "👨‍👧‍👦",
        points: 40,
        trigger_type: 'action',
        challenge_ids: [],
        action_trigger: {
          type: 'seasonal_fathersday',
          condition: 'user_completes_challenge_on_fathersday',
          description: 'Awarded when user completes a challenge on Father\'s Day'
        }
      }
    ];

    // Find badges that match today's trigger
    const eligibleBadges = seasonalBadges.filter(badge => 
      badge.action_trigger?.type === todayTrigger
    );

    console.log(`Found ${eligibleBadges.length} eligible seasonal badges for trigger: ${todayTrigger}`);

    const awardedBadges = [];

    for (const badge of eligibleBadges) {
      // Check if user already has this badge
      const { data: existingBadge } = await supabase
        .from('user_badges')
        .select('id')
        .eq('user_id', user_id)
        .eq('badge_id', badge.id)
        .single();

      if (!existingBadge) {
        // Award the badge
        const { data, error } = await supabase
          .from('user_badges')
          .insert({
            user_id: user_id,
            badge_id: badge.id,
            badge_name: badge.name,
            badge_description: badge.description,
            badge_icon: badge.icon,
            points_awarded: badge.points
          })
          .select()
          .single();

        if (error) {
          console.error('Error awarding badge:', error);
        } else {
          console.log(`Successfully awarded ${badge.name} badge to user ${user_id}`);
          awardedBadges.push(badge);
        }
      } else {
        console.log(`User ${user_id} already has ${badge.name} badge`);
      }
    }

    return new Response(
      JSON.stringify({
        message: `Seasonal badge check completed for ${today.toDateString()}`,
        trigger: todayTrigger,
        awarded_badges: awardedBadges.map(b => ({
          name: b.name,
          icon: b.icon,
          points: b.points
        })),
        user_id
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in award-seasonal-badges function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})