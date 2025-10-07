import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useAdminSwitch } from '@/contexts/AdminSwitchContext';
import { LoadingWidget, mapSettingsToProps } from '@/components/ui/loading-widget';
import { useThemeSettings } from '@/hooks/useThemeSettings';

interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const { isInUserMode } = useAdminSwitch();
  const { settings } = useThemeSettings();
  const location = useLocation();

  // Wait for both auth and role to fully load before making any decisions
  if (authLoading || roleLoading) {
    return <LoadingWidget {...mapSettingsToProps(settings?.loading_widget_settings)} />;
  }

  // Only redirect if we're certain about the auth state (not loading)
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Only redirect if we're certain about the role (not loading)
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // Only redirect if admin is in user mode
  if (isInUserMode) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};