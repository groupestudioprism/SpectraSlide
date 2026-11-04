/* ---------- Vidéo : YouTube, Vimeo ou fichier (.mp4, .webm) — jouée en présentation, vignette dans l'éditeur ---------- */
function vidInfo(u){
  u = String(u || '').trim(); if (!/^https:\/\//i.test(u)) return null;
  let m = u.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([\w-]{11})/i);
  if (m) return {kind:'iframe', src:`https://www.youtube-nocookie.com/embed/${m[1]}?rel=0`, host:'YouTube', yt:m[1]};
  m = u.match(/vimeo\.com\/(?:video\/)?(\d{5,12})/i); if (m) return {kind:'iframe', src:`https://player.vimeo.com/video/${m[1]}`, host:'Vimeo'};
  if (/\.(mp4|webm|ogv|mov|m4v)(\?[^\s]*)?$/i.test(u)) return {kind:'file', src:u, host:(u.match(/^https:\/\/([^/]+)/i) || [])[1] || 'Fichier'};
  return null;
}
function videoHTML(e, o){
  const v = vidInfo(e.url), ph = `<div class="vidw ph"><svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="28" fill="rgb(0 0 0 / .55)"/><path d="M26 20v24l20-12z" fill="#fff"/></svg><span>${escH(v ? 'Vidéo · ' + v.host : e.url ? 'Adresse non reconnue' : 'Double-cliquez pour ajouter une vidéo')}</span></div>`;
  if (!v || !o.present) return ph;
  if (v.kind === 'file') return `<video class="vidw" src="${escH(v.src)}" controls playsinline preload="metadata"></video>`;
  return `<iframe class="vidw" src="${escH(v.src)}" title="Vidéo" allow="accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
}
function askVideo(id){
  const e = id ? elById(id) : null;
  SWAsk(e ? 'Changer la vidéo' : 'Insérer une vidéo', 'Adresse : YouTube, Vimeo ou lien direct vers un fichier .mp4 / .webm (https)', e?.url || '', e ? 'Appliquer' : 'Insérer', v => {
    v = String(v || '').trim(); if (v && !/^https?:\/\//i.test(v) && /^[\w.-]+\.[a-z]{2,}\//i.test(v)) v = 'https://' + v;
    if (!vidInfo(v)) return toast('Adresse non reconnue : collez un lien YouTube, Vimeo ou un fichier .mp4 en https');
    if (e){ setProps(x => { x.url = v; }, 'Vidéo', true); return; }
    const [W, H] = dims(), w = Math.round(W * .56), h = Math.round(w * 9 / 16), p = centerBox(w, h); addEls([{id:nid(), t:'video', x:p.x, y:p.y, w, h, url:v}], 'Vidéo');
  });
}
