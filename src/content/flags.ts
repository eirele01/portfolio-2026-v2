/** Optional features. [FACTS] No AI example yet → the AI node renders nothing. */
export const flags = {
  showAiNode: false,
} as const;

export type Flags = typeof flags;
