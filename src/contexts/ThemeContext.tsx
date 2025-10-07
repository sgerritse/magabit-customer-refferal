import React, { createContext, useContext, useEffect } from "react";
import { useThemeSettings } from "@/hooks/useThemeSettings";
import { LoadingWidget, mapSettingsToProps } from "@/components/ui/loading-widget";

const ThemeContext = createContext<{
  isLoading: boolean;
}>({
  isLoading: true,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { settings, isLoading } = useThemeSettings();

  // Apply theme settings to CSS variables whenever they change
  useEffect(() => {
    if (!settings || (!settings.light_theme && !settings.dark_theme)) return;

    const applyTheme = () => {
      const isDark = document.documentElement.classList.contains("dark");
      const themeVars = isDark ? settings.dark_theme : settings.light_theme;

      // Only apply if we have theme variables
      if (themeVars && Object.keys(themeVars).length > 0) {
        Object.entries(themeVars).forEach(([key, value]) => {
          document.documentElement.style.setProperty(key, value);
        });
      }
    };

    applyTheme();

    // Watch for theme changes (light/dark mode toggle)
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "class") {
          applyTheme();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, [settings]);

  // Show loading screen while theme loads to prevent FOUC
  if (isLoading) {
    return (
      <LoadingWidget 
        {...mapSettingsToProps(settings?.loading_widget_settings)}
        loadingText="Loading theme..." 
      />
    );
  }

  return (
    <ThemeContext.Provider value={{ isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
