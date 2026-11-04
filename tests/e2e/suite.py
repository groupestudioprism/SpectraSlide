async def run(pg, check, shot, ss, vp, OUT):
    await shot(pg, 'accueil')
    await pg.click('[data-tpl="blank"]'); await pg.wait_for_selector('#app:not([hidden])', timeout=10000); await pg.wait_for_timeout(1000)
    await shot(pg, 'editeur')
    check('éditeur ouvert', await ss(pg, 'D.slides.length') >= 1)
