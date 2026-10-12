import * as migration_20261012_162433_initial from './20261012_162433_initial';
import * as migration_20261012_163803_defaults_flag from './20261012_163803_defaults_flag';
import * as migration_20261012_195852_media_object_key from './20261012_195852_media_object_key';

export const migrations = [
  {
    up: migration_20261012_162433_initial.up,
    down: migration_20261012_162433_initial.down,
    name: '20261012_162433_initial',
  },
  {
    up: migration_20261012_163803_defaults_flag.up,
    down: migration_20261012_163803_defaults_flag.down,
    name: '20261012_163803_defaults_flag',
  },
  {
    up: migration_20261012_195852_media_object_key.up,
    down: migration_20261012_195852_media_object_key.down,
    name: '20261012_195852_media_object_key'
  },
];
