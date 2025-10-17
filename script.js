// public/script.js
// --- Particles & UI code (identique au précédent) ---

const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d', { alpha: true });
let W = canvas.width = innerWidth;
let H = canvas.height = innerHeight;
const particles = [];
const PARTICLE_COUNT = Math.round((W*H)/60000 * 45) + 20;
function rand(min, max){ return Math.random()*(max-min)+min; }
class P {
  constructor(){
    this.x = rand(0, W); this.y = rand(0, H);
    this.vx = rand(-0.2, 0.2); this.vy = rand(-0.3, 0.3);
    this.r = rand(0.6, 2.2); this.life = rand(200, 800);
    this.alpha = rand(0.02, 0.25);
  }
  step(){
    this.x += this.vx; this.y += this.vy;
    if(this.x < -10) this.x = W + 10;
    if(this.x > W+10) this.x = -10;
    if(this.y < -10) this.y = H + 10;
    if(this.y > H+10) this.y = -10;
    this.life--; if(this.life < 0) this.reset();
  }
  reset(){ this.x = rand(0, W); this.y = rand(0, H); this.vx = rand(-0.2, 0.2); this.vy = rand(-0.3, 0.3); this.r = rand(0.6, 2.2); this.life = rand(200, 800); this.alpha = rand(0.02, 0.25); }
}
function initParticles(){ particles.length = 0; for(let i=0;i<PARTICLE_COUNT;i++) particles.push(new P()); }
function draw(){
  ctx.clearRect(0,0,W,H);
  const g = ctx.createRadialGradient(W*0.6,H*0.3,10,W*0.5,H*0.6,Math.max(W,H));
  g.addColorStop(0, 'rgba(0,255,122,0.02)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
  for(let p of particles){ ctx.beginPath(); ctx.fillStyle = `rgba(0,255,122,${p.alpha})`; ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.fill(); }
  for(let i=0;i<particles.length;i++){ for(let j=i+1;j<particles.length;j++){ const a = particles[i], b = particles[j]; const dx = a.x-b.x, dy = a.y-b.y; const d = Math.hypot(dx,dy); if(d < 120){ ctx.beginPath(); ctx.strokeStyle = `rgba(0,255,122,${Math.max(0,0.08 - d/1500)})`; ctx.lineWidth = 0.6; ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke(); } } }
  for(let p of particles) p.step();
  requestAnimationFrame(draw);
}
addEventListener('resize', ()=>{ W = canvas.width = innerWidth; H = canvas.height = innerHeight; initParticles(); });
initParticles(); draw();


// --- UI interactions & safe API call ---
const attackBtn = document.getElementById('attackBtn');
const waInput = document.getElementById('waNumber');
const platform = document.getElementById('platform');
const toast = document.getElementById('toast');
const statusOutput = document.querySelector('.status-output');
const progressBar = document.querySelector('.progress .bar');
const outputText = document.querySelector('.output-text');

const BASE_URL = "https://supercapably-noncondensing-lorri.ngrok-free.dev"; // <--- ton ngrok ici

function showToast(text="powered by raizel", timeout=2800){
  toast.textContent = text;
  toast.style.opacity = '1';
  toast.style.transform = 'translateY(0)';
  setTimeout(()=> {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
  }, timeout);
}

function validNumber(n){
  if(!n) return false;
  const digits = n.replace(/\D/g,'');
  return digits.startsWith('237') && digits.length >= 10 && digits.length <= 15;
}

function animateProgress(duration=2000){
  statusOutput.style.display = 'flex';
  outputText.textContent = 'Launching...';
  progressBar.style.width = '0%';
  return new Promise(resolve => {
    const start = performance.now();
    function step(t){
      const p = Math.min(1, (t-start)/duration);
      progressBar.style.width = `${Math.round(p*100)}%`;
      if(p < 1) requestAnimationFrame(step);
      else resolve();
    }
    requestAnimationFrame(step);
  });
}

// send to backend
async function sendToBackend(target){
  const resp = await fetch(`${BASE_URL}/api/send`, {  // <-- URL ngrok ici
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': 'Raizel_83hf7G2kdL9' // <-- ta clé API
    },
    body: JSON.stringify({ target, platform: platform.value })
  });
  const j = await resp.json();
  if(!resp.ok) throw new Error(j.error || 'Erreur serveur');
  return j;
}

attackBtn.addEventListener('click', async ()=>{
  if(attackBtn.disabled) return;
  const val = waInput.value.trim();
  if(!validNumber(val)){
    showToast('Erreur: numéro invalide (commencer par 237)');
    waInput.animate([{transform:'translateX(-6px)'},{transform:'translateX(6px)'},{transform:'translateX(0)'}], {duration:300});
    return;
  }

  attackBtn.disabled = true;
  attackBtn.querySelector('.btn-text').textContent = 'SENDING';
  showToast('Envoi en cours...');

  try {
    await animateProgress(900);
    const resp = await sendToBackend(val);
    outputText.textContent = resp.message || 'Envoyé (demo)';
    showToast(resp.demo ? 'Simulé (demo)' : 'Envoyé', 2000);
  } catch (err) {
    console.error('Send error:', err);
    outputText.textContent = 'Erreur: '+(err.message || err);
    showToast('Erreur serveur', 2200);
  } finally {
    attackBtn.disabled = false;
    attackBtn.querySelector('.btn-text').textContent = 'ATTACK';
    setTimeout(()=> {
      statusOutput.style.display = 'none';
      progressBar.style.width = '0%';
      outputText.textContent = '';
    }, 1600);
  }
});

waInput.addEventListener('keydown', (e)=>{
  if(e.key === 'Enter') {
    e.preventDefault();
    attackBtn.click();
  }
});

setTimeout(()=> showToast('powered by raizel', 2000), 600);
