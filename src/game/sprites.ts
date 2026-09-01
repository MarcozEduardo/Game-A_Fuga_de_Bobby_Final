// ═══════════════════════════════════════════════
//  PIXEL ART — sprites originais da Fuga de Bobby
// ═══════════════════════════════════════════════

export type Palette = string[];

export const PAL_BOBBY: Palette = ['#00cc66', '#003311', '#0f0', '#00ff88', '#004422'];
export const PAL_HERO_3: Palette = ['#5bc8f5', '#2176ae', '#fff', '#f5c518', '#e8734a'];
export const PAL_HERO_2: Palette = ['#888', '#555', '#ddd', '#aa8800', '#884422'];
export const PAL_HERO_1: Palette = ['#555', '#333', '#999', '#664400', '#552211'];
export const PAL_ENEMY: Palette = ['#e74c3c', '#c0392b', '#ff9999', '#fff', '#222'];
export const PAL_COIN: Palette = ['#ffd700', '#ffa500', '#fff8a0', '#b8860b'];
export const PAL_STAR: Palette = ['#ffd700', '#ff8800', '#fff', '#ff0066'];
export const PAL_HEALTH: Palette = ['#ff0066', '#ff3388', '#fff', '#ffaacc'];
export const PAL_BOSS: Palette = ['#9b59b6', '#6c3483', '#fff', '#ff00ff', '#2c3e50'];
export const PAL_BOSS_RAGE: Palette = ['#ff0000', '#cc0000', '#fff', '#ff4444', '#2c3e50'];
export const PAL_BURN_A: Palette = ['#ff0000', '#cc0000', '#fff', '#ff4444', '#2c3e50'];
export const PAL_BURN_B: Palette = ['#ff6600', '#aa3300', '#ffaa00', '#ffff00', '#222'];

export const BOBBY_FACE: string[][] = [
  [
    '....RRRRRRRRR....',
    '..RRRRRRRRRRRRRR.',
    '.RRRRRRRRRRRRRRR.',
    '.RRRWWWRRRWWWRRR.',
    '.RRRWBWRRRWBWRRR.',
    '.RRRWWWRRRWWWRRR.',
    '.RRRRRRRRRRRRRRR.',
    '.RRRRRRRRRRRRRRR.',
    '.RRRRSSSSSSSRRRR.',
    '.RRRSSSSSSSSRRRR.',
    '..RRRRRRRRRRRRRR.',
    '....RRRRRRRRR....',
  ],
  [
    '....RRRRRRRRR....',
    '..RRRRRRRRRRRRRR.',
    '.RRRRRRRRRRRRRRR.',
    '.RRRWWWRRRWWWRRR.',
    '.RRRWBWRRRWBWRRR.',
    '.RRRWWWRRRWWWRRR.',
    '.RRRRRRRRRRRRRRR.',
    '.RRRRRRRRRRRRRRR.',
    '.RRRRSSSSSSSRRRR.',
    '.RRRSSSSSSSSRRRR.',
    '..RRRRRRRRRRRRRR.',
    '....RRRRRRRRR....',
  ],
];

export const BOBBY_RUN: string[][] = [
  ['...RRR...', '..RRRRR..', '..RWRWR..', '..RRRRR..', '...BBB...', '..BBBBB..', '.BBBBBBB.', '..BBBBB..', '..BB.BB..', '..BB.BB..', '.YY...YY.'],
  ['...RRR...', '..RRRRR..', '..RWRWR..', '..RRRRR..', '...BBB...', '..BBBBB..', '.BBBBBBB.', '..BBBBB..', '.BB......', '...BBB...', '.....YY..'],
  ['...RRR...', '..RRRRR..', '..RWRWR..', '..RRRRR..', '...BBB...', '..BBBBB..', '.BBBBBBB.', '..BBBBB..', '......BB.', '...BBB...', '.YY......'],
];

export const BOBBY_KNEEL: string[] = [
  '............',
  '............',
  '............',
  '............',
  '............',
  '....RRRRR...',
  '...RRRRRRRR.',
  '...RWWRWWRR.',
  '...RRRRRRRR.',
  '....BBBBB...',
  '..BBBBBBBBB.',
  '..BBBBBBBBB.',
  '.YYBBBBBBYY.',
  '.YY......YY.',
];

export const HERO_FRAMES: string[][] = [
  ['....RRRRR...', '...RRRRRRRR.', '...RWWRWWRR.', '...RRRRRRRR.', '....BBBBB...', '...BBBBBBB..', '..BBBBBBBBB.', '...BBBBBBB..', '....BBBBB...', '...BB...BB..', '..BBB...BBB.', '..BB.....BB.', '..BB.....BB.', '..BB.....BB.', '..YY.....YY.', '..YY.....YY.'],
  ['....RRRRR...', '...RRRRRRRR.', '...RWWRWWRR.', '...RRRRRRRR.', '....BBBBB...', '...BBBBBBB..', '..BBBBBBBBB.', '...BBBBBBB..', '.....BBB....', '....BB......', '...BBB......', '..BB........', '......BB....', '.......BBB..', '.......YYY..', '......YY....'],
  ['....RRRRR...', '...RRRRRRRR.', '...RWWRWWRR.', '...RRRRRRRR.', '....BBBBB...', '...BBBBBBB..', '..BBBBBBBBB.', '...BBBBBBB..', '.....BBB....', '......BB....', '......BBB...', '.......BB...', '..BB........', '.BBB........', '.YYY........', '...YY.......'],
  ['....RRRRR...', '...RRRRRRRR.', '...RWWRWWRR.', '...RRRRRRRR.', '....BBBBB...', '...BBBBBBB..', '..BBBBBBBBB.', '...BBBBBBB..', '..BB.BBB.BB.', '.BB..BBB..BB', '.BB..BBB..BB', '.YY.......YY', '.YY.......YY', '............', '............', '............'],
  ['............', '............', '............', '....RRRRR...', '...RRRRRRRR.', '...RWWRWWRR.', '...RRRRRRRR.', '....BBBBB...', '...BBBBBBB..', '..BBBBBBBBB.', '..BBBBBBBBB.', '...BBBBBBB..', '....BBBBB...', '..YY.....YY.', '..YY.....YY.', '............'],
  ['....RRRRR...', '...RRRRRRRR.', '...RWWRWWRR.', '...RRRRRRRR.', '....BBBBB...', '...BBBBBBB..', 'BBBBBBBBBBB.', '...BBBBBBBB.', '....BBBBB...', '...BB...BB..', '..BBB...BBB.', '..BB.....BB.', '..BB.....BB.', '..BB.....BB.', '..YY.....YY.', '..YY.....YY.'],
];

export const HERO_FRAMES_DMG: string[][] = [
  ['....RR.RR...', '...RRR.RRRR.', '...RWWRWW.R.', '...RRR.RRRR.', '....BB.BB...', '...BBB.BBB..', '..BBB.BBBBB.', '...BBBBBBB..', '....BBBBB...', '...BB...BB..', '..BBB...BBB.', '..BB.....BB.', '..B......BB.', '..BB.....B..', '..YY.....YY.', '..Y......YY.'],
  ['....RR.RR...', '...RRR.RRRR.', '...RWWRWW.R.', '...RRR.RRRR.', '....BB.BB...', '...BBB.BBB..', '..BBB.BBBBB.', '...BBBBBBB..', '.....BBB....', '....BB......', '...BBB......', '..BB........', '......BB....', '.......BBB..', '.......YYY..', '......YY....'],
  ['....RR.RR...', '...RRR.RRRR.', '...RWWRWW.R.', '...RRR.RRRR.', '....BB.BB...', '...BBB.BBB..', '..BBB.BBBBB.', '...BBBBBBB..', '.....BBB....', '......BB....', '......BBB...', '.......BB...', '..BB........', '.BBB........', '.YYY........', '...YY.......'],
  ['....RR.RR...', '...RRR.RRRR.', '...RWWRWW.R.', '...RRR.RRRR.', '....BB.BB...', '..BBB.BBBBB.', '..BBB.BBBBB.', '...BBBBBBB..', '..BB.BBB.BB.', '.BB..BBB..BB', '.BB..BBB..BB', '.YY.......YY', '.YY.......YY', '............', '............', '............'],
  ['............', '............', '............', '....RR.RR...', '...RRR.RRRR.', '...RWWRWW.R.', '...RRR.RRRR.', '....BB.BB...', '...BBB.BBB..', '..BBB.BBBBB.', '..BBB.BBBBB.', '...BBBBBBB..', '....BBBBB...', '..YY.....YY.', '..Y......YY.', '............'],
  ['....RR.RR...', '...RRR.RRRR.', '...RWWRWW.R.', '...RRR.RRRR.', '....BB.BB...', '...BBB.BBB..', 'BBBBB.BBBBB.', '...BBBBBBBB.', '....BBBBB...', '...BB...BB..', '..BBB...BBB.', '..BB.....BB.', '..B......BB.', '..BB.....B..', '..YY.....YY.', '..Y......YY.'],
];

export const ENEMY_FRAMES: string[][] = [
  ['....RRRRR...', '...RRRRRRR..', '..RRRRRRRRRR', '.WWRWWWWRWWW', '.RRRRRRRRRR.', '..RRRRRRRRR.', '.RRRRRRRRRR.', 'SSRRRRRRRRRR', 'SSSSSSSSSSSS', '.SSSSSSSSSS.', '..SS.....SS.'],
  ['...RRRRR....', '..RRRRRRR...', '.RRRRRRRRRR.', 'WWRWWWWRWWWW', 'RRRRRRRRRRRR', '.RRRRRRRRRR.', 'RRRRRRRRRRRR', 'SSRRRRRRRRRR', 'SSSSSSSSSSSS', 'SSSSSSSSSSSS', '..SS.....SS.'],
];

export const BOSS_FRAMES: string[][] = [
  [
    '........RRRRRRRR........',
    '......RRRRRRRRRRRR......',
    '....RRRRRRRRRRRRRRRR....',
    '...RRRRRRRRRRRRRRRRRRR..',
    '..RRRRRWWWRRRWWWRRRRRRR.',
    '.RRRRRWWWWRRWWWWRRRRRRR.',
    'RRRRRRRRRRRRRRRRRRRRRRRR',
    'RRRRRRSSSSSSSSSSSRRRRRRR',
    'RRRRSSSSSSSSSSSSSSSRRRRR',
    'RRRRSSSSSSSSSSSSSSSRRRRR',
    'RRRRRRSSSSSSSSSSSRRRRRRR',
    'RRRRRRRRRRRRRRRRRRRRRRRR',
    '.RRRRRRRRRRRRRRRRRRRRRRR',
    '..RRRRRRRRRRRRRRRRRRRR..',
    '.RRR.RRRRRRRRRRRRRR.RRR.',
    'RRR...RRRRRRRRRRRR...RRR',
    'RR.....RRRRRRRRRR.....RR',
    '........SSSSSSSS........',
    '........SSSSSSSS........',
    '........SS....SS........',
  ],
  [
    '......RRRRRRRRRR........',
    '....RRRRRRRRRRRRRR......',
    '...RRRRRRRRRRRRRRRR.....',
    '..RRRRRRRRRRRRRRRRRRR...',
    '..RRRRRWWWRRRWWWRRRRRRR.',
    '.RRRRRWWWWRRWWWWRRRRRRR.',
    'RRRRRRRRRRRRRRRRRRRRRRRR',
    'RRRRRRSSSSSSSSSSSRRRRRRR',
    'RRRRSSSSSSSSSSSSSSSRRRRR',
    'RRRRSSSSSSSSSSSSSSSRRRRR',
    'RRRRRRSSSSSSSSSSSRRRRRRR',
    'RRRRRRRRRRRRRRRRRRRRRRRR',
    '.RRRRRRRRRRRRRRRRRRRRRR.',
    '..RRRRRRRRRRRRRRRRRRRR..',
    '..RRR.RRRRRRRRRRRR.RRR..',
    '..RR...RRRRRRRRRR...RR..',
    '........RRRRRRRR........',
    '........SSSSSSSS........',
    '........SS....SS........',
    '........SS....SS........',
  ],
];

// ── SOCRAM (o mecha chefão) ──────────────────────────────
export const PAL_MECHA: Palette = ['#d64541', '#a33330', '#ffffff', '#ffd700', '#7a2a28'];
export const PAL_MECHA_RAGE: Palette = ['#ff6a3d', '#c0392b', '#fff8a0', '#ffea00', '#5a1f1d'];
export const PAL_MECHA_BURN_A: Palette = ['#ff3300', '#cc2200', '#ffffff', '#ffff00', '#333'];
export const PAL_MECHA_BURN_B: Palette = ['#ff6600', '#aa3300', '#ffaa00', '#ffff00', '#222'];
export const PAL_ORANGE_BOT: Palette = ['#ff8c1a', '#7a3d00', '#ffffff', '#ffd700', '#5a2b00'];
export const PAL_BROKEN_BOT: Palette = ['#8a8a8a', '#3a3a3a', '#cccccc', '#777777', '#222222'];

export const MECHA: string[][] = [
  [
    '......RRRRRRRR......',
    '....RRRRRRRRRRRR....',
    '...RRRRRRRRRRRRRR...',
    '..RRRRWWWWWWWWRRRR..',
    '..RRRWYYYYYYYYWRRR..',
    '..RRRRWWWWWWWWRRRR..',
    '.RRRRRRRRRRRRRRRRRR.',
    '.RRRRSSSSSSSSSSRRRR.',
    'RRRRRSSSSSSSSSSSRRRR',
    'RRRRRSSSSSSSSSSSRRRR',
    'RRRRRRRRRRRRRRRRRRRR',
    '.RRRRRRRRRRRRRRRRRR.',
    '..RRRRRRRRRRRRRRRR..',
    '.RRRR.RRRRRRRR.RRRR.',
    'RRR...RRRRRRRR...RRR',
    'RR.....RRRRRR.....RR',
    '.......SSSSSS.......',
    '.......SS..SS.......',
  ],
  [
    '......RRRRRRRR......',
    '....RRRRRRRRRRRR....',
    '...RRRRRRRRRRRRRR...',
    '..RRRRWWWWWWWWRRRR..',
    '..RRRWYYYYYYYYWRRR..',
    '..RRRRWWWWWWWWRRRR..',
    '.RRRRRRRRRRRRRRRRRR.',
    '.RRRRSSSSSSSSSSRRRR.',
    'RRRRRSSSSSSSSSSSRRRR',
    'RRRRRSSSSSSSSSSSRRRR',
    'RRRRRRRRRRRRRRRRRRRR',
    '.RRRRRRRRRRRRRRRRRR.',
    '..RRRRRRRRRRRRRRRR..',
    '..RRRR.RRRRRR.RRRR..',
    '..RR...RRRRRR...RR..',
    '........RRRR........',
    '.......SSSSSS.......',
    '.......SS..SS.......',
  ],
];

// Robozinho prisioneiro (pequeno)
export const PRISONER: string[][] = [
  ['.WWW.', 'WBWBW', '.WWW.', 'RRRRR', 'RRRRR', '.R.R.', '.Y.Y.'],
  ['.WWW.', 'WBWBW', '.WWW.', 'RRRRR', 'RRRRR', 'R...R', 'Y...Y'],
];

export const COIN_FRAMES: string[][] = [
  ['..YYYY..', '.YYYYYY.', 'YYYYYYYY', 'YWWYYYYY', 'YWWYYYYY', 'YYYYYYYY', '.YYYYYY.', '..YYYY..'],
  ['..YY....', '.YYYY...', 'YYYYYY..', 'YWWYYYY.', 'YWWYYYY.', 'YYYYYY..', '.YYYY...', '..YY....'],
  ['..YY....', '..YY....', '..YY....', '..WY....', '..WY....', '..YY....', '..YY....', '..YY....'],
  ['....YY..', '...YYYY.', '..YYYYYY', '.YYYYWWY', '.YYYYWWY', '..YYYYYY', '...YYYY.', '....YY..'],
];

export const STAR_FRAMES: string[][] = [
  ['....YY.....', '....YY.....', '..YYYYYY...', '.YYYYYYYY..', 'YYYYRRYYYY.', 'YYYYRRYYYY.', '.YYYYYYYY..', '..YYYYYY...', 'YY....YYYY.', 'YY.....YYY.', '.Y......YY.', '.Y.......Y.'],
];

export const HEALTH_FRAMES: string[][] = [
  ['..RR...RR...', '.RRRR.RRRR..', '.RRRRRRRRR..', '.RRRRRRRRR..', '..RRRRRRR...', '...RRRRR....', '....RRR.....', '....RRR.....', '....RRR.....', '....RRR.....', '.....R......', '............'],
];

export const BULLET_FRAMES: string[][] = [['..RR..', '.RRRR.', 'RWWWWR', 'RWWWWR', '.RRRR.', '..RR..']];

// Corrigido: 'S' tinha rows com 6 colunas (quebrava o alinhamento)
export const PIXEL_LETTERS: Record<string, string[]> = {
  M: ['X...X', 'XX.XX', 'X.X.X', 'X...X', 'X...X'],
  A: ['.XXX.', 'X...X', 'XXXXX', 'X...X', 'X...X'],
  R: ['XXXX.', 'X...X', 'XXXX.', 'X..X.', 'X...X'],
  C: ['.XXXX', 'X....', 'X....', 'X....', '.XXXX'],
  O: ['.XXX.', 'X...X', 'X...X', 'X...X', '.XXX.'],
  S: ['.XXXX', 'X....', '.XXX.', '....X', 'XXXX.'],
  E: ['XXXXX', 'X....', 'XXX..', 'X....', 'XXXXX'],
  D: ['XXXX.', 'X...X', 'X...X', 'X...X', 'XXXX.'],
  U: ['X...X', 'X...X', 'X...X', 'X...X', '.XXX.'],
  P: ['XXXX.', 'X...X', 'XXXX.', 'X....', 'X....'],
  T: ['XXXXX', '..X..', '..X..', '..X..', '..X..'],
  F: ['XXXXX', 'X....', 'XXX..', 'X....', 'X....'],
  L: ['X....', 'X....', 'X....', 'X....', 'XXXXX'],
  I: ['XXX', '.X.', '.X.', '.X.', 'XXX'],
  ' ': ['...', '...', '...', '...', '...'],
};
