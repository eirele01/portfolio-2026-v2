"use client";

import { createContext, useContext } from "react";

/**
 * When true, beats/visuals render in flowing document order (static & lite
 * modes) instead of absolutely-positioned swap layers (story mode).
 */
export const FlowContext = createContext(false);
export const useFlow = (): boolean => useContext(FlowContext);
