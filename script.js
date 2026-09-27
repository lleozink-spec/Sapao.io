const $=s=>document.querySelector(s);
const home=$("#home"),game=$("#game"),over=$("#gameover"),canvas=$("#arena"),ctx=canvas.getContext("2d");
let running=false, score=0, best=Number(localStorage.getItem("sapao-best")||0), sound=true;
$("#bestTop").textContent=best;

const frog={x:0,y:0,r:14,vx:1,vy:0,speed:2.6};
let foods=[], rocks=[], particles=[], last=0, foodTimer=0;
const dirs={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
let dir=[1,0],next=[1,0];

function resize(){const d=devicePixelRatio||1, r=canvas.getBoundingClientRect();canvas.width=r.width*d;canvas.height=r.height*d;ctx.setTransform(d,0,0,d,0,0)}
window.addEventListener("resize",resize);

function reset(){
  resize(); score=0; dir=[1,0];next=[1,0]; frog.x=canvas.clientWidth/2;frog.y=canvas.clientHeight/2;frog.r=14;frog.speed=2.6;
  foods=[];rocks=[];particles=[];foodTimer=0;
  for(let i=0;i<16;i++) spawnFood();
  for(let i=0;i<9;i++) spawnRock();
  updateUI();
}
function spawnFood(){
  const w=canvas.clientWidth,h=canvas.clientHeight;
  foods.push({x:20+Math.random()*(w-40),y:20+Math.random()*(h-40),r:7+Math.random()*3,type:Math.random()<.12?"gold":"normal"});
}
function spawnRock(){
  const w=canvas.clientWidth,h=canvas.clientHeight;
  rocks.push({x:25+Math.random()*(w-50),y:25+Math.random()*(h-50),r:10+Math.random()*13});
}
function setDir(d){const q=dirs[d];if(q[0]===-dir[0]&&q[1]===-dir[1])return;next=q}
window.addEventListener("keydown",e=>{const k=e.key.toLowerCase();if(k==="arrowup"||k==="w")setDir("up");if(k==="arrowdown"||k==="s")setDir("down");if(k==="arrowleft"||k==="a")setDir("left");if(k==="arrowright"||k==="d")setDir("right")});
document.querySelectorAll("[data-dir]").forEach(b=>{b.addEventListener("pointerdown",()=>setDir(b.dataset.dir))});

function start(){home.classList.add("hidden");over.classList.add("hidden");game.classList.remove("hidden");reset();running=true;last=performance.now();requestAnimationFrame(loop)}
function end(){running=false;$("#finalScore").textContent=score;const nb=score>best;if(nb){best=score;localStorage.setItem("sapao-best",best);$("#newBest").classList.remove("hidden");$("#bestTop").textContent=best}else $("#newBest").classList.add("hidden");game.classList.add("hidden");over.classList.remove("hidden")}
function updateUI(){ $("#score").textContent=score;$("#scoreTop").textContent=score;$("#sizeLabel").textContent=Math.floor(frog.r/14);$("#sizeMeter").style.width=Math.min(100,8+frog.r*2)+"%" }
function pop(text){const t=$("#toast");t.textContent=text;t.classList.remove("show");void t.offsetWidth;t.classList.add("show")}

function loop(t){
 if(!running)return;const dt=Math.min(32,t-last);last=t;update(dt);draw();requestAnimationFrame(loop)
}
function update(dt){
 dir=next;const f=dt/16.67;frog.x+=dir[0]*frog.speed*f;frog.y+=dir[1]*frog.speed*f;
 const w=canvas.clientWidth,h=canvas.clientHeight;
 if(frog.x<-frog.r||frog.x>w+frog.r||frog.y<-frog.r||frog.y>h+frog.r)return end();
 for(const r of rocks)if(Math.hypot(frog.x-r.x,frog.y-r.y)<frog.r+r.r*.75)return end();
 for(let i=foods.length-1;i>=0;i--){const food=foods[i];if(Math.hypot(frog.x-food.x,frog.y-food.y)<frog.r+food.r){
   score+=food.type==="gold"?25:10;frog.r+=food.type==="gold"?1.5:.65;frog.speed=Math.min(5.3,2.6+frog.r*.025);
   burst(food.x,food.y,food.type==="gold"?"#d7ff6a":"#61ff8a");pop("+"+(food.type==="gold"?25:10));
   foods.splice(i,1);updateUI()
 }}
 foodTimer+=dt;if(foodTimer>850){foodTimer=0;if(foods.length<22)spawnFood()}
 particles.forEach(p=>{p.x+=p.vx*f;p.y+=p.vy*f;p.life-=dt});particles=particles.filter(p=>p.life>0)
}
function burst(x,y,c){for(let i=0;i<9;i++)particles.push({x,y,vx:(Math.random()-.5)*3,vy:(Math.random()-.5)*3,life:500,c})}
function draw(){
 const w=canvas.clientWidth,h=canvas.clientHeight;
 ctx.clearRect(0,0,w,h);ctx.fillStyle="#06150c";ctx.fillRect(0,0,w,h);
 ctx.strokeStyle="rgba(120,255,150,.055)";ctx.lineWidth=1;const grid=36;
 for(let x=0;x<w;x+=grid){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke()}
 for(let y=0;y<h;y+=grid){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}
 // ponds
 for(let i=0;i<4;i++){const x=(i*211+80)%w,y=(i*137+80)%h;ctx.fillStyle="rgba(24,92,55,.16)";ctx.beginPath();ctx.ellipse(x,y,70,28,0,0,Math.PI*2);ctx.fill()}
 rocks.forEach(r=>{ctx.fillStyle="#173b26";ctx.beginPath();ctx.arc(r.x,r.y,r.r,0,7);ctx.fill();ctx.strokeStyle="#2e6b3d";ctx.stroke()});
 foods.forEach(f=>{ctx.shadowBlur=16;ctx.shadowColor=f.type==="gold"?"#e5ff6a":"#59ff86";ctx.fillStyle=f.type==="gold"?"#e5ff6a":"#68ff91";ctx.beginPath();ctx.arc(f.x,f.y,f.r,0,7);ctx.fill();ctx.shadowBlur=0});
 particles.forEach(p=>{ctx.globalAlpha=Math.max(0,p.life/500);ctx.fillStyle=p.c;ctx.fillRect(p.x,p.y,3,3);ctx.globalAlpha=1});
 // frog
 ctx.save();ctx.translate(frog.x,frog.y);ctx.rotate(Math.atan2(dir[1],dir[0]));
 ctx.shadowBlur=22;ctx.shadowColor="#4cff80";ctx.fillStyle="#48d96d";ctx.beginPath();ctx.ellipse(0,0,frog.r*1.3,frog.r,0,0,7);ctx.fill();
 ctx.fillStyle="#7cff91";ctx.beginPath();ctx.arc(frog.r*.55,-frog.r*.58,frog.r*.43,0,7);ctx.arc(frog.r*.55,frog.r*.58,frog.r*.43,0,7);ctx.fill();
 ctx.shadowBlur=0;ctx.fillStyle="#07110a";ctx.beginPath();ctx.arc(frog.r*.68,-frog.r*.58,frog.r*.13,0,7);ctx.arc(frog.r*.68,frog.r*.58,frog.r*.13,0,7);ctx.fill();
 ctx.restore()
}
$("#playBtn").onclick=start;$("#againBtn").onclick=start;$("#menuBtn").onclick=()=>{over.classList.add("hidden");home.classList.remove("hidden")};$("#quitBtn").onclick=()=>{running=false;game.classList.add("hidden");home.classList.remove("hidden")};
$("#soundBtn").onclick=()=>{sound=!sound;$("#soundBtn").textContent=sound?"🔊":"🔇"};
reset();
