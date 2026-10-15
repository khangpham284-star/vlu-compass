import {findRoutes,qrPoints,nodes,entrances} from './route.js?v=5';
import {places,categories} from './places.js';
import {openIndoor,parseRoom} from './indoor.js';
let pendingRoom='';
const buildings = {
 A:{title:'Thư viện & hội trường',description:'Các phòng ban chức năng, thư viện và hội trường Trịnh Công Sơn.',cue:'Khối nhà thấp với mặt tiền màu cam và cảnh quan bao quanh.'},
 C:{title:'Phòng học tiêu chuẩn',description:'Khu phòng học tiêu chuẩn.',cue:'Tòa nhà cao với nhiều khung màu đỏ.'},
 D:{title:'Giảng đường & phòng học',description:'Giảng đường, hội trường và phòng học.',cue:'Khối nhà cao, có mảng màu cam ở phần chân đế.'},
 F:{title:'Xưởng & phòng học',description:'Xưởng thực hành chuyên biệt và phòng học.',cue:'Mặt đứng kính với các dải màu vàng nổi bật.'},
 G:{title:'Tòa nhà đa chức năng',description:'Tòa nhà đa chức năng, hội trường và phòng học.',cue:'Mặt tiền sáng màu, phía trên có khối kính màu xanh.'},
 I:{title:'Ký túc xá & giảng đường',description:'Ký túc xá, giảng đường không gian mở và hội thảo khoa học quốc tế.',cue:'Khối nhà dài với các dải màu vàng và xanh.'},
 J:{title:'Tiện ích & học tập',description:'Starbucks, thể thao đa năng, phim trường và lab thiết kế.',cue:'Mặt tiền sáng màu với các dải kính xanh thẳng đứng.'},
 K:{title:'Triển lãm & sáng tạo',description:'Không gian triển lãm, tương tác nghệ thuật và truyền thông số.',cue:'Khối nhà bo tròn, được bao quanh bởi các nan ngang.'}
};
const $ = s=>document.querySelector(s);
const ns='http://www.w3.org/2000/svg';
const map=$('#campus'),viewport=$('#mapViewport'),sheet=$('#bottomSheet'),content=$('#sheetContent');
const initialContent=content.innerHTML;
const params=new URLSearchParams(location.search);const requestedQr=params.get('qr')||(location.hash.match(/qr(\d+)/i)||[])[1]||'01';const isRain=requestedQr==='02';
const qr=qrPoints[requestedQr]||qrPoints['01'];
let selected=null,selectedEntrance=null,routeSet=null,activeRoute=0,expanded=false,toastTimer,arrowFrame;
let selectedPlace=null,panel='home',placeCategory='all';
let camera={x:720,y:365,scale:.7};let activePoints=null;
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
const svgEl=(name,attrs={})=>{const el=document.createElementNS(ns,name);for(const [k,v]of Object.entries(attrs))el.setAttribute(k,v);return el};
const icons={close:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>',photo:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8" cy="8" r="1.5"/><path d="m3 16 5-5 6 6 3-3 4 4"/></svg>',walk:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="13" cy="4" r="2"/><path d="m8 21 3-6 4 6m-5-9 2-5 3 5 4 1M5 12l3-3 4-2 1 7"/></svg>'};
function announce(message){$('#liveStatus').textContent=message}
function toast(message){clearTimeout(toastTimer);$('#toast').textContent=message;$('#toast').hidden=false;toastTimer=setTimeout(()=>$('#toast').hidden=true,3600)}
function wireChips(){
 const holder=$('#buildingChips');holder.replaceChildren();
 for(const key of Object.keys(buildings)){
  const button=document.createElement('button');button.type='button';button.textContent=key;button.setAttribute('aria-label',`Chỉ đường đến tòa ${key}`);button.onclick=()=>selectBuilding(key);holder.append(button);
 }
 const form=$('#roomSearch');if(form)form.onsubmit=e=>{e.preventDefault();const r=parseRoom(e.target.room.value);if(r.error){$('#roomSearchError').textContent=r.error;return}pendingRoom=r.code;selectBuilding(r.building)};
}
function clearSelection(){
 selectedPlace=null;panel='home';sheet.classList.remove('place-directory','place-detail');$('#legendToggle').setAttribute('aria-expanded','false');
 selected=null;routeSet=null;activePoints=null;expanded=false;sheet.classList.remove('expanded','has-route');
 content.innerHTML=initialContent;wireChips();document.querySelectorAll('[data-building]').forEach(el=>{el.classList.remove('selected');el.setAttribute('aria-pressed','false')});
 $('#routes').replaceChildren();$('#destinationMarker').replaceChildren();selectedEntrance=null;cancelAnimationFrame(arrowFrame);$('#youTooltip').classList.remove('compact');
 fitCampus();announce('Chọn tòa nhà trên bản đồ.');
}
function selectBuilding(key,entry=null){
 if(key==='B'){toast('Tòa B chưa hoạt động theo sơ đồ hiện có.');return false}
 if(!Object.hasOwn(buildings,key))throw new Error('Tòa nhà không hợp lệ.');
 selectedPlace=null;panel='route';sheet.classList.remove('place-directory','place-detail');$('#legendToggle').setAttribute('aria-expanded','false');
 selected=key;selectedEntrance=entry;routeSet=findRoutes(key,qr.node,entry);activeRoute=isRain&&routeSet.alternative?1:0;expanded=false;sheet.classList.add('has-route');sheet.classList.remove('expanded');
 document.querySelectorAll('[data-building]').forEach(el=>{el.classList.toggle('selected',el.dataset.building===key);el.setAttribute('aria-pressed',String(el.dataset.building===key))});
 renderSheet();drawRoutes();fitRoute();announce(`Đường đi từ ${qr.label} đến tòa ${key}. Có ${routeSet.alternative?2:1} tuyến trên sơ đồ.`);return true;
}
function renderSheet(){
 const b=buildings[selected];const choices=routeSet.alternative?`<button type="button" class="route-choice" data-route="1"><span class="route-swatch alternate"></span><span>${isRain?'Mái che · dài hơn':'Lối khác'}<small>${isRain?'Mô phỏng có mái hiên/ô':'Vòng hơn'}</small></span></button>`:'';
 content.innerHTML=`<div class="destination-summary"><button class="building-photo-button" type="button" aria-label="Xem ảnh tòa ${selected}"><img src="assets/${selected}.jpg" alt="Tòa ${selected}"/><span>${icons.photo}</span></button><div class="destination-title"><div class="from-location">${icons.walk}<span>Từ ${qr.label}</span></div><h1>Tòa ${selected}</h1><p>${b.title}</p></div><button type="button" class="close-selection icon-button" aria-label="Bỏ chọn tòa nhà">${icons.close}</button></div><div class="route-options" aria-label="Chọn tuyến đường"><button type="button" class="route-choice" data-route="0"><span class="route-swatch"></span><span>${isRain?'Lối ngắn nhất':'Đường đề xuất'}<small>Không có mái che</small></span></button>${choices}</div><div class="route-instruction"><span class="turn-symbol" aria-hidden="true"></span><span class="instruction-text"></span></div><div class="photo-drawer" id="photoDrawer" hidden><div class="drawer-heading"><h2>Nhận diện tòa ${selected}</h2><span>Góc tổng thể</span></div><img class="hero-photo" src="assets/${selected}.jpg" alt="Góc tổng thể tòa ${selected}: ${b.cue}"><div class="photo-info"><h3>Dễ nhận ra qua</h3><p>${b.cue}</p><h3>Bên trong tòa</h3><p>${b.description}</p><p class="photo-credit">Ảnh từ sơ đồ khuôn viên VLU.</p></div></div><div class="sheet-actions"><button type="button" class="photo-toggle" aria-expanded="false" aria-controls="photoDrawer">${icons.photo}<span>Xem ảnh tòa nhà</span><span class="expand-symbol" aria-hidden="true"></span></button></div><p class="route-footnote">${isRain&&activeRoute===1?'Mái che minh họa · cần xác nhận thực địa':'Tuyến đi minh họa'}</p>`;
 const go=document.createElement('button');go.type='button';go.className='indoor-open';go.textContent=pendingRoom&&pendingRoom[0]===selected?`Đã tới tòa ${selected} · Chỉ đường tới phòng ${pendingRoom}`:`Đã tới tòa ${selected} · Tìm phòng`;go.onclick=()=>openIndoor(selected,pendingRoom[0]===selected?pendingRoom:'');$('.sheet-actions').append(go);
 $('.close-selection').onclick=clearSelection;
 $('.building-photo-button').onclick=()=>setExpanded(!expanded);
 $('.photo-toggle').onclick=()=>setExpanded(!expanded);
 document.querySelectorAll('[data-route]').forEach(button=>button.onclick=()=>chooseRoute(Number(button.dataset.route)));
 updateRouteChoice();
 const facilities=places.filter(p=>p.building===selected&&p.category==='food');
 if(facilities.length){const row=document.createElement('div');row.className='building-facilities';for(const p of facilities){const button=document.createElement('button');button.type='button';button.textContent=selected==='J'?'☕ Starbucks · Tầng 1':'Ministop · Tòa F';button.onclick=()=>selectPlace(p.id);row.append(button)}$('.destination-summary').after(row)}
}
function closePlacePanel(){
 selectedPlace=null;sheet.classList.remove('place-directory','place-detail');$('#legendToggle').setAttribute('aria-expanded','false');
 if(selected){panel='route';sheet.classList.add('has-route');renderSheet();fitRoute()}
 else clearSelection();
}
function showPlaces(category=placeCategory){
 if(category!=='all'&&!Object.hasOwn(categories,category))throw new Error('Danh mục không hợp lệ.');
 panel='places';selectedPlace=null;placeCategory=category;expanded=false;sheet.classList.remove('expanded','has-route','place-detail');sheet.classList.add('place-directory');$('#legendToggle').setAttribute('aria-expanded','true');
 const filtered=category==='all'?places:places.filter(p=>p.category===category);
 content.innerHTML=`<div class="places-header"><div><div class="eyebrow">THEO SƠ ĐỒ KHUÔN VIÊN</div><h1>Chú thích & tiện ích</h1></div><button type="button" class="icon-button close-places" aria-label="Đóng chú thích">${icons.close}</button></div><div class="place-categories" aria-label="Loại địa điểm">${[['all','Tất cả'],...Object.entries(categories)].map(([id,title])=>`<button type="button" data-category="${id}" aria-pressed="${id===category}">${title}</button>`).join('')}</div><details class="map-key"><summary>Đọc màu và ký hiệu trên bản đồ</summary><dl><div><dt><i class="key-road"></i>Đường màu xanh</dt><dd>Đường xuyên tâm, đường quanh khuôn viên.</dd></div><div><dt><i class="key-walk"></i>Lối màu vàng nhạt</dt><dd>Các lối đi trong khuôn viên trường.</dd></div><div><dt><i class="key-door"></i>Vạch đỏ cam</dt><dd>Cổng, cửa vào tòa nhà và khu phức hợp.</dd></div><div><dt><i class="key-restricted"></i>Viền nét đứt</dt><dd>Khu vực hạn chế cho đối tượng cụ thể.</dd></div><div><dt><i class="key-ramp"></i>Hình vàng cam</dt><dd>Lối ống lồng xuống bãi giữ xe B3.</dd></div><div><dt><i class="key-water"></i>Vùng nước quanh K</dt><dd>Hồ nước tại tòa K.</dd></div><div><dt><b>↔ / →</b> Mũi tên trên đường</dt><dd>Chiều lưu thông một chiều hoặc hai chiều theo sơ đồ.</dd></div></dl></details><div class="place-list">${filtered.map(p=>`<button type="button" class="place-row" data-place="${p.id}"><span class="place-symbol category-${p.category}" aria-hidden="true">${p.mark}</span><span><strong>${p.name}</strong><small>${p.where}${p.restricted?' · Có giới hạn sử dụng':''}</small></span><span class="place-zoom" aria-hidden="true">⌖</span></button>`).join('')}</div><p class="place-source">Vị trí và tên theo sơ đồ khuôn viên VLU 2026.</p>`;
 $('.close-places').onclick=closePlacePanel;
 document.querySelectorAll('[data-category]').forEach(b=>b.onclick=()=>showPlaces(b.dataset.category));
 document.querySelectorAll('.place-row').forEach(b=>b.onclick=()=>selectPlace(b.dataset.place));
 content.scrollTop=0;renderPlaceMarkers();announce(`${filtered.length} địa điểm trong danh mục ${categories[category]||'Tất cả'}.`);
}
function selectPlace(id){
 const p=places.find(p=>p.id===id);if(!p)throw new Error('Địa điểm không hợp lệ.');
 selectedPlace=p;panel='place';expanded=false;sheet.classList.remove('expanded','has-route','place-directory');sheet.classList.add('place-detail');$('#legendToggle').setAttribute('aria-expanded','true');
 content.innerHTML=`<div class="places-header"><div><div class="eyebrow">${categories[p.category].toUpperCase()}</div><h1>${p.name}</h1></div><button type="button" class="icon-button close-places" aria-label="Đóng địa điểm">${icons.close}</button></div><div class="place-description"><p class="place-location">${p.where}</p><p>${p.detail}</p>${p.restricted?'<p class="restricted-note">Khu vực có giới hạn sử dụng theo sơ đồ.</p>':''}</div><div class="place-actions">${p.building?`<button type="button" class="place-directions">Chỉ đường đến tòa ${p.building}</button>`:''}<button type="button" class="place-back">Xem các địa điểm khác</button>${selected?'<button type="button" class="resume-route">Về tuyến đường đang xem</button>':''}</div>`;
 $('.close-places').onclick=closePlacePanel;$('.place-back').onclick=()=>showPlaces();
 if(p.building)$('.place-directions').onclick=()=>selectBuilding(p.building);
 if(selected)$('.resume-route').onclick=closePlacePanel;
 content.scrollTop=0;fitPoints([[p.x-100,p.y-80],[p.x+100,p.y+80]],1.5,40);announce(`${p.name}. ${p.where}.`);
}
function renderDoorMarkers(){
 const group=$('#doorMarkers');if(!group)return;group.replaceChildren();
 Object.entries(entrances).forEach(([building,ids])=>ids.forEach(id=>{
  const point=nodes[id];if(!point)return;
  const g=svgEl('g',{transform:`translate(${point[0]} ${point[1]}) scale(${1/camera.scale})`,class:`door-marker${selectedEntrance===id?' is-selected':''}`,'data-door':id,'data-building':building,role:'button',tabindex:0,'aria-label':`Đường đến cửa tòa ${building}`});
  g.append(svgEl('circle',{r:18,class:'door-hit',opacity:0}));
  g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectBuilding(building,id)}});group.append(g);
 }));
}
function renderPlaceMarkers(){
 const group=$('#placeMarkers');group.replaceChildren();
 const visible=selectedPlace?[selectedPlace]:placeCategory==='all'?places.filter(p=>p.category==='food'):places.filter(p=>p.category===placeCategory);
 visible.forEach(p=>{
  const positions=[[p.x,p.y],...(selectedPlace?p.also||[]:[])];
  positions.forEach(([x,y],i)=>{
   const g=svgEl('g',{transform:`translate(${x} ${y}) scale(${1/camera.scale})`,class:`poi-marker category-${p.category}${selectedPlace?' is-selected':''}`,'data-place':p.id,role:'button',tabindex:0,'aria-label':`${p.name}, ${p.where}`});
   g.append(svgEl('circle',{r:22,fill:'transparent',class:'poi-hit'}));g.append(svgEl('circle',{r:13,class:'poi-disc'}));
   const symbol=svgEl('text',{x:0,y:4,'text-anchor':'middle',class:'poi-symbol'});symbol.textContent=p.mark;g.append(symbol);
   const showName=i===0&&(Boolean(selectedPlace)||camera.scale>.8);
   if(showName){const label=p.id==='starbucks'?'Starbucks':p.name;const width=Math.min(250,label.length*6.4+18);const rect=svgEl('rect',{x:28,y:-13,width,height:26,rx:8,class:'poi-name-bg'});g.append(rect);const t=svgEl('text',{x:37,y:4,class:'poi-name'});t.textContent=label;g.append(t)}
   g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectPlace(p.id)}});group.append(g);
  });
 });
}
$('#legendToggle').onclick=()=>panel==='places'||panel==='place'?closePlacePanel():showPlaces();
function updateRouteChoice(){
 document.querySelectorAll('[data-route]').forEach(button=>{button.classList.toggle('active',Number(button.dataset.route)===activeRoute);button.setAttribute('aria-pressed',String(Number(button.dataset.route)===activeRoute))});
 const route=activeRoute===0?routeSet.primary:routeSet.alternative;
 const p=route.points,dx=p[1][0]-p[0][0],dy=p[1][1]-p[0][1];
 let instruction,turn;
 if(Math.abs(dx)>Math.abs(dy)){instruction=dx>0?'Đi theo lối bên cạnh hầm B3':'Đi về phía tòa F';turn=dx>0?'↱':'↰'}
 else{instruction=dy<0?'Đi lên lối đi giữa tòa F và D':'Đi theo lối bên cạnh hầm B3';turn=dy<0?'↑':'↓'}
 $('.turn-symbol').textContent=turn;$('.instruction-text').textContent=instruction;
}
function chooseRoute(index){
 if(!routeSet||![0,1].includes(index)||(index===1&&!routeSet.alternative))throw new Error('Tuyến đường không hợp lệ.');
 activeRoute=index;updateRouteChoice();drawRoutes();fitRoute();announce(index?'Đã chọn đường thay thế.':'Đã chọn đường đề xuất.');
}
function setExpanded(value){
 if(!selected||panel!=='route')return;expanded=Boolean(value);sheet.classList.toggle('expanded',expanded);
 $('#photoDrawer').hidden=!expanded;$('.photo-toggle').setAttribute('aria-expanded',String(expanded));
 $('.photo-toggle>span').textContent=expanded?'Thu gọn ảnh':'Xem ảnh tòa nhà';
 if(!expanded)content.scrollTop=0;
 fitRoute();
 announce(expanded?`Đang xem ảnh tòa ${selected}.`:'Đã thu gọn ảnh.');
}
function routePath(route){return route.points.map((p,i)=>`${i?'L':'M'}${p[0]} ${p[1]}`).join(' ')}
function drawRoutes(){
 cancelAnimationFrame(arrowFrame);const layer=$('#routes');layer.replaceChildren();
 const main=activeRoute===0?routeSet.primary:routeSet.alternative;
 const other=activeRoute===0?routeSet.alternative:routeSet.primary;
 if(other){const p=svgEl('path',{d:routePath(other),class:'route-path route-secondary'});layer.append(p)}
 layer.append(svgEl('path',{d:routePath(main),class:'route-path route-casing'}));
 const path=svgEl('path',{d:routePath(main),class:'route-path route-main'});layer.append(path);
 const arrowLayer=svgEl('g',{'aria-hidden':'true',class:'direction-arrows'});layer.append(arrowLayer);
 const total=path.getTotalLength();const count=Math.max(1,Math.floor(total/46));const arrows=[];
 for(let i=0;i<count;i++){const a=svgEl('path',{d:'M-3 -3.5L1 0L-3 3.5',class:'route-chevron'});arrowLayer.append(a);arrows.push(a)}
 let started;
 function tick(time){
  if(started===undefined)started=time;const motion=reducedMotion.matches?0:(time-started)*.014;
  arrows.forEach((a,i)=>{const d=(15+i*(total/count)+motion)%total;const pt=path.getPointAtLength(d);const next=path.getPointAtLength(Math.min(total,d+1));const angle=Math.atan2(next.y-pt.y,next.x-pt.x)*180/Math.PI;a.setAttribute('transform',`translate(${pt.x} ${pt.y}) rotate(${angle})`);a.style.opacity=d<12||d>total-9?'0':'1'});
  if(!reducedMotion.matches)arrowFrame=requestAnimationFrame(tick);
 }
 arrowFrame=requestAnimationFrame(tick);
 const last=main.points.at(-1);$('#destinationMarker').replaceChildren(svgEl('circle',{cx:last[0],cy:last[1],r:8,fill:'white',stroke:'#245cdf','stroke-width':4}));
 $('#youTooltip').classList.remove('compact');
}
function updateCamera(){
 const w=viewport.clientWidth,h=viewport.clientHeight;
 map.setAttribute('viewBox',`${camera.x-w/(2*camera.scale)} ${camera.y-h/(2*camera.scale)} ${w/camera.scale} ${h/camera.scale}`);
 $('#zoomIn').disabled=camera.scale>=2.39;$('#zoomOut').disabled=camera.scale<=.32;$('#youTooltip').setAttribute('transform',`translate(903 510) scale(${1/camera.scale})`);
 renderPlaceMarkers();
 renderDoorMarkers();
}
function safeRect(){
 const w=viewport.clientWidth,h=viewport.clientHeight;
 if(w>900)return {x:455,y:45,w:Math.max(340,w-520),h:h-85};
 return {x:18,y:60,w:w-36,h:Math.max(160,h-sheet.offsetHeight-85)};
}
function fitPoints(points,limit=1.65,pad=40){
 const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);const r=safeRect();
 const minx=Math.min(...xs)-pad,maxx=Math.max(...xs)+pad,miny=Math.min(...ys)-pad,maxy=Math.max(...ys)+pad;
 const scale=Math.min(r.w/(maxx-minx),r.h/(maxy-miny),limit);
 camera.scale=Math.max(.32,scale);const centerX=(minx+maxx)/2,centerY=(miny+maxy)/2;
 camera.x=centerX+(viewport.clientWidth/2-(r.x+r.w/2))/camera.scale;
 camera.y=centerY+(viewport.clientHeight/2-(r.y+r.h/2))/camera.scale;updateCamera();
}
function fitCampus(){activePoints=null;fitPoints([[300,80],[1120,699]],1.35,20)}
function fitRoute(){
 const shape=document.querySelector(`[data-building="${selected}"]`);const b=shape.getBBox();
 const all=[...routeSet.primary.points,...(routeSet.alternative?.points||[]),[b.x,b.y],[b.x+b.width,b.y+b.height]];
 activePoints=all;fitPoints(all,viewport.clientWidth<700?1.18:1.65,55);
}
function zoom(factor){camera.scale=Math.min(2.4,Math.max(.32,camera.scale*factor));updateCamera()}
$('#zoomIn').onclick=()=>zoom(1.25);$('#zoomOut').onclick=()=>zoom(.8);$('#fitMap').onclick=()=>{setExpanded(false);fitCampus()};
$('#locate').onclick=()=>{setExpanded(false);fitPoints([nodes[qr.node],[775,450],[1020,635]],1.28,65);toast(`Bạn đang ở ${qr.label.toLowerCase()}. Vị trí theo điểm QR.`)};
const pointers=new Map();let gesture=null,dragged=false;
viewport.addEventListener('pointerdown',e=>{
 if(e.button!==0)return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});dragged=false;
 if(pointers.size===1)gesture={x:e.clientX,y:e.clientY,camera:{...camera}};
 else if(pointers.size===2){const[a,b]=[...pointers.values()];gesture={distance:Math.hypot(a.x-b.x,a.y-b.y),scale:camera.scale};dragged=true}
});
viewport.addEventListener('pointermove',e=>{
 if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(pointers.size===2&&gesture?.distance){const[a,b]=[...pointers.values()];camera.scale=Math.max(.32,Math.min(2.4,gesture.scale*Math.hypot(a.x-b.x,a.y-b.y)/gesture.distance));updateCamera();return}
 if(!gesture?.camera)return;const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y;if(Math.hypot(dx,dy)>5){dragged=true;viewport.classList.add('dragging');viewport.setPointerCapture(e.pointerId)}
 if(dragged){camera.x=gesture.camera.x-dx/camera.scale;camera.y=gesture.camera.y-dy/camera.scale;updateCamera()}
});
function releasePointer(e){pointers.delete(e.pointerId);viewport.classList.remove('dragging');if(pointers.size===0)gesture=null}
viewport.addEventListener('pointerup',releasePointer);viewport.addEventListener('pointercancel',releasePointer);viewport.addEventListener('lostpointercapture',releasePointer);
viewport.addEventListener('click',e=>{if(dragged){e.stopPropagation();e.preventDefault();return}const p=e.target.closest('[data-place]');if(p){selectPlace(p.dataset.place);return}const door=e.target.closest('[data-door]');if(door){selectBuilding(door.dataset.building,door.dataset.door);return}const b=e.target.closest('[data-building]');if(b)selectBuilding(b.dataset.building)},{capture:true});
viewport.addEventListener('wheel',e=>{e.preventDefault();zoom(e.deltaY<0?1.07:1/1.07)},{passive:false});
document.querySelectorAll('[data-building]').forEach(el=>el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectBuilding(el.dataset.building)}}));
let sheetStart;
$('#sheetHandle').addEventListener('pointerdown',e=>{sheetStart=e.clientY;e.currentTarget.setPointerCapture(e.pointerId)});
$('#sheetHandle').addEventListener('pointerup',e=>{const dy=e.clientY-sheetStart;if((panel==='places'||panel==='place')&&dy>20){closePlacePanel();return}if(selected)setExpanded(Math.abs(dy)<15?!expanded:dy<0)});
$('#sheetHandle').setAttribute('role','button');$('#sheetHandle').setAttribute('tabindex','0');$('#sheetHandle').setAttribute('aria-label','Mở hoặc thu gọn ảnh tòa nhà');
$('#sheetHandle').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setExpanded(!expanded)}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(panel==='places'||panel==='place')closePlacePanel();else if(expanded)setExpanded(false);else if(selected)clearSelection()}});
new ResizeObserver(()=>{if(selectedPlace){const p=selectedPlace;fitPoints([[p.x-100,p.y-80],[p.x+100,p.y+80]],1.5,40)}else if(activePoints)fitPoints(activePoints,viewport.clientWidth<700?1.18:1.65,55);else fitCampus()}).observe(viewport);
/* Tải PDF: link thật tới assets/ban-do-vlu.pdf */
wireChips();$('#weatherIcon').textContent=isRain?'🌧':'☀️';$('#weatherText').textContent=isRain?'Mưa nhẹ':'Nắng';$('#weatherTemp').textContent=isRain?'26°':'29°';$('#weatherChip').setAttribute('aria-label',`Thời tiết demo: ${isRain?'Mưa nhẹ, 26 độ':'Nắng, 29 độ'}`);$('#qrLabel').textContent=`QR ${qrPoints[requestedQr]?requestedQr:'01'}`;fitCampus();
if(!qrPoints[requestedQr])toast('Điểm QR này chưa được thiết lập. Đang hiển thị vị trí mẫu ở B3.');
function state(){return {qr:requestedQr,origin:qr.label,building:selected,route:selected?(activeRoute===0?'suggested':'alternative'):null,photoExpanded:expanded,place:selectedPlace?.id||null,panel,prototype:true}}
const modelContext=document.modelContext;
if(modelContext?.registerTool){
 const lifecycle=new AbortController();
 const tools=[
  {name:'select_campus_place',title:'Xem tiện ích trong trường',description:'Focus a sourced campus amenity, parking entrance or gate and show its location details without changing the QR origin.',inputSchema:{type:'object',properties:{place:{type:'string',enum:places.map(p=>p.id)}},required:['place'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:async input=>{if(!input||!places.some(p=>p.id===input.place))throw new Error('Invalid place');selectPlace(input.place);await new Promise(requestAnimationFrame);return state()}},
  {name:'get_campus_map_state',title:'Xem trạng thái bản đồ',description:'Read the selected QR origin, destination and route on this campus demo.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:false},execute:()=>state()},
  {name:'select_campus_destination',title:'Chọn tòa nhà',description:'Select a building and show its walking routes from the QR location on the visible map.',inputSchema:{type:'object',properties:{building:{type:'string',enum:Object.keys(buildings)}},required:['building'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:async input=>{if(!input||typeof input.building!=='string'||!Object.hasOwn(buildings,input.building))throw new Error('Invalid building');selectBuilding(input.building);await new Promise(requestAnimationFrame);return state()}},
  {name:'set_campus_building_photo',title:'Xem ảnh tòa nhà',description:'Expand or collapse the selected building photo while keeping the map visible.',inputSchema:{type:'object',properties:{expanded:{type:'boolean'}},required:['expanded'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:async input=>{if(!input||typeof input.expanded!=='boolean'||!selected)throw new Error('Select a building first and provide expanded=true or false');setExpanded(input.expanded);await new Promise(requestAnimationFrame);return state()}}
 ];
 tools.forEach(tool=>{try{Promise.resolve(modelContext.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{})}catch{}});
 window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
}
