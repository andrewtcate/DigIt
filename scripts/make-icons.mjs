// One-off generator for the app icons (apple-touch-icon + PWA icons).
// Minimal PNG encoder: RGBA, zlib-deflated scanlines, hand-rolled CRC32.
import { deflateSync } from 'node:zlib'
import { writeFileSync } from 'node:fs'

function crc32(buf) {
  let c, crc = 0xffffffff
  for (let i = 0; i < buf.length; i++) {
    c = (crc ^ buf[i]) & 0xff
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    crc = (crc >>> 8) ^ c
  }
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

function encodePng(w, h, rgba) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0)
  ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  const raw = Buffer.alloc((w * 4 + 1) * h)
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0 // filter: none
    rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4)
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

function makeIcon(size) {
  const px = Buffer.alloc(size * size * 4)
  const set = (x, y, r, g, b) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return
    const i = (y * size + x) * 4
    px[i] = r; px[i + 1] = g; px[i + 2] = b; px[i + 3] = 255
  }
  // Background #0a0e14
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) set(x, y, 10, 14, 20)
  const s = size / 180 // design at 180, scale up/down
  const disc = (cx, cy, rad, r, g, b) => {
    for (let y = Math.floor(cy - rad); y <= cy + rad; y++)
      for (let x = Math.floor(cx - rad); x <= cx + rad; x++)
        if ((x - cx) ** 2 + (y - cy) ** 2 <= rad * rad) set(x, y, r, g, b)
  }
  const line = (x0, y0, x1, y1, th, r, g, b) => {
    const steps = Math.ceil(Math.hypot(x1 - x0, y1 - y0))
    for (let i = 0; i <= steps; i++)
      disc(x0 + ((x1 - x0) * i) / steps, y0 + ((y1 - y0) * i) / steps, th / 2, r, g, b)
  }
  // Faint grid
  for (const gy of [45, 90, 135])
    for (let x = 18; x < size - 18 * s; x += 6 * s) set(Math.round(x), Math.round(gy * s), 26, 32, 42)
  // Amber rising price line
  const pts = [[28, 132], [62, 96], [92, 116], [152, 42]].map(([x, y]) => [x * s, y * s])
  for (let i = 0; i < pts.length - 1; i++)
    line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], 11 * s, 255, 176, 0)
  // Green terminal tick
  disc(152 * s, 42 * s, 8 * s, 34, 197, 94)
  return encodePng(size, size, px)
}

for (const [file, size] of [
  ['public/apple-touch-icon.png', 180],
  ['public/icon-192.png', 192],
  ['public/icon-512.png', 512],
]) {
  writeFileSync(file, makeIcon(size))
  console.log('wrote', file)
}
