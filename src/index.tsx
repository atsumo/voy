#!/usr/bin/env bun
import React from "react";
import { withFullScreen } from "fullscreen-ink";
import { App } from "./app.tsx";

const ink = withFullScreen(<App />, { exitOnCtrlC: true });
await ink.start();
await ink.waitUntilExit();
