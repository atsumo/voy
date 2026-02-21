import React from "react";
import { Box, Text } from "ink";
import { useAppState } from "../../state/context.tsx";
import { shortenPath, formatSize } from "../../utils/formatting.ts";

interface StatusBarProps {
  width: number;
}

export function StatusBar({ width }: StatusBarProps) {
  const state = useAppState();

  const currentFile = state.files[state.cursor];
  const position = state.files.length > 0
    ? `${state.cursor + 1}/${state.files.length}`
    : "0/0";

  const selectedInfo =
    state.selectedIndices.size > 0
      ? ` [${state.selectedIndices.size} selected]`
      : "";

  const clipboardInfo = state.clipboard
    ? ` [${state.clipboard.operation}: ${state.clipboard.files.length}]`
    : "";

  const branchInfo = state.git.isRepo ? ` [${state.git.branch}]` : "";

  const pathDisplay = shortenPath(state.currentPath, Math.floor(width * 0.4));

  const rightInfo = `${position}${selectedInfo}${clipboardInfo}`;
  const fileInfo = currentFile
    ? ` ${currentFile.permissions} ${formatSize(currentFile.size).trim()}`
    : "";

  return (
    <Box width={width} height={1}>
      <Box flexGrow={1}>
        <Text bold color="blue">
          {pathDisplay}
        </Text>
        {state.git.isRepo && (
          <Text color="green">{branchInfo}</Text>
        )}
        <Text dimColor>{fileInfo}</Text>
      </Box>
      <Box>
        <Text dimColor>{rightInfo}</Text>
      </Box>
    </Box>
  );
}
