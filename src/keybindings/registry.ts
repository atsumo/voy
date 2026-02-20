import type { Mode } from "../state/types.ts";
import type { Dispatch } from "react";
import type { AppState, AppAction } from "../state/types.ts";
import type { VoyConfig } from "../config/config.ts";

export interface KeyAction {
  keys: string[];
  description: string;
  handler: (ctx: KeyActionContext) => void;
}

export interface KeyActionContext {
  state: AppState;
  dispatch: Dispatch<AppAction>;
  count: number;
  navigate: (path: string) => void;
  enterDirectory: () => void;
  parentDirectory: () => void;
  refresh: () => void;
  exit: () => void;
  config: VoyConfig;
  openEditor: (filePath: string, line?: number) => void;
  previewHeight: number;
}

export interface KeyBindingRegistry {
  bindings: Map<Mode, KeyAction[]>;
}

export function createRegistry(): KeyBindingRegistry {
  return { bindings: new Map() };
}

export function register(
  registry: KeyBindingRegistry,
  mode: Mode,
  action: KeyAction,
): void {
  const existing = registry.bindings.get(mode) ?? [];
  existing.push(action);
  registry.bindings.set(mode, existing);
}

export function findMatch(
  registry: KeyBindingRegistry,
  mode: Mode,
  keySequence: string[],
): { action: KeyAction; exact: boolean } | null {
  const bindings = registry.bindings.get(mode);
  if (!bindings) return null;

  let exactMatch: KeyAction | null = null;
  let partialMatch: KeyAction | null = null;

  for (const action of bindings) {
    if (arraysEqual(action.keys, keySequence)) {
      exactMatch = action;
    }
    // Check if current sequence is a prefix of some binding
    if (
      action.keys.length > keySequence.length &&
      arraysEqual(action.keys.slice(0, keySequence.length), keySequence)
    ) {
      partialMatch = action;
    }
  }

  // If there's a partial match, prefer waiting for more keys
  // The timeout handler will execute the exact match if no more keys come
  if (partialMatch) {
    return { action: exactMatch ?? partialMatch, exact: false };
  }

  if (exactMatch) {
    return { action: exactMatch, exact: true };
  }

  return null;
}

export function findExactMatch(
  registry: KeyBindingRegistry,
  mode: Mode,
  keySequence: string[],
): KeyAction | null {
  const bindings = registry.bindings.get(mode);
  if (!bindings) return null;

  for (const action of bindings) {
    if (arraysEqual(action.keys, keySequence)) {
      return action;
    }
  }

  return null;
}

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
