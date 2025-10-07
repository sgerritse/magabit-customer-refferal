import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export const useUserRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setRole(null);
        setLoading(false);
        return;
      }

      let retryCount = 0;
      const maxRetries = 3;
      const retryDelay = 1000; // 1 second

      while (retryCount < maxRetries) {
        try {
          // SECURITY: Fetch role from user_roles table (secure, separate from profiles)
          const { data, error } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .order('role', { ascending: true }) // 'admin' comes before 'user' alphabetically
            .limit(1)
            .maybeSingle();

          if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
            throw error;
          }

          if (data) {
            setRole(data.role);
          } else {
            // No role found - this shouldn't happen as handle_new_user creates it
            // Default to 'user' role for safety
            console.warn('No role found in user_roles table for user, defaulting to user role');
            setRole('user');
          }
          
          setLoading(false);
          return; // Success, exit retry loop
          
        } catch (error) {
          console.error(`Error fetching user role (attempt ${retryCount + 1}):`, error);
          retryCount++;
          
          if (retryCount >= maxRetries) {
            // After all retries failed, default to user role
            setRole('user');
            setLoading(false);
          } else {
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, retryDelay));
          }
        }
      }
    };

    fetchUserRole();
  }, [user]);

  const isAdmin = role === 'admin';
  const isUser = role === 'user';
  const isModerator = role === 'moderator';

  return {
    role,
    loading,
    isAdmin,
    isUser,
    isModerator,
  };
};