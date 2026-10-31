import { writeFile } from 'node:fs/promises';
import { deflateSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const out = resolve(fileURLToPath(new URL('../web/', import.meta.url)));
const green = [25, 135, 121], white = [255, 255, 255], gold = [255, 213, 123];
const disk = (x, y, cx, cy, r) => (x - cx) ** 2 + (y - cy) ** 2 <= r ** 2;
const rounded = (x, y) => {
  const dx = Math.max(.18 - x, 0, x - .82), dy = Math.max(.18 - y, 0, y - .82);
  return dx * dx + dy * dy <= .18 ** 2;
};
const colorAt = (x, y) => {
  if (!rounded(x, y)) return [0, 0, 0, 0];
  if (disk(x, y, .735, .70, .075)) return [...gold, 255];
  const stem = x >= .27 && x <= .41 && y >= .28 && y <= .69;
  const head = x >= .33 && x <= .52 && y >= .28 && y <= .51 || disk(x, y, .52, .395, .115);
  const hole = disk(x, y, .52, .395, .045);
  return [...((stem || head) && !hole ? white : green), 255];
};
const crcTable = Array.from({ length: 256 }, (_, i) => {
  let c = i;
  for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buffer) => {
  let c = 0xffffffff;
  for (const byte of buffer) c = crcTable[(c ^ byte) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const name = Buffer.from(type);
  const size = Buffer.alloc(4); size.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([size, name, data, crc]);
};

for (const size of [192, 512]) {
  const scanlines = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const samples = [[.25, .25], [.75, .25], [.25, .75], [.75, .75]];
      const colors = samples.map(([sx, sy]) => colorAt((x + sx) / size, (y + sy) / size));
      const offset = y * (size * 4 + 1) + 1 + x * 4;
      for (let channel = 0; channel < 4; channel++) {
        scanlines[offset + channel] = Math.round(colors.reduce((sum, color) => sum + color[channel], 0) / 4);
      }
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0); header.writeUInt32BE(size, 4); header[8] = 8; header[9] = 6;
  const png = Buffer.concat([Buffer.from('89504e470d0a1a0a', 'hex'), chunk('IHDR', header), chunk('IDAT', deflateSync(scanlines)), chunk('IEND', Buffer.alloc(0))]);
  await writeFile(resolve(out, `icon-${size}.png`), png);
}
