import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface MediaPreferences {
  preferredCameraId: string | null;
  preferredMicrophoneId: string | null;
}

export const useMediaPreferences = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<MediaPreferences>({
    preferredCameraId: null,
    preferredMicrophoneId: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load preferences from database only
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_media_preferences')
          .select('preferred_camera_id, preferred_microphone_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading media preferences:', error);
        }

        if (data) {
          setPreferences({
            preferredCameraId: data.preferred_camera_id,
            preferredMicrophoneId: data.preferred_microphone_id,
          });
        }
      } catch (error) {
        console.error('Error loading media preferences:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, [user]);

  // Update camera preference
  const updateCameraPreference = async (cameraId: string) => {
    if (!user) return;

    // Update state immediately for responsive UI
    setPreferences(prev => ({ ...prev, preferredCameraId: cameraId }));

    // Save to database
    try {
      const { error } = await supabase
        .from('user_media_preferences')
        .upsert({
          user_id: user.id,
          preferred_camera_id: cameraId,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error updating camera preference:', error);
      }
    } catch (error) {
      console.error('Error updating camera preference:', error);
    }
  };

  // Update microphone preference
  const updateMicrophonePreference = async (microphoneId: string) => {
    if (!user) return;

    // Update state immediately for responsive UI
    setPreferences(prev => ({ ...prev, preferredMicrophoneId: microphoneId }));

    // Save to database
    try {
      const { error } = await supabase
        .from('user_media_preferences')
        .upsert({
          user_id: user.id,
          preferred_microphone_id: microphoneId,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error updating microphone preference:', error);
      }
    } catch (error) {
      console.error('Error updating microphone preference:', error);
    }
  };

  return {
    preferences,
    isLoading,
    updateCameraPreference,
    updateMicrophonePreference,
  };
};
