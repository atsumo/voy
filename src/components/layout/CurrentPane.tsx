import React from "react";
import { Box } from "ink";
import { useAppState } from "../../state/context.tsx";
import { FileList } from "../file-list/FileList.tsx";

interface CurrentPaneProps {
  height: number;
  width: number;
}

export function CurrentPane({ height, width }: CurrentPaneProps) {
  const state = useAppState();

  return (
    <Box flexDirection="column" width={width} height={height}>
      <FileList
        files={state.files}
        cursor={state.cursor}
        selectedIndices={state.selectedIndices}
        searchMatches={state.search?.matches}
        height={height}
        width={width}
        dimmed={state.mode === "preview"}
      />
    </Box>
  );
}
