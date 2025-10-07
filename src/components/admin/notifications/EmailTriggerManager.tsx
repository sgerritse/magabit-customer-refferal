import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Zap } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface EmailTrigger {
  id: string;
  name: string;
  trigger_type: string;
  event_type: string;
  template_id: string | null;
  conditions: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  is_active: boolean;
}

const EVENT_TYPES = [
  { value: "user_registration", label: "User Registration" },
  { value: "badge_earned", label: "Badge Earned" },
  { value: "challenge_completed", label: "Challenge Completed" },
  { value: "milestone_reached", label: "Milestone Reached" },
  { value: "streak_achieved", label: "Streak Achieved" },
  { value: "weekly_digest", label: "Weekly Digest" },
  { value: "inactivity_7days", label: "Inactive 7 Days" },
  { value: "inactivity_14days", label: "Inactive 14 Days" },
  { value: "trial_expiring", label: "Trial Expiring" },
  { value: "subscription_renewal", label: "Subscription Renewal" },
];

export const EmailTriggerManager = () => {
  const [triggers, setTriggers] = useState<EmailTrigger[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTrigger, setEditingTrigger] = useState<EmailTrigger | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    trigger_type: "email",
    event_type: "",
    template_id: "",
    conditions: {},
    is_active: true,
  });

  useEffect(() => {
    loadTriggers();
    loadTemplates();
  }, []);

  const loadTriggers = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_triggers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTriggers(data || []);
    } catch (error) {
      console.error("Error loading triggers:", error);
      toast.error("Failed to load triggers");
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('id, name, is_active')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error("Error loading templates:", error);
    }
  };

  const handleOpenDialog = (trigger?: EmailTrigger) => {
    if (trigger) {
      setEditingTrigger(trigger);
      setFormData({
        name: trigger.name,
        trigger_type: trigger.trigger_type,
        event_type: trigger.event_type,
        template_id: trigger.template_id || "",
        conditions: trigger.conditions || {},
        is_active: trigger.is_active,
      });
    } else {
      setEditingTrigger(null);
      setFormData({
        name: "",
        trigger_type: "email",
        event_type: "",
        template_id: "",
        conditions: {},
        is_active: true,
      });
    }
    setDialogOpen(true);
  };

  const handleSaveTrigger = async () => {
    try {
      if (!formData.name || !formData.event_type || !formData.template_id) {
        toast.error("Name, event type, and template are required");
        return;
      }

      const triggerData = {
        name: formData.name,
        trigger_type: formData.trigger_type,
        event_type: formData.event_type,
        template_id: formData.template_id || null,
        conditions: formData.conditions,
        is_active: formData.is_active,
      };

      if (editingTrigger) {
        const { error } = await supabase
          .from('notification_triggers')
          .update(triggerData)
          .eq('id', editingTrigger.id);

        if (error) throw error;
        toast.success("Trigger updated successfully");
      } else {
        const { error } = await supabase
          .from('notification_triggers')
          .insert(triggerData);

        if (error) throw error;
        toast.success("Trigger created successfully");
      }

      setDialogOpen(false);
      loadTriggers();
    } catch (error) {
      console.error("Error saving trigger:", error);
      toast.error("Failed to save trigger");
    }
  };

  const handleDeleteTrigger = async (id: string) => {
    if (!confirm("Are you sure you want to delete this trigger?")) return;

    try {
      const { error } = await supabase
        .from('notification_triggers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success("Trigger deleted successfully");
      loadTriggers();
    } catch (error) {
      console.error("Error deleting trigger:", error);
      toast.error("Failed to delete trigger");
    }
  };

  const handleToggleActive = async (trigger: EmailTrigger) => {
    try {
      const { error } = await supabase
        .from('notification_triggers')
        .update({ is_active: !trigger.is_active })
        .eq('id', trigger.id);

      if (error) throw error;
      toast.success(`Trigger ${!trigger.is_active ? 'activated' : 'deactivated'}`);
      loadTriggers();
    } catch (error) {
      console.error("Error toggling trigger:", error);
      toast.error("Failed to update trigger");
    }
  };

  const getEventTypeLabel = (eventType: string) => {
    const event = EVENT_TYPES.find(e => e.value === eventType);
    return event ? event.label : eventType;
  };

  const getTemplateNameById = (templateId: string | null) => {
    if (!templateId) return "No template";
    const template = templates.find(t => t.id === templateId);
    return template ? template.name : "Unknown template";
  };

  if (loading) {
    return <div>Loading triggers...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-foreground/70">
            Set up automated email triggers based on user actions and events
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Add New Trigger
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingTrigger ? "Edit Trigger" : "Create New Trigger"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="trigger-name">Trigger Name</Label>
                <Input
                  id="trigger-name"
                  placeholder="e.g., Welcome Email on Registration"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="event-type">Event Type</Label>
                <Select
                  value={formData.event_type}
                  onValueChange={(value) => setFormData({ ...formData, event_type: value })}
                >
                  <SelectTrigger id="event-type">
                    <SelectValue placeholder="Select an event" />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((event) => (
                      <SelectItem key={event.value} value={event.value}>
                        {event.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="template">Email Template</Label>
                <Select
                  value={formData.template_id}
                  onValueChange={(value) => setFormData({ ...formData, template_id: value })}
                >
                  <SelectTrigger id="template">
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No templates available - create one first
                      </SelectItem>
                    ) : (
                      templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {templates.length === 0 && (
                  <p className="text-xs text-foreground/60">
                    Create at least one email template before setting up triggers
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    id="trigger-active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_active: checked })
                    }
                  />
                  <Label htmlFor="trigger-active">Active</Label>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveTrigger}>
                    {editingTrigger ? "Update" : "Create"} Trigger
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {triggers.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-foreground/60 mb-4">
              No triggers created yet. Create your first trigger to automate emails.
            </div>
            <div className="space-y-3">
              <p className="text-sm font-medium text-center">Suggested Triggers:</p>
              <ul className="text-sm text-foreground/70 space-y-2">
                <li>• <strong>Badge Earned</strong> - Send congratulations email when user earns a badge</li>
                <li>• <strong>Challenge Completed</strong> - Notify user after completing a challenge</li>
                <li>• <strong>Weekly Digest</strong> - Send summary of weekly activity</li>
                <li>• <strong>Streak Milestone</strong> - Celebrate consecutive days of activity</li>
                <li>• <strong>Welcome Email</strong> - Onboard new users</li>
                <li>• <strong>Inactivity Reminder</strong> - Re-engage inactive users</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {triggers.map((trigger) => (
            <Card key={trigger.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Zap className="w-5 h-5 text-yellow-500" />
                      <h3 className="font-semibold">{trigger.name}</h3>
                      {!trigger.is_active && (
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-foreground/70 mb-1">
                      <strong>Event:</strong> {getEventTypeLabel(trigger.event_type)}
                    </p>
                    <p className="text-sm text-foreground/70 mb-2">
                      <strong>Template:</strong> {getTemplateNameById(trigger.template_id)}
                    </p>
                    <p className="text-xs text-foreground/50">
                      Created: {new Date(trigger.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenDialog(trigger)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleActive(trigger)}
                    >
                      <Switch checked={trigger.is_active} />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteTrigger(trigger.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
