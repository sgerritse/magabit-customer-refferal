import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Trophy, Zap, Calendar } from "lucide-react";
import { useBadgeDefinitions, type BadgeDefinition } from "@/hooks/useBadgeDefinitions";

interface BadgeData {
  id: string;
  badge_id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  type: 'challenge' | 'action';
  trigger_type: 'challenge' | 'action';
  challenge_ids: string[];
  action_trigger?: {
    type: string;
    condition: string;
    description: string;
  };
}

const mockBadges: BadgeData[] = [
  {
    id: "commitment-maker",
    badge_id: "commitment-maker",
    name: "Commitment Maker",
    description: "Made a clear commitment to being the best father for your child",
    icon: "🤝",
    points: 15,
    type: 'challenge',
    trigger_type: 'challenge',
    challenge_ids: ["1"]
  },
  {
    id: "storyteller",
    badge_id: "storyteller",
    name: "Storyteller",
    description: "Shared your child's beautiful origin story with them",
    icon: "📚",
    points: 20,
    type: 'challenge',
    trigger_type: 'challenge',
    challenge_ids: ["2"]
  },
  {
    id: "brave-heart",
    badge_id: "brave-heart",
    name: "Brave Heart",
    description: "Courageously shared your first public post with the DadderUp community",
    icon: "🧡",
    points: 30,
    type: 'action',
    trigger_type: 'action',
    challenge_ids: [],
    action_trigger: {
      type: 'first_public_post',
      condition: 'user_makes_first_public_post',
      description: 'Awarded when user shares their first public post to the community'
    }
  },
  {
    id: "public-declarer",
    badge_id: "public-declarer",
    name: "Public Declarer",
    description: "Shared video or audio content publicly with the community",
    icon: "📢",
    points: 25,
    type: 'action',
    trigger_type: 'action',
    challenge_ids: [],
    action_trigger: {
      type: 'public_media_post',
      condition: 'user_shares_video_or_audio_publicly',
      description: 'Awarded when user shares video or audio content publicly'
    }
  },
  {
    id: "video-challenger",
    badge_id: "video-challenger",
    name: "Video Challenger", 
    description: "Created and shared video content",
    icon: "🎥",
    points: 20,
    type: 'action',
    trigger_type: 'action',
    challenge_ids: [],
    action_trigger: {
      type: 'video_content_creator',
      condition: 'user_creates_video_content',
      description: 'Awarded when user creates and shares video content'
    }
  },
  {
    id: "visionary",
    badge_id: "visionary",
    name: "Visionary",
    description: "Created a clear vision for your future fatherhood",
    icon: "🎯",
    points: 20,
    type: 'challenge',
    trigger_type: 'challenge',
    challenge_ids: ["4"]
  },
  {
    id: "anchor-setter",
    badge_id: "anchor-setter",
    name: "Anchor Setter",
    description: "Established a personal mantra to guide your parenting journey",
    icon: "⚓",
    points: 18,
    type: 'challenge',
    trigger_type: 'challenge',
    challenge_ids: ["5"]
  },
  {
    id: "community-engager",
    badge_id: "community-engager",
    name: "Community Engager",
    description: "Actively shared multiple public posts with the community",
    icon: "🤗",
    points: 35,
    type: 'action',
    trigger_type: 'action',
    challenge_ids: [],
    action_trigger: {
      type: 'multiple_public_posts',
      condition: 'user_shares_3_public_posts',
      description: 'Awarded when user shares 3 or more public posts'
    }
  },
  {
    id: "consistency-champion",
    badge_id: "consistency-champion",
    name: "Consistency Champion",
    description: "Completed challenges for 3 consecutive days",
    icon: "🔥",
    points: 25,
    type: 'action',
    trigger_type: 'action',
    challenge_ids: [],
    action_trigger: {
      type: 'streak_milestone',
      condition: 'user_reaches_3_day_streak',
      description: 'Awarded when user maintains a 3-day completion streak'
    }
  },
  {
    id: "dedication-master",
    badge_id: "dedication-master",
    name: "Dedication Master",
    description: "Completed challenges for 7 consecutive days",
    icon: "🏆",
    points: 50,
    type: 'action',
    trigger_type: 'action',
    challenge_ids: [],
    action_trigger: {
      type: 'streak_milestone',
      condition: 'user_reaches_7_day_streak',
      description: 'Awarded when user maintains a 7-day completion streak'
    }
  },
  {
    id: "reflection-master",
    badge_id: "reflection-master",
    name: "Reflection Master",
    description: "Consistently provided thoughtful responses across all challenges",
    icon: "💭",
    points: 40,
    type: 'action',
    trigger_type: 'action',
    challenge_ids: [],
    action_trigger: {
      type: 'consistency_award',
      condition: 'user_completes_all_current_challenges',
      description: 'Awarded when user completes all available challenges with detailed responses'
    }
  }
];

// Available custom action types
const customActionTypes = [
  {
    type: 'first_public_post',
    name: 'First Public Post',
    description: 'User shares their first public post to the community'
  },
  {
    type: 'public_media_post',
    name: 'Public Media Post',
    description: 'User shares video or audio content publicly'
  },
  {
    type: 'video_content_creator',
    name: 'Video Content Creator',
    description: 'User creates and shares video content'
  },
  {
    type: 'multiple_public_posts',
    name: 'Multiple Public Posts',
    description: 'User shares multiple public posts (3+)'
  },
  {
    type: 'streak_milestone',
    name: 'Streak Milestone',
    description: 'User reaches specific streak milestones (7, 14, 30 days)'
  },
  {
    type: 'engagement_champion',
    name: 'Engagement Champion',
    description: 'User actively engages with community (likes, comments)'
  },
  {
    type: 'mentor_badge',
    name: 'Mentor Badge',
    description: 'User helps and encourages other parents'
  },
  {
    type: 'consistency_award',
    name: 'Consistency Award',
    description: 'User logs progress consistently over time'
  },
  {
    type: 'seasonal_halloween',
    name: 'Halloween Special',
    description: 'User completes a challenge on Halloween (October 31st)'
  },
  {
    type: 'seasonal_christmas',
    name: 'Christmas Special',
    description: 'User completes a challenge on Christmas (December 25th)'
  },
  {
    type: 'seasonal_newyear',
    name: 'New Year Special',
    description: 'User completes a challenge on New Year\'s Day (January 1st)'
  },
  {
    type: 'seasonal_thanksgiving',
    name: 'Thanksgiving Special',
    description: 'User completes a challenge on Thanksgiving (4th Thursday of November)'
  },
  {
    type: 'seasonal_fathersday',
    name: 'Father\'s Day Special',
    description: 'User completes a challenge on Father\'s Day (3rd Sunday of June)'
  }
];

const mockChallenges = [
  { id: "1", title: "Make your commitment clear to your child", day_order: 1 },
  { id: "2", title: "Share their origin story", day_order: 2 },
  { id: "3", title: "Record and share your DadderUp journey", day_order: 3 },
  { id: "4", title: "Define your father vision", day_order: 4 },
  { id: "5", title: "Choose your anchor phrase", day_order: 5 },
  { id: "6", title: "Create your DDS tracking board", day_order: 6 },
  { id: "7", title: "Give them your legacy symbol", day_order: 7 }
];

interface BadgeFormData {
  name: string;
  description: string;
  icon: string;
  points: number;
  trigger_type: 'challenge' | 'action';
  challenge_ids: string[];
  action_trigger?: {
    type: string;
    condition: string;
    description: string;
  };
}

const initialFormData: BadgeFormData = {
  name: "",
  description: "",
  icon: "",
  points: 0,
  trigger_type: 'challenge',
  challenge_ids: []
};

export const BadgesAdmin = () => {
  const { badgeDefinitions, updateBadgeDefinitions } = useBadgeDefinitions();
  const [editingBadge, setEditingBadge] = useState<BadgeDefinition | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<BadgeFormData>(initialFormData);

  const handleAddBadge = () => {
    setEditingBadge(null);
    setFormData(initialFormData);
    setIsDialogOpen(true);
  };

  const handleEditBadge = (badge: BadgeData) => {
    setEditingBadge(badge);
    setFormData({
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      points: badge.points,
      trigger_type: badge.trigger_type,
      challenge_ids: badge.challenge_ids,
      action_trigger: badge.action_trigger
    });
    setIsDialogOpen(true);
  };

  const handleSaveBadge = () => {
    if (editingBadge) {
      const updatedBadges = badgeDefinitions.map(b => 
        b.id === editingBadge.id 
          ? { ...b, ...formData, type: formData.trigger_type }
          : b
      );
      updateBadgeDefinitions(updatedBadges);
    } else {
      const newBadge: BadgeDefinition = {
        id: Date.now().toString(),
        badge_id: Date.now().toString(),
        type: formData.trigger_type,
        ...formData
      };
      updateBadgeDefinitions([...badgeDefinitions, newBadge]);
    }
    setIsDialogOpen(false);
    setFormData(initialFormData);
  };

  const handleDeleteBadge = (id: string) => {
    const updatedBadges = badgeDefinitions.filter(b => b.id !== id);
    updateBadgeDefinitions(updatedBadges);
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
          <h2 className="text-2xl font-bold">Badges Management</h2>
          <p className="text-foreground">Create and manage achievement badges</p>
        </div>
        <Button onClick={handleAddBadge}>
          <Plus className="w-4 h-4 mr-2" />
          Add Badge
        </Button>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {badgeDefinitions.map((badge) => (
          <Card key={badge.id} className="border border-card-border">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-accent/10 rounded-lg">
                    <span className="text-xl">{badge.icon}</span>
                  </div>
                  <div>
                    <CardTitle className="text-lg text-card-foreground">{badge.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {badge.description}
                    </p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Trophy className="w-4 h-4 text-accent" />
                      <span className="text-sm font-semibold text-accent">
                        {badge.points} points
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditBadge(badge)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteBadge(badge.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Badge variant={badge.trigger_type === 'challenge' ? 'secondary' : 'outline'} className={badge.trigger_type === 'action' ? "text-xs" : "text-xs"}>
                    {badge.trigger_type === 'challenge' ? 'Challenge Badge' : 'Action Badge'}
                  </Badge>
                </div>
                
                {badge.trigger_type === 'challenge' ? (
                  <div>
                    <p className="text-sm font-medium mb-2 text-foreground">Earned from challenges:</p>
                    <div className="flex flex-wrap gap-1">
                      {badge.challenge_ids.map(challengeId => {
                        const challenge = mockChallenges.find(c => c.id === challengeId);
                        return challenge ? (
                          <Badge key={challengeId} variant="outline" className="text-xs">
                            Day {challenge.day_order}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-medium mb-2 text-foreground">Earned from action:</p>
                    <div className="p-2 bg-accent/10 rounded-lg border border-accent/20">
                      <p className="text-xs text-accent font-medium">
                        {customActionTypes.find(a => a.type === badge.action_trigger?.type)?.name || 'Custom Action'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {badge.action_trigger?.description}
                      </p>
                    </div>
                  </div>
                )}
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
              {editingBadge ? "Edit Badge" : "Add New Badge"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4 px-4 sm:px-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="icon">Icon (Emoji)</Label>
                <Input
                  id="icon"
                  value={formData.icon}
                  onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                  placeholder="🏆"
                  className="text-2xl text-center border-2 border-gray-300 hover:border-gray-400 focus:border-primary"
                  maxLength={2}
                />
              </div>

              <div>
                <Label htmlFor="name">Badge Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter badge name"
                  className="border-2 border-gray-300 hover:border-gray-400 focus:border-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="points">Points Reward</Label>
                <Input
                  id="points"
                  type="number"
                  min="0"
                  value={formData.points}
                  onChange={(e) => setFormData(prev => ({ ...prev, points: parseInt(e.target.value) || 0 }))}
                  placeholder="10"
                  className="border-2 border-gray-300 hover:border-gray-400 focus:border-primary"
                />
              </div>
              
              <div>
                <Label htmlFor="trigger_type">Badge Type</Label>
                <Select 
                  value={formData.trigger_type} 
                  onValueChange={(value: 'challenge' | 'action') => 
                    setFormData(prev => ({ 
                      ...prev, 
                      trigger_type: value,
                      challenge_ids: value === 'action' ? [] : prev.challenge_ids,
                      action_trigger: value === 'challenge' ? undefined : prev.action_trigger
                    }))
                  }
                >
                  <SelectTrigger className="border-2 border-gray-300 hover:border-gray-400 focus:border-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="challenge">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>Challenge Badge</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="action">
                      <div className="flex items-center space-x-2">
                        <Zap className="w-4 h-4" />
                        <span>Action Badge</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter badge description"
                rows={3}
                className="resize-none border-2 border-gray-300 hover:border-gray-400 focus:border-primary"
              />
            </div>

            {formData.trigger_type === 'challenge' ? (
              <div>
                <Label>Earned from Challenges</Label>
                <div className="space-y-2 mt-2 max-h-48 overflow-y-auto border rounded-lg p-3 bg-muted/20">
                  {mockChallenges.map(challenge => (
                    <button
                      key={challenge.id}
                      type="button"
                      onClick={() => toggleChallenge(challenge.id)}
                      className={`w-full p-3 rounded-lg border text-left transition-colors ${
                        formData.challenge_ids.includes(challenge.id)
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="text-sm font-medium">Day {challenge.day_order}</div>
                      <div className="text-sm text-muted-foreground">{challenge.title}</div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <Label>Custom Action Trigger</Label>
                <div className="space-y-3 mt-2">
                  <Select 
                    value={formData.action_trigger?.type || ''} 
                    onValueChange={(value) => {
                      const actionType = customActionTypes.find(a => a.type === value);
                      setFormData(prev => ({ 
                        ...prev, 
                        action_trigger: actionType ? {
                          type: actionType.type,
                          condition: `trigger_${actionType.type}`,
                          description: actionType.description
                        } : undefined
                      }));
                    }}
                  >
                    <SelectTrigger className="border-2 border-gray-300 hover:border-gray-400 focus:border-primary">
                      <SelectValue placeholder="Select action trigger" />
                    </SelectTrigger>
                    <SelectContent>
                      {customActionTypes.map(action => (
                        <SelectItem key={action.type} value={action.type}>
                          <div>
                            <div className="font-medium">{action.name}</div>
                            <div className="text-xs text-muted-foreground">{action.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {formData.action_trigger && (
                    <div className="p-3 bg-accent/10 rounded-lg border border-accent/20">
                      <p className="text-sm font-medium text-accent mb-1">Selected Action:</p>
                      <p className="text-sm text-muted-foreground">
                        {formData.action_trigger.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t flex-shrink-0">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveBadge}>
              {editingBadge ? "Update" : "Create"} Badge
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};