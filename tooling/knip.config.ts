import type { KnipConfig } from 'knip';
import { TOOLS } from './src/commands/types.ts';

const config: KnipConfig = {
  // The CLI starts jscpd by its bin, which knip can't see. knip finds Stryker through its config.
  ignoreDependencies: [TOOLS.jscpd.packageName],
};

export default config;