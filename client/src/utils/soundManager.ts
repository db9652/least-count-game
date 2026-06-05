class SoundManager {
  private audioCtx: AudioContext | null = null;
  private muted: boolean = false;
  private volume: number = 0.5;

  constructor() {
    if (typeof window !== 'undefined') {
      this.muted = localStorage.getItem('least_count_muted') === 'true';
      const savedVolume = localStorage.getItem('least_count_volume');
      this.volume = savedVolume !== null ? parseFloat(savedVolume) : 0.5;
    }
  }

  private initCtx(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }

    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    return this.audioCtx;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('least_count_muted', String(muted));
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    if (typeof window !== 'undefined') {
      localStorage.setItem('least_count_volume', String(this.volume));
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public play(effect: 'shuffle' | 'discard' | 'draw-deck' | 'draw-discard' | 'your-turn' | 'turn-change' | 'show-success' | 'show-fail' | 'chat' | 'join'): void {
    if (this.muted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    // Create a master volume gain node for this sound event
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(this.volume, ctx.currentTime);
    masterGain.connect(ctx.destination);

    switch (effect) {
      case 'discard':
        this.synthDiscard(ctx, masterGain);
        break;
      case 'draw-deck':
        this.synthDrawDeck(ctx, masterGain);
        break;
      case 'draw-discard':
        this.synthDrawDiscard(ctx, masterGain);
        break;
      case 'your-turn':
        this.synthYourTurn(ctx, masterGain);
        break;
      case 'turn-change':
        this.synthTurnChange(ctx, masterGain);
        break;
      case 'show-success':
        this.synthShowSuccess(ctx, masterGain);
        break;
      case 'show-fail':
        this.synthShowFail(ctx, masterGain);
        break;
      case 'chat':
        this.synthChat(ctx, masterGain);
        break;
      case 'join':
        this.synthJoin(ctx, masterGain);
        break;
      case 'shuffle':
        this.synthShuffle(ctx, masterGain);
        break;
    }
  }

  // Card Discard: friction/paper slide sound using a noise filter sweep
  private synthDiscard(ctx: AudioContext, destination: AudioNode): void {
    const duration = 0.15;
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    // Fill buffer with random noise
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.setValueAtTime(4, ctx.currentTime);
    filter.frequency.setValueAtTime(800, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + duration);
    
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.25, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    
    noiseSource.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(destination);
    
    noiseSource.start();
    noiseSource.stop(ctx.currentTime + duration);
  }

  // Draw Card (Deck): lighter, higher pitch slide
  private synthDrawDeck(ctx: AudioContext, destination: AudioNode): void {
    const duration = 0.2;
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.setValueAtTime(6, ctx.currentTime);
    filter.frequency.setValueAtTime(1200, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + duration);
    
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.18, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    
    noiseSource.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(destination);
    
    noiseSource.start();
    noiseSource.stop(ctx.currentTime + duration);
  }

  // Draw Card (Discard Pile): lower frequency slide
  private synthDrawDiscard(ctx: AudioContext, destination: AudioNode): void {
    const duration = 0.25;
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.setValueAtTime(3, ctx.currentTime);
    filter.frequency.setValueAtTime(600, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + duration);
    
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.28, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    
    noiseSource.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(destination);
    
    noiseSource.start();
    noiseSource.stop(ctx.currentTime + duration);
  }

  // Shuffling cards for Game Start
  private synthShuffle(ctx: AudioContext, destination: AudioNode): void {
    const cardCount = 6;
    const interval = 0.08;
    
    for (let i = 0; i < cardCount; i++) {
      const playTime = ctx.currentTime + i * interval;
      const duration = 0.12;
      const bufferSize = ctx.sampleRate * duration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      
      for (let j = 0; j < bufferSize; j++) {
        data[j] = Math.random() * 2 - 1;
      }
      
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = buffer;
      
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.Q.setValueAtTime(5, playTime);
      filter.frequency.setValueAtTime(900 - i * 50, playTime);
      filter.frequency.exponentialRampToValueAtTime(200, playTime + duration);
      
      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0.22, playTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, playTime + duration);
      
      noiseSource.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(destination);
      
      noiseSource.start(playTime);
      noiseSource.stop(playTime + duration);
    }
  }

  // Your Turn chime notification: dual frequency sine tones (E5 + A5)
  private synthYourTurn(ctx: AudioContext, destination: AudioNode): void {
    const duration = 0.45;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
    
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880.00, ctx.currentTime); // A5
    
    gainNode.gain.setValueAtTime(0.12, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.1);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    
    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(destination);
    
    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + duration);
    osc2.stop(ctx.currentTime + duration);
  }

  // Opponent turn change tick
  private synthTurnChange(ctx: AudioContext, destination: AudioNode): void {
    const duration = 0.08;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + duration);
    
    gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    
    osc.connect(gainNode);
    gainNode.connect(destination);
    
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  // Chat notification pop (ascending glide)
  private synthChat(ctx: AudioContext, destination: AudioNode): void {
    const duration = 0.12;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(500, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + duration);
    
    gainNode.gain.setValueAtTime(0.14, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    
    osc.connect(gainNode);
    gainNode.connect(destination);
    
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  // Player lobby joined warm pluck tone (E4 to B4)
  private synthJoin(ctx: AudioContext, destination: AudioNode): void {
    const duration = 0.35;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(329.63, ctx.currentTime); // E4
    osc.frequency.exponentialRampToValueAtTime(493.88, ctx.currentTime + 0.1); // B4
    
    gainNode.gain.setValueAtTime(0.16, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    
    osc.connect(gainNode);
    gainNode.connect(destination);
    
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  // Successful Show musical arpeggio (C5-E5-G5-C6)
  private synthShowSuccess(ctx: AudioContext, destination: AudioNode): void {
    const notes = [523.25, 659.25, 783.99, 1046.50];
    const noteDuration = 0.18;
    
    notes.forEach((freq, index) => {
      const playTime = ctx.currentTime + index * 0.08;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, playTime);
      
      gainNode.gain.setValueAtTime(0.12, playTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, playTime + noteDuration);
      
      osc.connect(gainNode);
      gainNode.connect(destination);
      
      osc.start(playTime);
      osc.stop(playTime + noteDuration);
    });
  }

  // Wrong Show buzzer: low frequency sawtooth warning buzz
  private synthShowFail(ctx: AudioContext, destination: AudioNode): void {
    const duration = 0.45;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, ctx.currentTime); // A2 low buzz
    osc.frequency.linearRampToValueAtTime(85, ctx.currentTime + duration);
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(350, ctx.currentTime);
    
    gainNode.gain.setValueAtTime(0.18, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.1);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    
    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(destination);
    
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }
}

export const soundManager = new SoundManager();
