# Turbopack vs Webpack Evaluation (Next.js 16.4.4)

**Date:** 2024-11-04  
**Goal:** Evaluate if Turbopack (default in Next 16) can replace custom webpack config without regression.

---

## Baseline: Webpack (Custom Config with splitChunks)

| Metric                 | Value                       |
| ---------------------- | --------------------------- |
| Total chunks           | 200                         |
| Initial (eager) chunks | 148                         |
| Lazy chunks            | 52                          |
| **Eager gzip total**   | **1,140.8 KB**              |
| Lazy gzip total        | 392.3 KB                    |
| **Total gzip**         | **~1,533 KB**               |
| Vendors chunk          | **25.6 KB gzip** ✅         |
| Algorithm chunks       | Multiple ✅                 |
| Shared chunk           | None (correctly removed) ✅ |

Key optimizations preserved:

- `vendors` cacheGroup: extracts node_modules libs (crypto-js, pdfjs-dist, etc.) into dedicated chunk
- `algorithm` cacheGroup: isolates algorithm module code
- No `shared` chunk (previously caused lazy-loading regression)

---

## Turbopack (Default Next 16, No Custom Config)

| Metric                   | Value                      |
| ------------------------ | -------------------------- |
| Total chunks             | 139                        |
| **Total gzip**           | **1,975 KB**               |
| Chunk naming             | Hashed (no semantic names) |
| Vendors/Algorithm chunks | **Not present**            |
| Largest single chunk     | 233 KB gzip                |

### Key Differences

| Aspect               | Webpack   | Turbopack    | Delta    |
| -------------------- | --------- | ------------ | -------- |
| Total gzip           | ~1,533 KB | 1,975 KB     | **+29%** |
| Chunk count          | 200       | 139          | -30%     |
| Vendor chunk         | 25.6 KB   | ❌ Missing   | -        |
| Algorithm chunks     | Multiple  | ❌ Missing   | -        |
| Semantic chunk names | Yes       | No (hashed)  | -        |
| Build time           | Baseline  | ~30% faster* | +        |

*Subjective observation during build runs

---

## Verification Results (Both Builds)

| Check                 | Webpack | Turbopack             |
| --------------------- | ------- | --------------------- |
| TypeScript (0 errors) | ✅      | ✅                    |
| Tests (978 passed)    | ✅      | ✅                    |
| Build success         | ✅      | ✅                    |
| Bundle analyzer       | ✅      | ❌ (webpack-specific) |

---

## Decision: **Stay with Webpack (`next build --webpack`)**

### Rationale

1. **Bundle size regression**: +29% total gzip without manual splitChunks optimization
2. **Loss of vendor/algorithm chunks**: These were carefully tuned to isolate heavy node_modules and algorithm code, preventing them from bloating route chunks
3. **No `experimental.turbopackChunking` equivalent**: The experimental option is explicitly "not recommended for production" per Next.js docs
4. **No bundle analyzer support**: `@next/bundle-analyzer` uses `webpack-bundle-analyzer`, incompatible with Turbopack
5. **Conservative path aligns with previous decision**: We explicitly chose Option A (keep webpack) to preserve lazy-loading optimization

### When to Re-evaluate

- When `experimental.turbopackChunking` stabilizes and provides equivalent cacheGroup control
- When a Turbopack-compatible bundle analyzer becomes available
- When bundle size difference narrows significantly

---

## Files Changed During Evaluation (Reverted)

- `package.json`: `build` script restored to `next build --webpack`
- `next.config.mjs`: Removed `turbopack` config block, kept `webpack` config

---

## Conclusion

The evaluation confirms our conservative path was correct. The custom webpack config with `splitChunks.cacheGroups` provides measurable bundle size benefits that Turbopack cannot currently replicate. We will continue using `next build --webpack` until Turbopack offers equivalent chunk control.

---

## Re-evaluation #2 (2026-11-12, Next.js 16.4.4)

**Verdict: unchanged — stay with webpack.** The gap narrowed but Turbopack still loses on every dimension that matters to us.

| Metric                 | Webpack (baseline) | Turbopack (2024 eval) | Turbopack (now, 16.4.4) |
| ---------------------- | ------------------ | --------------------- | ----------------------- |
| Total gzip             | **1,533 KB**       | 1,975 KB              | 1,754.9 KB              |
| Chunk count            | 200                | 139                   | 141                     |
| Vendor chunk (25.6 KB) | ✅                 | ❌                    | ❌ still missing        |
| Algorithm chunks       | ✅ multiple        | ❌                    | ❌ still missing        |
| Semantic chunk names   | ✅                 | ❌ hashed             | ❌ hashed (flat dir)    |

- Turbopack improved ~11% vs the 2024 measurement (1,975 → 1,755 KB gzip), but is still **+14.5%** over webpack.
- `turbopackChunking` / cacheGroup-equivalent control: still not available in stable Next 16.4.4; `@next/bundle-analyzer` still webpack-only.
- Re-measured with `npx next build --turbopack` (exit 0), chunks gzipped individually from `.next/static`.
- Next re-check trigger: a stable Turbopack chunking config API, or a Turbopack-compatible bundle analyzer.
