// loader
window.addEventListener('load', () => {
  const l = document.getElementById('loader');
  if (l) { l.classList.add('done'); setTimeout(() => l.remove(), 480); }
});

// cursor glow with eased follow
(() => {
  const glow = document.getElementById('glow');
  if (!glow || matchMedia('(hover: none)').matches) return;
  let tx = innerWidth / 2, ty = innerHeight / 2, x = tx, y = ty;
  addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; });
  (function loop() {
    x += (tx - x) * .12; y += (ty - y) * .12;
    glow.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
    requestAnimationFrame(loop);
  })();
})();

const easeReveal = (els, base = 0) => els.forEach((el, i) => {
  el.style.transitionDelay = `${base + i * 50}ms`;
  requestAnimationFrame(() => el.classList.add('in'));
});

document.querySelectorAll('.headline span').forEach(s => s.classList.add('word'));
window.addEventListener('load', () => {
  easeReveal([...document.querySelectorAll('.headline .word, #hero .sub, #hero .cta')]);
});

const io = new IntersectionObserver(entries => entries.forEach(e => {
  if (!e.isIntersecting) return;
  const sibs = [...e.target.parentElement.querySelectorAll('.reveal')];
  easeReveal(sibs);
  sibs.forEach(el => io.unobserve(el));
}), { threshold: 0.2 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

const vidIo = new IntersectionObserver(entries => entries.forEach(e => {
  const v = e.target;
  if (e.isIntersecting) { v.play().catch(() => {}); } else { v.pause(); }
}), { threshold: 0.5 });
document.querySelectorAll('.tile video').forEach(v => vidIo.observe(v));

if (new URLSearchParams(location.search).get('sent')) {
  const f = document.getElementById('lead-form');
  const m = document.getElementById('sent-msg');
  if (f && m) { f.hidden = true; m.hidden = false; document.getElementById('contact').scrollIntoView(); }
}
