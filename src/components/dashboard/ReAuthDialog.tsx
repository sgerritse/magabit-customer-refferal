import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Shield, Eye, EyeOff } from 'lucide-react';

interface ReAuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
}

export const ReAuthDialog = ({
  open,
  onOpenChange,
  onSuccess,
  title = "Confirm Your Identity",
  description = "For security, please re-enter your password to continue",
}: ReAuthDialogProps) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleReAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get current user email
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        throw new Error('User not found');
      }

      // Attempt to sign in with provided password to verify
      const { error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: password,
      });

      if (error) {
        throw new Error('Invalid password');
      }

      // Check that session is recent (within 5 minutes)
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const sessionAge = Date.now() - new Date(session.user.last_sign_in_at || 0).getTime();
        const fiveMinutes = 5 * 60 * 1000;
        
        if (sessionAge > fiveMinutes) {
          // Refresh the session
          await supabase.auth.refreshSession();
        }
      }

      toast({
        title: "Identity Confirmed",
        description: "You can now proceed with the sensitive operation",
      });

      setPassword('');
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Authentication Failed",
        description: error.message || "Incorrect password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setPassword('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleReAuth} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="reauth-password">Password</Label>
            <div className="relative">
              <Input
                id="reauth-password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !password}
              className="flex-1"
            >
              {loading ? "Verifying..." : "Confirm"}
            </Button>
          </div>
        </form>

        <div className="text-xs text-muted-foreground mt-4 p-3 bg-muted/50 rounded-lg">
          <p>
            🔒 This verification ensures that only you can access or modify sensitive payment
            information. Your password is never stored or transmitted insecurely.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
