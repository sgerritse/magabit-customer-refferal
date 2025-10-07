import { createContext, useContext, useState, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AdminSwitchContextType {
  isInUserMode: boolean;
  switchedUserId: string | null;
  switchedUserName: string | null;
  switchToUser: (userId: string, userName: string) => Promise<void>;
  switchBackToAdmin: () => Promise<void>;
}

const AdminSwitchContext = createContext<AdminSwitchContextType | undefined>(undefined);

export const useAdminSwitch = () => {
  const context = useContext(AdminSwitchContext);
  if (context === undefined) {
    throw new Error('useAdminSwitch must be used within an AdminSwitchProvider');
  }
  return context;
};

export const AdminSwitchProvider = ({ children }: { children: ReactNode }) => {
  const [isInUserMode, setIsInUserMode] = useState(false);
  const [switchedUserId, setSwitchedUserId] = useState<string | null>(null);
  const [switchedUserName, setSwitchedUserName] = useState<string | null>(null);

  const switchToUser = async (userId: string, userName: string) => {
    try {
      // Verify current user is admin before allowing switch
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) {
        throw new Error('Not authenticated');
      }

      // Check if current user has admin role using the security definer function
      const { data: isAdmin, error: roleError } = await supabase
        .rpc('has_role', {
          _user_id: currentUser.user.id,
          _role: 'admin'
        });

      if (roleError) {
        console.error('Error checking admin role:', roleError);
        throw new Error('Failed to verify admin status');
      }

      if (!isAdmin) {
        throw new Error('Only administrators can switch users');
      }

      // Log the admin switch
      await supabase.rpc('log_admin_switch', {
        target_user_id: userId,
        target_user_name: userName,
        action: 'admin_switch_to_user'
      });

      setIsInUserMode(true);
      setSwitchedUserId(userId);
      setSwitchedUserName(userName);
      // Persist in memory only; no localStorage

    } catch (error) {
      console.error('Failed to switch to user:', error);
      throw error;
    }
  };

  const switchBackToAdmin = async () => {
    try {
      // Log the switch back to admin
      if (switchedUserId && switchedUserName) {
        await supabase.rpc('log_admin_switch', {
          target_user_id: switchedUserId,
          target_user_name: switchedUserName,
          action: 'admin_switch_back'
        });
      }

      setIsInUserMode(false);
      setSwitchedUserId(null);
      setSwitchedUserName(null);
      // No localStorage writes

    } catch (error) {
      console.error('Failed to switch back to admin:', error);
      // Still perform the switch back even if logging fails
      setIsInUserMode(false);
      setSwitchedUserId(null);
      setSwitchedUserName(null);
      // No localStorage writes

    }
  };

  const value = {
    isInUserMode,
    switchedUserId,
    switchedUserName,
    switchToUser,
    switchBackToAdmin,
  };

  return (
    <AdminSwitchContext.Provider value={value}>
      {children}
    </AdminSwitchContext.Provider>
  );
};