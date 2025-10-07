import { useState, useRef, useEffect } from 'react';
import { Button } from './button';
import { Camera, SwitchCamera, Trash2, Upload, X, Settings } from 'lucide-react';
import { useMediaPreferences } from '@/hooks/useMediaPreferences';

interface PhotoCaptureProps {
  onPhotoComplete: (file: File | null) => void;
}

export const PhotoCaptureComponent = ({ onPhotoComplete }: PhotoCaptureProps) => {
  const { preferences, updateCameraPreference, isLoading: prefsLoading } = useMediaPreferences();
  const [isCapturing, setIsCapturing] = useState(false);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isCameraCapture, setIsCameraCapture] = useState(false);
  const [isLoadingCamera, setIsLoadingCamera] = useState(false);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [activeDeviceId, setActiveDeviceId] = useState<string | null>(null);
  const [showCameraSelector, setShowCameraSelector] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    // Load preferred camera from database
    if (!prefsLoading && preferences.preferredCameraId) {
      setActiveDeviceId(preferences.preferredCameraId);
    }
  }, [preferences, prefsLoading]);

  const startCamera = async (mode?: 'user' | 'environment', deviceIdOverride?: string) => {
    try {
      setError(null);
      setIsLoadingCamera(true);
      console.log('[PhotoCapture] Starting camera with mode/device:', mode || facingMode, deviceIdOverride || activeDeviceId);
      
      const cameraMode = mode || facingMode;
      
      // Stop any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      let stream: MediaStream | null = null;

      // Try with preferred deviceId first if provided
      const preferredId = deviceIdOverride || activeDeviceId;
      if (preferredId) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = devices.filter(d => d.kind === 'videoinput');
          const deviceExists = videoDevices.some(d => d.deviceId === preferredId);
          
          if (deviceExists) {
            console.log('[PhotoCapture] Trying preferred camera:', preferredId);
            stream = await navigator.mediaDevices.getUserMedia({
              video: { deviceId: { exact: preferredId } },
              audio: false
            });
          }
        } catch (err) {
          console.log('[PhotoCapture] Preferred camera failed, falling back to facingMode:', err);
        }
      }

      // Fallback to facingMode if deviceId failed or wasn't provided
      if (!stream) {
        console.log('[PhotoCapture] Starting with facingMode:', cameraMode);
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: cameraMode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false
        });
      }
      
      console.log('[PhotoCapture] Camera stream obtained:', stream.getVideoTracks().length, 'tracks');
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        // Wait for video to be ready
        await new Promise<void>((resolve, reject) => {
          const v = videoRef.current!;
          let resolved = false;

          const onCanPlay = () => {
            if (resolved) return;
            resolved = true;
            v.removeEventListener('canplay', onCanPlay);
            console.log('[PhotoCapture] Video can play', v.videoWidth, v.videoHeight);
            resolve();
          };

          v.addEventListener('canplay', onCanPlay, { once: true });

          // Fallback: poll dimensions
          const start = Date.now();
          const poll = () => {
            if (!videoRef.current) return;
            if (videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0) {
              if (!resolved) {
                resolved = true;
                videoRef.current.removeEventListener('canplay', onCanPlay as any);
                resolve();
              }
              return;
            }
            if (Date.now() - start > 5000) {
              if (!resolved) {
                resolved = true;
                videoRef.current.removeEventListener('canplay', onCanPlay as any);
                reject(new Error('Camera timeout'));
              }
              return;
            }
            requestAnimationFrame(poll);
          };
          poll();
        });

        // Now play the video
        try {
          await videoRef.current.play();
          console.log('[PhotoCapture] Video playing');
        } catch (playError) {
          console.error('[PhotoCapture] Play error:', playError);
          await new Promise(resolve => setTimeout(resolve, 150));
          await videoRef.current.play();
        }
      }

      setIsCapturing(true);
      setIsLoadingCamera(false);
      console.log('[PhotoCapture] Camera ready');

      // Update device info
      try {
        const track = stream.getVideoTracks()[0];
        const settings = track.getSettings();
        if (settings.deviceId) {
          const deviceId = settings.deviceId as string;
          setActiveDeviceId(deviceId);
          await updateCameraPreference(deviceId);
        }
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cams = devices.filter(d => d.kind === 'videoinput');
        setAvailableCameras(cams);
        console.log('[PhotoCapture] Cameras available:', cams.length);
      } catch (e) {
        console.warn('[PhotoCapture] enumerateDevices failed:', e);
      }
    } catch (err) {
      console.error('[PhotoCapture] Error starting camera:', err);
      const msg = err instanceof Error ? err.message : 'Failed to access camera';
      setError(msg.includes('Permission') ? 'Camera permission denied' : msg);
      setIsLoadingCamera(false);
      setIsCapturing(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCapturing(false);
  };

  const capturePhoto = async () => {
    if (!videoRef.current) return;

    try {
      const video = videoRef.current;

      // Ensure the video has dimensions
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        console.warn('[PhotoCapture] Camera not ready, retrying play...');
        try { await video.play(); } catch {}
        await new Promise(res => setTimeout(res, 200));
      }

      if (video.videoWidth === 0 || video.videoHeight === 0) {
        setError('Camera not ready yet. Please wait a second and try again.');
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setError('Failed to capture photo');
        return;
      }

      ctx.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        const finalize = (b: Blob | null) => {
          if (b) {
            setPhotoBlob(b);
            setIsCameraCapture(true);
            const fileName = `photo_${Date.now()}.jpg`;
            const file = new File([b], fileName, { type: 'image/jpeg' });
            onPhotoComplete(file);
            const url = URL.createObjectURL(b);
            setPreviewUrl(url);
            stopCamera();
          } else {
            setError('Failed to create photo');
          }
        };

        if (blob) {
          finalize(blob);
        } else {
          // Safari fallback when toBlob returns null
          try {
            const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
            const byteString = atob(dataUrl.split(',')[1]);
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
            finalize(new Blob([ia], { type: 'image/jpeg' }));
          } catch (e) {
            console.error('[PhotoCapture] Fallback toDataURL failed', e);
            finalize(null);
          }
        }
      }, 'image/jpeg', 0.9);
    } catch (err) {
      console.error('[PhotoCapture] Error capturing photo:', err);
      setError('Failed to capture photo');
    }
  };

  const switchCamera = async () => {
    if (!isCapturing) {
      console.log('[PhotoCapture] Cannot switch camera - not capturing');
      return;
    }

    try {
      setIsLoadingCamera(true);
      setError(null);

      // If we have multiple cameras, rotate through them
      if (availableCameras.length > 1) {
        const currentIndex = availableCameras.findIndex(d => d.deviceId === activeDeviceId);
        const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % availableCameras.length : 1;
        const nextDevice = availableCameras[nextIndex];
        console.log('[PhotoCapture] Switching to device:', nextDevice?.label || nextDevice?.deviceId);
        await startCamera(undefined, nextDevice.deviceId);
        setActiveDeviceId(nextDevice.deviceId);
        await updateCameraPreference(nextDevice.deviceId);
      } else {
        // Fallback: toggle facingMode
        const newMode = facingMode === 'user' ? 'environment' : 'user';
        setFacingMode(newMode);
        await startCamera(newMode);
      }
    } catch (err) {
      console.error('[PhotoCapture] Error switching camera:', err);
      setError('Failed to switch camera');
    } finally {
      setIsLoadingCamera(false);
    }
  };

  const handleCameraSelect = async (deviceId: string) => {
    await startCamera(undefined, deviceId);
    setShowCameraSelector(false);
  };

  const retakePhoto = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setPhotoBlob(null);
    setError(null);
    setIsCameraCapture(false);
    onPhotoComplete(null);
    startCamera();
  };

  const removePhoto = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setPhotoBlob(null);
    setError(null);
    setIsCameraCapture(false);
    onPhotoComplete(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setError(null);
      setIsCameraCapture(false);
      onPhotoComplete(file);
      
      // Create preview
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setPhotoBlob(file);
    }
  };

  const cancelCapture = () => {
    stopCamera();
    setError(null);
  };

  // Check if camera is supported
  const isSupported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

  // Initial state - show both options
  if (!isCapturing && !photoBlob) {
    return (
      <div className="space-y-3">
        <Camera className="w-8 h-8 mx-auto mb-2" style={{ color: 'hsl(var(--submission-icon-color))' }} />
        <p className="text-sm text-muted-foreground mb-2" style={{ color: 'hsl(var(--submission-label-text))' }}>
          Take or upload your photo
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
            onClick={() => startCamera(undefined, preferences.preferredCameraId || undefined)}
            className="w-full"
            style={{
              borderColor: 'hsl(var(--submission-primary-btn-border))',
              color: 'hsl(var(--submission-primary-btn-text))',
              backgroundColor: 'hsl(var(--submission-primary-btn-bg))'
            }}
          >
            <Camera className="w-4 h-4 mr-2" />
            Take Photo
          </Button>
        )}
        
        <label htmlFor="photo-file-upload" className="block">
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
            onClick={() => document.getElementById('photo-file-upload')?.click()}
          >
            <Upload className="w-4 h-4 mr-2" />
            Choose Image
          </Button>
        </label>
        <input
          id="photo-file-upload"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />
        
        {!isSupported && (
          <p className="text-xs text-amber-600">
            Camera not supported. Please upload an image file.
          </p>
        )}
        
        {error && (
          <p className="text-xs text-red-600">{error}</p>
        )}
      </div>
    );
  }

  // Camera active state
  if (isCapturing) {
    return (
      <div className="space-y-3">
        {/* Live preview */}
        <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
          {isLoadingCamera && (
            <div className="absolute inset-0 flex items-center justify-center bg-black">
              <div className="text-white text-sm">Loading camera...</div>
            </div>
          )}
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        </div>

        {/* Controls */}
        <div className="px-4 pb-2 space-y-2">
          <div className="flex gap-1.5 justify-center items-center flex-wrap">
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
              onClick={cancelCapture}
              className="px-2 order-3 md:order-4"
            >
              <X className="w-4 h-4" />
            </Button>
            
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={capturePhoto}
              className="bg-accent hover:bg-accent/90 px-2 order-4 md:order-3"
            >
              <Camera className="w-4 h-4" style={{ marginRight: '2px' }} />
              Capture
            </Button>
          </div>

          {/* Inline camera selector panel */}
          {showCameraSelector && availableCameras.length > 1 && (
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

  // Photo captured state
  return (
    <div className="space-y-2">
      {/* Preview */}
      {previewUrl && (
        <div className="relative bg-black rounded-lg overflow-hidden">
          <img
            src={previewUrl}
            alt="Captured photo"
            className="w-full h-auto object-contain"
          />
        </div>
      )}

      <div className="flex gap-1.5">
        {isCameraCapture && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={retakePhoto}
            className="flex-1 text-xs px-2"
          >
            <Camera className="w-3 h-3 mr-1" />
            Retake
          </Button>
        )}
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={removePhoto}
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
