import React from "react";
import { AppProvider } from "./state/context.tsx";
import { ThreePaneLayout } from "./components/layout/ThreePaneLayout.tsx";
import { useFileSystem } from "./hooks/useFileSystem.ts";
import { useNavigation } from "./hooks/useNavigation.ts";
import { usePreview } from "./hooks/usePreview.ts";
import { useKeyBindings } from "./hooks/useKeyBindings.ts";

function AppInner() {
  const { refresh } = useFileSystem();
  const { navigate, enterDirectory, parentDirectory } = useNavigation();
  usePreview();
  useKeyBindings({ navigate, enterDirectory, parentDirectory, refresh });

  return <ThreePaneLayout />;
}

export function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}
