import { useState, useEffect, useRef } from 'react';
import { Mic, Square, Play, Pause, RotateCcw, X, Settings } from 'lucide-react';
import { Button } from './button';
import { AudioRecorder } from '@/utils/audioRecorder';
import { useMediaPreferences } from '@/hooks/useMediaPreferences';

interface AudioRecorderProps {
  onRecordingComplete: (audioFile: File | null) => void;
  pointsAwarded?: number;
}

export function AudioRecorderComponent({ onRecordingComplete, pointsAwarded = 5 }: AudioRecorderProps) {
  const { preferences, updateMicrophonePreference, isLoading: prefsLoading } = useMediaPreferences();
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableMicrophones, setAvailableMicrophones] = useState<MediaDeviceInfo[]>([]);
  const [activeDeviceId, setActiveDeviceId] = useState<string>('');
  const [showMicSelector, setShowMicSelector] = useState(false);

  const recorderRef = useRef<AudioRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (recorderRef.current) {
        recorderRef.current.cleanup();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  useEffect(() => {
    // Load preferred microphone from database
    if (!prefsLoading && preferences.preferredMicrophoneId) {
      setActiveDeviceId(preferences.preferredMicrophoneId);
    }
  }, [preferences, prefsLoading]);

  const enumerateMicrophones = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const mics = devices.filter(device => device.kind === 'audioinput');
      setAvailableMicrophones(mics);
    } catch (err) {
      console.error('Error enumerating microphones:', err);
    }
  };

  const startRecording = async (deviceId?: string) => {
    try {
      setError(null);
      const recorder = new AudioRecorder();
      const useDeviceId = deviceId || activeDeviceId;
      await recorder.initialize(useDeviceId || undefined);
      recorderRef.current = recorder;

      // Enumerate microphones
      await enumerateMicrophones();

      // Set active device ID
      if (recorder.stream && recorder.stream.getAudioTracks()[0]) {
        const settings = recorder.stream.getAudioTracks()[0].getSettings();
        if (settings.deviceId) {
          const deviceId = settings.deviceId as string;
          setActiveDeviceId(deviceId);
          await updateMicrophonePreference(deviceId);
        }
      }

      recorder.start(() => {
        // Auto-stop callback when max duration reached
        stopRecording();
      });

      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        if (recorderRef.current) {
          setRecordingTime(Math.floor(recorderRef.current.getRecordingDuration() / 1000));
        }
      }, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start recording');
      console.error('Recording error:', err);
    }
  };

  const stopRecording = async () => {
    if (recorderRef.current) {
      const blob = await recorderRef.current.stopAsync();
      if (blob) {
        setAudioBlob(blob);
        const mime = blob.type || 'audio/webm';
        const ext = mime.includes('wav') ? 'wav' : mime.includes('ogg') ? 'ogg' : mime.includes('mp4') ? 'm4a' : 'webm';
        const audioFile = recorderRef.current.blobToFile(blob, `recording-${Date.now()}.${ext}`);
        onRecordingComplete(audioFile);
      }
      recorderRef.current.cleanup();
      recorderRef.current = null;
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setIsRecording(false);
    setIsPaused(false);
  };

  const togglePause = () => {
    if (recorderRef.current) {
      if (isPaused) {
        // Resume recording and timer
        recorderRef.current.resume();
        setIsPaused(false);
        
        // Restart the timer
        timerRef.current = setInterval(() => {
          if (recorderRef.current) {
            setRecordingTime(Math.floor(recorderRef.current.getRecordingDuration() / 1000));
          }
        }, 100);
      } else {
        // Pause recording and timer
        recorderRef.current.pause();
        setIsPaused(true);
        
        // Stop the timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }
    }
  };

  const handleMicSelect = async (deviceId: string) => {
    // Stop current recording
    if (recorderRef.current) {
      recorderRef.current.cleanup();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // Restart with selected microphone
    await startRecording(deviceId);
    setShowMicSelector(false);
  };

  const playRecording = () => {
    if (audioBlob && audioRef.current) {
      if (audioBlob.size === 0) {
        setError('Recording is empty. Please re-record.');
        return;
      }

      const audioEl = audioRef.current;
      audioEl.onended = () => setIsPlaying(false);
      audioEl.volume = 1.0;
      
      // Handle playback errors
      audioEl.onerror = () => {
        setError('Unable to play this audio. Your browser may not support this format.');
        setIsPlaying(false);
      };

      if (isPlaying) {
        audioEl.pause();
        setIsPlaying(false);
      } else {
        if (!audioEl.src || audioEl.src === '') {
          const url = URL.createObjectURL(audioBlob);
          objectUrlRef.current = url;
          audioEl.src = url;
        }
        audioEl.currentTime = 0;
        audioEl.load();
        audioEl.play().catch(() => {
          setError('Unable to play this audio. Your browser may not support this format.');
          setIsPlaying(false);
        });
        setIsPlaying(true);
      }
    }
  };

  const resetRecording = () => {
    const el = audioRef.current;
    if (el) {
      // Remove handlers first to avoid stale error callbacks firing during cleanup
      el.onerror = null;
      el.onended = null;
      try { el.pause(); } catch {}
      // Clear the source and fully reset the media element
      el.removeAttribute('src');
      el.load();
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setAudioBlob(null);
    setRecordingTime(0);
    setIsPlaying(false);
    setError(null);
  };

  const reRecord = () => {
    resetRecording();
    setError(null);
    onRecordingComplete(null);
  };

  const removeRecording = () => {
    resetRecording();
    setError(null);
    onRecordingComplete(null); // Clear the recording in parent
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const maxSeconds = 5 * 60; // 5 minutes
  const progressPercentage = (recordingTime / maxSeconds) * 100;

  return (
    <div className="space-y-4">
      <audio ref={audioRef} className="hidden" />
      
      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
          {error}
        </div>
      )}

      {!audioBlob && !isRecording && (
        <div className="text-center space-y-3">
          <Mic className="w-8 h-8 mx-auto mb-2" style={{ color: 'hsl(var(--submission-icon-color))' }} />
          <p className="text-sm text-muted-foreground mb-2" style={{ color: 'hsl(var(--submission-label-text))' }}>
            Click to start recording<br />(max 5 minutes)
          </p>
          
          {prefsLoading && (
            <div className="text-sm text-muted-foreground">
              Loading microphone preferences...
            </div>
          )}
          
          {!prefsLoading && (
            <div className="flex gap-1.5 justify-center items-center flex-wrap">
              <Button
                type="button"
                onClick={() => startRecording(preferences.preferredMicrophoneId || undefined)}
                variant="outline"
                className="px-2"
                style={{
                  borderColor: 'hsl(var(--submission-secondary-btn-border))',
                  color: 'hsl(var(--submission-secondary-btn-text))',
                  backgroundColor: 'hsl(var(--submission-secondary-btn-bg))'
                }}
              >
                <Mic className="w-4 h-4" style={{ marginRight: '2px' }} />
                Record Audio
              </Button>
              <Button
                type="button"
                onClick={async () => {
                  await enumerateMicrophones();
                  setShowMicSelector(!showMicSelector);
                }}
                variant="outline"
                size="sm"
                title="Microphone Settings"
                className="px-2"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Inline microphone selector panel */}
          {showMicSelector && availableMicrophones.length > 0 && (
            <div className="w-full mt-2">
              <div className="bg-popover text-popover-foreground border border-border rounded-md shadow p-2">
                <div className="max-h-[300px] overflow-auto">
                  {availableMicrophones.map((mic, index) => {
                    const isSelected = mic.deviceId === activeDeviceId;
                    return (
                      <button
                        key={mic.deviceId}
                        type="button"
                        onClick={async () => {
                          setActiveDeviceId(mic.deviceId);
                          await updateMicrophonePreference(mic.deviceId);
                          setShowMicSelector(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded transition-colors text-sm ${
                          isSelected 
                            ? 'bg-accent text-accent-foreground font-medium' 
                            : 'hover:bg-muted'
                        }`}
                      >
                        {mic.label || `Microphone ${index + 1}`}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {isRecording && (
        <div className="text-center space-y-4">
          <div className="relative">
            <Mic className={`w-12 h-12 mx-auto mb-2 ${isPaused ? 'text-orange-500' : 'text-red-500 animate-pulse'}`} />
            {!isPaused && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full border-4 border-red-500 animate-ping opacity-20" />
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <p className="text-2xl font-bold text-card-foreground">
              {formatTime(recordingTime)} / {formatTime(maxSeconds)}
            </p>
            
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-accent h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            <p className="text-sm text-muted-foreground">
              {isPaused ? 'Recording paused' : 'Recording in progress...'}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex gap-1.5 justify-center flex-wrap">
              <Button
                type="button"
                onClick={() => setShowMicSelector(!showMicSelector)}
                variant="outline"
                size="sm"
                title="Microphone Settings"
                className="px-2"
              >
                <Settings className="w-4 h-4" />
              </Button>
              
              <Button
                type="button"
                onClick={togglePause}
                variant="outline"
                size="sm"
                className="px-2"
              >
                {isPaused ? (
                  <>
                    <Mic className="w-4 h-4" style={{ marginRight: '2px' }} />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause className="w-4 h-4" style={{ marginRight: '2px' }} />
                    Pause
                  </>
                )}
              </Button>
              <Button
                type="button"
                onClick={stopRecording}
                variant="destructive"
                size="sm"
                className="px-2"
              >
                <Square className="w-4 h-4" style={{ marginRight: '2px' }} />
                Stop
              </Button>
            </div>

            {/* Inline microphone selector panel */}
            {showMicSelector && availableMicrophones.length > 1 && (
              <div className="w-full mt-2">
                <div className="bg-popover text-popover-foreground border border-border rounded-md shadow p-2">
                  <div className="max-h-[300px] overflow-auto">
                    {availableMicrophones.map((mic, index) => {
                      const isSelected = mic.deviceId === activeDeviceId;
                      return (
                        <button
                          key={mic.deviceId}
                          type="button"
                        onClick={async () => {
                          await handleMicSelect(mic.deviceId);
                          setActiveDeviceId(mic.deviceId);
                          await updateMicrophonePreference(mic.deviceId);
                        }}
                          className={`w-full text-left px-3 py-2 rounded transition-colors text-sm ${
                            isSelected 
                              ? 'bg-accent text-accent-foreground font-medium' 
                              : 'hover:bg-muted'
                          }`}
                        >
                          {mic.label || `Microphone ${index + 1}`}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {audioBlob && !isRecording && (
        <div className="text-center space-y-3">
          <Mic className="w-12 h-12 mx-auto mb-2 text-green-600" />
          <p className="text-sm text-green-600 font-medium">
            ✓ Recording complete ({formatTime(recordingTime)})
          </p>
          
          <div className="flex gap-2 justify-center flex-wrap">
            <Button
              type="button"
              onClick={playRecording}
              variant="outline"
              size="sm"
            >
              {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
            <Button
              type="button"
              onClick={reRecord}
              variant="outline"
              size="sm"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Re-record
            </Button>
            <Button
              type="button"
              onClick={removeRecording}
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700"
            >
              <X className="w-4 h-4 mr-2" />
              Remove
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
