import React from "react";
import { Text } from "ink";
import type { FileEntry } from "../../state/types.ts";
import { colorize } from "../../utils/colors.ts";
import { getFileIcon } from "../../utils/icons.ts";
import { formatSize, formatDate } from "../../utils/formatting.ts";

interface FileItemProps {
  entry: FileEntry;
  isCursor: boolean;
  isSelected: boolean;
  isSearchMatch: boolean;
  width: number;
  dimmed?: boolean;
}

export function FileItem({
  entry,
  isCursor,
  isSelected,
  isSearchMatch,
  width,
  dimmed = false,
}: FileItemProps) {
  const color = colorize(entry);
  const fileIcon = getFileIcon(entry);

  // Git status → override filename color (VS Code style)
  const gitNameColor = entry.gitStaged ? "green"
    : entry.gitStatus === "M" ? "yellow"
    : entry.gitStatus === "?" ? "green"
    : entry.gitStatus === "D" ? "red"
    : entry.gitStatus === "A" ? "green"
    : undefined;

  const sizeStr = entry.isDirectory ? " <DIR>" : formatSize(entry.size);
  const dateStr = formatDate(entry.modified);
  const metaWidth = sizeStr.length + 1 + dateStr.length + 1;
  const nameWidth = Math.max(10, width - metaWidth - 6);
  let displayName = entry.name;
  if (displayName.length > nameWidth) {
    displayName = displayName.slice(0, nameWidth - 1) + "…";
  }
  displayName = displayName.padEnd(nameWidth);

  const prefix = isSelected ? "▌" : isCursor ? "▸" : " ";

  // When dimmed (e.g. preview mode), show cursor row with subdued highlight
  if (dimmed && isCursor) {
    return (
      <Text backgroundColor="gray" color="white">
        <Text color="white">{prefix}</Text>
        <Text color={fileIcon.color}>{fileIcon.icon} </Text>
        <Text>{displayName}</Text>
        <Text> {sizeStr} {dateStr}</Text>
      </Text>
    );
  }

  let bgColor: string | undefined;
  if (isCursor) bgColor = "white";
  else if (isSelected) bgColor = "blue";

  let fgColor: string | undefined;
  if (isCursor) fgColor = "black";

  return (
    <Text
      backgroundColor={bgColor}
      color={fgColor}
      dimColor={isSearchMatch && !isCursor && !isSelected ? false : undefined}
    >
      <Text color={isSelected ? "cyan" : isCursor ? "black" : "white"}>
        {prefix}
      </Text>
      <Text color={isCursor ? "black" : fileIcon.color}>
        {fileIcon.icon}{" "}
      </Text>
      <Text
        color={isCursor ? "black" : gitNameColor ?? undefined}
        bold={entry.isDirectory && !isCursor}
      >
        {isCursor || gitNameColor ? displayName : color(displayName)}
      </Text>
      <Text color={isCursor ? "black" : "gray"}>
        {" "}
        {sizeStr} {dateStr}
      </Text>
    </Text>
  );
}
