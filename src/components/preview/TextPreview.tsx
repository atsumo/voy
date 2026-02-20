import React from "react";
import { Box, Text } from "ink";

interface TextPreviewProps {
  content: string;
  height: number;
  width: number;
  scrollOffset?: number;
  selectedLines?: Set<number>;
  cursorLine?: number;
}

export function TextPreview({
  content,
  height,
  width,
  scrollOffset = 0,
  selectedLines,
  cursorLine,
}: TextPreviewProps) {
  const allLines = content.split("\n");
  const lines = allLines.slice(scrollOffset, scrollOffset + height);

  return (
    <Box flexDirection="column" height={height} width={width}>
      {lines.map((line, i) => {
        const absoluteLine = scrollOffset + i;
        const isSelected = selectedLines?.has(absoluteLine);
        const isCursor = cursorLine !== undefined && absoluteLine === cursorLine;

        return (
          <Text
            key={i}
            dimColor={!isSelected && !isCursor}
            backgroundColor={isSelected ? "blue" : isCursor ? "gray" : undefined}
            color={isSelected ? "white" : undefined}
            wrap="truncate"
          >
            {line.slice(0, width)}
          </Text>
        );
      })}
    </Box>
  );
}
