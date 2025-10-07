export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  public stream: MediaStream | null = null;
  private startTime: number = 0;
  private pausedTime: number = 0;
  private pauseStartTime: number = 0;
  private maxDuration: number = 5 * 60 * 1000; // 5 minutes in milliseconds
  private timeoutId: NodeJS.Timeout | null = null;
  private chosenMimeType: string = '';

  async initialize(deviceId?: string): Promise<void> {
    try {
      let stream: MediaStream | null = null;

      // Try with preferred deviceId first
      if (deviceId) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const audioDevices = devices.filter(d => d.kind === 'audioinput');
          const deviceExists = audioDevices.some(d => d.deviceId === deviceId);
          
          if (deviceExists) {
            console.log('[AudioRecorder] Trying preferred microphone:', deviceId);
            stream = await navigator.mediaDevices.getUserMedia({
              audio: { deviceId: { exact: deviceId } }
            });
          }
        } catch (err) {
          console.log('[AudioRecorder] Preferred microphone failed, using default:', err);
        }
      }

      // Fallback to default audio device
      if (!stream) {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      this.stream = stream;
      
      const mimeType = this.getSupportedMimeType();
      this.chosenMimeType = mimeType;
      
      const options: MediaRecorderOptions = mimeType
        ? { mimeType, audioBitsPerSecond: 128000 }
        : { audioBitsPerSecond: 128000 };
      
      this.mediaRecorder = new MediaRecorder(this.stream, options);

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };
    } catch (error) {
      console.error('Failed to initialize audio recorder:', error);
      throw new Error('Microphone access denied or not available');
    }
  }

  private getSupportedMimeType(): string {
    const ua = navigator.userAgent;
    const isSafari = /safari/i.test(ua) && !/chrome|crios|android/i.test(ua);

    const safariFirst = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/wav'];
    const webmFirst = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4', 'audio/wav'];

    const types = isSafari ? safariFirst : webmFirst;

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return '';
  }

  start(onStop?: () => void): void {
    if (!this.mediaRecorder) {
      throw new Error('Recorder not initialized');
    }

    this.audioChunks = [];
    this.startTime = Date.now();
    this.pausedTime = 0;
    this.pauseStartTime = 0;
    this.mediaRecorder.start();

    // Auto-stop after max duration
    this.timeoutId = setTimeout(() => {
      this.stop();
      if (onStop) onStop();
    }, this.maxDuration);
  }

  stop(): Blob | null {
    if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
      return null;
    }

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    this.mediaRecorder.stop();
    
    const firstType = this.audioChunks[0]?.type;
    const mimeType = firstType || this.mediaRecorder.mimeType || this.chosenMimeType || 'audio/webm';
    const blob = new Blob(this.audioChunks, { type: mimeType });
    
    return blob;
  }

  // Preferred: await the final data before returning the blob
  async stopAsync(): Promise<Blob | null> {
    if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
      return null;
    }

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    return new Promise<Blob | null>((resolve) => {
      const recorder = this.mediaRecorder!;
      const handleStop = () => {
        recorder.removeEventListener('stop', handleStop);
        const firstType = this.audioChunks[0]?.type;
        const mimeType = firstType || recorder.mimeType || this.chosenMimeType || 'audio/webm';
        const blob = new Blob(this.audioChunks, { type: mimeType });
        resolve(blob);
      };
      recorder.addEventListener('stop', handleStop);
      recorder.stop();
    });
  }

  pause(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause();
      this.pauseStartTime = Date.now();
    }
  }

  resume(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume();
      // Accumulate the time spent in pause
      if (this.pauseStartTime > 0) {
        this.pausedTime += Date.now() - this.pauseStartTime;
        this.pauseStartTime = 0;
      }
    }
  }

  getRecordingDuration(): number {
    if (this.startTime === 0) return 0;
    
    let currentPausedTime = this.pausedTime;
    // If currently paused, add the current pause duration
    if (this.pauseStartTime > 0) {
      currentPausedTime += Date.now() - this.pauseStartTime;
    }
    
    return Date.now() - this.startTime - currentPausedTime;
  }

  getRemainingTime(): number {
    const duration = this.getRecordingDuration();
    return Math.max(0, this.maxDuration - duration);
  }

  cleanup(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }

    this.audioChunks = [];
    this.mediaRecorder = null;
    this.stream = null;
    this.startTime = 0;
    this.pausedTime = 0;
    this.pauseStartTime = 0;
  }

  blobToFile(blob: Blob, filename: string): File {
    return new File([blob], filename, { 
      type: blob.type,
      lastModified: Date.now(),
    });
  }
}
