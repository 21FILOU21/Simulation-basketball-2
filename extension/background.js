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
