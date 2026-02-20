import React from "react";
import { Box } from "ink";
import { useScreenSize } from "fullscreen-ink";
import { ParentPane } from "./ParentPane.tsx";
import { CurrentPane } from "./CurrentPane.tsx";
import { PreviewPane } from "./PreviewPane.tsx";
import { StatusBar } from "./StatusBar.tsx";
import { CommandLine } from "../input/CommandLine.tsx";
import { KeyHintBar } from "./KeyHintBar.tsx";

export function ThreePaneLayout() {
  const { width, height } = useScreenSize();

  // Reserve 3 rows: status bar + command line + key hint bar
  const contentHeight = Math.max(1, height - 3);

  // Pane widths: ~20% parent, ~40% current, ~40% preview
  const parentWidth = Math.max(10, Math.floor(width * 0.2));
  const previewWidth = Math.max(10, Math.floor(width * 0.35));
  const currentWidth = Math.max(10, width - parentWidth - previewWidth);

  return (
    <Box flexDirection="column" width={width} height={height}>
      <Box flexDirection="row" height={contentHeight}>
        <ParentPane height={contentHeight} width={parentWidth} />
        <CurrentPane height={contentHeight} width={currentWidth} />
        <PreviewPane height={contentHeight} width={previewWidth} />
      </Box>
      <StatusBar width={width} />
      <CommandLine width={width} />
      <KeyHintBar width={width} />
    </Box>
  );
}
