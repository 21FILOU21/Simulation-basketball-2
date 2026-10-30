(() => {
'use strict';
const $ = id => document.getElementById(id);
const base = 'https://www.2kratings.com/';
const clean = value => (value || '').replace(/\s+/g,' ').trim();
const slug = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const status = value => { const el=$('ratingsSyncStatus'); if(el) el.textContent=value; };
const apiBase = (() => {
    const host = location.hostname || '127.0.0.1';
    return 'http://' + (host === 'localhost' || host === '127.0.0.1' ? host : '127.0.0.1') + ':3001';
})();
async function fetchPage(url) {
    const response = await fetch(apiBase + '/api/ratings?slug=' + encodeURIComponent(url.slice(base.length)));
    if (!response.ok) {
        let detail = '';
        try { detail = (await response.json()).error || ''; } catch(e) {}
        throw new Error(detail || 'Le relais Node ne répond pas. Lance « npm start » dans le dossier du jeu.');
    }
    return await response.text();
}
function rating(text,label) {
    const safe=label.replace(/[.*+?^$()|[\]\\]/g,'\\$&');
    const m=text.match(new RegExp(safe+'\\s*(?:svg\\s*)?(\\d{1,3})\\b','i'));
    return m?Number(m[1]):null;
}
function metric(text,pattern) { const m=text.match(pattern); return m?Number(m[1]):null; }
function imageUrl(doc) {
    const meta=doc.querySelector('meta[property="og:image"],meta[name="twitter:image"]');
    if(meta&&meta.content) return new URL(meta.content,base).href;
    const img=[...doc.images].find(x=>/player|basketball/i.test((x.alt||'')+' '+x.src));
    return img?new URL(img.getAttribute('src'),base).href:'';
}
async function resizedImage(url,name) {
    if(!url) return '';
    let response;
    response=await fetch(apiBase + '/api/image?url=' + encodeURIComponent(url));
    if(!response.ok) throw new Error('Photo indisponible au téléchargement.');
    const bitmap=await createImageBitmap(await response.blob());
    const ratio=Math.min(1,320/Math.max(bitmap.width,bitmap.height));
    const canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.round(bitmap.width*ratio)); canvas.height=Math.max(1,Math.round(bitmap.height*ratio));
    canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height); bitmap.close();
    const data=canvas.toDataURL('image/jpeg',0.82);
    const link=document.createElement('a'); link.href=data; link.download=slug(name||'player')+'-2kratings.jpg';
    document.body.appendChild(link); link.click(); link.remove();
    return data;
}
function requestRatingsPage(slugValue) {
    window.postMessage({ source:'nba-sim-page', type:'open-ratings', slug:slugValue }, '*');
}
async function importSource(source, playerName) {
    const doc=new DOMParser().parseFromString(source,'text/html');
    const text=clean(doc.body?doc.body.innerText:doc.documentElement.textContent);
    const name=clean(doc.querySelector('h1')?.textContent)||playerName;
    if(!/NBA 2K\\d+ Rating/i.test(text)||!text.toLowerCase().includes(playerName.toLowerCase().split(' ')[0]))
        throw new Error('Page joueur introuvable ou nom incorrect. Vérifie le nom utilisé dans l’adresse.');
    const positions=(text.match(/Position:\\s*([A-Z]{1,2})\\s*\\/?\\s*([A-Z]{1,2})?/i)||[]).slice(1).filter(Boolean).map(x=>x.toUpperCase());
    const team=(text.match(/Team:\\s*([^\\n]+?)(?=\\s+Jersey:|\\s+Position:)/i)||[])[1]||'';
    const attrs={
        threePoint:rating(text,'Three-Point Shot'),midRange:rating(text,'Mid-Range Shot'),closeShot:rating(text,'Close Shot'),
        freeThrow:rating(text,'Free Throw'),offensiveConsistency:rating(text,'Offensive Consistency'),shotIQ:rating(text,'Shot IQ'),
        speed:rating(text,'Speed'),strength:rating(text,'Strength'),agility:rating(text,'Agility'),vertical:rating(text,'Vertical'),
        hustle:rating(text,'Hustle'),stamina:rating(text,'Stamina'),overallDurability:rating(text,'Overall Durability'),
        layup:rating(text,'Layup'),drivingDunk:rating(text,'Driving Dunk'),standingDunk:rating(text,'Standing Dunk'),
        postHook:rating(text,'Post Hook'),postFade:rating(text,'Post Fade'),postControl:rating(text,'Post Control'),
        drawFoul:rating(text,'Draw Foul'),hands:rating(text,'Hands'),ballHandle:rating(text,'Ball Handle'),
        speedWithBall:rating(text,'Speed with Ball'),passAccuracy:rating(text,'Pass Accuracy'),passVision:rating(text,'Pass Vision'),
        passIQ:rating(text,'Pass IQ'),block:rating(text,'Block'),steal:rating(text,'Steal'),passPerception:rating(text,'Pass Perception'),
        interiorDefense:rating(text,'Interior Defense'),perimeterDefense:rating(text,'Perimeter Defense'),
        defensiveConsistency:rating(text,'Defensive Consistency'),helpDefenseIQ:rating(text,'Help Defense IQ'),
        defensiveRebound:rating(text,'Defensive Rebound'),offensiveRebound:rating(text,'Offensive Rebound')
    };
    const count=Object.values(attrs).filter(Number.isFinite).length;
    if(count<12) throw new Error('La page est ouverte, mais seulement '+count+' attributs ont été lus. Vérifie que la page du joueur est complètement chargée.');
    status('Joueur trouvé : '+count+' attributs. Récupération de la photo…');
    let imageData='';
    try { imageData=await resizedImage(imageUrl(doc),playerName); }
    catch(error) { status(error.message+' Import des notes en cours…'); }
    const data={
        name,team,positions,attributes:attrs,imageData,
        jerseyNumber:(text.match(/Jersey:\\s*#?(\\d+)/i)||[])[1]||'',
        nationality:(text.match(/Nationality:\\s*([A-Za-z][A-Za-z -]*?)(?:\\s+Image:|\\s+Team:)/i)||[])[1]||'',
        priorToNBA:(text.match(/Prior to NBA:\\s*(.+?)(?:\\s+canvas|\\s+Compare|\\s+Badges|\\s+\\d{2}\\s+OVERALL)/i)||[])[1]||'',
        heightCm:metric(text,/Height:\\s*[\\d'’" ]+\\((\\d{2,3})\\s*cm\\)/i),
        weightKg:metric(text,/Weight:\\s*[\\d,]+\\s*lbs\\s*\\((\\d{2,3})\\s*kg\\)/i),
        wingspanCm:metric(text,/Wingspan:\\s*[\\d'’" ]+\\((\\d{2,3})\\s*cm\\)/i),
        potentialGrade:(text.match(/Potential\\s*(?:svg)?\\s*([A-F][+-]?)/i)||[])[1]||''
    };
    if(typeof window.NBASimApplyRatingsData!=='function') throw new Error('Le formulaire du jeu n’est pas prêt.');
    window.NBASimApplyRatingsData(data);
    status('Synchronisation terminée : '+count+' attributs importés.'+(imageData?' Photo réduite à 320 px maximum et téléchargée.':' Photo non récupérée.'));
}
async function sync() {
    const playerName=clean($('ratingsSearchName').value);
    const addressName=clean($('ratingsSlugName').value||playerName);
    if(!playerName||!addressName) { status('Entre le nom du joueur et le nom à utiliser dans l’adresse.'); return; }
    const playerSlug=slug(addressName);
    $('ratingsSlugName').value=playerSlug;
    $('runRatingsSync').disabled=true;
    if (!$('editPlayerSelect').value) window.__pending2KImage='';
    status('Ouverture de 2KRatings… L’extension Chrome va récupérer les informations de la page.');
    requestRatingsPage(playerSlug);
}
window.addEventListener('message', async event => {
    if(event.source!==window || event.data?.source!=='nba-sim-extension' || event.data?.type!=='ratings-page') return;
    try {
        await importSource(event.data.html || '',clean($('ratingsSearchName').value));
    } catch(error) {
        status('Échec : '+(error.message||'erreur inconnue'));
    } finally {
        $('runRatingsSync').disabled=false;
    }
});
document.addEventListener('DOMContentLoaded',()=>{
    $('openRatingsSync')?.addEventListener('click',()=>{ $('ratingsSyncPanel').hidden=!$('ratingsSyncPanel').hidden; if(!$('ratingsSyncPanel').hidden) $('ratingsSearchName').focus(); });
    $('closeRatingsSync')?.addEventListener('click',()=>{ $('ratingsSyncPanel').hidden=true; });
    $('ratingsSearchName')?.addEventListener('input',()=>{ if(!$('ratingsSlugName').dataset.edited) $('ratingsSlugName').value=slug($('ratingsSearchName').value); });
    $('ratingsSlugName')?.addEventListener('input',()=>{ $('ratingsSlugName').dataset.edited='true'; });
    $('runRatingsSync')?.addEventListener('click',sync);
});
})();