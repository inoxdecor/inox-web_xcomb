(() => {
  'use strict';
  // Entry keeps the headline visible; scrolling moves the panel aside for details.
  // scrub:true maps scroll directly: stopping scroll freezes the strip immediately.
  const settings = Object.freeze({ scrollLength: 3.6, coverStart: .12, coverEnd: .43, detailsStart: .30, detailsEnd: .46, lensStart: .54, lensEnd: .76 });
  window.PANEL_CINEMATIC = settings;
  const section = document.querySelector('#panel-journey');
  if (!section || !window.gsap || !window.ScrollTrigger) return;
  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);
  const $ = s => section.querySelector(s);
  const product = $('.pc-product'), copy = $('.pc-copy');
  const lens = $('.pc-lens'), callout = $('.pc-callout'), curl = $('.pc-curl'), corner = $('.pc-corner');
  const rows = [...section.querySelectorAll('.pc-rows button')];
  const details = [$('.pc-description'), $('.pc-rows')];
  const state = { cover: 1, lens: 1, cells: 1 };
  let trigger, disposed = false;
  const media = gsap.matchMedia();
  const clamp = n => Math.max(0, Math.min(1, n));
  const easeCover = gsap.parseEase('power2.inOut');
  const phase = (p, start, end) => clamp((p - start) / (end - start));
  function renderCover() {
    // Travel by physical edge length: first short face, then around the corner.
    const distance = state.cover * (719 + 1031);
    const a = clamp(distance / 719), b = clamp((distance - 719) / 1031);
    $('.pc-mask-left').setAttribute('width', 694 * a);
    $('.pc-mask-right').setAttribute('width', 992 * b);
    corner.style.opacity = b > 0 ? '1' : '0';
    const moving = state.cover > 0 && state.cover < 1;
    curl.style.display = moving ? 'block' : 'none';
    if (moving) {
      const short = distance < 719, t = short ? a : b;
      const x = short ? 45 + 694 * t : 739 + 992 * t;
      const y = short ? 375 + 189 * t : 564 - 279 * t;
      const h = short ? 139 + 20 * t : 159 - 33 * t;
      curl.setAttribute('d', `M${x - 30} ${y - 3} Q${x + 16} ${y + 16} ${x + 20} ${y - 4} L${x + 20} ${y + h - 5} Q${x + 6} ${y + h + 15} ${x - 30} ${y + h + 1}Z`);
    }
    section.dataset.cover = state.cover.toFixed(4);
  }
  function renderLens() {
    // Explicit source-space pivots avoid nested SVG transform-origin drift.
    lens.setAttribute('transform', `translate(1320 260) scale(${state.lens}) translate(-1320 -260)`);
    $('.pc-cells').setAttribute('transform', `translate(1320 260) scale(${state.cells}) translate(-1320 -260)`);
  }
  const navigate = event => {
    if (trigger) window.scrollTo({ top: trigger.start + (trigger.end - trigger.start) * Number(event.currentTarget.dataset.progress), behavior: 'smooth' });
    else {
      rows.forEach(row => row.setAttribute('aria-pressed', String(row === event.currentTarget)));
      state.cover = 1;
      state.lens = event.currentTarget === rows[1] ? 1 : .04;
      renderCover(); renderLens();
    }
  };
  rows.forEach(row => row.addEventListener('click', navigate));
  async function initialize() {
    // Keep the complete static presentation until the actual source image decodes.
    const image = new Image(); image.src = '/assets/original-aluminium-panel.png';
    try { await image.decode(); } catch { return; }
    if (disposed) return;
    media.add({ mobile: '(max-width:767px)', desktop: '(min-width:768px)', reduce: '(prefers-reduced-motion:reduce)' }, context => {
      if (context.conditions.reduce) return;
      const mobile = context.conditions.mobile;
      rows.forEach(row => row.removeAttribute('aria-pressed'));
      section.classList.add('pc-animated');
      state.cover = 0; renderCover();
      state.lens = .04; state.cells = .97; renderLens();
      copy.inert = false; copy.removeAttribute('aria-hidden');
      gsap.set(product, { left: '50%', top: mobile ? '33%' : '49%', width: mobile ? '78%' : '46%', xPercent: -50, yPercent: -50, x: 0, y: 0 });
      gsap.set(copy, { autoAlpha: 1, yPercent: mobile ? 0 : -50, y: 0 });
      gsap.set(details, { autoAlpha: 0, y: 16 });
      details.forEach(el => { el.inert = true; el.setAttribute('aria-hidden', 'true'); });
      gsap.set($('.pc-hint'), { left: '50%' });
      gsap.set($('.pc-hint'), { autoAlpha: 1 });
      gsap.set(callout, { autoAlpha: 0 });
      gsap.set($('.pc-leader'), { strokeDasharray: 1, strokeDashoffset: 1 });
      gsap.set($('.pc-progress span'), { scaleX: 0 });
      const updateStudy = p => {
        // Derive all physical geometry from progress, including after resize or
        // preference changes. No cached tween start values can reopen the strip.
        state.cover = easeCover(phase(p, settings.coverStart, settings.coverEnd));
        state.lens = .04 + .96 * easeCover(phase(p, settings.lensStart + .06, settings.lensEnd));
        state.cells = .97 + .09 * phase(p, .64, .88);
        renderCover(); renderLens();
        details.forEach(el => {
          const visible = p > settings.detailsStart;
          el.inert = !visible;
          el.setAttribute('aria-hidden', String(!visible));
        });
        const step = p < settings.coverStart ? -1 : p < settings.coverEnd ? 0 : p < settings.lensStart ? 2 : 1;
        rows.forEach((row, i) => { if (step === i) row.setAttribute('aria-current', 'step'); else row.removeAttribute('aria-current'); });
        $('.pc-state').textContent = p < settings.coverStart ? 'EXPOSED CORE' : p < settings.coverEnd ? 'CLOSING THE EDGE' : p < settings.lensStart ? 'REFINED OUTSIDE' : 'THE ENGINEERING WITHIN';
      };
      const timeline = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: {
        id: 'panel-cinematic', trigger: section, start: 'top top', pin: true, scrub: true, refreshPriority: 2,
        end: () => `+=${$('.pc-stage').offsetHeight * settings.scrollLength}`,
        invalidateOnRefresh: true, anticipatePin: 1,
        onUpdate: self => updateStudy(self.progress),
        onRefresh: self => updateStudy(self.progress),
      } });
      trigger = timeline.scrollTrigger;
      timeline.to({}, { duration: 1 }, 0)
        .to(product, { left: mobile ? '50%' : '73%', top: mobile ? '29%' : '49%', duration: settings.coverEnd - settings.coverStart, ease: 'power2.inOut' }, settings.coverStart)
        .to(details, { autoAlpha: 1, y: 0, duration: settings.detailsEnd - settings.detailsStart, ease: 'sine.inOut' }, settings.detailsStart)
        .to($('.pc-hint'), { left: mobile ? '50%' : '73%', duration: settings.coverEnd - settings.coverStart, ease: 'power2.inOut' }, settings.coverStart)
        .to($('.pc-hint'), { autoAlpha: 0, duration: .05 }, settings.coverStart)
        .to(callout, { autoAlpha: 1, duration: .035 }, settings.lensStart)
        .to($('.pc-leader'), { strokeDashoffset: 0, duration: .08 }, settings.lensStart)
        .to($('.pc-progress span'), { scaleX: 1, duration: 1 }, 0);
      return () => {
        trigger = undefined;
        section.classList.remove('pc-animated');
        copy.inert = false; copy.removeAttribute('aria-hidden');
        details.forEach(el => { el.inert = false; el.removeAttribute('aria-hidden'); });
        rows.forEach(row => { row.removeAttribute('aria-current'); row.removeAttribute('aria-pressed'); });
        state.cover = 1; state.lens = 1; state.cells = 1;
        renderCover(); renderLens();
        delete section.dataset.cover;
      };
    });
    await document.fonts.ready;
    if (!disposed) { ScrollTrigger.sort(); ScrollTrigger.refresh(); }
  }
  initialize().catch(() => {
    media.revert();
    section.classList.remove('pc-animated');
  });
  const cleanup = event => {
    if (event.persisted) return;
    // The browser disposes this document. Reverting layout during pagehide
    // collapses the scroll track before history records the scroll position.
    disposed = true;
    rows.forEach(row => row.removeEventListener('click', navigate));
    window.removeEventListener('pagehide', cleanup);
  };
  window.addEventListener('pagehide', cleanup);
})();
