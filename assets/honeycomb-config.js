// Shared SVG canvases use percentage offsets, so geometry scales with the model.
window.HONEYCOMB_CONFIG = Object.freeze({
  scrollDistance: 1.25,
  scrub: 0.45,
  revealStart: 0.12,
  revealEnd: 0.82,
  layers: [
    { id: 'wood-veneer', closed: -0.5263, open: -10 },
    { id: 'aluminium-core', closed: 0, open: 0 },
    { id: 'bottom-sheet', closed: 4.7368, open: 15 },
  ],
});
