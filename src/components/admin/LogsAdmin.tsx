import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Search, FileText, Image, Video, Trophy, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useAnswerLogs } from "@/hooks/useAnswerLogs";
import { toast } from "@/hooks/use-toast";

// Using LogEntry from useAnswerLogs hook

// Real challenge data matching the Challenges tab
const actualChallenges = [
  "Make your commitment clear to your child",
  "Share their origin story", 
  "Make your declaration public",
  "Define your father vision",
  "Choose your anchor phrase",
  "Create your DDS tracking board",
  "Give them your legacy symbol"
];

export const LogsAdmin = ({ challengeFilter = "all", onClearFilter }: { challengeFilter?: string; onClearFilter?: () => void }) => {
  const { logs, deleteLog } = useAnswerLogs();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterChallenge, setFilterChallenge] = useState<string>(challengeFilter);
  const [sortBy, setSortBy] = useState<string>("date");
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  // Get unique challenges for filter dropdown
  const uniqueChallenges = actualChallenges; // Use the real challenge data

  // Update filter when challengeFilter prop changes
  useEffect(() => {
    setFilterChallenge(challengeFilter);
  }, [challengeFilter]);

  // Fetch reactions from database
  const [reactions, setReactions] = useState<any[]>([]);
  
  useEffect(() => {
    const loadReactions = async () => {
      const { data } = await supabase
        .from('reactions')
        .select('reaction_id, emoji, label')
        .eq('is_active', true);
      
      if (data) {
        setReactions(data);
      }
    };
    loadReactions();
  }, []);

  // Handle delete with confirmation
  const handleDeleteLog = (logId: string, challengeTitle: string) => {
    if (confirm(`Are you sure you want to delete this "${challengeTitle}" log entry? This action cannot be undone.`)) {
      deleteLog(logId);
      toast({
        title: "Log Deleted",
        description: "The answer log has been successfully deleted.",
      });
    }
  };

  const filteredLogs = logs
    .filter(log => {
      const matchesSearch = log.challengeTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           log.response.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           log.userName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === "all" || log.submissionType === filterType;
      const matchesChallenge = filterChallenge === "all" || log.challengeTitle === filterChallenge;
      return matchesSearch && matchesType && matchesChallenge;
    })
    .sort((a, b) => {
      if (sortBy === "date") {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      } else if (sortBy === "points") {
        return b.pointsEarned - a.pointsEarned;
      }
      return 0;
    });

  const getSubmissionIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      case 'audio': return <Video className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getSubmissionColor = (type: string) => {
    switch (type) {
      case 'image': return 'bg-blue-100 text-blue-800';
      case 'video': return 'bg-purple-100 text-purple-800';
      case 'audio': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Answer Logs</h2>
          <p className="text-foreground">View all user submissions and responses</p>
          {challengeFilter !== "all" && onClearFilter && (
            <div className="mt-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onClearFilter}
                className="text-xs"
              >
                Clear Filter: {challengeFilter}
              </Button>
            </div>
          )}
        </div>
        <Badge variant="secondary" className="text-sm">
          {filteredLogs.length} {filteredLogs.length === 1 ? 'log' : 'logs'}
        </Badge>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by challenge, response, username, email, or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-2 border-gray-300 hover:border-gray-400 focus:border-primary"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="border-2 border-gray-300 hover:border-gray-400 focus:border-primary">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent className="z-50 bg-background border border-border">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="text">Text Only</SelectItem>
                  <SelectItem value="image">With Image</SelectItem>
                  <SelectItem value="video">With Video</SelectItem>
                  <SelectItem value="audio">With Audio</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterChallenge} onValueChange={setFilterChallenge}>
                <SelectTrigger className="border-2 border-gray-300 hover:border-gray-400 focus:border-primary">
                  <SelectValue placeholder="Filter by challenge" />
                </SelectTrigger>
                <SelectContent className="z-50 bg-background border border-border max-h-60">
                  <SelectItem value="all">All Challenges</SelectItem>
                  {uniqueChallenges.map((challenge, index) => (
                    <SelectItem key={index} value={challenge}>
                      {challenge.length > 40 ? `${challenge.substring(0, 40)}...` : challenge}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="border-2 border-gray-300 hover:border-gray-400 focus:border-primary">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="z-50 bg-background border border-border">
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="points">Points</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs List */}
      <div className="space-y-4">
        {filteredLogs.map((log) => (
          <Card key={log.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg leading-tight">{log.challengeTitle}</CardTitle>
                  <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(log.date), "MMM d, yyyy")}
                    </div>
                    <div className="flex items-center gap-1">
                      <Trophy className="w-4 h-4" />
                      {log.pointsEarned} points
                    </div>
                  </div>
                  <div className="mt-2">
                    <Badge variant="outline" className="text-xs">
                      {log.userName}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="secondary" 
                    className={`${getSubmissionColor(log.submissionType)} flex items-center gap-1`}
                  >
                    {getSubmissionIcon(log.submissionType)}
                    {log.submissionType}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                    className="ml-2"
                  >
                    {expandedLog === log.id ? "Hide Details" : "View Details"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteLog(log.id, log.challengeTitle)}
                    className="text-red-600 hover:text-red-700 hover:border-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className={`transition-all duration-300 ${expandedLog === log.id ? 'max-h-none' : 'max-h-20 overflow-hidden'}`}>
                <p className="text-gray-700 leading-relaxed break-words">{log.response}</p>
                {log.mediaFiles && log.mediaFiles.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm text-muted-foreground mb-2">Attachments:</p>
                    <div className="flex flex-wrap gap-2">
                      {log.mediaFiles.map((file, index) => (
                        <Badge key={index} variant="outline" className="text-xs break-all">
                          {file.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {expandedLog === log.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <p className="font-semibold text-gray-600 mb-1">Submission Details:</p>
                        <p><span className="font-medium">Type:</span> {log.submissionType}</p>
                        <p><span className="font-medium">Points Earned:</span> {log.pointsEarned}</p>
                        <p><span className="font-medium">Date:</span> {format(new Date(log.date), "EEEE, MMMM d, yyyy 'at' h:mm a")}</p>
                        <p><span className="font-medium">Parent Feelings:</span> {log.parentReactions?.join(', ') || 'None'}</p>
                        <p><span className="font-medium">Time Spent:</span> {log.timeSpent} minutes</p>
                      </div>
                      <div className="space-y-2">
                        <p className="font-semibold text-gray-600 mb-1">User Information:</p>
                        <p><span className="font-medium">User:</span> {log.userName}</p>
                        <p><span className="font-medium">Privacy:</span> {log.privacy}</p>
                        <div className="mt-3">
                          <p className="font-semibold text-gray-600 mb-1">Reactions:</p>
                          <div className="flex flex-wrap gap-2">
                            {(log.childReactions && log.childReactions.length > 0 ? log.childReactions : [log.reaction]).map((reactionId: string, index: number) => {
                              const reaction = reactions.find((r: any) => r.reaction_id === reactionId);
                              if (reaction) {
                                return (
                                  <span key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-sm">
                                    <span className="text-lg">{reaction.emoji}</span>
                                    <span className="text-gray-700">{reaction.label}</span>
                                  </span>
                                );
                              }
                              return (
                                <span key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-sm">
                                  <span className="text-lg">{reactionId}</span>
                                </span>
                              );
                            })}
                          </div>
                          {log.mediaFiles && log.mediaFiles.length > 0 && (
                            <p className="mt-2"><span className="font-medium">Media Files:</span> {log.mediaFiles.length}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {expandedLog !== log.id && log.response.length > 150 && (
                <div className="mt-2">
                  <span className="text-sm text-muted-foreground">Click "View Details" to see full response...</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredLogs.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No logs found</h3>
            <p className="text-muted-foreground">
              {searchTerm || filterType !== "all" 
                ? "Try adjusting your search or filter criteria"
                : "No answer logs have been submitted yet"
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};