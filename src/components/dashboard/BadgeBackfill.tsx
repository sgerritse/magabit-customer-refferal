import { useEffect, useState } from 'react';
import { useAnswerLogs } from '@/hooks/useAnswerLogs';
import { useUserStats } from '@/hooks/useUserStats';
import { useBadgeDefinitions } from '@/hooks/useBadgeDefinitions';
import { useAuth } from '@/hooks/useAuth';

export const BadgeBackfill = () => {
  const { logs } = useAnswerLogs();
  const { awardBadge, badges } = useUserStats();
  const { getChallengeBadges } = useBadgeDefinitions();
  const { user } = useAuth();
  const [hasRun, setHasRun] = useState(false);

  useEffect(() => {
    const backfillBadges = async () => {
      // Only run once per user session
      if (!user || hasRun) {
        return;
      }
      
      // Previously used localStorage to guard; now run once per mount only
      // Skip if no completed challenges found
      if (!logs || logs.length === 0) {
        console.log('⏭️ Skipping badge backfill - no completed challenges found');
        setHasRun(true);
        return;
      }
      
      console.log('🔄 Starting badge backfill process...', `${logs.length} challenges completed`);
      let awardedCount = 0;
      
      // Get current badge IDs to avoid duplicates
      const currentBadgeIds = new Set(badges.map(b => b.badge_id));
      
      for (const log of logs) {
        // Validate log has required data
        if (!log.challengeId) {
          console.warn('⚠️ Skipping log without challenge ID:', log);
          continue;
        }
        
        const challengeBadges = getChallengeBadges(log.challengeId.toString());
        
        for (const badgeDef of challengeBadges) {
          if (!currentBadgeIds.has(badgeDef.id)) {
            console.log(`🏆 Backfilling badge: ${badgeDef.name} for challenge ${log.challengeId}`);
            
            const success = await awardBadge(
              badgeDef.id,
              badgeDef.name,
              badgeDef.icon,
              badgeDef.description,
              badgeDef.points
            );
            
            if (success) {
              currentBadgeIds.add(badgeDef.id);
              awardedCount++;
            }
          }
        }
      }
      
      // Mark as completed for this session
      setHasRun(true);
      
      console.log(`✅ Badge backfill complete. ${awardedCount} badge${awardedCount !== 1 ? 's' : ''} awarded silently.`);
    };

    // Run backfill after a short delay to ensure all data is loaded
    const timeoutId = setTimeout(backfillBadges, 1000);
    return () => clearTimeout(timeoutId);
  }, [logs, badges, awardBadge, getChallengeBadges, user, hasRun]);

  return null; // This is a background component
};