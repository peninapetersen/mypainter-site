/**
 * Print quotes/MP-130.html → quotes/MP-130.pdf (A4, toolbar hidden).
 * Run from repo root: node scripts/render-quote-pdf.mjs
 */
import { createServer } from 'node:http';
import { readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const root = join(fileURLToPath(new URL('..', import.meta.url)));
const port = 9876;

const mime = {
	'.html': 'text/html; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.png': 'image/png',
	'.svg': 'image/svg+xml',
	'.jpg': 'image/jpeg',
};

function handler(req, res) {
	const path = join(root, decodeURIComponent((req.url || '/').split('?')[0]));
	try {
		const st = statSync(path);
		if (!st.isFile()) {
			res.writeHead(404);
			res.end('Not found');
			return;
		}
		const ext = extname(path);
		res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' });
		res.end(readFileSync(path));
	} catch {
		res.writeHead(404);
		res.end('Not found');
	}
}

const server = createServer(handler);
await new Promise((resolve) => server.listen(port, resolve));

try {
	const browser = await puppeteer.launch({ headless: true });
	const page = await browser.newPage();
	await page.goto(`http://127.0.0.1:${port}/quotes/MP-130.html`, {
		waitUntil: 'networkidle0',
	});
	await page.emulateMediaType('print');
	await page.pdf({
		path: join(root, 'quotes/MP-130.pdf'),
		format: 'A4',
		printBackground: true,
		margin: { top: 0, right: 0, bottom: 0, left: 0 },
	});
	await browser.close();
	console.log('Wrote quotes/MP-130.pdf');
} finally {
	server.close();
}
