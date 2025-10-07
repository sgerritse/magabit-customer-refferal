import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useUserProfile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      // Use secure decryption function to get user data
      const { data: userData, error: userError } = await supabase
        .rpc('get_user_decrypted', { target_user_id: user.id });

      if (userError) throw userError;
      if (!userData || userData.length === 0) return null;

      const userInfo = userData[0];

      // Get profile data including username
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('username')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;

      return {
        first_name: userInfo.first_name,
        last_name: userInfo.last_name,
        email: userInfo.email,
        username: profileData?.username || `${userInfo.first_name}.${userInfo.last_name}`.toLowerCase(),
      };
    },
    enabled: !!user?.id,
  });

  const updateUsername = useMutation({
    mutationFn: async (newUsername: string) => {
      if (!user?.id) throw new Error('No user');

      const { error } = await supabase
        .from('profiles')
        .update({ username: newUsername.toLowerCase() })
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile', user?.id] });
    },
  });

  return {
    ...profileQuery,
    updateUsername,
  };
};