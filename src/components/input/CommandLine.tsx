import React from "react";
import { Box, Text } from "ink";
import { useAppState } from "../../state/context.tsx";

interface CommandLineProps {
  width: number;
}

export function CommandLine({ width }: CommandLineProps) {
  const state = useAppState();

  if (state.mode === "prompt" && state.prompt) {
    return (
      <Box width={width}>
        <Text bold color="yellow">
          {state.prompt.title}{" "}
        </Text>
        <Text>{state.prompt.value}</Text>
        <Text dimColor>█</Text>
      </Box>
    );
  }

  if (state.mode === "command") {
    return (
      <Box width={width}>
        <Text bold color="yellow">
          :
        </Text>
        <Text>{state.commandInput}</Text>
        <Text dimColor>█</Text>
      </Box>
    );
  }

  if (state.mode === "search") {
    const matchInfo = state.search
      ? ` [${state.search.currentMatch + 1}/${state.search.matches.length}]`
      : "";
    return (
      <Box width={width}>
        <Text bold color="yellow">
          /
        </Text>
        <Text>{state.commandInput}</Text>
        <Text dimColor>█</Text>
        <Text dimColor>{matchInfo}</Text>
      </Box>
    );
  }

  if (state.error) {
    return (
      <Box width={width}>
        <Text color="red" bold>
          {state.error}
        </Text>
      </Box>
    );
  }

  if (state.mode === "preview") {
    const selectedCount = state.previewSelectedLines.size;
    const modeLabel =
      selectedCount > 0
        ? `-- PREVIEW VISUAL -- (${selectedCount} lines)`
        : "-- PREVIEW --";
    return (
      <Box width={width}>
        <Text color="cyan" bold>
          {modeLabel}
        </Text>
      </Box>
    );
  }

  return (
    <Box width={width}>
      <Text dimColor>
        {state.mode === "visual" ? "-- VISUAL --" : ""}
      </Text>
    </Box>
  );
}
