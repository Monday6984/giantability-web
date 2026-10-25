import * as migration_20261012_162433_initial from './20261012_162433_initial';
import * as migration_20261012_163803_defaults_flag from './20261012_163803_defaults_flag';
import * as migration_20261012_195852_media_object_key from './20261012_195852_media_object_key';
import * as migration_20261012_214137_wordpress_import_fields from './20261012_214137_wordpress_import_fields';
import * as migration_20261018_213733_mailing_list_and_ads from './20261018_213733_mailing_list_and_ads';
import * as migration_20261022_081059_contact_details from './20261022_081059_contact_details';
import * as migration_20261023_230644_simple_partner_page from './20261023_230644_simple_partner_page';
import * as migration_20261025_160403_giantability_tv from './20261025_160403_giantability_tv';
import * as migration_20261025_163430_old_view_counts from './20261025_163430_old_view_counts';

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
    name: '20261012_195852_media_object_key',
  },
  {
    up: migration_20261012_214137_wordpress_import_fields.up,
    down: migration_20261012_214137_wordpress_import_fields.down,
    name: '20261012_214137_wordpress_import_fields',
  },
  {
    up: migration_20261018_213733_mailing_list_and_ads.up,
    down: migration_20261018_213733_mailing_list_and_ads.down,
    name: '20261018_213733_mailing_list_and_ads',
  },
  {
    up: migration_20261022_081059_contact_details.up,
    down: migration_20261022_081059_contact_details.down,
    name: '20261022_081059_contact_details',
  },
  {
    up: migration_20261023_230644_simple_partner_page.up,
    down: migration_20261023_230644_simple_partner_page.down,
    name: '20261023_230644_simple_partner_page',
  },
  {
    up: migration_20261025_160403_giantability_tv.up,
    down: migration_20261025_160403_giantability_tv.down,
    name: '20261025_160403_giantability_tv',
  },
  {
    up: migration_20261025_163430_old_view_counts.up,
    down: migration_20261025_163430_old_view_counts.down,
    name: '20261025_163430_old_view_counts'
  },
];
