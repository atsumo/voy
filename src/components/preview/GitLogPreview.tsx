import React from "react";
import { Box, Text } from "ink";

interface GitLogPreviewProps {
  content: string;
  height: number;
  width: number;
}

export function GitLogPreview({ content, height, width }: GitLogPreviewProps) {
  const lines = content.split("\n").slice(0, height);

  return (
    <Box flexDirection="column" height={height} width={width}>
      {lines.map((line, i) => {
        const truncated = line.slice(0, width);

        // Detect graph characters and hash
        const match = truncated.match(/^([*|/\\ ]+)\s*([a-f0-9]{7,})\s*(.*)/);
        if (match) {
          const [, graph, hash, rest] = match;
          // Check for refs like (HEAD -> main)
          const refMatch = rest?.match(/^(\([^)]+\))\s*(.*)/);
          if (refMatch) {
            const [, refs, message] = refMatch;
            return (
              <Text key={i} wrap="truncate">
                <Text color="yellow">{graph}</Text>
                <Text color="yellow"> {hash} </Text>
                <Text color="cyan">{refs} </Text>
                <Text>{message}</Text>
              </Text>
            );
          }
          return (
            <Text key={i} wrap="truncate">
              <Text color="yellow">{graph}</Text>
              <Text color="yellow"> {hash} </Text>
              <Text>{rest}</Text>
            </Text>
          );
        }

        // Graph-only lines (merge lines etc.)
        return <Text key={i} color="yellow" wrap="truncate">{truncated}</Text>;
      })}
    </Box>
  );
}
