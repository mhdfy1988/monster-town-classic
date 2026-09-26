import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from './config';
import { RpgScene } from './RpgScene';
import type { GameRuntimeBoot } from './runtimeContract';

export function createGameRuntime(parent: string, boot: GameRuntimeBoot) {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: '#182f36',
    pixelArt: true,
    antialias: false,
    roundPixels: true,
    render: { antialias: false, pixelArt: true, roundPixels: true },
    scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [new RpgScene(boot)],
  });
}
