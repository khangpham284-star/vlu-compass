// Prototype walking graph traced from the provided campus schematic.
// Units are diagram coordinates, not surveyed meters. Verify entrances and
// access restrictions with the campus before using for real navigation.
export const nodes = {
 origin:[903,519], bn:[903,497], bypass:[927,519], bs:[927,633],
 en:[1008,497], er:[1008,454], dNE:[1008,517], dCorner:[1045,517],
 aWestWalk:[638,246], aWestGate:[662,251], aNorthGate:[776,228], aRightGate:[918,299],
 aNorthOut:[776,210], aNorthWest:[660,210], aRightOut:[940,299], aRightLane:[940,322], aEastLane:[997,322],
 dTop:[1045,579], dGate:[1037,581], se:[1045,633],
 mid:[814,497], cWest:[814,454], cGate:[858,450], cEast:[997,450],
 kEast:[814,409], kEastGate:[785,409], aWalk:[814,322], aGate:[814,307],
 kSouth:[728,497], kSouthGate:[729,465], kNorthGate:[729,354], kNorthWalk:[729,322],
 center:[640,497], westUp:[640,322], kWest:[640,409], kWestGate:[674,409],
 jLane:[583,497], jGate:[583,468], jEastGate:[583,388], jEastOut:[583,360], jWestGate:[450,468], jWestOut:[414,468], courtEast:[562,497], courtSE:[562,527],
 poolNE:[521,527], poolEast:[521,572], gWestGate:[526,578],
 westMid:[414,527], iLane:[414,533], iGate:[369,535], jWest:[414,395],
 nw:[414,370], jNorth:[449,370], jNorthGate:[450,388],
 sw:[414,633], poolSE:[521,633], gSouth:[570,633], gSouthGate:[570,622], gEastGate:[683,622], gEastOut:[683,633],
 southMid:[640,633], fSouth:[814,633], fSouthGate:[814,622], fNorthGate:[814,528],
 iSouth:[369,633], iSouthGate:[364,622],
};
export const edges = [
 ['origin','bn'],['origin','bypass'],['bypass','bs'],['bn','mid'],['bn','en'],
 ['bs','fSouth'],['bs','se'],['se','dTop'],['en','dNE'],['dNE','dCorner'],['dCorner','dTop'],['dTop','dGate'],
 ['en','er'],['er','cEast'],['westUp','aWestWalk'],['aWestWalk','aWestGate'],
 ['mid','cWest'],['cWest','cGate'],['cWest','kEast'],['kEast','kEastGate'],['kEast','aWalk'],['aWalk','aGate'],
 ['mid','kSouth'],['kSouth','kSouthGate'],['kSouth','center'],
 ['center','kWest'],['kWest','kWestGate'],['kWest','westUp'],['westUp','aWalk'],
 ['center','jLane'],['jLane','jGate'],['jLane','courtEast'],['courtEast','courtSE'],
 ['courtSE','poolNE'],['poolNE','poolEast'],['poolEast','gWestGate'],['poolEast','poolSE'],
 ['poolNE','westMid'],['westMid','iLane'],['iLane','iGate'],['westMid','jWest'],['jWest','nw'],
 ['nw','jNorth'],['jNorth','jNorthGate'],['iLane','sw'],['sw','poolSE'],
 ['poolSE','gSouth'],['gSouth','gSouthGate'],['gSouth','southMid'],['southMid','fSouth'],
 ['fSouth','fSouthGate'],['mid','fNorthGate'],['sw','iSouth'],['iSouth','iSouthGate'],
 ['aNorthGate','aNorthOut'],['aNorthOut','aNorthWest'],['aNorthWest','aWestWalk'],
 ['aRightGate','aRightOut'],['aRightOut','aRightLane'],['aRightLane','aEastLane'],['aEastLane','cEast'],
 ['kNorthGate','kNorthWalk'],['kNorthWalk','aWalk'],['gEastGate','gEastOut'],['gEastOut','southMid'],
 ['jEastGate','jEastOut'],['jEastOut','jNorth'],['jWestGate','jWestOut'],['jWestOut','westMid']
];
export const entrances={A:['aGate','aWestGate','aNorthGate','aRightGate'],C:['cGate','cEast'],D:['dGate'],F:['fNorthGate','fSouthGate'],G:['gWestGate','gSouthGate','gEastGate'],I:['iGate','iSouthGate'],J:['jGate','jNorthGate','jEastGate','jWestGate'],K:['kEastGate','kSouthGate','kWestGate','kNorthGate']};
export const qrPoints={'01':{node:'origin',label:'Lối lên hầm B3',description:'Giữa tòa F và D'},'02':{node:'origin',label:'Lối lên hầm B3',description:'Giữa tòa F và D'}};
const edgeKey=(a,b)=>[a,b].sort().join(':');
const distance=(a,b)=>Math.hypot(nodes[a][0]-nodes[b][0],nodes[a][1]-nodes[b][1]);
const graph=Object.fromEntries(Object.keys(nodes).map(k=>[k,[]]));
edges.forEach(([a,b])=>{graph[a].push(b);graph[b].push(a)});
function shortest(start,goals,banned=null){
 const remaining=new Set(Object.keys(nodes));const dist={[start]:0};const prev={};let end;
 while(remaining.size){
  let at;let best=Infinity;
  remaining.forEach(n=>{if((dist[n]??Infinity)<best){best=dist[n];at=n}});
  if(!at)break;remaining.delete(at);if(goals.includes(at)){end=at;break}
  for(const next of graph[at]){
   if(!remaining.has(next)||edgeKey(at,next)===banned)continue;
   const cost=dist[at]+distance(at,next);
   if(cost<(dist[next]??Infinity)){dist[next]=cost;prev[next]=at}
  }
 }
 if(!end)return null;const path=[end];while(path[0]!==start)path.unshift(prev[path[0]]);
 return {path,points:path.map(n=>nodes[n]),length:dist[end]};
}
export function findRoutes(building,start='origin',entry=null){
 if(!entrances[building]||!nodes[start]||(entry&&!entrances[building].includes(entry)))throw new Error('Điểm đến, cửa vào hoặc điểm QR chưa được thiết lập.');
 const goals=entry?[entry]:entrances[building];
 const primary=shortest(start,goals);if(!primary)throw new Error('Chưa tìm thấy lối đi.');
 const primaryEdges=new Set(primary.path.slice(1).map((n,i)=>edgeKey(n,primary.path[i])));
 const candidates=[];const seen=new Set([primary.path.join(',')]);
 for(let i=1;i<primary.path.length;i++){
  const r=shortest(start,goals,edgeKey(primary.path[i-1],primary.path[i]));
  if(!r||seen.has(r.path.join(',')))continue;seen.add(r.path.join(','));
  r.shared=r.path.slice(1).reduce((sum,n,j)=>sum+(primaryEdges.has(edgeKey(n,r.path[j]))?distance(n,r.path[j]):0),0)/Math.min(primary.length,r.length);
  candidates.push(r);
 }
 candidates.sort((a,b)=>a.length-b.length);
 return {primary,alternative:candidates.find(r=>r.shared<.8)||candidates[0]||null};
}
