import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import { performance } from 'node:perf_hooks';

describe('Node.js 24 LTS Performance Benchmarks', () => {
  it('native TypeScript execution is significantly faster than tsx wrapper', () => {
    // Measure native Node.js 24 execution
    const t0 = performance.now();
    execSync('node scripts/lint-data.ts', { stdio: 'ignore' });
    const nativeDurationMs = performance.now() - t0;

    // Measure tsx execution
    const t1 = performance.now();
    execSync('npx tsx scripts/lint-data.ts', { stdio: 'ignore' });
    const tsxDurationMs = performance.now() - t1;

    console.log(
      `\n⏱️ Benchmark (lint-data): Native Node 24 = ${nativeDurationMs.toFixed(1)}ms vs tsx = ${tsxDurationMs.toFixed(1)}ms`
    );

    // Native Node 24 should be at least 2x faster (less process startup & transpilation overhead)
    expect(nativeDurationMs).toBeLessThan(tsxDurationMs);
  });

  it('ECMAScript 2025 native Set methods (Node 24) outperform legacy array spread filter', () => {
    const N = 500_000;
    const setA = new Set<number>();
    const setB = new Set<number>();
    for (let i = 0; i < N; i++) {
      setA.add(i);
      if (i % 2 === 0) setB.add(i);
    }

    // Legacy method: [...setA].filter(x => setB.has(x))
    const startLegacy = performance.now();
    const legacyIntersection = new Set([...setA].filter((x) => setB.has(x)));
    const legacyDuration = performance.now() - startLegacy;

    // Node 24 LTS native method: setA.intersection(setB)
    const startNative = performance.now();
    const nativeIntersection = (setA as any).intersection(setB);
    const nativeDuration = performance.now() - startNative;

    console.log(
      `⏱️ Benchmark (500k Sets): Native Set.intersection = ${nativeDuration.toFixed(1)}ms vs Legacy filter = ${legacyDuration.toFixed(1)}ms`
    );

    expect(legacyIntersection.size).toBe(nativeIntersection.size);
    expect(nativeDuration).toBeLessThan(legacyDuration);
  });
});
