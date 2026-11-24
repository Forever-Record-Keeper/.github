import type {
  IConfiguration,
  IForbiddenRuleType,
  IRegularForbiddenRuleType,
} from 'dependency-cruiser';
import { DEFAULT_LAYOUT, type Layout } from './layout.ts';

/** The folder of installed packages, which the cruiser doesn't follow. */
const PACKAGES_DIR = 'node_modules';

/** How the cruiser resolves the `exports` field of packages, as Node.js and TypeScript do. */
const RESOLVE_OPTIONS = {
  exportsFields: ['exports'],
  conditionNames: ['types', 'import', 'require', 'node', 'default'],
  mainFields: ['types', 'module', 'main'],
};

/** The rules that every repo gets. A repo adds its own layer rules. */
export const baseRules: IRegularForbiddenRuleType[] = [
  {
    name: 'no-circular',
    comment: 'A module never depends on itself through other modules.',
    severity: 'error',
    from: {},
    to: { circular: true },
  },
  {
    name: 'no-unresolvable',
    comment: 'Each import resolves to a file or a package.',
    severity: 'error',
    from: {},
    to: { couldNotResolve: true },
  },
];

/** The shared dependency-cruiser config, with the layer rules of the repo. */
export function frkDependencyCruiserConfig(
  layerRules: readonly IForbiddenRuleType[] = [],
  layout: Layout = DEFAULT_LAYOUT,
): IConfiguration {
  return {
    forbidden: [...baseRules, ...layerRules],
    options: {
      doNotFollow: { path: PACKAGES_DIR },
      tsConfig: { fileName: layout.tsconfigFile },
      tsPreCompilationDeps: true,
      enhancedResolveOptions: RESOLVE_OPTIONS,
    },
  };
}
