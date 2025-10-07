import { Button } from "@/components/ui/button";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { useAdminSwitch } from "@/contexts/AdminSwitchContext";
import { useUserRole } from "@/hooks/useUserRole";

export const AdminSwitchFooter = () => {
  const { isInUserMode, switchedUserName, switchBackToAdmin } = useAdminSwitch();
  const { isAdmin } = useUserRole();

  // Only show if user is admin and currently in user mode
  if (!isAdmin || !isInUserMode) {
    return null;
  }

  return (
    <div className="bg-accent text-accent-foreground p-4 mt-8">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="h-5 w-5" />
          <span className="font-medium">
            Admin Mode: Viewing as {switchedUserName || 'User'}
          </span>
        </div>
        <Button
          onClick={async () => {
            try {
              await switchBackToAdmin();
            } catch (error) {
              console.error('Error switching back to admin:', error);
            }
          }}
          variant="outline"
          size="sm"
          className="bg-accent-foreground/10 text-accent-foreground border-accent-foreground/30 hover:bg-accent-foreground/20"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Switch Back to Admin
        </Button>
      </div>
    </div>
  );
};