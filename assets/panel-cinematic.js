(() => {
  'use strict';
  // Keep the composition fixed; only the material geometry plays forward/back.
  const settings = Object.freeze({ duration: 6, coverStart: .12, coverEnd: .43, detailsStart: .30, detailsEnd: .46, lensStart: .54, lensEnd: .76 });
  window.PANEL_CINEMATIC = settings;
  const section = document.querySelector('#panel-journey');
  if (!section || !window.gsap || !window.ScrollTrigger) return;
  window.panelStudy?.destroy();
  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);
  const $ = s => section.querySelector(s);
  const product = $('.pc-product'), copy = $('.pc-copy');
  const lens = $('.pc-lens'), callout = $('.pc-callout'), curl = $('.pc-curl'), corner = $('.pc-corner');
  const rows = [...section.querySelectorAll('.pc-rows button')];
  const details = [$('.pc-description'), $('.pc-rows')];
  const state = { cover: 1, lens: 1, cells: 1 };
  let animation, disposed = false, userPaused = false;
  let inView = false;
  const playback = $('.pc-playback');
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
  const updateStudy = p => {
    state.cover = easeCover(phase(p, settings.coverStart, settings.coverEnd));
    state.lens = .04 + .96 * easeCover(phase(p, settings.lensStart + .06, settings.lensEnd));
    state.cells = .97 + .09 * phase(p, .64, .88);
    renderCover(); renderLens();
    callout.style.opacity = String(phase(p, settings.lensStart, settings.lensStart + .05));
    $('.pc-leader').style.strokeDashoffset = String(1 - phase(p, settings.lensStart, settings.lensStart + .08));
    $('.pc-progress span').style.transform = `scaleX(${p})`;
    const step = p < settings.coverEnd ? 0 : p < settings.lensStart ? 2 : 1;
    rows.forEach((row, i) => {
      row.setAttribute('aria-pressed', String(step === i));
      if (step === i) row.setAttribute('aria-current', 'step');
      else row.removeAttribute('aria-current');
    });
    $('.pc-state').textContent = p < settings.coverStart ? 'EXPOSED CORE' : p < settings.coverEnd ? 'CLOSING THE EDGE' : p < settings.lensStart ? 'REFINED OUTSIDE' : 'THE ENGINEERING WITHIN';
    section.dataset.progress = p.toFixed(4);
  };
  const syncPlayback = () => {
    const playing = !!animation && inView && !document.hidden && !userPaused;
    if (animation) animation.paused(!playing);
    playback.textContent = userPaused ? 'Play animation' : 'Pause animation';
    section.dataset.playback = playing ? 'playing' : 'paused';
  };
  const toggle = () => { userPaused = !userPaused; syncPlayback(); };
  const navigate = event => {
    const p = Number(event.currentTarget.dataset.progress);
    if (animation) {
      userPaused = true;
      animation.totalTime(p * settings.duration);
      syncPlayback();
    } else {
      state.cover = 1;
      state.lens = event.currentTarget === rows[1] ? 1 : .04;
      renderCover(); renderLens();
    }
  };
  rows.forEach(row => row.addEventListener('click', navigate));
  playback.addEventListener('click', toggle);
  document.addEventListener('visibilitychange', syncPlayback);
  const observer = new IntersectionObserver(entries => {
    inView = entries[0].isIntersecting;
    syncPlayback();
  });
  observer.observe(section);
  async function initialize() {
    const image = new Image(); image.src = '/assets/original-aluminium-panel.png';
    await image.decode();
    await document.fonts.ready;
    if (disposed) return;
    media.add({ mobile: '(max-width:767px)', desktop: '(min-width:768px)', reduce: '(prefers-reduced-motion:reduce)', short: '(max-height:579px)', compact: '(max-height:699px)' }, context => {
      if (context.conditions.reduce) return;
      const { mobile, short, compact } = context.conditions;
      section.classList.add('pc-autoplay');
      if (!short) {
        section.classList.add('pc-animated');
        if (!mobile) gsap.set(product, { left: '73%', top: '49%', width: '46%', xPercent: -50, yPercent: -50, x: 0, y: 0 });
      }
      gsap.set(copy, { autoAlpha: 1 });
      gsap.set(details, { autoAlpha: 1, y: 0 });
      $('.pc-leader').style.strokeDasharray = '1';
      const playhead = { progress: 0 };
      animation = gsap.to(playhead, {
        progress: 1, duration: settings.duration, ease: 'none',
        repeat: -1, yoyo: true, repeatDelay: 1, paused: true,
        onUpdate: () => updateStudy(playhead.progress),
      });
      updateStudy(0);
      playback.hidden = false;
      syncPlayback();
      return () => {
        animation?.kill(); animation = undefined;
        playback.hidden = true;
        section.classList.remove('pc-animated', 'pc-autoplay');
        state.cover = 1; state.lens = 1; state.cells = 1;
        renderCover(); renderLens();
        rows.forEach(row => { row.removeAttribute('aria-current'); row.removeAttribute('aria-pressed'); });
        $('.pc-progress span').style.removeProperty('transform');
        $('.pc-leader').style.removeProperty('stroke-dasharray');
        $('.pc-leader').style.removeProperty('stroke-dashoffset');
        callout.style.removeProperty('opacity');
        delete section.dataset.progress;
        delete section.dataset.playback;
        $('.pc-state').textContent = 'EXPOSED CORE';
      };
    });
    // Removing the old pinned scene changes the positions of the later studies.
    ScrollTrigger.refresh();
  }
  const hide = event => { if (!event.persisted) destroy(); };
  const destroy = () => {
    disposed = true;
    observer.disconnect();
    media.revert();
    rows.forEach(row => row.removeEventListener('click', navigate));
    playback.removeEventListener('click', toggle);
    document.removeEventListener('visibilitychange', syncPlayback);
    window.removeEventListener('pagehide', hide);
    window.removeEventListener('pageshow', syncPlayback);
  };
  window.addEventListener('pagehide', hide);
  window.addEventListener('pageshow', syncPlayback);
  window.panelStudy = { destroy, get animation() { return animation; } };
  initialize().catch(() => { media.revert(); playback.hidden = true; });
})();
