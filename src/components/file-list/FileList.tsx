import React from "react";
import { Box, Text } from "ink";
import type { FileEntry } from "../../state/types.ts";
import { FileItem } from "./FileItem.tsx";

interface FileListProps {
  files: FileEntry[];
  cursor: number;
  selectedIndices: Set<number>;
  searchMatches?: number[];
  height: number;
  width: number;
  dimmed?: boolean;
}

export function FileList({
  files,
  cursor,
  selectedIndices,
  searchMatches,
  height,
  width,
  dimmed = false,
}: FileListProps) {
  if (files.length === 0) {
    return (
      <Box flexDirection="column" height={height} width={width}>
        <Text dimColor>  (empty)</Text>
      </Box>
    );
  }

  // Virtual scrolling: calculate visible window
  const visibleCount = Math.max(1, height);
  let startIndex: number;

  if (files.length <= visibleCount) {
    startIndex = 0;
  } else {
    // Keep cursor roughly centered
    const half = Math.floor(visibleCount / 2);
    startIndex = Math.max(0, cursor - half);
    startIndex = Math.min(startIndex, files.length - visibleCount);
  }

  const endIndex = Math.min(startIndex + visibleCount, files.length);
  const visibleFiles = files.slice(startIndex, endIndex);

  const matchSet = searchMatches ? new Set(searchMatches) : new Set<number>();

  return (
    <Box flexDirection="column" height={height} width={width}>
      {visibleFiles.map((entry, i) => {
        const realIndex = startIndex + i;
        return (
          <Box key={entry.path} width={width}>
            {dimmed && realIndex !== cursor ? (
              <Text dimColor>
                {entry.isDirectory
                  ? ` ${entry.name}/`
                  : ` ${entry.name}`}
              </Text>
            ) : (
              <FileItem
                entry={entry}
                isCursor={realIndex === cursor}
                isSelected={selectedIndices.has(realIndex)}
                isSearchMatch={matchSet.has(realIndex)}
                width={width}
                dimmed={dimmed}
              />
            )}
          </Box>
        );
      })}
    </Box>
  );
}
