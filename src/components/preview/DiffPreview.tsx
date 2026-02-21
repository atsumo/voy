import React from "react";
import { Box, Text } from "ink";

interface DiffPreviewProps {
  content: string;
  height: number;
  width: number;
}

export function DiffPreview({ content, height, width }: DiffPreviewProps) {
  const lines = content.split("\n").slice(0, height);

  return (
    <Box flexDirection="column" height={height} width={width}>
      {lines.map((line, i) => {
        const truncated = line.slice(0, width);

        if (line.startsWith("diff --git")) {
          return <Text key={i} bold color="yellow" wrap="truncate">{truncated}</Text>;
        }
        if (line.startsWith("@@")) {
          return <Text key={i} color="cyan" wrap="truncate">{truncated}</Text>;
        }
        if (line.startsWith("+") && !line.startsWith("+++")) {
          return <Text key={i} color="green" wrap="truncate">{truncated}</Text>;
        }
        if (line.startsWith("-") && !line.startsWith("---")) {
          return <Text key={i} color="red" wrap="truncate">{truncated}</Text>;
        }
        if (line.startsWith("---") || line.startsWith("+++")) {
          return <Text key={i} bold dimColor wrap="truncate">{truncated}</Text>;
        }
        return <Text key={i} dimColor wrap="truncate">{truncated}</Text>;
      })}
    </Box>
  );
}
