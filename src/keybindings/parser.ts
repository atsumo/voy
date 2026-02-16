import type { Key } from "ink";

export interface ParsedInput {
  key: string;
  ctrl: boolean;
  shift: boolean;
  meta: boolean;
}

export interface KeyBuffer {
  keys: string[];
  count: string;
  timeout: ReturnType<typeof setTimeout> | null;
}

export function parseInput(input: string, key: Key): ParsedInput {
  // Special keys
  if (key.upArrow) return { key: "up", ctrl: key.ctrl, shift: key.shift, meta: key.meta };
  if (key.downArrow) return { key: "down", ctrl: key.ctrl, shift: key.shift, meta: key.meta };
  if (key.leftArrow) return { key: "left", ctrl: key.ctrl, shift: key.shift, meta: key.meta };
  if (key.rightArrow) return { key: "right", ctrl: key.ctrl, shift: key.shift, meta: key.meta };
  if (key.return) return { key: "return", ctrl: key.ctrl, shift: key.shift, meta: key.meta };
  if (key.escape) return { key: "escape", ctrl: false, shift: false, meta: false };
  if (key.backspace) return { key: "backspace", ctrl: key.ctrl, shift: key.shift, meta: key.meta };
  if (key.delete) return { key: "delete", ctrl: key.ctrl, shift: key.shift, meta: key.meta };
  if (key.tab) return { key: "tab", ctrl: key.ctrl, shift: key.shift, meta: key.meta };
  if (key.pageUp) return { key: "pageup", ctrl: key.ctrl, shift: key.shift, meta: key.meta };
  if (key.pageDown) return { key: "pagedown", ctrl: key.ctrl, shift: key.shift, meta: key.meta };

  return { key: input, ctrl: key.ctrl, shift: key.shift, meta: key.meta };
}

export function createKeyBuffer(): KeyBuffer {
  return { keys: [], count: "", timeout: null };
}

export function keyToString(parsed: ParsedInput): string {
  const parts: string[] = [];
  if (parsed.ctrl) parts.push("C");
  if (parsed.meta) parts.push("M");
  if (parsed.shift && parsed.key.length > 1) parts.push("S");
  parts.push(parsed.key);
  return parts.join("-");
}
