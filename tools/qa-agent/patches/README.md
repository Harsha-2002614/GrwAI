# Verified fix experiments (2026-09-29 run)

Apply from the app repo root (`~/grwai`):

```bash
cp qa-agent/patches/01-babel.config.js babel.config.js          # GRW-01 web boot (import.meta polyfill) — web only
git apply qa-agent/patches/02-face-intro.patch                   # GRW-06 guard native-only Image.resolveAssetSource — web only
git apply qa-agent/patches/02-body-intro.patch
git apply qa-agent/patches/03-tabs-layout.patch                  # GRW-04 tab-bar label clipping — affects native too; verify on device
```

Each was applied in an isolated working copy, re-tested with the full journey suite (101 assertions) and produced the same 13 product findings before and after — i.e. no regressions.
