import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PenTool, Star, Clock, Video, Mic, Image, Eye, Lock, Trophy, X, CalendarIcon, ChevronLeft, ChevronRight, Lightbulb, Users, List, Check, ShoppingCart, AlertCircle, Globe } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { useChallenges, type Challenge } from "@/hooks/useChallenges";
import { useAnswerLogs } from "@/hooks/useAnswerLogs";
import { useUserStats } from "@/hooks/useUserStats";
import { useBadgeDefinitions } from "@/hooks/useBadgeDefinitions";
import { useAuth } from "@/hooks/useAuth";
import { useAdminSwitch } from "@/contexts/AdminSwitchContext";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { StepProgress } from "./StepProgress";
import ChallengeContent from "./ChallengeContent";
import { CommunityPosts } from "./CommunityPosts";
import { EmojiExplosion } from "./EmojiExplosion";
import { AudioRecorderComponent } from "@/components/ui/audio-recorder";
import { VideoRecorderComponent } from "@/components/ui/video-recorder";
import { PhotoCaptureComponent } from "@/components/ui/photo-capture";

// Input validation schema
const experienceSchema = z.object({
  experience: z.string().trim().max(2000, {
    message: "Experience must be less than 2000 characters"
  })
});
export const LogFormSection = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [privacy, setPrivacy] = useState("private");
  const [selectedReactions, setSelectedReactions] = useState<string[]>([]);
  const [selectedParentReactions, setSelectedParentReactions] = useState<string[]>([]);
  const [experience, setExperience] = useState("");
  const [timeSpent, setTimeSpent] = useState("");
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [noKidsToday, setNoKidsToday] = useState(false);
  const [returnDate, setReturnDate] = useState<Date>();
  const [showPauseDialog, setShowPauseDialog] = useState(false);
  const [showPublicConfirm, setShowPublicConfirm] = useState(false);
  const [reactionsVersion, setReactionsVersion] = useState(0);
  const [parentReactionsVersion, setParentReactionsVersion] = useState(0);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [showExamples, setShowExamples] = useState(false);
  const [allChallengesOpen, setAllChallengesOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{
    image?: File;
    video?: File;
    audio?: File;
  }>({});
  const [uploading, setUploading] = useState(false);
  const [lastSubmission, setLastSubmission] = useState<{
    experience: string;
    selectedParentReactions: string[];
    timeSpent: string;
    selectedReactions: string[];
    uploadedFiles: {
      image?: File;
      video?: File;
      audio?: File;
    };
  } | null>(null);

  // Auth and admin context
  const {
    user
  } = useAuth();
  const {
    isInUserMode,
    switchedUserId
  } = useAdminSwitch();

  // Load reactions and parent reactions from database
  const [allReactions, setAllReactions] = useState<any[]>([]);
  const [allParentReactions, setAllParentReactions] = useState<any[]>([]);
  useEffect(() => {
    const loadReactions = async () => {
      const [{
        data: reactions
      }, {
        data: parent
      }] = await Promise.all([supabase.from('reactions').select('reaction_id, emoji, label, is_active, display_order').eq('is_active', true).order('display_order'), supabase.from('parent_reactions').select('reaction_id, emoji, label, is_active, display_order').eq('is_active', true).order('display_order')]);
      setAllReactions((reactions || []).map(r => ({
        id: String(r.reaction_id),
        emoji: r.emoji,
        label: r.label
      })));
      setAllParentReactions((parent || []).map(r => ({
        id: String(r.reaction_id),
        emoji: r.emoji,
        label: r.label
      })));
    };
    loadReactions();
  }, []);

  // Determine effective user ID (respects Admin Switch)
  const effectiveUserId = isInUserMode && switchedUserId ? switchedUserId : user?.id;

  // Load pause reminders settings on mount
  useEffect(() => {
    const loadPauseSettings = async () => {
      if (!effectiveUserId) return;
      const {
        data,
        error
      } = await supabase.from('users').select('reminders_paused, reminders_resume_date').eq('id', effectiveUserId).single();
      if (!error && data) {
        setNoKidsToday(data.reminders_paused);
        if (data.reminders_resume_date) {
          setReturnDate(new Date(data.reminders_resume_date));
        }
      }
    };
    loadPauseSettings();
  }, [effectiveUserId]);

  // Save pause reminders settings when they change
  useEffect(() => {
    const savePauseSettings = async () => {
      if (!effectiveUserId) return;
      await supabase.from('users').update({
        reminders_paused: noKidsToday,
        reminders_resume_date: returnDate ? returnDate.toISOString().split('T')[0] : null
      }).eq('id', effectiveUserId);
    };

    // Only save if we've loaded the initial state
    if (effectiveUserId) {
      savePauseSettings();
    }
  }, [noKidsToday, returnDate, effectiveUserId]);

  // Refs for file inputs
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const {
    challenges,
    todaysChallenge,
    refreshCompletedChallenges,
    completedChallenges,
    isChallengeUnlocked
  } = useChallenges();
  const {
    addLog
  } = useAnswerLogs();
  const {
    addPoints,
    awardBadge
  } = useUserStats();
  const {
    getChallengeBadges,
    getActionBadges,
    getBadgeById
  } = useBadgeDefinitions();

  // Use selected challenge if available, otherwise fall back to today's challenge
  const currentChallenge = selectedChallenge || todaysChallenge;

  // Listen for challenge selection events from other components
  useEffect(() => {
    const handleChallengeLoad = (event: CustomEvent) => {
      const challenge = event.detail;
      setSelectedChallenge(challenge);
      // Reset form when loading a different challenge
      setCurrentStep(1);
      setRating(0);
      setExperience("");
      setTimeSpent("");
      setSelectedReactions([]);
      setSelectedParentReactions([]);
      setUploadedFiles({});
      setShowCongratulations(false);
    };
    window.addEventListener('dadderup-load-challenge', handleChallengeLoad as EventListener);
    return () => {
      window.removeEventListener('dadderup-load-challenge', handleChallengeLoad as EventListener);
    };
  }, []);

  // Keep in sync if Admin updates in another tab/window/iframe or same document
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'dadderup-reactions') {
        setReactionsVersion(v => v + 1);
      }
      if (e.key === 'dadderup-parent-reactions') {
        setParentReactionsVersion(v => v + 1);
      }
    };
    const onReactionsCustom = () => setReactionsVersion(v => v + 1);
    const onParentReactionsCustom = () => setParentReactionsVersion(v => v + 1);
    window.addEventListener('storage', onStorage);
    window.addEventListener('dadderup-reactions-changed', onReactionsCustom as EventListener);
    window.addEventListener('dadderup-parent-reactions-changed', onParentReactionsCustom as EventListener);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('dadderup-reactions-changed', onReactionsCustom as EventListener);
      window.removeEventListener('dadderup-parent-reactions-changed', onParentReactionsCustom as EventListener);
    };
  }, []);

  // Get reactions for the current challenge
  const getReactionsForChallenge = () => {
    if (!currentChallenge || !currentChallenge.reactions || currentChallenge.reactions.length === 0) {
      // No reactions configured for this challenge - return empty array
      return [];
    }

    // Build reactions list from DB state
    const available = (currentChallenge.reactions || []).map(reactionId => allReactions.find(r => r.id === String(reactionId))).filter(Boolean) as any[];
    return available.map(reaction => ({
      emoji: reaction.emoji,
      label: reaction.label,
      id: reaction.id
    }));
  };
  const reactions = getReactionsForChallenge();

  // Get parent reactions for the current challenge
  const getParentReactionsForChallenge = () => {
    if (!currentChallenge || !currentChallenge.id) {
      // No challenge available - return empty array
      return [];
    }

    // Build from DB state
    const availableReactions = (currentChallenge.parentReactions || []).map((reactionId: string | number) => allParentReactions.find((r: any) => r.id === String(reactionId))).filter(Boolean) as any[];
    if (!availableReactions.length) {
      return [];
    }
    return availableReactions.map((reaction: any) => ({
      emoji: reaction.emoji,
      label: reaction.label,
      id: reaction.id
    }));
  };
  const parentReactions = getParentReactionsForChallenge();
  const toggleReaction = (reactionId: string) => {
    setSelectedReactions(prev => prev.includes(reactionId) ? prev.filter(id => id !== reactionId) : [...prev, reactionId]);
  };
  const toggleParentReaction = (reactionId: string) => {
    setSelectedParentReactions(prev => prev.includes(reactionId) ? prev.filter(id => id !== reactionId) : [...prev, reactionId]);
  };

  // File upload handlers
  const handleFileSelect = (type: 'image' | 'video' | 'audio', file: File | null) => {
    if (file) {
      setUploadedFiles(prev => ({
        ...prev,
        [type]: file
      }));
    }
  };
  const handleFileRemove = (type: 'image' | 'video' | 'audio') => {
    setUploadedFiles(prev => {
      const newFiles = {
        ...prev
      };
      delete newFiles[type];
      return newFiles;
    });
  };
  const uploadFileToSupabase = async (file: File, type: string) => {
    try {
      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `temp-user/${fileName}`;
      const {
        data,
        error
      } = await supabase.storage.from('challenge-media').upload(filePath, file);
      if (error) {
        throw error;
      }

      // Get public URL
      const {
        data: urlData
      } = supabase.storage.from('challenge-media').getPublicUrl(filePath);
      return {
        type: type as 'image' | 'video' | 'audio',
        url: urlData.publicUrl,
        name: file.name
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload Error",
        description: `Failed to upload ${file.name}`,
        variant: "destructive"
      });
      return null;
    }
  };
  const handleCompleteChallenge = async () => {
    if (!currentChallenge) {
      toast({
        title: "Error",
        description: "No challenge available to complete",
        variant: "destructive"
      });
      return;
    }

    // Validate user input with zod schema
    const validation = experienceSchema.safeParse({
      experience
    });
    if (!validation.success) {
      const errorMessage = validation.error.errors[0]?.message || "Invalid input";
      toast({
        title: "Validation Error",
        description: errorMessage,
        variant: "destructive"
      });
      return;
    }
    setUploading(true);
    try {
      // Store current submission data before uploading
      const currentSubmission = {
        experience,
        selectedParentReactions: [...selectedParentReactions],
        timeSpent,
        selectedReactions: [...selectedReactions],
        uploadedFiles: {
          ...uploadedFiles
        }
      };
      setLastSubmission(currentSubmission);

      // Upload files if any
      const mediaFiles = [];
      for (const [type, file] of Object.entries(uploadedFiles)) {
        if (file) {
          const uploadedFile = await uploadFileToSupabase(file, type);
          if (uploadedFile) {
            mediaFiles.push(uploadedFile);
          }
        }
      }
      const newLog = {
        challengeId: currentChallenge.id,
        challengeTitle: currentChallenge.title,
        userName: "Demo User",
        userAvatar: "/placeholder.svg",
        response: experience,
        parentReactions: selectedParentReactions,
        timeSpent: parseInt(timeSpent) || 0,
        privacy: privacy as 'public' | 'private',
        submissionType: mediaFiles.length > 0 ? mediaFiles[0].type : "text",
        mediaFiles: mediaFiles,
        pointsEarned: currentChallenge.pointsEarned,
        reaction: selectedReactions[0] || "😊",
        childReactions: selectedReactions
      };
      addLog(newLog);

      // Award points for completing the challenge (base points only if 50+ characters)
      if (experience.trim().length >= 50) {
        await addPoints(currentChallenge.pointsEarned, `Completed challenge: ${currentChallenge.title}`, 'challenge', currentChallenge.id.toString());
      }

      // Award challenge-specific badges
      const challengeBadges = getChallengeBadges(currentChallenge.id.toString());
      console.log('🏆 Found challenge badges:', challengeBadges.length);
      for (const badgeDef of challengeBadges) {
        console.log('🎯 Awarding challenge badge:', badgeDef.name);
        await awardBadge(badgeDef.id, badgeDef.name, badgeDef.icon, badgeDef.description, badgeDef.points);
      }

      // Award action-based badges
      if (privacy === 'public') {
        console.log('🌟 Awarding action badges for public post');

        // Award "Brave Heart" for first public post
        const braveHeartBadge = getBadgeById('brave-heart');
        if (braveHeartBadge) {
          const braveHeartResult = await awardBadge(braveHeartBadge.id, braveHeartBadge.name, braveHeartBadge.icon, braveHeartBadge.description, braveHeartBadge.points);
          if (braveHeartResult) {
            console.log('🎉 Brave Heart badge awarded!');
          }
        }

        // Award "Public Declarer" if they shared video/audio publicly
        if (currentChallenge.submissionTypes.video || currentChallenge.submissionTypes.audio) {
          console.log('🎥 Challenge supports video/audio, awarding Public Declarer');
          const publicDeclarerBadge = getBadgeById('public-declarer');
          if (publicDeclarerBadge) {
            const publicDeclarerResult = await awardBadge(publicDeclarerBadge.id, publicDeclarerBadge.name, publicDeclarerBadge.icon, publicDeclarerBadge.description, publicDeclarerBadge.points);
            if (publicDeclarerResult) {
              console.log('🎉 Public Declarer badge awarded!');
            }
          }
        }
      }

      // Refresh completed challenges so next challenge becomes available
      await refreshCompletedChallenges();

      // Reset form
      setCurrentStep(1);
      setExperience("");
      setSelectedParentReactions([]);
      setTimeSpent("");
      setSelectedReactions([]);
      setUploadedFiles({});

      // Show congratulations message
      setShowCongratulations(true);
    } catch (error) {
      console.error('Error completing challenge:', error);
      toast({
        title: "Error",
        description: "Failed to complete challenge. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };
  const handleSkipToNextDay = async () => {
    if (!currentChallenge || !user) return;
    try {
      const effectiveUserId = isInUserMode && switchedUserId ? switchedUserId : user.id;

      // Create a minimal answer log entry to mark the challenge as completed
      const {
        error
      } = await supabase.from('answer_logs').insert({
        user_id: effectiveUserId,
        challenge_id: currentChallenge.id,
        challenge_title: currentChallenge.title,
        response: "Skipped to next day",
        rating: 0,
        time_spent: 0,
        points_earned: 0,
        submission_type: "skip",
        privacy: "private",
        user_name: "User",
        // This will be updated by the database if needed
        user_avatar: null
      });
      if (error) {
        console.error('Error skipping to next day:', error);
        toast({
          title: "Error",
          description: "Failed to skip to next day. Please try again.",
          variant: "destructive"
        });
        return;
      }
      setShowCongratulations(false);
      await refreshCompletedChallenges();
      toast({
        title: "Skipped to Next Day!",
        description: "Your next challenge is now available."
      });
    } catch (error) {
      console.error('Error skipping to next day:', error);
      toast({
        title: "Error",
        description: "Failed to skip to next day. Please try again.",
        variant: "destructive"
      });
    }
  };
  const handleCloseCongratulations = () => {
    // Restore the last submission data when they choose to wait
    if (lastSubmission) {
      setExperience(lastSubmission.experience);
      setSelectedParentReactions(lastSubmission.selectedParentReactions);
      setTimeSpent(lastSubmission.timeSpent);
      setSelectedReactions(lastSubmission.selectedReactions);
      setUploadedFiles(lastSubmission.uploadedFiles);
    }
    setShowCongratulations(false);
  };
  const goToNextStep = () => {
    // If pausing reminders on step 2, show dialog instead of advancing
    if (currentStep === 2 && noKidsToday) {
      setShowPauseDialog(true);
      return;
    }
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  // Random tips for staying connected
  const connectionTips = ["📱 Schedule a quick FaceTime or video call just to say hi.", "😂 Send a funny meme, joke, or voice note to brighten their day.", "✍️ Write down one thing you want to share with them when you're back together.", "🎁 Pick up a small gift or snack they love for their return.", "📷 Send a picture of something from your day to make them feel included.", "❤️ Plan a \"welcome back\" activity, even something small like a favorite meal or game."];

  // Get 3 random tips
  const getRandomTips = () => {
    const shuffled = [...connectionTips].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  };
  const [displayedTips] = useState(() => getRandomTips());
  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Calculate total points based on completed actions
  const calculateTotalPoints = () => {
    let total = 0;

    // Base points only if experience is 50+ characters
    if (experience.trim().length >= 50) {
      total += currentChallenge?.pointsEarned || 0;
    }

    // Add badge points for this challenge (always available)
    if (currentChallenge) {
      const challengeBadges = getChallengeBadges(currentChallenge.id.toString());
      const badgePoints = challengeBadges.reduce((sum, badge) => sum + (badge.points || 0), 0);
      total += badgePoints;
    }

    // Add bonus points for uploads
    if (uploadedFiles.image) total += currentChallenge?.imagePoints || 3;
    if (uploadedFiles.video) total += currentChallenge?.videoPoints || 10;
    if (uploadedFiles.audio) total += currentChallenge?.audioPoints || 5;
    return total;
  };

  // Check if challenge meets completion requirements
  const isValidForCompletion = () => {
    // Challenge can always be completed - no requirements enforced
    return true;
  };

  // Social sharing component
  const ShareButtons = ({
    challengeTitle
  }: {
    challengeTitle: string;
  }) => {
    const shareText = `Just completed the "${challengeTitle}" challenge on DadderUp! 💪 Building better parenting habits one day at a time. Join me on this journey! #DadderUp #ParentingGoals`;
    const shareUrl = "https://dadderup.com";
    const shareToTwitter = () => {
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
      window.open(twitterUrl, '_blank', 'noopener,noreferrer');
    };
    const shareToFacebook = () => {
      const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
      window.open(facebookUrl, '_blank', 'noopener,noreferrer');
    };
    const shareToLinkedIn = () => {
      const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent('DadderUp Challenge Completed')}&summary=${encodeURIComponent(shareText)}`;
      window.open(linkedInUrl, '_blank', 'noopener,noreferrer');
    };
    const copyToClipboard = async () => {
      try {
        await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
        toast({
          title: "Copied to clipboard!",
          description: "Share text has been copied to your clipboard."
        });
      } catch (err) {
        toast({
          title: "Copy failed",
          description: "Please manually copy the text.",
          variant: "destructive"
        });
      }
    };
    return <div className="mb-6">
        <p className="text-sm text-gray-600 mb-3">Share your achievement:</p>
        <div className="flex flex-wrap gap-2 justify-center">
          <Button onClick={shareToTwitter} variant="outline" size="sm" className="bg-blue-50 hover:bg-blue-400 text-blue-600 border-blue-200">
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Twitter
          </Button>
          <Button onClick={shareToFacebook} variant="outline" size="sm" className="bg-blue-50 hover:bg-blue-400 text-blue-700 border-blue-200">
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            Facebook
          </Button>
          <Button onClick={shareToLinkedIn} variant="outline" size="sm" className="bg-blue-50 hover:bg-blue-400 text-blue-800 border-blue-200">
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
            LinkedIn
          </Button>
          <Button onClick={copyToClipboard} variant="outline" size="sm" className="bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200">
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
              <path d="m4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
            </svg>
            Copy
          </Button>
        </div>
      </div>;
  };
  return <section className="relative">
      {/* Emoji Explosion - Behind the congratulations card */}
      <EmojiExplosion active={showCongratulations} />
      
      {/* Congratulations Overlay */}
      {showCongratulations && <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl p-8 text-center max-w-md mx-4 animate-scale-in">
            <div className="mb-6">
              <Trophy className="w-20 h-20 mx-auto text-yellow-500 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Congratulations!
              </h2>
              <p className="text-lg text-gray-700 mb-4">
                Your progress has been logged!
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-green-700 font-medium">
                  You earned {calculateTotalPoints()} point{calculateTotalPoints() !== 1 ? 's' : ''} for completing this challenge! 🎯
                </p>
              </div>
            </div>
            
            {currentChallenge && <ShareButtons challengeTitle={currentChallenge.title} />}
            
            <div className="mb-8">
              <p className="text-gray-600 mb-4">
                Come back tomorrow to see your next DadderUp challenge...or click the button below to skip ahead to the next day!
              </p>
            </div>
            
            <div className="space-y-3">
              <Button onClick={handleSkipToNextDay} className="w-full bg-primary hover:bg-primary text-white" size="lg">
                Skip to Next Day 🚀
              </Button>
              <Button onClick={handleCloseCongratulations} variant="outline" className="w-full" size="lg">
                I'll Wait Until Tomorrow
              </Button>
            </div>
          </div>
        </div>}

      {/* Show a "Back to Today's Challenge" button if viewing a different challenge */}
      {selectedChallenge && selectedChallenge.id !== todaysChallenge?.id && <div className="mb-4">
          <Button variant="outline" size="sm" onClick={() => setSelectedChallenge(null)} className="text-xs">
            ← Back to Today's Challenge
          </Button>
        </div>}

      <Card className="card-gradient border-card-border">
        <CardHeader>
          {/* Date and See All Challenges Button */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-6">
            <span className="text-xs sm:text-sm whitespace-nowrap" style={{
            color: 'hsl(var(--day-label-text))'
          }}>
              Day {currentChallenge?.ordering || 1}
            </span>
            
            <Dialog open={allChallengesOpen} onOpenChange={setAllChallengesOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-xs sm:text-sm px-2 sm:px-3 py-1 h-auto transition-all duration-300 hover:shadow-md" style={{
                backgroundColor: 'hsl(var(--view-challenges-btn-bg))',
                color: 'hsl(var(--view-challenges-btn-text))',
                borderColor: 'hsl(var(--view-challenges-btn-border))'
              }}>
                  <List className="w-3 h-3 sm:w-4 sm:h-4 mr-[2px]" />
                  <span className="whitespace-nowrap text-neutral-900">View Challenges</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl mx-4 max-h-[80vh] overflow-y-auto bg-white">
                <DialogHeader>
                  <DialogTitle className="text-black">All Challenges</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  {challenges.sort((a, b) => a.ordering - b.ordering).map(challenge => {
                  const isCompleted = completedChallenges.includes(challenge.id);
                  const isUnlocked = isChallengeUnlocked(challenge.id);
                  const isCurrent = challenge.id === todaysChallenge?.id;
                  const canView = isCompleted || isCurrent;
                  return <div key={challenge.id} className={`p-3 sm:p-4 border rounded-lg ${isUnlocked ? 'bg-white' : 'bg-gray-50 opacity-60'}`}>
                             <div className="flex flex-col gap-3">
                               <div className="flex items-start space-x-3">
                                 <div className={`flex items-center justify-center w-6 h-6 rounded-full flex-shrink-0 border-2 ${isCompleted ? 'border-success bg-success' : isUnlocked ? 'border-success bg-white' : 'border-gray-300 bg-gray-100'}`}>
                                   {isCompleted ? <Check className="w-4 h-4 text-white" /> : isUnlocked ? <div className="w-2 h-2 rounded-full bg-success" /> : <div className="w-2 h-2 rounded-full bg-gray-400" />}
                                 </div>
                                 <div className="flex-1 min-w-0">
                                   <div className="flex items-center space-x-2 mb-2">
                                     <span className={`text-sm font-medium ${isUnlocked ? 'text-gray-500' : 'text-gray-400'}`}>
                                       Day {challenge.ordering}
                                     </span>
                                      {isCompleted && <span className="px-2 py-1 bg-success text-white text-xs rounded-full">
                                          Completed
                                        </span>}
                                     {isCurrent && !isCompleted && <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                         Current
                                       </span>}
                                     {!isUnlocked && <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                                         Locked
                                       </span>}
                                   </div>
                                    <div className="flex items-center justify-between">
                                      <h4 className={`font-semibold break-words ${isUnlocked ? 'text-black' : 'text-gray-400'}`}>
                                        {isUnlocked ? challenge.title : 'Complete previous challenges to unlock'}
                                      </h4>
                                     {canView && <Button variant="outline" size="sm" className="ml-2 text-xs" onClick={() => {
                              const event = new CustomEvent('dadderup-load-challenge', {
                                detail: challenge
                              });
                              window.dispatchEvent(event);
                              setAllChallengesOpen(false);
                            }}>
                                           <Eye className="w-3 h-3 mr-1" />
                                           {isCompleted ? 'Review' : 'View'}
                                         </Button>}
                                    </div>
                                 </div>
                               </div>
                             </div>
                           </div>;
                })}
                   </div>
                </DialogContent>
              </Dialog>
            </div>

          <CardTitle className="flex items-center justify-center space-x-3 mb-4">
            <div className="p-2 bg-accent/10 rounded-xl">
              <Lightbulb className="w-6 h-6 text-accent" />
            </div>
            <span>Today's Challenge: {currentChallenge?.title || 'Challenge'}</span>
          </CardTitle>
          <StepProgress currentStep={currentStep} totalSteps={5} />
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Challenge Information */}
          {currentStep === 1 && <div className="space-y-4">
              {/* Tab Navigation */}
              <div className="flex gap-2 p-1 rounded-lg" style={{
            backgroundColor: 'hsl(var(--tab-container-bg))'
          }}>
                <button onClick={() => setShowExamples(false)} className="flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors shadow-sm" style={{
              backgroundColor: !showExamples ? 'hsl(var(--tab-active-bg))' : 'transparent',
              color: !showExamples ? 'hsl(var(--tab-active-text))' : 'hsl(var(--tab-inactive-text))'
            }}>
                  Challenge
                </button>
                <button onClick={() => setShowExamples(true)} className="flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors shadow-sm" style={{
              backgroundColor: showExamples ? 'hsl(var(--tab-active-bg))' : 'transparent',
              color: showExamples ? 'hsl(var(--tab-active-text))' : 'hsl(var(--tab-inactive-text))'
            }}>
                  Community Examples
                </button>
              </div>

              {/* Tab Content */}
              {!showExamples ? <div className="prose prose-lg max-w-none">
                  <div className="p-6 bg-success/5 rounded-2xl border border-success/20">
                    {/* YouTube Video Embed */}
                    {currentChallenge?.video_url && (() => {
                const getYoutubeEmbedUrl = (url: string) => {
                  // Handle youtube.com/watch?v=VIDEO_ID
                  const watchMatch = url.match(/(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]+)/);
                  if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;

                  // Handle youtu.be/VIDEO_ID
                  const shortMatch = url.match(/(?:youtu\.be\/)([a-zA-Z0-9_-]+)/);
                  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;

                  // Handle youtube.com/embed/VIDEO_ID (already embed)
                  if (url.includes('youtube.com/embed/')) return url;
                  return url;
                };
                const embedUrl = getYoutubeEmbedUrl(currentChallenge.video_url);
                return <div className="mb-4 aspect-video max-w-2xl mx-auto">
                          <iframe src={embedUrl} width="100%" height="100%" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="rounded-lg" />
                        </div>;
              })()}
                    
                    <ChallengeContent content={currentChallenge?.description || ''} className="text-foreground" />
                    
                    <div className="mt-4 p-4 bg-white rounded-xl border">
                      <p className="text-sm font-medium text-black">💡 Quick Tip:</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {currentChallenge?.tip || 'No tip available'}
                      </p>
                    </div>
                  </div>
                </div> : <div className="p-6 bg-white rounded-2xl border">
                  <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-accent" />
                    Community Examples
                  </h3>
                  <CommunityPosts day={currentChallenge?.ordering || 1} />
                </div>}
            </div>}

          {/* Step 2: Log Challenge Progress */}
          {currentStep === 2 && <div className="space-y-6">
              {/* Pause Reminders section */}
          <div className="border-2 border-amber-200 rounded-xl p-6 bg-amber-50/50">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
              <div className="flex-1">
                <Label htmlFor="no-kids-toggle" className="text-base font-semibold text-gray-900 cursor-pointer">
                  Pause Reminders Until Kid(s) Are Back
                </Label>
                <p className="text-sm text-gray-700 mt-1">
                  Take a break from reminders when your kids are away — whether it's camp, visting grandparents for the day, or a visit with the other parent as part of time-sharing. Reminders will automatically resume once you're reunited.
                </p>
              </div>
              <div className="flex items-center md:flex-col gap-3 md:gap-2 md:min-w-[100px] justify-between md:justify-start">
                <div className={cn("px-4 py-2 rounded-lg font-semibold text-sm transition-colors", noKidsToday ? "bg-green-100 text-green-700 border-2 border-green-300" : "bg-gray-100 text-gray-600 border-2 border-gray-300")}>
                  {noKidsToday ? "ENABLED" : "DISABLED"}
                </div>
                <Switch id="no-kids-toggle" checked={noKidsToday} onCheckedChange={setNoKidsToday} className="scale-125" />
              </div>
            </div>

            {noKidsToday && <div className="mt-4 pt-4 border-t border-amber-200">
                <Label className="text-sm font-medium mb-2 block text-gray-700">
                  When will your kid(s) return?
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !returnDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {returnDate ? format(returnDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={returnDate} onSelect={setReturnDate} disabled={date => date < new Date()} initialFocus className={cn("p-3 pointer-events-auto")} />
                  </PopoverContent>
                </Popover>
                {returnDate && <p className="text-sm text-amber-700 mt-2">
                    Reminders will resume on {format(returnDate, "MMMM d, yyyy")}
                  </p>}
              </div>}
          </div>

          {!noKidsToday && <div className="border-2 border-gray-200 rounded-xl p-6 bg-gray-50/50">
              <div className="mb-6">
                <Label htmlFor="experience" className="text-lg font-semibold mb-4 block" style={{
                color: 'hsl(var(--form-label-text))'
              }}>
                  How did your challenge go today?
                </Label>
              <p className={`text-xs font-medium mb-2`}>
                <span style={{
                  color: experience.trim().length >= 50 ? 'hsl(var(--submission-pill-enabled-text))' : 'hsl(var(--form-instruction-text))'
                }}>
                  {experience.trim().length >= 50 ? `✓ Great! You'll earn 1+ point for your detailed text response.` : experience.trim().length === 0 ? "(+0 points | Write at least 50 characters to earn points for this challenge.)" : `(+0 points | Write at least ${50 - experience.trim().length} more character${50 - experience.trim().length !== 1 ? 's' : ''} to earn points for this challenge.)`}
                </span>
              </p>
              <div className="relative">
                <Textarea id="experience" value={experience} onChange={e => setExperience(e.target.value)} placeholder="Share what happened when you tried today's challenge..." className="min-h-[100px] resize-none bg-input text-input-foreground border-border pr-20" />
                <div className="text-xs font-medium" style={{
                  color: experience.trim().length >= 50 ? 'hsl(var(--submission-pill-enabled-text))' : experience.trim().length > 0 ? 'hsl(var(--submission-pill-disabled-text))' : 'hsl(var(--muted-foreground))'
                }}>
                  {experience.trim().length}/50
                </div>
              </div>
            </div>

            {/* File Uploads - Conditional based on challenge settings */}
            {currentChallenge && currentChallenge.submissionTypes && <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-stretch">
                {currentChallenge.submissionTypes.image && <div className="col-span-1 flex flex-col">
                    <Label htmlFor="image-upload" className="text-sm font-medium mb-3 block" style={{
                  color: 'hsl(var(--submission-label-text))'
                }}>
                      Upload Image (Optional)
                    </Label>
                    {uploadedFiles.image ? <p className="text-xs font-medium mb-2" style={{
                  color: 'hsl(var(--submission-pill-enabled-text))'
                }}>
                        You earn {currentChallenge?.imagePoints || 3}+ points for this image!
                      </p> : <p className="text-xs font-medium mb-2" style={{
                  color: 'hsl(var(--submission-pill-disabled-text))'
                }}>
                        (+{currentChallenge?.imagePoints || 3} extra points)
                      </p>}
                    <div className="border-2 border-dashed rounded-lg p-4 sm:p-6 text-center hover:border-accent transition-smooth h-full flex flex-col justify-center overflow-hidden" style={{
                  backgroundColor: 'hsl(var(--submission-box))',
                  borderColor: 'hsl(var(--submission-box-border))',
                  color: 'hsl(var(--submission-box-text))'
                }}>
                      <PhotoCaptureComponent onPhotoComplete={file => file ? handleFileSelect('image', file) : handleFileRemove('image')} />
                    </div>
                  </div>}

                {currentChallenge.submissionTypes.video && <div className="col-span-1 flex flex-col">
                    <Label className="text-sm font-medium mb-3 block" style={{
                  color: 'hsl(var(--submission-label-text))'
                }}>
                      Record/Upload Video (Optional)
                    </Label>
                    {uploadedFiles.video ? <p className="text-xs font-medium mb-2" style={{
                  color: 'hsl(var(--submission-pill-enabled-text))'
                }}>
                        You earn {currentChallenge?.videoPoints || 10}+ points for this video!
                      </p> : <p className="text-xs font-medium mb-2" style={{
                  color: 'hsl(var(--submission-pill-disabled-text))'
                }}>
                        (+{currentChallenge?.videoPoints || 10} extra points)
                      </p>}
                    <div className="border-2 border-dashed rounded-lg p-4 sm:p-6 text-center hover:border-accent transition-smooth h-full flex flex-col justify-center overflow-hidden" style={{
                  backgroundColor: 'hsl(var(--submission-box))',
                  borderColor: 'hsl(var(--submission-box-border))',
                  color: 'hsl(var(--submission-box-text))'
                }}>
                      <VideoRecorderComponent onRecordingComplete={file => file ? handleFileSelect('video', file) : handleFileRemove('video')} pointsAwarded={currentChallenge?.videoPoints || 10} />
                    </div>
                  </div>}
                
                {currentChallenge.submissionTypes.audio && <div className="col-span-1 flex flex-col">
                    <Label className="text-sm font-medium mb-3 block" style={{
                  color: 'hsl(var(--submission-label-text))'
                }}>
                      Record Audio (Optional)
                    </Label>
                    {uploadedFiles.audio ? <p className="text-xs font-medium mb-2" style={{
                  color: 'hsl(var(--submission-pill-enabled-text))'
                }}>
                        You earn {currentChallenge?.audioPoints || 5}+ points for this audio!
                      </p> : <p className="text-xs font-medium mb-2" style={{
                  color: 'hsl(var(--submission-pill-disabled-text))'
                }}>
                        (+{currentChallenge?.audioPoints || 5} extra points)
                      </p>}
                    <div className="border-2 border-dashed rounded-lg p-4 sm:p-6 text-center hover:border-accent transition-smooth h-full flex flex-col justify-center overflow-hidden" style={{
                  backgroundColor: 'hsl(var(--submission-box))',
                  borderColor: 'hsl(var(--submission-box-border))',
                  color: 'hsl(var(--submission-box-text))'
                }}>
                      <AudioRecorderComponent onRecordingComplete={file => file ? handleFileSelect('audio', file) : handleFileRemove('audio')} pointsAwarded={currentChallenge?.audioPoints || 5} />
                    </div>
                  </div>}

                {/* Shop Button - Show when enabled for this challenge */}
                {currentChallenge.shopButtonEnabled && <div className="col-span-1 flex flex-col">
                    <Label className="text-sm font-medium mb-3 block" style={{
                  color: 'hsl(var(--submission-label-text))'
                }}>
                      Shop DadderUp
                    </Label>
                    <p className="text-xs font-medium mb-2" style={{
                  color: 'hsl(var(--submission-pill-disabled-text))'
                }}>
                      (+{currentChallenge?.shopPoints || 5} extra points)
                    </p>
                    <div className="border-2 border-dashed rounded-lg p-4 sm:p-6 text-center hover:border-accent transition-smooth h-full flex flex-col justify-center" style={{
                  backgroundColor: 'hsl(var(--shop-widget-bg))',
                  borderColor: 'hsl(var(--shop-widget-border))'
                }}>
                      <ShoppingCart className="h-8 w-8 mx-auto mb-2" style={{
                    color: 'hsl(var(--shop-widget-text))'
                  }} />
                      <p className="text-sm mb-2" style={{
                    color: 'hsl(var(--shop-widget-text))'
                  }}>
                        Get the items you need for this challenge in the DadderUp Shop!
                      </p>
                      <Button variant="outline" size="sm" className="transition-all duration-300 hover:shadow-md" style={{
                    backgroundColor: 'hsl(var(--shop-widget-btn-bg))',
                    color: 'hsl(var(--shop-widget-btn-text))',
                    borderColor: 'hsl(var(--shop-widget-btn-border))'
                  }} onClick={() => {
                    if (currentChallenge?.shopUrl) {
                      window.open(currentChallenge.shopUrl, '_blank');
                    }
                  }}>
                        Shop DadderUp
                      </Button>
                    </div>
                  </div>}
              </div>}
          </div>}
          </div>}

          {/* Step 3: How did this make you feel? */}
          {currentStep === 3 && parentReactions.length > 0 && <div className="border-2 border-gray-200 rounded-xl p-6 bg-gray-50/50">
              <Label className="text-lg font-semibold mb-4 block text-gray-900">
                How did this make you feel?
              </Label>
              <p className="text-xs mb-4" style={{
            color: 'hsl(var(--feelings-subtext-text))'
          }}>
                Select all feelings that describe your experience:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {parentReactions.map(reaction => <button key={reaction.id} type="button" onClick={() => toggleParentReaction(reaction.id)} className={`p-3 rounded-xl border-2 transition-smooth hover-lift text-center ${selectedParentReactions.includes(reaction.id) ? "border-accent bg-accent/10" : "border-accent/20 bg-white hover:border-accent/40"}`}>
                    <div className="text-xl sm:text-2xl mb-1">{reaction.emoji}</div>
                    <span className="text-xs font-medium">{reaction.label}</span>
                  </button>)}
              </div>
              {selectedParentReactions.length > 0 && <div className="mt-4 p-3 bg-accent/10 rounded-lg">
                  <p className="text-sm font-medium text-accent mb-2">
                    Selected feelings ({selectedParentReactions.length}):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedParentReactions.map(reactionId => {
                const reaction = parentReactions.find(r => r.id === reactionId);
                return reaction ? <span key={reactionId} className="inline-flex items-center space-x-1 px-2 py-1 bg-white rounded-full text-xs font-medium">
                          <span>{reaction.emoji}</span>
                          <span>{reaction.label}</span>
                        </span> : null;
              })}
                  </div>
                </div>}
            </div>}

          {/* Step 4: How did your child react? */}
          {currentStep === 4 && reactions.length > 0 && <div className="border-2 border-gray-200 rounded-xl p-6 bg-gray-50/50">
              <Label className="text-lg font-semibold mb-4 block text-gray-900">
                How did your child react?
              </Label>
              <p className="text-xs text-muted-foreground mb-4">
                Select all reactions that describe your child's response:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {reactions.map(reaction => <button key={reaction.id} type="button" onClick={() => toggleReaction(reaction.id)} className={`p-3 rounded-xl border-2 transition-smooth hover-lift text-center ${selectedReactions.includes(reaction.id) ? "border-accent bg-accent/10" : "border-accent/20 bg-white hover:border-accent/40"}`}>
                    <div className="text-xl sm:text-2xl mb-1">{reaction.emoji}</div>
                    <span className="text-xs font-medium">{reaction.label}</span>
                  </button>)}
              </div>
              {selectedReactions.length > 0 && <div className="mt-4 p-3 bg-accent/10 rounded-lg">
                  <p className="text-sm font-medium text-accent mb-2">
                    Selected reactions ({selectedReactions.length}):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedReactions.map(reactionId => {
                const reaction = reactions.find(r => r.id === reactionId);
                return reaction ? <span key={reactionId} className="inline-flex items-center space-x-1 px-2 py-1 bg-white rounded-full text-xs font-medium">
                          <span>{reaction.emoji}</span>
                          <span>{reaction.label}</span>
                        </span> : null;
              })}
                  </div>
                </div>}
            </div>}

          {/* Step 5: Time Spent, Privacy, and Complete */}
          {currentStep === 5 && <div className="space-y-6">
              <div>
            <Label htmlFor="time-spent" className="text-sm font-medium mb-3 block text-black">
              Time spent on this challenge (minutes)
            </Label>
            <Select value={timeSpent} onValueChange={setTimeSpent}>
              <SelectTrigger className="bg-input text-input-foreground border-border">
                <SelectValue placeholder="Select Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 minutes</SelectItem>
                <SelectItem value="10">10 minutes</SelectItem>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="20">20 minutes</SelectItem>
                <SelectItem value="25">25 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="35">35 minutes</SelectItem>
                <SelectItem value="40">40 minutes</SelectItem>
                <SelectItem value="45">45 minutes</SelectItem>
                <SelectItem value="50">50 minutes</SelectItem>
                <SelectItem value="55">55 minutes</SelectItem>
                <SelectItem value="60">60 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="privacy" className="text-sm font-medium mb-3 block text-black">
              Share with Dadder Up Community
            </Label>
            <div className="flex gap-3 mb-3">
              <Button type="button" variant={privacy === 'private' ? 'default' : 'outline'} onClick={() => setPrivacy('private')} className="flex-1">
                <Lock className="mr-2 h-4 w-4" />
                Private (Only You)
              </Button>
              <Button type="button" variant={privacy === 'public' ? 'default' : 'outline'} onClick={() => {
                if (privacy === 'private') {
                  setShowPublicConfirm(true);
                } else {
                  setPrivacy('private');
                }
              }} className="flex-1">
                <Eye className="mr-2 h-4 w-4" />
                Public (Community)
              </Button>
            </div>
            
            {privacy === 'public' && <Alert variant="destructive" className="mt-3">
                <Globe className="h-4 w-4" />
                <AlertTitle>⚠️ Public Post Warning</AlertTitle>
                <AlertDescription>
                  Public posts can be viewed by all DadderUp community members. <strong>Never share personal information, addresses, phone numbers, or identifying details about your children.</strong>
                </AlertDescription>
              </Alert>}
            
            {privacy === 'private' && <p className="text-xs text-black mt-2">
                Your response will only be saved in your personal progress logs.
              </p>}
          </div>

            </div>}

          {/* Navigation Buttons */}
          <div className="flex flex-col-reverse md:flex-row items-center justify-center gap-2 md:gap-3 pt-4 px-0 pb-8 md:pb-0">
            {currentStep > 1 && currentStep < 5 && <Button variant="outline" onClick={goToPreviousStep} className="flex items-center gap-2 w-full md:w-auto" size="lg">
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>}
            {currentStep < 5 && <Button onClick={goToNextStep} className="flex items-center gap-2 bg-[#4ca153] hover:bg-[#439647] text-white w-full md:w-auto" size="lg">
                {currentStep === 2 && noKidsToday ? 'Save' : 'Go To Next Step'}
                {!(currentStep === 2 && noKidsToday) && <ChevronRight className="w-4 h-4" />}
              </Button>}
            {currentStep === 5 && <>
                <Button variant="outline" onClick={goToPreviousStep} className="flex items-center gap-2" size="lg">
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <Button onClick={handleCompleteChallenge} disabled={uploading} className="flex items-center gap-2 text-lg font-semibold bg-green-600 hover:bg-green-700 text-white" size="lg">
                  {uploading ? "Uploading..." : "Complete Challenge 🎯"}
                </Button>
              </>}
          </div>
        </CardContent>
      </Card>

      {/* Pause Reminders Dialog */}
      <Dialog open={showPauseDialog} onOpenChange={setShowPauseDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">
              Reminders paused, but the connection continues!
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-muted-foreground text-center">
              While your kid(s) are away. Take a moment to pause, reflect, and prepare for their return. Small thoughts now can spark big moments later!
            </p>
            
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Tips to stay connected with your kids:</h3>
              <ul className="space-y-2">
                {displayedTips.map((tip, index) => <li key={index} className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span className="flex-1">{tip}</span>
                  </li>)}
              </ul>
            </div>

            <div className="bg-pink-50 dark:bg-pink-950/30 p-4 rounded-lg space-y-2 border border-pink-200 dark:border-pink-900">
              <p className="font-semibold text-sm text-pink-600 dark:text-pink-400">Important:</p>
              <p className="text-sm text-black dark:text-white">
                Make sure DadderUP notifications are turned on so you don't miss when reminders start again -{" "}
                <a href="/settings" className="text-black dark:text-white hover:opacity-80 underline font-medium" onClick={() => setShowPauseDialog(false)}>
                  click here to check
                </a>.
              </p>
            </div>

            <Button onClick={() => {
            setShowPauseDialog(false);
            window.location.href = '/settings';
          }} className="w-full bg-[#4ca153] hover:bg-[#439647] text-white">
              Got it!
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Public Post Confirmation Dialog */}
      <AlertDialog open={showPublicConfirm} onOpenChange={setShowPublicConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Share Publicly?</AlertDialogTitle>
            <AlertDialogDescription>
              Your response will be visible to the entire DadderUp community, including your name and any media you upload. You can change this later in your privacy settings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Private</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
            setPrivacy('public');
            setShowPublicConfirm(false);
          }}>
              Share Publicly
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </section>;
};