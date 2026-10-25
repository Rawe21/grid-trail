const CELL = 20;      // size of each square.

const LIFE = 600;     // how long square is kept on the screen (ms)
                      

const HOLD = 0.15;    // a fraction after the animation happens (shrink, ms)
                    

const COLORS = [     
  '#ff3d7f',          
  '#b388ff',          
  '#5b3df5',         
  '#c2570c',          
  '#c9a010',          
  '#5ef08a',          
];

const SYMBOLS = ['&', '+', '-', '=', '(', ')', '<', '>', '/', '*', '.', '_'];
                  

const GUIDE_EVERY = 8;   // a horizontal line every N cells

// dont u dare to change any line of code below me

const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');   // ctx is the thinig it draws with (or us, idk)
let W, H, dpr;

// make sure so the canvas stay the size and keep their resolution
function resize() {
  dpr = window.devicePixelRatio || 1;
  W = innerWidth;
  H = innerHeight;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
addEventListener('resize', resize);
resize();

//the key is column,row, so touching the same cell again just restarts it instead of stacking copies.
const cells = new Map();
let last = null;

// create one square at a grid position with a random color and symbol.
function stamp(col, row, now) {
  cells.set(col + ',' + row, {
    col, row,
    born: now,                                              // when it appeared
    color: COLORS[Math.random() * COLORS.length | 0],       // random color
    ch: SYMBOLS[Math.random() * SYMBOLS.length | 0],        // random symbol
  });
}

// dont look at this, idk myself
function line(c0, r0, c1, r1, now) {
  const dc = Math.abs(c1 - c0), dr = Math.abs(r1 - r0);
  const sc = c0 < c1 ? 1 : -1, sr = r0 < r1 ? 1 : -1;
  let err = dc - dr;
  for (;;) {
    stamp(c0, r0, now);
    if (c0 === c1 && r0 === r1) break;
    const e2 = 2 * err;
    if (e2 > -dr) { err -= dr; c0 += sc; }
    if (e2 < dc)  { err += dc; r0 += sr; }
  }
}

// called whenever the pointer moves.
// converts pixels to grid cell, and only does something if the pointer entered a new (not copy) cell.
function onMove(x, y) {
  const col = Math.floor(x / CELL);
  const row = Math.floor(y / CELL);
  if (last && last.col === col && last.row === row) return;

  const now = performance.now();
  if (last) line(last.col, last.row, col, row, now);
  else stamp(col, row, now);
  last = { col, row };
}

// pointer events cover mouse, touch and pen with one piece of code.
addEventListener('pointermove', e => onMove(e.clientX, e.clientY));
addEventListener('pointerdown', e => { last = null; onMove(e.clientX, e.clientY); });
addEventListener('pointerleave', () => { last = null; });

// runs ~60 times per second. 
// clears the canvas and redraws every live square.
function draw(now) {
  ctx.clearRect(0, 0, W, H);

  // Faint horizontal guide lines.
  if (GUIDE_EVERY > 0) {
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    for (let y = CELL * GUIDE_EVERY; y < H; y += CELL * GUIDE_EVERY) {
      ctx.fillRect(0, y, W, 1.5);
    }
  }

  ctx.font = `${CELL * 0.7}px ui-monospace, Menlo, Consolas, monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // i dont even know how ai made this, figure it out
   
  for (const [key, c] of cells) {
    // t is the square's age from 0 (just born) to 1 (should be gone).
    const t = (now - c.born) / LIFE;
    if (t >= 1) { cells.delete(key); continue; }   // dead: remove it

    // k is the scale from 1 (full size) to 0 (gone).
    // stays at 1 during the HOLD period, then shrinks with an ease-in curve
    // (slow at first, then faster).
    const k = t < HOLD ? 1 : 1 - Math.pow((t - HOLD) / (1 - HOLD), 2);

    const size = CELL * k;
    const cx = c.col * CELL + CELL / 2;   // center of the cell
    const cy = c.row * CELL + CELL / 2;

    // Draw the square, shrinking around its center.
    ctx.globalAlpha = Math.min(1, k * 1.4);
    ctx.fillStyle = c.color;
    ctx.fillRect(cx - size / 2, cy - size / 2, size, size);

    // The symbol fades out sooner than the square (gone once k < 0.5).
    if (k > 0.5) {
      ctx.globalAlpha = (k - 0.5) * 1.4;
      ctx.fillStyle = 'rgba(40,40,50,0.65)';   // symbol color
      ctx.fillText(c.ch, cx, cy + 1);
    }
  }
  ctx.globalAlpha = 1;
  requestAnimationFrame(draw);   // ask the browser to call draw() again next frame
}
requestAnimationFrame(draw);
