(() => {
'use strict';
const $ = id => document.getElementById(id);
const base = 'https://www.2kratings.com/';
const clean = value => (value || '').replace(/\s+/g,' ').trim();
const slug = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const status = value => { const el=$('ratingsSyncStatus'); if(el) el.textContent=value; };
let requestTimeout = null;
let imageRequestId = 0;
const apiBase = (() => {
    const host = location.hostname || '127.0.0.1';
    return 'http://' + (host === 'localhost' || host === '127.0.0.1' ? host : '127.0.0.1') + ':3001';
})();
function rating(text,label) {
    const safe=label.replace(/[.*+?^$()|[\]\\]/g,'\\$&');
    const m=text.match(new RegExp(safe+'\\s*(?:svg\\s*)?(\\d{1,3})\\b','i'));
    return m?Number(m[1]):null;
}
function metric(text,pattern) { const m=text.match(pattern); return m?Number(m[1]):null; }
function imageUrl(doc) {
    const candidates=[];
    const add=(raw,score=0)=>{
        if(!raw) return;
        try {
            const url=new URL(raw,base);
            if(!/^https?:$/.test(url.protocol)) return;
            const lower=url.href.toLowerCase();
            if(/1x1|pixel|spacer|placeholder|blank\.(png|gif)|data:image/.test(lower)) return;
            if(/\.(svg)(?:[?#]|$)/.test(lower)) return;
            candidates.push({url:url.href,score});
        } catch(e) {}
    };
    const meta=doc.querySelector('meta[property="og:image"],meta[name="twitter:image"]');
    if(meta) add(meta.content,-20);
    for(const img of doc.querySelectorAll('img')) {
        const alt=(img.getAttribute('alt')||'').toLowerCase();
        const cls=(img.getAttribute('class')||'').toLowerCase();
        const src=img.getAttribute('data-lazy-src')||img.getAttribute('data-src')||img.getAttribute('data-original')||img.getAttribute('src');
        const w=Math.max(Number(img.getAttribute('width'))||0,Number(img.getAttribute('data-width'))||0);
        const h=Math.max(Number(img.getAttribute('height'))||0,Number(img.getAttribute('data-height'))||0);
        if(w>0 && h>0 && w<32 && h<32) continue;
        const srcset=img.getAttribute('data-srcset')||img.getAttribute('srcset')||'';
        let bestSrc=src, bestSize=0;
        for(const item of srcset.split(',')) {
            const parts=item.trim().split(/\s+/);
            const size=parseFloat(parts[1])||0;
            if(parts[0] && size>=bestSize) { bestSize=size; bestSrc=parts[0]; }
        }
        const descriptive=/player|portrait|headshot|profile|lebron|basketball|athlete/.test(alt+' '+cls+' '+src);
        const dimensionScore=(w>=128?30:0)+(h>=128?30:0)+(bestSize>=128?25:0);
        add(bestSrc,(descriptive?100:0)+dimensionScore+(w*h?Math.min(20,w*h/10000):0));
    }
    candidates.sort((a,b)=>b.score-a.score);
    return candidates[0]?.url||'';
}
function fetchImageViaExtension(url) {
    return new Promise((resolve,reject) => {
        const requestId=String(++imageRequestId);
        const timer=setTimeout(() => { cleanup(); reject(new Error('Délai dépassé pour la photo.')); },15000);
        const listener=event => {
            if(event.source!==window || event.data?.source!=='nba-sim-extension' || event.data?.type!=='ratings-image' || event.data?.requestId!==requestId) return;
            cleanup();
            if(event.data.dataUrl) resolve(event.data.dataUrl);
            else reject(new Error(event.data.error || 'Photo inaccessible depuis 2KRatings.'));
        };
        function cleanup() { clearTimeout(timer); window.removeEventListener('message',listener); }
        window.addEventListener('message',listener);
        window.postMessage({ source:'nba-sim-page', type:'fetch-ratings-image', requestId, url },'*');
    });
}
async function resizedImage(url,name) {
    if(!url) return '';
    let blob;
    try {
        const dataUrl=await fetchImageViaExtension(url);
        blob=await (await fetch(dataUrl)).blob();
    } catch(extensionError) {
        const response=await fetch(apiBase + '/api/image?url=' + encodeURIComponent(url));
        if(!response.ok) throw new Error('Photo indisponible au téléchargement : '+extensionError.message);
        blob=await response.blob();
    }
    const bitmap=await createImageBitmap(blob);
    if(bitmap.width<128 || bitmap.height<128) {
        bitmap.close();
        throw new Error('La photo source est trop petite ('+bitmap.width+' × '+bitmap.height+' px). Aucune image de joueur d’au moins 128 × 128 n’a été trouvée.');
    }
    const ratio=Math.min(1,320/Math.max(bitmap.width,bitmap.height));
    const canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.round(bitmap.width*ratio)); canvas.height=Math.max(1,Math.round(bitmap.height*ratio));
    canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height); bitmap.close();
    const data=canvas.toDataURL('image/png');
    const filename=slug(name||'player')+'-2kratings.png';
    const response=await fetch(apiBase+'/api/save-image',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({filename,dataUrl:data})
    });
    const result=await response.json().catch(()=>({}));
    if(!response.ok || !result.image) throw new Error(result.error||'Impossible d’enregistrer la photo dans Images.');
    return result.image;
}
function requestRatingsPage(slugValue) {
    window.postMessage({ source:'nba-sim-page', type:'open-ratings', slug:slugValue }, '*');
}
async function importSource(source, playerName) {
    const doc=new DOMParser().parseFromString(source,'text/html');
    const text=clean(doc.body?(doc.body.innerText||doc.body.textContent):doc.documentElement.textContent);
    const name=clean(doc.querySelector('h1')?.textContent)||playerName;
    if(!/NBA 2K\d+ Rating/i.test(text)||!text.toLowerCase().includes(playerName.toLowerCase().split(' ')[0]))
        throw new Error('Page joueur introuvable ou nom incorrect. Vérifie le nom utilisé dans l’adresse.');
    const positions=(text.match(/Position:\s*([A-Z]{1,2})\s*\/?\s*([A-Z]{1,2})?/i)||[]).slice(1).filter(Boolean).map(x=>x.toUpperCase());
    const team=(text.match(/Team:\s*([^\n]+?)(?=\s+Jersey:|\s+Position:)/i)||[])[1]||'';
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
        jerseyNumber:(text.match(/Jersey:\s*#?(\d+)/i)||[])[1]||'',
        nationality:(text.match(/Nationality:\s*([A-Za-z][A-Za-z -]*?)(?:\s+Image:|\s+Team:)/i)||[])[1]||'',
        priorToNBA:(text.match(/Prior to NBA:\s*(.+?)(?:\s+canvas|\s+Compare|\s+Badges|\s+\d{2}\s+OVERALL)/i)||[])[1]||'',
        heightCm:metric(text,/Height:\s*[\d'’" ]+\((\d{2,3})\s*cm\)/i),
        weightKg:metric(text,/Weight:\s*[\d,]+\s*lbs\s*\((\d{2,3})\s*kg\)/i),
        wingspanCm:metric(text,/Wingspan:\s*[\d'’" ]+\((\d{2,3})\s*cm\)/i),
        potentialGrade:(text.match(/Potential\s*(?:svg)?\s*([A-F][+-]?)/i)||[])[1]||''
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
    clearTimeout(requestTimeout);
    requestTimeout = setTimeout(() => {
        $('runRatingsSync').disabled=false;
        status('Extension non détectée. Installe et active NBA Sim - 2KRatings Import dans Chrome, puis réessaie.');
    }, 20000);
}
window.addEventListener('message', async event => {
    if(event.source!==window || event.data?.source!=='nba-sim-extension') return;
    if(event.data?.type==='ratings-image') return;
    if(event.data?.type==='ratings-error') {
        clearTimeout(requestTimeout);
        $('runRatingsSync').disabled=false;
        status('Extension : '+(event.data.error || 'impossible d’ouvrir la page 2KRatings.'));
        return;
    }
    if(event.data?.type!=='ratings-page') return;
    clearTimeout(requestTimeout);
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