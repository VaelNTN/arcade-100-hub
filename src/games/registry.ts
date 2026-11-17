import { MiniGameDef } from '../types';
import { GROUP_01_HOPPERS } from './group01_hoppers';
import { GROUP_02_FIGHTERS } from './group02_fighters';
import { GROUP_03_SHOOTERS } from './group03_shooters';
import { GROUP_04_TIMING } from './group04_timing';
import { GROUP_05_CASUAL } from './group05_casual';
import { GROUP_06_DODGERS } from './group06_dodgers';
import { GROUP_07_PHYSICS } from './group07_physics';
import { GROUP_08_PUZZLES } from './group08_puzzles';
import { GROUP_09_RETRO } from './group09_retro';
import { GROUP_10_SPORTS } from './group10_sports';

export const ALL_GAMES: MiniGameDef[] = [
  ...GROUP_01_HOPPERS,
  ...GROUP_02_FIGHTERS,
  ...GROUP_03_SHOOTERS,
  ...GROUP_04_TIMING,
  ...GROUP_05_CASUAL,
  ...GROUP_06_DODGERS,
  ...GROUP_07_PHYSICS,
  ...GROUP_08_PUZZLES,
  ...GROUP_09_RETRO,
  ...GROUP_10_SPORTS,
];
