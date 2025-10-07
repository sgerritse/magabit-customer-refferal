import React from "react";
import { useState, useEffect } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import dadderUpLogo from "@/assets/dadderup-logo-white.png";

interface NavigationBarProps {
  onMenuClick: () => void;
  leftExtras?: React.ReactNode;
}

export const NavigationBar = ({ onMenuClick, leftExtras }: NavigationBarProps) => {
  const { data: userProfile } = useUserProfile();
  const { user } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const loadAvatar = async () => {
      if (user?.id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (profile?.avatar_url) {
          setAvatarUrl(profile.avatar_url);
        }
      }
    };
    loadAvatar();
  }, [user]);
  
  const getInitials = () => {
    if (userProfile?.first_name && userProfile?.last_name) {
      return `${userProfile.first_name[0]}${userProfile.last_name[0]}`.toUpperCase();
    }
    return "U";
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-primary border-b border-white/10">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Hamburger Menu - Left */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="text-primary-foreground hover:bg-primary-foreground/10"
          >
            <Menu className="h-6 w-6" />
          </Button>
          {leftExtras}
        </div>

        {/* Logo - Center */}
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <img 
            src={dadderUpLogo} 
            alt="DadderUp Logo" 
            className="h-12 opacity-90"
          />
        </div>

        {/* Avatar - Right */}
        <button 
          onClick={() => navigate('/profile')}
          className="focus:outline-none focus:ring-2 focus:ring-primary-foreground/50 rounded-full"
        >
          <Avatar className="h-10 w-10 border-2 border-primary-foreground/20 cursor-pointer hover:border-primary-foreground/40 transition-colors">
            {avatarUrl && <AvatarImage src={avatarUrl} />}
            <AvatarFallback className="bg-success text-primary-foreground font-semibold">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
        </button>
      </div>
    </nav>
  );
};
