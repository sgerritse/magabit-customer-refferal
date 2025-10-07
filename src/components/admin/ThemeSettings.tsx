import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { 
  Palette, Home, BookOpen, TrendingUp, User, Users, Settings as SettingsIcon, Upload,
  Zap, Flame, Camera, Video, Mic, ShoppingCart, Trophy, Star, CheckCircle2,
  Calendar, Award, UserCircle, Target, BarChart3, Medal, Gift, Crown
} from "lucide-react";
import { useThemeSettings, LoadingWidgetSettings } from "@/hooks/useThemeSettings";
import { LoadingWidget } from "@/components/ui/loading-widget";
import { supabase } from "@/integrations/supabase/client";

// Interface for color variables
interface ColorVariable {
  cssVar: string;
  name: string;
  defaultValue: string;
  description?: string;
}

// Interface for predefined colors
interface DesignSystemColor {
  name: string;
  hex: string;
}

// Predefined colors from design system
const designSystemColors: DesignSystemColor[] = [
  { name: "Dark Blue", hex: "#1e3a5f" },
  { name: "Light Blue", hex: "#3b82f6" },
  { name: "Vibrant Blue", hex: "#2563eb" },
  { name: "Orange", hex: "#ea580c" },
  { name: "Green", hex: "#10b981" },
  { name: "Red", hex: "#ef4444" },
  { name: "White", hex: "#ffffff" },
  { name: "Light Gray", hex: "#f3f4f6" },
  { name: "Gray", hex: "#6b7280" },
  { name: "Dark Gray", hex: "#374151" },
];

// Color conversion utilities
const hexToHSL = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '0 0% 50%';
  
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);

  return `${h} ${s}% ${l}%`;
};

const hslToHex = (hsl: string): string => {
  const [h, s, l] = hsl.split(' ').map(v => parseFloat(v));
  
  const sDecimal = s / 100;
  const lDecimal = l / 100;

  const c = (1 - Math.abs(2 * lDecimal - 1)) * sDecimal;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = lDecimal - c / 2;
  
  let r = 0, g = 0, b = 0;

  if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
  else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
  else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
  else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
  else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
  else if (h >= 300 && h < 360) { r = c; g = 0; b = x; }

  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);

  const toHex = (n: number) => {
    const hex = n.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

interface ThemeSettingsProps {
  activeSection?: string;
}

export function ThemeSettings({ activeSection }: ThemeSettingsProps) {
  // Map navigation values to tab values
  const tabMapping: Record<string, string> = {
    "theme-dashboard": "dashboard",
    "theme-onboarding": "onboarding",
    "theme-progress": "progress",
    "theme-profile": "profile",
    "theme-ambassador": "ambassador",
    "theme-loading": "admin",
    "theme-admin-panel": "admin-panel",
    "theme-global": "global",
  };
  
  const defaultTab = activeSection 
    ? (tabMapping[activeSection] || "dashboard")
    : "dashboard";

  const { settings, updateSettings } = useThemeSettings();
  const [colors, setColors] = useState<{ [key: string]: string }>({});
  const [originalColors, setOriginalColors] = useState<{ [key: string]: string }>({});
  const [loadingWidgetSettings, setLoadingWidgetSettings] = useState<LoadingWidgetSettings>({
    logo_url: "/dadderup-logo-white.png",
    logo_size: 64,
    bg_color: "hsl(var(--background))",
    text_color: "hsl(var(--foreground))",
    spinner_color: "hsl(var(--primary))",
    loading_text: "Loading..."
  });
  
  // Load theme colors and loading widget settings from database or fallback to CSS
  useEffect(() => {
    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);
    const isDark = document.documentElement.classList.contains("dark");
    
    // Load loading widget settings
    if (settings?.loading_widget_settings) {
      setLoadingWidgetSettings(settings.loading_widget_settings);
    }
    
    // Try to load from database first
    if (settings) {
      const themeVars = isDark ? settings.dark_theme : settings.light_theme;
      if (themeVars && Object.keys(themeVars).length > 0) {
        setColors(themeVars);
        setOriginalColors(themeVars);
        return;
      }
    }
    
    // Fallback: Load from current CSS if database is empty
    const initialColors: { [key: string]: string } = {};
    const allVariables = [
      '--hero-bg', '--hero-text', '--stats-card-bg', '--stats-card-border', '--stats-icon-color',
      '--stats-value-text', '--stats-label-text', '--day-label-text', '--form-label-text',
      '--form-instruction-text', '--submission-box', '--submission-box-border', '--submission-box-text', 
      '--submission-label-text', '--submission-icon-color', '--submission-pill-enabled-text', 
      '--submission-pill-disabled-text', '--submission-pill-bg', '--submission-pill-text', '--shop-widget-bg', '--shop-widget-border', '--shop-widget-text',
      '--shop-widget-btn-bg', '--shop-widget-btn-border', '--shop-widget-btn-text', '--badges-card-bg', '--badges-card-border',
      '--badge-item-bg', '--badge-item-border', '--badge-item-text', '--view-challenges-btn-bg',
      '--view-challenges-btn-text', '--view-challenges-btn-border', '--tab-container-bg',
      '--tab-active-bg', '--tab-active-text', '--tab-inactive-text', '--dashboard-progress-bar-bg',
      '--dashboard-progress-bar-fill', '--feelings-subtext-text', '--page-title-color',
      '--onboarding-step-bg', '--onboarding-step-border', '--onboarding-step-number-bg',
      '--onboarding-step-number-text', '--onboarding-completed-bg', '--onboarding-completed-text',
      '--onboarding-progress-bar-bg', '--onboarding-progress-bar-fill', '--streak-card-bg',
      '--streak-value-color', '--weekly-grid-item-bg', '--weekly-grid-completed-bg',
      '--achievement-box-bg', '--achievement-box-border', '--leaderboard-item-bg',
      '--leaderboard-rank-color', '--avatar-border-color', '--form-field-bg', '--form-field-border',
      '--form-field-text', '--form-disabled-bg', '--form-disabled-text', '--referral-card-bg',
      '--referral-card-border', '--stats-counter-bg', '--stats-counter-text', '--tier-badge-bronze',
      '--tier-badge-silver', '--tier-badge-gold', '--payout-item-bg', '--payout-amount-color',
      '--chart-primary-color', '--chart-secondary-color', '--challenge-card-bg',
      '--challenge-card-border', '--day-badge-bg', '--day-badge-text', '--background', '--foreground',
      '--submission-title-text', '--submission-pill-bg', '--submission-pill-text',
      '--submission-primary-btn-bg', '--submission-primary-btn-border', '--submission-primary-btn-text',
      '--submission-secondary-btn-bg', '--submission-secondary-btn-border', '--submission-secondary-btn-text',
      '--wizard-completed-bg', '--wizard-completed-text', '--wizard-current-bg', '--wizard-current-text',
      '--wizard-future-bg', '--wizard-future-text'
    ];
    
    allVariables.forEach(varName => {
      const value = computedStyle.getPropertyValue(varName).trim();
      if (value) {
        initialColors[varName] = value;
      }
    });
    
    setColors(initialColors);
    setOriginalColors(initialColors);
  }, [settings]);

  const handleColorChange = (cssVar: string, hexValue: string) => {
    const hslValue = hexToHSL(hexValue);
    setColors(prev => ({ ...prev, [cssVar]: hslValue }));
    document.documentElement.style.setProperty(cssVar, hslValue);
  };

  const handleSave = () => {
    const isDark = document.documentElement.classList.contains("dark");
    
    // Save to database
    updateSettings.mutate({
      [isDark ? 'dark_theme' : 'light_theme']: colors,
      loading_widget_settings: loadingWidgetSettings
    });
    
    setOriginalColors(colors);
  };

  const handleReset = () => {
    // Reset to database values or original colors
    Object.entries(originalColors).forEach(([cssVar, value]) => {
      document.documentElement.style.setProperty(cssVar, value);
    });
    setColors(originalColors);
    
    // Reset loading widget settings
    if (settings?.loading_widget_settings) {
      setLoadingWidgetSettings(settings.loading_widget_settings);
    }
    
    toast({
      title: "Theme Reset",
      description: "All colors have been reset to the last saved state.",
    });
  };

  const handleLogoUpload = async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `loading-logo-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);
        
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
        
      setLoadingWidgetSettings(prev => ({ 
        ...prev, 
        logo_url: publicUrl 
      }));
      
      toast({
        title: "Logo uploaded",
        description: "Don't forget to save your changes"
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleWidgetColorChange = (field: keyof LoadingWidgetSettings, hexValue: string) => {
    const hslValue = hexToHSL(hexValue);
    setLoadingWidgetSettings(prev => ({
      ...prev,
      [field]: hslValue
    }));
  };

  const renderColorInput = (variable: ColorVariable) => {
    const currentHsl = colors[variable.cssVar] || variable.defaultValue;
    const currentHex = hslToHex(currentHsl);

    return (
      <div key={variable.cssVar} className="space-y-3 p-4 border border-border rounded-lg bg-card/50">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <Label htmlFor={variable.cssVar} className="text-sm font-medium">
              {variable.name}
            </Label>
            {variable.description && (
              <p className="text-xs text-muted-foreground mt-1">{variable.description}</p>
            )}
          </div>
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={currentHex}
              onChange={(e) => {
                const hex = e.target.value;
                if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
                  handleColorChange(variable.cssVar, hex);
                }
              }}
              placeholder="#000000"
              className="w-24 h-10 px-2 text-sm rounded border border-border bg-background"
            />
            <input
              type="color"
              id={variable.cssVar}
              value={currentHex}
              onChange={(e) => handleColorChange(variable.cssVar, e.target.value)}
              className="w-12 h-12 rounded cursor-pointer border border-border"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Preset Colors</Label>
          <div className="flex flex-wrap gap-2">
            {designSystemColors.map((color) => (
              <button
                key={color.name}
                onClick={() => handleColorChange(variable.cssVar, color.hex)}
                className="group relative"
                title={color.name}
              >
                <div
                  className="w-8 h-8 rounded border-2 border-border hover:border-primary transition-colors"
                  style={{ backgroundColor: color.hex }}
                />
                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-popover px-2 py-1 rounded shadow-lg z-10">
                  {color.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            <div>
              <CardTitle>Theme Settings</CardTitle>
              <CardDescription>Customize colors across different pages</CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleReset} variant="outline">Reset</Button>
            <Button onClick={handleSave}>Save Theme</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Dashboard Tab */}
          {defaultTab === "dashboard" && (
            <div className="space-y-8">
              {/* Hero Section Module */}
              <div className="space-y-4 p-6 border border-border rounded-lg bg-card">
                <h3 className="text-lg font-semibold text-primary">Hero Section</h3>
                
                {/* Preview */}
                <div className="p-6 rounded-lg flex items-center gap-3" style={{ backgroundColor: 'hsl(var(--hero-bg))' }}>
                  <Home className="h-8 w-8" style={{ color: 'hsl(var(--hero-text))' }} />
                  <h1 className="text-3xl font-bold" style={{ color: 'hsl(var(--hero-text))' }}>
                    Welcome Back, Dad!
                  </h1>
                </div>
                
                {/* Controls */}
                <div className="space-y-3">
                  {renderColorInput({ cssVar: '--hero-bg', name: 'Background Color', defaultValue: '221 45% 23%', description: 'Dashboard hero section background' })}
                  {renderColorInput({ cssVar: '--hero-text', name: 'Text Color', defaultValue: '0 0% 100%', description: 'Dashboard hero section text' })}
                </div>
              </div>

              {/* Day Label Module */}
              <div className="space-y-4 p-6 border border-border rounded-lg bg-card">
                <h3 className="text-lg font-semibold text-primary">Day Label</h3>
                
                {/* Preview */}
                <div className="p-4 rounded-lg">
                  <p className="text-sm" style={{ color: 'hsl(var(--day-label-text))' }}>Day 1</p>
                </div>
                
                {/* Controls */}
                <div className="space-y-3">
                  {renderColorInput({ cssVar: '--day-label-text', name: 'Text Color', defaultValue: '0 0% 45%', description: "'Day #' label text color" })}
                </div>
              </div>

              {/* Stats Cards Module */}
              <div className="space-y-4 p-6 border border-border rounded-lg bg-card">
                <h3 className="text-lg font-semibold text-primary">Stats Cards</h3>
                
                {/* Preview */}
                <div className="grid grid-cols-2 gap-4 p-4 rounded-lg">
                  <div 
                    className="p-4 rounded-lg border" 
                    style={{ 
                      backgroundColor: 'hsl(var(--stats-card-bg))', 
                      borderColor: 'hsl(var(--stats-card-border))' 
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Zap className="h-8 w-8" style={{ color: 'hsl(var(--stats-icon-color))' }} />
                      <div>
                        <p className="text-sm" style={{ color: 'hsl(var(--stats-label-text))' }}>Your Points</p>
                        <p className="text-2xl font-bold" style={{ color: 'hsl(var(--stats-value-text))' }}>150</p>
                      </div>
                    </div>
                  </div>
                  <div 
                    className="p-4 rounded-lg border" 
                    style={{ 
                      backgroundColor: 'hsl(var(--stats-card-bg))', 
                      borderColor: 'hsl(var(--stats-card-border))' 
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Flame className="h-8 w-8" style={{ color: 'hsl(var(--stats-icon-color))' }} />
                      <div>
                        <p className="text-sm" style={{ color: 'hsl(var(--stats-label-text))' }}>Streak</p>
                        <p className="text-2xl font-bold" style={{ color: 'hsl(var(--stats-value-text))' }}>7</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Controls */}
                <div className="space-y-3">
                  {renderColorInput({ cssVar: '--stats-card-bg', name: 'Background Color', defaultValue: '0 0% 100%', description: 'Stats card background' })}
                  {renderColorInput({ cssVar: '--stats-card-border', name: 'Border Color', defaultValue: '222 22% 85%', description: 'Stats card border color' })}
                  {renderColorInput({ cssVar: '--stats-label-text', name: 'Label Text', defaultValue: '71 85 105', description: "Color for stat labels like 'Your Points'" })}
                  {renderColorInput({ cssVar: '--stats-value-text', name: 'Value Text', defaultValue: '59 130 246', description: 'Color for large stat values' })}
                  {renderColorInput({ cssVar: '--stats-icon-color', name: 'Icon Color', defaultValue: '202 138 4', description: 'Color of stat card icons' })}
                </div>
              </div>

              {/* Shop Widget Module */}
              <div className="space-y-4 p-6 border border-border rounded-lg bg-card">
                <div className="flex items-center gap-2 mb-4">
                  <ShoppingCart className="h-5 w-5" />
                  <h3 className="text-lg font-semibold text-primary">Shop Widget</h3>
                </div>
                
                {/* Preview */}
                <div className="border rounded-lg p-4">
                  <div className="text-sm font-medium text-muted-foreground mb-3">Preview</div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span 
                        className="text-sm font-medium"
                        style={{ color: `hsl(${colors['--submission-label-text'] || '217 33% 17%'})` }}
                      >
                        Shop DadderUp
                      </span>
                      <span 
                        className="text-xs"
                        style={{ color: `hsl(${colors['--submission-pill-disabled-text'] || '220 9% 46%'})` }}
                      >
                        (+5 extra points)
                      </span>
                    </div>
                    <div 
                      className="border-2 border-dashed rounded-lg p-6 text-center space-y-3"
                      style={{ 
                        backgroundColor: `hsl(${colors['--shop-widget-bg'] || '214 100% 97%'})`, 
                        borderColor: `hsl(${colors['--shop-widget-border'] || '213 94% 88%'})` 
                      }}
                    >
                      <ShoppingCart 
                        className="h-8 w-8 mx-auto" 
                        style={{ color: `hsl(${colors['--shop-widget-text'] || '217 91% 60%'})` }}
                      />
                      <p 
                        className="text-sm"
                        style={{ color: `hsl(${colors['--shop-widget-text'] || '217 91% 60%'})` }}
                      >
                        Get the items you need for this challenge in the DadderUp Shop!
                      </p>
                      <button 
                        className="px-4 py-2 rounded-md text-sm font-medium border-2 transition-colors"
                        style={{
                          backgroundColor: `hsl(${colors['--shop-widget-btn-bg'] || '214 100% 97%'})`,
                          borderColor: `hsl(${colors['--shop-widget-btn-border'] || '213 94% 88%'})`,
                          color: `hsl(${colors['--shop-widget-btn-text'] || '217 91% 60%'})`
                        }}
                      >
                        Shop DadderUp
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Controls */}
                <div className="space-y-6 pt-4 border-t">
                  {/* Labels & Text Section */}
                  <div className="space-y-3">
                    <h5 className="text-sm font-semibold text-muted-foreground">Labels & Text</h5>
                    {renderColorInput({ cssVar: '--submission-label-text', name: 'Title Label ("Shop DadderUp")', defaultValue: '217 33% 17%' })}
                    {renderColorInput({ cssVar: '--submission-pill-disabled-text', name: 'Points Text ("(+5 extra points)")', defaultValue: '220 9% 46%' })}
                    {renderColorInput({ cssVar: '--shop-widget-text', name: 'Description Text', defaultValue: '217 91% 60%' })}
                  </div>
                  
                  {/* Widget Container Section */}
                  <div className="space-y-3">
                    <h5 className="text-sm font-semibold text-muted-foreground">Widget Container</h5>
                    {renderColorInput({ cssVar: '--shop-widget-bg', name: 'Background Color', defaultValue: '214 100% 97%' })}
                    {renderColorInput({ cssVar: '--shop-widget-border', name: 'Dashed Border', defaultValue: '213 94% 88%' })}
                  </div>
                  
                  {/* Button Section */}
                  <div className="space-y-3">
                    <h5 className="text-sm font-semibold text-muted-foreground">Button</h5>
                    {renderColorInput({ cssVar: '--shop-widget-btn-bg', name: 'Button Background', defaultValue: '214 100% 97%' })}
                    {renderColorInput({ cssVar: '--shop-widget-btn-border', name: 'Button Border', defaultValue: '213 94% 88%' })}
                    {renderColorInput({ cssVar: '--shop-widget-btn-text', name: 'Button Text', defaultValue: '217 91% 60%' })}
                  </div>
                </div>
              </div>

              {/* Badges Module */}
              <div className="space-y-4 p-6 border border-border rounded-lg bg-card">
                <h3 className="text-lg font-semibold text-primary">Badges</h3>
                
                {/* Preview */}
                <div 
                  className="p-4 rounded-lg border" 
                  style={{ 
                    backgroundColor: 'hsl(var(--badges-card-bg))', 
                    borderColor: 'hsl(var(--badges-card-border))' 
                  }}
                >
                  <div className="flex gap-2">
                    <div 
                      className="p-3 rounded-lg border text-center"
                      style={{ 
                        backgroundColor: 'hsl(var(--badge-item-bg))', 
                        borderColor: 'hsl(var(--badge-item-border))' 
                      }}
                    >
                      <Trophy className="h-8 w-8 mx-auto mb-1" style={{ color: 'hsl(var(--badge-item-text))' }} />
                      <p className="text-xs" style={{ color: 'hsl(var(--badge-item-text))' }}>Badge 1</p>
                    </div>
                    <div 
                      className="p-3 rounded-lg border text-center"
                      style={{ 
                        backgroundColor: 'hsl(var(--badge-item-bg))', 
                        borderColor: 'hsl(var(--badge-item-border))' 
                      }}
                    >
                      <Star className="h-8 w-8 mx-auto mb-1" style={{ color: 'hsl(var(--badge-item-text))' }} />
                      <p className="text-xs" style={{ color: 'hsl(var(--badge-item-text))' }}>Badge 2</p>
                    </div>
                  </div>
                </div>
                
                {/* Controls */}
                <div className="space-y-3">
                  {renderColorInput({ cssVar: '--badges-card-bg', name: 'Card Background', defaultValue: '0 0% 100%', description: 'Badges card background' })}
                  {renderColorInput({ cssVar: '--badges-card-border', name: 'Card Border', defaultValue: '222 22% 85%', description: 'Badges card border color' })}
                  {renderColorInput({ cssVar: '--badge-item-bg', name: 'Badge Background', defaultValue: '0 0% 100%', description: 'Individual badge background' })}
                  {renderColorInput({ cssVar: '--badge-item-border', name: 'Badge Border', defaultValue: '226 232 240', description: 'Individual badge border' })}
                  {renderColorInput({ cssVar: '--badge-item-text', name: 'Badge Text', defaultValue: '17 24 39', description: 'Badge text color' })}
                </div>
              </div>

              {/* Progress Bar Module */}
              <div className="space-y-4 p-6 border border-border rounded-lg bg-card">
                <h3 className="text-lg font-semibold text-primary">Progress Bar</h3>
                
                {/* Preview */}
                <div className="border rounded-lg p-4">
                  <div className="text-sm font-medium text-muted-foreground mb-3">Preview</div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-semibold">This Week's Progress</span>
                      <span className="text-sm font-semibold" style={{ color: `hsl(${colors['--dashboard-progress-bar-fill'] || '142 69% 58%'})` }}>
                        67% Complete
                      </span>
                    </div>
                    <div 
                      className="w-full rounded-full h-3"
                      style={{ backgroundColor: `hsl(${colors['--dashboard-progress-bar-bg'] || '210 30% 35%'})` }}
                    >
                      <div 
                        className="h-3 rounded-full transition-smooth" 
                        style={{
                          width: '67%',
                          backgroundColor: `hsl(${colors['--dashboard-progress-bar-fill'] || '142 69% 58%'})`
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                {/* Controls */}
                <div className="space-y-3 pt-4 border-t">
                  {renderColorInput({ cssVar: '--dashboard-progress-bar-bg', name: 'Background Color', defaultValue: '210 30% 35%' })}
                  {renderColorInput({ cssVar: '--dashboard-progress-bar-fill', name: 'Fill Color & Percentage Text', defaultValue: '142 69% 58%' })}
                </div>
              </div>

              {/* Feelings Section Module */}
              <div className="space-y-4 p-6 border border-border rounded-lg bg-card">
                <h3 className="text-lg font-semibold text-primary">Feelings Section</h3>
                
                {/* Preview */}
                <div className="p-4 rounded-lg">
                  <p className="text-sm" style={{ color: 'hsl(var(--feelings-subtext-text))' }}>
                    How are you feeling about today's challenge?
                  </p>
                </div>
                
                {/* Controls */}
                <div className="space-y-3">
                  {renderColorInput({ cssVar: '--feelings-subtext-text', name: 'Text Color', defaultValue: '0 0% 45%', description: 'Feelings subtext color' })}
                </div>
              </div>

              {/* View Challenges Button Module */}
              <div className="space-y-4 p-6 border border-border rounded-lg bg-card">
                <h3 className="text-lg font-semibold text-primary">View Challenges Button</h3>
                
                {/* Preview */}
                <div className="p-4 rounded-lg flex justify-center">
                  <button 
                    className="px-6 py-3 rounded-lg border font-medium"
                    style={{
                      backgroundColor: 'hsl(var(--view-challenges-btn-bg))',
                      color: 'hsl(var(--view-challenges-btn-text))',
                      borderColor: 'hsl(var(--view-challenges-btn-border))'
                    }}
                  >
                    View Challenges
                  </button>
                </div>
                
                {/* Controls */}
                <div className="space-y-3">
                  {renderColorInput({ cssVar: '--view-challenges-btn-bg', name: 'Background Color', defaultValue: '0 0% 100%' })}
                  {renderColorInput({ cssVar: '--view-challenges-btn-text', name: 'Text Color', defaultValue: '221 45% 23%' })}
                  {renderColorInput({ cssVar: '--view-challenges-btn-border', name: 'Border Color', defaultValue: '220 13% 91%' })}
                </div>
              </div>

              {/* Tabs Module */}
              <div className="space-y-4 p-6 border border-border rounded-lg bg-card">
                <h3 className="text-lg font-semibold text-primary">Tabs</h3>
                
                {/* Preview */}
                <div 
                  className="flex gap-2 p-2 rounded-lg" 
                  style={{ backgroundColor: 'hsl(var(--tab-container-bg))' }}
                >
                  <button 
                    className="px-4 py-2 rounded font-medium"
                    style={{
                      backgroundColor: 'hsl(var(--tab-active-bg))',
                      color: 'hsl(var(--tab-active-text))'
                    }}
                  >
                    Active Tab
                  </button>
                  <button 
                    className="px-4 py-2 rounded font-medium"
                    style={{ color: 'hsl(var(--tab-inactive-text))' }}
                  >
                    Inactive Tab
                  </button>
                </div>
                
                {/* Controls */}
                <div className="space-y-3">
                  {renderColorInput({ cssVar: '--tab-container-bg', name: 'Container Background', defaultValue: '240 5% 96%', description: 'Tab container background' })}
                  {renderColorInput({ cssVar: '--tab-active-bg', name: 'Active Tab Background', defaultValue: '12 87% 55%', description: 'Active tab background' })}
                  {renderColorInput({ cssVar: '--tab-active-text', name: 'Active Tab Text', defaultValue: '0 0% 100%', description: 'Active tab text color' })}
                  {renderColorInput({ cssVar: '--tab-inactive-text', name: 'Inactive Tab Text', defaultValue: '0 0% 45%', description: 'Inactive tab text color' })}
                </div>
              </div>

              {/* Media Capture Module */}
              <div className="space-y-4 p-6 border border-border rounded-lg bg-card">
                <div className="flex items-center gap-2 mb-4">
                  <Camera className="h-5 w-5" />
                  <h3 className="text-lg font-semibold text-primary">Media Submission Boxes</h3>
                </div>
                
                {/* Preview */}
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="text-sm font-medium text-muted-foreground mb-2">Preview</div>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Photo Upload Box */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span 
                          className="text-sm font-medium"
                          style={{ color: `hsl(${colors['--submission-label-text'] || '217 33% 17%'})` }}
                        >
                          Upload Image (Optional)
                        </span>
                        <span 
                          className="text-xs"
                          style={{ color: `hsl(${colors['--submission-pill-disabled-text'] || '220 9% 46%'})` }}
                        >
                          (+3 extra points)
                        </span>
                      </div>
                      <div 
                        className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center gap-3"
                        style={{
                          backgroundColor: `hsl(${colors['--submission-box'] || '0 0% 100%'})`,
                          borderColor: `hsl(${colors['--submission-box-border'] || '217 33% 92%'})`,
                        }}
                      >
                        <Camera 
                          className="h-8 w-8" 
                          style={{ color: `hsl(${colors['--submission-icon-color'] || '217 33% 64%'})` }}
                        />
                        <p 
                          className="text-sm text-center"
                          style={{ color: `hsl(${colors['--submission-label-text'] || '217 33% 42%'})` }}
                        >
                          Take or upload your photo
                        </p>
                        <button 
                          className="px-4 py-2 rounded-md text-sm font-medium border-2 transition-colors w-full flex items-center justify-center gap-2"
                          style={{
                            backgroundColor: `hsl(${colors['--submission-primary-btn-bg'] || '0 0% 100%'})`,
                            borderColor: `hsl(${colors['--submission-primary-btn-border'] || '25 95% 53%'})`,
                            color: `hsl(${colors['--submission-primary-btn-text'] || '25 95% 53%'})`
                          }}
                        >
                          <Camera className="h-4 w-4" />
                          Take Photo
                        </button>
                        <button 
                          className="px-4 py-2 rounded-md text-sm font-medium border-2 transition-colors w-full flex items-center justify-center gap-2"
                          style={{
                            backgroundColor: `hsl(${colors['--submission-secondary-btn-bg'] || '0 0% 100%'})`,
                            borderColor: `hsl(${colors['--submission-secondary-btn-border'] || '217 33% 92%'})`,
                            color: `hsl(${colors['--submission-secondary-btn-text'] || '217 33% 42%'})`
                          }}
                        >
                          <Upload className="h-4 w-4" />
                          Choose Image
                        </button>
                      </div>
                    </div>

                    {/* Video Upload Box */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span 
                          className="text-sm font-medium"
                          style={{ color: `hsl(${colors['--submission-label-text'] || '217 33% 17%'})` }}
                        >
                          Record/Upload Video (Optional)
                        </span>
                        <span 
                          className="text-xs"
                          style={{ color: `hsl(${colors['--submission-pill-disabled-text'] || '220 9% 46%'})` }}
                        >
                          (+10 extra points)
                        </span>
                      </div>
                      <div 
                        className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center gap-3"
                        style={{
                          backgroundColor: `hsl(${colors['--submission-box'] || '0 0% 100%'})`,
                          borderColor: `hsl(${colors['--submission-box-border'] || '217 33% 92%'})`,
                        }}
                      >
                        <Video 
                          className="h-8 w-8" 
                          style={{ color: `hsl(${colors['--submission-icon-color'] || '217 33% 64%'})` }}
                        />
                        <p 
                          className="text-sm text-center"
                          style={{ color: `hsl(${colors['--submission-label-text'] || '217 33% 42%'})` }}
                        >
                          Record or upload your video
                        </p>
                        <button 
                          className="px-4 py-2 rounded-md text-sm font-medium border-2 transition-colors w-full flex items-center justify-center gap-2"
                          style={{
                            backgroundColor: `hsl(${colors['--submission-primary-btn-bg'] || '0 0% 100%'})`,
                            borderColor: `hsl(${colors['--submission-primary-btn-border'] || '25 95% 53%'})`,
                            color: `hsl(${colors['--submission-primary-btn-text'] || '25 95% 53%'})`
                          }}
                        >
                          <Camera className="h-4 w-4" />
                          Record Video
                        </button>
                        <button 
                          className="px-4 py-2 rounded-md text-sm font-medium border-2 transition-colors w-full flex items-center justify-center gap-2"
                          style={{
                            backgroundColor: `hsl(${colors['--submission-secondary-btn-bg'] || '0 0% 100%'})`,
                            borderColor: `hsl(${colors['--submission-secondary-btn-border'] || '217 33% 92%'})`,
                            color: `hsl(${colors['--submission-secondary-btn-text'] || '217 33% 42%'})`
                          }}
                        >
                          <Upload className="h-4 w-4" />
                          Choose Video
                        </button>
                      </div>
                    </div>

                    {/* Audio Recording Box */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span 
                          className="text-sm font-medium"
                          style={{ color: `hsl(${colors['--submission-label-text'] || '217 33% 17%'})` }}
                        >
                          Record Audio (Optional)
                        </span>
                        <span 
                          className="text-xs"
                          style={{ color: `hsl(${colors['--submission-pill-disabled-text'] || '220 9% 46%'})` }}
                        >
                          (+5 extra points)
                        </span>
                      </div>
                      <div 
                        className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center gap-3 relative"
                        style={{
                          backgroundColor: `hsl(${colors['--submission-box'] || '0 0% 100%'})`,
                          borderColor: `hsl(${colors['--submission-box-border'] || '217 33% 92%'})`,
                        }}
                      >
                        <button className="absolute top-2 right-2 p-1 rounded hover:bg-gray-100">
                          <SettingsIcon 
                            className="h-4 w-4" 
                            style={{ color: `hsl(${colors['--submission-icon-color'] || '217 33% 64%'})` }}
                          />
                        </button>
                        <Mic 
                          className="h-8 w-8" 
                          style={{ color: `hsl(${colors['--submission-icon-color'] || '217 33% 64%'})` }}
                        />
                        <p 
                          className="text-sm text-center"
                          style={{ color: `hsl(${colors['--submission-label-text'] || '217 33% 42%'})` }}
                        >
                          Click to start recording<br />(max 5 minutes)
                        </p>
                        <button 
                          className="px-4 py-2 rounded-md text-sm font-medium border-2 transition-colors w-full flex items-center justify-center gap-2"
                          style={{
                            backgroundColor: `hsl(${colors['--submission-secondary-btn-bg'] || '0 0% 100%'})`,
                            borderColor: `hsl(${colors['--submission-secondary-btn-border'] || '217 33% 92%'})`,
                            color: `hsl(${colors['--submission-secondary-btn-text'] || '217 33% 42%'})`
                          }}
                        >
                          <Mic className="h-4 w-4" />
                          Record Audio
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Controls */}
                <div className="space-y-6 pt-4 border-t">
                  {/* Labels & Points Section */}
                  <div className="space-y-3">
                    <h5 className="text-sm font-semibold text-muted-foreground">Labels & Points Pill</h5>
                    {renderColorInput({ cssVar: '--submission-label-text', name: 'Label & Instruction Text', defaultValue: '217 33% 42%' })}
                    {renderColorInput({ cssVar: '--submission-pill-disabled-text', name: 'Points Text (No Upload)', defaultValue: '220 9% 46%' })}
                    {renderColorInput({ cssVar: '--submission-pill-enabled-text', name: 'Points Text (Uploaded)', defaultValue: '142 76% 36%' })}
                  </div>

                  {/* Buttons Section */}
                  <div className="space-y-3">
                    <h5 className="text-sm font-semibold text-muted-foreground">Buttons</h5>
                    {renderColorInput({ cssVar: '--submission-primary-btn-bg', name: 'Primary Button Background', defaultValue: '0 0% 100%' })}
                    {renderColorInput({ cssVar: '--submission-primary-btn-border', name: 'Primary Button Border (Orange)', defaultValue: '25 95% 53%' })}
                    {renderColorInput({ cssVar: '--submission-primary-btn-text', name: 'Primary Button Text', defaultValue: '25 95% 53%' })}
                    {renderColorInput({ cssVar: '--submission-secondary-btn-bg', name: 'Secondary Button Background', defaultValue: '0 0% 100%' })}
                    {renderColorInput({ cssVar: '--submission-secondary-btn-border', name: 'Secondary Button Border (Gray)', defaultValue: '217 33% 92%' })}
                    {renderColorInput({ cssVar: '--submission-secondary-btn-text', name: 'Secondary Button Text', defaultValue: '217 33% 42%' })}
                  </div>

                  {/* Icons & Container Section */}
                  <div className="space-y-3">
                    <h5 className="text-sm font-semibold text-muted-foreground">Icons & Container</h5>
                    {renderColorInput({ cssVar: '--submission-box', name: 'Container Background', defaultValue: '0 0% 100%' })}
                    {renderColorInput({ cssVar: '--submission-box-border', name: 'Dashed Border', defaultValue: '217 33% 92%' })}
                    {renderColorInput({ cssVar: '--submission-icon-color', name: 'Icon Color', defaultValue: '217 33% 64%' })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Onboarding Tab */}
          {defaultTab === "onboarding" && (
            <div className="space-y-8">
              {/* Onboarding Step Card Module */}
              <div className="space-y-4 p-6 border border-border rounded-lg bg-card">
                <h3 className="text-lg font-semibold text-primary">Step Cards</h3>
                
                {/* Preview */}
                <div className="p-4 rounded-lg space-y-4">
                  <div 
                    className="flex items-start gap-4 p-4 rounded-lg border"
                    style={{ 
                      backgroundColor: 'hsl(var(--onboarding-step-bg))',
                      borderColor: 'hsl(var(--onboarding-step-border))'
                    }}
                  >
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{ 
                        backgroundColor: 'hsl(var(--onboarding-step-number-bg))',
                        color: 'hsl(var(--onboarding-step-number-text))'
                      }}
                    >
                      1
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">Complete Your Profile</h4>
                      <p className="text-sm text-muted-foreground">Add your personal information</p>
                    </div>
                  </div>
                  
                  <div 
                    className="flex items-start gap-4 p-4 rounded-lg border"
                    style={{ 
                      backgroundColor: 'hsl(var(--onboarding-completed-bg))',
                      borderColor: 'hsl(var(--onboarding-step-border))'
                    }}
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm">
                      <CheckCircle2 className="h-5 w-5" style={{ color: 'hsl(var(--onboarding-completed-text))' }} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1" style={{ color: 'hsl(var(--onboarding-completed-text))' }}>
                        Step Completed
                      </h4>
                      <p className="text-sm text-muted-foreground">Great job!</p>
                    </div>
                  </div>
                </div>
                
                {/* Controls */}
                <div className="space-y-3">
                  {renderColorInput({ cssVar: '--onboarding-step-bg', name: 'Step Background', defaultValue: '0 0% 100%', description: 'Background of step cards' })}
                  {renderColorInput({ cssVar: '--onboarding-step-border', name: 'Step Border', defaultValue: '214 32% 91%', description: 'Border color of steps' })}
                  {renderColorInput({ cssVar: '--onboarding-step-number-bg', name: 'Number Background', defaultValue: '217 91% 60%', description: 'Step number circle background' })}
                  {renderColorInput({ cssVar: '--onboarding-step-number-text', name: 'Number Text', defaultValue: '0 0% 100%', description: 'Step number text color' })}
                  {renderColorInput({ cssVar: '--onboarding-completed-bg', name: 'Completed Background', defaultValue: '142 76% 36%', description: 'Completed step background' })}
                  {renderColorInput({ cssVar: '--onboarding-completed-text', name: 'Completed Text', defaultValue: '0 0% 100%', description: 'Completed step text color' })}
                </div>
              </div>

              {/* Progress Bar Module */}
              <div className="space-y-4 p-6 border border-border rounded-lg bg-card">
                <h3 className="text-lg font-semibold text-primary">Progress Bar</h3>
                
                {/* Preview */}
                <div className="p-4 rounded-lg">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>60%</span>
                    </div>
                    <div 
                      className="h-3 rounded-full overflow-hidden" 
                      style={{ backgroundColor: 'hsl(var(--onboarding-progress-bar-bg))' }}
                    >
                      <div 
                        className="h-full w-3/5" 
                        style={{ backgroundColor: 'hsl(var(--onboarding-progress-bar-fill))' }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                {/* Controls */}
                <div className="space-y-3">
                  {renderColorInput({ cssVar: '--onboarding-progress-bar-bg', name: 'Background Color', defaultValue: '214 32% 91%', description: 'Progress bar background' })}
                  {renderColorInput({ cssVar: '--onboarding-progress-bar-fill', name: 'Fill Color', defaultValue: '142 76% 36%', description: 'Progress bar fill color' })}
                </div>
              </div>
            </div>
          )}

          {/* Progress Tab */}
          {defaultTab === "progress" && (
            <div className="space-y-8">
              {/* Streak Card Module */}
              <div className="space-y-4 p-6 border border-border rounded-lg bg-card">
                <h3 className="text-lg font-semibold text-primary">Streak Card</h3>
                
                {/* Preview */}
                <div 
                  className="p-6 rounded-lg"
                  style={{ backgroundColor: 'hsl(var(--streak-card-bg))' }}
                >
                  <div className="text-center space-y-2">
                    <Flame className="h-12 w-12 mx-auto text-orange-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Current Streak</p>
                      <p className="text-4xl font-bold" style={{ color: 'hsl(var(--streak-value-color))' }}>
                        7 Days
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Controls */}
                <div className="space-y-3">
                  {renderColorInput({ cssVar: '--streak-card-bg', name: 'Card Background', defaultValue: '0 0% 100%', description: 'Streak card background' })}
                  {renderColorInput({ cssVar: '--streak-value-color', name: 'Value Color', defaultValue: '217 91% 60%', description: 'Streak number color' })}
                </div>
              </div>

              {/* Weekly Grid Module */}
              <div className="space-y-4 p-6 border border-border rounded-lg bg-card">
                <h3 className="text-lg font-semibold text-primary">Weekly Grid</h3>
                
                {/* Preview */}
                <div className="p-4 rounded-lg">
                  <div className="grid grid-cols-7 gap-2">
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                      <div 
                        key={i}
                        className="aspect-square rounded flex items-center justify-center text-xs font-medium"
                        style={{ 
                          backgroundColor: i < 5 
                            ? 'hsl(var(--weekly-grid-completed-bg))' 
                            : 'hsl(var(--weekly-grid-item-bg))' 
                        }}
                      >
                        {day}
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Controls */}
                <div className="space-y-3">
                  {renderColorInput({ cssVar: '--weekly-grid-item-bg', name: 'Item Background', defaultValue: '0 0% 98%', description: 'Incomplete day background' })}
                  {renderColorInput({ cssVar: '--weekly-grid-completed-bg', name: 'Completed Background', defaultValue: '142 76% 36%', description: 'Completed day background' })}
                </div>
              </div>

              {/* Achievement Box Module */}
              <div className="space-y-4 p-6 border border-border rounded-lg bg-card">
                <h3 className="text-lg font-semibold text-primary">Achievement Box</h3>
                
                {/* Preview */}
                <div 
                  className="p-6 rounded-lg border text-center"
                  style={{ 
                    backgroundColor: 'hsl(var(--achievement-box-bg))',
                    borderColor: 'hsl(var(--achievement-box-border))'
                  }}
                >
                  <Trophy className="h-12 w-12 mx-auto mb-2 text-yellow-500" />
                  <h4 className="font-semibold">Achievement Unlocked!</h4>
                  <p className="text-sm text-muted-foreground">7 Day Streak</p>
                </div>
                
                {/* Controls */}
                <div className="space-y-3">
                  {renderColorInput({ cssVar: '--achievement-box-bg', name: 'Box Background', defaultValue: '0 0% 100%', description: 'Achievement box background' })}
                  {renderColorInput({ cssVar: '--achievement-box-border', name: 'Box Border', defaultValue: '202 138 4', description: 'Achievement box border' })}
                </div>
              </div>
            </div>
          )}

          {/* Profile Tab */}
          {defaultTab === "profile" && (
            <div className="space-y-8">
              {/* Form Fields Module */}
              <div className="space-y-4 p-6 border border-border rounded-lg bg-card">
                <h3 className="text-lg font-semibold text-primary">Form Fields</h3>
                
                {/* Preview */}
                <div className="p-4 rounded-lg space-y-4">
                  <div>
                    <label className="text-sm font-medium block mb-2">Full Name</label>
                    <input 
                      type="text" 
                      placeholder="Enter your name"
                      className="w-full px-3 py-2 rounded border"
                      style={{ 
                        backgroundColor: 'hsl(var(--form-field-bg))',
                        borderColor: 'hsl(var(--form-field-border))',
                        color: 'hsl(var(--form-field-text))'
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-2">Email (Disabled)</label>
                    <input 
                      type="email" 
                      placeholder="email@example.com"
                      disabled
                      className="w-full px-3 py-2 rounded border"
                      style={{ 
                        backgroundColor: 'hsl(var(--form-disabled-bg))',
                        borderColor: 'hsl(var(--form-field-border))',
                        color: 'hsl(var(--form-disabled-text))'
                      }}
                    />
                  </div>
                </div>
                
                {/* Controls */}
                <div className="space-y-3">
                  {renderColorInput({ cssVar: '--form-field-bg', name: 'Field Background', defaultValue: '0 0% 100%', description: 'Input field background' })}
                  {renderColorInput({ cssVar: '--form-field-border', name: 'Field Border', defaultValue: '214 32% 91%', description: 'Input field border' })}
                  {renderColorInput({ cssVar: '--form-field-text', name: 'Field Text', defaultValue: '222 47% 11%', description: 'Input field text color' })}
                  {renderColorInput({ cssVar: '--form-disabled-bg', name: 'Disabled Background', defaultValue: '240 5% 96%', description: 'Disabled field background' })}
                  {renderColorInput({ cssVar: '--form-disabled-text', name: 'Disabled Text', defaultValue: '0 0% 60%', description: 'Disabled field text' })}
                </div>
              </div>

              {/* Avatar Border Module */}
              <div className="space-y-4 p-6 border border-border rounded-lg bg-card">
                <h3 className="text-lg font-semibold text-primary">Avatar Border</h3>
                
                {/* Preview */}
                <div className="p-4 rounded-lg flex justify-center">
                  <div 
                    className="w-24 h-24 rounded-full border-4 flex items-center justify-center"
                    style={{ borderColor: 'hsl(var(--avatar-border-color))' }}
                  >
                    <UserCircle className="h-16 w-16 text-muted-foreground" />
                  </div>
                </div>
                
                {/* Controls */}
                <div className="space-y-3">
                  {renderColorInput({ cssVar: '--avatar-border-color', name: 'Border Color', defaultValue: '217 91% 60%', description: 'Avatar border color' })}
                </div>
              </div>
            </div>
          )}

          {/* Ambassador Tab */}
          {defaultTab === "ambassador" && (
            <div className="space-y-8">
              {/* Referral Card Module */}
              <div className="space-y-4 p-6 border border-border rounded-lg bg-card">
                <h3 className="text-lg font-semibold text-primary">Referral Card</h3>
                
                {/* Preview */}
                <div 
                  className="p-6 rounded-lg border"
                  style={{ 
                    backgroundColor: 'hsl(var(--referral-card-bg))',
                    borderColor: 'hsl(var(--referral-card-border))'
                  }}
                >
                  <h4 className="font-semibold mb-2">Your Referral Link</h4>
                  <div className="p-3 bg-muted rounded text-sm font-mono">
                    https://dadderup.com/ref/ABC123
                  </div>
                </div>
                
                {/* Controls */}
                <div className="space-y-3">
                  {renderColorInput({ cssVar: '--referral-card-bg', name: 'Card Background', defaultValue: '0 0% 100%', description: 'Referral card background' })}
                  {renderColorInput({ cssVar: '--referral-card-border', name: 'Card Border', defaultValue: '214 32% 91%', description: 'Referral card border' })}
                </div>
              </div>

              {/* Stats Counter Module */}
              <div className="space-y-4 p-6 border border-border rounded-lg bg-card">
                <h3 className="text-lg font-semibold text-primary">Stats Counter</h3>
                
                {/* Preview */}
                <div className="p-4 rounded-lg">
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: 'Visits', value: '123', icon: Users },
                      { label: 'Signups', value: '45', icon: UserCircle },
                      { label: 'Earnings', value: '$678', icon: Gift }
                    ].map((stat, i) => (
                      <div 
                        key={i}
                        className="p-4 rounded-lg text-center space-y-2"
                        style={{ backgroundColor: 'hsl(var(--stats-counter-bg))' }}
                      >
                        <stat.icon 
                          className="h-6 w-6 mx-auto"
                          style={{ color: 'hsl(var(--stats-counter-text))' }}
                        />
                        <p 
                          className="text-2xl font-bold"
                          style={{ color: 'hsl(var(--stats-counter-text))' }}
                        >
                          {stat.value}
                        </p>
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Controls */}
                <div className="space-y-3">
                  {renderColorInput({ cssVar: '--stats-counter-bg', name: 'Counter Background', defaultValue: '0 0% 100%', description: 'Stats counter background' })}
                  {renderColorInput({ cssVar: '--stats-counter-text', name: 'Counter Text', defaultValue: '217 91% 60%', description: 'Stats counter number color' })}
                </div>
              </div>

              {/* Tier Badge Module */}
              <div className="space-y-4 p-6 border border-border rounded-lg bg-card">
                <h3 className="text-lg font-semibold text-primary">Tier Badges</h3>
                
                {/* Preview */}
                <div className="p-4 rounded-lg">
                  <div className="flex gap-4 justify-center">
                    <div 
                      className="px-4 py-2 rounded-full text-sm font-semibold text-white flex items-center gap-2"
                      style={{ backgroundColor: 'hsl(var(--tier-badge-bronze))' }}
                    >
                      <Medal className="h-4 w-4" />
                      <span>Bronze</span>
                    </div>
                    <div 
                      className="px-4 py-2 rounded-full text-sm font-semibold text-white flex items-center gap-2"
                      style={{ backgroundColor: 'hsl(var(--tier-badge-silver))' }}
                    >
                      <Award className="h-4 w-4" />
                      <span>Silver</span>
                    </div>
                    <div 
                      className="px-4 py-2 rounded-full text-sm font-semibold text-white flex items-center gap-2"
                      style={{ backgroundColor: 'hsl(var(--tier-badge-gold))' }}
                    >
                      <Crown className="h-4 w-4" />
                      <span>Gold</span>
                    </div>
                  </div>
                </div>
                
                {/* Controls */}
                <div className="space-y-3">
                  {renderColorInput({ cssVar: '--tier-badge-bronze', name: 'Bronze Badge', defaultValue: '26 83% 45%', description: 'Bronze tier badge color' })}
                  {renderColorInput({ cssVar: '--tier-badge-silver', name: 'Silver Badge', defaultValue: '0 0% 75%', description: 'Silver tier badge color' })}
                  {renderColorInput({ cssVar: '--tier-badge-gold', name: 'Gold Badge', defaultValue: '45 93% 47%', description: 'Gold tier badge color' })}
                </div>
              </div>

              {/* Payout Item Module */}
              <div className="space-y-4 p-6 border border-border rounded-lg bg-card">
                <h3 className="text-lg font-semibold text-primary">Payout Items</h3>
                
                {/* Preview */}
                <div className="p-4 rounded-lg space-y-2">
                  <div 
                    className="p-4 rounded-lg flex justify-between items-center"
                    style={{ backgroundColor: 'hsl(var(--payout-item-bg))' }}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <p className="font-semibold">January 2024</p>
                      </div>
                      <p className="text-sm text-muted-foreground">Paid on Jan 15</p>
                    </div>
                    <p 
                      className="text-xl font-bold"
                      style={{ color: 'hsl(var(--payout-amount-color))' }}
                    >
                      $1,234.56
                    </p>
                  </div>
                </div>
                
                {/* Controls */}
                <div className="space-y-3">
                  {renderColorInput({ cssVar: '--payout-item-bg', name: 'Item Background', defaultValue: '0 0% 100%', description: 'Payout item background' })}
                  {renderColorInput({ cssVar: '--payout-amount-color', name: 'Amount Color', defaultValue: '142 76% 36%', description: 'Payout amount color' })}
                </div>
              </div>

              {/* Chart Colors Module */}
              <div className="space-y-4 p-6 border border-border rounded-lg bg-card">
                <h3 className="text-lg font-semibold text-primary">Chart Colors</h3>
                
                {/* Preview */}
                <div className="p-4 rounded-lg">
                  <div className="flex gap-4 items-end justify-around h-32">
                    <div 
                      className="w-16 rounded-t flex flex-col items-center justify-end pb-2"
                      style={{ 
                        backgroundColor: 'hsl(var(--chart-primary-color))',
                        height: '60%'
                      }}
                    >
                      <BarChart3 className="h-6 w-6 text-white" />
                    </div>
                    <div 
                      className="w-16 rounded-t flex flex-col items-center justify-end pb-2"
                      style={{ 
                        backgroundColor: 'hsl(var(--chart-secondary-color))',
                        height: '80%'
                      }}
                    >
                      <BarChart3 className="h-6 w-6 text-white" />
                    </div>
                    <div 
                      className="w-16 rounded-t flex flex-col items-center justify-end pb-2"
                      style={{ 
                        backgroundColor: 'hsl(var(--chart-primary-color))',
                        height: '100%'
                      }}
                    >
                      <BarChart3 className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>
                
                {/* Controls */}
                <div className="space-y-3">
                  {renderColorInput({ cssVar: '--chart-primary-color', name: 'Primary Color', defaultValue: '217 91% 60%', description: 'Primary chart color' })}
                  {renderColorInput({ cssVar: '--chart-secondary-color', name: 'Secondary Color', defaultValue: '142 76% 36%', description: 'Secondary chart color' })}
                </div>
              </div>
            </div>
          )}

          {defaultTab === "admin" && (
            <div className="space-y-6">
              {/* Logo Settings Card */}
              <Card>
              <CardHeader>
                <CardTitle>Logo Settings</CardTitle>
                <CardDescription>Customize the loading screen logo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Current Logo Preview */}
                <div className="flex items-center gap-4">
                  <img 
                    src={loadingWidgetSettings.logo_url} 
                    alt="Current Logo" 
                    className="w-16 h-16 object-contain border border-border rounded p-2 bg-muted"
                  />
                  <div className="flex-1">
                    <Label htmlFor="logo-url">Logo URL</Label>
                    <Input 
                      id="logo-url"
                      value={loadingWidgetSettings.logo_url}
                      onChange={(e) => setLoadingWidgetSettings(prev => ({
                        ...prev, 
                        logo_url: e.target.value
                      }))}
                      placeholder="/path/to/logo.png"
                    />
                  </div>
                </div>
                
                {/* Logo Upload Button */}
                <div>
                  <Label htmlFor="logo-upload">Upload New Logo</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      id="logo-upload"
                      type="file" 
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleLogoUpload(file);
                      }}
                      className="cursor-pointer"
                    />
                    <Upload className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                
                {/* Logo Size Slider */}
                <div>
                  <Label htmlFor="logo-size">Logo Size: {loadingWidgetSettings.logo_size}px</Label>
                  <Slider
                    id="logo-size"
                    value={[loadingWidgetSettings.logo_size]}
                    onValueChange={([value]) => setLoadingWidgetSettings(prev => ({
                      ...prev,
                      logo_size: value
                    }))}
                    min={16}
                    max={128}
                    step={4}
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Color Settings Card */}
            <Card>
              <CardHeader>
                <CardTitle>Color Settings</CardTitle>
                <CardDescription>Customize loading screen colors</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Background Color */}
                <div className="space-y-3">
                  <Label>Background Color</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="text"
                      value={hslToHex(loadingWidgetSettings.bg_color)}
                      onChange={(e) => {
                        const hex = e.target.value;
                        if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
                          handleWidgetColorChange('bg_color', hex);
                        }
                      }}
                      placeholder="#000000"
                      className="w-24"
                    />
                    <input
                      type="color"
                      value={hslToHex(loadingWidgetSettings.bg_color)}
                      onChange={(e) => handleWidgetColorChange('bg_color', e.target.value)}
                      className="w-12 h-10 rounded cursor-pointer border border-border"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {designSystemColors.slice(0, 6).map((color) => (
                      <button
                        key={color.name}
                        onClick={() => handleWidgetColorChange('bg_color', color.hex)}
                        className="w-8 h-8 rounded border-2 border-border hover:border-primary transition-colors"
                        style={{ backgroundColor: color.hex }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>

                {/* Text Color */}
                <div className="space-y-3">
                  <Label>Text Color</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="text"
                      value={hslToHex(loadingWidgetSettings.text_color)}
                      onChange={(e) => {
                        const hex = e.target.value;
                        if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
                          handleWidgetColorChange('text_color', hex);
                        }
                      }}
                      placeholder="#000000"
                      className="w-24"
                    />
                    <input
                      type="color"
                      value={hslToHex(loadingWidgetSettings.text_color)}
                      onChange={(e) => handleWidgetColorChange('text_color', e.target.value)}
                      className="w-12 h-10 rounded cursor-pointer border border-border"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {designSystemColors.slice(0, 6).map((color) => (
                      <button
                        key={color.name}
                        onClick={() => handleWidgetColorChange('text_color', color.hex)}
                        className="w-8 h-8 rounded border-2 border-border hover:border-primary transition-colors"
                        style={{ backgroundColor: color.hex }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>

                {/* Spinner Glow Color */}
                <div className="space-y-3">
                  <Label>Spinner Glow Color</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="text"
                      value={hslToHex(loadingWidgetSettings.spinner_color)}
                      onChange={(e) => {
                        const hex = e.target.value;
                        if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
                          handleWidgetColorChange('spinner_color', hex);
                        }
                      }}
                      placeholder="#000000"
                      className="w-24"
                    />
                    <input
                      type="color"
                      value={hslToHex(loadingWidgetSettings.spinner_color)}
                      onChange={(e) => handleWidgetColorChange('spinner_color', e.target.value)}
                      className="w-12 h-10 rounded cursor-pointer border border-border"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {designSystemColors.slice(0, 6).map((color) => (
                      <button
                        key={color.name}
                        onClick={() => handleWidgetColorChange('spinner_color', color.hex)}
                        className="w-8 h-8 rounded border-2 border-border hover:border-primary transition-colors"
                        style={{ backgroundColor: color.hex }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Loading Text Card */}
            <Card>
              <CardHeader>
                <CardTitle>Loading Text</CardTitle>
                <CardDescription>Customize the loading message</CardDescription>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="loading-text">
                    Loading Message ({loadingWidgetSettings.loading_text.length}/50)
                  </Label>
                  <Input
                    id="loading-text"
                    value={loadingWidgetSettings.loading_text}
                    onChange={(e) => {
                      if (e.target.value.length <= 50) {
                        setLoadingWidgetSettings(prev => ({
                          ...prev,
                          loading_text: e.target.value
                        }));
                      }
                    }}
                    placeholder="Loading..."
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Live Preview Card */}
            <Card>
              <CardHeader>
                <CardTitle>Live Preview</CardTitle>
                <CardDescription>See how your loading widget looks</CardDescription>
              </CardHeader>
              <CardContent>
                <div 
                  className="rounded-lg overflow-hidden border border-border"
                  style={{ height: '250px', position: 'relative' }}
                >
                  <div style={{ transform: 'scale(0.5)', transformOrigin: 'top center', height: '500px' }}>
                    <LoadingWidget
                      logoUrl={loadingWidgetSettings.logo_url}
                      logoSize={loadingWidgetSettings.logo_size}
                      bgColor={loadingWidgetSettings.bg_color}
                      textColor={loadingWidgetSettings.text_color}
                      spinnerColor={loadingWidgetSettings.spinner_color}
                      loadingText={loadingWidgetSettings.loading_text}
                    />
                  </div>
                </div>
              </CardContent>
              </Card>
            </div>
          )}

          {/* Admin Panel Tab */}
          {defaultTab === "admin-panel" && (
            <div className="space-y-8">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Admin Sidebar Colors */}
              <Card>
                <CardHeader>
                  <CardTitle>Sidebar Colors</CardTitle>
                  <CardDescription>Customize admin navigation sidebar</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {renderColorInput({
                    cssVar: "--admin-sidebar-bg",
                    name: "Sidebar Background",
                    defaultValue: "222 47% 11%",
                    description: "Main sidebar background color"
                  })}
                  {renderColorInput({
                    cssVar: "--admin-sidebar-text",
                    name: "Sidebar Text",
                    defaultValue: "0 0% 100%",
                    description: "Sidebar menu text color"
                  })}
                  {renderColorInput({
                    cssVar: "--admin-sidebar-hover",
                    name: "Hover Background",
                    defaultValue: "217 33% 17%",
                    description: "Menu item hover state"
                  })}
                  {renderColorInput({
                    cssVar: "--admin-sidebar-active",
                    name: "Active Background",
                    defaultValue: "217 91% 60%",
                    description: "Active menu item background"
                  })}
                  {renderColorInput({
                    cssVar: "--admin-sidebar-active-text",
                    name: "Active Text",
                    defaultValue: "0 0% 100%",
                    description: "Active menu item text"
                  })}
                </CardContent>
              </Card>

              {/* Content Area Colors */}
              <Card>
                <CardHeader>
                  <CardTitle>Content Area</CardTitle>
                  <CardDescription>Main admin content styling</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {renderColorInput({
                    cssVar: "--admin-content-bg",
                    name: "Content Background",
                    defaultValue: "0 0% 100%",
                    description: "Main content area background"
                  })}
                  {renderColorInput({
                    cssVar: "--admin-content-text",
                    name: "Content Text",
                    defaultValue: "222 47% 11%",
                    description: "Main content text color"
                  })}
                  {renderColorInput({
                    cssVar: "--admin-card-bg",
                    name: "Card Background",
                    defaultValue: "0 0% 100%",
                    description: "Card/section background"
                  })}
                  {renderColorInput({
                    cssVar: "--admin-card-border",
                    name: "Card Border",
                    defaultValue: "214 32% 91%",
                    description: "Card border color"
                  })}
                  {renderColorInput({
                    cssVar: "--admin-card-header-bg",
                    name: "Card Header",
                    defaultValue: "214 32% 96%",
                    description: "Card header background"
                  })}
                </CardContent>
              </Card>

              {/* Form Elements */}
              <Card>
                <CardHeader>
                  <CardTitle>Form Elements</CardTitle>
                  <CardDescription>Input fields and controls</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {renderColorInput({
                    cssVar: "--admin-input-bg",
                    name: "Input Background",
                    defaultValue: "0 0% 100%",
                    description: "Input field background"
                  })}
                  {renderColorInput({
                    cssVar: "--admin-input-border",
                    name: "Input Border",
                    defaultValue: "214 32% 91%",
                    description: "Input field border"
                  })}
                  {renderColorInput({
                    cssVar: "--admin-input-text",
                    name: "Input Text",
                    defaultValue: "222 47% 11%",
                    description: "Input field text color"
                  })}
                  {renderColorInput({
                    cssVar: "--admin-input-focus",
                    name: "Input Focus Border",
                    defaultValue: "217 91% 60%",
                    description: "Input focus state border"
                  })}
                </CardContent>
              </Card>

              {/* Table Colors */}
              <Card>
                <CardHeader>
                  <CardTitle>Tables</CardTitle>
                  <CardDescription>Admin table styling</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {renderColorInput({
                    cssVar: "--admin-table-header-bg",
                    name: "Table Header",
                    defaultValue: "214 32% 96%",
                    description: "Table header background"
                  })}
                  {renderColorInput({
                    cssVar: "--admin-table-header-text",
                    name: "Header Text",
                    defaultValue: "222 47% 11%",
                    description: "Table header text color"
                  })}
                  {renderColorInput({
                    cssVar: "--admin-table-row-hover",
                    name: "Row Hover",
                    defaultValue: "214 95% 97%",
                    description: "Table row hover background"
                  })}
                  {renderColorInput({
                    cssVar: "--admin-table-border",
                    name: "Table Border",
                    defaultValue: "214 32% 91%",
                    description: "Table border color"
                  })}
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <Card>
                <CardHeader>
                  <CardTitle>Action Buttons</CardTitle>
                  <CardDescription>Admin button colors</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {renderColorInput({
                    cssVar: "--admin-primary-btn",
                    name: "Primary Button",
                    defaultValue: "217 91% 60%",
                    description: "Primary action button"
                  })}
                  {renderColorInput({
                    cssVar: "--admin-secondary-btn",
                    name: "Secondary Button",
                    defaultValue: "214 32% 91%",
                    description: "Secondary button"
                  })}
                  {renderColorInput({
                    cssVar: "--admin-danger-btn",
                    name: "Danger Button",
                    defaultValue: "0 84% 60%",
                    description: "Delete/danger button"
                  })}
                  {renderColorInput({
                    cssVar: "--admin-success-btn",
                    name: "Success Button",
                    defaultValue: "142 76% 36%",
                    description: "Success/confirm button"
                  })}
                </CardContent>
              </Card>

              {/* Status & Badges */}
              <Card>
                <CardHeader>
                  <CardTitle>Status & Badges</CardTitle>
                  <CardDescription>Status indicators and badges</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {renderColorInput({
                    cssVar: "--admin-badge-success",
                    name: "Success Badge",
                    defaultValue: "142 76% 36%",
                    description: "Success status badge"
                  })}
                  {renderColorInput({
                    cssVar: "--admin-badge-warning",
                    name: "Warning Badge",
                    defaultValue: "48 96% 53%",
                    description: "Warning status badge"
                  })}
                  {renderColorInput({
                    cssVar: "--admin-badge-error",
                    name: "Error Badge",
                    defaultValue: "0 84% 60%",
                    description: "Error status badge"
                  })}
                  {renderColorInput({
                    cssVar: "--admin-badge-info",
                    name: "Info Badge",
                    defaultValue: "217 91% 60%",
                    description: "Info status badge"
                  })}
                </CardContent>
              </Card>

              {/* Modal & Dialogs */}
              <Card>
                <CardHeader>
                  <CardTitle>Modals & Dialogs</CardTitle>
                  <CardDescription>Dialog and modal styling</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {renderColorInput({
                    cssVar: "--admin-modal-bg",
                    name: "Modal Background",
                    defaultValue: "0 0% 100%",
                    description: "Modal background color"
                  })}
                  {renderColorInput({
                    cssVar: "--admin-modal-overlay",
                    name: "Modal Overlay",
                    defaultValue: "222 47% 11%",
                    description: "Modal overlay backdrop"
                  })}
                  {renderColorInput({
                    cssVar: "--admin-modal-border",
                    name: "Modal Border",
                    defaultValue: "214 32% 91%",
                    description: "Modal border color"
                  })}
                </CardContent>
              </Card>

              {/* Search & Filters */}
              <Card>
                <CardHeader>
                  <CardTitle>Search & Filters</CardTitle>
                  <CardDescription>Search bars and filter controls</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {renderColorInput({
                    cssVar: "--admin-search-bg",
                    name: "Search Background",
                    defaultValue: "240 5% 96%",
                    description: "Search bar background"
                  })}
                  {renderColorInput({
                    cssVar: "--admin-search-border",
                    name: "Search Border",
                    defaultValue: "214 32% 91%",
                    description: "Search bar border"
                  })}
                  {renderColorInput({
                    cssVar: "--admin-filter-active",
                    name: "Active Filter",
                    defaultValue: "217 91% 60%",
                    description: "Active filter button"
                  })}
                </CardContent>
              </Card>
            </div>

            {/* Live Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Live Preview</CardTitle>
                <CardDescription>Preview of your admin panel theme</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border border-border rounded-lg overflow-hidden" style={{ height: '500px' }}>
                  <div className="flex h-full" style={{ fontSize: '10px' }}>
                    {/* Mini Sidebar */}
                    <div 
                      className="w-40 p-2 space-y-1"
                      style={{ 
                        backgroundColor: `hsl(${colors['--admin-sidebar-bg'] || '222 47% 11%'})`,
                        color: `hsl(${colors['--admin-sidebar-text'] || '0 0% 100%'})`
                      }}
                    >
                      <div className="font-semibold mb-3 px-2 text-xs">Admin Menu</div>
                      <div 
                        className="p-2 rounded cursor-pointer text-xs"
                        style={{ backgroundColor: `hsl(${colors['--admin-sidebar-hover'] || '217 33% 17%'})` }}
                      >
                        Dashboard
                      </div>
                      <div 
                        className="p-2 rounded text-xs"
                        style={{ 
                          backgroundColor: `hsl(${colors['--admin-sidebar-active'] || '217 91% 60%'})`,
                          color: `hsl(${colors['--admin-sidebar-active-text'] || '0 0% 100%'})`
                        }}
                      >
                        Theme Settings
                      </div>
                      <div className="p-2 rounded text-xs">Users</div>
                      <div className="p-2 rounded text-xs">Settings</div>
                    </div>

                    {/* Mini Content Area */}
                    <div 
                      className="flex-1 p-3 overflow-auto space-y-3"
                      style={{ 
                        backgroundColor: `hsl(${colors['--admin-content-bg'] || '0 0% 100%'})`,
                        color: `hsl(${colors['--admin-content-text'] || '222 47% 11%'})`
                      }}
                    >
                      <h3 className="font-semibold text-xs mb-2">Admin Panel</h3>
                      
                      {/* Status Badges */}
                      <div className="flex gap-1 mb-3 flex-wrap">
                        <span 
                          className="px-2 py-0.5 rounded text-white text-xs"
                          style={{ backgroundColor: `hsl(${colors['--admin-badge-success'] || '142 76% 36%'})` }}
                        >
                          Active
                        </span>
                        <span 
                          className="px-2 py-0.5 rounded text-white text-xs"
                          style={{ backgroundColor: `hsl(${colors['--admin-badge-warning'] || '48 96% 53%'})` }}
                        >
                          Pending
                        </span>
                        <span 
                          className="px-2 py-0.5 rounded text-white text-xs"
                          style={{ backgroundColor: `hsl(${colors['--admin-badge-error'] || '0 84% 60%'})` }}
                        >
                          Error
                        </span>
                      </div>

                      {/* Search Bar */}
                      <input 
                        type="text" 
                        placeholder="Search..."
                        className="w-full px-2 py-1 rounded border text-xs mb-2"
                        style={{ 
                          backgroundColor: `hsl(${colors['--admin-search-bg'] || '240 5% 96%'})`,
                          borderColor: `hsl(${colors['--admin-search-border'] || '214 32% 91%'})`
                        }}
                      />
                      
                      {/* Mini Card */}
                      <div 
                        className="rounded mb-2"
                        style={{ 
                          backgroundColor: `hsl(${colors['--admin-card-bg'] || '0 0% 100%'})`,
                          border: `1px solid hsl(${colors['--admin-card-border'] || '214 32% 91%'})`
                        }}
                      >
                        <div 
                          className="p-2 font-medium text-xs"
                          style={{ backgroundColor: `hsl(${colors['--admin-card-header-bg'] || '214 32% 96%'})` }}
                        >
                          Statistics
                        </div>
                        <div className="p-2 space-y-1">
                          <div className="text-xs">Total Users: 1,234</div>
                          <div className="text-xs">Active: 567</div>
                        </div>
                      </div>

                      {/* Mini Form */}
                      <div className="space-y-1 mb-2">
                        <label className="text-xs font-medium">Email</label>
                        <input 
                          type="text" 
                          placeholder="Enter email"
                          className="w-full px-2 py-1 rounded border text-xs"
                          style={{ 
                            backgroundColor: `hsl(${colors['--admin-input-bg'] || '0 0% 100%'})`,
                            borderColor: `hsl(${colors['--admin-input-border'] || '214 32% 91%'})`,
                            color: `hsl(${colors['--admin-input-text'] || '222 47% 11%'})`
                          }}
                        />
                      </div>

                      {/* Mini Table */}
                      <div 
                        className="rounded overflow-hidden mb-2"
                        style={{ border: `1px solid hsl(${colors['--admin-table-border'] || '214 32% 91%'})` }}
                      >
                        <div 
                          className="p-1 font-medium flex gap-4 text-xs"
                          style={{ 
                            backgroundColor: `hsl(${colors['--admin-table-header-bg'] || '214 32% 96%'})`,
                            color: `hsl(${colors['--admin-table-header-text'] || '222 47% 11%'})`
                          }}
                        >
                          <span className="flex-1">Name</span>
                          <span className="w-16">Status</span>
                        </div>
                        <div 
                          className="p-1 flex gap-4 text-xs"
                          style={{ backgroundColor: `hsl(${colors['--admin-table-row-hover'] || '214 95% 97%'})` }}
                        >
                          <span className="flex-1">John Doe</span>
                          <span className="w-16">Active</span>
                        </div>
                        <div className="p-1 flex gap-4 text-xs">
                          <span className="flex-1">Jane Smith</span>
                          <span className="w-16">Inactive</span>
                        </div>
                      </div>

                      {/* Mini Buttons */}
                      <div className="flex gap-1 flex-wrap">
                        <button 
                          className="px-2 py-1 rounded text-white text-xs"
                          style={{ backgroundColor: `hsl(${colors['--admin-primary-btn'] || '217 91% 60%'})` }}
                        >
                          Primary
                        </button>
                        <button 
                          className="px-2 py-1 rounded text-xs"
                          style={{ backgroundColor: `hsl(${colors['--admin-secondary-btn'] || '214 32% 91%'})` }}
                        >
                          Secondary
                        </button>
                        <button 
                          className="px-2 py-1 rounded text-white text-xs"
                          style={{ backgroundColor: `hsl(${colors['--admin-success-btn'] || '142 76% 36%'})` }}
                        >
                          Success
                        </button>
                        <button 
                          className="px-2 py-1 rounded text-white text-xs"
                          style={{ backgroundColor: `hsl(${colors['--admin-danger-btn'] || '0 84% 60%'})` }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              </Card>
            </div>
          )}

          {/* Global Tab */}
          {defaultTab === "global" && (
            <div className="space-y-8">
              {/* Page Title Module */}
              <div className="space-y-4 p-6 border border-border rounded-lg bg-card">
                <h3 className="text-lg font-semibold text-primary">Page Titles</h3>
                
                {/* Preview */}
                <div className="p-4 rounded-lg">
                  <h2 
                    className="text-2xl font-bold"
                    style={{ color: 'hsl(var(--page-title-color))' }}
                  >
                    Page Title Example
                  </h2>
                </div>
                
                {/* Controls */}
                <div className="space-y-3">
                  {renderColorInput({ cssVar: '--page-title-color', name: 'Title Color', defaultValue: '222 47% 11%', description: 'Global page title color' })}
                </div>
              </div>

              {/* Challenge Card Module */}
              <div className="space-y-4 p-6 border border-border rounded-lg bg-card">
                <h3 className="text-lg font-semibold text-primary">Challenge Cards</h3>
                
                {/* Preview */}
                <div 
                  className="p-6 rounded-lg border"
                  style={{ 
                    backgroundColor: 'hsl(var(--challenge-card-bg))',
                    borderColor: 'hsl(var(--challenge-card-border))'
                  }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <Target className="h-5 w-5" style={{ color: 'hsl(var(--day-badge-text))' }} />
                      <h4 className="font-semibold">Daily Challenge</h4>
                    </div>
                    <span 
                      className="px-2 py-1 rounded text-xs font-medium"
                      style={{ 
                        backgroundColor: 'hsl(var(--day-badge-bg))',
                        color: 'hsl(var(--day-badge-text))'
                      }}
                    >
                      Day 5
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">Complete today's challenge to maintain your streak</p>
                </div>
                
                {/* Controls */}
                <div className="space-y-3">
                  {renderColorInput({ cssVar: '--challenge-card-bg', name: 'Card Background', defaultValue: '0 0% 100%', description: 'Challenge card background' })}
                  {renderColorInput({ cssVar: '--challenge-card-border', name: 'Card Border', defaultValue: '214 32% 91%', description: 'Challenge card border' })}
                  {renderColorInput({ cssVar: '--day-badge-bg', name: 'Day Badge Background', defaultValue: '217 91% 60%', description: 'Day badge background color' })}
                  {renderColorInput({ cssVar: '--day-badge-text', name: 'Day Badge Text', defaultValue: '0 0% 100%', description: 'Day badge text color' })}
                </div>
              </div>

              {/* Leaderboard Module */}
              <div className="space-y-4 p-6 border border-border rounded-lg bg-card">
                <h3 className="text-lg font-semibold text-primary">Leaderboard</h3>
                
                {/* Preview */}
                <div className="p-4 rounded-lg space-y-2">
                  {[1, 2, 3].map((rank) => (
                    <div 
                      key={rank}
                      className="flex items-center gap-4 p-3 rounded-lg"
                      style={{ backgroundColor: 'hsl(var(--leaderboard-item-bg))' }}
                    >
                      <span 
                        className="text-lg font-bold w-8"
                        style={{ color: 'hsl(var(--leaderboard-rank-color))' }}
                      >
                        #{rank}
                      </span>
                      <div 
                        className="w-8 h-8 rounded-full border-2 flex items-center justify-center"
                        style={{ borderColor: 'hsl(var(--avatar-border-color))' }}
                      >
                        <UserCircle className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">User Name</p>
                        <p className="text-xs text-muted-foreground">1,234 points</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Controls */}
                <div className="space-y-3">
                  {renderColorInput({ cssVar: '--leaderboard-item-bg', name: 'Item Background', defaultValue: '0 0% 100%', description: 'Leaderboard item background' })}
                  {renderColorInput({ cssVar: '--leaderboard-rank-color', name: 'Rank Color', defaultValue: '217 91% 60%', description: 'Rank number color' })}
                </div>
              </div>

              {/* Base Colors Module */}
              <div className="space-y-4 p-6 border border-border rounded-lg bg-card">
                <h3 className="text-lg font-semibold text-primary">Base Colors</h3>
                <p className="text-sm text-muted-foreground">Core theme colors used throughout the app</p>
                
                {/* Preview */}
                <div className="grid grid-cols-2 gap-4 p-4 rounded-lg">
                  <div 
                    className="p-6 rounded-lg"
                    style={{ backgroundColor: 'hsl(var(--background))' }}
                  >
                    <p 
                      className="font-semibold"
                      style={{ color: 'hsl(var(--foreground))' }}
                    >
                      Background & Foreground
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <div 
                      className="flex-1 rounded-lg"
                      style={{ backgroundColor: 'hsl(var(--background))' }}
                    ></div>
                    <div 
                      className="flex-1 rounded-lg border-2"
                      style={{ borderColor: 'hsl(var(--foreground))' }}
                    ></div>
                  </div>
                </div>
                
                {/* Controls */}
                <div className="space-y-3">
                  {renderColorInput({ cssVar: '--background', name: 'Background', defaultValue: '0 0% 100%', description: 'Main background color' })}
                  {renderColorInput({ cssVar: '--foreground', name: 'Foreground', defaultValue: '222 47% 11%', description: 'Main text color' })}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
