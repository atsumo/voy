import React from "react";
import { Box, Text } from "ink";

interface TextPreviewProps {
  content: string;
  height: number;
  width: number;
}

export function TextPreview({ content, height, width }: TextPreviewProps) {
  const lines = content.split("\n").slice(0, height);

  return (
    <Box flexDirection="column" height={height} width={width}>
      {lines.map((line, i) => (
        <Text key={i} dimColor wrap="truncate">
          {line.slice(0, width)}
        </Text>
      ))}
    </Box>
  );
}
