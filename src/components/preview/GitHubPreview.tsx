import React from "react";
import { Box, Text } from "ink";

interface GitHubPreviewProps {
  content: string;
  type: "issues" | "prs";
  height: number;
  width: number;
}

export function GitHubPreview({ content, type, height, width }: GitHubPreviewProps) {
  if (!content.trim()) {
    return (
      <Box flexDirection="column" height={height} width={width}>
        <Text dimColor>  No {type === "issues" ? "issues" : "pull requests"} found</Text>
      </Box>
    );
  }

  const lines = content.split("\n").slice(0, height);

  return (
    <Box flexDirection="column" height={height} width={width}>
      {lines.map((line, i) => {
        const truncated = line.slice(0, width);

        // Try to parse gh output: #number \t title \t labels \t ...
        const numberMatch = truncated.match(/^#?(\d+)\s/);
        if (numberMatch) {
          const num = numberMatch[0];
          const rest = truncated.slice(num.length);

          return (
            <Text key={i} wrap="truncate">
              <Text color="green" bold>{num}</Text>
              <Text>{rest}</Text>
            </Text>
          );
        }

        return <Text key={i} dimColor wrap="truncate">{truncated}</Text>;
      })}
    </Box>
  );
}
