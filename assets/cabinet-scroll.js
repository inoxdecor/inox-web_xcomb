(() => {
  'use strict';
  const bench = document.querySelector('.construction-workbench');
  const scene = bench?.querySelector('.dg');
  const image = scene?.querySelector('img');
  if (!image || !window.gsap || !window.ScrollTrigger) return;

  // Project the original shutter onto its moving plane. The cabinet body stays still.
  const source = [[223, 32], [694, 122], [694, 727], [223, 786]];
  function projection(target) {
    const rows = [];
    source.forEach(([x, y], i) => {
      const [u, v] = target[i];
      rows.push([x, y, 1, 0, 0, 0, -u*x, -u*y, u]);
      rows.push([0, 0, 0, x, y, 1, -v*x, -v*y, v]);
    });
    for (let c = 0; c < 8; c++) {
      let pivot = c;
      for (let r = c + 1; r < 8; r++) if (Math.abs(rows[r][c]) > Math.abs(rows[pivot][c])) pivot = r;
      [rows[c], rows[pivot]] = [rows[pivot], rows[c]];
      const divisor = rows[c][c];
      for (let k = c; k < 9; k++) rows[c][k] /= divisor;
      for (let r = 0; r < 8; r++) {
        if (r === c) continue;
        const factor = rows[r][c];
        for (let k = c; k < 9; k++) rows[r][k] -= factor * rows[c][k];
      }
    }
    const [a,b,c,d,e,f,g,h] = rows.map(row => row[8]);
    return `matrix3d(${a},${d},0,${g},${b},${e},0,${h},0,0,1,0,${c},${f},0,1)`;
  }

  const visual = document.createElement('div');
  visual.className = 'cabinet-motion';
  visual.setAttribute('aria-hidden', 'true');
  const body = image.cloneNode();
  body.removeAttribute('alt');
  body.removeAttribute('loading');
  body.className = 'cabinet-body';
  const door = document.createElement('div');
  door.className = 'cabinet-door';
  door.innerHTML = `<svg viewBox="0 0 1881 836" xmlns="http://www.w3.org/2000/svg"><defs><clipPath id="cabinet-shutter-clip"><polygon points="223,32 694,122 694,727 223,786"/></clipPath><filter id="cabinet-grain"><feTurbulence type="fractalNoise" baseFrequency=".7" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".13"/></feComponentTransfer><feBlend in="SourceGraphic" mode="multiply"/></filter><linearGradient id="cabinet-surface"><stop stop-color="#c3bbae"/><stop offset="1" stop-color="#a59e91"/></linearGradient></defs><g clip-path="url(#cabinet-shutter-clip)"><image class="cabinet-door-inside" href="${image.getAttribute('src')}" width="1881" height="836"/><g class="cabinet-door-outside"><polygon points="223,32 694,122 694,727 223,786" fill="url(#cabinet-surface)" filter="url(#cabinet-grain)"/><path d="M230 34L230 783" stroke="#e6dfd3" stroke-width="6"/><polygon points="223,32 694,122 694,727 223,786" fill="none" stroke="#d7cfc0" stroke-width="3"/></g></g></svg>`;
  visual.append(body, door);
  scene.prepend(visual);
  const resize = new ResizeObserver(() => { door.style.zoom = String(visual.clientWidth / 1881); });
  resize.observe(visual);
  const exterior = door.querySelector('.cabinet-door-outside');
  const markers = [...scene.querySelectorAll('.hs')];
  const controls = bench.querySelector('.construction-controls');
  const foot = bench.querySelector('.stage-foot span');
  const originalFoot = foot.textContent;
  let previousReveal = null;

  function render(progress) {
    const p = Math.max(0, Math.min(1, (progress - .08) / .68));
    const eased = p * p * (3 - 2 * p);
    const angle = eased * Math.PI;
    // The hinge is fixed; the free edge passes through an edge-on pose.
    let cosine = Math.cos(angle);
    if (Math.abs(cosine) < .001) cosine = .001;
    const width = cosine >= 0 ? 734 * cosine : 471 * cosine;
    const depth = Math.sin(angle) * 110;
    const freeTop = cosine >= 0 ? 122 - 110*cosine - depth : 122 + 90*cosine - depth;
    const freeBottom = cosine >= 0 ? 727 + 91*cosine + depth : 727 - 59*cosine + depth;
    door.style.transform = projection([[694 + width, freeTop], [694, 122], [694, 727], [694 + width, freeBottom]]);
    exterior.style.display = cosine >= 0 ? '' : 'none';
    body.style.setProperty('--cabinet-body-left', cosine >= 0 ? '36.9%' : '35.62%');
    const reveal = progress >= .82;
    bench.dataset.door = p === 0 ? 'closed' : p === 1 ? 'open' : 'opening';
    bench.style.setProperty('--cabinet-labels', String(Math.max(0, Math.min(1, (progress - .79) / .13))));
    if (reveal !== previousReveal) {
      previousReveal = reveal;
      bench.classList.toggle('cabinet-revealed', reveal);
      markers.forEach(marker => { marker.inert = !reveal; marker.setAttribute('aria-hidden', String(!reveal)); });
      controls.inert = !reveal;
      foot.textContent = reveal ? originalFoot : 'SCROLL TO OPEN THE CABINET ↓';
    }
  }

  function start() {
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add({ reduce: '(prefers-reduced-motion:reduce)', animate: '(prefers-reduced-motion:no-preference)' }, context => {
      if (context.conditions.reduce) return;
      const track = document.createElement('div');
      track.className = 'cabinet-scroll-track';
      bench.before(track);
      track.append(bench);
      bench.classList.add('cabinet-animated');
      previousReveal = null;
      let distance = 0, top = 100;
      const measure = () => {
        const height = bench.offsetHeight;
        const fits = height <= innerHeight - 100;
        distance = fits ? Math.max(500, innerHeight * .85) : 0;
        top = Math.max(100, (innerHeight - height) / 2);
        track.style.setProperty('--cabinet-height', `${height + distance}px`);
        track.style.setProperty('--cabinet-top', `${top}px`);
        track.classList.toggle('cabinet-static', !fits);
      };
      measure();
      render(distance ? 0 : 1);
      ScrollTrigger.addEventListener('refreshInit', measure);
      const trigger = ScrollTrigger.create({
        id: 'cabinet-opening', trigger: track,
        start: () => `top ${top}px`,
        end: () => `+=${Math.max(1, distance)}`,
        invalidateOnRefresh: true,
        onUpdate: self => render(distance ? self.progress : 1),
        onRefresh: self => render(distance ? self.progress : 1),
      });
      return () => {
        ScrollTrigger.removeEventListener('refreshInit', measure);
        trigger.kill();
        track.replaceWith(bench);
        bench.classList.remove('cabinet-animated', 'cabinet-revealed');
        bench.style.removeProperty('--cabinet-labels');
        delete bench.dataset.door;
        markers.forEach(marker => { marker.inert = false; marker.removeAttribute('aria-hidden'); });
        controls.inert = false;
        foot.textContent = originalFoot;
      };
    });
    window.addEventListener('pagehide', event => {
      if (event.persisted) return;
      // Preserve layout until navigation completes so history can restore it.
      resize.disconnect();
    });
    ScrollTrigger.refresh();
  }
  image.loading = 'eager';
  image.decode().then(() => document.fonts.ready).then(start).catch(() => visual.remove());
})();
