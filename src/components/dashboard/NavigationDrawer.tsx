import React from "react";
import { X, Home, TrendingUp, Users, User, Settings, Shield, LogOut, Compass, Youtube, Award, CreditCard, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useUserRole } from "@/hooks/useUserRole";
import { useAdminSwitch } from "@/contexts/AdminSwitchContext";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
} from "@/components/ui/drawer";

interface NavigationDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NavigationDrawer = ({ open, onOpenChange }: NavigationDrawerProps) => {
  const { data: userProfile } = useUserProfile();
  const [avatarUrl, setAvatarUrl] = useState("");
  const { isAdmin } = useUserRole();
  const { isInUserMode } = useAdminSwitch();
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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

  const getFullName = () => {
    if (userProfile?.first_name && userProfile?.last_name) {
      return `${userProfile.first_name} ${userProfile.last_name}`;
    }
    return "User";
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed Out",
      description: "You have been successfully signed out.",
    });
    navigate('/auth');
    onOpenChange(false);
  };

  const menuSections = [
    {
      title: "Dashboard",
      items: [
        { icon: Compass, label: "Getting Started", path: "/getting-started", action: () => { navigate('/getting-started'); onOpenChange(false); } },
        { icon: Home, label: "Home", path: "/dashboard", action: () => { navigate('/dashboard'); onOpenChange(false); } },
        { icon: TrendingUp, label: "Progress", path: "/progress", action: () => { navigate('/progress'); onOpenChange(false); } },
        { icon: Users, label: "Community", path: "/community", action: () => { navigate('/community'); onOpenChange(false); } },
        { icon: ShoppingBag, label: "Shop", path: "/shop", action: () => { window.open('https://dadderup.com/shop/', '_blank'); onOpenChange(false); } },
        { icon: Youtube, label: "Podcasts", path: "/podcasts", action: () => { navigate('/podcasts'); onOpenChange(false); } },
        { icon: Award, label: "Brand Ambassador", path: "/brand-ambassador", action: () => { navigate('/brand-ambassador'); onOpenChange(false); } },
      ]
    },
    {
      title: "Account",
      items: [
        { icon: User, label: "Profile", path: "/profile", action: () => { navigate('/profile'); onOpenChange(false); } },
        { icon: CreditCard, label: "Billing", path: "/billing", action: () => { navigate('/billing'); onOpenChange(false); } },
        { icon: Settings, label: "Settings", path: "/settings", action: () => { navigate('/settings'); onOpenChange(false); } },
      ]
    },
  ];

  // Add admin section if user is admin and not in user mode
  if (isAdmin && !isInUserMode) {
    menuSections.push({
      title: "Admin",
      items: [
        { icon: Shield, label: "Admin Panel", path: "/admin", action: () => { navigate('/admin'); onOpenChange(false); } },
      ]
    });
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="left">
      <DrawerContent className="h-full w-80 bg-card border-r border-border rounded-none left-0 right-auto">
        <DrawerHeader className="p-0">
          {/* Close Button */}
          <div className="flex items-center justify-between p-4 border-b border-primary/20 bg-primary">
            <DrawerClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-primary-foreground hover:text-primary-foreground hover:bg-primary-foreground/10"
              >
                <X className="h-5 w-5" />
              </Button>
            </DrawerClose>
            <span className="text-primary-foreground text-sm">Close menu</span>
          </div>

          {/* User Profile */}
          <div className="p-6 border-b border-border bg-card">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-primary/20">
                {avatarUrl && <AvatarImage src={avatarUrl} />}
                <AvatarFallback className="bg-success text-success-foreground font-semibold text-xl">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-card-foreground font-semibold text-lg">{getFullName()}</h3>
                <button
                  onClick={() => { navigate('/dashboard'); onOpenChange(false); }}
                  className="text-accent text-sm hover:underline font-medium"
                >
                  Open dashboard
                </button>
              </div>
            </div>
          </div>
        </DrawerHeader>

        {/* Menu Sections */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8 bg-card">
          {menuSections.map((section, idx) => (
            <div key={idx}>
              <h4 className="text-sidebar-foreground text-xs uppercase font-semibold mb-3 px-2">
                {section.title}
              </h4>
              <div className="space-y-1">
                {section.items.map((item, itemIdx) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <button
                      key={itemIdx}
                      onClick={item.action}
                      className={`w-full flex items-center gap-3 px-2 py-3 rounded-lg transition-colors font-medium ${
                        isActive 
                          ? 'bg-accent text-accent-foreground' 
                          : 'text-card-foreground hover:bg-accent hover:text-accent-foreground'
                      }`}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Sign Out Section */}
          <div>
            <div className="h-px bg-border mb-4" />
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-2 py-3 text-card-foreground hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors font-medium"
            >
              <LogOut className="h-5 w-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
