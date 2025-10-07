import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from './useAuth';

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const WARNING_TIME_MS = 25 * 60 * 1000; // 25 minutes (5 min warning)
const CHECK_INTERVAL_MS = 60 * 1000; // Check every minute

export const useSessionManager = () => {
  const { user, signOut } = useAuth();
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const [showWarning, setShowWarning] = useState(false);

  // Update last activity timestamp
  const updateActivity = useCallback(() => {
    setLastActivity(Date.now());
    setShowWarning(false);
  }, []);

  // Extend session - called when user clicks extend button
  const extendSession = useCallback(async () => {
    if (!user) return;

    try {
      // Validate and refresh session
      const { data, error } = await supabase.rpc('validate_session', {
        p_session_token: (await supabase.auth.getSession()).data.session?.access_token || ''
      }) as { data: { valid: boolean } | null; error: any };

      if (error || !data?.valid) {
        console.error('Session validation failed:', error);
        await signOut();
        return;
      }

      updateActivity();
      toast({
        title: "Session Extended",
        description: "Your session has been extended for another 30 minutes",
      });
    } catch (error) {
      console.error('Error extending session:', error);
    }
  }, [user, signOut, updateActivity]);

  // Check session validity
  useEffect(() => {
    if (!user) return;

    const checkSession = async () => {
      const now = Date.now();
      const timeSinceActivity = now - lastActivity;

      // Show warning at 25 minutes
      if (timeSinceActivity >= WARNING_TIME_MS && !showWarning) {
        setShowWarning(true);
        toast({
          title: "Session Expiring Soon",
          description: "Your session will expire in 5 minutes due to inactivity. Please save your work.",
          duration: 300000, // Show for 5 minutes
        });
      }

      // Force logout at 30 minutes
      if (timeSinceActivity >= SESSION_TIMEOUT_MS) {
        toast({
          title: "Session Expired",
          description: "Your session has expired due to inactivity",
          variant: "destructive",
        });
        await signOut();
      }
    };

    const interval = setInterval(checkSession, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [user, lastActivity, showWarning, signOut, extendSession]);

  // Track user activity
  useEffect(() => {
    if (!user) return;

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    
    events.forEach(event => {
      document.addEventListener(event, updateActivity);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
    };
  }, [user, updateActivity]);

  return {
    lastActivity,
    showWarning,
    extendSession,
    updateActivity,
  };
};
