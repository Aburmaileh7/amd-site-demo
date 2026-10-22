// All motion lives here. Without JS, or with reduced motion, the page is fully static.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const root = document.documentElement;

// header: transparent over hero, solid after it
const header = document.querySelector('[data-header]');
const onScroll = () => header && header.classList.toggle('is-solid', window.scrollY > 80);
onScroll(); window.addEventListener('scroll', onScroll, { passive: true });

// ---------- menu tabs (always on; motion only when allowed) ----------
const tabsEl = document.querySelector('[data-menu-tabs]');
if (tabsEl) {
  const tabs = [...tabsEl.querySelectorAll('[role="tab"]')];
  const ink = tabsEl.querySelector('[data-tabs-ink]');
  // the ink lives inside the scrolling tab row, so offsetLeft keeps it aligned (RTL too)
  const moveInk = (t, animate) => {
    if (!ink || !t) return;
    const to = { left: t.offsetLeft, width: t.offsetWidth };
    if (animate && !reduce) gsap.to(ink, { ...to, duration: .5, ease: 'power3.out' });
    else gsap.set(ink, to);
  };
  const select = (t, focus) => {
    const id = t.dataset.tab;
    tabs.forEach((b) => { const on = b === t; b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; });
    document.querySelectorAll('[data-panel-id]').forEach((pnl) => {
      const on = pnl.dataset.panelId === id;
      pnl.dataset.active = on;
      if (on && !reduce) {
        gsap.fromTo(pnl.querySelector('.panel-m__visual'), { opacity: 0, scale: .97 }, { opacity: 1, scale: 1, duration: .7, ease: 'power3.out' });
        gsap.fromTo(pnl.querySelectorAll('[data-item]'), { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: .55, ease: 'power3.out', stagger: .06 });
      }
    });
    if (focus) t.focus();
    t.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
    moveInk(t, true);
    window.ScrollTrigger && window.ScrollTrigger.refresh();
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(t));
    t.addEventListener('keydown', (e) => {
      // RTL: ArrowLeft = next, ArrowRight = previous
      const dir = e.key === 'ArrowLeft' ? 1 : e.key === 'ArrowRight' ? -1 : 0;
      if (dir) { e.preventDefault(); select(tabs[(i + dir + tabs.length) % tabs.length], true); }
    });
  });
  const current = () => tabs.find((t) => t.getAttribute('aria-selected') === 'true');
  window.addEventListener('load', () => moveInk(current(), false));
  window.addEventListener('resize', () => moveInk(current(), false));
  moveInk(current(), false);
}

// light that follows the pointer over menu items
document.querySelectorAll('[data-spot]').forEach((el) => {
  el.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
  });
  el.addEventListener('pointerleave', () => el.style.setProperty('--my', '-200px'));
});

// ---------- map dialog: iframe loads only when opened ----------
const dlg = document.querySelector('[data-map-dialog]');
if (dlg) {
  const frame = dlg.querySelector('iframe');
  document.querySelectorAll('[data-map-open]').forEach((b) => b.addEventListener('click', () => {
    if (!frame.src) frame.src = frame.dataset.src;
    dlg.showModal();
    if (!reduce) gsap.fromTo(dlg.querySelector('[data-map-box]'), { opacity: 0, y: 30, scale: .97 }, { opacity: 1, y: 0, scale: 1, duration: .5, ease: 'power3.out' });
  }));
  dlg.querySelector('[data-map-close]').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
}

// ---------- reviews rail: drag to scroll on desktop ----------
document.querySelectorAll('[data-rail]').forEach((rail) => {
  let down = false, sx = 0, sl = 0;
  rail.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') return; down = true; sx = e.clientX; sl = rail.scrollLeft; });
  window.addEventListener('pointerup', () => { down = false; });
  rail.addEventListener('pointermove', (e) => { if (down) rail.scrollLeft = sl - (e.clientX - sx); });
});

if (!reduce) {
  gsap.registerPlugin(ScrollTrigger);
  root.classList.add('js-motion');

  // hero: photo settles, title rises line by line, the rest follows
  gsap.from('[data-hero-media]', { scale: 1.14, duration: 2.4, ease: 'power3.out' });
  gsap.fromTo('.hero [data-line] > span', { y: 0, yPercent: 105 }, { yPercent: 0, duration: 1.2, ease: 'power4.out', delay: .25 });
  gsap.to('[data-hero-in]', { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: .1, delay: .55 });
  gsap.fromTo('[data-hero-side]', { clipPath: 'inset(12% 12% 12% 12% round 24px)', scale: 1.04 }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', scale: 1, duration: 1.6, ease: 'power3.out', delay: .2 });
  gsap.to('[data-hero-media]', { yPercent: 14, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  // generic reveals
  gsap.utils.toArray('[data-reveal]').forEach((el) => {
    gsap.to(el, { opacity: 1, y: 0, duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 86%' } });
  });
  gsap.utils.toArray('section:not(.hero) [data-line] > span').forEach((el) => {
    gsap.fromTo(el, { y: 0, yPercent: 105 }, { yPercent: 0, duration: 1.2, ease: 'power4.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
  });

  // parallax images
  gsap.utils.toArray('[data-parallax]').forEach((el) => {
    const amt = parseFloat(el.dataset.parallax) || 10;
    gsap.fromTo(el, { yPercent: -amt }, { yPercent: amt, ease: 'none',
      scrollTrigger: { trigger: el.closest('section') || el, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  // count-up numbers
  gsap.utils.toArray('[data-count]').forEach((el) => {
    const end = parseFloat(el.dataset.count), dec = parseInt(el.dataset.decimals || '0', 10);
    const obj = { v: 0 };
    gsap.to(obj, { v: end, duration: 1.8, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 85%' },
      onUpdate: () => { el.textContent = dec ? obj.v.toFixed(dec) : Math.round(obj.v).toLocaleString('en-US'); } });
  });

  // day story: pinned horizontal scroll on desktop only (RTL: track moves right)
  ScrollTrigger.matchMedia({
    '(min-width: 900px)': () => {
      const pin = document.querySelector('[data-story-pin]');
      const track = document.querySelector('[data-story-track]');
      if (!pin || !track) return;
      const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
      const tween = gsap.to(track, { x: () => dist(), ease: 'none',
        scrollTrigger: { trigger: pin, start: 'top top', end: () => '+=' + dist(), pin: true, scrub: .6, invalidateOnRefresh: true } });
      gsap.utils.toArray('[data-story-track] [data-panel] .photo img').forEach((img) => {
        gsap.fromTo(img, { scale: 1.15 }, { scale: 1, ease: 'none',
          scrollTrigger: { trigger: img, containerAnimation: tween, start: 'left right', end: 'center center', scrub: true } });
      });
      return () => tween.scrollTrigger && tween.scrollTrigger.kill();
    }
  });
} else {
  document.querySelectorAll('[data-reveal],[data-hero-in]').forEach((el) => { el.style.opacity = 1; el.style.transform = 'none'; });
}
