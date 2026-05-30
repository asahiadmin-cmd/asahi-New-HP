import { createServer } from 'node:http';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');
const siteOrigin = 'https://asahi1.co.jp';

const routes = [
    '/',
    '/news',
    '/company',
    '/staff',
    '/facilities',
    '/recruit',
    '/contact',
];

const browserCandidates = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
].filter(Boolean);

const mimeTypes = {
    '.css': 'text/css; charset=utf-8',
    '.gif': 'image/gif',
    '.html': 'text/html; charset=utf-8',
    '.ico': 'image/x-icon',
    '.jpeg': 'image/jpeg',
    '.jpg': 'image/jpeg',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.mov': 'video/quicktime',
    '.mp4': 'video/mp4',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.txt': 'text/plain; charset=utf-8',
    '.webm': 'video/webm',
    '.xml': 'application/xml; charset=utf-8',
};

const findBrowserExecutable = () => {
    const match = browserCandidates.find((candidate) => fs.existsSync(candidate));
    if (!match) {
        throw new Error(`Browser executable not found. Checked: ${browserCandidates.join(', ')}`);
    }
    return match;
};

const getOutputPath = (route) => (
    route === '/'
        ? path.join(distDir, 'index.html')
        : path.join(distDir, route.replace(/^\/+/, ''), 'index.html')
);

const getPublicRouteUrl = (route) => (
    route === '/' ? `${siteOrigin}/` : `${siteOrigin}${route}`
);

const serveStaticFile = async (requestPath) => {
    const normalizedPath = decodeURIComponent(requestPath.split('?')[0]);
    const asFile = normalizedPath.endsWith('/')
        ? `${normalizedPath}index.html`
        : normalizedPath;
    const candidate = path.join(distDir, asFile.replace(/^\/+/, ''));

    try {
        const fileStats = await stat(candidate);
        if (fileStats.isFile()) {
            return candidate;
        }
    } catch {
        // Ignore and fall back to SPA entry.
    }

    return path.join(distDir, 'index.html');
};

const startStaticServer = () => {
    const server = createServer(async (req, res) => {
        try {
            const filePath = await serveStaticFile(req.url || '/');
            const extension = path.extname(filePath).toLowerCase();
            const content = await readFile(filePath);
            res.writeHead(200, { 'Content-Type': mimeTypes[extension] || 'application/octet-stream' });
            res.end(content);
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end(`Prerender server error: ${error.message}`);
        }
    });

    return new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(4173, '127.0.0.1', () => resolve(server));
    });
};

const waitForAppReady = async (page) => {
    try {
        await page.waitForFunction(
            () => !document.getElementById('loading'),
            { timeout: 15000 }
        );
    } catch {
        // Keep prerendering even if the loading mask stays up.
    }

    await page.waitForFunction(
        () => document.querySelector('#root')?.children.length > 0,
        { timeout: 15000 }
    );
    await new Promise((resolve) => setTimeout(resolve, 300));
};

const prerenderRoute = async (browser, baseUrl, route) => {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1200, deviceScaleFactor: 1 });
    await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle0' });
    await waitForAppReady(page);

    const rawHtml = await page.evaluate(() => `<!DOCTYPE html>\n${document.documentElement.outerHTML}`);
    const publicRouteUrl = getPublicRouteUrl(route);
    const html = rawHtml
        .replaceAll(baseUrl, siteOrigin)
        .replace(/<link rel="canonical" href="[^"]*">/i, `<link rel="canonical" href="${publicRouteUrl}">`)
        .replace(/<meta property="og:url" content="[^"]*">/i, `<meta property="og:url" content="${publicRouteUrl}">`);
    const outputPath = getOutputPath(route);
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, html, 'utf8');
    await page.close();

    console.log(`Prerendered ${route} -> ${path.relative(projectRoot, outputPath)}`);
};

const run = async () => {
    const browserExecutable = findBrowserExecutable();
    const server = await startStaticServer();
    const baseUrl = 'http://127.0.0.1:4173';
    const browser = await puppeteer.launch({
        executablePath: browserExecutable,
        headless: true,
        args: ['--disable-gpu', '--no-sandbox'],
    });

    try {
        for (const route of routes) {
            await prerenderRoute(browser, baseUrl, route);
        }
    } finally {
        await browser.close();
        await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    }
};

run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
