import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Pause } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface PauseReminderTip {
  id: string;
  tip_text: string;
  emoji: string;
  display_order: number;
  is_active: boolean;
}

export const PauseRemindersAdmin = () => {
  const [tips, setTips] = useState<PauseReminderTip[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTip, setEditingTip] = useState<PauseReminderTip | null>(null);
  const [formData, setFormData] = useState({
    tip_text: "",
    emoji: "📱",
    is_active: true,
  });

  // Fetch tips from database
  const fetchTips = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("pause_reminder_tips")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      setTips((data as unknown as PauseReminderTip[]) || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTips();
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingTip) {
        // Update existing tip
        const { error } = await (supabase as any)
          .from("pause_reminder_tips")
          .update({
            tip_text: formData.tip_text,
            emoji: formData.emoji,
            is_active: formData.is_active,
          })
          .eq("id", editingTip.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Tip updated successfully",
        });
      } else {
        // Create new tip
        const maxOrder = tips.length > 0 ? Math.max(...tips.map(t => t.display_order)) : 0;
        
        const { error } = await (supabase as any)
          .from("pause_reminder_tips")
          .insert({
            tip_text: formData.tip_text,
            emoji: formData.emoji,
            display_order: maxOrder + 1,
            is_active: formData.is_active,
          });

        if (error) throw error;

        toast({
          title: "Success",
          description: "Tip created successfully",
        });
      }

      setDialogOpen(false);
      setEditingTip(null);
      setFormData({ tip_text: "", emoji: "📱", is_active: true });
      fetchTips();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this tip?")) return;

    try {
      const { error } = await (supabase as any)
        .from("pause_reminder_tips")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Tip deleted successfully",
      });

      fetchTips();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Handle edit
  const handleEdit = (tip: PauseReminderTip) => {
    setEditingTip(tip);
    setFormData({
      tip_text: tip.tip_text,
      emoji: tip.emoji,
      is_active: tip.is_active,
    });
    setDialogOpen(true);
  };

  // Toggle active status
  const toggleActive = async (tip: PauseReminderTip) => {
    try {
      const { error } = await (supabase as any)
        .from("pause_reminder_tips")
        .update({ is_active: !tip.is_active })
        .eq("id", tip.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Tip ${!tip.is_active ? "activated" : "deactivated"}`,
      });

      fetchTips();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-4">Loading tips...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Pause className="w-6 h-6 text-primary" />
            <CardTitle>Pause Reminders Tips</CardTitle>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingTip(null);
                  setFormData({ tip_text: "", emoji: "📱", is_active: true });
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Tip
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingTip ? "Edit Tip" : "Add New Tip"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="emoji">Emoji</Label>
                  <Input
                    id="emoji"
                    value={formData.emoji}
                    onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
                    placeholder="📱"
                    maxLength={2}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="tip_text">Tip Text</Label>
                  <Input
                    id="tip_text"
                    value={formData.tip_text}
                    onChange={(e) => setFormData({ ...formData, tip_text: e.target.value })}
                    placeholder="Schedule a quick FaceTime or video call just to say hi."
                    required
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    {editingTip ? "Update" : "Create"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setDialogOpen(false);
                      setEditingTip(null);
                      setFormData({ tip_text: "", emoji: "📱", is_active: true });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Manage tips shown to users when they pause reminders. 3 random active tips are displayed each time.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {tips.map((tip) => (
            <div
              key={tip.id}
              className={`flex items-center justify-between p-4 rounded-lg border border-border ${
                tip.is_active ? "bg-card" : "bg-muted/50"
              }`}
            >
              <div className="flex items-center gap-3 flex-1">
                <span className="text-2xl">{tip.emoji}</span>
                <span className={tip.is_active ? "text-gray-900" : "text-muted-foreground"}>
                  {tip.tip_text}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleActive(tip)}
                  className="text-gray-700 hover:text-gray-900"
                >
                  {tip.is_active ? "Deactivate" : "Activate"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(tip)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(tip.id)}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </div>
          ))}
          {tips.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No tips yet. Click "Add Tip" to create your first tip.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
