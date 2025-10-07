import { useEffect, useState } from "react";
import { Shield, AlertTriangle, CheckCircle, Key, Clock, TrendingUp, Database, Mail, Activity, RefreshCw, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface SecurityMetrics {
  healthStatus: 'healthy' | 'warning' | 'critical';
  fraudAlertsCount: number;
  anomalousAccessCount: number;
  unencryptedPiiCount: number;
  keyAge: number;
  keyRotationOverdue: boolean;
  lastCheckDate: string;
  activeSessionsCount: number;
  recentAuditLogsCount: number;
}

interface FraudAlert {
  id: string;
  user_id: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: any;
  created_at: string;
}

interface TaxDocumentAlert {
  alert_type: string;
  user_id: string;
  target_user_id: string | null;
  decrypt_count: number;
  window_start: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export const SecurityDashboard = () => {
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [fraudAlerts, setFraudAlerts] = useState<FraudAlert[]>([]);
  const [taxDocAlerts, setTaxDocAlerts] = useState<TaxDocumentAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [securityReportsEnabled, setSecurityReportsEnabled] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('steven@dadderup.com');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const { toast } = useToast();

  useEffect(() => {
    fetchSecurityMetrics();
    fetchFraudAlerts();
    fetchTaxDocumentAlerts();
    fetchEmailSettings();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      fetchSecurityMetrics();
      fetchFraudAlerts();
      fetchTaxDocumentAlerts();
      setLastRefresh(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const fetchEmailSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('email_notification_settings')
        .select('enabled, security_reports_enabled, recipient_email')
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setEmailEnabled(data.enabled || false);
        setSecurityReportsEnabled(data.security_reports_enabled || false);
        setRecipientEmail(data.recipient_email || 'steven@dadderup.com');
      }
    } catch (error) {
      console.error('Error fetching email settings:', error);
    }
  };

  const handleSaveSecuritySettings = async () => {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: settingsData } = await supabase
        .from('email_notification_settings')
        .select('id')
        .single();

      if (!settingsData?.id) throw new Error('Settings not found');

      const { error } = await supabase
        .from('email_notification_settings')
        .update({ 
          security_reports_enabled: securityReportsEnabled,
          recipient_email: recipientEmail
        })
        .eq('id', settingsData.id);

      if (error) throw error;

      toast({
        title: "Settings Saved",
        description: "Security alert configuration has been updated",
      });
    } catch (error) {
      console.error('Error saving security settings:', error);
      toast({
        title: "Error",
        description: "Failed to save security settings",
        variant: "destructive",
      });
    }
  };

  const handleToggleSecurityReports = async (checked: boolean) => {
    setSecurityReportsEnabled(checked);
  };

  const fetchSecurityMetrics = async () => {
    try {
      // Fetch latest security monitor log
      const { data: monitorLog, error: monitorError } = await supabase
        .from('security_monitor_logs')
        .select('*')
        .order('check_date', { ascending: false })
        .limit(1)
        .single();

      if (monitorError && monitorError.code !== 'PGRST116') throw monitorError;

      // Fetch key age
      const { data: keyAge, error: keyAgeError } = await supabase
        .rpc('get_encryption_key_age');

      if (keyAgeError) throw keyAgeError;

      // Check if key rotation is overdue
      const { data: keyOverdue, error: keyOverdueError } = await supabase
        .rpc('is_key_rotation_overdue');

      if (keyOverdueError) throw keyOverdueError;

      // Fetch active sessions count
      const { count: sessionsCount } = await supabase
        .from('user_sessions')
        .select('*', { count: 'exact', head: true })
        .gt('expires_at', new Date().toISOString());

      // Fetch recent audit logs count (last 24 hours)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const { count: auditCount } = await supabase
        .from('security_audit_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', yesterday.toISOString());

      setMetrics({
        healthStatus: (monitorLog?.health_status as 'healthy' | 'warning' | 'critical') || 'healthy',
        fraudAlertsCount: monitorLog?.fraud_alerts_count || 0,
        anomalousAccessCount: monitorLog?.anomalous_access_count || 0,
        unencryptedPiiCount: monitorLog?.unencrypted_pii_count || 0,
        keyAge: keyAge || 999,
        keyRotationOverdue: keyOverdue || false,
        lastCheckDate: monitorLog?.check_date || new Date().toISOString(),
        activeSessionsCount: sessionsCount || 0,
        recentAuditLogsCount: auditCount || 0,
      });
    } catch (error) {
      console.error('Error fetching security metrics:', error);
      toast({
        title: "Error",
        description: "Failed to load security metrics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchFraudAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('fraud_alerts')
        .select('*')
        .eq('resolved', false)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setFraudAlerts((data as FraudAlert[]) || []);
    } catch (error) {
      console.error('Error fetching fraud alerts:', error);
    }
  };

  const fetchTaxDocumentAlerts = async () => {
    try {
      // Cast to bypass type checking until types are regenerated
      const { data, error } = await (supabase as any)
        .from('tax_document_security_alerts')
        .select('*')
        .limit(20);

      if (error) {
        console.log('Tax document alerts view not ready:', error.message);
        setTaxDocAlerts([]);
        return;
      }
      
      setTaxDocAlerts((data || []) as unknown as TaxDocumentAlert[]);
    } catch (error) {
      console.error('Error fetching tax document alerts:', error);
      setTaxDocAlerts([]);
    }
  };

  const runSecurityCheck = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('security-monitor', {
        body: { source: 'manual' }
      });

      if (error) throw error;

      toast({
        title: "Security Check Complete",
        description: "Security scan completed successfully",
      });

      // Refresh metrics
      await fetchSecurityMetrics();
      await fetchFraudAlerts();
      await fetchTaxDocumentAlerts();
    } catch (error) {
      console.error('Error running security check:', error);
      toast({
        title: "Error",
        description: "Failed to run security check",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-8 w-8 text-yellow-500" />;
      case 'critical':
        return <AlertTriangle className="h-8 w-8 text-red-500" />;
      default:
        return <Shield className="h-8 w-8 text-gray-500" />;
    }
  };

  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      default:
        return 'secondary';
    }
  };

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading security metrics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Security Monitoring Dashboard
          </h2>
          <p className="text-muted-foreground">
            Real-time security monitoring, encryption key management, and threat detection
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Activity className={`h-4 w-4 ${autoRefresh ? 'text-green-500 animate-pulse' : ''}`} />
            <span className="hidden sm:inline">
              {autoRefresh ? `Auto-refresh (${format(lastRefresh, 'HH:mm:ss')})` : 'Paused'}
            </span>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={runSecurityCheck} disabled={loading}>
            {loading ? "Scanning..." : "Run Security Scan"}
          </Button>
        </div>
      </div>

      {/* Overall Status Card */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon(metrics?.healthStatus || 'healthy')}
              <div>
                <CardTitle>Overall Security Status</CardTitle>
                <CardDescription>
                  Last check: {metrics?.lastCheckDate ? format(new Date(metrics.lastCheckDate), 'PPp') : 'Never'}
                </CardDescription>
              </div>
            </div>
            <Badge 
              variant={
                metrics?.healthStatus === 'healthy' ? 'default' :
                metrics?.healthStatus === 'warning' ? 'secondary' : 
                'destructive'
              }
              className="text-lg px-4 py-2"
            >
              {metrics?.healthStatus?.toUpperCase() || 'UNKNOWN'}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Security Alerts Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            <CardTitle>Security Alerts Configuration</CardTitle>
          </div>
          <CardDescription>
            Configure automated security report notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipient-email">
              Recipient Email Address
            </Label>
            <Input
              id="recipient-email"
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="admin@example.com"
              disabled={!emailEnabled}
            />
            <p className="text-xs text-muted-foreground">
              Security reports will be sent to this email address
            </p>
          </div>

          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="security-reports-enabled" className="flex flex-col space-y-1">
              <span>Enable Daily Security Reports</span>
              <span className="font-normal text-sm text-muted-foreground">
                Send automated security monitoring reports to administrators via email
              </span>
            </Label>
            <Switch
              id="security-reports-enabled"
              checked={securityReportsEnabled}
              onCheckedChange={handleToggleSecurityReports}
              disabled={!emailEnabled}
            />
          </div>

          <Button 
            onClick={handleSaveSecuritySettings}
            disabled={!emailEnabled}
            className="w-full"
          >
            Save Settings
          </Button>

          {!emailEnabled && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Email notifications must be enabled first. Configure in{' '}
                <a href="/admin" className="underline font-medium">
                  Admin → Notifications → Email
                </a>
              </AlertDescription>
            </Alert>
          )}
          <p className="text-xs text-muted-foreground border-t pt-3">
            <strong>Note:</strong> Security checks run daily at 2 AM UTC via automated cron job, regardless of this setting. 
            This toggle only controls whether email reports are sent to administrators.
          </p>
        </CardContent>
      </Card>

      {/* Key Rotation Alert */}
      {metrics?.keyRotationOverdue && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Encryption Key Rotation Overdue</AlertTitle>
          <AlertDescription>
            Your encryption key is {metrics.keyAge} days old (recommended: rotate every 365 days).
            Please schedule a key rotation immediately. See{' '}
            <a href="/docs/KEY_ROTATION_PROCEDURE.md" className="underline font-medium">
              Key Rotation Procedure
            </a>
          </AlertDescription>
        </Alert>
      )}

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Unresolved Fraud Alerts
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.fraudAlertsCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              {metrics?.fraudAlertsCount === 0 ? 'All clear' : 'Requires attention'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Anomalous Access
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.anomalousAccessCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              Users with unusual patterns
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Unencrypted PII
            </CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.unencryptedPiiCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              Records need encryption
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Encryption Key Age
            </CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.keyAge === 999 ? 'N/A' : `${metrics?.keyAge} days`}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics?.keyRotationOverdue ? 'Rotation overdue!' : 'Within policy'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Sessions
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.activeSessionsCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              Currently active users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Audit Events (24h)
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.recentAuditLogsCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              Security actions logged
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tax Document Security Alerts */}
      {taxDocAlerts.length > 0 && (
        <Card className="border-amber-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-amber-500" />
              Tax Document Security Alerts
            </CardTitle>
            <CardDescription>
              Monitoring SSN/EIN access patterns and compliance issues
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {taxDocAlerts.map((alert, index) => (
                <div
                  key={`${alert.user_id}-${alert.alert_type}-${index}`}
                  className="flex items-center justify-between border-b pb-3 last:border-0"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={getSeverityBadgeVariant(alert.severity)}>
                        {alert.severity}
                      </Badge>
                      <span className="font-medium">
                        {alert.alert_type === 'excessive_decryption_attempts' && 'Excessive Decryption Attempts'}
                        {alert.alert_type === 'unverified_high_earner' && 'Unverified High Earner'}
                        {alert.alert_type === 'missing_tax_document' && 'Missing Tax Document'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      User: {alert.user_id.substring(0, 8)}...
                      {alert.alert_type === 'excessive_decryption_attempts' && 
                        ` • ${alert.decrypt_count} attempts in 1 hour`}
                      {alert.alert_type === 'unverified_high_earner' && 
                        ` • Earnings: $${alert.decrypt_count}`}
                      {alert.alert_type === 'missing_tax_document' && 
                        ` • Earnings: $${alert.decrypt_count} (requires W-9)`}
                    </p>
                    {alert.window_start && (
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(alert.window_start), 'PP')}
                      </p>
                    )}
                  </div>
                  <Button variant="outline" size="sm">
                    Review
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Fraud Alerts */}
      {fraudAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Unresolved Fraud Alerts</CardTitle>
            <CardDescription>
              Recent security incidents requiring review
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {fraudAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between border-b pb-3 last:border-0"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={getSeverityBadgeVariant(alert.severity)}>
                        {alert.severity}
                      </Badge>
                      <span className="font-medium">{alert.alert_type}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      User ID: {alert.user_id.substring(0, 8)}... • {format(new Date(alert.created_at), 'PP')}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Investigate
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Rotation History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Key Rotation History
          </CardTitle>
          <CardDescription>
            Track encryption key rotation for compliance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <KeyRotationHistory />
        </CardContent>
      </Card>
    </div>
  );
};

const KeyRotationHistory = () => {
  const [rotations, setRotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRotationHistory();
  }, []);

  const fetchRotationHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('encryption_key_rotations')
        .select('*')
        .order('rotation_date', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRotations(data || []);
    } catch (error) {
      console.error('Error fetching rotation history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading rotation history...</div>;
  }

  if (rotations.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Key className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>No key rotation history found</p>
        <p className="text-sm mt-1">
          Initial key rotation recommended within 365 days of deployment
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rotations.map((rotation) => (
        <div
          key={rotation.id}
          className="flex items-center justify-between border-b pb-3 last:border-0"
        >
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Badge variant={rotation.status === 'completed' ? 'default' : 'destructive'}>
                {rotation.status}
              </Badge>
              <span className="text-sm font-medium">
                Rotated to: {rotation.new_key_identifier}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {format(new Date(rotation.rotation_date), 'PPp')} • {rotation.records_re_encrypted} records
            </p>
            {rotation.notes && (
              <p className="text-xs text-muted-foreground mt-1">{rotation.notes}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};