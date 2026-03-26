// Font scale per die type — larger faces get proportionally larger text.
// Used by the dice template to configure the WebGL texture atlas.

import type { DieType } from '../../types';

export const FONT_SCALE: Record<DieType, number> = {
  d2:   0.5,
  d4:   0.35,
  d6:   0.6,
  d8:   0.4,
  d10:  0.42,
  d12:  0.38,  // Matched to d12_final.html reference
  d20:  0.32,  // Matched to d20_centred_final.html reference
  d100: 0.38,
};
