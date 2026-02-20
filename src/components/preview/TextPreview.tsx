import React from "react";
import { Box, Text } from "ink";

interface TextPreviewProps {
  content: string;
  height: number;
  width: number;
  scrollOffset?: number;
  selectedLines?: Set<number>;
  cursorLine?: number;
  highlightedLines?: string[];
}

export function TextPreview({
  content,
  height,
  width,
  scrollOffset = 0,
  selectedLines,
  cursorLine,
  highlightedLines,
}: TextPreviewProps) {
  const allLines = content.split("\n");
  const lines = allLines.slice(scrollOffset, scrollOffset + height);
  const hlLines = highlightedLines?.slice(scrollOffset, scrollOffset + height);

  return (
    <Box flexDirection="column" height={height} width={width}>
      {lines.map((line, i) => {
        const absoluteLine = scrollOffset + i;
        const isSelected = selectedLines?.has(absoluteLine);
        const isCursor = cursorLine !== undefined && absoluteLine === cursorLine;

        const isActive = cursorLine !== undefined;
        const highlighted = hlLines?.[i];

        if (isSelected || isCursor) {
          return (
            <Text
              key={i}
              backgroundColor={isSelected ? "blue" : "cyan"}
              color={isSelected ? "white" : "black"}
              wrap="truncate"
            >
              {line.slice(0, width)}
            </Text>
          );
        }

        if (highlighted) {
          return (
            <Text key={i} dimColor={!isActive} wrap="truncate">
              {highlighted}
            </Text>
          );
        }

        return (
          <Text
            key={i}
            dimColor={!isActive}
            wrap="truncate"
          >
            {line.slice(0, width)}
          </Text>
        );
      })}
    </Box>
  );
}
