/* ---------- Pied de page : numéro, date et texte sur toutes les diapositives (D.foot {num, date, text, skip}) ---------- */
const footParts = (s, i) => {
  const f = D?.foot; if (!f || (f.skip !== false && s.v === 'title')) return null;
  const l = [f.text || '', f.date ? new Date().toLocaleDateString('fr-FR', {day:'numeric', month:'long', year:'numeric'}) : '', f.num ? String(i + 1) : ''];
  return l.some(Boolean) ? l : null;
};
function footHTML(s, W, H){
  const i = D.slides.indexOf(s), p = footParts(s, i); if (!p) return '';
  const k = W / H < 1.5 ? W / 1280 * 1.22 : Math.min(W / 1280, H / 720), M = Math.round(80 * W / 1280), fs = Math.max(11, Math.round(14 * k));
  return `<div class="sl-foot" style="left:${M}px;right:${M}px;bottom:${Math.round(22 * k)}px;font-size:${fs}px">${p.map((t, j) => `<span class="ft${j}">${escH(t)}</span>`).join('')}</div>`;
}
function footPanelHTML(){
  const f = D.foot || {};
  return `<h4 class="pn-h">Pied de page <small>sur toutes les diapositives</small></h4><div class="fm-foot">
    <label class="pop-toggle"><input type="checkbox" data-foot="num" ${f.num ? 'checked' : ''}><div><b>Numéro de diapositive</b></div></label>
    <label class="pop-toggle"><input type="checkbox" data-foot="date" ${f.date ? 'checked' : ''}><div><b>Date du jour</b></div></label>
    <label class="fm-txt"><span>Texte</span><input type="text" data-foot="text" maxlength="120" value="${escH(f.text || '')}" placeholder="Nom de la société, titre court…"></label>
    <label class="pop-toggle"><input type="checkbox" data-foot="skip" ${f.skip !== false ? 'checked' : ''}><div><b>Pas sur la couverture</b></div></label></div>`;
}
function wireFoot(b){
  b.querySelectorAll('[data-foot]').forEach(i => { i.onchange = () => {
    if (V.ro) return; const f = {...(D.foot || {})}, k = i.dataset.foot, v = i.type === 'checkbox' ? i.checked : i.value.trim();
    if (k === 'skip') f.skip = v ? undefined : false; else f[k] = v || undefined;
    ['num', 'date', 'text'].forEach(q => { if (!f[q]) delete f[q]; });
    if (f.skip === undefined) delete f.skip; D.foot = f.num || f.date || f.text ? f : undefined; if (!D.foot) delete D.foot; THUMB.clear(); renderAll(); commit('Pied de page'); }; });
}
