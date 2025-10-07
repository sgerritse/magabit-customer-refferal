import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, Star, FileText, Image, Video, Headphones } from "lucide-react";

interface ChallengeLog {
  id: string;
  challenge_id: number;
  challenge_title: string;
  response: string;
  rating: number;
  time_spent: number;
  privacy: string;
  submission_type: string;
  media_files: any;
  points_earned: number;
  reaction: string;
  created_at: string;
  child_reactions: any;
}

interface CompletedChallengesViewProps {
  userId: string;
}

export const CompletedChallengesView = ({ userId }: CompletedChallengesViewProps) => {
  const [challenges, setChallenges] = useState<ChallengeLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        const { data, error } = await supabase
          .from('answer_logs')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setChallenges((data || []).map(item => ({
          ...item,
          media_files: Array.isArray(item.media_files) ? item.media_files : [],
          child_reactions: Array.isArray(item.child_reactions) ? item.child_reactions : []
        })));
      } catch (error) {
        console.error('Error fetching completed challenges:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChallenges();
  }, [userId]);

  if (loading) {
    return <div className="p-4 text-center">Loading completed challenges...</div>;
  }

  if (challenges.length === 0) {
    return <div className="p-4 text-center text-muted-foreground">No completed challenges found.</div>;
  }

  const getSubmissionIcon = (type: string) => {
    switch (type) {
      case 'text': return <FileText className="h-4 w-4" />;
      case 'image': return <Image className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      case 'audio': return <Headphones className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4">
      {challenges.map((challenge, index) => (
        <Card key={challenge.id}>
          <CardContent className="p-4">
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h4 className="font-semibold text-lg">{challenge.challenge_title}</h4>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>{format(new Date(challenge.created_at), 'MMM dd, yyyy')}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{challenge.time_spent} min</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {getSubmissionIcon(challenge.submission_type)}
                      <span className="capitalize">{challenge.submission_type}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={challenge.privacy === 'public' ? 'default' : 'secondary'}>
                    {challenge.privacy}
                  </Badge>
                  <Badge variant="outline">
                    {challenge.points_earned} pts
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* Response */}
              <div>
                <h5 className="font-medium mb-2">Response:</h5>
                <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                  {challenge.response}
                </p>
              </div>

              {/* Rating & Reaction */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium">{challenge.rating}/5</span>
                </div>
                {challenge.reaction && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">Reaction:</span>
                    <Badge variant="outline">{challenge.reaction}</Badge>
                  </div>
                )}
              </div>

              {/* Child Reactions */}
              {challenge.child_reactions && challenge.child_reactions.length > 0 && (
                <div>
                  <h5 className="font-medium mb-2">Child Reactions:</h5>
                  <div className="flex flex-wrap gap-2">
                    {challenge.child_reactions.map((reaction, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {reaction}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Media Files */}
              {challenge.media_files && challenge.media_files.length > 0 && (
                <div>
                  <h5 className="font-medium mb-2">Media Files:</h5>
                  <div className="flex flex-wrap gap-2">
                    {challenge.media_files.map((media: any, idx: number) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {getSubmissionIcon(media.type)}
                        <span className="ml-1">{media.name}</span>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
      
      <div className="text-center text-sm text-muted-foreground pt-4">
        Total Completed Challenges: {challenges.length}
      </div>
    </div>
  );
};