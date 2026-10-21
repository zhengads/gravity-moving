import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const data = (relative, mime) => `data:${mime};base64,${fs.readFileSync(path.join(root, relative)).toString('base64')}`;
const template = read('src/template.html');
const fontCss = `@font-face{font-family:NotoSC;src:url('${data('src/fonts/NotoSansSC.woff2','font/woff2')}') format('woff2');font-display:block;font-weight:100 900}`;
const htmlBody = template
  .replace('/* FONT_INLINE */', fontCss)
  .replace('/* STYLE_INLINE */', read('src/style.css'))
  .replace('/* MATTER_INLINE */', read('node_modules/matter-js/build/matter.min.js'))
  .replace('/* GAME_INLINE */', `${read('src/pixel-art.js')}\n${read('src/app.js')}`);
const licenses = [
  'Smiley Sans / Copyright 2022–2024 atelierAnchor / SIL Open Font License 1.1',
  read('src/fonts/SmileySans-OFL.txt'),
  'Noto Sans SC / Copyright 2012 Google Inc. and contributors / SIL Open Font License 1.1',
  read('src/fonts/NotoSansSC-OFL.txt'),
].join('\n');
const html = `<!--\n${licenses.replaceAll('-->', '-- &gt;')}\n-->\n${htmlBody}`;

if (html.includes('/* STYLE_INLINE */') || html.includes('/* MATTER_INLINE */') || html.includes('/* GAME_INLINE */')) {
  throw new Error('Build placeholder remains');
}
fs.writeFileSync(path.join(root, 'index.html'), html, 'utf8');
console.log(`Built index.html (${Buffer.byteLength(html)} bytes)`);
