export type SoundType = 
  | 'click' 
  | 'win' 
  | 'lose' 
  | 'notification' 
  | 'bet' 
  | 'takeoff' 
  | 'crash' 
  | 'spin' 
  | 'scatter' 
  | 'joker' 
  | 'cascade' 
  | 'hit' 
  | 'out';

const SOUND_URLS: Record<SoundType, string> = {
  click: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3', // Crisp click
  win: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3', // Big casino win
  lose: 'https://assets.mixkit.co/active_storage/sfx/3148/3148-preview.mp3', // Soft thud / buzzer
  notification: 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3', // Gentle chime
  bet: 'https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3', // Casino chip placement
  takeoff: 'https://assets.mixkit.co/active_storage/sfx/1084/1084-preview.mp3', // Plane takeoff
  crash: 'https://assets.mixkit.co/active_storage/sfx/1071/1071-preview.mp3', // Explosion
  spin: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3', // Slot spin rolling
  scatter: 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3', // Heavy scatter impact
  joker: 'https://assets.mixkit.co/active_storage/sfx/2020/2020-preview.mp3', // Magical sparkle
  cascade: 'https://assets.mixkit.co/active_storage/sfx/2004/2004-preview.mp3', // Cascade drop
  hit: 'https://assets.mixkit.co/active_storage/sfx/2143/2143-preview.mp3', // Bat hit / crack
  out: 'https://assets.mixkit.co/active_storage/sfx/3147/3147-preview.mp3' // Crowd groan / out
};

class AudioManager {
  private audios: Record<string, HTMLAudioElement[]> = {};
  private MAX_INSTANCES = 5;
  private isMuted: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      // Preload one instance of each
      Object.entries(SOUND_URLS).forEach(([key, url]) => {
        this.audios[key] = [new Audio(url)];
      });
    }
  }

  public setMute(mute: boolean) {
    this.isMuted = mute;
    if (mute) {
      this.stopAll();
    }
  }

  public toggleMute() {
    this.setMute(!this.isMuted);
    return this.isMuted;
  }

  public play(type: SoundType, volume: number = 0.5) {
    if (this.isMuted || typeof window === 'undefined') return;

    try {
      const pool = this.audios[type];
      if (!pool) return;

      // Find first available idle audio instance
      let audio = pool.find(a => a.paused || a.ended);

      if (!audio) {
        if (pool.length < this.MAX_INSTANCES) {
          audio = new Audio(SOUND_URLS[type]);
          pool.push(audio);
        } else {
          // Force restart the oldest one if pool is full
          audio = pool[0];
          audio.currentTime = 0;
        }
      }

      audio.volume = volume;
      audio.currentTime = 0;
      audio.play().catch(() => {
        // Autoplay policy might block it
      });
    } catch (e) {
      // Ignore audio errors
    }
  }

  public stopAll() {
    Object.values(this.audios).forEach(pool => {
      pool.forEach(audio => {
        try {
          audio.pause();
          audio.currentTime = 0;
        } catch(e) {}
      });
    });
  }
}

export const soundManager = new AudioManager();
