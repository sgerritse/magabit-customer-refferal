import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Edit, Trash2 } from "lucide-react";

interface Reaction {
  id: string;
  emoji: string;
  label: string;
  challenge_ids: string[];
}

interface Challenge {
  id: string;
  challenge_id: string;
  title: string;
  display_order: number;
}

interface ReactionFormData {
  emoji: string;
  label: string;
  challenge_ids: string[];
}

const initialFormData: ReactionFormData = {
  emoji: "",
  label: "",
  challenge_ids: []
};

export const ReactionsAdmin = () => {
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [editingReaction, setEditingReaction] = useState<Reaction | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<ReactionFormData>(initialFormData);

  // Load from database
  useEffect(() => {
    loadReactions();
    loadChallenges();
  }, []);

  const loadReactions = async () => {
    try {
      const { data, error } = await supabase
        .from('reactions')
        .select('id, reaction_id, emoji, label, challenge_ids, display_order')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;

      if (data) {
        setReactions(data.map(r => ({
          id: r.reaction_id,
          emoji: r.emoji,
          label: r.label,
          challenge_ids: (r.challenge_ids as string[]) || []
        })));
      }
    } catch (error) {
      console.error("Error loading reactions:", error);
    }
  };

  const loadChallenges = async () => {
    try {
      const { data, error } = await supabase
        .from('challenges')
        .select('id, challenge_id, title, display_order')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;

      if (data) {
        setChallenges(data.map(c => ({
          id: c.id,
          challenge_id: c.challenge_id,
          title: c.title,
          display_order: c.display_order
        })));
      }
    } catch (error) {
      console.error("Error loading challenges:", error);
    }
  };

  const handleAddReaction = () => {
    setEditingReaction(null);
    setFormData(initialFormData);
    setIsDialogOpen(true);
  };

  const handleEditReaction = (reaction: Reaction) => {
    setEditingReaction(reaction);
    setFormData({
      emoji: reaction.emoji,
      label: reaction.label,
      challenge_ids: reaction.challenge_ids
    });
    setIsDialogOpen(true);
  };

  const handleSaveReaction = async () => {
    try {
      if (editingReaction) {
        const { error } = await supabase
          .from('reactions')
          .update({
            emoji: formData.emoji,
            label: formData.label,
            challenge_ids: formData.challenge_ids
          })
          .eq('reaction_id', editingReaction.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('reactions')
          .insert({
            reaction_id: Date.now().toString(),
            emoji: formData.emoji,
            label: formData.label,
            challenge_ids: formData.challenge_ids,
            display_order: reactions.length,
            is_active: true
          });

        if (error) throw error;
      }

      await loadReactions();
      setIsDialogOpen(false);
      setFormData(initialFormData);
    } catch (error) {
      console.error("Error saving reaction:", error);
    }
  };

  const handleDeleteReaction = async (id: string) => {
    try {
      const { error } = await supabase
        .from('reactions')
        .update({ is_active: false })
        .eq('reaction_id', id);

      if (error) throw error;
      
      await loadReactions();
    } catch (error) {
      console.error("Error deleting reaction:", error);
    }
  };

  const toggleChallenge = (challengeId: string) => {
    setFormData(prev => ({
      ...prev,
      challenge_ids: prev.challenge_ids.includes(challengeId)
        ? prev.challenge_ids.filter(id => id !== challengeId)
        : [...prev.challenge_ids, challengeId]
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Reactions Management</h2>
          <p className="text-foreground">Manage reaction options for each challenge</p>
        </div>
        <Button onClick={handleAddReaction}>
          <Plus className="w-4 h-4 mr-2" />
          Add Reaction
        </Button>
      </div>

      {/* Reactions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reactions.map((reaction) => (
          <Card key={reaction.id} className="border border-card-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{reaction.emoji}</span>
                  <CardTitle className="text-lg">{reaction.label}</CardTitle>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditReaction(reaction)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteReaction(reaction.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div>
                <p className="text-sm font-medium mb-2">Available for challenges:</p>
                <div className="space-y-1">
                  {reaction.challenge_ids.length > 0 ? (
                    reaction.challenge_ids.map(challengeId => {
                      const challenge = challenges.find(c => c.challenge_id === challengeId);
                      return challenge ? (
                        <div key={challengeId} className="text-xs text-muted-foreground">
                          Day {challenge.display_order}: {challenge.title.substring(0, 40)}...
                        </div>
                      ) : null;
                    })
                  ) : (
                    <div className="text-xs text-muted-foreground italic">
                      No challenges assigned
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>
              {editingReaction ? "Edit Reaction" : "Add New Reaction"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4 px-4 sm:px-6">
            <div>
              <Label htmlFor="emoji">Emoji</Label>
              <Input
                id="emoji"
                value={formData.emoji}
                onChange={(e) => setFormData(prev => ({ ...prev, emoji: e.target.value }))}
                placeholder="😊"
                className="text-2xl text-center border-2 border-gray-300 hover:border-gray-400 focus:border-primary"
                maxLength={2}
              />
            </div>

            <div>
              <Label htmlFor="label">Label</Label>
              <Input
                id="label"
                value={formData.label}
                onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                placeholder="Enter reaction label"
                className="border-2 border-gray-300 hover:border-gray-400 focus:border-primary"
              />
            </div>

            <div>
              <Label>Available for Challenges</Label>
              <div className="space-y-2 mt-2 max-h-48 overflow-y-auto border rounded-lg p-3 bg-muted/20">
                {challenges.map(challenge => (
                  <button
                    key={challenge.id}
                    type="button"
                    onClick={() => toggleChallenge(challenge.challenge_id)}
                    className={`w-full p-3 rounded-lg border text-left transition-colors ${
                      formData.challenge_ids.includes(challenge.challenge_id)
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="text-sm font-medium">Day {challenge.display_order}</div>
                    <div className="text-sm text-muted-foreground">{challenge.title}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t flex-shrink-0">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveReaction}>
              {editingReaction ? "Update" : "Create"} Reaction
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
