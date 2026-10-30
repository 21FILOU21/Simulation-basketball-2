const GAME_TAB_KEY = 'nbaSimGameTabId';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === 'openRatingsPage') {
    (async () => {
      const gameTabId = sender.tab?.id;
      if (!gameTabId) throw new Error('Ouvre le simulateur dans un onglet Chrome normal.');
      const slug = String(message.slug || '');
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(slug)) throw new Error('Slug 2KRatings invalide.');
      await chrome.storage.session.set({ [GAME_TAB_KEY]: gameTabId });
      const targetUrl = 'https://www.2kratings.com/' + slug;
      const tabs = await chrome.tabs.query({ url: ['https://2kratings.com/*', 'https://www.2kratings.com/*', 'https://*.2kratings.com/*'] });
      const existing = tabs.find(tab => tab.id !== gameTabId);
      if (existing?.id) {
        if (existing.url === targetUrl) await chrome.tabs.reload(existing.id);
        else await chrome.tabs.update(existing.id, { url: targetUrl, active: true });
      } else {
        await chrome.tabs.create({ url: targetUrl, active: true });
      }
      sendResponse({ ok: true });
    })().catch(error => sendResponse({ ok: false, error: error.message }));
    return true;
  }


  if (message?.type === 'fetchRatingsImage') {
    (async () => {
      const imageUrl = new URL(String(message.url || ''));
      if (imageUrl.protocol !== 'https:' || !/(^|\.)2kratings\.com$/i.test(imageUrl.hostname)) {
        throw new Error('Adresse de photo non autorisée.');
      }
      const response = await fetch(imageUrl.href, {
        credentials: 'omit',
        redirect: 'follow',
        headers: { 'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8' }
      });
      if (!response.ok) throw new Error('Le serveur de la photo répond HTTP ' + response.status + '.');
      const type = response.headers.get('content-type') || '';
      if (!type.startsWith('image/')) throw new Error('La ressource reçue n’est pas une image.');
      const bytes = await response.arrayBuffer();
      if (bytes.byteLength > 12 * 1024 * 1024) throw new Error('La photo dépasse 12 Mo.');
      const data = new Uint8Array(bytes);
      let binary = '';
      const chunkSize = 0x8000;
      for (let offset = 0; offset < data.length; offset += chunkSize) {
        binary += String.fromCharCode(...data.subarray(offset, offset + chunkSize));
      }
      sendResponse({ ok: true, dataUrl: 'data:' + type + ';base64,' + btoa(binary) });
    })().catch(error => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message?.type === 'ratingsPageCaptured') {
    (async () => {
      const { [GAME_TAB_KEY]: gameTabId } = await chrome.storage.session.get(GAME_TAB_KEY);
      if (!gameTabId) throw new Error('Aucune demande du simulateur en attente.');
      await chrome.tabs.sendMessage(gameTabId, {
        type: 'deliverRatingsPage',
        html: String(message.html || '')
      });
      sendResponse({ ok: true });
    })().catch(error => sendResponse({ ok: false, error: error.message }));
    return true;
  }
});

