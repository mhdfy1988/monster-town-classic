import { describe, expect, it } from 'vitest';
import { AudioPlayer } from './AudioPlayer';

function memoryStorage(initial?: string) {
  const values = new Map<string, string>();
  if (initial) values.set('pocket-grove-audio-v1', initial);
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    value: () => values.get('pocket-grove-audio-v1'),
  };
}

function audioFactory() {
  const created: Array<HTMLAudioElement & { playCount: number; pauseCount: number; source: string }> = [];
  const factory = (source: string) => {
    let paused = true;
    const audio = {
      source,
      loop: false,
      preload: '',
      volume: 1,
      currentTime: 0,
      playCount: 0,
      pauseCount: 0,
      get paused() { return paused; },
      play: () => { paused = false; audio.playCount += 1; return Promise.resolve(); },
      pause: () => { paused = true; audio.pauseCount += 1; },
    } as unknown as HTMLAudioElement & { playCount: number; pauseCount: number; source: string };
    created.push(audio);
    return audio;
  };
  return { created, factory };
}

describe('音频总线', () => {
  it('浏览器解锁前只记录期望曲目，解锁后循环播放并可切换战斗音乐', () => {
    const sounds = audioFactory();
    const player = new AudioPlayer(memoryStorage(), sounds.factory);
    player.playMusic('exploration');
    expect(sounds.created).toHaveLength(0);

    player.unlock();
    expect(sounds.created).toHaveLength(1);
    expect(sounds.created[0].source).toContain('greenbud-town-day-v1.ogg');
    expect(sounds.created[0].loop).toBe(true);
    expect(sounds.created[0].volume).toBe(0.42);

    player.playMusic('battle');
    expect(sounds.created[0].pauseCount).toBe(1);
    expect(sounds.created[1].source).toContain('wild-battle-v1.ogg');
  });

  it('音乐与音效开关、音量分别持久化，关闭音效后不创建播放实例', () => {
    const storage = memoryStorage(JSON.stringify({ musicEnabled: false, sfxEnabled: true, musicVolume: 2, sfxVolume: -1 }));
    const sounds = audioFactory();
    const player = new AudioPlayer(storage, sounds.factory);
    expect(player.preferences).toEqual({ musicEnabled: false, sfxEnabled: true, musicVolume: 1, sfxVolume: 0 });

    player.unlock();
    player.playSfx('hit-normal');
    expect(sounds.created[0].volume).toBe(0);
    expect(player.toggleSfx()).toBe(false);
    player.playSfx('level-up');
    expect(sounds.created).toHaveLength(1);

    player.setMusicVolume(0.35);
    player.setSfxVolume(0.65);
    expect(JSON.parse(storage.value()!)).toMatchObject({ musicEnabled: false, sfxEnabled: false, musicVolume: 0.35, sfxVolume: 0.65 });
  });
});
