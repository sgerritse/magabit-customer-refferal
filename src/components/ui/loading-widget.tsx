import React from "react";
import { LoadingWidgetSettings } from "@/hooks/useThemeSettings";

export interface LoadingWidgetProps {
  logoUrl?: string;
  logoSize?: number;
  bgColor?: string;
  textColor?: string;
  spinnerColor?: string;
  loadingText?: string;
}

// Helper function to convert database snake_case to React camelCase
const mapSettingsToProps = (settings?: Partial<LoadingWidgetSettings>): LoadingWidgetProps => {
  if (!settings) return {};
  return {
    logoUrl: settings.logo_url,
    logoSize: settings.logo_size,
    bgColor: settings.bg_color,
    textColor: settings.text_color,
    spinnerColor: settings.spinner_color,
    loadingText: settings.loading_text,
  };
};

export const LoadingWidget: React.FC<LoadingWidgetProps> = ({
  logoUrl = "/dadderup-logo-white.png",
  logoSize = 64,
  bgColor = "hsl(var(--background))",
  textColor = "hsl(var(--foreground))",
  spinnerColor = "hsl(var(--primary))",
  loadingText = "Loading...",
}) => {
  return (
    <div 
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: bgColor }}
    >
      <div className="text-center">
        <img
          src={logoUrl}
          alt="Loading"
          className="mx-auto mb-4 animate-flip-horizontal"
          style={{ 
            width: `${logoSize}px`, 
            height: 'auto',
            filter: `drop-shadow(0 0 8px ${spinnerColor})`
          }}
        />
        <p style={{ color: textColor }} className="text-sm">
          {loadingText}
        </p>
      </div>
    </div>
  );
};

// Export helper for external use
export { mapSettingsToProps };

