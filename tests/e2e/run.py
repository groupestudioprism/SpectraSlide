#!/usr/bin/env python3
"""Tests de bout en bout de SPECTRA Slide (démo autonome dist/spectraslide-demo.html, Chromium via Playwright).

  python3 tools/build.py && python3 tests/e2e/run.py [--shots]

Crée un compte de démo, ouvre l'éditeur et vérifie chaque fonction (formes, textes, transitions, animations, graphiques,
médias, mode présentateur, exports…) sans erreur JavaScript. Captures dans tests/e2e/out/ avec --shots.
"""
import asyncio, functools, http.server, pathlib, sys, threading, json
from playwright.async_api import async_playwright

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / 'tests' / 'e2e' / 'out'; OUT.mkdir(parents=True, exist_ok=True)
SHOTS = '--shots' in sys.argv
RES = {'ok': 0, 'ko': 0, 'fails': []}
def check(name, cond, info=''):
    if cond: RES['ok'] += 1; print('  ✓', name)
    else: RES['ko'] += 1; RES['fails'].append(name); print('  ✗', name, info)
def serve():
    class Q(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a): pass
    h = functools.partial(Q, directory=str(ROOT))
    s = http.server.ThreadingHTTPServer(('127.0.0.1', 0), h); threading.Thread(target=s.serve_forever, daemon=True).start()
    return f'http://127.0.0.1:{s.server_port}/dist/spectraslide-demo.html'
async def shot(pg, name):
    if SHOTS: await pg.screenshot(path=str(OUT / f'{name}.png'))
async def ss(pg, code):  # code exécuté dans la portée de l'éditeur (démo uniquement)
    return await pg.evaluate('c => window.__SS(c)', code)

async def signup(pg):
    await pg.wait_for_selector('#auth:not([hidden]) .ap-tabs', timeout=25000)
    await pg.click('[data-go="signup"]'); await pg.fill('#ap-first', 'Kéliann'); await pg.fill('#ap-last', 'Mauger')
    await pg.fill('#ap-email', 'test@studioprism.fr'); await pg.fill('#ap-pw', 'Spectra2026'); await pg.fill('#ap-pw2', 'Spectra2026')
    await pg.check('#ap-cgu'); await pg.click('#apForm button[type=submit]')
    try:
        await pg.wait_for_selector('#ap-phone', timeout=5000); await pg.fill('#ap-phone', '06 12 34 56 78'); await pg.click('#apForm button[type=submit]')
    except Exception: pass
    try:
        await pg.wait_for_selector('#apSkip', timeout=5000); await pg.click('#apSkip')
    except Exception: pass
    await pg.wait_for_selector('#home:not([hidden])', timeout=10000); await pg.wait_for_timeout(600)

async def main():
    url = serve(); errs = []
    import importlib.util
    spec = importlib.util.spec_from_file_location('suite', ROOT / 'tests' / 'e2e' / 'suite.py'); suite = importlib.util.module_from_spec(spec); spec.loader.exec_module(suite)
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for vp in ([{'width': 1440, 'height': 900}] + ([{'width': 390, 'height': 844}] if '--mobile' in sys.argv else [])):
            ctx = await b.new_context(viewport=vp, accept_downloads=True); pg = await ctx.new_page()
            pg.on('pageerror', lambda e: errs.append(str(e)))
            pg.on('console', lambda m: m.type == 'error' and not any(x in m.text for x in ('fonts.g', 'ERR_', 'net::', 'Failed to load resource')) and errs.append('console: ' + m.text))
            await pg.goto(url + '?intro=0'); await signup(pg)
            await suite.run(pg, check, shot, ss, vp, OUT)
            await ctx.close()
        await b.close()
    check('aucune erreur JavaScript', not errs, '\n    ' + '\n    '.join(errs[:15]))
    print(f"\n{RES['ok']} réussis, {RES['ko']} échoués" + (f" : {', '.join(RES['fails'])}" if RES['fails'] else ''))
    sys.exit(1 if RES['ko'] else 0)
asyncio.run(main())
