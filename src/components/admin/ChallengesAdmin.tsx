import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ChallengeContent from "@/components/dashboard/ChallengeContent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, GripVertical, FileText, ExternalLink } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './RichTextEditor.css';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Challenge as HookChallenge } from "@/hooks/useChallenges";
import { useBadgeDefinitions } from "@/hooks/useBadgeDefinitions";
import { useAnswerLogs } from "@/hooks/useAnswerLogs";

interface Challenge {
  id: string;
  title: string;
  description: string;
  tip: string;
  day_order: number;
  video_url?: string;
  associated_badges: string[];
  associated_reactions: string[];
  associated_parent_reactions: string[];
  points: {
    text: number;
    image: number;
    audio: number;
    video: number;
    shop: number;
  };
  enabled_submission_types: { text: boolean; image: boolean; audio: boolean; video: boolean };
  show_shop_button: boolean;
  shop_type: 'general' | 'product' | 'none';
  shop_product_id?: string;
  shop_url?: string;
  woocommerce_subscription_product_id?: string;
}

const mockChallenges: Challenge[] = [
  {
    id: "1",
    title: "Make your commitment clear to your child",
    description: "Sit with your child and tell them: \"I joined DadderUp because I want to be the best version of myself—for you.\" Say it simply. Clearly. Out loud.",
    tip: "Look them in the eyes when you say it. This moment anchors your journey and lets them know they're your 'why.'",
    day_order: 1,
    video_url: "",
    associated_badges: ["commitment-maker"],
    associated_reactions: ["1", "5", "6", "7", "10", "18"],
    associated_parent_reactions: [], // No parent reactions by default
    points: { text: 1, image: 3, audio: 5, video: 10, shop: 5 },
    enabled_submission_types: { text: true, image: false, audio: true, video: true },
    show_shop_button: false,
    shop_type: 'none',
    shop_product_id: '',
    shop_url: '',
    woocommerce_subscription_product_id: "265"
  },
  {
    id: "2",
    title: "Share their origin story",
    description: "Tell your child the story of the day they were born—or the first time you met them. Describe how it felt to hold them or see them for the first time.",
    tip: "Include specific details like what you were wearing, the weather, or how small their hands were. Kids love these intimate details.",
    day_order: 2,
    video_url: "",
    associated_badges: ["storyteller", "connection-builder"],
    associated_reactions: ["1", "4", "5", "9", "10", "15", "20"],
    associated_parent_reactions: [], // No parent reactions by default
    points: { text: 1, image: 3, audio: 5, video: 10, shop: 5 },
    enabled_submission_types: { text: true, image: false, audio: true, video: true },
    show_shop_button: false,
    shop_type: 'none',
    shop_product_id: '',
    woocommerce_subscription_product_id: "265"
  },
  {
    id: "3",
    title: "Make your declaration public",
    description: "Record a short video of yourself (30–60 seconds) saying why you joined DadderUp and two things you love most about your kid(s). Post it and tag @DadderUp.",
    tip: "Speak from the heart, not from a script. Authenticity matters more than perfection.",
    day_order: 3,
    video_url: "",
    associated_badges: ["declarer", "community-builder"],
    associated_reactions: ["1", "11", "12", "14", "15", "19"],
    associated_parent_reactions: [], // No parent reactions by default
    points: { text: 1, image: 3, audio: 5, video: 15, shop: 5 },
    enabled_submission_types: { text: true, image: false, audio: true, video: true },
    show_shop_button: false,
    shop_type: 'none',
    shop_product_id: '',
    woocommerce_subscription_product_id: "265"
  },
  {
    id: "4",
    title: "Define your father vision",
    description: "Write a one-sentence vision of the kind of father you want to be by next year. Say it out loud while looking in the mirror.",
    tip: "Make it specific and personal. Instead of 'be a good dad,' try 'be the dad who listens first and speaks second.'",
    day_order: 4,
    video_url: "",
    associated_badges: ["visionary"],
    associated_reactions: ["5", "6", "11", "16", "18", "20"],
    associated_parent_reactions: [], // No parent reactions by default
    points: { text: 1, image: 3, audio: 5, video: 10, shop: 5 },
    enabled_submission_types: { text: true, image: false, audio: true, video: true },
    show_shop_button: false,
    shop_type: 'none',
    shop_product_id: '',
    woocommerce_subscription_product_id: "265"
  },
  {
    id: "5",
    title: "Choose your anchor phrase",
    description: "Choose a phrase that will be your mantra for this season (e.g., \"Show up anyway,\" \"Calm is the flex,\" \"Legacy, not noise.\"). Write it down and post it somewhere visible.",
    tip: "Pick something that resonates with your biggest parenting challenge right now. You'll come back to this phrase often.",
    day_order: 5,
    video_url: "",
    associated_badges: ["anchor-setter"],
    associated_reactions: ["12", "13", "17", "20"],
    associated_parent_reactions: [], // No parent reactions by default
    points: { text: 1, image: 3, audio: 5, video: 10, shop: 5 },
    enabled_submission_types: { text: true, image: false, audio: false, video: true },
    show_shop_button: false,
    shop_type: 'none',
    shop_product_id: '',
    woocommerce_subscription_product_id: "265"
  },
  {
    id: "6",
    title: "Create your DDS tracking board",
    description: "Create a DadderUp DDS Board in your home (like a chore board). Every time you log a Flex, let your child mark an \"X\" or sticker. At the end of the month, celebrate together.",
    tip: "Make it visual and fun. Kids love being part of your progress and seeing tangible results.",
    day_order: 6,
    video_url: "",
    associated_badges: ["habit-tracker", "system-builder"],
    associated_reactions: ["9", "12", "13", "14", "17"],
    associated_parent_reactions: [], // No parent reactions by default
    points: { text: 1, image: 4, audio: 6, video: 12, shop: 5 },
    enabled_submission_types: { text: true, image: true, audio: false, video: true },
    show_shop_button: true,
    shop_type: 'general',
    shop_product_id: '',
    woocommerce_subscription_product_id: "322"
  },
  {
    id: "7",
    title: "Give them your legacy symbol",
    description: "Give your child a small, sentimental item (or DadderUp Coin if received) and say: \"This is a symbol of how seriously I take being your dad.\" Let it anchor your commitment.",
    tip: "Choose something meaningful they can keep with them. This becomes a physical reminder of your commitment to growth.",
    day_order: 7,
    video_url: "",
    associated_badges: ["legacy-builder", "commitment-keeper"],
    associated_reactions: ["1", "4", "7", "8", "10", "15", "19"],
    associated_parent_reactions: [], // No parent reactions by default
    points: { text: 1, image: 3, audio: 5, video: 10, shop: 5 },
    enabled_submission_types: { text: true, image: true, audio: true, video: true },
    show_shop_button: true,
    shop_type: 'product',
    shop_product_id: '445',
    woocommerce_subscription_product_id: "322"
  }
];


const mockReactions = [
  { id: "1", emoji: "😊", label: "Smiled" },
  { id: "4", emoji: "❤️", label: "Hugged me" },
  { id: "5", emoji: "🤔", label: "Asked questions" },
  { id: "6", emoji: "🗣️", label: "Started talking more" },
  { id: "7", emoji: "👀", label: "Made eye contact" },
  { id: "8", emoji: "🤗", label: "Sat closer to me" },
  { id: "9", emoji: "😂", label: "Laughed with me" },
  { id: "10", emoji: "🥺", label: "Got emotional" },
  { id: "11", emoji: "😲", label: "Seemed surprised" },
  { id: "12", emoji: "✨", label: "Got excited" },
  { id: "13", emoji: "🎨", label: "Drew/made something" },
  { id: "14", emoji: "🔁", label: "Asked to do it again" },
  { id: "15", emoji: "📢", label: "Told someone else" },
  { id: "16", emoji: "🤫", label: "Shared a secret" },
  { id: "17", emoji: "🙋", label: "Wanted to help" },
  { id: "18", emoji: "💭", label: "Asked follow-up questions later" },
  { id: "19", emoji: "🤝", label: "Gave me a compliment" },
  { id: "20", emoji: "📖", label: "Brought up the story again" }
];

// Removed localStorage functions - now using database queries in component

interface ChallengeFormData {
  title: string;
  description: string;
  tip: string;
  day_order: number;
  video_url: string;
  associated_badges: string[];
  associated_reactions: string[];
  associated_parent_reactions: string[];
  points: {
    text: number;
    image: number;
    audio: number;
    video: number;
    shop: number;
  };
  enabled_submission_types: { text: boolean; image: boolean; audio: boolean; video: boolean };
  show_shop_button: boolean;
  shop_url: string;
  shop_type: 'general' | 'product' | 'none';
  shop_product_id: string;
  woocommerce_subscription_product_id: string;
}

const initialFormData: ChallengeFormData = {
  title: "",
  description: "",
  tip: "",
  day_order: 1,
  video_url: "",
  associated_badges: [],
  associated_reactions: [],
  associated_parent_reactions: [],
  points: { text: 1, image: 3, audio: 5, video: 10, shop: 5 },
  enabled_submission_types: { text: true, image: true, audio: true, video: true },
  show_shop_button: false,
  shop_url: "",
  shop_type: 'none',
  shop_product_id: "",
  woocommerce_subscription_product_id: "",
};

// Helpers to sync Admin schema with Dashboard hook schema
const adminToHookChallenge = (c: Challenge, index: number): HookChallenge => {
  const result: any = {
    id: parseInt(c.id) || index + 1,
    title: c.title,
    description: c.description,
    tip: c.tip,
    ordering: c.day_order,
    video_url: c.video_url || "",
    // Keep hook badges numeric as-is if they exist elsewhere; also persist slugs separately
    badges: (c.associated_badges || [])
      .map((b) => parseInt(b))
      .filter((n) => !Number.isNaN(n)),
    reactions: (c.associated_reactions || [])
      .map((r) => parseInt(r))
      .filter((n) => !Number.isNaN(n)),
    parentReactions: (c.associated_parent_reactions || [])
      .map((r) => parseInt(r))
      .filter((n) => !Number.isNaN(n)),
    pointsEarned: c.points?.text ?? 0,
    pointsBonus: 0,
    shopPoints: c.points?.shop ?? 5,
    imagePoints: c.points?.image ?? 3,
    videoPoints: c.points?.video ?? 10,
    audioPoints: c.points?.audio ?? 5,
    shopButtonEnabled: c.show_shop_button,
    shopType: c.shop_type,
    shopProductId: c.shop_product_id || "",
    shopUrl: c.shop_url || "",
    wooCommerceProductId: c.woocommerce_subscription_product_id || "",
    submissionTypes: {
      image: !!c.enabled_submission_types?.image,
      video: !!c.enabled_submission_types?.video,
      audio: !!c.enabled_submission_types?.audio,
      text: !!c.enabled_submission_types?.text,
    },
  };
  // Persist admin badge slugs so we can restore them later
  result.associated_badge_slugs = c.associated_badges || [];
  return result as HookChallenge;
};

const hookToAdminChallenge = (c: HookChallenge): Challenge => {
  return {
    id: String(c.id),
    title: c.title,
    description: c.description,
    tip: c.tip,
    day_order: c.ordering,
    video_url: c.video_url || "",
    associated_badges: (c.badges || []).map(String),
    associated_reactions: (c.reactions || []).map(String),
    associated_parent_reactions: (c.parentReactions || []).map(String),
    points: { text: c.pointsEarned ?? 1, image: c.imagePoints ?? 3, audio: c.audioPoints ?? 5, video: c.videoPoints ?? 10, shop: c.shopPoints ?? 5 },
    enabled_submission_types: {
      text: c.submissionTypes?.text ?? true,
      image: !!c.submissionTypes?.image,
      audio: !!c.submissionTypes?.audio,
      video: !!c.submissionTypes?.video,
    },
    show_shop_button: c.shopButtonEnabled,
    shop_type: c.shopType || 'none',
    shop_product_id: c.shopProductId || "",
    shop_url: c.shopUrl || "",
    woocommerce_subscription_product_id: c.wooCommerceProductId || "",
  };
};

const SortableChallenge = ({ 
  challenge, 
  onEdit, 
  onDelete,
  onViewAnswers,
  answerCount,
  badgeDefinitions,
  reactions,
  parentReactions
}: { 
  challenge: Challenge;
  onEdit: (challenge: Challenge) => void;
  onDelete: (id: string) => void;
  onViewAnswers: (challengeTitle: string) => void;
  answerCount: number;
  badgeDefinitions: any[];
  reactions: any[];
  parentReactions: any[];
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: challenge.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card ref={setNodeRef} style={style} className="border border-card-border">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <button
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="w-5 h-5 text-muted-foreground" />
            </button>
            <div>
              <CardTitle className="text-lg">Day {challenge.day_order}</CardTitle>
              <h3 className="font-semibold text-base mt-1">{challenge.title}</h3>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewAnswers(challenge.title)}
              className="text-blue-600 hover:text-blue-700"
            >
              <FileText className="w-4 h-4 mr-1" />
              View Answers ({answerCount})
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(challenge)}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(challenge.id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* YouTube Video Embed */}
        {challenge.video_url && (() => {
          const getYoutubeEmbedUrl = (url: string) => {
            // Handle different YouTube URL formats
            const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/);
            if (embedMatch) return url;
            
            const watchMatch = url.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/);
            if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;
            
            const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
            if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
            
            return url;
          };
          
          const embedUrl = getYoutubeEmbedUrl(challenge.video_url);
          
          return (
            <div className="mb-4 aspect-video max-w-2xl mx-auto">
              <iframe
                src={embedUrl}
                width="100%"
                height="100%"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="rounded-lg"
              />
            </div>
          );
        })()}
        
        <div className="text-sm text-card-foreground mb-3">
          <ChallengeContent content={challenge.description} />
        </div>
        <div className="p-3 bg-muted/30 rounded-lg mb-3">
          <p className="text-sm font-medium whitespace-pre-wrap">💡 Tip: {challenge.tip}</p>
        </div>
        <div className="mb-3 p-3 bg-accent/5 rounded-lg">
          <p className="text-xs font-medium text-card-foreground mb-2">Submission Types & Points:</p>
          <div className="flex flex-wrap gap-2 text-xs">
            <div className={`px-3 py-1 rounded-md border ${challenge.enabled_submission_types.text ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-600"}`}>
              📝 Text: {challenge.enabled_submission_types.text ? `${challenge.points.text}pt` : "Disabled"}
            </div>
            <div className={`px-3 py-1 rounded-md border ${challenge.enabled_submission_types.image ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-600"}`}>
              📷 Image: {challenge.enabled_submission_types.image ? `${challenge.points.image}pt` : "Disabled"}
            </div>
            <div className={`px-3 py-1 rounded-md border ${challenge.enabled_submission_types.audio ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-600"}`}>
              🎵 Audio: {challenge.enabled_submission_types.audio ? `${challenge.points.audio}pt` : "Disabled"}
            </div>
            <div className={`px-3 py-1 rounded-md border ${challenge.enabled_submission_types.video ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-600"}`}>
              🎥 Video: {challenge.enabled_submission_types.video ? `${challenge.points.video}pt` : "Disabled"}
            </div>
            {challenge.show_shop_button && (
              <div className="px-3 py-1 rounded-md border bg-blue-50 border-blue-200 text-blue-700">
                🛒 Shop: {challenge.points.shop}pt
              </div>
            )}
          </div>
        </div>
        
        {/* Shop Button Status */}
        <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Shop Button:</span>
            <div className="flex items-center gap-2">
              <Badge variant={challenge.show_shop_button ? "default" : "secondary"} className="text-xs">
                {challenge.show_shop_button ? (
                  <>
                    <span className="mr-1">🛒</span>
                    Enabled
                  </>
                ) : (
                  <>
                    <span className="mr-1">❌</span>
                    Disabled
                  </>
                )}
              </Badge>
              {challenge.show_shop_button && challenge.shop_url && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(challenge.shop_url?.startsWith('http') ? challenge.shop_url : `https://shop.dadderup.com${challenge.shop_url}`, '_blank')}
                  className="h-6 px-2 text-xs"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Preview
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* WooCommerce Subscription Product Connection */}
        <div className="mb-3 p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">WooCommerce Subscription:</span>
            {challenge.woocommerce_subscription_product_id ? (
              <Badge variant="default" className="text-xs bg-green-600">
                <span className="mr-1">🔗</span>
                Connected to Subscription #{challenge.woocommerce_subscription_product_id}
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">
                <span className="mr-1">❌</span>
                Not Connected
              </Badge>
            )}
          </div>
          {challenge.woocommerce_subscription_product_id && (
            <div className="mt-2 text-xs text-green-700">
              {challenge.woocommerce_subscription_product_id === "265" ? "7-Day Trial Subscription" : "Premium Monthly Subscription"}
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="text-xs font-medium text-muted-foreground">Badges:</span>
          {challenge.associated_badges.length > 0 ? (
            challenge.associated_badges.map(badgeId => {
              const badge = badgeDefinitions.find(b => b.id === badgeId);
              return badge ? (
                <Badge key={badgeId} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                  {badge.icon} {badge.name}
                </Badge>
              ) : null;
            })
          ) : (
            <span className="text-xs text-muted-foreground italic">None</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="text-xs font-medium text-muted-foreground">Expected Reactions:</span>
          {challenge.associated_reactions.length > 0 ? (
            <>
              {challenge.associated_reactions.slice(0, 6).map(reactionId => {
                const reaction = reactions.find(r => r.id === reactionId);
                return reaction ? (
                  <Badge key={reactionId} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                    {reaction.emoji} {reaction.label}
                  </Badge>
                ) : null;
              })}
              {challenge.associated_reactions.length > 6 && (
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                  +{challenge.associated_reactions.length - 6} more
                </Badge>
              )}
            </>
          ) : (
            <span className="text-xs text-muted-foreground italic">None</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="text-xs font-medium text-muted-foreground">Expected Parent Feelings:</span>
          {challenge.associated_parent_reactions.length > 0 ? (
            <>
              {challenge.associated_parent_reactions.slice(0, 6).map(reactionId => {
                const reaction = parentReactions.find(r => r.id === reactionId);
                return reaction ? (
                  <Badge key={reactionId} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                    {reaction.emoji} {reaction.label}
                  </Badge>
                ) : null;
              })}
              {challenge.associated_parent_reactions.length > 6 && (
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                  +{challenge.associated_parent_reactions.length - 6} more
                </Badge>
              )}
            </>
          ) : (
            <span className="text-xs text-muted-foreground italic">None</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export const ChallengesAdmin = ({ onViewAnswers }: { onViewAnswers?: (challengeTitle: string) => void }) => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<ChallengeFormData>(initialFormData);
  const [reactionsVersion, setReactionsVersion] = useState(0);
  const [loading, setLoading] = useState(true);
  const { badgeDefinitions } = useBadgeDefinitions();
  const { logs } = useAnswerLogs();
  const [reactions, setReactions] = useState<any[]>([]);
  const [parentReactions, setParentReactions] = useState<any[]>([]);

  // Function to count answers for each challenge
  const getAnswerCount = (challengeTitle: string) => {
    return logs.filter(log => log.challengeTitle === challengeTitle).length;
  };

  // Load reactions from database
  useEffect(() => {
    const loadReactions = async () => {
      const [{ data: reactionsData }, { data: parentReactionsData }] = await Promise.all([
        supabase.from('reactions').select('reaction_id, emoji, label, is_active, display_order').eq('is_active', true).order('display_order'),
        supabase.from('parent_reactions').select('reaction_id, emoji, label, is_active, display_order').eq('is_active', true).order('display_order'),
      ]);
      
      if (reactionsData) {
        setReactions(reactionsData.map(r => ({ id: String(r.reaction_id), emoji: r.emoji, label: r.label })));
      }
      if (parentReactionsData) {
        setParentReactions(parentReactionsData.map(r => ({ id: String(r.reaction_id), emoji: r.emoji, label: r.label })));
      }
    };
    loadReactions();
  }, [reactionsVersion]);

  // Load from Supabase database on mount
  useEffect(() => {
    const loadFromDatabase = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('challenges')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          // Map Supabase data to admin format
            const mapped: Challenge[] = data.map(challenge => {
            const submissionTypes = (challenge.submission_types as any) || {};
            return {
              id: challenge.challenge_id,
              title: challenge.title,
              description: challenge.description,
              tip: challenge.tip || '',
              day_order: challenge.display_order,
              video_url: challenge.video_url || '',
              associated_badges: Array.isArray(challenge.badges) ? challenge.badges.map(String) : [],
              associated_reactions: Array.isArray(challenge.reactions) ? challenge.reactions.map(String) : [],
              associated_parent_reactions: Array.isArray(challenge.parent_reactions) ? challenge.parent_reactions.map(String) : [],
              points: {
                text: challenge.points_earned || 1,
                image: challenge.image_points || 3,
                audio: challenge.audio_points || 5,
                video: challenge.video_points || 10,
                shop: challenge.shop_points || 5
              },
              enabled_submission_types: {
                text: submissionTypes.text !== false,
                image: submissionTypes.image === true,
                audio: submissionTypes.audio === true,
                video: submissionTypes.video === true
              },
              show_shop_button: challenge.shop_button_enabled === true,
              shop_type: (challenge.shop_type as 'general' | 'product' | 'none') || 'none',
              shop_product_id: challenge.shop_product_id || '',
              shop_url: challenge.shop_url || '',
              woocommerce_subscription_product_id: challenge.woocommerce_product_id || ''
            };
          });
          setChallenges(mapped);
        }
      } catch (error) {
        console.error('Error loading challenges from database:', error);
        toast({
          title: "Error",
          description: "Failed to load challenges from database",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadFromDatabase();
  }, []);

  // Listen for reactions changes to refresh list
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'dadderup-reactions') setReactionsVersion(v => v + 1);
    };
    const onCustom = () => setReactionsVersion(v => v + 1);
    window.addEventListener('storage', onStorage);
    window.addEventListener('dadderup-reactions-changed', onCustom as EventListener);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('dadderup-reactions-changed', onCustom as EventListener);
    };
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleAddChallenge = () => {
    setEditingChallenge(null);
    setFormData(initialFormData);
    setIsDialogOpen(true);
  };

  const handleEditChallenge = (challenge: Challenge) => {
    setEditingChallenge(challenge);
    setFormData({
      title: challenge.title,
      description: challenge.description,
      tip: challenge.tip,
      day_order: challenge.day_order,
      video_url: challenge.video_url || "",
      associated_badges: challenge.associated_badges,
      associated_reactions: challenge.associated_reactions,
      associated_parent_reactions: challenge.associated_parent_reactions,
      points: challenge.points,
      enabled_submission_types: challenge.enabled_submission_types,
      show_shop_button: challenge.show_shop_button,
      shop_type: challenge.shop_type,
      shop_product_id: challenge.shop_product_id || "",
      shop_url: challenge.shop_url || "",
      woocommerce_subscription_product_id: challenge.woocommerce_subscription_product_id || "",
    });
    setIsDialogOpen(true);
  };

  const handleSaveChallenge = async () => {
    try {
      const supabaseData = {
        challenge_id: editingChallenge ? editingChallenge.id : String(Date.now()),
        title: formData.title,
        description: formData.description,
        tip: formData.tip,
        video_url: formData.video_url,
        display_order: formData.day_order,
        category: 'daily',
        type: 'challenge',
        points_earned: formData.points.text,
        image_points: formData.points.image,
        audio_points: formData.points.audio,
        video_points: formData.points.video,
        shop_points: formData.points.shop,
        badges: formData.associated_badges.map(Number).filter(n => !isNaN(n)),
        reactions: formData.associated_reactions.map(Number).filter(n => !isNaN(n)),
        parent_reactions: formData.associated_parent_reactions.map(Number).filter(n => !isNaN(n)),
        submission_types: formData.enabled_submission_types as any,
        shop_button_enabled: formData.show_shop_button,
        shop_type: formData.shop_type,
        shop_product_id: formData.shop_product_id,
        shop_url: formData.shop_url,
        woocommerce_product_id: formData.woocommerce_subscription_product_id,
        is_active: true
      };

      let error;
      if (editingChallenge) {
        // Update existing challenge
        const { error: updateError } = await supabase
          .from('challenges')
          .update(supabaseData)
          .eq('challenge_id', editingChallenge.id);
        error = updateError;

        if (!error) {
          setChallenges(prev => prev.map(c => 
            c.id === editingChallenge.id 
              ? { ...c, ...formData, id: editingChallenge.id }
              : c
          ));
        }
      } else {
        // Add new challenge
        const { error: insertError } = await supabase
          .from('challenges')
          .insert([supabaseData]);
        error = insertError;

        if (!error) {
          const newChallenge: Challenge = {
            id: supabaseData.challenge_id,
            ...formData
          };
          setChallenges(prev => [...prev, newChallenge]);
        }
      }

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: editingChallenge ? "Challenge updated successfully" : "Challenge created successfully"
      });

      setIsDialogOpen(false);
      setFormData(initialFormData);
    } catch (error) {
      console.error('Error saving challenge:', error);
      toast({
        title: "Error",
        description: "Failed to save challenge to database",
        variant: "destructive"
      });
    }
  };

  const handleDeleteChallenge = (id: string) => {
    setChallenges(prev => prev.filter(c => c.id !== id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setChallenges((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        
        const reorderedItems = arrayMove(items, oldIndex, newIndex);
        
        // Update day_order for all items
        return reorderedItems.map((item, index) => ({
          ...item,
          day_order: index + 1
        }));
      });
    }
  };

  const toggleBadge = (badgeId: string) => {
    setFormData(prev => ({
      ...prev,
      associated_badges: prev.associated_badges.includes(badgeId)
        ? prev.associated_badges.filter(id => id !== badgeId)
        : [...prev.associated_badges, badgeId]
    }));
  };

  const toggleReaction = (reactionId: string) => {
    setFormData(prev => ({
      ...prev,
      associated_reactions: prev.associated_reactions.includes(reactionId)
        ? prev.associated_reactions.filter(id => id !== reactionId)
        : [...prev.associated_reactions, reactionId]
    }));
  };

  const toggleParentReaction = (reactionId: string) => {
    setFormData(prev => ({
      ...prev,
      associated_parent_reactions: prev.associated_parent_reactions.includes(reactionId)
        ? prev.associated_parent_reactions.filter(id => id !== reactionId)
        : [...prev.associated_parent_reactions, reactionId]
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Challenges Management</h2>
          <p className="text-foreground">Create and manage daily challenges for users</p>
        </div>
        <Button onClick={handleAddChallenge} className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Add Challenge</span>
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={challenges.map(c => c.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {challenges
              .sort((a, b) => a.day_order - b.day_order)
              .map(challenge => (
                <SortableChallenge
                  key={challenge.id}
                  challenge={challenge}
                  onEdit={handleEditChallenge}
                  onDelete={handleDeleteChallenge}
                  onViewAnswers={onViewAnswers || (() => {})}
                  answerCount={getAnswerCount(challenge.title)}
                  badgeDefinitions={badgeDefinitions}
                  reactions={reactions}
                  parentReactions={parentReactions}
                />
              ))}
          </div>
        </SortableContext>
      </DndContext>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col px-4 sm:px-6">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>
              {editingChallenge ? "Edit Challenge" : "Add New Challenge"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-3 px-4 sm:px-6">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="day-order" className="text-sm text-gray-900 dark:text-gray-100 font-medium">Day Order</Label>
                <Select 
                  value={(Number(formData.day_order) >= 1 && Number(formData.day_order) <= 7 ? String(formData.day_order) : "1")} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, day_order: parseInt(value) }))}
                >
                  <SelectTrigger className="h-9 border-2 border-gray-300 hover:border-gray-400 focus:border-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-50 bg-background border border-border">
                    {[1, 2, 3, 4, 5, 6, 7].map(day => (
                      <SelectItem key={day} value={day.toString()}>Day {day}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="col-span-2">
                <Label htmlFor="title" className="text-sm text-gray-900 dark:text-gray-100 font-medium">Challenge Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter challenge title"
                  className="h-9 border-2 border-gray-300 hover:border-gray-400 focus:border-primary"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="video_url" className="text-sm text-gray-900 dark:text-gray-100 font-medium">YouTube Video URL (optional)</Label>
              <Input
                id="video_url"
                type="url"
                value={formData.video_url}
                onChange={(e) => setFormData(prev => ({ ...prev, video_url: e.target.value }))}
                placeholder="https://www.youtube.com/watch?v=..."
                className="h-9 border-2 border-gray-300 hover:border-gray-400 focus:border-primary"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter a YouTube video URL to display with this challenge
              </p>
            </div>

            <div>
              <Label htmlFor="description" className="text-sm text-gray-900 dark:text-gray-100 font-medium">Description</Label>
              <div className="border-2 border-gray-300 rounded-md">
                <ReactQuill
                  theme="snow"
                  value={formData.description}
                  onChange={(content) => setFormData(prev => ({ ...prev, description: content }))}
                  placeholder="Describe the challenge in detail..."
                  modules={{
                    toolbar: [
                      [{ 'header': [1, 2, 3, false] }],
                      ['bold', 'italic', 'underline', 'strike'],
                      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                      ['link'],
                      ['clean']
                    ]
                  }}
                  className="bg-card"
                  style={{ minHeight: '150px' }}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="tip" className="text-sm text-foreground font-medium">Tip</Label>
              <Textarea
                id="tip"
                value={formData.tip}
                onChange={(e) => setFormData(prev => ({ ...prev, tip: e.target.value }))}
                placeholder="Provide a helpful tip for completing this challenge..."
                className="min-h-[60px] border-2 border-gray-300 hover:border-gray-400 focus:border-primary"
              />
            </div>

            {/* Submission Types Section */}
            <div>
              <Label className="text-sm text-gray-900 dark:text-gray-100 font-medium">Enabled Submission Types</Label>
              <p className="text-xs text-muted-foreground mb-2">Select which submission types are allowed for this challenge</p>
              <div className="flex flex-wrap gap-3 border rounded-lg p-3 bg-muted/20">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="text-enabled"
                    checked={formData.enabled_submission_types.text}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      enabled_submission_types: {
                        ...prev.enabled_submission_types,
                        text: e.target.checked
                      }
                    }))}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="text-enabled" className="text-xs font-medium cursor-pointer">
                    📝 Text ({formData.points.text}pts)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="image-enabled"
                    checked={formData.enabled_submission_types.image}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      enabled_submission_types: {
                        ...prev.enabled_submission_types,
                        image: e.target.checked
                      }
                    }))}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="image-enabled" className="text-xs font-medium cursor-pointer">
                    📸 Image ({formData.points.image}pts)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="audio-enabled"
                    checked={formData.enabled_submission_types.audio}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      enabled_submission_types: {
                        ...prev.enabled_submission_types,
                        audio: e.target.checked
                      }
                    }))}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="audio-enabled" className="text-xs font-medium cursor-pointer">
                    🎙️ Audio ({formData.points.audio}pts)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="video-enabled"
                    checked={formData.enabled_submission_types.video}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      enabled_submission_types: {
                        ...prev.enabled_submission_types,
                        video: e.target.checked
                      }
                    }))}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="video-enabled" className="text-xs font-medium cursor-pointer">
                    🎥 Video ({formData.points.video}pts)
                  </Label>
                </div>
              </div>
            </div>

            <div>
              <Label className="text-sm text-gray-900 dark:text-gray-100 font-medium">Points System</Label>
              <p className="text-xs text-muted-foreground mb-2">Set points for different submission types</p>
              <div className="flex flex-wrap gap-3 border rounded-lg p-3 bg-muted/20">
                {formData.enabled_submission_types.text && (
                  <div className="flex-1 min-w-[120px]">
                    <Label className="text-xs text-gray-900 dark:text-gray-100 font-medium">📝 Text Points</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.points.text}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        points: { ...prev.points, text: parseInt(e.target.value) || 0 }
                      }))}
                      className="text-center h-8 text-sm border-2 border-gray-300 hover:border-gray-400 focus:border-primary"
                    />
                  </div>
                )}
                {formData.enabled_submission_types.image && (
                  <div className="flex-1 min-w-[120px]">
                    <Label className="text-xs text-gray-900 dark:text-gray-100 font-medium">📷 Image Points</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.points.image}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        points: { ...prev.points, image: parseInt(e.target.value) || 0 }
                      }))}
                      className="text-center h-8 text-sm border-2 border-gray-300 hover:border-gray-400 focus:border-primary"
                    />
                  </div>
                )}
                {formData.enabled_submission_types.audio && (
                  <div className="flex-1 min-w-[120px]">
                    <Label className="text-xs text-gray-900 dark:text-gray-100 font-medium">🎵 Audio Points</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.points.audio}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        points: { ...prev.points, audio: parseInt(e.target.value) || 0 }
                      }))}
                      className="text-center h-8 text-sm border-2 border-gray-300 hover:border-gray-400 focus:border-primary"
                    />
                  </div>
                )}
                {formData.enabled_submission_types.video && (
                  <div className="flex-1 min-w-[120px]">
                    <Label className="text-xs text-gray-900 dark:text-gray-100 font-medium">🎥 Video Points</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.points.video}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        points: { ...prev.points, video: parseInt(e.target.value) || 0 }
                      }))}
                      className="text-center h-8 text-sm border-2 border-gray-300 hover:border-gray-400 focus:border-primary"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Shop Button Section */}
            <div>
              <Label className="text-sm text-gray-900 dark:text-gray-100 font-medium">Shop Button Configuration</Label>
              <p className="text-xs text-muted-foreground mb-2">Configure how the shop button behaves for this challenge</p>
              <div className="space-y-3 border rounded-lg p-3 bg-muted/20">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="shop-button-enabled"
                    checked={formData.show_shop_button}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      show_shop_button: e.target.checked,
                      shop_type: e.target.checked ? prev.shop_type : 'none'
                    }))}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="shop-button-enabled" className="text-sm font-medium">
                    🛒 Enable "Shop DadderUp" button
                  </Label>
                </div>
                
                {formData.show_shop_button && (
                  <div className="space-y-3 mt-3 pt-3 border-t border-gray-200">
                    <Label className="text-xs text-gray-900 dark:text-gray-100 font-medium">Shop URL</Label>
                    <Input
                      type="text"
                      placeholder="Enter shop URL (e.g., /shop/ or /shop/product-name)"
                      value={formData.shop_url || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        shop_url: e.target.value
                      }))}
                      className="text-xs"
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter the URL where users should be directed when they click the "Shop DadderUp" button
                    </p>
                    
                    <Label className="text-xs text-gray-900 dark:text-gray-100 font-medium mt-3 block">Shop Points</Label>
                    <Input
                      type="number"
                      placeholder="5"
                      value={formData.points.shop}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        points: { ...prev.points, shop: parseInt(e.target.value) || 5 }
                      }))}
                      className="text-xs"
                      min="0"
                    />
                    <p className="text-xs text-muted-foreground">
                      Points awarded when users click the "Shop DadderUp" button
                    </p>
                    
                    <div className="p-2 bg-blue-100 rounded text-xs text-blue-800">
                      <strong>Preview:</strong> {
                        formData.shop_url ? 
                          `Users will see "Shop DadderUp" button linking to: ${formData.shop_url}` :
                          'Enter a URL to see preview'
                      }
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* WooCommerce Subscription Product Section */}
            <div>
              <Label className="text-sm text-gray-900 dark:text-gray-100 font-medium">WooCommerce Subscription Product</Label>
              <p className="text-xs text-muted-foreground mb-2">Determines which subscription users need to access this challenge</p>
              <div className="space-y-3 border rounded-lg p-3 bg-muted/20">
                <Select 
                  value={formData.woocommerce_subscription_product_id ?? ""} 
                  onValueChange={(value) => setFormData(prev => ({
                    ...prev,
                    woocommerce_subscription_product_id: value === 'none' ? '' : value
                  }))}
                >
                  <SelectTrigger className="border-2 border-gray-300 hover:border-gray-400 focus:border-primary">
                    <SelectValue placeholder="Select Subscription Product" />
                  </SelectTrigger>
                  <SelectContent className="z-50 bg-background border border-border">
                    <SelectItem value="none">No Subscription Required</SelectItem>
                    <SelectItem value="265">Product #265 - 7-Day Trial Subscription</SelectItem>
                    <SelectItem value="322">Product #322 - Premium Monthly Subscription</SelectItem>
                    <SelectItem value="401">Product #401 - Annual Premium Subscription</SelectItem>
                  </SelectContent>
                </Select>
                {formData.woocommerce_subscription_product_id ? (
                  <div className="p-2 bg-green-100 rounded text-xs text-green-800">
                    <strong>Subscription Required:</strong> Users will need access to this subscription product to unlock this challenge.
                  </div>
                ) : (
                  <div className="p-2 bg-gray-100 rounded text-xs text-gray-600">
                    <strong>Public Challenge:</strong> This challenge will be available to all users regardless of subscription.
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label className="text-sm text-gray-900 dark:text-gray-100 font-medium">Child Reactions</Label>
                <p className="text-xs text-muted-foreground mb-2">Select likely child reactions</p>
                  <div className="grid grid-cols-2 gap-1 max-h-32 overflow-y-auto border rounded-lg p-2 bg-muted/20">
                    {reactions.map(reaction => (
                      <button
                        key={reaction.id}
                        type="button"
                        onClick={() => toggleReaction(reaction.id)}
                        className={`p-1.5 rounded border transition-colors text-xs ${
                          formData.associated_reactions.includes(reaction.id)
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <span className="font-medium">
                          {reaction.emoji} {reaction.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

              <div>
                <Label className="text-sm text-gray-900 dark:text-gray-100 font-medium">Parent Feelings</Label>
                <p className="text-xs text-muted-foreground mb-2">Select likely parent feelings</p>
                  <div className="grid grid-cols-2 gap-1 max-h-32 overflow-y-auto border rounded-lg p-2 bg-muted/20">
                    {parentReactions.map(reaction => (
                      <button
                        key={reaction.id}
                        type="button"
                        onClick={() => toggleParentReaction(reaction.id)}
                        className={`p-1.5 rounded border transition-colors text-xs ${
                          formData.associated_parent_reactions.includes(reaction.id)
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <span className="font-medium">
                          {reaction.emoji} {reaction.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

              <div>
                <Label className="text-sm text-gray-900 dark:text-gray-100 font-medium">Associated Badges</Label>
                <p className="text-xs text-muted-foreground mb-2">Select earned badges</p>
                <div className="grid grid-cols-2 gap-1 max-h-32 overflow-y-auto border rounded-lg p-2 bg-muted/20">
                  {badgeDefinitions.map(badge => (
                    <button
                      key={badge.id}
                      type="button"
                      onClick={() => toggleBadge(badge.id)}
                      className={`p-1.5 rounded border transition-colors text-xs ${
                        formData.associated_badges.includes(badge.id)
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <span className="font-medium">
                        {badge.icon} {badge.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t flex-shrink-0">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} size="sm">
              Cancel
            </Button>
            <Button onClick={handleSaveChallenge} size="sm">
              {editingChallenge ? "Update" : "Create"} Challenge
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};