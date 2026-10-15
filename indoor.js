// Prototype: sơ đồ trong tòa nhà (minh họa, chưa phải mặt bằng thật).
// Mã phòng VLU: <Tòa><Tầng>.<Phòng>, ví dụ J10.03 = tòa J, tầng 10, phòng 03.
const FLOORS={A:7,C:8,D:10,F:10,G:10,I:12,J:14,K:6}; // số tầng demo
const ROOMS=10;
export function parseRoom(text){
 const m=String(text||'').trim().toUpperCase().match(/^([A-Z])\s*(\d{1,2})\s*[.,]\s*(\d{1,2})$/);
 if(!m)return {error:'Nhập mã phòng dạng J10.03 hoặc F6.01.'};
 const [,b,f,r]=m;const floor=+f,room=+r;
 if(!FLOORS[b])return {error:`Không có tòa ${b} trên bản đồ.`};
 if(floor<1||floor>FLOORS[b])return {error:`Tòa ${b} có tầng 1 đến ${FLOORS[b]} (demo).`};
 if(room<1||room>ROOMS)return {error:`Mỗi tầng có phòng 01 đến ${String(ROOMS).padStart(2,'0')} (demo).`};
 return {building:b,floor,room,code:`${b}${floor}.${String(room).padStart(2,'0')}`};
}
// Bố cục chung mỗi tầng: phòng 01–06 phía trên hành lang, 07–08 trái và 09–10 phải phía dưới, lõi thang máy ở giữa.
const roomBox=n=>n<=6?{x:20+(n-1)*53.33,y:40,w:53.33,h:180,door:[20+(n-.5)*53.33,220]}
 :{x:n<=8?20+(n-7)*53:234+(n-9)*53,y:280,w:53,h:200,door:[n<=8?20+(n-6.5)*53:234+(n-8.5)*53,280]};
const ENTRY=[20,250],LIFT=[180,292];
function plan(t,step){
 const onLift=step===0&&t.floor>1;const floorNo=onLift?1:t.floor;
 let pts;if(onLift)pts=[ENTRY,[180,250],LIFT];
 else{const d=roomBox(t.room).door;pts=t.floor===1?[ENTRY,[d[0],250],d]:[LIFT,[180,250],[d[0],250],d]}
 const rooms=Array.from({length:ROOMS},(_,i)=>{const n=i+1,r=roomBox(n),hit=!onLift&&n===t.room;const label=floorNo===1&&!hit?'':`${t.building}${floorNo}.${String(n).padStart(2,'0')}`;
  return `<g class="in-room${hit?' hit':''}"><rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}"/><text x="${r.x+r.w/2}" y="${r.y+r.h/2}">${label}</text></g>`}).join('');
 const lobby=floorNo===1?'<text class="in-lobby" x="180" y="135">SẢNH TẦNG 1</text>':'';
 return `<svg viewBox="0 0 360 520" class="in-svg" role="img" aria-label="Sơ đồ tầng ${floorNo} tòa ${t.building}">
 <rect class="in-wall" x="20" y="40" width="320" height="440" rx="6"/>${floorNo===1?'<rect class="in-floor1" x="20" y="40" width="320" height="180"/>':''}${rooms}${lobby}
 <rect class="in-corridor" x="20" y="220" width="320" height="60"/><text class="in-cor-text" x="290" y="254">HÀNH LANG</text>
 <g class="in-core${onLift?' hit':''}"><rect x="126" y="280" width="108" height="200"/><rect class="in-lift" x="138" y="300" width="38" height="44"/><rect class="in-lift" x="184" y="300" width="38" height="44"/><text x="180" y="372">THANG MÁY</text><path class="in-stair" d="M140 400h80M140 415h80M140 430h80M140 445h80M140 460h80"/><text class="in-small" x="180" y="395">Thang bộ</text></g>
 ${floorNo===1?'<g class="in-entry"><path d="M2 236v28"/><text x="24" y="300" text-anchor="start">Cửa vào</text></g>':''}
 <path class="in-route-bg" d="M${pts.join('L')}"/><path class="in-route" d="M${pts.join('L')}"/>
 <circle class="in-you" cx="${pts[0][0]}" cy="${pts[0][1]}" r="9"/><circle class="in-dest" cx="${pts.at(-1)[0]}" cy="${pts.at(-1)[1]}" r="8"/>
 </svg>`;
}
let el,current=null,step=0;
function render(){
 const t=current;const two=t.floor>1;
 const steps=two?[`Tầng 1 · Tới thang máy`,`Tầng ${t.floor} · Tới phòng`]:[`Tầng 1 · Tới phòng`];
 const text=two?(step===0?`Vào tòa ${t.building}, đi thẳng theo hành lang tới <b>thang máy</b> ở giữa tòa. Bấm <b>tầng ${t.floor}</b>.`:`Ra khỏi thang máy ở tầng ${t.floor}, rẽ vào hành lang và đi tới phòng <b>${t.code}</b> (ô đỏ).`)
  :`Phòng <b>${t.code}</b> ở ngay tầng 1, đi theo hành lang tới ô đỏ.`;
 el.querySelector('.in-body').innerHTML=`<div class="in-steps">${steps.map((s,i)=>`<button type="button" data-step="${i}" aria-pressed="${i===step}"><span>${i+1}</span>${s}</button>`).join('')}</div>
 <p class="in-text">${text}</p>${plan(t,step)}
 ${two&&step===0?`<button type="button" class="in-next">Đã lên tầng ${t.floor} →</button>`:''}
 <p class="in-note">Sơ đồ tầng minh họa cho prototype, chưa phải mặt bằng thật.</p>`;
 el.querySelectorAll('[data-step]').forEach(b=>b.onclick=()=>{step=+b.dataset.step;render()});
 el.querySelector('.in-next')?.addEventListener('click',()=>{step=1;render()});
}
function search(value){
 const r=parseRoom(value);const err=el.querySelector('.in-error');
 if(r.error){err.textContent=r.error;return}
 err.textContent='';current=r;step=0;el.querySelector('.in-title').textContent=`Tòa ${r.building} · Phòng ${r.code}`;render();
}
export function openIndoor(building,room=''){
 if(!el){el=document.createElement('section');el.className='indoor';el.setAttribute('role','dialog');el.setAttribute('aria-label','Tìm phòng trong tòa nhà');document.body.append(el)}
 el.innerHTML=`<header class="in-head"><div><small>TRONG TÒA NHÀ</small><h2 class="in-title">Tòa ${building} · Tìm phòng</h2></div><button type="button" class="in-close" aria-label="Quay lại bản đồ khuôn viên">✕</button></header>
 <form class="in-form"><input name="room" autocomplete="off" placeholder="Mã phòng, ví dụ ${building}5.03" value="${room}" aria-label="Mã phòng"><button>Tìm</button></form><p class="in-error" role="alert"></p><div class="in-body"><p class="in-text">Nhập mã phòng để xem đường từ cửa vào tới thang máy rồi tới phòng.</p></div>`;
 el.hidden=false;el.querySelector('.in-close').onclick=()=>{el.hidden=true};
 el.querySelector('.in-form').onsubmit=e=>{e.preventDefault();search(e.target.room.value)};
 if(room)search(room);else el.querySelector('input').focus();
}
