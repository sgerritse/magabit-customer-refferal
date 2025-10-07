import { supabase } from '@/integrations/supabase/client';

interface DeviceInfo {
  browser: string;
  os: string;
  screenResolution: string;
  timezone: string;
  fingerprintHash: string;
}

// Generate a simple hash from a string
const simpleHash = async (str: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Detect browser
const getBrowser = (): string => {
  const ua = navigator.userAgent;
  if (ua.indexOf('Firefox') > -1) return 'Firefox';
  if (ua.indexOf('Chrome') > -1) return 'Chrome';
  if (ua.indexOf('Safari') > -1) return 'Safari';
  if (ua.indexOf('Edge') > -1) return 'Edge';
  return 'Unknown';
};

// Detect OS
const getOS = (): string => {
  const ua = navigator.userAgent;
  if (ua.indexOf('Win') > -1) return 'Windows';
  if (ua.indexOf('Mac') > -1) return 'MacOS';
  if (ua.indexOf('Linux') > -1) return 'Linux';
  if (ua.indexOf('Android') > -1) return 'Android';
  if (ua.indexOf('iOS') > -1) return 'iOS';
  return 'Unknown';
};

// Get screen resolution
const getScreenResolution = (): string => {
  return `${window.screen.width}x${window.screen.height}`;
};

// Get timezone
const getTimezone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

// Collect device fingerprint
export const collectDeviceFingerprint = async (): Promise<DeviceInfo> => {
  const browser = getBrowser();
  const os = getOS();
  const screenResolution = getScreenResolution();
  const timezone = getTimezone();
  
  // Generate hash from all collected data
  const fingerprintData = `${browser}|${os}|${screenResolution}|${timezone}`;
  const fingerprintHash = await simpleHash(fingerprintData);

  return {
    browser,
    os,
    screenResolution,
    timezone,
    fingerprintHash,
  };
};

// Log device fingerprint to database
export const logDeviceFingerprint = async (
  userId: string,
  sessionId: string,
  ipAddress?: string
): Promise<void> => {
  try {
    const deviceInfo = await collectDeviceFingerprint();

    // Get approximate location using browser API if available
    let geolocation = null;
    if (navigator.geolocation) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 5000,
            maximumAge: 600000,
          });
        });
        geolocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
      } catch {
        // Geolocation not available or denied
      }
    }

    await supabase.rpc('log_device_fingerprint', {
      p_user_id: userId,
      p_session_id: sessionId,
      p_fingerprint_hash: deviceInfo.fingerprintHash,
      p_browser: deviceInfo.browser,
      p_os: deviceInfo.os,
      p_screen_resolution: deviceInfo.screenResolution,
      p_timezone: deviceInfo.timezone,
      p_ip_address: ipAddress || null,
      p_geolocation: geolocation,
    });
  } catch (error) {
    console.error('Error logging device fingerprint:', error);
  }
};
