# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Three-pane TUI file manager with Vim-style keybindings. Layout inspired by Yazi but keybindings differ. Bun + Ink 6 (React 19) + TypeScript strict mode.

## Commands

```bash
bun install           # Install deps
bun run start         # Run
bun run dev           # Run with --watch
bun test              # Run all tests (bun:test)
bun run build         # Bundle to dist/voy.js
bun run build:compile # Standalone binary ./voy
```

## Architecture

Entry: `src/index.tsx` → fullscreen-ink → `App` → `AppProvider` (React Context + useReducer) → hooks + ThreePaneLayout

State: Context + useReducer (`src/state/`). Two contexts: `AppStateContext` (state) / `AppDispatchContext` (dispatch). Reducer in `reducer.ts`, types in `types.ts`.

Modes: `normal` | `visual` | `command` | `search` | `prompt` | `preview`

Keybindings (`src/keybindings/`): Parser → Registry (per-mode, multi-key sequences with timeout, numeric prefix) → Definitions

Layout: ParentPane (20%) | CurrentPane (45%) | PreviewPane (35%) + StatusBar + CommandLine

Tests: `src/__tests__/` using `bun:test`. Covers reducer, keybindings, fs operations, formatting utils.
