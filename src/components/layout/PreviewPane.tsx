import React from "react";
import { Box, Text } from "ink";
import { useAppState } from "../../state/context.tsx";
import { TextPreview } from "../preview/TextPreview.tsx";
import { DirectoryPreview } from "../preview/DirectoryPreview.tsx";

interface PreviewPaneProps {
  height: number;
  width: number;
}

export function PreviewPane({ height, width }: PreviewPaneProps) {
  const state = useAppState();
  const { preview } = state;
  const isPreviewMode = state.mode === "preview";

  const content = (() => {
    switch (preview.type) {
      case "text":
        return (
          <TextPreview
            content={preview.content}
            height={height}
            width={width - 1}
            scrollOffset={isPreviewMode ? state.previewScroll : undefined}
            selectedLines={isPreviewMode ? state.previewSelectedLines : undefined}
            cursorLine={isPreviewMode ? state.previewCursor : undefined}
            highlightedLines={preview.highlightedLines}
          />
        );
      case "directory":
        return (
          <DirectoryPreview
            entries={preview.entries ?? []}
            height={height}
            width={width - 1}
          />
        );
      case "binary":
        return <Text dimColor>{preview.content}</Text>;
      case "error":
        return <Text color="red">{preview.content}</Text>;
      case "none":
      default:
        return <Text dimColor>  No preview</Text>;
    }
  })();

  return (
    <Box
      flexDirection="column"
      width={width}
      height={height}
      borderStyle="single"
      borderLeft
      borderTop={false}
      borderBottom={false}
      borderRight={false}
      borderColor={isPreviewMode ? "cyan" : "gray"}
    >
      {content}
    </Box>
  );
}
