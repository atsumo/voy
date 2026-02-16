import React from "react";
import { Box, Text } from "ink";
import type { FileEntry } from "../../state/types.ts";
import { colorize } from "../../utils/colors.ts";

interface DirectoryPreviewProps {
  entries: FileEntry[];
  height: number;
  width: number;
}

export function DirectoryPreview({
  entries,
  height,
  width,
}: DirectoryPreviewProps) {
  const visible = entries.slice(0, height);

  return (
    <Box flexDirection="column" height={height} width={width}>
      {visible.map((entry) => {
        const color = colorize(entry);
        const icon = entry.isDirectory ? "/" : "";
        return (
          <Text key={entry.path} dimColor wrap="truncate">
            {color(`${entry.name}${icon}`)}
          </Text>
        );
      })}
      {entries.length === 0 && <Text dimColor>  (empty)</Text>}
    </Box>
  );
}
