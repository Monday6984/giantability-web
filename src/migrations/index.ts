import * as migration_20261012_162433_initial from './20261012_162433_initial';

export const migrations = [
  {
    up: migration_20261012_162433_initial.up,
    down: migration_20261012_162433_initial.down,
    name: '20261012_162433_initial'
  },
];
