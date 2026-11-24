import type { IForbiddenRuleType } from 'dependency-cruiser';
import { describe, expect, it } from 'vitest';
import { baseRules, frkDependencyCruiserConfig } from './dependency-cruiser.ts';
import { DEFAULT_LAYOUT } from './layout.ts';

const layerRule: IForbiddenRuleType = {
  name: 'core-not-to-ui',
  severity: 'error',
  from: { path: '^src/core' },
  to: { path: '^src/ui' },
};

describe('baseRules', () => {
  it('forbid cycles and unresolved imports in each module', () => {
    const parts = baseRules.map((rule): unknown[] => [rule.name, rule.severity, rule.from, rule.to]);
    expect(parts).toEqual([
      ['no-circular', 'error', {}, { circular: true }],
      ['no-unresolvable', 'error', {}, { couldNotResolve: true }],
    ]);
  });
});

describe('frkDependencyCruiserConfig', () => {
  it('resolves packages as Node.js and TypeScript do', () => {
    expect(frkDependencyCruiserConfig().options).toEqual({
      doNotFollow: { path: 'node_modules' },
      tsConfig: { fileName: 'tsconfig.json' },
      tsPreCompilationDeps: true,
      enhancedResolveOptions: {
        exportsFields: ['exports'],
        conditionNames: ['types', 'import', 'require', 'node', 'default'],
        mainFields: ['types', 'module', 'main'],
      },
    });
  });

  it('adds the layer rules after the base rules', () => {
    expect(frkDependencyCruiserConfig([layerRule]).forbidden).toEqual([...baseRules, layerRule]);
  });

  it('reads the tsconfig of the layout', () => {
    const layout = { ...DEFAULT_LAYOUT, tsconfigFile: 'tsconfig.app.json' };
    expect(frkDependencyCruiserConfig([], layout).options?.tsConfig).toEqual({
      fileName: 'tsconfig.app.json',
    });
  });
});
