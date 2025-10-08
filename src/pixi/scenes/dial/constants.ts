/**
 * Dial constants
 *
 * Geometry and visual constants used by the dial scene:
 * - SECTORS: number of wheel sectors
 * - OUTER_R / INNER_R: wheel radii
 * - LABEL_R: radius for label placement
 * - various style constants used across the scene
 */
export const SECTORS = 15;
export const OUTER_R = 230;
export const INNER_R = 110;
export const LABEL_R = (INNER_R + OUTER_R) / 2;
export const CENTER_Y_OFFSET = 0;

export const INDICATOR_ALPHA = 0.85;
export const WHEEL_LINE = 0x2a2f3a;
export const INDICATOR_COLOR = 0x4cc9f0;

export const ROTATE_TWEEN_MS = 220;

export const VIVID_20: number[] = [
  0x3b82f6, 0x60a5fa, 0x22d3ee, 0x06b6d4, 0x2dd4bf, 0x34d399, 0x84cc16, 0xa3e635, 0xfacc15,
  0xf59e0b, 0xfb923c, 0xf97316, 0xef4444, 0xf43f5e, 0xec4899, 0xd946ef, 0xa855f7, 0x8b5cf6,
  0x6366f1, 0x14b8a6,
];
