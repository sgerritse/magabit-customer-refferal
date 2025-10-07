import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const AffiliateSettingsTab = () => {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const { data, error } = await supabase
      .from("affiliate_settings")
      .select("*")
      .single();

    if (error) {
      console.error("Error loading settings:", error);
    } else {
      setSettings(data);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("affiliate_settings")
        .update(settings)
        .eq("id", settings.id);

      if (error) throw error;
      toast.success("Settings saved successfully!");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Cookie Attribution */}
      <Card>
        <CardHeader>
          <CardTitle>Cookie Attribution Window</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cookie-days">Attribution Window (Days)</Label>
            <Input
              id="cookie-days"
              type="number"
              value={settings?.cookie_attribution_days || 365}
              onChange={(e) => setSettings({ ...settings, cookie_attribution_days: parseInt(e.target.value) })}
            />
            <p className="text-sm text-muted-foreground">How long after a click can a conversion be attributed</p>
          </div>
        </CardContent>
      </Card>

      {/* Default Commission */}
      <Card>
        <CardHeader>
          <CardTitle>Default Commission Rates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="default-rate">Default Rate</Label>
              <Input
                id="default-rate"
                type="number"
                step="0.01"
                value={settings?.default_commission_rate || 30}
                onChange={(e) => setSettings({ ...settings, default_commission_rate: parseFloat(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="default-type">Type</Label>
              <Select
                value={settings?.default_commission_type || 'percentage'}
                onValueChange={(value) => setSettings({ ...settings, default_commission_type: value })}
              >
                <SelectTrigger id="default-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="flat">Flat Amount ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tiered Commissions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Tiered Commission System</CardTitle>
            <Switch
              checked={settings?.tiered_commissions_enabled || false}
              onCheckedChange={(checked) => setSettings({ ...settings, tiered_commissions_enabled: checked })}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {settings?.tiered_commissions_enabled && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-bold">🥉 Bronze Tier</Label>
                  <div className="space-y-2 mt-2">
                    <Input
                      type="number"
                      placeholder="Threshold"
                      value={settings.bronze_threshold || 0}
                      onChange={(e) => setSettings({ ...settings, bronze_threshold: parseInt(e.target.value) })}
                    />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Rate %"
                      value={settings.bronze_rate || 30}
                      onChange={(e) => setSettings({ ...settings, bronze_rate: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-bold">🥈 Silver Tier</Label>
                  <div className="space-y-2 mt-2">
                    <Input
                      type="number"
                      placeholder="Threshold"
                      value={settings.silver_threshold || 10}
                      onChange={(e) => setSettings({ ...settings, silver_threshold: parseInt(e.target.value) })}
                    />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Rate %"
                      value={settings.silver_rate || 35}
                      onChange={(e) => setSettings({ ...settings, silver_rate: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-bold">🥇 Gold Tier</Label>
                  <div className="space-y-2 mt-2">
                    <Input
                      type="number"
                      placeholder="Threshold"
                      value={settings.gold_threshold || 25}
                      onChange={(e) => setSettings({ ...settings, gold_threshold: parseInt(e.target.value) })}
                    />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Rate %"
                      value={settings.gold_rate || 40}
                      onChange={(e) => setSettings({ ...settings, gold_rate: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">Thresholds = monthly conversions needed to reach tier</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Campaign Boost */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Campaign Boost</CardTitle>
            <Switch
              checked={settings?.campaign_boost_enabled || false}
              onCheckedChange={(checked) => setSettings({ ...settings, campaign_boost_enabled: checked })}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {settings?.campaign_boost_enabled && (
            <>
              <div className="space-y-2">
                <Label>Boost Amount ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={settings.campaign_boost_amount || 0}
                  onChange={(e) => setSettings({ ...settings, campaign_boost_amount: parseFloat(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Target</Label>
                <Select
                  value={settings.campaign_boost_target || 'all'}
                  onValueChange={(value) => setSettings({ ...settings, campaign_boost_target: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Ambassadors</SelectItem>
                    <SelectItem value="selected">Selected Individuals</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Velocity Limits */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Velocity Limits (Fraud Prevention)</CardTitle>
            <Switch
              checked={settings?.velocity_limits_enabled || false}
              onCheckedChange={(checked) => setSettings({ ...settings, velocity_limits_enabled: checked })}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Enable at launch or later to prevent referral abuse</p>
          {settings?.velocity_limits_enabled && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Max Referrals/Hour</Label>
                <Input
                  type="number"
                  value={settings.max_referrals_per_hour || 10}
                  onChange={(e) => setSettings({ ...settings, max_referrals_per_hour: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label>Max Referrals/Day</Label>
                <Input
                  type="number"
                  value={settings.max_referrals_per_day || 50}
                  onChange={(e) => setSettings({ ...settings, max_referrals_per_day: parseInt(e.target.value) })}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Frequency */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Frequency</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={settings?.notification_frequency || 'daily_digest'}
            onValueChange={(value) => setSettings({ ...settings, notification_frequency: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="immediate">Immediate (Real-time)</SelectItem>
              <SelectItem value="daily_digest">Daily Digest (8 AM)</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Save All Settings
        </Button>
      </div>
    </div>
  );
};
