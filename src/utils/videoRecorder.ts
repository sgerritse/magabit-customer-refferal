/**
 * VideoRecorder Utility Class
 * Handles video + audio recording with camera switching support
 */
export class VideoRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private videoChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private chosenMimeType: string = '';
  private currentFacingMode: 'user' | 'environment' = 'user';

  /**
   * Get the best supported video MIME type
   */
  private static getSupportedMimeType(): string {
    const types = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4',
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return 'video/webm'; // fallback
  }

  /**
   * Start recording video with audio
   */
  async startRecording(facingMode: 'user' | 'environment' = 'user', deviceId?: string): Promise<MediaStream> {
    try {
      this.currentFacingMode = facingMode;
      let stream: MediaStream | null = null;

      // Try with preferred deviceId first if provided
      if (deviceId) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = devices.filter(d => d.kind === 'videoinput');
          const deviceExists = videoDevices.some(d => d.deviceId === deviceId);
          
          if (deviceExists) {
            console.log('[VideoRecorder] Trying preferred camera:', deviceId);
            stream = await navigator.mediaDevices.getUserMedia({
              video: {
                deviceId: { exact: deviceId },
                width: { ideal: 1280 },
                height: { ideal: 720 }
              },
              audio: {
                echoCancellation: true,
                noiseSuppression: true,
                sampleRate: 44100
              }
            });
          }
        } catch (err) {
          console.log('[VideoRecorder] Preferred camera failed, falling back to facingMode:', err);
        }
      }

      // Fallback to facingMode if deviceId failed or wasn't provided
      if (!stream) {
        console.log('[VideoRecorder] Starting with facingMode:', facingMode);
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: facingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 44100
          }
        });
      }

      this.stream = stream;
      this.chosenMimeType = VideoRecorder.getSupportedMimeType();
      this.videoChunks = [];

      // Create MediaRecorder with optimized settings
      const options: MediaRecorderOptions = {
        mimeType: this.chosenMimeType,
        videoBitsPerSecond: 2500000,
        audioBitsPerSecond: 128000
      };

      this.mediaRecorder = new MediaRecorder(this.stream, options);

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.videoChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(100);

      return this.stream;
    } catch (error) {
      console.error('Error starting video recording:', error);
      throw new Error('Could not access camera or microphone. Please check permissions.');
    }
  }

  /**
   * Switch camera (front/rear)
   */
  async switchCamera(): Promise<MediaStream> {
    const newFacingMode = this.currentFacingMode === 'user' ? 'environment' : 'user';
    
    // Stop current stream
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }

    // Start new stream with different camera
    return this.startRecording(newFacingMode);
  }

  /**
   * Pause recording
   */
  pause(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause();
    }
  }

  /**
   * Resume recording
   */
  resume(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume();
    }
  }

  /**
   * Stop recording and return the video blob
   */
  async stopRecording(): Promise<Blob> {
    if (!this.mediaRecorder) {
      throw new Error('No recording in progress');
    }

    return new Promise((resolve, reject) => {
      const recorder = this.mediaRecorder!;
      
      const handleStop = () => {
        recorder.removeEventListener('stop', handleStop);
        const firstType = this.videoChunks[0]?.type;
        const mimeType = firstType || recorder.mimeType || this.chosenMimeType || 'video/webm';
        const blob = new Blob(this.videoChunks, { type: mimeType });
        resolve(blob);
      };

      recorder.addEventListener('stop', handleStop);
      
      try {
        recorder.stop();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.mediaRecorder = null;
    this.videoChunks = [];
  }

  /**
   * Check if video recording is supported
   */
  static isSupported(): boolean {
    return !!(
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia &&
      typeof MediaRecorder !== 'undefined'
    );
  }

  /**
   * Get current recording state
   */
  getState(): 'inactive' | 'recording' | 'paused' | undefined {
    return this.mediaRecorder?.state;
  }

  /**
   * Get current camera facing mode
   */
  getFacingMode(): 'user' | 'environment' {
    return this.currentFacingMode;
  }
}
