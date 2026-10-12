import * as migration_20261012_162433_initial from './20261012_162433_initial';
import * as migration_20261012_163803_defaults_flag from './20261012_163803_defaults_flag';

export const migrations = [
  {
    up: migration_20261012_162433_initial.up,
    down: migration_20261012_162433_initial.down,
    name: '20261012_162433_initial',
  },
  {
    up: migration_20261012_163803_defaults_flag.up,
    down: migration_20261012_163803_defaults_flag.down,
    name: '20261012_163803_defaults_flag'
  },
];
