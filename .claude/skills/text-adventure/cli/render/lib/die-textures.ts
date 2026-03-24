// Font scale per die type — larger faces get proportionally larger text.
// Used by the dice template to configure the WebGL texture atlas.

import type { DieType } from '../../types';

export const FONT_SCALE: Record<DieType, number> = {
  d2:   0.5,
  d4:   0.35,
  d6:   0.6,
  d8:   0.4,
  d10:  0.4,
  d12:  0.35,
  d20:  0.3,
  d100: 0.35, // Two-digit labels (00–90) need slightly smaller than d10
};
