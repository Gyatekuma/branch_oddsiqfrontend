/**
 * Zero-dependency PWA icon generator using raw PNG encoding.
 * Dark rounded-rect background with gold "EDI" text.
 */
import { deflateSync } from 'node:zlib'
import { writeFileSync } from 'node:fs'

function crc32(buf) {
  let crc = 0xffffffff
  for (const b of buf) {
    crc ^= b
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0)
  }
  return (crc ^ 0xffffffff) >>> 0
}
function u32(n) { const b = Buffer.alloc(4); b.writeUInt32BE(n); return b }
function chunk(type, data) {
  const t = Buffer.from(type)
  const d = Buffer.isBuffer(data) ? data : Buffer.from(data)
  return Buffer.concat([u32(d.length), t, d, u32(crc32(Buffer.concat([t, d])))])
}

const BG   = [0x06, 0x08, 0x0f, 0xff]
const GOLD = [0xd4, 0xa0, 0x17, 0xff]

function makePng(size) {
  const pixels = new Array(size * size).fill(null).map(() => [...BG])
  const r = size * 0.22

  // Rounded corners
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const inCorner =
        (x < r        && y < r        && Math.hypot(x - r,           y - r)           > r) ||
        (x > size-r-1 && y < r        && Math.hypot(x - (size-r-1),  y - r)           > r) ||
        (x < r        && y > size-r-1 && Math.hypot(x - r,           y - (size-r-1))  > r) ||
        (x > size-r-1 && y > size-r-1 && Math.hypot(x - (size-r-1),  y - (size-r-1)) > r)
      if (inCorner) pixels[y * size + x][3] = 0
    }
  }

  // Scale factor: design on 32×32 logical grid
  const s = size / 32
  function fill(fx, fy, fw, fh) {
    const x0 = Math.round(fx * s), y0 = Math.round(fy * s)
    const x1 = Math.round((fx + fw) * s), y1 = Math.round((fy + fh) * s)
    for (let y = y0; y < y1; y++)
      for (let x = x0; x < x1; x++)
        if (y >= 0 && y < size && x >= 0 && x < size)
          pixels[y * size + x] = [...GOLD]
  }

  // ── Letters on 32×32 grid ─────────────────────────────────────
  // Total letter block: ~26px wide, centred → startX = 3
  // Letter height: 13px, vertically centred → startY = (32-13)/2 = 9.5 → 10
  const ty = 10  // top y
  const lh = 13  // letter height
  const sw = 2   // stroke width

  // E  (x = 3..10, width 8)
  fill(3,        ty,       8,  sw)      // top bar
  fill(3,        ty+5.5,   7,  sw)      // middle bar
  fill(3,        ty+lh-sw, 8,  sw)      // bottom bar
  fill(3,        ty,       sw, lh)      // left spine

  // D  (x = 12..20, width 8)
  fill(12,       ty,       sw, lh)      // left spine
  fill(12,       ty,       7,  sw)      // top bar
  fill(12,       ty+lh-sw, 7,  sw)      // bottom bar
  fill(18,       ty+sw,    sw, lh-sw*2) // right side

  // I  (x = 22..29, width 7)
  fill(22,       ty,       7,  sw)      // top bar
  fill(22,       ty+lh-sw, 7,  sw)      // bottom bar
  fill(24.5,     ty+sw,    sw, lh-sw*2) // centre spine

  // Encode PNG
  const sig  = Buffer.from([137,80,78,71,13,10,26,10])
  const ihdr = chunk('IHDR', Buffer.concat([u32(size), u32(size), Buffer.from([8,6,0,0,0])]))
  const raw  = Buffer.alloc(size * (1 + size * 4))
  for (let y = 0; y < size; y++) {
    raw[y * (1 + size * 4)] = 0
    for (let x = 0; x < size; x++) {
      const p = pixels[y * size + x]
      const o = y * (1 + size * 4) + 1 + x * 4
      raw[o]=p[0]; raw[o+1]=p[1]; raw[o+2]=p[2]; raw[o+3]=p[3]
    }
  }
  const idat = chunk('IDAT', deflateSync(raw))
  const iend = chunk('IEND', Buffer.alloc(0))
  return Buffer.concat([sig, ihdr, idat, iend])
}

for (const size of [192, 512, 180]) {
  const name = size === 180 ? 'apple-touch-icon' : `pwa-${size}x${size}`
  writeFileSync(`public/${name}.png`, makePng(size))
  console.log(`  ${name}.png`)
}
console.log('Done.')
