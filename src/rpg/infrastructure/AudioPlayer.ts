import { assetUrl } from '../../shared/assetUrl';

export type MusicTrackId = 'exploration' | 'battle';
export type SoundEffectId = 'capture-throw' | 'capture-shake' | 'capture-success' | 'hit-normal' | 'level-up';

export interface AudioPreferences {
  musicEnabled: boolean;
  sfxEnabled: boolean;
  musicVolume: number;
  sfxVolume: number;
}

type AudioFactory = (source: string) => HTMLAudioElement;
type AudioStorage = Pick<Storage, 'getItem' | 'setItem'>;

const STORAGE_KEY = 'pocket-grove-audio-v1';
const DEFAULT_PREFERENCES: AudioPreferences = {
  musicEnabled: true,
  sfxEnabled: true,
  musicVolume: 0.42,
  sfxVolume: 0.78,
};

const musicSources: Record<MusicTrackId, string> = {
  exploration: assetUrl('audio/music/greenbud-town-day-v1.ogg'),
  battle: assetUrl('audio/music/wild-battle-v1.ogg'),
};

const effectSources: Record<SoundEffectId, string> = {
  'capture-throw': assetUrl('audio/sfx/capture-throw-v1.wav'),
  'capture-shake': assetUrl('audio/sfx/capture-shake-v1.wav'),
  'capture-success': assetUrl('audio/sfx/capture-success-v1.wav'),
  'hit-normal': assetUrl('audio/sfx/hit-normal-v1.wav'),
  'level-up': assetUrl('audio/sfx/level-up-v1.wav'),
};

function clampVolume(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.min(1, Math.max(0, value))
    : fallback;
}

function readPreferences(storage?: AudioStorage): AudioPreferences {
  if (!storage) return { ...DEFAULT_PREFERENCES };
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PREFERENCES };
    const parsed = JSON.parse(raw) as Partial<AudioPreferences>;
    return {
      musicEnabled: typeof parsed.musicEnabled === 'boolean' ? parsed.musicEnabled : DEFAULT_PREFERENCES.musicEnabled,
      sfxEnabled: typeof parsed.sfxEnabled === 'boolean' ? parsed.sfxEnabled : DEFAULT_PREFERENCES.sfxEnabled,
      musicVolume: clampVolume(parsed.musicVolume, DEFAULT_PREFERENCES.musicVolume),
      sfxVolume: clampVolume(parsed.sfxVolume, DEFAULT_PREFERENCES.sfxVolume),
    };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

/** 音频基础设施：只负责播放、总线偏好和浏览器自动播放解锁，不包含场景规则。 */
export class AudioPlayer {
  private readonly storage?: AudioStorage;
  private readonly createAudio: AudioFactory;
  private preferencesValue: AudioPreferences;
  private context?: AudioContext;
  private currentMusic?: HTMLAudioElement;
  private currentTrack: MusicTrackId | null = null;
  private requestedTrack: MusicTrackId | null = null;
  private unlocked = false;

  constructor(
    storage: AudioStorage | undefined = typeof localStorage === 'undefined' ? undefined : localStorage,
    createAudio: AudioFactory = source => new Audio(source),
  ) {
    this.storage = storage;
    this.createAudio = createAudio;
    this.preferencesValue = readPreferences(storage);
  }

  get preferences(): Readonly<AudioPreferences> {
    return { ...this.preferencesValue };
  }

  unlock() {
    this.unlocked = true;
    if (this.requestedTrack && this.preferencesValue.musicEnabled) this.startRequestedMusic();
  }

  playMusic(track: MusicTrackId | null) {
    this.requestedTrack = track;
    if (!track || !this.preferencesValue.musicEnabled) {
      this.stopCurrentMusic();
      return;
    }
    if (this.unlocked) this.startRequestedMusic();
  }

  playSfx(effect: SoundEffectId) {
    if (!this.unlocked || !this.preferencesValue.sfxEnabled) return;
    const audio = this.createAudio(effectSources[effect]);
    audio.preload = 'auto';
    audio.volume = this.preferencesValue.sfxVolume;
    void audio.play().catch(() => undefined);
  }

  toggleMusic() {
    this.preferencesValue.musicEnabled = !this.preferencesValue.musicEnabled;
    this.persistPreferences();
    if (this.preferencesValue.musicEnabled) this.startRequestedMusic();
    else this.stopCurrentMusic();
    return this.preferencesValue.musicEnabled;
  }

  toggleSfx() {
    this.preferencesValue.sfxEnabled = !this.preferencesValue.sfxEnabled;
    this.persistPreferences();
    return this.preferencesValue.sfxEnabled;
  }

  setMusicVolume(value: number) {
    this.preferencesValue.musicVolume = clampVolume(value, DEFAULT_PREFERENCES.musicVolume);
    if (this.currentMusic) this.currentMusic.volume = this.preferencesValue.musicVolume;
    this.persistPreferences();
  }

  setSfxVolume(value: number) {
    this.preferencesValue.sfxVolume = clampVolume(value, DEFAULT_PREFERENCES.sfxVolume);
    this.persistPreferences();
  }

  suspend() {
    this.stopCurrentMusic();
    return this.context?.suspend();
  }

  /** 仅保留给界面确认与洞穴音阶；正式战斗反馈使用独立音效资源。 */
  beep(freq = 480) {
    if (!this.unlocked || !this.preferencesValue.sfxEnabled || typeof AudioContext === 'undefined') return;
    this.context ??= new AudioContext();
    void this.context.resume();
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = 'triangle';
    oscillator.frequency.value = freq;
    gain.gain.setValueAtTime(0.035 * this.preferencesValue.sfxVolume, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.14);
    oscillator.connect(gain);
    gain.connect(this.context.destination);
    oscillator.start();
    oscillator.stop(this.context.currentTime + 0.15);
  }

  private startRequestedMusic() {
    const track = this.requestedTrack;
    if (!track || !this.unlocked || !this.preferencesValue.musicEnabled) return;
    if (track === this.currentTrack && this.currentMusic) {
      if (this.currentMusic.paused) void this.currentMusic.play().catch(() => undefined);
      return;
    }
    this.stopCurrentMusic();
    const audio = this.createAudio(musicSources[track]);
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = this.preferencesValue.musicVolume;
    this.currentMusic = audio;
    this.currentTrack = track;
    void audio.play().catch(() => undefined);
  }

  private stopCurrentMusic() {
    if (this.currentMusic) {
      this.currentMusic.pause();
      this.currentMusic.currentTime = 0;
    }
    this.currentMusic = undefined;
    this.currentTrack = null;
  }

  private persistPreferences() {
    try {
      this.storage?.setItem(STORAGE_KEY, JSON.stringify(this.preferencesValue));
    } catch {
      // 声音偏好写入失败不应阻断游戏；本次会话中的设置仍然有效。
    }
  }
}
