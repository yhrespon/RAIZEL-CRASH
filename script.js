// script.js — animations, particles, button behaviour

// --------- Particles (Canvas) ----------
const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d', { alpha: true });
let W = canvas.width = innerWidth;
let H = canvas.height = innerHeight;
const particles = [];
const PARTICLE_COUNT = Math.round((W*H)/60000 * 45) + 20; // density aware

function rand(min, max){ return Math.random()*(max-min)+min; }

class P {
  constructor(){
    this.x = rand(0, W);
    this.y = rand(0, H);
    this.vx = rand(-0.2, 0.2);
    this.vy = rand(-0.3, 0.3);
    this.r = rand(0.6, 2.2);
    this.life = rand(200, 800);
    this.alpha = rand(0.02, 0.25);
  }
  step(){
    this.x += this.vx;
    this.y += this.vy;
    if(this.x < -10) this.x = W + 10;
    if(this.x > W+10) this.x = -10;
    if(this.y < -10) this.y = H + 10;
    if(this.y > H+10) this.y = -10;
    this.life--;
    if(this.life < 0) this.reset();
  }
  reset(){
    this.x = rand(0, W);
    this.y = rand(0, H);
    this.vx = rand(-0.2, 0.2);
    this.vy = rand(-0.3, 0.3);
    this.r = rand(0.6, 2.2);
    this.life = rand(200, 800);
    this.alpha = rand(0.02, 0.25);
  }
}

function initParticles(){
  particles.length = 0;
  for(let i=0;i<PARTICLE_COUNT;i++) particles.push(new P());
}

function draw(){
  ctx.clearRect(0,0,W,H);
  // faint vignette
  const g = ctx.createRadialGradient(W*0.6,H*0.3,10,W*0.5,H*0.6,Math.max(W,H));
  g.addColorStop(0, 'rgba(0,255,122,0.02)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0,0,W,H);

  // draw particles
  for(let p of particles){
    ctx.beginPath();
    ctx.fillStyle = `rgba(0,255,122,${p.alpha})`;
    ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
    ctx.fill();
  }

  // connect close particles (subtle)
  for(let i=0;i<particles.length;i++){
    for(let j=i+1;j<particles.length;j++){
      const a = particles[i], b = particles[j];
      const dx = a.x-b.x, dy = a.y-b.y;
      const d = Math.hypot(dx,dy);
      if(d < 120){
        ctx.beginPath();
        ctx.strokeStyle = `rgba(0,255,122,${Math.max(0,0.08 - d/1500)})`;
        ctx.lineWidth = 0.6;
        ctx.moveTo(a.x,a.y);
        ctx.lineTo(b.x,b.y);
        ctx.stroke();
      }
    }
  }

  // update
  for(let p of particles) p.step();
  requestAnimationFrame(draw);
}

addEventListener('resize', ()=>{
  W = canvas.width = innerWidth;
  H = canvas.height = innerHeight;
  initParticles();
});

// start
initParticles();
draw();


// ---------- UI interactions ----------
const attackBtn = document.getElementById('attackBtn');
const waInput = document.getElementById('waNumber');
const platform = document.getElementById('platform');
const toast = document.getElementById('toast');
const statusOutput = document.querySelector('.status-output');
const progressBar = document.querySelector('.progress .bar');
const outputText = document.querySelector('.output-text');

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
  // simple rule: must start with 237 and have at least 10 digits total (common for demo)
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

attackBtn.addEventListener('click', async ()=>{
  if(attackBtn.disabled) return;
  const val = waInput.value.trim();
  if(!validNumber(val)){
    showToast('Erreur: numéro invalide (commencer par 237)');
    // small shake
    waInput.animate([{transform:'translateX(-6px)'},{transform:'translateX(6px)'},{transform:'translateX(0)'}], {duration:300});
    return;
  }

  attackBtn.disabled = true;
  attackBtn.querySelector('.btn-text').textContent = 'LOADING';
  attackBtn.style.filter = 'drop-shadow(0 0 20px rgba(0,255,122,0.45))';
  showToast('Initiating sequence...');

  try{
    // fake progress + sub-steps
    await animateProgress(1500);
    outputText.textContent = 'Payload delivery ...';
    await new Promise(r=>setTimeout(r,700));
    progressBar.style.width = '60%';

    outputText.textContent = `Target: ${val} — Platform: ${platform.value}`;
    await new Promise(r=>setTimeout(r,900));
    progressBar.style.width = '96%';

    // final
    await new Promise(r=>setTimeout(r,400));
    progressBar.style.width = '100%';
    outputText.textContent = 'Done — response: OK';
    showToast('powered by raizel', 2200);
  }catch(e){
    outputText.textContent = 'Erreur interne';
    showToast('Erreur interne', 2200);
  }finally{
    attackBtn.disabled = false;
    attackBtn.querySelector('.btn-text').textContent = 'ATTACK';
    setTimeout(()=> {
      statusOutput.style.display = 'none';
      progressBar.style.width = '0%';
      outputText.textContent = '';
    }, 2200);
  }
});

// small UX: pressing Enter on input triggers attack
waInput.addEventListener('keydown', (e)=>{
  if(e.key === 'Enter') {
    e.preventDefault();
    attackBtn.click();
  }
});

// initial toast on load
setTimeout(()=> showToast('powered by raizel', 2000), 600);
