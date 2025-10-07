import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface LogEntry {
  id: string;
  challengeId: number;
  challengeTitle: string;
  userName: string;
  userAvatar: string | null;
  response: string;
  parentReactions: string[];
  timeSpent: number;
  privacy: 'public' | 'private';
  submissionType: string;
  mediaFiles: Array<{ type: 'image' | 'video' | 'audio'; url: string; name: string }>;
  pointsEarned: number;
  reaction: string | null;
  date: Date;
  childReactions: string[];
}

export const useAnswerLogs = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const { user } = useAuth();

  // Load logs from Supabase with RLS applying (own + public, admins see all)
  useEffect(() => {
    const fetchLogs = async () => {
      const { data, error } = await supabase
        .from('answer_logs')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Failed to load logs:', error);
        return;
      }
      const mapped: LogEntry[] = (data || []).map((row: any) => ({
        id: row.id,
        challengeId: Number(row.challenge_id),
        challengeTitle: row.challenge_title,
        userName: row.user_name,
        userAvatar: row.user_avatar || null,
        response: row.response,
        parentReactions: row.parent_reactions || [],
        timeSpent: row.time_spent || 0,
        privacy: row.privacy,
        submissionType: row.submission_type,
        mediaFiles: row.media_files || [],
        pointsEarned: row.points_earned || 0,
        reaction: row.reaction,
        date: new Date(row.created_at),
        childReactions: row.child_reactions || [],
      }));
      setLogs(mapped);
    };
    fetchLogs();

    // Realtime updates (optional)
    const channel = supabase
      .channel('answer_logs_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'answer_logs' }, fetchLogs)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const addLog = async (newLog: Omit<LogEntry, 'id' | 'date'>) => {
    const insertPayload = {
      user_id: user?.id,
      challenge_id: newLog.challengeId,
      challenge_title: newLog.challengeTitle,
      user_name: newLog.userName,
      user_avatar: newLog.userAvatar,
      response: newLog.response,
      parent_reactions: newLog.parentReactions,
      time_spent: newLog.timeSpent,
      privacy: newLog.privacy,
      submission_type: newLog.submissionType,
      media_files: newLog.mediaFiles,
      points_earned: newLog.pointsEarned,
      reaction: newLog.reaction,
      child_reactions: newLog.childReactions,
      rating: 0,
    };
    const { data, error } = await supabase
      .from('answer_logs')
      .insert([insertPayload])
      .select()
      .single();
    if (error) {
      console.error('Failed to add log:', error);
      return null;
    }
    const created: LogEntry = {
      ...newLog,
      id: data.id,
      date: new Date(data.created_at),
    };
    setLogs((prev) => [created, ...prev]);
    return created;
  };

  const updateLog = async (logId: string, updatedLog: Partial<LogEntry>) => {
    const { error } = await supabase
      .from('answer_logs')
      .update({
        response: updatedLog.response,
        privacy: updatedLog.privacy,
        time_spent: updatedLog.timeSpent,
        media_files: updatedLog.mediaFiles,
        reaction: updatedLog.reaction,
        child_reactions: updatedLog.childReactions,
        points_earned: updatedLog.pointsEarned,
      })
      .eq('id', logId);
    if (error) {
      console.error('Failed to update log:', error);
      return;
    }
    setLogs((prev) => prev.map((l) => (l.id === logId ? { ...l, ...updatedLog } as LogEntry : l)));
  };

  const deleteLog = async (logId: string) => {
    // Find log to cleanup storage files
    const target = logs.find((l) => l.id === logId);
    if (target && target.mediaFiles?.length) {
      try {
        const paths: string[] = [];
        for (const mf of target.mediaFiles) {
          if (!mf.url) continue;
          // Expected format: .../storage/v1/object/public/challenge-media/<path>
          const marker = '/storage/v1/object/public/challenge-media/';
          const idx = mf.url.indexOf(marker);
          if (idx !== -1) {
            const path = mf.url.substring(idx + marker.length);
            paths.push(path);
          }
        }
        if (paths.length) {
          await supabase.storage.from('challenge-media').remove(paths);
        }
      } catch (e) {
        console.error('Failed to cleanup storage files for log', logId, e);
      }
    }

    const { error } = await supabase.from('answer_logs').delete().eq('id', logId);
    if (error) {
      console.error('Failed to delete log:', error);
      return;
    }
    setLogs((prev) => prev.filter((l) => l.id !== logId));
  };

  return { logs, addLog, updateLog, deleteLog };
};