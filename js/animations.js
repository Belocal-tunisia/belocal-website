// Belocal — all site animations, powered by Framer Motion's DOM API.
// Scroll-triggered fades, staggered reveals and hover/press transitions.
import { animate, inView, stagger, hover, press } from './framer-motion-dom.min.js';

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Shared motion language
const EASE = [0.2, 0.7, 0.3, 1];
const SPRING = { type: 'spring', stiffness: 380, damping: 26, mass: 0.8 };
const QUICK = { duration: 0.3, ease: EASE };
const T = (t) => (reduced ? { duration: 0 } : t);

// Elements start hidden via the `.motion-pending` CSS (see index.html) so there's no flash.
const show = (el) => { el.style.opacity = 1; el.style.transform = 'none'; };

/* ------------------------------------------------------------------ */
/* 1. Hero entrance (runs on load, staggered)                          */
/* ------------------------------------------------------------------ */
function heroEntrance() {
  const items = document.querySelectorAll('[data-hero]');
  const art = document.querySelector('.hero-badge');
  const stamp = document.querySelector('.hero-stamp');

  if (reduced) { items.forEach(show); [art, stamp].forEach((el) => el && show(el)); return; }

  animate(items, { opacity: [0, 1], y: [24, 0] },
    { duration: 0.8, ease: EASE, delay: stagger(0.1, { startDelay: 0.1 }) });

  if (art) animate(art, { opacity: [0, 1], scale: [0.92, 1], rotate: [-4, 0] },
    { duration: 1.1, ease: EASE, delay: 0.25 });

  if (stamp) animate(stamp, { opacity: [0, 1], scale: [0.6, 1], rotate: [-30, -9] },
    { ...SPRING, stiffness: 220, damping: 14, delay: 0.75 });

  // Gentle line-draw on the hero illustration
  document.querySelectorAll('.hero-badge svg path, .hero-badge svg line').forEach((p, i) => {
    const len = p.getTotalLength ? p.getTotalLength() : 0;
    if (!len) return;
    p.style.strokeDasharray = len;
    animate(p, { strokeDashoffset: [len, 0] }, { duration: 1.6, ease: EASE, delay: 0.5 + i * 0.08 });
  });
}

/* ------------------------------------------------------------------ */
/* 2. Scroll-triggered fades & staggered reveals                       */
/* ------------------------------------------------------------------ */
function scrollReveals() {
  // Single elements: fade + rise once when ~20% visible
  document.querySelectorAll('[data-reveal]').forEach((el) => {
    if (reduced) return show(el);
    inView(el, () => {
      animate(el, { opacity: [0, 1], y: [28, 0] }, { duration: 0.8, ease: EASE });
    }, { amount: 0.2 });
  });

  // Groups: children reveal one after another
  document.querySelectorAll('[data-stagger]').forEach((group) => {
    const kids = group.querySelectorAll(':scope > *');
    if (reduced) return kids.forEach(show);
    const step = parseFloat(group.dataset.stagger) || 0.1;
    inView(group, () => {
      animate(kids, { opacity: [0, 1], y: [26, 0] },
        { duration: 0.7, ease: EASE, delay: stagger(step) });
    }, { amount: 0.15 });
  });
}

/* ------------------------------------------------------------------ */
/* 3. Hover & press transitions on interactive elements                */
/* ------------------------------------------------------------------ */
// Animates to `to` on hover start and back to the element's resting values on hover end.
function hoverTo(selector, to, transition = SPRING) {
  document.querySelectorAll(selector).forEach((el) => {
    let from; // resting values, captured once so quick re-hovers can't record a mid-animation state
    hover(el, () => {
      if (!from) {
        const cs = getComputedStyle(el);
        from = {};
        for (const k of Object.keys(to)) {
          if (k === 'y' || k === 'x') from[k] = 0;
          else if (k === 'scale') from[k] = 1;
          else if (k === 'rotate') from[k] = el.dataset.restRotate ? +el.dataset.restRotate : 0;
          else from[k] = cs[k];
        }
      }
      animate(el, to, T(transition));
      return () => animate(el, from, T(transition));
    });
  });
}

function pressScale(selector, scale = 0.97) {
  document.querySelectorAll(selector).forEach((el) => {
    press(el, () => {
      animate(el, { scale }, T({ duration: 0.12 }));
      return () => animate(el, { scale: 1 }, T(SPRING));
    });
  });
}

function interactions() {
  // Buttons
  hoverTo('.btn-primary', { y: -2, backgroundColor: '#9C6A17', boxShadow: '0 16px 32px rgba(198,135,31,0.42)' });
  hoverTo('.btn-ghost', { y: -2, backgroundColor: 'rgba(44,107,96,0.08)' });
  hoverTo('.btn-dark', { y: -2, backgroundColor: '#2a1d13' });
  pressScale('.btn');

  // Trip card CTAs: fill with ochre
  hoverTo('.trip-cta a', { backgroundColor: '#C6871F', color: '#F8F1E2', y: -1 }, QUICK);
  pressScale('.trip-cta a');

  // Cards lift
  hoverTo('.trip-card', { y: -6, boxShadow: '0 26px 54px rgba(55,40,27,0.2)' });
  hoverTo('.info-card', { y: -3, borderColor: 'rgba(55,40,27,0.28)' });

  // Trip photo slow zoom inside the card
  document.querySelectorAll('.trip-card').forEach((card) => {
    hover(card, () => {
      const img = card.querySelector('.trip-placeholder img');
      if (!img) return;
      animate(img, { scale: 1.06 }, T({ duration: 0.9, ease: EASE }));
      return () => animate(img, { scale: 1 }, T({ duration: 0.7, ease: EASE }));
    });
  });

  // Mood checkboxes nudge
  hoverTo('.checkbox-list .checkbox-item', { x: 3 }, QUICK);

  // Hero stamp wobble, brand logo spin
  const stamp = document.querySelector('.hero-stamp');
  if (stamp) { stamp.dataset.restRotate = -9; hoverTo('.hero-stamp', { rotate: 0, scale: 1.06 }); }
  hoverTo('.brand img', { rotate: 12, scale: 1.05 });

  // Nav + footer links: animated underline (replaces the old CSS ::after transition)
  document.querySelectorAll('.nav-links a').forEach((a) => {
    const bar = document.createElement('span');
    bar.className = 'link-underline';
    bar.setAttribute('aria-hidden', 'true');
    a.appendChild(bar);
    hover(a, () => {
      animate(bar, { scaleX: 1 }, T(QUICK));
      return () => animate(bar, { scaleX: 0 }, T(QUICK));
    });
  });
  hoverTo('footer a', { color: '#F3E9D6' }, QUICK);

  // Form fields: focus ring colour
  document.querySelectorAll('.form-group input, .form-group textarea').forEach((f) => {
    const rest = getComputedStyle(f).borderColor;
    f.addEventListener('focus', () => animate(f, { borderColor: '#C6871F' }, T(QUICK)));
    f.addEventListener('blur', () => animate(f, { borderColor: rest }, T(QUICK)));
  });
}

/* ------------------------------------------------------------------ */
/* 4. Hooks used by the inline form script                             */
/* ------------------------------------------------------------------ */
window.belocalMotion = {
  showSuccess(el) {
    el.classList.add('show');
    animate(el, { opacity: [0, 1], y: [-10, 0], scale: [0.98, 1] }, T(SPRING));
  },
  hideSuccess(el) {
    animate(el, { opacity: 0, y: -6 }, T(QUICK)).then(() => el.classList.remove('show'));
  },
  fade(el, opacity) { return animate(el, { opacity }, T({ duration: 0.4, ease: EASE })); },
};

heroEntrance();
scrollReveals();
interactions();
// Note: `motion-pending` stays on <html>; every hidden element is revealed by its own animation.
window.__belocalMotionReady = true;
