import type { Mode } from "../state/types.ts";
import type { Dispatch } from "react";
import type { AppState, AppAction } from "../state/types.ts";

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

  for (const action of bindings) {
    if (arraysEqual(action.keys, keySequence)) {
      return { action, exact: true };
    }
    // Check if current sequence is a prefix of some binding
    if (
      action.keys.length > keySequence.length &&
      arraysEqual(action.keys.slice(0, keySequence.length), keySequence)
    ) {
      return { action, exact: false };
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
