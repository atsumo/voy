import React from "react";
import { Box } from "ink";
import { useAppState } from "../../state/context.tsx";
import { FileList } from "../file-list/FileList.tsx";

interface ParentPaneProps {
  height: number;
  width: number;
}

export function ParentPane({ height, width }: ParentPaneProps) {
  const state = useAppState();

  return (
    <Box
      flexDirection="column"
      width={width}
      height={height}
      borderStyle="single"
      borderRight
      borderTop={false}
      borderBottom={false}
      borderLeft={false}
      borderColor="gray"
    >
      <FileList
        files={state.parentFiles}
        cursor={state.parentCursor}
        selectedIndices={new Set()}
        height={height}
        width={width - 1}
        dimmed
      />
    </Box>
  );
}
