import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Copy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface SMSTemplate {
  id: string;
  name: string;
  message: string;
  variables: string[];
  is_active: boolean;
}

const defaultTemplates = [
  {
    name: "Daily Digest SMS",
    message: "DadderUp Update: Yesterday you had {{clicks}} clicks, {{conversions}} conversions, earned ${{earnings}}. View: {{short_link}}",
    variables: ["clicks", "conversions", "earnings", "short_link"]
  },
  {
    name: "Payout Approved SMS",
    message: "Payout approved! ${{amount}} via {{method}} arriving soon. Track: {{short_link}}",
    variables: ["amount", "method", "short_link"]
  },
  {
    name: "Payout Completed SMS",
    message: "Payment sent! ${{amount}} via {{method}} on its way. Check your account in 1-3 days.",
    variables: ["amount", "method"]
  },
  {
    name: "New Click Alert SMS",
    message: "New click on your {{link_type}} link! Total today: {{daily_clicks}}. Stats: {{short_link}}",
    variables: ["link_type", "daily_clicks", "short_link"]
  },
  {
    name: "New Conversion SMS",
    message: "You earned ${{commission}}! Someone signed up via {{link_type}}. Total: ${{total}}. {{short_link}}",
    variables: ["commission", "link_type", "total", "short_link"]
  },
  {
    name: "Landing Page Approved SMS",
    message: "Your landing page is live! Share it: {{landing_page_url}}",
    variables: ["landing_page_url"]
  },
  {
    name: "Landing Page Rejected SMS",
    message: "Landing page needs revision. Reason: {{reason}}. Edit now: {{short_link}}",
    variables: ["reason", "short_link"]
  },
  {
    name: "Missing Payout Method SMS",
    message: "Action needed! Set up your payout method to receive ${{amount}}. Go to: {{short_link}}",
    variables: ["amount", "short_link"]
  }
];

export const SMSTemplateManager = () => {
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<SMSTemplate | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', message: '', is_active: true });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    const { data, error } = await supabase
      .from("sms_templates")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error loading templates:", error);
      return;
    }

    if (!data || data.length === 0) {
      // Seed default templates
      await seedDefaultTemplates();
    } else {
      setTemplates(data.map(t => ({
        id: t.id,
        name: t.name,
        message: t.message,
        variables: (t.variables as string[]) || [],
        is_active: t.is_active || false
      })));
    }
  };

  const seedDefaultTemplates = async () => {
    const { error } = await supabase
      .from("sms_templates")
      .insert(defaultTemplates.map(t => ({ ...t, is_active: true })));

    if (!error) {
      loadTemplates();
    }
  };

  const handleSave = async () => {
    if (formData.message.length > 160) {
      toast.error("SMS message must be 160 characters or less");
      return;
    }

    if (editingTemplate) {
      const { error } = await supabase
        .from("sms_templates")
        .update({ name: formData.name, message: formData.message, is_active: formData.is_active })
        .eq("id", editingTemplate.id);

      if (error) {
        toast.error("Failed to update template");
        return;
      }
    } else {
      const { error } = await supabase
        .from("sms_templates")
        .insert({ ...formData, variables: [] });

      if (error) {
        toast.error("Failed to create template");
        return;
      }
    }

    toast.success(editingTemplate ? "Template updated" : "Template created");
    setIsDialogOpen(false);
    loadTemplates();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("sms_templates")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete template");
      return;
    }

    toast.success("Template deleted");
    loadTemplates();
  };

  const insertVariable = (variable: string) => {
    setFormData(prev => ({
      ...prev,
      message: prev.message + `{{${variable}}}`
    }));
  };

  const charCount = formData.message.length;
  const charColor = charCount > 160 ? 'text-red-500' : charCount > 140 ? 'text-yellow-500' : 'text-muted-foreground';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold">SMS Templates</h3>
          <p className="text-muted-foreground">Manage SMS notification templates (160 char limit)</p>
        </div>
        <Button onClick={() => {
          setEditingTemplate(null);
          setFormData({ name: '', message: '', is_active: true });
          setIsDialogOpen(true);
        }}>
          <Plus className="w-4 h-4 mr-2" />
          Add SMS Template
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((template) => (
          <Card key={template.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{template.name}</CardTitle>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingTemplate(template);
                      setFormData({ name: template.name, message: template.message, is_active: template.is_active });
                      setIsDialogOpen(true);
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(template.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm font-mono bg-muted p-3 rounded">{template.message}</p>
              <div className="flex items-center justify-between text-xs">
                <span className={charColor}>{template.message.length}/160 chars</span>
                <Badge variant={template.is_active ? "default" : "outline"}>
                  {template.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? "Edit" : "Create"} SMS Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Template Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Daily Digest SMS"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Message</Label>
                <span className={`text-sm ${charColor} font-medium`}>{charCount}/160</span>
              </div>
              <Textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Your SMS message here..."
                rows={4}
                maxLength={160}
              />
            </div>

            <div>
              <Label className="mb-2 block">Insert Variables</Label>
              <div className="flex flex-wrap gap-2">
                {['user_name', 'clicks', 'conversions', 'earnings', 'amount', 'method', 'link_type', 'short_link'].map(v => (
                  <Button
                    key={v}
                    size="sm"
                    variant="outline"
                    onClick={() => insertVariable(v)}
                    type="button"
                  >
                    {v}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="sms-active">Active</Label>
              <Switch
                id="sms-active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSave} className="flex-1">
                {editingTemplate ? "Update" : "Create"} Template
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
