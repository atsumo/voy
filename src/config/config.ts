import { homedir } from "node:os";
import { join } from "node:path";
import { createContext, useContext } from "react";

export interface VoyConfig {
  editor: { command: string };
}

const CONFIG_PATH = join(homedir(), ".config", "voy", "config.toml");

function getDefaultEditor(): string {
  return process.env.EDITOR || process.env.VISUAL || "vi";
}

const defaultConfig: VoyConfig = {
  editor: { command: getDefaultEditor() },
};

export function loadConfigSync(): VoyConfig {
  try {
    const file = Bun.file(CONFIG_PATH);
    const text = file.textSync();
    const parsed = Bun.TOML.parse(text) as Partial<VoyConfig>;

    return {
      editor: {
        command: parsed.editor?.command || getDefaultEditor(),
      },
    };
  } catch {
    return defaultConfig;
  }
}

const ConfigContext = createContext<VoyConfig>(defaultConfig);

export const ConfigProvider = ConfigContext.Provider;

export function useConfig(): VoyConfig {
  return useContext(ConfigContext);
}
