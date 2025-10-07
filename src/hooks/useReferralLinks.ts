import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface ReferralLink {
  id: string;
  user_id: string;
  link_type: 'main' | 'shop' | 'waitlist-a' | 'waitlist-b';
  username: string;
  full_url: string;
  clicks_count: number;
  conversions_count: number;
  last_click_at: string | null;
  notifications_enabled: {
    push: boolean;
    sms: boolean;
    email: boolean;
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useReferralLinks = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user's referral links
  const { data: links, isLoading } = useQuery({
    queryKey: ["referral-links", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("referral_links")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("link_type");

      if (error) throw error;
      return data as ReferralLink[];
    },
    enabled: !!user?.id,
  });

  // Generate referral links for a user
  const generateLinks = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");

      // Get username from profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("username, display_name")
        .eq("user_id", user.id)
        .single();

      if (!profile) throw new Error("Profile not found");

      const username = profile.username || profile.display_name?.toLowerCase().replace(/\s+/g, '.');
      if (!username) throw new Error("Username not set");

      const linkTypes: Array<'main' | 'shop' | 'waitlist-a' | 'waitlist-b'> = ['main', 'shop', 'waitlist-a', 'waitlist-b'];
      const baseUrls = {
        main: 'https://app.dadderup.com',
        shop: 'https://dadderup.com',
        'waitlist-a': 'https://dadderup.com',
        'waitlist-b': 'https://dadderup.com'
      };

      const linksToInsert = linkTypes.map(linkType => ({
        user_id: user.id,
        link_type: linkType,
        username,
        full_url: `${baseUrls[linkType]}/${username}/${linkType === 'main' ? 'register' : linkType}`,
        is_active: true
      }));

      const { data, error } = await supabase
        .from("referral_links")
        .upsert(linksToInsert, { onConflict: 'user_id,link_type' })
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referral-links", user?.id] });
      toast.success("Referral links generated!");
    },
    onError: (error: Error) => {
      toast.error(`Failed to generate links: ${error.message}`);
    }
  });

  // Update notification settings
  const updateNotifications = useMutation({
    mutationFn: async ({ linkId, notifications }: { linkId: string, notifications: ReferralLink['notifications_enabled'] }) => {
      const { error } = await supabase
        .from("referral_links")
        .update({ notifications_enabled: notifications })
        .eq("id", linkId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referral-links", user?.id] });
      toast.success("Notification settings updated");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update notifications: ${error.message}`);
    }
  });

  return {
    links: links || [],
    isLoading,
    generateLinks,
    updateNotifications
  };
};
