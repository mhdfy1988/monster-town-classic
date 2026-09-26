import type { Save } from './model';

export interface GameLaunch {
  mode: 'new' | 'load';
  save: Save;
  activeSlot: number | null;
  qaPreset: string | null;
}

export interface GameRuntimeBoot extends GameLaunch {
  onReady: () => void;
  onReturnToTitle: () => void;
}
