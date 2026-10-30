(() => {
  'use strict';
  // La page est capturée après document_idle, donc après le chargement initial du DOM.
  chrome.runtime.sendMessage({
    type: 'ratingsPageCaptured',
    html: document.documentElement?.outerHTML || ''
  });
})();
