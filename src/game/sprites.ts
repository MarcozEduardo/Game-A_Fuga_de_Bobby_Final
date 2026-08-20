/* =====================================================
 *  BOBBY IA — sprites pixel-art & helpers de desenho
 * ===================================================== */

export type Palette = [string, string, string, string, string];

export const PAL_BOBBY: Palette = ['#00cc66', '#003311', '#0f0', '#00ff88', '#004422'];

export const BOBBY_FACE: string[][] = [
  [
    '....RRRRRRRRR....', '..RRRRRRRRRRRRRR.', '.RRRRRRRRRRRRRRR.', '.RRRWWWRRRWWWRRR.',
    '.RRRWBWRRRWBWRRR.', '.RRRWWWRRRWWWRRR.', '.RRRRRRRRRRRRRRR.', '.RRRRRRRRRRRRRRR.',
    '.RRRRSSSSSSSRRRR.', '.RRRSSSSSSSSRRRR.', '..RRRRRRRRRRRRRR.', '....RRRRRRRRR....',
  ],
  [
    '....RRRRRRRRR....', '..RRRRRRRRRRRRRR.', '.RRRRRRRRRRRRRRR.', '.RRRWWWRRRWWWRRR.',
    '.RRRWBWRRRWBWRRR.', '.RRRWWWRRRWWWRRR.', '.RRRRRRRRRRRRRRR.', '.RRRRRRRRRRRRRRR.',
    '.RRRRSSSSSSSRRRR.', '.RRRSSSSSSSSRRRR.', '..RRRRRRRRRRRRRR.', '....RRRRRRRRR....',
  ],
];

export const BOBBY_RUN: string[][] = [
  ['...RRR...', '..RRRRR..', '..RWRWR..', '..RRRRR..', '...BBB...', '..BBBBB..', '.BBBBBBB.', '..BBBBB..', '..BB.BB..', '..BB.BB..', '.YY...YY.'],
  ['...RRR...', '..RRRRR..', '..RWRWR..', '..RRRRR..', '...BBB...', '..BBBBB..', '.BBBBBBB.', '..BBBBB..', '.BB......', '...BBB...', '.....YY..'],
  ['...RRR...', '..RRRRR..', '..RWRWR..', '..RRRRR..', '...BBB...', '..BBBBB..', '.BBBBBBB.', '..BBBBB..', '......BB.', '...BBB...', '.YY......'],
];

export const BOBBY_KNEEL: string[] = [
  '............', '............', '............', '............', '............',
  '....RRRRR...', '...RRRRRRRR.', '...RWWRWWRR.', '...RRRRRRRR.', '....BBBBB...',
  '..BBBBBBBBB.', '..BBBBBBBBB.', '.YYBBBBBBYY.', '.YY......YY.',
];

export const PAL_HERO_3: Palette = ['#5bc8f5', '#2176ae', '#fff', '#f5c518', '#e8734a'];
export const PAL_HERO_2: Palette = ['#888', '#555', '#ddd', '#aa8800', '#884422'];
export const PAL_HERO_1: Palette = ['#555', '#333', '#999', '#664400', '#552211'];
export const PAL_ENEMY: Palette = ['#e74c3c', '#c0392b', '#ff9999', '#fff', '#222'];
export const PAL_COIN: Palette = ['#ffd700', '#ffa500', '#fff8a0', '#b8860b', '#fff'];
export const PAL_STAR: Palette = ['#ffd700', '#ff8800', '#fff', '#ff0066', '#fff'];
export const PAL_HEALTH: Palette = ['#ff0066', '#ff3388', '#fff', '#ffaacc', '#fff'];
export const PAL_BOSS: Palette = ['#9b59b6', '#6c3483', '#fff', '#ff00ff', '#2c3e50'];

/* ===== Mecha com reator (24x20) — frames 0/1 ===== */
export const MECHA_FRAMES: string[][] = [
  [
    '....RRRRRRRRRRRRRRRR....', '..RRRRRRRRRRRRRRRRRRRR..', '.RRRRRRRRRRRRRRRRRRRRRR.',
    '.RRRRWWWWWRRRRWWWWWRRRR.', '.RRRRWSSSSRRRRSSSSWRRRR.', '.RRRRWWWWWRRRRWWWWWRRRR.',
    'RRRRRRRRRRRRRRRRRRRRRRRR', 'RRRRRBBBBBBBBBBBBBBRRRRR', 'RRRRBSSSSSSSSSSSSSSBRRRR',
    'RRRRBSSSSYYYYSSSSSSBRRRR', 'RRRRBSSSSYYYYSSSSSSBRRRR', 'RRRRBSSSSSSSSSSSSSSBRRRR',
    'RRRRRBBBBBBBBBBBBBBRRRRR', 'RRRRRRRRRRRRRRRRRRRRRRRR', '.RRRRR..RRRRRRRR..RRRRR.',
    '.SSSS...SSSSSSSS...SSSS.', '.SSSS...SSSSSSSS...SSSS.', '.SSSS...SSS..SSS...SSSS.',
    'SSSSS...SSS..SSS...SSSSS', 'SSSSS...SSS..SSS...SSSSS',
  ],
  [
    '....RRRRRRRRRRRRRRRR....', '..RRRRRRRRRRRRRRRRRRRR..', '.RRRRRRRRRRRRRRRRRRRRRR.',
    '.RRRRWWWWWRRRRWWWWWRRRR.', '.RRRRWSSSSRRRRSSSSWRRRR.', '.RRRRWWWWWRRRRWWWWWRRRR.',
    'RRRRRRRRRRRRRRRRRRRRRRRR', 'RRRRRBBBBBBBBBBBBBBRRRRR', 'RRRRBSSSSSSSSSSSSSSBRRRR',
    'RRRRBSSSSYYYYSSSSSSBRRRR', 'RRRRBSSSSYYYYSSSSSSBRRRR', 'RRRRBSSSSSSSSSSSSSSBRRRR',
    'RRRRRBBBBBBBBBBBBBBRRRRR', 'RRRRRRRRRRRRRRRRRRRRRRRR', '.RRRRR..RRRRRRRR..RRRRR.',
    'SSSS....SSSSSSSS....SSSS', 'SSSS....SSSSSSSS....SSSS', '.SSS....SSS..SSS....SSS.',
    'SSSSS...SSS..SSS...SSSSS', 'SSSSS...SSS..SSS...SSSSS',
  ],
];

export const HERO_FRAMES: string[][] = [
  ['....RRRRR...', '...RRRRRRRR.', '...RWWRWWRR.', '...RRRRRRRR.', '....BBBBB...', '...BBBBBBB..', '..BBBBBBBBB.', '...BBBBBBB..', '....BBBBB...', '...BB...BB..', '..BBB...BBB.', '..BB.....BB.', '..BB.....BB.', '..BB.....BB.', '..YY.....YY.', '..YY.....YY.'],
  ['....RRRRR...', '...RRRRRRRR.', '...RWWRWWRR.', '...RRRRRRRR.', '....BBBBB...', '...BBBBBBB..', '..BBBBBBBBB.', '...BBBBBBB..', '.....BBB....', '....BB......', '...BBB......', '..BB........', '......BB....', '.......BBB..', '.......YYY..', '......YY....'],
  ['....RRRRR...', '...RRRRRRRR.', '...RWWRWWRR.', '...RRRRRRRR.', '....BBBBB...', '...BBBBBBB..', '..BBBBBBBBB.', '...BBBBBBB..', '.....BBB....', '......BB....', '......BBB...', '.......BB...', '..BB........', '.BBB........', '.YYY........', '...YY.......'],
  ['....RRRRR...', '...RRRRRRRR.', '...RWWRWWRR.', '...RRRRRRRR.', '....BBBBB...', '..BBBBBBBBB.', '..BBBBBBBBB.', '...BBBBBBB..', '..BB.BBB.BB.', '.BB..BBB..BB', '.BB..BBB..BB', '.YY.......YY', '.YY.......YY', '............', '............', '............'],
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

/* ===== Alfabeto pixel (MARCOS / PORTFOLIO) ===== */
export const PIXEL_LETTERS: Record<string, string[]> = {
  M: ['X...X', 'XX.XX', 'X.X.X', 'X...X', 'X...X'],
  A: ['.XXX.', 'X...X', 'XXXXX', 'X...X', 'X...X'],
  R: ['XXXX.', 'X...X', 'XXXX.', 'X..X.', 'X...X'],
  C: ['.XXXX', 'X....', 'X....', 'X....', '.XXXX'],
  O: ['.XXX.', 'X...X', 'X...X', 'X...X', '.XXX.'],
  S: ['.XXXX', 'X.....', '.XXX.', '....X', 'XXXX.'],
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

export interface TextBlock {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function generateTextBlocks(text: string, startX: number, startY: number, blockSize: number): TextBlock[] {
  const blocks: TextBlock[] = [];
  let cursorX = startX;
  for (let c = 0; c < text.length; c++) {
    const letter = PIXEL_LETTERS[text[c]];
    if (!letter) {
      cursorX += blockSize * 4;
      continue;
    }
    for (let row = 0; row < letter.length; row++)
      for (let col = 0; col < letter[row].length; col++)
        if (letter[row][col] === 'X')
          blocks.push({ x: cursorX + col * blockSize, y: startY + row * blockSize, w: blockSize, h: blockSize });
    cursorX += (letter[0].length + 1) * blockSize;
  }
  return blocks;
}

/* ===== Desenho de pixel art (com cache de frames) ===== */
const CHAR_COLORS: Record<string, number> = { R: 0, B: 1, W: 2, Y: 3, S: 4 };
const frameCache = new Map<string, HTMLCanvasElement>();

function frameKey(frame: string[], pal: Palette, sc: number): string {
  return frame.join('|') + '::' + pal.join(',') + '::' + sc;
}

function rasterize(frame: string[], pal: Palette, sc: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = frame[0].length * sc;
  c.height = frame.length * sc;
  const g = c.getContext('2d')!;
  for (let r = 0; r < frame.length; r++)
    for (let col = 0; col < frame[r].length; col++) {
      const ch = frame[r][col];
      if (ch !== '.') {
        g.fillStyle = pal[CHAR_COLORS[ch] ?? 2];
        g.fillRect(col * sc, r * sc, sc, sc);
      }
    }
  return c;
}

export function drawPixelArt(
  ctx: CanvasRenderingContext2D,
  frames: string[][],
  fi: number,
  pal: Palette,
  x: number,
  y: number,
  sc: number,
  flip: boolean
): void {
  const frame = frames[fi % frames.length];
  const key = frameKey(frame, pal, sc);
  let spr = frameCache.get(key);
  if (!spr) {
    spr = rasterize(frame, pal, sc);
    frameCache.set(key, spr);
  }
  ctx.save();
  if (flip) {
    ctx.translate(x + spr.width, y);
    ctx.scale(-1, 1);
    ctx.drawImage(spr, 0, 0);
  } else {
    ctx.drawImage(spr, x, y);
  }
  ctx.restore();
}

export function drawSingleFrame(
  ctx: CanvasRenderingContext2D,
  frame: string[],
  pal: Palette,
  x: number,
  y: number,
  sc: number,
  flip: boolean
): void {
  const key = frameKey(frame, pal, sc);
  let spr = frameCache.get(key);
  if (!spr) {
    spr = rasterize(frame, pal, sc);
    frameCache.set(key, spr);
  }
  ctx.save();
  if (flip) {
    ctx.translate(x + spr.width, y);
    ctx.scale(-1, 1);
    ctx.drawImage(spr, 0, 0);
  } else {
    ctx.drawImage(spr, x, y);
  }
  ctx.restore();
}
