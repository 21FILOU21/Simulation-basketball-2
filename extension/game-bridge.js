(() => {
  'use strict';
  window.addEventListener('message', event => {
    if (event.source !== window || event.origin !== location.origin) return;
    if (event.data?.source !== 'nba-sim-page' || event.data?.type !== 'open-ratings') return;
    chrome.runtime.sendMessage({
      type: 'openRatingsPage',
      slug: event.data.slug
    }, response => {
      if (chrome.runtime.lastError || !response?.ok) {
        window.postMessage({
          source: 'nba-sim-extension',
          type: 'ratings-error',
          error: chrome.runtime.lastError?.message || response?.error || 'Extension indisponible.'
        }, '*');
      }
    });
  });

  chrome.runtime.onMessage.addListener(message => {
    if (message?.type !== 'deliverRatingsPage') return;
    window.postMessage({
      source: 'nba-sim-extension',
      type: 'ratings-page',
      html: message.html
    }, '*');
  });
})();
