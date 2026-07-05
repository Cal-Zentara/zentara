// THE NEW CAMPAIGN v3 — the continuous world.
// One sticky stage holds every painting; content covers and uncovers it.
// Native scroll, one rAF loop, smoothed values so the art glides while
// input stays instant. Zero libraries.

const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp01 = v => v < 0 ? 0 : v > 1 ? 1 : v;

const M = { y: scrollY, sy: scrollY, mx: 0, my: 0, smx: 0, smy: 0, subs: [], raf: 0, vh: innerHeight, on(f){ this.subs.push(f); } };

function tick(){
  M.raf = 0;
  const ks = RM ? 1 : 0.14, kp = RM ? 1 : 0.10;
  M.sy += (M.y - M.sy) * ks;
  M.smx += (M.mx - M.smx) * kp;
  M.smy += (M.my - M.smy) * kp;
  for (const f of M.subs) f(M);
  const settled = Math.abs(M.y - M.sy) < 0.05 && Math.abs(M.mx - M.smx) < 0.001 && Math.abs(M.my - M.smy) < 0.001;
  if (settled) { M.sy = M.y; M.smx = M.mx; M.smy = M.my; }
  else M.raf = requestAnimationFrame(tick);
}
const wake = () => { if (!M.raf) M.raf = requestAnimationFrame(tick); };
addEventListener('scroll', () => { M.y = Math.max(0, scrollY); wake(); }, { passive: true });
addEventListener('pointermove', e => {
  if (e.pointerType && e.pointerType !== 'mouse') return;
  M.mx = e.clientX / innerWidth * 2 - 1;
  M.my = e.clientY / innerHeight * 2 - 1;
  wake();
}, { passive: true });

// ---- chapters: each gap section drives one mural on the stage
const chapters = [];
document.querySelectorAll('section[data-mural]').forEach(sec => {
  const mural = document.getElementById(sec.dataset.mural);
  if (!mural) return;
  chapters.push({ sec, mural, pan: mural.querySelector('.pan'), vid: mural.querySelector('video[data-scrub]'), top: 0, h: 1 });
});
const tocLinks = [...document.querySelectorAll('#toc a')];
const sheet = document.querySelector('.sheet');
let sheetTop = 0, sheetH = 1;

function measure(){
  M.vh = innerHeight;
  for (const c of chapters){ const r = c.sec.getBoundingClientRect(); c.top = r.top + scrollY; c.h = r.height; }
  if (sheet){ const r = sheet.getBoundingClientRect(); sheetTop = r.top + scrollY; sheetH = r.height; }
  wake();
}
addEventListener('resize', measure, { passive: true });
addEventListener('load', measure);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
// late-loading videos and images grow the page and shift every section;
// re-measure whenever the document height changes so a mural is always
// behind the sheet's torn edges (no stale black gap)
if (window.ResizeObserver){
  let lastH = 0;
  const ro = new ResizeObserver(() => {
    const h = document.documentElement.scrollHeight;
    if (Math.abs(h - lastH) > 1){ lastH = h; measure(); }
  });
  ro.observe(document.documentElement);
}

chapters.forEach(c => { if (c.vid) { c.vid.pause(); c.vid.load(); } });

const FADE = 0.5; // crossfade band, fraction of viewport height

M.on(m => {
  const center = m.sy + m.vh * 0.5;
  const band = m.vh * FADE;
  for (let i = 0; i < chapters.length; i++){
    const c = chapters[i];
    // each mural HOLDS until the next mural takes over, so a painting is
    // always behind the sheet's torn edges (never a bare black gap)
    const start = c.top;
    const end = i + 1 < chapters.length ? chapters[i + 1].top : Infinity;
    // chapter 0 blooms in from the black drawing as you start to scroll
    const rampIn = i === 0 ? clamp01(m.sy / (m.vh * 0.85)) : clamp01((center - (start - band * 0.5)) / band);
    const rampOut = end === Infinity ? 1 : clamp01(((end + band * 0.5) - center) / band);
    const op = Math.min(rampIn, rampOut);
    c.mural.style.opacity = op.toFixed(3);
    if (op <= 0) continue;
    // runway progress within this mural's own section, for pan and scrub
    const p = clamp01((m.sy + m.vh - c.top) / (m.vh + c.h));
    if (c.pan && !RM){
      const panPx = m.vh * 0.16;
      const ty = (p - 0.5) * panPx + m.smy * 8;
      const tx = m.smx * 10;
      c.pan.style.transform = `translate3d(${tx.toFixed(1)}px,${ty.toFixed(1)}px,0) scale(${(1.07 - p * 0.05).toFixed(4)})`;
    }
    if (c.vid && c.vid.readyState >= 1 && c.vid.duration){
      const t = p * (c.vid.duration - 0.05);
      if (Math.abs(c.vid.currentTime - t) > 0.02) c.vid.currentTime = t;
    }
  }
  // toc highlight + color flip while the sheet owns the screen
  let cur = null;
  for (const c of chapters) if (center >= c.top && center < c.top + c.h) cur = c.sec.id;
  if (sheet){
    const overSheet = center >= sheetTop && center < sheetTop + sheetH;
    const toc = document.getElementById('toc');
    if (toc) toc.classList.toggle('over-sheet', overSheet);
    if (overSheet){
      const workEl = document.getElementById('work');
      const wr = workEl ? workEl.offsetHeight : sheetH / 2;
      cur = center < sheetTop + wr ? 'work' : 'services';
    }
  }
  tocLinks.forEach(a => a.classList.toggle('on', a.dataset.act === cur));
});

// reveals
const io = new IntersectionObserver(es => {
  es.forEach(e => { if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
}, { threshold: 0.18 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// hero title letters (the nbsp below is intentional; a plain space collapses)
function splitLetters(el){
  if (!el || RM) return;
  const frag = document.createDocumentFragment();
  let i = 0;
  [...el.childNodes].forEach(n => {
    const cls = n.nodeType === 1 ? n.className : '';
    for (const ch of n.textContent){
      const sp = document.createElement('span');
      sp.className = 'ltr' + (cls ? ' ' + cls : '');
      sp.style.transitionDelay = (i++ * 45) + 'ms';
      sp.textContent = ch === ' ' ? ' ' : ch;
      frag.appendChild(sp);
    }
  });
  el.textContent = '';
  el.appendChild(frag);
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('ltr-in')));
}
splitLetters(document.querySelector('.hero-pre'));

// work wall videos: play only on screen
const vio = new IntersectionObserver(es => es.forEach(e => {
  const v = e.target;
  if (e.isIntersecting){ v.play().catch(() => {}); } else { v.pause(); }
}), { threshold: 0.25 });
document.querySelectorAll('#work video').forEach(v => vio.observe(v));

// counter
const num = document.querySelector('.ui-num');
if (num){
  const nio = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    nio.disconnect();
    let n = 0;
    const step = () => { n += Math.ceil((2400 - n) / 14); num.textContent = n.toLocaleString(); if (n < 2400) requestAnimationFrame(step); };
    step();
  }), { threshold: 0.5 });
  nio.observe(num);
}

// act IV mockups: gentle pointer float
if (!RM) document.querySelectorAll('#services .ui[data-depth]').forEach(ui => {
  const d = +ui.dataset.depth || 0.4;
  M.on(m => { ui.style.transform = `translate3d(${(m.smx * d * 10).toFixed(1)}px,${(m.smy * d * 8).toFixed(1)}px,0)`; });
});

// sent message check
if (location.search.includes('sent=1')){
  const msg = document.getElementById('sent-msg');
  if (msg){ msg.hidden = false; msg.scrollIntoView({ block: 'center' }); }
}

measure();
wake();
