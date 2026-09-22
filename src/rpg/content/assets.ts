import type Phaser from 'phaser';
import { assetUrl } from '../../shared/assetUrl';

export const terrainAssets = [
  'core_outdoor',
  'core_outdoor_nature',
  'core_outdoor_water',
  'grass',
  'core_buildings',
  'core_indoor_floors',
  'core_set pieces',
  'grass_background',
] as const;

export const characterSheets = [
  ['hero', 'player'],
  ['guide', 'mage'],
  ['nurse', 'nurse'],
  ['ranger', 'ranger'],
  ['merchant', 'merchant'],
  ['professor', 'grandpa'],
  ['mayor', 'mayor'],
  ['silver-guard', 'silver-guard'],
] as const;

export function preloadRpgAssets(scene: Phaser.Scene) {
  scene.load.image('forest-cave', assetUrl('environment/forest-cave-v1.png'));
  scene.load.image('cavern-materials', assetUrl('environment/cavern-materials-v1.png'));
  scene.load.image('forest-gate', assetUrl('environment/forest-gate-v1.png'));
  for (const name of terrainAssets) scene.load.image(name, assetUrl(`tuxemon/${name}.png`));
  for (const [key, file] of characterSheets) {
    scene.load.spritesheet(key, assetUrl(`characters-v2/walk-${file}.png`), { frameWidth: 48, frameHeight: 64 });
  }
}
