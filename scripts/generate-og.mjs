import { readFileSync, writeFileSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';

const svg = readFileSync(new URL('../public/og-image.svg', import.meta.url), 'utf8');
const image = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
writeFileSync(new URL('../public/og-image.png', import.meta.url), image);
