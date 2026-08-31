const GOAL=45,PULLDOWN_VALUE=.5,ERROR_PENALTY=2;
const cfg=window.LIFT_DRIVER_CONFIG||{},configured=Boolean(cfg.supabaseUrl&&cfg.supabaseAnonKey),client=configured?supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey):null;
const fileInput=document.getElementById('fileInput'),dropZone=document.getElementById('dropZone'),dashboard=document.getElementById('dashboard'),uploadSection=document.getElementById('uploadSection'),grid=document.getElementById('driverGrid'),template=document.getElementById('driverTemplate');
let drivers=[];
const authGate=document.getElementById('authGate'),appShell=document.getElementById('appShell');
document.getElementById('productionDate').value=new Date().toISOString().slice(0,10);
document.getElementById('previewModeBtn').addEventListener('click',()=>openApp('Preview mode'));
document.getElementById('authForm').addEventListener('submit',async e=>{e.preventDefault();const error=document.getElementById('authError');if(!configured){error.textContent='Supabase still needs its publishable key. Use Preview mode for now.';return}error.textContent='';const {data, error:authError}=await client.auth.signInWithPassword({email:document.getElementById('authEmail').value.trim(),password:document.getElementById('authPassword').value});if(authError){error.textContent=authError.message;return}openApp(data.user.email)});
document.getElementById('signOutBtn').addEventListener('click',async()=>{if(client)await client.auth.signOut();appShell.classList.add('hidden');authGate.classList.remove('hidden')});
function openApp(email){authGate.classList.add('hidden');appShell.classList.remove('hidden');document.getElementById('signedInEmail').textContent=email}
if(configured)client.auth.getSession().then(({data})=>data.session&&openApp(data.session.user.email));

const demo=[['Diamond Whitner',30],['Dawitt Mengesha',41],['Dury Anderson',17],['Kristopher Mintier',7],['Brandon Evanshine',8]];
document.getElementById('demoBtn').addEventListener('click',()=>loadDrivers(demo,'Sample Bin Transfer Productivity.xlsx'));
document.getElementById('resetBtn').addEventListener('click',()=>{drivers=[];grid.innerHTML='';dashboard.classList.add('hidden');uploadSection.classList.remove('hidden');fileInput.value=''});
fileInput.addEventListener('change',e=>e.target.files[0]&&readFile(e.target.files[0]));
['dragenter','dragover'].forEach(type=>dropZone.addEventListener(type,e=>{e.preventDefault();dropZone.classList.add('dragover')}));
['dragleave','drop'].forEach(type=>dropZone.addEventListener(type,e=>{e.preventDefault();dropZone.classList.remove('dragover')}));
dropZone.addEventListener('drop',e=>e.dataTransfer.files[0]&&readFile(e.dataTransfer.files[0]));

function readFile(file){
 const reader=new FileReader();
 reader.onload=e=>{try{const wb=XLSX.read(e.target.result,{type:'array'}),ws=wb.Sheets[wb.SheetNames[0]],rows=XLSX.utils.sheet_to_json(ws,{header:1,defval:null});loadDrivers(extractDrivers(rows),file.name)}catch(err){alert('That file could not be read. Please upload the Bin Transfer Productivity Excel report.')}};
 reader.readAsArrayBuffer(file);
}
function extractDrivers(rows){
 const headerIndex=rows.findIndex(row=>row.some(v=>String(v??'').trim().toLowerCase()==='employee'));
 if(headerIndex<0)throw new Error('Employee column not found');
 const headers=rows[headerIndex].map(v=>String(v??'').trim().toLowerCase());
 const employeeCol=headers.indexOf('employee');
 const movesCol=headers.findIndex(h=>h.includes("lines xfer")||h.includes('bin move')||h.includes('lines transferred'));
 if(movesCol<0)throw new Error('Moves column not found');
 return rows.slice(headerIndex+1).map(row=>[String(row[employeeCol]??'').trim(),Number(row[movesCol])||0]).filter(([name])=>name&&name.toLowerCase()!=='totals');
}
function loadDrivers(data,fileName){
 drivers=data.map(([name,binMoves])=>({name,binMoves,pulldowns:0,errors:0}));
 if(!drivers.length){alert('No employee production rows were found.');return}
 document.getElementById('fileName').textContent=fileName;
 uploadSection.classList.add('hidden');dashboard.classList.remove('hidden');render();dashboard.scrollIntoView({behavior:'smooth',block:'start'});
}
function render(){
 grid.innerHTML='';drivers.forEach((driver,index)=>{const node=template.content.cloneNode(true),card=node.querySelector('.driver-card');
  node.querySelector('.driver-name').textContent=driver.name;node.querySelector('.bin-input').value=driver.binMoves;
  const pull=node.querySelector('.pulldown-input'),errors=node.querySelector('.error-input');pull.value=driver.pulldowns;errors.value=driver.errors;
  pull.addEventListener('input',()=>{driver.pulldowns=Math.max(0,Number(pull.value)||0);updateCard(card,driver);updateSummary()});
  errors.addEventListener('input',()=>{driver.errors=Math.max(0,Number(errors.value)||0);updateCard(card,driver);updateSummary()});
  updateCard(card,driver);grid.appendChild(node);
 });updateSummary();
}
function score(d){const pullCredit=d.pulldowns*PULLDOWN_VALUE,errorCost=d.errors*ERROR_PENALTY,adjusted=Math.max(0,d.binMoves+pullCredit-errorCost),percent=adjusted/GOAL*100;return{pullCredit,errorCost,adjusted,percent}}
function updateCard(card,d){const s=score(d),fmt=n=>Number.isInteger(n)?n:n.toFixed(2).replace(/0$/,'');card.querySelector('.calc-bin').textContent=fmt(d.binMoves);card.querySelector('.calc-pull').textContent=`+${fmt(s.pullCredit)}`;card.querySelector('.calc-error').textContent=`−${fmt(s.errorCost)}`;card.querySelector('.calc-total').textContent=fmt(s.adjusted);card.querySelector('.score-value').textContent=`${s.percent.toFixed(1)}%`;card.querySelector('.progress-bar').style.width=`${Math.min(100,s.percent)}%`;card.classList.remove('status-low','status-close','status-goal');card.classList.add(s.percent>=100?'status-goal':s.percent>=80?'status-close':'status-low');card.querySelector('.explanation').innerHTML=`<b>${d.name}</b> completed <b>${fmt(d.binMoves)} bin moves</b> and <b>${fmt(d.pulldowns)} pulldowns</b>, adding ${fmt(s.pullCredit)} move credit. ${d.errors} accuracy ${d.errors===1?'error':'errors'} deducted ${fmt(s.errorCost)} moves. Final: <b>${fmt(s.adjusted)} of ${GOAL} = ${s.percent.toFixed(1)}%</b>.`}
function updateSummary(){document.getElementById('employeeCount').textContent=drivers.length;document.getElementById('teamMoves').textContent=drivers.reduce((a,d)=>a+d.binMoves,0);document.getElementById('atGoal').textContent=drivers.filter(d=>score(d).percent>=100).length}
document.getElementById('syncPullsBtn').addEventListener('click',async()=>{if(!client){alert('Connect Supabase first, or enter pulldowns manually.');return}const day=document.getElementById('productionDate').value,start=new Date(day+'T00:00:00'),end=new Date(day+'T00:00:00');end.setDate(end.getDate()+1);const {data,error}=await client.from('pulldowns').select('driver_name,created_at').gte('created_at',start.toISOString()).lt('created_at',end.toISOString());if(error){alert(error.message);return}const totals={};(data||[]).forEach(row=>{const key=String(row.driver_name||'').trim().toLowerCase();totals[key]=(totals[key]||0)+1});drivers.forEach(d=>d.pulldowns=totals[d.name.trim().toLowerCase()]||0);render();alert('Pulldown totals synced for '+day+'.')});
function reportText(){return ['Lift Driver Production — '+document.getElementById('productionDate').value,'Goal: 45 | Pulldown value: 0.5 | Error penalty: 2','',...drivers.map(d=>{const s=score(d);return `${d.name}: ${d.binMoves} bin moves + ${d.pulldowns} pulldowns (${s.pullCredit}) - ${d.errors} errors (${s.errorCost}) = ${s.adjusted} adjusted moves — ${s.percent.toFixed(1)}%`})].join('\n')}
document.getElementById('copyReportBtn').addEventListener('click',async()=>{await navigator.clipboard.writeText(reportText());alert('Production report copied.')});
document.getElementById('printReportBtn').addEventListener('click',()=>window.print());
