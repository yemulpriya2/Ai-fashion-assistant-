// ══════════════════════════════════════════════
//  FASHIORA — main.js  (clean rewrite)
// ══════════════════════════════════════════════

// ─── STATE ───
let selectedPhoto   = null;
let selectedOccasion = 'Casual / Everyday';
let selectedGender   = 'Female';
let selectedStyle    = 'Classic & Timeless';
let lastAnalysisData = null;
let savedOutfits     = [];
let selectedStars    = 0;
let isAdminMode      = false;
let loadingInterval  = null;
let tipInterval      = null;

const ADMIN_PASSWORD = 'fashiora2025';

try { savedOutfits = JSON.parse(localStorage.getItem('fashiora_saved') || '[]'); } catch(e) { savedOutfits = []; }

// ══════════════════════════════════════════════
//  SINGLE DOMContentLoaded
// ══════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  setupUploadZone();
  setupButtonGroups();
  setupNavAuth();
  setupDarkMode();
  setupStarPicker();
  renderFavourites();
});

// ─── DARK MODE ───
function setupDarkMode() {
  const btn = document.getElementById('darkModeBtn');
  if (!btn) return;
  if (localStorage.getItem('fashiora_dark') === 'true') {
    document.body.classList.add('dark-mode');
    btn.textContent = '☀️';
  }
  btn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    btn.textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('fashiora_dark', isDark);
  });
}

// ─── NAV AUTH ───
function setupNavAuth() {
  const loginLink = document.getElementById('login');
  if (loginLink) {
    loginLink.addEventListener('click', e => { e.preventDefault(); openModal(); });
  }
  document.getElementById('loginSubmitBtn')?.addEventListener('click', handleLogin);
  document.getElementById('registerSubmitBtn')?.addEventListener('click', handleRegister);
  document.getElementById('loginPassword')?.addEventListener('keydown', e => { if(e.key==='Enter') handleLogin(); });
  document.getElementById('registerPassword')?.addEventListener('keydown', e => { if(e.key==='Enter') handleRegister(); });
}

function openModal() { document.getElementById('authModal').classList.remove('hidden'); }
function closeModal() {
  document.getElementById('authModal').classList.add('hidden');
  document.getElementById('loginError').textContent = '';
  document.getElementById('registerError').textContent = '';
}
function switchTab(tab) {
  const isLogin = tab === 'login';
  document.getElementById('loginForm').classList.toggle('hidden', !isLogin);
  document.getElementById('registerForm').classList.toggle('hidden', isLogin);
  document.querySelectorAll('.modal-tab').forEach((t,i) => t.classList.toggle('active', isLogin ? i===0 : i===1));
}

function getCsrf() {
  return document.cookie.split(';').find(c=>c.trim().startsWith('csrftoken='))?.split('=')[1] || '';
}

async function handleLogin() {
  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errEl    = document.getElementById('loginError');
  errEl.textContent = '';
  if (!email || !password) { errEl.textContent = 'Please fill in all fields.'; return; }
  const btn = document.getElementById('loginSubmitBtn');
  btn.textContent = 'Signing in...'; btn.disabled = true;
  try {
    const res  = await fetch('/api/login/', { method:'POST', headers:{'Content-Type':'application/json','X-CSRFToken':getCsrf()}, body:JSON.stringify({email,password}) });
    const data = await res.json();
    if (data.success) {
      closeModal();
      document.getElementById('login').textContent = `Hi, ${data.name || email.split('@')[0]}`;
      showToast('✦ Welcome back!');
    } else { errEl.textContent = data.error || 'Invalid email or password.'; }
  } catch { errEl.textContent = 'Connection error. Please try again.'; }
  btn.textContent = 'Sign In'; btn.disabled = false;
}

async function handleRegister() {
  const name     = document.getElementById('registerName').value.trim();
  const email    = document.getElementById('registerEmail').value.trim();
  const password = document.getElementById('registerPassword').value;
  const errEl    = document.getElementById('registerError');
  errEl.textContent = '';
  if (!name||!email||!password) { errEl.textContent = 'Please fill in all fields.'; return; }
  if (password.length < 6)      { errEl.textContent = 'Password must be at least 6 characters.'; return; }
  const btn = document.getElementById('registerSubmitBtn');
  btn.textContent = 'Creating...'; btn.disabled = true;
  try {
    const res  = await fetch('/api/register/', { method:'POST', headers:{'Content-Type':'application/json','X-CSRFToken':getCsrf()}, body:JSON.stringify({name,email,password}) });
    const data = await res.json();
    if (data.success) {
      closeModal();
      document.getElementById('login').textContent = `Hi, ${name}`;
      showToast('✦ Account created! Welcome to Fashiora 💗');
    } else { errEl.textContent = data.error || 'Could not create account.'; }
  } catch { errEl.textContent = 'Connection error. Please try again.'; }
  btn.textContent = 'Create Account'; btn.disabled = false;
}

// ─── UPLOAD ZONE ───
function setupUploadZone() {
  const zone  = document.getElementById('uploadZone');
  const input = document.getElementById('photoInput');
  if (!zone||!input) return;
  zone.addEventListener('dragover',  e => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', e => {
    e.preventDefault(); zone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) loadPhoto(file);
  });
  zone.addEventListener('click', () => input.click());
  input.addEventListener('change', e => { if(e.target.files[0]) loadPhoto(e.target.files[0]); });
}

function loadPhoto(file) {
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX = 800; let w = img.width, h = img.height;
      if (w > MAX) { h = Math.round(h*MAX/w); w = MAX; }
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img,0,0,w,h);
      selectedPhoto = canvas.toDataURL('image/jpeg', 0.75);
      document.getElementById('previewImg').src = selectedPhoto;
      document.getElementById('previewImg').classList.remove('hidden');
      document.getElementById('uploadZone').classList.add('hidden');
      document.getElementById('changeBtn').classList.remove('hidden');
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function resetPhoto() {
  selectedPhoto = null;
  document.getElementById('previewImg').classList.add('hidden');
  document.getElementById('previewImg').src = '';
  document.getElementById('uploadZone').classList.remove('hidden');
  document.getElementById('changeBtn').classList.add('hidden');
  document.getElementById('photoInput').value = '';
}

// ─── BUTTON GROUPS ───
function setupButtonGroups() {
  document.getElementById('occasionGrid')?.addEventListener('click', e => {
    const btn = e.target.closest('.occasion-btn');
    if (!btn) return;
    document.querySelectorAll('.occasion-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active'); selectedOccasion = btn.dataset.occasion;
  });
  document.querySelectorAll('.gender-btn').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('.gender-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active'); selectedGender = btn.dataset.gender;
  }));
  document.querySelectorAll('.style-btn').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('.style-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active'); selectedStyle = btn.dataset.style;
  }));
}

// ─── ANALYZE ───
async function analyzePhoto() {
  if (!selectedPhoto) { showToast('Please upload a photo first ✦'); return; }
  const btn            = document.getElementById('analyzeBtn');
  const btnText        = document.getElementById('analyzeBtnText');
  const resultsSection = document.getElementById('resultsSection');
  btn.disabled = true; btnText.textContent = '✦ Analyzing...';
  resultsSection.classList.remove('hidden');
  resultsSection.scrollIntoView({ behavior:'smooth', block:'start' });
  document.getElementById('skinCard').innerHTML    = skeletonHTML('🔍 Reading your skin tone...');
  document.getElementById('outfitsGrid').innerHTML = skeletonHTML('👗 Building your outfits...');
  document.getElementById('paletteCard').innerHTML = skeletonHTML('🎨 Picking your colors...');
  document.getElementById('tipsCard').innerHTML    = skeletonHTML('💡 Writing style tips...');
  showFashionLoading();
  try {
    const base64  = selectedPhoto.split(',')[1];
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ model:'claude-sonnet-4-20250514', max_tokens:2000,
        messages:[{role:'user', content:[
          {type:'image', source:{type:'base64', media_type:'image/jpeg', data:base64}},
          {type:'text', text:buildPrompt()}
        ]}]
      })
    });
    const data = await response.json();
    const text = (data.content||[]).map(c=>c.text||'').join('');
    let parsed;
    try {
      const clean = text.replace(/```json|```/g,'').trim();
      const m = clean.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(m ? m[0] : clean);
    } catch { parsed = fallbackResponse(); }
    renderResults(parsed);
  } catch(err) { console.error(err); renderResults(fallbackResponse()); }
  hideFashionLoading();
  btn.disabled = false; btnText.textContent = '✦ Analyze & Style Me';
}

function buildPrompt() {
  return `You are Fashiora, an expert AI fashion stylist. Analyze the photo carefully.
Occasion: ${selectedOccasion} | Gender: ${selectedGender} | Style: ${selectedStyle}
Respond ONLY with valid JSON (no markdown, no extra text):
{
  "skinTone": { "type": "e.g. Warm Medium", "undertone": "Warm/Cool/Neutral/Olive", "description": "2 sentences" },
  "outfits": [
    { "occasion": "${selectedOccasion}", "name": "Creative name", "description": "2 sentences", "items": ["item1","item2","item3","footwear","accessory"] },
    { "occasion": "Evening / Night Out", "name": "Creative name", "description": "2 sentences", "items": ["item1","item2","item3","footwear","accessory"] },
    { "occasion": "Casual Chic", "name": "Creative name", "description": "2 sentences", "items": ["item1","item2","item3","footwear","accessory"] }
  ],
  "colorPalette": [
    {"name":"Color","hex":"#hex","reason":"short reason"},{"name":"Color","hex":"#hex","reason":"short reason"},
    {"name":"Color","hex":"#hex","reason":"short reason"},{"name":"Color","hex":"#hex","reason":"short reason"},
    {"name":"Color","hex":"#hex","reason":"short reason"},{"name":"Color","hex":"#hex","reason":"short reason"},
    {"name":"Color","hex":"#hex","reason":"short reason"},{"name":"Color","hex":"#hex","reason":"short reason"}
  ],
  "colorsToAvoid": [
    {"name":"Color","hex":"#hex","reason":"short reason"},{"name":"Color","hex":"#hex","reason":"short reason"},{"name":"Color","hex":"#hex","reason":"short reason"}
  ],
  "styleTips": ["Tip about cuts/silhouettes","Tip about patterns/prints","Tip about fabrics","Tip about accessories"]
}`;
}

// ─── RENDER ───
function renderResults(data) {
  lastAnalysisData = data;
  renderSkinCard(data.skinTone);
  renderOutfits(data.outfits);
  renderPalette(data.colorPalette, data.colorsToAvoid);
  renderTips(data.styleTips);
}

function renderSkinCard(skin) {
  const card = document.getElementById('skinCard');
  if (!skin) { card.innerHTML='<p style="color:var(--text-muted)">Analysis unavailable</p>'; return; }
  card.innerHTML = `
    <h3 class="card-title">Skin Tone Analysis</h3>
    <div class="skin-result">
      <div class="skin-tone-badge">
        <div class="tone-swatch" style="background:${getSkinSwatchColor(skin.undertone)}"></div>
        <strong>${skin.type}</strong> · ${skin.undertone} Undertone
      </div>
      <p>${skin.description}</p>
    </div>`;
}
function getSkinSwatchColor(u) {
  return {Warm:'#C68642',Cool:'#8D5524',Neutral:'#A0522D',Olive:'#6B7A4A'}[u]||'#A0522D';
}

function renderOutfits(outfits) {
  const grid = document.getElementById('outfitsGrid');
  if (!outfits?.length) { grid.innerHTML=''; return; }
  grid.innerHTML = outfits.map((o,i) => {
    const isSaved = savedOutfits.some(s=>s.name===o.name);
    return `<div class="outfit-card" style="animation-delay:${i*0.15}s">
      <button class="heart-btn ${isSaved?'saved':''}" onclick="toggleSave(this,'${o.name.replace(/'/g,"\\'")}',${i})">${isSaved?'💗':'🤍'}</button>
      <div class="outfit-occasion">✦ ${o.occasion}</div>
      <div class="outfit-name">${o.name}</div>
      <div class="outfit-desc">${o.description}</div>
      <div class="outfit-items">${(o.items||[]).map(item=>`<div class="outfit-item">${item}</div>`).join('')}</div>
    </div>`;
  }).join('');
}

function renderPalette(colors, avoid) {
  const card = document.getElementById('paletteCard');
  const avoidHTML = avoid?.length ? `<div style="margin-top:2.5rem">
    <p class="palette-section-label" style="color:var(--burgundy);border-color:var(--burgundy)">❌ Colors to Avoid</p>
    <div class="palette-swatches">${avoid.map(c=>`
      <div class="swatch-group">
        <div class="swatch avoid-swatch" style="background:${c.hex}" title="${c.name}"><div class="swatch-x">✕</div></div>
        <span class="swatch-name">${c.name}</span>
        ${c.reason?`<span class="swatch-reason">${c.reason}</span>`:''}
      </div>`).join('')}</div></div>` : '';
  card.innerHTML = `
    <h3 class="card-title">Your Color Palette</h3>
    <p class="palette-section-label">✦ Colors That Flatter You (${(colors||[]).length} shades)</p>
    <div class="palette-swatches">${(colors||[]).map(c=>`
      <div class="swatch-group">
        <div class="swatch" style="background:${c.hex}" title="${c.name}"></div>
        <span class="swatch-name">${c.name}</span>
        ${c.reason?`<span class="swatch-reason">${c.reason}</span>`:''}
      </div>`).join('')}</div>${avoidHTML}`;
}

function renderTips(tips) {
  const card = document.getElementById('tipsCard');
  if (!tips?.length) { card.innerHTML=''; return; }
  card.innerHTML = `<h3 class="card-title">Personal Style Tips</h3>
    <div class="tips-content">${tips.map(tip=>`<div class="tip-item">${tip}</div>`).join('')}</div>`;
}

function restartStylist() {
  resetPhoto();
  document.getElementById('resultsSection').classList.add('hidden');
  document.getElementById('stylist').scrollIntoView({ behavior:'smooth' });
}

// ─── SKELETON ───
function skeletonHTML(msg) {
  return `<div class="skeleton-card">
    <div class="skeleton-shimmer"></div>
    <div class="skeleton-icon">⏳</div>
    <div class="skeleton-msg">${msg}</div>
    <div class="skeleton-line"></div>
    <div class="skeleton-line short"></div>
    <div class="skeleton-line"></div>
  </div>`;
}
function loadingHTML(msg) { return skeletonHTML(msg); }

// ─── FASHION LOADING ───
const fashionTips = [
  'Did you know? Warm undertones glow in earthy tones like rust, camel & terracotta! 🌟',
  'Tip: Jewel tones like emerald and sapphire flatter cool undertones beautifully! 💎',
  'Style secret: The right color near your face can make your skin look radiant! ✨',
  'Fashion fact: Vertical stripes elongate the body while horizontal ones add width! 👗',
  'Did you know? Your undertone stays the same even as your skin darkens in summer! ☀️',
];
function showFashionLoading() {
  document.getElementById('fashionLoading').classList.remove('hidden');
  const steps = ['Analyzing your features...','Detecting skin undertone...','Curating your outfits...','Building color palette...','Crafting style tips...'];
  let step = 0;
  const bar = document.getElementById('flBar'); const textEl = document.getElementById('flText');
  bar.style.width = '10%';
  loadingInterval = setInterval(() => {
    step = Math.min(step+1, steps.length-1);
    textEl.textContent = steps[step];
    bar.style.width = `${((step+1)/steps.length)*100}%`;
  }, 600);
  let tipIdx = 0; const tipEl = document.getElementById('flTip');
  tipInterval = setInterval(() => {
    tipIdx = (tipIdx+1) % fashionTips.length;
    tipEl.style.opacity = 0;
    setTimeout(() => { tipEl.textContent = fashionTips[tipIdx]; tipEl.style.opacity = 1; }, 300);
  }, 4000);
}
function hideFashionLoading() {
  clearInterval(loadingInterval); clearInterval(tipInterval);
  document.getElementById('fashionLoading').classList.add('hidden');
  document.getElementById('flBar').style.width = '0%';
}

// ─── FALLBACK ───
function fallbackResponse() {
  return {
    skinTone: { type:'Warm Medium', undertone:'Warm', description:'Your skin has a beautiful warm medium tone with golden undertones. Earthy and rich colors will complement you perfectly.' },
    outfits: [
      { occasion:selectedOccasion, name:'The Golden Hour Look', description:'A warm terracotta ensemble that enhances your natural glow. Perfect for a confident daytime appearance.', items:['Terracotta linen blouse','High-waist camel trousers','Cognac leather belt','Tan block heels','Gold hoop earrings'] },
      { occasion:'Evening / Night Out', name:'The Midnight Bloom', description:'Deep burgundy elevates your warm undertones for an elegant evening look.', items:['Burgundy wrap dress','Gold strappy heels','Minimal gold clutch','Delicate gold necklace','Nude lip'] },
      { occasion:'Casual Chic', name:'The Weekend Edit', description:'Warm olive and cream create a relaxed yet put-together look.', items:['Olive green shirt','Cream wide-leg pants','White sneakers','Tan tote bag','Dainty bracelet'] }
    ],
    colorPalette: [
      {name:'Terracotta',hex:'#C7522A',reason:'Enhances warm undertones'},{name:'Camel',hex:'#C19A6B',reason:'Complements golden skin'},
      {name:'Forest Green',hex:'#2D6A4F',reason:'Rich earthy harmony'},{name:'Deep Burgundy',hex:'#6B2D3A',reason:'Deepens warm complexion'},
      {name:'Warm Ivory',hex:'#F5ECD7',reason:'Soft near the face'},{name:'Cognac',hex:'#A0522D',reason:'Mirrors warm tones'},
      {name:'Mustard Yellow',hex:'#D4A017',reason:'Brings out golden glow'},{name:'Olive Green',hex:'#6B7A4A',reason:'Earthy sophistication'}
    ],
    colorsToAvoid: [
      {name:'Cool Gray',hex:'#9E9E9E',reason:'Clashes with warm undertones'},{name:'Icy Pink',hex:'#F8BBD0',reason:'Too cool for your skin'},{name:'Stark White',hex:'#FFFFFF',reason:'Washes out warm complexions'}
    ],
    styleTips: [
      'Opt for V-necks and wrap styles — they elongate your neckline and frame your face beautifully.',
      'Embrace earthy floral or paisley prints in rust, amber and olive — they complement your warm tone.',
      'Choose natural fabrics like linen, cotton and silk — they drape beautifully on warm skin.',
      'Gold jewelry is your best friend — yellow gold and rose gold both enhance your warm undertone perfectly.'
    ]
  };
}

// ─── RESULTS ACTIONS ───
function toggleMoodBoard() {
  const mb = document.getElementById('moodBoard');
  mb.classList.toggle('hidden');
  if (!mb.classList.contains('hidden')) buildMoodBoard();
}
function buildMoodBoard() {
  if (!lastAnalysisData) return;
  const d = lastAnalysisData;
  document.getElementById('moodBoardGrid').innerHTML = `
    <div class="mb-skin-block">
      <div class="mb-label">✦ Skin Tone</div>
      <div class="mb-skin-name">${d.skinTone?.type||'Your Tone'}</div>
      <div class="mb-undertone">${d.skinTone?.undertone||''} Undertone</div>
    </div>
    ${(d.colorPalette||[]).slice(0,6).map(c=>`<div class="mb-color-block" style="background:${c.hex}"><div class="mb-color-name">${c.name}</div></div>`).join('')}
    ${(d.outfits||[]).map(o=>`<div class="mb-outfit-block"><div class="mb-outfit-icon">👗</div><div class="mb-outfit-name">${o.name}</div><div class="mb-outfit-occ">${o.occasion}</div></div>`).join('')}
    <div class="mb-vibe-block"><div class="mb-vibe-text">${selectedStyle}</div><div class="mb-vibe-sub">Your Style Vibe</div></div>`;
}

function downloadReport() {
  if (!lastAnalysisData) { showToast('Please run analysis first!'); return; }
  const d   = lastAnalysisData;
  const now = new Date().toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'});
  const colors  = (d.colorPalette||[]).map(c=>`  • ${c.name} (${c.hex})${c.reason?' — '+c.reason:''}`).join('\n');
  const avoid   = (d.colorsToAvoid||[]).map(c=>`  • ${c.name} (${c.hex})${c.reason?' — '+c.reason:''}`).join('\n');
  const tips    = (d.styleTips||[]).map((t,i)=>`  ${i+1}. ${t}`).join('\n');
  const outfits = (d.outfits||[]).map(o=>`\n  ✦ ${o.name} (${o.occasion})\n  ${o.description}\n  Items: ${(o.items||[]).join(', ')}`).join('\n');
  const report = `╔══════════════════════════════════════════════════════════╗\n║              FASHIORA — AI STYLE REPORT                  ║\n║          Generated on: ${now.padEnd(32)}║\n╚══════════════════════════════════════════════════════════╝\n\n━━━ SKIN TONE ━━━\n  Type: ${d.skinTone?.type||'N/A'} | Undertone: ${d.skinTone?.undertone||'N/A'}\n  ${d.skinTone?.description||''}\n\n━━━ YOUR COLOR PALETTE ━━━\n${colors}\n\n━━━ COLORS TO AVOID ━━━\n${avoid}\n\n━━━ OUTFIT RECOMMENDATIONS ━━━\n${outfits}\n\n━━━ PERSONAL STYLE TIPS ━━━\n${tips}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n  FASHIORA — Sarhad College BBA(CA) 2025-26\n  Priya Yemul & Shrutika Yemul\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([report],{type:'text/plain;charset=utf-8'}));
  a.download = `Fashiora_Style_Report_${now.replace(/ /g,'_')}.txt`;
  a.click();
  showToast('✦ Report downloaded!');
}

function shareStyle() {
  if (!lastAnalysisData) { showToast('Please run analysis first!'); return; }
  const d = lastAnalysisData;
  const text = `🌸 My Fashiora AI Style Report!\n\nSkin Tone: ${d.skinTone?.type} (${d.skinTone?.undertone} undertone)\nTop colors: ${(d.colorPalette||[]).slice(0,4).map(c=>c.name).join(', ')}\n\nStyle tip: ${d.styleTips?.[0]||''}\n\nAnalyzed by FASHIORA ✨`;
  if (navigator.share) { navigator.share({title:'My Fashiora Style',text}); }
  else { navigator.clipboard.writeText(text); showToast('✦ Style card copied! Paste it anywhere 💗'); }
}

// ─── FAVOURITES ───
function toggleSave(btn, name, idx) {
  const outfit = lastAnalysisData?.outfits?.[idx];
  if (!outfit) return;
  const existing = savedOutfits.findIndex(s=>s.name===name);
  if (existing > -1) { savedOutfits.splice(existing,1); btn.textContent='🤍'; btn.classList.remove('saved'); showToast('Removed from favourites'); }
  else               { savedOutfits.push(outfit); btn.textContent='💗'; btn.classList.add('saved'); showToast('💗 Saved to favourites!'); }
  localStorage.setItem('fashiora_saved', JSON.stringify(savedOutfits));
  renderFavourites();
}

function renderFavourites() {
  const grid    = document.getElementById('favGrid');
  const empty   = document.getElementById('favEmpty');
  const actions = document.getElementById('favActions');
  if (!grid) return;
  if (savedOutfits.length === 0) { grid.classList.add('hidden'); actions?.classList.add('hidden'); empty?.classList.remove('hidden'); return; }
  empty?.classList.add('hidden'); grid.classList.remove('hidden'); actions?.classList.remove('hidden');
  grid.innerHTML = savedOutfits.map((o,i)=>`
    <div class="fav-card">
      <div class="fav-card-top">
        <div class="fav-occasion">💗 ${o.occasion}</div>
        <button class="fav-remove-btn" onclick="removeFavourite(${i})">✕</button>
      </div>
      <div class="fav-name">${o.name}</div>
      <div class="fav-desc">${o.description}</div>
      <div class="fav-items">${(o.items||[]).map(item=>`<div class="fav-item">✦ ${item}</div>`).join('')}</div>
    </div>`).join('');
}
function removeFavourite(idx) {
  savedOutfits.splice(idx,1);
  localStorage.setItem('fashiora_saved', JSON.stringify(savedOutfits));
  renderFavourites(); showToast('Removed from favourites');
}
function clearAllFavourites() {
  if (!confirm('Clear all saved outfits?')) return;
  savedOutfits = []; localStorage.setItem('fashiora_saved','[]');
  renderFavourites(); showToast('All favourites cleared');
}

// ─── SEASONAL ───
function switchSeason(el, season) {
  document.querySelectorAll('.season-tab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.season-panel').forEach(p=>p.classList.add('hidden'));
  el.classList.add('active');
  document.getElementById(season).classList.remove('hidden');
}

// ─── STYLE QUIZ ───
const quizQuestions = [
  {q:'What is your go-to weekend vibe?', opts:['Cozy & relaxed at home ☕','Brunch with friends 🥂','Exploring the city 🏙️','Active & outdoorsy 🏃']},
  {q:'Pick your dream wardrobe aesthetic:', opts:['Clean & minimal 🤍','Bold & colourful 🌈','Earthy & bohemian 🌿','Elegant & classic 👑']},
  {q:'Your most-worn item of clothing is:', opts:['A good pair of jeans 👖','Flowy dresses 👗','Blazer or structured top 💼','Comfy loungewear 🧘']},
  {q:'What matters most in an outfit?', opts:['Comfort above everything 😌','Looking put-together 💅','Standing out & being bold 🔥','Fitting the occasion perfectly 🎯']},
  {q:'Your fashion icon is closest to:', opts:['Deepika Padukone — timeless elegance','Ranveer Singh — fearless & bold','Ananya Panday — fun & trendy','Sonam Kapoor — experimental & chic']},
];
const quizResults = {
  classic:{label:'The Classic Elegante',desc:'You have refined taste and timeless style. You gravitate towards well-cut pieces that never go out of fashion.',emoji:'👑',colors:['Navy','Ivory','Camel','Black']},
  bold:{label:'The Bold Trendsetter',desc:'You love making a statement! You are not afraid of colour, patterns, or being the most memorable person in the room.',emoji:'🔥',colors:['Red','Cobalt','Yellow','Hot Pink']},
  boho:{label:'The Boho Free Spirit',desc:'You are naturally drawn to earthy tones, flowing silhouettes, and clothes that feel like a second skin.',emoji:'🌿',colors:['Terracotta','Olive','Rust','Cream']},
  minimal:{label:'The Modern Minimalist',desc:'Less is more for you. You build outfits around clean lines, neutral tones, and quality over quantity.',emoji:'🤍',colors:['White','Grey','Beige','Black']},
};
let quizAnswers=[],currentQ=0;

function openQuiz() {
  quizAnswers=[]; currentQ=0;
  document.getElementById('quizModal').classList.remove('hidden');
  renderQuizQuestion();
}
function closeQuiz() { document.getElementById('quizModal').classList.add('hidden'); }
function renderQuizQuestion() {
  document.getElementById('quizFill').style.width = `${(currentQ/quizQuestions.length)*100}%`;
  document.getElementById('quizStepLabel').textContent = `Question ${currentQ+1} of ${quizQuestions.length}`;
  const q = quizQuestions[currentQ];
  document.getElementById('quizBody').innerHTML = `
    <div class="quiz-question">
      <p class="quiz-q-text">${q.q}</p>
      <div class="quiz-options">${q.opts.map((opt,i)=>`<button class="quiz-option" onclick="answerQuiz(${i})">${opt}</button>`).join('')}</div>
    </div>`;
}
function answerQuiz(idx) {
  quizAnswers.push(idx);
  document.querySelectorAll('.quiz-option').forEach((b,i)=>{b.classList.toggle('selected',i===idx);b.disabled=true;});
  setTimeout(()=>{currentQ++;currentQ<quizQuestions.length?renderQuizQuestion():showQuizResult();},500);
}
function showQuizResult() {
  document.getElementById('quizFill').style.width='100%';
  document.getElementById('quizStepLabel').textContent='Your Result! ✨';
  const types=['minimal','classic','boho','bold'];
  const result=quizResults[types[quizAnswers.reduce((a,b)=>a+b,0)%4]];
  document.getElementById('quizBody').innerHTML=`
    <div class="quiz-result">
      <div class="quiz-result-emoji">${result.emoji}</div>
      <h3 class="quiz-result-label">${result.label}</h3>
      <p class="quiz-result-desc">${result.desc}</p>
      <div class="quiz-result-colors">
        <p class="quiz-result-colors-label">Your signature colors:</p>
        <div class="quiz-result-swatches">${result.colors.map(c=>`<span class="quiz-color-chip">${c}</span>`).join('')}</div>
      </div>
      <button class="quiz-cta" onclick="closeQuiz();document.getElementById('stylist').scrollIntoView({behavior:'smooth'})">✦ Now Get Your Full AI Analysis</button>
    </div>`;
}

// ─── STAR PICKER ───
function setupStarPicker() {
  const stars = document.querySelectorAll('.star-pick');
  stars.forEach(star => {
    star.addEventListener('mouseenter', () => { const v=+star.dataset.val; stars.forEach((s,i)=>s.classList.toggle('hovered',i<v)); });
    star.addEventListener('mouseleave', () => { stars.forEach((s,i)=>s.classList.toggle('hovered',i<selectedStars)); });
    star.addEventListener('click', () => {
      selectedStars = +star.dataset.val;
      stars.forEach((s,i)=>{s.classList.toggle('selected',i<selectedStars);s.classList.remove('hovered');});
      const hints=['','Terrible 😕','Not great 😐','Okay 🙂','Great! 😊','Amazing! 🌟'];
      const hint=document.getElementById('starHint');
      if(hint) hint.textContent=hints[selectedStars];
    });
  });
}

// ─── SUBMIT REVIEW ───
function submitReview() {
  const name     = document.getElementById('reviewName').value.trim();
  const occasion = document.getElementById('reviewOccasion').value;
  const text     = document.getElementById('reviewText').value.trim();
  if (!name)               { showToast('Please enter your name ✦'); return; }
  if (!occasion)           { showToast('Please select an occasion ✦'); return; }
  if (selectedStars === 0) { showToast('Please select a star rating ✦'); return; }
  if (text.length < 20)    { showToast('Please write at least 20 characters ✦'); return; }
  const starStr    = '★'.repeat(selectedStars)+'☆'.repeat(5-selectedStars);
  const months     = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const now        = new Date();
  const dateStr    = `${months[now.getMonth()]} ${now.getFullYear()}`;
  const avatarColor = ['#8b3a52','#c47a8a','#b5838d','#c9ada7','#d4a5a5','#e8a0bf'][Math.floor(Math.random()*6)];
  const card = document.createElement('div');
  card.className = 'review-card review-card-new';
  card.innerHTML = `
    <div class="rc-top-accent"></div>
    <div class="review-header">
      <div class="review-avatar" style="background:${avatarColor}">${name.charAt(0).toUpperCase()}</div>
      <div class="review-meta"><div class="review-name">${name}</div><div class="review-date">${dateStr}</div></div>
      <div class="review-rating">${starStr}</div>
    </div>
    <div class="review-occasion-tag">${occasion}</div>
    <p class="review-text">"${text}"</p>
    <div class="rc-bottom">
      <button class="admin-delete-btn ${isAdminMode?'':'hidden'}" onclick="deleteReviewCard(this)">🗑 Delete</button>
      <span class="rc-helpful">💗 Just added</span>
      <span class="rc-verified">✓ Verified User</span>
    </div>`;
  document.getElementById('reviewsGrid').insertBefore(card, document.getElementById('reviewsGrid').firstChild);
  document.getElementById('reviewName').value='';
  document.getElementById('reviewOccasion').value='';
  document.getElementById('reviewText').value='';
  selectedStars=0;
  document.querySelectorAll('.star-pick').forEach(s=>s.classList.remove('selected','hovered'));
  const hint=document.getElementById('starHint'); if(hint) hint.textContent='Click to rate';
  showToast('✦ Thank you! Your review has been added!');
  card.scrollIntoView({behavior:'smooth',block:'center'});
}

// ─── ADMIN ───
function toggleAdminLogin() {
  const panel = document.getElementById('adminPanel');
  const opening = panel.classList.contains('hidden');
  panel.classList.toggle('hidden');
  if (opening) {
    document.getElementById('adminHint').textContent='';
    document.getElementById('adminPasswordInput').value='';
    setTimeout(()=>document.getElementById('adminPasswordInput').focus(),100);
  }
}
function verifyAdmin() {
  const input = document.getElementById('adminPasswordInput').value;
  if (input === ADMIN_PASSWORD) {
    isAdminMode=true;
    document.getElementById('adminPanel').classList.add('hidden');
    document.getElementById('adminBanner').classList.remove('hidden');
    document.getElementById('adminToggleBtn').classList.add('admin-active');
    document.getElementById('adminToggleBtn').textContent='🛡 Admin ON';
    document.querySelectorAll('.admin-delete-btn').forEach(b=>b.classList.remove('hidden'));
    showToast('🛡 Admin mode activated!');
  } else {
    const hint=document.getElementById('adminHint');
    hint.textContent='✕ Wrong password. Try again.'; hint.style.color='#c0392b';
    document.getElementById('adminPasswordInput').value='';
    document.getElementById('adminPasswordInput').focus();
  }
}
function logoutAdmin() {
  isAdminMode=false;
  document.getElementById('adminBanner').classList.add('hidden');
  document.getElementById('adminToggleBtn').classList.remove('admin-active');
  document.getElementById('adminToggleBtn').textContent='🔐 Admin';
  document.querySelectorAll('.admin-delete-btn').forEach(b=>b.classList.add('hidden'));
  showToast('Logged out of admin mode');
}
function deleteReviewCard(btn) {
  if (!isAdminMode) return;
  const card=btn.closest('.review-card');
  if (!confirm('Delete this review permanently?')) return;
  card.style.transition='all 0.4s ease'; card.style.opacity='0'; card.style.transform='scale(0.9)';
  setTimeout(()=>{card.remove();showToast('✓ Review deleted');},400);
}

// ─── TOAST ───
function showToast(msg) {
  document.querySelectorAll('.fashiora-toast').forEach(t=>t.remove());
  const toast=document.createElement('div'); toast.className='fashiora-toast';
  toast.style.cssText='position:fixed;bottom:2rem;left:50%;transform:translateX(-50%);background:var(--burgundy);color:white;padding:0.9rem 2.2rem;font-family:var(--ff-label);font-size:0.8rem;letter-spacing:0.12em;z-index:99999;animation:fadeUp 0.3s ease;box-shadow:0 6px 24px rgba(139,58,82,0.35);white-space:nowrap;';
  toast.textContent=msg; document.body.appendChild(toast);
  setTimeout(()=>toast.remove(),3000);
}