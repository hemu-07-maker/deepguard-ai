let history=[], mode='image', file=null, streaming=false;

function setView(v){
  ['live','upload','history','analytics'].forEach(id=>{
    const el=document.getElementById('view-'+id);
    if(el) el.style.display=id===v?(id==='live'?'flex':'block'):'none';
  });
  document.querySelectorAll('.navbtn').forEach(b=>{
    const on=b.dataset.v===v;
    b.style.background=on?'rgba(0,229,255,.1)':'transparent';
    b.style.color=on?'var(--cyan)':'var(--text-muted)';
    b.style.fontWeight=on?'600':'500';
  });
  if(v==='history') renderHistory();
  if(v==='analytics') renderAnalytics();
}

async function callAnalyze(payload){
  const res=await fetch('/api/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
  if(res.status===401){location.href='/login';return null}
  return await res.json();
}

async function loadHistory(){
  const res=await fetch('/api/history');
  if(res.status===401){location.href='/login';return}
  history=await res.json();
  renderHistory();renderAnalytics();
}

async function engageCamera(){
  document.getElementById('liveErr').textContent='';
  try{
    const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user'},audio:false});
    const v=document.getElementById('videoEl');v.srcObject=stream;await v.play();
    streaming=true;
    document.getElementById('liveIdle').style.display='none';
    document.getElementById('liveCam').style.display='flex';
    document.getElementById('btnEngage').style.display='none';
    document.getElementById('btnStop').style.display='inline-flex';
    document.getElementById('btnAnalyze').style.display='inline-flex';
  }catch(e){document.getElementById('liveErr').textContent='Camera denied — use Upload instead'}
}
function stopCamera(){
  const v=document.getElementById('videoEl');
  if(v&&v.srcObject){v.srcObject.getTracks().forEach(t=>t.stop());v.srcObject=null}
  streaming=false;
  document.getElementById('liveIdle').style.display='flex';
  document.getElementById('liveCam').style.display='none';
  document.getElementById('btnEngage').style.display='inline-flex';
  document.getElementById('btnStop').style.display='none';
  document.getElementById('btnAnalyze').style.display='none';
}
async function analyzeFrame(){
  if(!streaming)return;
  const btn=document.getElementById('btnAnalyze');btn.disabled=true;btn.textContent='Analyzing…';
  const res=await callAnalyze({fileName:'live-'+Date.now()+'.jpg',fileSize:50000,fileType:'image/jpeg',mode:'image'});
  if(res){document.getElementById('liveResult').innerHTML=resultHTML(res);await loadHistory()}
  btn.disabled=false;btn.textContent='Analyze Frame';
}

function setMode(m){
  mode=m;
  document.querySelectorAll('.modebtn').forEach(b=>{
    b.className='btn modebtn '+(b.dataset.mode===m?'btn-outline':'btn-ghost');
  });
}
function handleFile(f){
  if(!f)return;file=f;
  document.getElementById('fileLabel').textContent=f.name+' ('+(f.size/1024).toFixed(1)+' KB)';
  document.getElementById('btnRun').disabled=false;
  if(f.type.startsWith('image/')){
    const r=new FileReader();r.onload=e=>{document.getElementById('previewImg').src=e.target.result;document.getElementById('previewWrap').style.display='block'};r.readAsDataURL(f);
  }else document.getElementById('previewWrap').style.display='none';
}
document.getElementById('fileInput').onchange=e=>handleFile(e.target.files[0]);
const dz=document.getElementById('dropZone');
dz.ondragover=e=>{e.preventDefault();dz.classList.add('over')};
dz.ondragleave=()=>dz.classList.remove('over');
dz.ondrop=e=>{e.preventDefault();dz.classList.remove('over');handleFile(e.dataTransfer.files[0])};

async function runUpload(){
  if(!file)return;
  const btn=document.getElementById('btnRun');btn.disabled=true;btn.textContent='Running inference…';
  const res=await callAnalyze({fileName:file.name,fileSize:file.size,fileType:file.type,mode});
  if(res){document.getElementById('uploadResult').innerHTML=resultHTML(res,true);await loadHistory()}
  btn.disabled=false;btn.textContent='Run Forensic Analysis';
}

function resultHTML(res,full){
  const cls=res.verdict==='FAKE'?'verdict-fake':'verdict-real';
  let arts='';
  if(full&&res.artifacts&&res.artifacts.length)
    arts=`<div class="mono" style="font-size:11px;color:var(--text-dim);margin:12px 0 8px">ARTIFACTS</div><ul style="padding-left:18px;font-size:12px;color:var(--text-muted)">${res.artifacts.map(a=>'<li style="margin-bottom:4px">'+a+'</li>').join('')}</ul>`;
  return `<div class="card" style="padding:20px"><div class="${cls}" style="display:inline-block;padding:4px 12px;border-radius:6px;font-weight:700;font-size:13px;margin-bottom:12px">${res.verdict}</div>
    <div style="font-size:28px;font-weight:700;margin-bottom:4px">${res.confidence}%</div>
    <div class="mono" style="font-size:11px;color:var(--text-dim);margin-bottom:12px">confidence · ${res.latencyMs}ms · faces: ${res.facesDetected}</div>
    <p style="font-size:12px;color:var(--text-muted);line-height:1.5">${res.reasoning}</p>${arts}</div>`;
}

function renderHistory(){
  document.getElementById('histCount').textContent=history.length+' scan(s) stored';
  const list=document.getElementById('histList');
  if(!history.length){list.innerHTML='<div class="card" style="padding:48px;text-align:center;color:var(--text-dim)"><p>No detections yet.</p></div>';return}
  list.innerHTML=history.map(item=>{
    const cls=item.verdict==='FAKE'?'verdict-fake':'verdict-real';
    return `<div class="card" style="padding:16px 20px;display:flex;align-items:center;gap:20px;margin-bottom:10px;flex-wrap:wrap">
      <div class="${cls}" style="padding:4px 10px;border-radius:6px;font-weight:700;font-size:12px;min-width:56px;text-align:center">${item.verdict}</div>
      <div style="flex:1;min-width:120px"><div style="font-weight:600;font-size:14px">${item.fileName}</div><div class="mono" style="font-size:11px;color:var(--text-dim)">${item.timestamp||''} · ${item.mode} · ${item.latencyMs}ms</div></div>
      <div style="text-align:right"><div style="font-weight:700;font-size:18px">${item.confidence}%</div></div>
    </div>`;
  }).join('');
}

function renderAnalytics(){
  const total=history.length,fakes=history.filter(h=>h.verdict==='FAKE').length;
  const avgC=total?Math.round(history.reduce((s,h)=>s+h.confidence,0)/total):0;
  const avgL=total?Math.round(history.reduce((s,h)=>s+(h.latencyMs||0),0)/total):0;
  document.getElementById('analyticsCards').innerHTML=`
    <div class="card" style="padding:20px"><div class="mono" style="font-size:10px;color:var(--text-dim);margin-bottom:8px">TOTAL SCANS</div><div style="font-size:28px;font-weight:700">${total}</div></div>
    <div class="card" style="padding:20px"><div class="mono" style="font-size:10px;color:var(--text-dim);margin-bottom:8px">FAKE RATE</div><div style="font-size:28px;font-weight:700">${total?Math.round(fakes/total*100)+'%':'—'}</div></div>
    <div class="card" style="padding:20px"><div class="mono" style="font-size:10px;color:var(--text-dim);margin-bottom:8px">AVG CONFIDENCE</div><div style="font-size:28px;font-weight:700">${total?avgC+'%':'—'}</div></div>
    <div class="card" style="padding:20px"><div class="mono" style="font-size:10px;color:var(--text-dim);margin-bottom:8px">AVG LATENCY</div><div style="font-size:28px;font-weight:700">${total?avgL+'ms':'—'}</div></div>`;
}

async function clearHistory(){
  await fetch('/api/history',{method:'DELETE'});
  history=[];renderHistory();renderAnalytics();
}

function tick(){document.getElementById('utcClock').textContent=new Date().toISOString().replace('T',' ').slice(0,19)+' UTC'}
tick();setInterval(tick,1000);
loadHistory();
