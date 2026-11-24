(() => {
  'use strict';
  const section = document.querySelector('#material.honeycomb-reveal');
  const config = window.HONEYCOMB_CONFIG;
  if (!section || !config) return;
  // An accidental second script evaluation must not create another pin/listener.
  window.honeycombReveal?.destroy();
  const controls = section.querySelector('.hc-view-control');
  const buttons = [...controls.querySelectorAll('[data-view]')];
  const model = section.querySelector('.hc-model');
  const state = { progress: 1 };
  let trigger, media, mobileView, disposed = false;
  const clamp = value => Math.max(0, Math.min(1, value));
  const render = () => {
    const progress = state.progress;
    config.layers.forEach(layer => {
      model.querySelector(`[data-layer="${layer.id}"]`).style.setProperty('--layer-y', layer.closed + (layer.open - layer.closed) * progress);
    });
    section.dataset.reveal = progress.toFixed(4);
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.view === (progress < .5 ? 'assembled' : 'exploded'))));
    model.setAttribute('aria-label', `${progress < .5 ? 'Assembled' : 'Exploded'} view of wood veneer, aluminium honeycomb core and supporting sheet`);
  };
  const selectView = event => {
    const exploded = event.currentTarget.dataset.view === 'exploded';
    if (mobileView) {
      // The view is independent of page position on phones.
      mobileView.select(exploded ? 1 : 0);
    } else if (trigger) {
      const target = exploded ? .95 : .02;
      window.scrollTo({ top: trigger.start + (trigger.end - trigger.start) * target, behavior: 'smooth' });
    } else {
      state.progress = exploded ? 1 : 0;
      render();
    }
  };
  buttons.forEach(button => button.addEventListener('click', selectView));
  controls.hidden = false;
  render();
  const destroy = () => {
    disposed = true;
    media?.revert();
    buttons.forEach(button => button.removeEventListener('click', selectView));
    state.progress = 1;
    render();
    window.removeEventListener('pagehide', hide);
  };
  const hide = event => {
    if (event.persisted) return;
    // Pause resources while retaining pin spacing for browser history capture.
    disposed = true;
    trigger?.getTween()?.pause();
    buttons.forEach(button => button.removeEventListener('click', selectView));
  };
  window.honeycombReveal = { destroy };
  window.addEventListener('pagehide', hide);
  async function start() {
    if (!window.gsap || !window.ScrollTrigger) return;
    await Promise.all([...model.querySelectorAll('img')].map(image => image.decode()));
    await document.fonts.ready;
    if (disposed) return;
    gsap.registerPlugin(ScrollTrigger);
    media = gsap.matchMedia();
    // A short viewport gets the readable static composition and manual controls.
    media.add({ animate: '(prefers-reduced-motion:no-preference)', mobile: '(max-width:767px)', short: '(max-height:619px)' }, context => {
      if (!context.conditions.animate || context.conditions.short) return;
      const mobile = context.conditions.mobile;
      section.classList.add('hc-scroll');
      if (mobile) {
        let manual = false;
        const events = new AbortController();
        const reveal = progress => {
          const p = clamp((progress - config.revealStart) / (config.revealEnd - config.revealStart));
          return p * p * (3 - 2 * p);
        };
        const move = gsap.quickTo(state, 'progress', {
          duration: .4, ease: 'power2.out', onUpdate: render,
        });
        const resume = () => {
          if (!manual) return;
          manual = false;
          move(reveal(trigger.progress));
        };
        trigger = ScrollTrigger.create({
          id: 'honeycomb-layers', trigger: section,
          start: 'top 70%',
          end: () => `top ${document.querySelector('header').offsetHeight + 16}px`,
          invalidateOnRefresh: true,
          onUpdate: self => { if (!manual) move(reveal(self.progress)); },
          onRefresh: self => {
            if (!manual) { move.tween.pause(); state.progress = reveal(self.progress); render(); }
          },
        });
        mobileView = { select(value) { manual = true; move(value); } };
        // Only a deliberate scroll gesture resumes the automatic reveal.
        document.addEventListener('touchmove', resume, { passive: true, signal: events.signal });
        document.addEventListener('wheel', resume, { passive: true, signal: events.signal });
        document.addEventListener('click', event => {
          if (event.target.closest('a[href="#material"]')) resume();
        }, { signal: events.signal });
        document.addEventListener('keydown', event => {
          if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key) && !event.target.matches('input,textarea,select')) resume();
        }, { signal: events.signal });
        return () => {
          events.abort();
          move.tween.kill();
          trigger?.kill(); trigger = undefined; mobileView = undefined;
          section.classList.remove('hc-scroll');
          state.progress = 1; render();
        };
      }
      const tween = gsap.to(state, {
        progress: 1, duration: 1,
        ease: value => {
          const p = clamp((value - config.revealStart) / (config.revealEnd - config.revealStart));
          return p * p * (3 - 2 * p);
        },
        startAt: { progress: 0 }, onUpdate: render,
        scrollTrigger: {
          id: 'honeycomb-layers', trigger: section,
          start: () => {
            if (mobile) return 'top 85%';
            const top = document.querySelector('header').offsetHeight + 10;
            section.style.setProperty('--hc-top', `${top}px`);
            return `top ${top}px`;
          },
          end: () => mobile ? `top ${document.querySelector('header').offsetHeight + 16}px` : `+=${document.documentElement.clientHeight * config.scrollDistance}`,
          pin: !mobile, scrub: mobile ? .25 : config.scrub, invalidateOnRefresh: true,
          refreshPriority: 1,
        },
      });
      trigger = tween.scrollTrigger;
      return () => {
        trigger = undefined;
        section.classList.remove('hc-scroll');
        state.progress = 1;
        render();
      };
    });
    ScrollTrigger.sort();
    ScrollTrigger.refresh();
  }
  start().catch(() => { media?.revert(); state.progress = 1; render(); });
})();
