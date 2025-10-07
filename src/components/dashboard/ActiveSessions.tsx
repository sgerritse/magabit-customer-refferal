import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Monitor, Smartphone, Tablet, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Session {
  id: string;
  device_name: string;
  user_agent: string;
  device_fingerprint: string;
  ip_address: string;
  last_activity_at: string;
  created_at: string;
  is_current: boolean;
}

export const ActiveSessions = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);

  const loadSessions = async () => {
    if (!user) return;

    try {
      const { data: sessionData, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', user.id)
        .gt('expires_at', new Date().toISOString())
        .order('last_activity_at', { ascending: false });

      if (error) throw error;

      // Get current session token to mark current session
      const { data: { session } } = await supabase.auth.getSession();
      const currentToken = session?.access_token;

      setSessions(
        (sessionData || []).map(s => ({
          id: s.id,
          device_name: s.device_name || '',
          user_agent: s.user_agent || '',
          device_fingerprint: s.device_fingerprint || '',
          ip_address: String(s.ip_address || 'Unknown'),
          last_activity_at: s.last_activity_at,
          created_at: s.created_at,
          is_current: s.session_token === currentToken,
        }))
      );
    } catch (error) {
      console.error('Error loading sessions:', error);
      toast({
        title: "Error",
        description: "Failed to load active sessions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, [user]);

  const revokeSession = async (sessionId: string) => {
    setRevoking(sessionId);
    try {
      const { error } = await supabase
        .from('user_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;

      toast({
        title: "Session Revoked",
        description: "The session has been successfully terminated",
      });

      loadSessions();
    } catch (error) {
      console.error('Error revoking session:', error);
      toast({
        title: "Error",
        description: "Failed to revoke session",
        variant: "destructive",
      });
    } finally {
      setRevoking(null);
    }
  };

  const getDeviceIcon = (userAgent: string) => {
    const ua = userAgent.toLowerCase();
    if (ua.includes('android') || ua.includes('iphone')) {
      return <Smartphone className="h-5 w-5" />;
    }
    if (ua.includes('ipad')) {
      return <Tablet className="h-5 w-5" />;
    }
    return <Monitor className="h-5 w-5" />;
  };

  const getDeviceDisplay = (session: Session) => {
    const ua = session.user_agent.toLowerCase();
    let browser = 'Unknown Browser';
    let os = 'Unknown OS';

    if (ua.includes('chrome')) browser = 'Chrome';
    else if (ua.includes('firefox')) browser = 'Firefox';
    else if (ua.includes('safari')) browser = 'Safari';
    else if (ua.includes('edge')) browser = 'Edge';

    if (ua.includes('windows')) os = 'Windows';
    else if (ua.includes('mac')) os = 'MacOS';
    else if (ua.includes('linux')) os = 'Linux';
    else if (ua.includes('android')) os = 'Android';
    else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';

    return { browser, os };
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-4">Loading sessions...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Sessions</CardTitle>
        <CardDescription>
          Manage your active sessions. You can have up to 3 concurrent sessions across different devices.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {sessions.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No active sessions found</p>
          </div>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="text-muted-foreground mt-1">
                {getDeviceIcon(session.user_agent)}
              </div>
              
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">
                    {getDeviceDisplay(session).browser} on{' '}
                    {getDeviceDisplay(session).os}
                  </p>
                  {session.is_current && (
                    <Badge variant="default" className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Current
                    </Badge>
                  )}
                </div>
                
                <p className="text-sm text-muted-foreground">
                  IP: {session.ip_address || 'Unknown'}
                </p>
                
                <p className="text-xs text-muted-foreground">
                  Last active: {formatDistanceToNow(new Date(session.last_activity_at))} ago
                </p>
                
                <p className="text-xs text-muted-foreground">
                  Signed in: {formatDistanceToNow(new Date(session.created_at))} ago
                </p>
              </div>

              {!session.is_current && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => revokeSession(session.id)}
                  disabled={revoking === session.id}
                >
                  {revoking === session.id ? (
                    <>Revoking...</>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Revoke
                    </>
                  )}
                </Button>
              )}
            </div>
          ))
        )}

        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            For security, sessions automatically expire after 30 minutes of inactivity. 
            If you reach the limit of 3 sessions, the oldest inactive session will be automatically revoked.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
