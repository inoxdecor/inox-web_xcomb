(() => {
  'use strict';
  const section = document.querySelector('#material.honeycomb-reveal');
  if (!section) return;
  const controls = section.querySelector('.hc-view-control');
  const buttons = [...controls.querySelectorAll('[data-view]')];
  const model = section.querySelector('.hc-model');
  const selectView = view => {
    section.dataset.view = view;
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.view === view)));
    model.setAttribute('aria-label', `${view === 'assembled' ? 'Assembled' : 'Exploded'} view of wood veneer, aluminium honeycomb core and supporting sheet`);
  };
  buttons.forEach(button => button.addEventListener('click', () => selectView(button.dataset.view)));
  selectView('exploded');
  controls.hidden = false;
})();
