import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TierManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  currentTier: string;
  onSuccess: () => void;
}

export const TierManagementDialog = ({
  open,
  onOpenChange,
  userId,
  userName,
  currentTier,
  onSuccess,
}: TierManagementDialogProps) => {
  const [newTier, setNewTier] = useState(currentTier);
  const [reason, setReason] = useState("");
  const [lockAutoCalc, setLockAutoCalc] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for tier change");
      return;
    }

    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Update or insert tier record
      const { error: tierError } = await supabase
        .from("ambassador_tiers")
        .upsert({
          user_id: userId,
          current_tier: newTier,
          tier_calculated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (tierError) throw tierError;

      // Log in security audit
      await supabase.from("security_audit_logs").insert({
        user_id: user?.id,
        admin_user_id: user?.id,
        action: lockAutoCalc ? 'TIER_OVERRIDE_LOCKED' : 'TIER_OVERRIDE',
        target_user_id: userId,
        old_values: { tier: currentTier },
        new_values: { 
          tier: newTier, 
          reason,
          locked: lockAutoCalc 
        },
      });

      // Queue notification to ambassador
      await supabase.from("notification_queue").insert({
        user_id: userId,
        notification_type: "tier_changed",
        channel: "email",
        data: {
          old_tier: currentTier,
          new_tier: newTier,
          reason,
          changed_by_admin: true,
        },
      });

      toast.success(`Tier updated to ${newTier}`);
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(`Failed to update tier: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage Ambassador Tier</DialogTitle>
          <DialogDescription>
            Manually adjust tier for {userName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Current Tier</Label>
            <p className="text-sm font-medium capitalize mt-1">{currentTier}</p>
          </div>

          <div>
            <Label htmlFor="new-tier">New Tier</Label>
            <Select value={newTier} onValueChange={setNewTier}>
              <SelectTrigger id="new-tier">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bronze">Bronze</SelectItem>
                <SelectItem value="silver">Silver</SelectItem>
                <SelectItem value="gold">Gold</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="reason">Reason for Change</Label>
            <Textarea
              id="reason"
              placeholder="Explain why you're changing this tier..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="lock-calc">Lock Auto-Calculation</Label>
              <p className="text-sm text-muted-foreground">
                Prevent automatic tier updates based on performance
              </p>
            </div>
            <Switch
              id="lock-calc"
              checked={lockAutoCalc}
              onCheckedChange={setLockAutoCalc}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={submitting || !reason.trim()}
            >
              {submitting ? "Updating..." : "Update Tier"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
