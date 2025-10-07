import { Heart, MessageCircle, Clock, Play, Headphones, Image, ChevronDown, ChevronUp, Send, Globe } from "lucide-react";
import { useAnswerLogs } from "@/hooks/useAnswerLogs";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface CommunityPostsProps {
  day: number;
}

interface MediaItem {
  type: 'image' | 'video' | 'audio';
  preview: string;
}

interface Post {
  id: string | number;
  author: string;
  time: string;
  content: string;
  likes: number;
  comments: number;
  media?: MediaItem;
  isLiked?: boolean;
  commentList?: Comment[];
}

interface Comment {
  id: string;
  author: string;
  content: string;
  time: string;
}

// Helper function to format time ago
const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
};

const getDemoData = (day: number): Post[] => {
  const demoData: Record<number, Post[]> = {
    1: [
      {
        id: 1,
        author: "Mike D.",
        time: "2 hours ago",
        content: "I sat my son down and said 'I joined DadderUp because I want to be the best version of myself—for you.' His eyes lit up and he gave me the biggest hug. This journey is already worth it.",
        likes: 24,
        comments: 12,
        media: { type: "video", preview: "🎥 Video of the moment" },
        isLiked: false,
        commentList: [
          { id: "c1", author: "Sarah M.", content: "That's incredibly powerful! What a beautiful start.", time: "1 hour ago" },
          { id: "c2", author: "David L.", content: "This made me tear up. Starting my journey tomorrow!", time: "45 minutes ago" }
        ]
      },
      {
        id: 2,
        author: "Carlos R.",
        time: "5 hours ago", 
        content: "Looked my daughter in the eyes and told her she's my why. She asked 'Does that mean you'll play more with me?' Made me realize how much this matters.",
        likes: 18,
        comments: 6,
        media: { type: "image", preview: "📸 Father-daughter moment" },
        isLiked: true,
        commentList: [
          { id: "c3", author: "Jennifer K.", content: "Kids are so honest! That's beautiful.", time: "2 hours ago" }
        ]
      }
    ],
    2: [
      {
        id: 1,
        author: "James P.",
        time: "3 hours ago",
        content: "Told my twins the story of when they were born - how tiny they were and how I held them both at once. They were mesmerized and kept asking for more details. One of the best conversations we've ever had.",
        likes: 31,
        comments: 15,
        media: { type: "image", preview: "📸 Baby hospital photos" },
        isLiked: false,
        commentList: [
          { id: "c1", author: "Maria S.", content: "This is so precious! They'll remember this forever.", time: "2 hours ago" }
        ]
      },
      {
        id: 2,
        author: "Robert K.",
        time: "7 hours ago",
        content: "Shared the story of meeting my adopted son for the first time. Told him about how nervous and excited I was. He said 'I was nervous too, Dad.' We both cried happy tears.",
        likes: 42,
        comments: 20,
        media: { type: "video", preview: "🎥 Emotional conversation" },
        isLiked: true,
        commentList: [
          { id: "c2", author: "Lisa M.", content: "I'm not crying, you're crying! Beautiful moment.", time: "5 hours ago" }
        ]
      }
    ],
    3: [
      {
        id: 1,
        author: "Marcus T.",
        time: "4 hours ago",
        content: "Just posted my DadderUp journey video! Talked about why I joined and the two things I love most about my kids - their curiosity and kindness. They watched it with me and now want to make their own videos 😂",
        likes: 38,
        comments: 18,
        media: { type: "video", preview: "🎥 DadderUp journey video" },
        isLiked: false,
        commentList: [
          { id: "c1", author: "Kevin B.", content: "Love this! The authenticity really shines through.", time: "3 hours ago" }
        ]
      },
      {
        id: 2,
        author: "Andre W.",
        time: "6 hours ago",
        content: "Made my video speaking from the heart about my daughter's courage and my son's humor. Tagged @DadderUp. My wife said it was the most vulnerable she's seen me. Feeling proud.",
        likes: 29,
        comments: 11,
        media: { type: "video", preview: "🎥 Heartfelt dad video" },
        isLiked: true,
        commentList: []
      }
    ],
    4: [
      {
        id: 1,
        author: "Daniel H.",
        time: "2 hours ago",
        content: "My vision: 'Be the dad who creates adventures, not excuses.' Said it in the mirror and it hit different. This is who I want to be.",
        likes: 27,
        comments: 9,
        media: { type: "image", preview: "📸 Vision written on mirror" },
        isLiked: false,
        commentList: [
          { id: "c1", author: "Mike J.", content: "That's powerful! Love the specificity.", time: "1 hour ago" }
        ]
      },
      {
        id: 2,
        author: "Chris L.",
        time: "5 hours ago",
        content: "Wrote: 'Be the dad who listens first and speaks second.' Looking at it in the mirror made me accountable. Already caught myself about to interrupt my son today - paused and listened instead.",
        likes: 35,
        comments: 14,
        media: { type: "audio", preview: "🎵 Recording of my vision statement" },
        isLiked: true,
        commentList: [
          { id: "c2", author: "Tony R.", content: "This is already changing how you show up! Amazing.", time: "3 hours ago" }
        ]
      }
    ],
    5: [
      {
        id: 1,
        author: "Brandon M.",
        time: "3 hours ago",
        content: "My mantra: 'Show up anyway.' Put it on my bathroom mirror. Already repeated it twice this morning when I wanted to hit snooze instead of making breakfast with the kids.",
        likes: 22,
        comments: 8,
        media: { type: "image", preview: "📸 Mantra on mirror" },
        isLiked: false,
        commentList: [
          { id: "c1", author: "Eric P.", content: "Simple but powerful. Thanks for sharing!", time: "2 hours ago" }
        ]
      },
      {
        id: 2,
        author: "Nathan D.",
        time: "7 hours ago",
        content: "'Legacy, not noise.' This one resonates because I tend to overreact. Posted it where I can see it when things get chaotic. Game changer.",
        likes: 30,
        comments: 12,
        media: { type: "image", preview: "📸 Posted mantra in kitchen" },
        isLiked: true,
        commentList: []
      }
    ],
    6: [
      {
        id: 1,
        author: "Tyler S.",
        time: "4 hours ago",
        content: "Set up a simple whiteboard in my office. Three columns: Wins, Gratitude, Tomorrow's Goal. Day 1 - played catch, grateful for their laughter, goal: read bedtime story without phone nearby.",
        likes: 33,
        comments: 15,
        media: { type: "image", preview: "📸 DDS tracking board" },
        isLiked: false,
        commentList: [
          { id: "c1", author: "Jason W.", content: "Love the simplicity! Stealing this idea.", time: "3 hours ago" }
        ]
      },
      {
        id: 2,
        author: "Alex R.",
        time: "6 hours ago",
        content: "Using a notebook - one page per day. Already seeing patterns in what makes good dad days vs struggling days. The tracking itself is making me more intentional.",
        likes: 28,
        comments: 10,
        media: { type: "image", preview: "📸 DDS notebook spread" },
        isLiked: true,
        commentList: []
      }
    ],
    7: [
      {
        id: 1,
        author: "Jordan F.",
        time: "2 hours ago",
        content: "Wrote my daughter a letter about my commitment to being present. Sealed it in an envelope for her to open when she's older. She doesn't know what it says but she knows it's special. She keeps it in her treasure box.",
        likes: 45,
        comments: 22,
        media: { type: "image", preview: "📸 Sealed letter in treasure box" },
        isLiked: false,
        commentList: [
          { id: "c1", author: "Paul M.", content: "She'll treasure this forever. Beautiful idea.", time: "1 hour ago" },
          { id: "c2", author: "Ryan T.", content: "This is the kind of thing she'll show her own kids someday.", time: "30 minutes ago" }
        ]
      },
      {
        id: 2,
        author: "Scott B.",
        time: "5 hours ago",
        content: "Made a small wooden token with my son - carved our initials together. He carries it in his pocket. Says it reminds him that dad is always with him even at school.",
        likes: 39,
        comments: 18,
        media: { type: "image", preview: "📸 Wooden token with initials" },
        isLiked: true,
        commentList: [
          { id: "c3", author: "Matt K.", content: "The fact you made it together makes it even more powerful!", time: "4 hours ago" }
        ]
      }
    ]
  };

  return demoData[day] || [];
};

export const CommunityPosts = ({ day }: CommunityPostsProps) => {
  const { logs } = useAnswerLogs();
  const [postLikes, setPostLikes] = useState<Record<string, { isLiked: boolean; count: number }>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [newComments, setNewComments] = useState<Record<string, string>>({});
  const [postComments, setPostComments] = useState<Record<string, Comment[]>>({});
  
  // Get public logs for the specified day/challenge
  const publicLogs = useMemo(() => {
    return logs
      .filter(log => log.privacy === 'public' && log.challengeId === day)
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 10); // Limit to latest 10 posts
  }, [logs, day]);

  // Combine real public logs with demo data (for now, to show examples)
  const demoData = getDemoData(day);
  const allPosts = [
    // Real public logs first
    ...publicLogs.map(log => ({
      id: `real-${log.id}`,
      author: log.userName,
      time: formatTimeAgo(log.date),
      content: log.response,
      likes: Math.floor(Math.random() * 20) + 1, // Random likes for demo
      comments: Math.floor(Math.random() * 10) + 1, // Random comments for demo
      media: log.mediaFiles.length > 0 ? {
        type: log.mediaFiles[0].type,
        preview: `${log.mediaFiles[0].type === 'image' ? '📸' : log.mediaFiles[0].type === 'video' ? '🎥' : '🎵'} ${log.mediaFiles[0].name}`
      } : undefined,
      isLiked: false,
      commentList: []
    })),
    // Demo data for context
    ...demoData.map(post => ({ ...post, id: `demo-${post.id}` }))
  ];

  // Initialize likes and comments state
  const initializePostStates = () => {
    const likes: Record<string, { isLiked: boolean; count: number }> = {};
    const comments: Record<string, Comment[]> = {};
    
    allPosts.forEach(post => {
      const postId = String(post.id);
      if (!postLikes[postId]) {
        likes[postId] = { 
          isLiked: post.isLiked || false, 
          count: post.likes 
        };
      }
      if (!postComments[postId] && post.commentList) {
        comments[postId] = post.commentList;
      }
    });
    
    if (Object.keys(likes).length > 0) {
      setPostLikes(prev => ({ ...prev, ...likes }));
    }
    if (Object.keys(comments).length > 0) {
      setPostComments(prev => ({ ...prev, ...comments }));
    }
  };

  // Initialize on mount or when posts change
  useMemo(() => {
    initializePostStates();
  }, [allPosts.length]);

  const toggleLike = (postId: string) => {
    setPostLikes(prev => {
      const current = prev[postId] || { isLiked: false, count: 0 };
      return {
        ...prev,
        [postId]: {
          isLiked: !current.isLiked,
          count: current.isLiked ? current.count - 1 : current.count + 1
        }
      };
    });
  };

  const toggleComments = (postId: string) => {
    setExpandedComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const addComment = (postId: string) => {
    const commentText = newComments[postId]?.trim();
    if (!commentText) return;

    const newComment: Comment = {
      id: `${postId}-${Date.now()}`,
      author: "You",
      content: commentText,
      time: "Just now"
    };

    setPostComments(prev => ({
      ...prev,
      [postId]: [...(prev[postId] || []), newComment]
    }));

    setNewComments(prev => ({
      ...prev,
      [postId]: ""
    }));
  };

  const updateNewComment = (postId: string, value: string) => {
    setNewComments(prev => ({
      ...prev,
      [postId]: value
    }));
  };

  if (allPosts.length === 0) {
    return (
      <div className="text-center py-8 text-card-foreground">
        <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No community examples yet for today's challenge.</p>
        <p className="text-sm mt-2">Be the first to share your experience publicly!</p>
      </div>
    );
  }

  const realPostsCount = publicLogs.length;
  const totalPostsCount = allPosts.length;

  return (
    <div className="space-y-4">
      {allPosts.map((post) => {
        const postId = String(post.id);
        const currentLikes = postLikes[postId] || { isLiked: post.isLiked || false, count: post.likes };
        const currentComments = postComments[postId] || post.commentList || [];
        const isCommentsExpanded = expandedComments[postId] || false;
        
        return (
          <div key={post.id} className="bg-white rounded-xl p-4 sm:p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-sm font-semibold text-primary">
                  {post.author.charAt(0)}
                </div>
                <span className="font-semibold text-sm text-card-foreground">{post.author}</span>
                <Badge variant="secondary" className="text-xs">
                  <Globe className="h-3 w-3 mr-1" />
                  Public
                </Badge>
              </div>
              <div className="flex items-center space-x-1 text-xs text-card-foreground/70">
                <Clock className="w-3 h-3" />
                <span>{post.time}</span>
              </div>
            </div>
            
            <p className="text-sm leading-relaxed mb-4 text-card-foreground">
              {post.content}
            </p>

            {post.media && (
              <div className="mb-4">
                {post.media.type === 'image' && (
                  <div className="rounded-lg overflow-hidden border w-full max-w-xs sm:max-w-sm">
                    <img 
                      src="https://images.unsplash.com/photo-1551963831-b3b1ca40c98e?w=300&h=400&fit=crop" 
                      alt="Childhood memory photo" 
                      className="w-full h-40 sm:h-48 object-cover"
                    />
                  </div>
                )}
                {post.media.type === 'video' && (
                  <div className="p-3 bg-muted/20 rounded-lg border border-border">
                    <div className="flex items-center space-x-2">
                      <Play className="w-5 h-5 text-accent" />
                      <span className="text-sm text-card-foreground">{post.media.preview}</span>
                      <button className="ml-auto text-xs text-accent hover:text-accent/80">
                        Play Video
                      </button>
                    </div>
                  </div>
                )}
                {post.media.type === 'audio' && (
                  <div className="p-3 bg-muted/20 rounded-lg border border-border">
                    <div className="flex items-center space-x-2">
                      <Headphones className="w-5 h-5 text-accent" />
                      <span className="text-sm text-card-foreground">{post.media.preview}</span>
                      <button className="ml-auto text-xs text-accent hover:text-accent/80">
                        Play Audio
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="flex items-center space-x-4 text-xs text-card-foreground/70 mb-4">
              <button 
                onClick={() => toggleLike(postId)}
                className={`flex items-center space-x-1 transition-colors ${
                  currentLikes.isLiked 
                    ? 'text-red-500 hover:text-red-600' 
                    : 'hover:text-accent'
                }`}
              >
                <Heart className={`w-4 h-4 ${currentLikes.isLiked ? 'fill-current' : ''}`} />
                <span>{currentLikes.count}</span>
              </button>
              <button 
                onClick={() => toggleComments(postId)}
                className="flex items-center space-x-1 hover:text-accent transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{currentComments.length}</span>
                {isCommentsExpanded ? (
                  <ChevronUp className="w-3 h-3 ml-1" />
                ) : (
                  <ChevronDown className="w-3 h-3 ml-1" />
                )}
              </button>
            </div>

            {/* Comments Section */}
            {isCommentsExpanded && (
              <div className="border-t border-border pt-4 space-y-3">
                {/* Existing Comments */}
                {currentComments.map((comment) => (
                  <div key={comment.id} className="bg-muted/30 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-xs font-semibold text-primary">
                          {comment.author.charAt(0)}
                        </div>
                        <span className="font-medium text-xs text-card-foreground">{comment.author}</span>
                      </div>
                      <span className="text-xs text-card-foreground/70">{comment.time}</span>
                    </div>
                    <p className="text-xs text-card-foreground">{comment.content}</p>
                  </div>
                ))}

                {/* Add Comment */}
                <div className="flex space-x-2">
                  <Textarea
                    placeholder="Add a comment..."
                    value={newComments[postId] || ""}
                    onChange={(e) => updateNewComment(postId, e.target.value)}
                    className="flex-1 min-h-[60px] text-xs resize-none"
                  />
                  <Button
                    onClick={() => addComment(postId)}
                    disabled={!newComments[postId]?.trim()}
                    size="sm"
                    className="self-end"
                  >
                    <Send className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};