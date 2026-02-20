import React from "react";
import { Box, Text } from "ink";
import { useAppState } from "../../state/context.tsx";
import type { Mode } from "../../state/types.ts";

interface KeyHint {
  key: string;
  action: string;
}

const hints: Record<Mode, KeyHint[]> = {
  normal: [
    { key: "j/k", action: "Move" },
    { key: "l", action: "Enter" },
    { key: "h", action: "Back" },
    { key: "P", action: "Preview" },
    { key: "v", action: "Visual" },
    { key: "Space", action: "Select" },
    { key: "yy", action: "Copy" },
    { key: "x", action: "Cut" },
    { key: "dd/D", action: "Delete" },
    { key: "pp", action: "Paste" },
    { key: "o/O", action: "New" },
    { key: "~", action: "Home" },
    { key: "C-o", action: "Back" },
    { key: "/", action: "Search" },
    { key: ":", action: "Command" },
    { key: "q", action: "Quit" },
  ],
  visual: [
    { key: "j/k", action: "Extend" },
    { key: "v", action: "Confirm" },
    { key: "Esc", action: "Cancel" },
  ],
  preview: [
    { key: "j/k", action: "Move" },
    { key: "v", action: "Visual" },
    { key: "Space", action: "Toggle" },
    { key: "y", action: "Copy" },
    { key: "e", action: "Edit" },
    { key: "gg/G", action: "Top/Bot" },
    { key: "Esc", action: "Back" },
  ],
  command: [
    { key: "Enter", action: "Execute" },
    { key: "Esc", action: "Cancel" },
  ],
  search: [
    { key: "Enter", action: "Confirm" },
    { key: "n/N", action: "Next/Prev" },
    { key: "Esc", action: "Cancel" },
  ],
  prompt: [
    { key: "Enter", action: "Submit" },
    { key: "Esc", action: "Cancel" },
  ],
};

const previewVisualHints: KeyHint[] = [
  { key: "j/k", action: "Select" },
  { key: "v", action: "Confirm" },
  { key: "y", action: "Copy" },
  { key: "Esc", action: "Cancel" },
];

interface KeyHintBarProps {
  width: number;
}

export function KeyHintBar({ width }: KeyHintBarProps) {
  const state = useAppState();

  const isPreviewVisual =
    state.mode === "preview" && state.previewVisualAnchor !== null;
  const items = isPreviewVisual ? previewVisualHints : hints[state.mode];

  // Render hints that fit within width
  const rendered: React.ReactNode[] = [];
  let used = 0;

  for (const hint of items) {
    // " <key> action " → key.length + action.length + 3 (spaces/padding)
    const itemLen = hint.key.length + hint.action.length + 3;
    if (used + itemLen > width) break;
    rendered.push(
      <Box key={hint.key + hint.action}>
        <Text backgroundColor="gray" color="white" bold>
          {" "}{hint.key}{" "}
        </Text>
        <Text dimColor>
          {hint.action}{" "}
        </Text>
      </Box>,
    );
    used += itemLen;
  }

  return (
    <Box width={width} height={1}>
      {rendered}
    </Box>
  );
}
