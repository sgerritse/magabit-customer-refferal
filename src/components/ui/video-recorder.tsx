import { useState, useRef, useEffect } from 'react';
import { Button } from './button';
import { VideoRecorder } from '@/utils/videoRecorder';
import { Video, StopCircle, PauseCircle, PlayCircle, Trash2, Upload, SwitchCamera, Camera, Settings, X } from 'lucide-react';
import { useMediaPreferences } from '@/hooks/useMediaPreferences';

interface VideoRecorderProps {
  onRecordingComplete: (file: File | null) => void;
  pointsAwarded?: number;
}

export const VideoRecorderComponent = ({ onRecordingComplete, pointsAwarded }: VideoRecorderProps) => {
  const { preferences, updateCameraPreference, isLoading: prefsLoading } = useMediaPreferences();
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [activeDeviceId, setActiveDeviceId] = useState<string>('');
  const [showCameraSelector, setShowCameraSelector] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);

  const recorderRef = useRef<VideoRecorder | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const previewRef = useRef<HTMLVideoElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const MAX_DURATION = 300; // 5 minutes

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (recorderRef.current) {
        recorderRef.current.cleanup();
      }
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    // Load preferred camera from database
    if (!prefsLoading && preferences.preferredCameraId) {
      setActiveDeviceId(preferences.preferredCameraId);
    }
  }, [preferences, prefsLoading]);

  const enumerateCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter(device => device.kind === 'videoinput');
      setAvailableCameras(cameras);
    } catch (err) {
      console.error('Error enumerating cameras:', err);
    }
  };

  const setupCamera = async (deviceId?: string) => {
    try {
      setError(null);
      const recorder = new VideoRecorder();
      recorderRef.current = recorder;

      const useDeviceId = deviceId || activeDeviceId;
      const stream = await recorder.startRecording('user', useDeviceId || undefined);
      streamRef.current = stream;

      // Show live preview
      if (previewRef.current) {
        previewRef.current.srcObject = stream;
        previewRef.current.play();
      }

      // Enumerate cameras
      await enumerateCameras();

      // Set active device ID and save to DB
      if (stream.getVideoTracks()[0]) {
        const settings = stream.getVideoTracks()[0].getSettings();
        if (settings.deviceId) {
          const deviceId = settings.deviceId;
          setActiveDeviceId(deviceId);
          await updateCameraPreference(deviceId);
        }
      }

      setIsCameraReady(true);
    } catch (err) {
      console.error('Error setting up camera:', err);
      setError(err instanceof Error ? err.message : 'Failed to access camera');
    }
  };

  const startRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);

    // Start timer
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => {
        const newTime = prev + 1;
        if (newTime >= MAX_DURATION) {
          stopRecording();
        }
        return newTime;
      });
    }, 1000);
  };

  const stopRecording = async () => {
    if (!recorderRef.current) return;

    try {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      const blob = await recorderRef.current.stopRecording();
      setVideoBlob(blob);
      setIsRecording(false);
      setIsPaused(false);
      setIsCameraReady(false);

      // Stop preview stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (previewRef.current) {
        previewRef.current.srcObject = null;
      }

      // Create video file
      const fileName = `recording_${Date.now()}.webm`;
      const file = new File([blob], fileName, { type: blob.type });
      onRecordingComplete(file);

      // Create preview URL
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (err) {
      console.error('Error stopping recording:', err);
      setError('Failed to save recording');
    }
  };

  const cancelCamera = () => {
    if (recorderRef.current) {
      recorderRef.current.cleanup();
      recorderRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (previewRef.current) {
      previewRef.current.srcObject = null;
    }
    setIsCameraReady(false);
    setError(null);
  };

  const togglePause = () => {
    if (!recorderRef.current) return;

    if (isPaused) {
      recorderRef.current.resume();
      if (timerRef.current === null) {
        timerRef.current = setInterval(() => {
          setRecordingTime(prev => {
            const newTime = prev + 1;
            if (newTime >= MAX_DURATION) {
              stopRecording();
            }
            return newTime;
          });
        }, 1000);
      }
    } else {
      recorderRef.current.pause();
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    setIsPaused(!isPaused);
  };

  const switchCamera = async () => {
    if (availableCameras.length <= 1) return;

    try {
      const currentIndex = availableCameras.findIndex(cam => cam.deviceId === activeDeviceId);
      const nextIndex = (currentIndex + 1) % availableCameras.length;
      const nextCamera = availableCameras[nextIndex];
      
      // Stop current stream
      if (recorderRef.current) {
        recorderRef.current.cleanup();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      // Restart with new camera
      await setupCamera(nextCamera.deviceId);
      if (isRecording) {
        startRecording();
      }
    } catch (err) {
      console.error('Error switching camera:', err);
      setError('Failed to switch camera');
    }
  };

  const handleCameraSelect = async (deviceId: string) => {
    // Stop current stream
    if (recorderRef.current) {
      recorderRef.current.cleanup();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // Restart with selected camera
    await setupCamera(deviceId);
    setShowCameraSelector(false);
    if (isRecording) {
      startRecording();
    }
  };

  const playRecording = () => {
    if (!videoRef.current || !videoBlob) return;

    const videoEl = videoRef.current;
    videoEl.onended = () => setIsPlaying(false);
    
    // Handle playback errors
    videoEl.onerror = () => {
      setError('Unable to play this video. Your browser may not support this format.');
      setIsPlaying(false);
    };

    if (isPlaying) {
      videoEl.pause();
      setIsPlaying(false);
    } else {
      if (!videoEl.src || videoEl.src === '') {
        const url = URL.createObjectURL(videoBlob);
        videoEl.src = url;
      }
      videoEl.currentTime = 0;
      videoEl.play().catch(() => {
        setError('Unable to play this video. Your browser may not support this format.');
        setIsPlaying(false);
      });
      setIsPlaying(true);
    }
  };

  const resetRecording = () => {
    const el = videoRef.current;
    if (el) {
      // Remove handlers first to avoid stale error callbacks firing during cleanup
      el.onerror = null;
      el.onended = null;
      try { el.pause(); } catch {}
      // Clear the source and fully reset the media element
      el.removeAttribute('src');
      el.load();
    }
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setVideoBlob(null);
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
    onRecordingComplete(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setError(null); // Clear any previous errors
      onRecordingComplete(file);
      
      // Create preview
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setVideoBlob(file);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Check if video recording is supported
  const isSupported = VideoRecorder.isSupported();

  // Initial state - show both options
  if (!isCameraReady && !videoBlob) {
    return (
      <div className="space-y-3">
        <Video className="w-8 h-8 mx-auto mb-2" style={{ color: 'hsl(var(--submission-icon-color))' }} />
        <p className="text-sm text-muted-foreground mb-2" style={{ color: 'hsl(var(--submission-label-text))' }}>
          Record or upload your video
        </p>
        
        {prefsLoading && (
          <div className="text-sm text-muted-foreground">
            Loading camera preferences...
          </div>
        )}
        
        {isSupported && !prefsLoading && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setupCamera(preferences.preferredCameraId || undefined)}
            className="w-full"
            style={{
              borderColor: 'hsl(var(--submission-primary-btn-border))',
              color: 'hsl(var(--submission-primary-btn-text))',
              backgroundColor: 'hsl(var(--submission-primary-btn-bg))'
            }}
          >
            <Camera className="w-4 h-4 mr-2" />
            Record Video
          </Button>
        )}
        
        <label htmlFor="video-file-upload" className="block">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            style={{
              borderColor: 'hsl(var(--submission-secondary-btn-border))',
              color: 'hsl(var(--submission-secondary-btn-text))',
              backgroundColor: 'hsl(var(--submission-secondary-btn-bg))'
            }}
            onClick={() => document.getElementById('video-file-upload')?.click()}
          >
            <Upload className="w-4 h-4 mr-2" />
            Choose Video
          </Button>
        </label>
        <input
          id="video-file-upload"
          type="file"
          accept="video/*"
          className="hidden"
          onChange={handleFileUpload}
        />
        
        {!isSupported && (
          <p className="text-xs text-amber-600">
            Video recording not supported. Please upload a video file.
          </p>
        )}
        
        {error && (
          <p className="text-xs text-red-600">{error}</p>
        )}
      </div>
    );
  }

  // Camera ready or recording state
  if (isCameraReady) {
    return (
      <div className="space-y-3">
        {/* Live preview */}
        <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
          <video
            ref={previewRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          
          {/* Recording indicator - only show when actually recording */}
          {isRecording && (
            <>
              <div className="absolute top-2 left-2 flex items-center gap-2 bg-red-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                {isPaused ? 'PAUSED' : 'REC'}
              </div>
              
              {/* Timer */}
              <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-sm font-mono">
                {formatTime(recordingTime)} / {formatTime(MAX_DURATION)}
              </div>
            </>
          )}
        </div>

        {/* Controls */}
        <div className="px-4 pb-2 space-y-2">
          <div className="flex gap-1.5 justify-center items-center flex-wrap">
            {!isRecording && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={switchCamera}
                  title="Switch Camera"
                  disabled={availableCameras.length <= 1}
                  className="px-2 order-1"
                >
                  <SwitchCamera className="w-4 h-4" />
                </Button>
                
                {availableCameras.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCameraSelector(!showCameraSelector)}
                    title="Camera Settings"
                    className="px-2 order-2"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                )}
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={cancelCamera}
                  className="px-2 order-3 md:order-4"
                >
                  <X className="w-4 h-4" />
                </Button>
                
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={startRecording}
                  className="bg-accent hover:bg-accent/90 px-2 order-4 md:order-3"
                >
                  <Camera className="w-4 h-4" style={{ marginRight: '2px' }} />
                  Start Recording
                </Button>
              </>
            )}

            {isRecording && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={togglePause}
                  className="px-2"
                >
                  {isPaused ? (
                    <><PlayCircle className="w-4 h-4" style={{ marginRight: '2px' }} /> Resume</>
                  ) : (
                    <><PauseCircle className="w-4 h-4" style={{ marginRight: '2px' }} /> Pause</>
                  )}
                </Button>
                
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={stopRecording}
                  className="px-2"
                >
                  <StopCircle className="w-4 h-4" style={{ marginRight: '2px' }} />
                  Stop
                </Button>
              </>
            )}
          </div>

          {/* Inline camera selector panel - only show when not recording */}
          {!isRecording && showCameraSelector && availableCameras.length > 1 && (
            <div className="w-full mt-2">
              <div className="bg-popover text-popover-foreground border border-border rounded-md shadow p-2">
                <div className="max-h-[300px] overflow-auto">
                  {availableCameras.map((camera, index) => {
                    const isSelected = camera.deviceId === activeDeviceId;
                    return (
                      <button
                        key={camera.deviceId}
                        type="button"
                        onClick={async () => {
                          await handleCameraSelect(camera.deviceId);
                          setActiveDeviceId(camera.deviceId);
                          await updateCameraPreference(camera.deviceId);
                        }}
                        className={`w-full text-left px-3 py-2 rounded transition-colors text-sm ${
                          isSelected 
                            ? 'bg-accent text-accent-foreground font-medium' 
                            : 'hover:bg-muted'
                        }`}
                      >
                        {camera.label || `Camera ${index + 1}`}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {error && (
          <p className="text-xs text-red-600">{error}</p>
        )}
      </div>
    );
  }

  // Completed state
  return (
    <div className="space-y-2">
      {/* Preview thumbnail */}
      {previewUrl && (
        <div className="relative bg-black rounded-lg overflow-hidden aspect-video max-w-full">
          <video
            ref={videoRef}
            src={previewUrl}
            className="w-full h-full object-cover"
            playsInline
          />
        </div>
      )}

      <div className="flex gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={playRecording}
          className="flex-1 text-xs px-2"
        >
          {isPlaying ? (
            <><PauseCircle className="w-3 h-3 mr-1" /> Pause</>
          ) : (
            <><PlayCircle className="w-3 h-3 mr-1" /> Play</>
          )}
        </Button>
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={reRecord}
          className="text-xs px-2"
        >
          Re-record
        </Button>
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={removeRecording}
          className="text-red-600 hover:text-red-700 text-xs px-2"
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>

      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
};
