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

  window.addEventListener('message', event => {
    if (event.source !== window || event.origin !== location.origin) return;
    if (event.data?.source !== 'nba-sim-page' || event.data?.type !== 'fetch-ratings-image') return;
    const requestId = String(event.data.requestId || '');
    chrome.runtime.sendMessage({ type: 'fetchRatingsImage', url: event.data.url }, response => {
      window.postMessage({
        source: 'nba-sim-extension',
        type: 'ratings-image',
        requestId,
        dataUrl: response?.dataUrl || '',
        error: chrome.runtime.lastError?.message || response?.error || ''
      }, '*');
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
