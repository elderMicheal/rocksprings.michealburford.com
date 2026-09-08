import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const planPath = resolve(process.argv[2] ?? "scene-data/jackies-window-spatial-plan.json");
const defaultOutputPath = resolve("public/assets/scenes/jackies-window/rock-springs-jackies-window.glb");
const outputPath = resolve(process.argv[3] ?? defaultOutputPath);
const manifestPath = process.argv[4]
  ? resolve(process.argv[4])
  : outputPath === defaultOutputPath
    ? resolve("public/assets/scenes/jackies-window/scene-manifest.json")
    : null;
const plan = JSON.parse(readFileSync(planPath, "utf8"));
const S = plan.coordinates.horizontalMetersPerUnit ?? 3.048;

const buffers = [];
let byteLength = 0;
const bufferViews = [];
const accessors = [];
const meshes = [];
const materials = [];
const materialByName = new Map();
const geometryByName = new Map();
const meshByKey = new Map();
const nodes = [];
const sceneNodes = [];
const groupByName = new Map();
const landmarkById = new Map(plan.landmarks.map((item) => [item.id, item]));
const landmarkNodeById = new Map();

function align4(value) { return (value + 3) & ~3; }
function pushBuffer(buffer, target) {
  const aligned = align4(byteLength);
  if (aligned > byteLength) buffers.push(Buffer.alloc(aligned - byteLength));
  byteLength = aligned;
  const view = { buffer: 0, byteOffset: byteLength, byteLength: buffer.length };
  if (target) view.target = target;
  const index = bufferViews.length;
  bufferViews.push(view);
  buffers.push(buffer);
  byteLength += buffer.length;
  return index;
}
function addAccessor(array, type, componentType, target, min, max) {
  const typed = Buffer.from(array.buffer, array.byteOffset, array.byteLength);
  const view = pushBuffer(typed, target);
  const count = array.length / ({ SCALAR:1, VEC2:2, VEC3:3, VEC4:4 }[type]);
  const accessor = { bufferView: view, componentType, count, type };
  if (min) accessor.min = min;
  if (max) accessor.max = max;
  const index = accessors.length;
  accessors.push(accessor);
  return index;
}
function bounds3(values) {
  const min=[Infinity,Infinity,Infinity], max=[-Infinity,-Infinity,-Infinity];
  for (let i=0;i<values.length;i+=3) for(let j=0;j<3;j++){ min[j]=Math.min(min[j],values[i+j]); max[j]=Math.max(max[j],values[i+j]); }
  return {min,max};
}
function defineGeometry(name, positions, normals, indices) {
  const p = new Float32Array(positions), n = new Float32Array(normals), idx = new Uint16Array(indices);
  const b = bounds3(positions);
  const geom = {
    position: addAccessor(p,"VEC3",5126,34962,b.min,b.max),
    normal: addAccessor(n,"VEC3",5126,34962),
    indices: addAccessor(idx,"SCALAR",5123,34963),
    triangles: Math.floor(indices.length/3),
  };
  geometryByName.set(name, geom);
  return geom;
}
function addMaterial(name, color, roughness=0.88, metallic=0.02, emissive=null) {
  const hex = color.replace("#","");
  const rgb=[parseInt(hex.slice(0,2),16)/255,parseInt(hex.slice(2,4),16)/255,parseInt(hex.slice(4,6),16)/255,1];
  const m={ name, pbrMetallicRoughness:{ baseColorFactor:rgb, metallicFactor:metallic, roughnessFactor:roughness } };
  if (emissive) {
    const e=emissive.replace("#","");
    m.emissiveFactor=[parseInt(e.slice(0,2),16)/255,parseInt(e.slice(2,4),16)/255,parseInt(e.slice(4,6),16)/255];
  }
  const i=materials.length; materials.push(m); materialByName.set(name,i); return i;
}
const MAT={
  ground:addMaterial("MAT_Glacial_Earth","#343933",1), grass:addMaterial("MAT_Unkempt_Grass","#42503b",1),
  asphalt:addMaterial("MAT_Cracked_Asphalt","#242827",0.98), concrete:addMaterial("MAT_Aged_Concrete","#858279",0.95),
  brick:addMaterial("MAT_Dark_Brick","#55352d",0.94), redBrick:addMaterial("MAT_School_Brick","#6f3d32",0.95),
  grayBrick:addMaterial("MAT_Eisenhower_Gray_Brick","#74736b",0.93), soot:addMaterial("MAT_Industrial_Soot","#353936",0.92),
  siding:addMaterial("MAT_Aged_Siding","#aaa697",0.93), redSiding:addMaterial("MAT_Oxide_Red_Siding","#792f2b",0.93),
  blueSiding:addMaterial("MAT_Faded_Blue_Siding","#526d79",0.92), greenSiding:addMaterial("MAT_Faded_Green_Siding","#5f725a",0.93),
  roof:addMaterial("MAT_Aged_Roofing","#242526",0.97), rust:addMaterial("MAT_Rust","#654034",0.88,0.28),
  wood:addMaterial("MAT_Weathered_Wood","#67513e",1), metal:addMaterial("MAT_Dull_Metal","#5d6260",0.74,0.58),
  water:addMaterial("MAT_Rock_River","#1f6571",0.22,0.08), bank:addMaterial("MAT_River_Bank","#5d5944",1),
  darkWindow:addMaterial("MAT_Dark_Window","#10191b",0.3,0.18), warmWindow:addMaterial("MAT_Warm_Window","#8e6841",0.4,0,"#d98e45"),
  yellow:addMaterial("MAT_Road_Yellow","#c7a84d",0.9), white:addMaterial("MAT_Road_White","#d0d0c8",0.9),
  treeTrunk:addMaterial("MAT_Tree_Trunk","#3c3025",1), leaves:addMaterial("MAT_Town_Foliage","#314a37",1),
  woods:addMaterial("MAT_Woods_Foliage","#1b3327",1), field:addMaterial("MAT_Fallow_Field","#6b6341",1),
  tower:addMaterial("MAT_Stanford_Concrete","#666d70",0.85,0.08)
};

function boxGeometry() {
  const p=[],n=[],i=[];
  const faces=[
    [[-0.5,-0.5,0.5],[0.5,-0.5,0.5],[0.5,0.5,0.5],[-0.5,0.5,0.5],[0,0,1]],
    [[0.5,-0.5,-0.5],[-0.5,-0.5,-0.5],[-0.5,0.5,-0.5],[0.5,0.5,-0.5],[0,0,-1]],
    [[0.5,-0.5,0.5],[0.5,-0.5,-0.5],[0.5,0.5,-0.5],[0.5,0.5,0.5],[1,0,0]],
    [[-0.5,-0.5,-0.5],[-0.5,-0.5,0.5],[-0.5,0.5,0.5],[-0.5,0.5,-0.5],[-1,0,0]],
    [[-0.5,0.5,0.5],[0.5,0.5,0.5],[0.5,0.5,-0.5],[-0.5,0.5,-0.5],[0,1,0]],
    [[-0.5,-0.5,-0.5],[0.5,-0.5,-0.5],[0.5,-0.5,0.5],[-0.5,-0.5,0.5],[0,-1,0]],
  ];
  for(const [a,b,c,d,no] of faces){ const s=p.length/3; for(const v of [a,b,c,d]){p.push(...v); n.push(...no);} i.push(s,s+1,s+2,s,s+2,s+3); }
  return defineGeometry("box",p,n,i);
}
function gableGeometry(){
  const p=[-0.5,0,-0.5, 0.5,0,-0.5, 0,0.5,-0.5, -0.5,0,0.5, 0.5,0,0.5, 0,0.5,0.5];
  const idx=[0,2,1,3,4,5,0,3,5,0,5,2,1,2,5,1,5,4,0,1,4,0,4,3];
  const normals=new Array(p.length).fill(0); for(let k=1;k<normals.length;k+=3) normals[k]=1;
  return defineGeometry("gable",p,normals,idx);
}
function cylinderGeometry(segments=12){
  const p=[],n=[],idx=[];
  for(let s=0;s<segments;s++){ const a=2*Math.PI*s/segments,b=2*Math.PI*(s+1)/segments; const x1=.5*Math.cos(a),z1=.5*Math.sin(a),x2=.5*Math.cos(b),z2=.5*Math.sin(b); const base=p.length/3; p.push(x1,-.5,z1,x2,-.5,z2,x2,.5,z2,x1,.5,z1); n.push(Math.cos(a),0,Math.sin(a),Math.cos(b),0,Math.sin(b),Math.cos(b),0,Math.sin(b),Math.cos(a),0,Math.sin(a)); idx.push(base,base+1,base+2,base,base+2,base+3); }
  const top=p.length/3; p.push(0,.5,0); n.push(0,1,0); const bottom=p.length/3; p.push(0,-.5,0); n.push(0,-1,0);
  for(let s=0;s<segments;s++){ const a=2*Math.PI*s/segments,b=2*Math.PI*(s+1)/segments; const t1=p.length/3; p.push(.5*Math.cos(a),.5,.5*Math.sin(a), .5*Math.cos(b),.5,.5*Math.sin(b)); n.push(0,1,0,0,1,0); idx.push(top,t1,t1+1); const b1=p.length/3; p.push(.5*Math.cos(a),-.5,.5*Math.sin(a), .5*Math.cos(b),-.5,.5*Math.sin(b)); n.push(0,-1,0,0,-1,0); idx.push(bottom,b1+1,b1); }
  return defineGeometry("cylinder",p,n,idx);
}
boxGeometry(); gableGeometry(); cylinderGeometry();

function meshFor(geomName, materialIndex, nameSuffix="") {
  const key=`${geomName}:${materialIndex}:${nameSuffix}`;
  if(meshByKey.has(key)) return meshByKey.get(key);
  const g=geometryByName.get(geomName); const mesh={ name:key, primitives:[{attributes:{POSITION:g.position,NORMAL:g.normal},indices:g.indices,material:materialIndex}]};
  const index=meshes.length; meshes.push(mesh); meshByKey.set(key,index); return index;
}
function customMesh(name, positions, normals, indices, materialIndex) {
  const geom=defineGeometry(`custom:${name}`,positions,normals,indices);
  const mesh={name,primitives:[{attributes:{POSITION:geom.position,NORMAL:geom.normal},indices:geom.indices,material:materialIndex}]};
  const index=meshes.length; meshes.push(mesh); return index;
}
function addNode(node,parent=null){ const idx=nodes.length; nodes.push(node); if(parent===null) sceneNodes.push(idx); else {nodes[parent].children??=[]; nodes[parent].children.push(idx);} return idx; }
function world([x,y,z]){ return [x*S,y,z*S]; }
function classify(classification,source=[]){ return {classification,source}; }

for(const groupName of plan.requiredGroups){ const idx=addNode({name:groupName,extras:{classification:"scene-hierarchy"}}); groupByName.set(groupName,idx); }

function riverCenterZ(xPlan){ return -100 + 8*Math.sin((xPlan-30)/45) + 3*Math.sin(xPlan/18); }
function terrainHeight(xPlan,zPlan){
  let y=2.2 + .75*Math.sin((xPlan+30)*.025) + .55*Math.cos((zPlan-20)*.02) + .3*Math.sin((xPlan+zPlan)*.014);
  if(zPlan>180) y += Math.min((zPlan-180)*.018,2.5);
  if(xPlan<-90 && zPlan>150) y += 1.0;
  const d=Math.abs(zPlan-riverCenterZ(xPlan)); y -= 4.8*Math.exp(-Math.pow(d/12,2));
  return y;
}
function addPrimitive(parent,name,geom,mat,position=[0,0,0],scale=[1,1,1],extras={classification:"presentation-geometry"}){
  return addNode({name,mesh:meshFor(geom,mat),translation:position,scale,extras},parent);
}

function createTerrain(){
  const minX=plan.bounds.minX-55,maxX=plan.bounds.maxX+55,minZ=plan.bounds.minZ-55,maxZ=plan.bounds.maxZ+55;
  const nx=36,nz=44,p=[],n=[],idx=[];
  for(let iz=0;iz<=nz;iz++) for(let ix=0;ix<=nx;ix++){ const x=minX+(maxX-minX)*ix/nx, z=minZ+(maxZ-minZ)*iz/nz; p.push(x*S,terrainHeight(x,z),z*S); n.push(0,1,0); }
  const row=nx+1; for(let iz=0;iz<nz;iz++) for(let ix=0;ix<nx;ix++){ const a=iz*row+ix,b=a+1,c=a+row,d=c+1; idx.push(a,c,b,b,c,d); }
  const mesh=customMesh("Terrain",p,n,idx,MAT.ground); addNode({name:"PRESENTATION_Glacial_Terrain",mesh,extras:{classification:"presentation-terrain"}},groupByName.get("Town_Ground"));
  const farm=landmarkById.get("chalmers-property"); addPrimitive(groupByName.get("Chalmers_Farm"),"PRESENTATION_Chalmers_Field","box",MAT.field,world([farm.position[0],terrainHeight(farm.position[0],farm.position[2])+.12,farm.position[2]]),[180,.2,125],{classification:"presentation-terrain"});
}
function stripGeometry(points,widthPlan,yOffset=0.18){
  const p=[],n=[],idx=[]; const half=widthPlan*S/2;
  for(let k=0;k<points.length;k++){
    const [x,z]=points[k]; const prev=points[Math.max(0,k-1)], next=points[Math.min(points.length-1,k+1)];
    let dx=(next[0]-prev[0])*S,dz=(next[1]-prev[1])*S; const len=Math.hypot(dx,dz)||1; dx/=len; dz/=len; const px=-dz, pz=dx;
    const y=terrainHeight(x,z)+yOffset;
    p.push(x*S+px*half,y,z*S+pz*half, x*S-px*half,y,z*S-pz*half); n.push(0,1,0,0,1,0);
    if(k<points.length-1){ const a=k*2; idx.push(a,a+2,a+1,a+1,a+2,a+3); }
  }
  return {p,n,idx};
}
function roadPoints(road,samples=20){
  const center=road.position ?? landmarkById.get(road.landmarkId)?.position ?? [0,0,0]; const out=[];
  for(let k=0;k<=samples;k++){ const t=k/samples-.5; out.push(road.axis==="x"?[center[0]+road.length*t,center[2]]:[center[0],center[2]+road.length*t]); }
  return out;
}
function createRoadVisual(parent,name,points,width,classification,source){
  const r=stripGeometry(points,width,.24); const roadMesh=customMesh(`${name}_surface`,r.p,r.n,r.idx,MAT.asphalt); addNode({name:`PRESENTATION_${name}_Surface`,mesh:roadMesh,extras:classify(classification,source)},parent);
  for(const side of [-1,1]){
    const shifted=[];
    for(let k=0;k<points.length;k++){ const [x,z]=points[k]; const prev=points[Math.max(0,k-1)], next=points[Math.min(points.length-1,k+1)]; let dx=next[0]-prev[0],dz=next[1]-prev[1]; const len=Math.hypot(dx,dz)||1; dx/=len;dz/=len; const px=-dz,pz=dx; const off=side*(width/2+1.05); shifted.push([x+px*off,z+pz*off]); }
    const s=stripGeometry(shifted,1.35,.34); const sm=customMesh(`${name}_sidewalk_${side}`,s.p,s.n,s.idx,MAT.concrete); addNode({name:`PRESENTATION_${name}_Sidewalk_${side<0?"A":"B"}`,mesh:sm,extras:{classification:"presentation-infrastructure"}},parent);
  }
}
function createRoads(){
  for(const road of plan.roads){
    if(!road.landmarkId) addNode({name:road.nodeName,translation:world(road.position),extras:classify(road.classification,road.source)},groupByName.get("Transport_Infrastructure"));
    const pts=roadPoints(road).map(([x,z])=>[x,z]);
    createRoadVisual(groupByName.get("Transport_Infrastructure"),road.id.replaceAll("-","_"),pts,road.width,road.classification,road.source);
  }
  for(const road of plan.presentationRoads??[]){ const parent=addNode({name:road.nodeName,extras:classify(road.classification,road.source)},groupByName.get("Transport_Infrastructure")); createRoadVisual(parent,road.id.replaceAll("-","_"),road.points.map(p=>[p[0],p[2]]),road.width,road.classification,road.source); }
  // Strong but sparse lane markings on Main and Broad.
  for(const z of [-110,-80,-50,-20,10,40,70,100,130,160,190]) addPrimitive(groupByName.get("Transport_Infrastructure"),`PRESENTATION_Main_Marking_${z}`,"box",MAT.yellow,world([95,terrainHeight(95,z)+.38,z]),[.22,.05,11],{classification:"presentation-road-marking"});
  for(const x of [20,50,80,110,140,170]) addPrimitive(groupByName.get("Transport_Infrastructure"),`PRESENTATION_Broad_Marking_${x}`,"box",MAT.white,world([x,terrainHeight(x,0)+.38,0]),[11,.05,.18],{classification:"presentation-road-marking"});
}
function createRiver(){
  const river=landmarkById.get("river"), parent=landmarkNodeById.get("river"); const samples=80,p=[],n=[],idx=[];
  for(let k=0;k<samples;k++){ const x=plan.bounds.minX-25+(plan.bounds.maxX-plan.bounds.minX+50)*k/(samples-1); const z=riverCenterZ(x), width=10+1.8*Math.sin(k*.23); const y=terrainHeight(x,z)+3.15; p.push((x-river.position[0])*S,y-river.position[1],(z-width-river.position[2])*S,(x-river.position[0])*S,y-river.position[1],(z+width-river.position[2])*S); n.push(0,1,0,0,1,0); if(k<samples-1){const a=k*2;idx.push(a,a+2,a+1,a+1,a+2,a+3);} }
  const mesh=customMesh("river",p,n,idx,MAT.water); addNode({name:"PRESENTATION_River_Surface",mesh,extras:classify("canon-feature-interpretive-course",river.source)},parent);
  for(const side of [-1,1]){ const pts=[]; for(let k=0;k<50;k++){ const x=plan.bounds.minX+(plan.bounds.maxX-plan.bounds.minX)*k/49; pts.push([x,riverCenterZ(x)+side*13]); } const b=stripGeometry(pts,3,.08); const bm=customMesh(`river_bank_${side}`,b.p,b.n,b.idx,MAT.bank); addNode({name:`PRESENTATION_River_Bank_${side<0?"South":"North"}`,mesh:bm,extras:{classification:"presentation-river-bank"}},groupByName.get("River")); }
  // One source-supported north/south crossing for Ledford's sequence; exact street remains interpretive.
  const bx=148,bz=riverCenterZ(bx),by=Math.max(terrainHeight(bx,bz-16),terrainHeight(bx,bz+16))+1.2;
  addPrimitive(groupByName.get("Transport_Infrastructure"),"PRESENTATION_Ledford_Bridge_Deck","box",MAT.asphalt,world([bx,by,bz]),[14,1.1,88],{classification:"canon-sequence-inferred-geometry",source:["Chapter 7:31"]});
  addPrimitive(groupByName.get("Transport_Infrastructure"),"PRESENTATION_Ledford_Bridge_Rail_W","box",MAT.metal,world([bx-2.1,by+1.0,bz]),[.35,1.2,88],{classification:"presentation-bridge-detail"});
  addPrimitive(groupByName.get("Transport_Infrastructure"),"PRESENTATION_Ledford_Bridge_Rail_E","box",MAT.metal,world([bx+2.1,by+1.0,bz]),[.35,1.2,88],{classification:"presentation-bridge-detail"});
}
function groundAtPlan(x,z){return terrainHeight(x,z);}
function addHouse(parent,name,xPlan,zPlan,{body=MAT.siding,red=false,dilapidated=false,stories=2,localBase=null}={}){
  const absX=xPlan+(localBase?.[0]??0), absZ=zPlan+(localBase?.[2]??0);
  const y=groundAtPlan(absX,absZ); const w=8.5,d=10.5,h=stories===2?6.8:4.2;
  const pos=(xp,yp,zp)=>localBase?[xp*S,yp-localBase[1],zp*S]:world([xp,yp,zp]);
  const bodyMat=red?MAT.redSiding:body; addPrimitive(parent,`${name}_Body`,`box`,bodyMat,pos(xPlan,y+h/2,zPlan),[w,h,d],{classification:"presentation-architecture"});
  addPrimitive(parent,`${name}_Roof`,`gable`,dilapidated?MAT.rust:MAT.roof,pos(xPlan,y+h+.9,zPlan),[w+1,2.2,d+1],{classification:"presentation-architecture"});
  addPrimitive(parent,`${name}_Porch`,`box`,dilapidated?MAT.wood:MAT.concrete,pos(xPlan+3.2/S,y+.45,zPlan),[2.4,.8,5.6],{classification:"presentation-architecture"});
  for(const dz of [-2.7,2.7]) addPrimitive(parent,`${name}_Window_${dz}`,"box",MAT.darkWindow,pos(xPlan+4.28/S,y+stories*1.8,zPlan+dz/S),[.12,1.2,1.4],{classification:"presentation-lighting-detail"});
  if(dilapidated) addPrimitive(parent,`${name}_Fence`,`box`,MAT.metal,pos(xPlan-4.8/S,y+.8,zPlan),[.15,1.6,10.8],{classification:"presentation-neighborhood-detail"});
}
function addFlatBuilding(parent,name,xPlan,zPlan,{w=16,d=14,stories=3,mat=MAT.grayBrick,storefront=false,localBase=null}={}){
  const absX=xPlan+(localBase?.[0]??0), absZ=zPlan+(localBase?.[2]??0); const y=groundAtPlan(absX,absZ),h=stories*3.25;
  const pos=(xp,yp,zp)=>localBase?[xp*S,yp-localBase[1],zp*S]:world([xp,yp,zp]);
  addPrimitive(parent,`${name}_Body`,`box`,mat,pos(xPlan,y+h/2,zPlan),[w,h,d],{classification:"presentation-architecture"});
  addPrimitive(parent,`${name}_Roof`,`box`,MAT.roof,pos(xPlan,y+h+.3,zPlan),[w+.4,.55,d+.4],{classification:"presentation-architecture"});
  const floors=Math.min(stories,5); for(let f=0;f<floors;f++) addPrimitive(parent,`${name}_WindowBand_${f}`,"box",f===0&&storefront?MAT.warmWindow:MAT.darkWindow,pos(xPlan+w/(2*S),y+1.8+f*3.1,zPlan),[.15,1.2,d*.7],{classification:"presentation-lighting-detail"});
  if(storefront) addPrimitive(parent,`${name}_Awning`,`box`,MAT.metal,pos(xPlan+w/(2*S)+.2/S,y+3.0,zPlan),[1.2,.25,d*.8],{classification:"presentation-storefront"});
}
function createLandmarkParents(){
  const groupFor=(id)=> id==="new-beginnings"||id==="jackies-house"||id==="jackies-window"?"New_Beginnings":id.startsWith("abby")||id==="bakery-storefront"?"Abby_District":id==="police-station"||id==="sheriffs-sons-house"||id==="detective-position"?"Police_District":id==="chalmers-property"?"Chalmers_Farm":id==="old-ruins"?"Ruins":id==="river"?"River":id==="trainyard"||id==="railroad-trestle"||id==="main-street"||id==="broad-main-intersection"?"Transport_Infrastructure":id==="southside-industry"||id==="ledford-home"||id.startsWith("stanford-")?"Southside_Industrial":id==="diner-strip-mall"?"Eastside_Commercial":"Downtown";
  for(const lm of plan.landmarks){ const idx=addNode({name:lm.nodeName,translation:world(lm.position),extras:classify(lm.classification,lm.source)},groupByName.get(groupFor(lm.id))); landmarkNodeById.set(lm.id,idx); addNode({name:`LANDMARK_REF_${lm.id.replaceAll("-","_")}`,translation:world(lm.position),extras:{classification:"presentation-coordinate-reference"}},groupByName.get("Landmarks")); }
}
function createLandmarks(){
  // Cathedral
  let p=landmarkNodeById.get("st-thomas"),lm=landmarkById.get("st-thomas"),g=groundAtPlan(lm.position[0],lm.position[2])-lm.position[1];
  addPrimitive(p,"PRESENTATION_St_Thomas_Nave","box",MAT.grayBrick,[0,g+5.5,0],[18,11,26],{classification:"presentation-architecture"}); addPrimitive(p,"PRESENTATION_St_Thomas_Roof","gable",MAT.roof,[0,g+12,0],[19,3,28],{classification:"presentation-architecture"}); addPrimitive(p,"PRESENTATION_St_Thomas_Tower","box",MAT.grayBrick,[0,g+10,-10],[7,20,7],{classification:"presentation-architecture"}); addPrimitive(p,"PRESENTATION_St_Thomas_Spire","cylinder",MAT.metal,[0,g+23,-10],[4,13,4],{classification:"presentation-architecture"});
  // New Beginnings houses #2-#4; Jackie is #5 and separate.
  p=landmarkNodeById.get("new-beginnings"); lm=landmarkById.get("new-beginnings"); for(const [z,mat] of [[88,MAT.siding],[98,MAT.blueSiding],[108,MAT.greenSiding]]) addHouse(p,`PRESENTATION_NB_House_${z}`,0,(z-lm.position[2]),{body:mat,stories:2,localBase:lm.position});
  p=landmarkNodeById.get("jackies-house"); lm=landmarkById.get("jackies-house"); g=groundAtPlan(lm.position[0],lm.position[2])-lm.position[1]; addPrimitive(p,"PRESENTATION_Jackies_House_Body","box",MAT.redSiding,[0,g+3.4,0],[8.8,6.8,10.5],{classification:"presentation-architecture"}); addPrimitive(p,"PRESENTATION_Jackies_House_Roof","gable",MAT.roof,[0,g+7.7,0],[9.8,2.4,11.5],{classification:"presentation-architecture"}); addPrimitive(p,"PRESENTATION_Jackies_Porch","box",MAT.wood,[3.5,g+.45,0],[2.5,.8,5.8],{classification:"presentation-architecture"});
  p=landmarkNodeById.get("jackies-window"); addPrimitive(p,"PRESENTATION_Jackies_Window_Glass","box",MAT.warmWindow,[.15,0,0],[.2,1.5,1.7],{classification:"presentation-lighting-detail"});
  // Old school + lot
  p=landmarkNodeById.get("old-school-staging-lot"); lm=landmarkById.get("old-school-staging-lot"); g=groundAtPlan(lm.position[0],lm.position[2])-lm.position[1]; addPrimitive(p,"PRESENTATION_Old_School_Lot","box",MAT.asphalt,[0,g+.12,0],[31,.24,22],{classification:"canon-feature-relative-placement",source:lm.source});
  p=landmarkNodeById.get("old-school"); lm=landmarkById.get("old-school"); g=groundAtPlan(lm.position[0],lm.position[2])-lm.position[1]; addPrimitive(p,"PRESENTATION_Old_School_Body","box",MAT.redBrick,[0,g+5.2,0],[28,10.4,20],{classification:"presentation-architecture"}); addPrimitive(p,"PRESENTATION_Old_School_Roof","box",MAT.rust,[0,g+10.8,0],[29,.9,21],{classification:"presentation-architecture"}); for(let z=-7;z<=7;z+=4.5)addPrimitive(p,`PRESENTATION_Old_School_Window_${z}`,"box",MAT.darkWindow,[-14.05,g+5.7,z],[.15,2.1,1.8],{classification:"presentation-lighting-detail"});
  // Abby and bakery
  p=landmarkNodeById.get("abbys-apartment"); lm=landmarkById.get("abbys-apartment"); g=groundAtPlan(lm.position[0],lm.position[2])-lm.position[1]; addPrimitive(p,"PRESENTATION_Abby_Building","box",MAT.brick,[0,g+6.5,0],[14,13,16],{classification:"presentation-architecture"}); for(let f=0;f<4;f++)addPrimitive(p,`PRESENTATION_Abby_Windows_${f}`,"box",f===3?MAT.warmWindow:MAT.darkWindow,[-7.05,g+2+f*3.0,0],[.15,1.3,9],{classification:"presentation-lighting-detail"});
  p=landmarkNodeById.get("bakery-storefront"); lm=landmarkById.get("bakery-storefront"); g=groundAtPlan(lm.position[0],lm.position[2])-lm.position[1]; addPrimitive(p,"PRESENTATION_Bakery","box",MAT.grayBrick,[0,g+2.3,0],[10,4.6,13],{classification:"presentation-architecture"}); addPrimitive(p,"PRESENTATION_Bakery_Window","box",MAT.warmWindow,[5.05,g+2.0,0],[.15,2.2,7],{classification:"presentation-storefront"});
  // Police, sheriff residence, Ledford residence
  lm=landmarkById.get("police-station"); addFlatBuilding(landmarkNodeById.get("police-station"),"PRESENTATION_Police",0,0,{w:20,d:24,stories:3,mat:MAT.grayBrick,localBase:lm.position});
  lm=landmarkById.get("sheriffs-sons-house"); addHouse(landmarkNodeById.get("sheriffs-sons-house"),"PRESENTATION_Sheriff_Son",0,0,{body:MAT.siding,stories:2,localBase:lm.position});
  lm=landmarkById.get("ledford-home"); addHouse(landmarkNodeById.get("ledford-home"),"PRESENTATION_Ledford_Home",0,0,{body:MAT.siding,stories:2,localBase:lm.position});
  // Diner and L-shaped mall
  p=landmarkNodeById.get("diner-strip-mall"); lm=landmarkById.get("diner-strip-mall"); g=groundAtPlan(lm.position[0],lm.position[2])-lm.position[1]; addPrimitive(p,"PRESENTATION_Diner_Lot","box",MAT.asphalt,[0,g+.1,0],[65,.2,46],{classification:"presentation-commercial-site"}); addPrimitive(p,"PRESENTATION_Diner","box",MAT.grayBrick,[-5,g+2.3,-2],[15,4.6,12],{classification:"presentation-architecture"}); addPrimitive(p,"PRESENTATION_Diner_Front","box",MAT.warmWindow,[2.55,g+2.1,-2],[.15,2.1,8],{classification:"presentation-storefront"}); addPrimitive(p,"PRESENTATION_StripMall_Long","box",MAT.grayBrick,[8,g+2.4,16],[48,4.8,9],{classification:"presentation-architecture"}); addPrimitive(p,"PRESENTATION_StripMall_Leg","box",MAT.grayBrick,[-23,g+2.4,4],[9,4.8,32],{classification:"presentation-architecture"});
  // Stanford towers, exact skyline anomaly.
  for(const id of ["stanford-north-tower","stanford-south-tower"]){ p=landmarkNodeById.get(id); lm=landmarkById.get(id); g=groundAtPlan(lm.position[0],lm.position[2])-lm.position[1]; addPrimitive(p,`PRESENTATION_${id}_Body`,`box`,MAT.tower,[0,g+31,0],[24,62,24],{classification:"presentation-architecture"}); for(let f=0;f<10;f++)addPrimitive(p,`PRESENTATION_${id}_Band_${f}`,"box",MAT.darkWindow,[12.05,g+4+f*5.7,0],[.16,1.2,18],{classification:"presentation-lighting-detail"}); }
  // Southside industry
  p=landmarkNodeById.get("southside-industry"); lm=landmarkById.get("southside-industry"); g=groundAtPlan(lm.position[0],lm.position[2])-lm.position[1]; for(const [x,z,w,d,h] of [[-20,-8,35,20,10],[18,-12,28,18,8],[-5,17,45,15,9]]) addPrimitive(p,`PRESENTATION_Mill_${x}_${z}`,"box",MAT.soot,world([x,g+h/2,z]),[w,h,d],{classification:"presentation-industrial"}); for(const [x,z,h] of [[-25,-2,32],[8,5,26],[24,-8,36]]) addPrimitive(p,`PRESENTATION_Smokestack_${x}_${z}`,"cylinder",MAT.rust,world([x,g+h/2,z]),[4,h,4],{classification:"presentation-industrial"});
  // Trainyard and trestle
  p=landmarkNodeById.get("trainyard"); lm=landmarkById.get("trainyard"); g=groundAtPlan(lm.position[0],lm.position[2])-lm.position[1]; for(let z=-22;z<=22;z+=11){ addPrimitive(p,`PRESENTATION_Rail_${z}_A`,`box`,MAT.metal,world([0,g+.18,z]),[110,.22,.18],{classification:"presentation-rail"}); addPrimitive(p,`PRESENTATION_Rail_${z}_B`,`box`,MAT.metal,world([0,g+.18,z+1.1]),[110,.22,.18],{classification:"presentation-rail"}); } for(const [x,z] of [[-35,-15],[-10,10],[28,-6]]) addPrimitive(p,`PRESENTATION_Rail_Warehouse_${x}_${z}`,"box",MAT.rust,world([x,g+4.5,z]),[26,9,16],{classification:"presentation-industrial"}); for(let x=-42;x<=42;x+=14)addPrimitive(p,`PRESENTATION_Railcar_${x}`,"box",MAT.rust,world([x,g+1.8,18]),[10,3.5,3],{classification:"presentation-rail"});
  p=landmarkNodeById.get("railroad-trestle"); lm=landmarkById.get("railroad-trestle"); g=groundAtPlan(lm.position[0],lm.position[2])-lm.position[1]; addPrimitive(p,"PRESENTATION_Trestle_Deck","box",MAT.metal,[0,g+5.6,0],[44,1.2,5],{classification:"presentation-infrastructure"}); for(const x of [-18,-8,8,18]) addPrimitive(p,`PRESENTATION_Trestle_Pier_${x}`,"box",MAT.concrete,[x,g+2.6,0],[2.2,5.2,4],{classification:"presentation-infrastructure"});
  // Chalmers, park, ruins
  lm=landmarkById.get("chalmers-property"); addHouse(landmarkNodeById.get("chalmers-property"),"PRESENTATION_Chalmers_House",0,0,{body:MAT.siding,stories:2,localBase:lm.position});
  p=landmarkNodeById.get("city-park"); lm=landmarkById.get("city-park"); g=groundAtPlan(lm.position[0],lm.position[2])-lm.position[1]; addPrimitive(p,"PRESENTATION_City_Park_Lawn","box",MAT.grass,[0,g+.1,0],[32,.2,24],{classification:"presentation-park"});
  p=landmarkNodeById.get("old-ruins"); lm=landmarkById.get("old-ruins"); g=groundAtPlan(lm.position[0],lm.position[2])-lm.position[1]; for(const [x,z,h] of [[-4,-3,4],[3,2,2.5],[0,5,3]]) addPrimitive(p,`PRESENTATION_Ruin_${x}_${z}`,"box",MAT.brick,world([x,g+h/2,z]),[6,h,2],{classification:"presentation-ruin"});
}
function createNeighborhoodFabric(){
  const parent=groupByName.get("Residential");
  // Eight west-side Partridge houses: #1 is neighbor, #2-5 are campus, #5 is Jackie, #6-8 are neighbors.
  for(const [num,z] of [[1,78],[6,128],[7,138],[8,148]]) addHouse(parent,`PRESENTATION_Partridge_West_${num}`,62,z,{body:num%2?MAT.siding:MAT.blueSiding,stories:2});
  // Deteriorated school/rental side.
  for(const z of [82,94,106,130,142]) addHouse(parent,`PRESENTATION_Partridge_East_${z}`,80,z,{body:MAT.siding,dilapidated:true,stories:2});
  // 1950s edge: rows align to streets rather than scattering randomly.
  let count=0; for(const x of [112,126,140,154]) for(const z of [78,92,106]){ if(Math.abs(x-123)<8) continue; addHouse(parent,`PRESENTATION_1950s_${++count}`,x,z,{body:[MAT.siding,MAT.blueSiding,MAT.greenSiding][count%3],stories:1}); }
  for(const x of [20,35,50]) for(const z of [92,108,124,140]) addHouse(parent,`PRESENTATION_Northwest_House_${x}_${z}`,x,z,{body:MAT.siding,stories:1});
  // Sound barrier at Oak T-intersection; trainyard lies beyond.
  for(let z=100;z<=210;z+=12) addPrimitive(groupByName.get("Transport_Infrastructure"),`PRESENTATION_Sound_Barrier_${z}`,"box",MAT.grass,world([-2,groundAtPlan(-2,z)+2.2,z]),[5,4.4,12],{classification:"presentation-sound-barrier",source:["Chapter 6:57"]});
}
function createDowntownFabric(){
  const parent=groupByName.get("Downtown"); let i=0;
  const xs=[58,72,84,106,118,132,144], zs=[-8,14,34,54,68];
  for(const x of xs) for(const z of zs){ if(Math.abs(x-95)<8||Math.abs(z)<7||Math.abs(x-123)<7) continue; const stories=2+(i%5); addFlatBuilding(parent,`PRESENTATION_Downtown_${++i}`,x,z,{w:11+(i%3)*2,d:12+(i%2)*3,stories,mat:i%3===0?MAT.brick:i%3===1?MAT.grayBrick:MAT.redBrick,storefront:z<40}); }
  // Last-block Eisenhower storefront row near residential edge.
  for(const [x,name] of [[116,"Pawn_Bail"],[128,"Salon"],[140,"Accountant"],[152,"Hobby"],[164,"Bella_Miha"]]) addFlatBuilding(parent,`PRESENTATION_${name}`,x,62,{w:10,d:11,stories:1,mat:MAT.grayBrick,storefront:true});
}
function createIndustrialAndTrees(){
  const trees=groupByName.get("Woods"); let t=0;
  for(const [cx,cz,radius,count] of [[-125,220,48,22],[185,-25,28,10],[143,-73,22,8]]) for(let k=0;k<count;k++){ const a=k*2.3999632297, r=radius*Math.sqrt((k+.5)/count), x=cx+Math.cos(a)*r, z=cz+Math.sin(a)*r, y=groundAtPlan(x,z); addPrimitive(trees,`PRESENTATION_Tree_Trunk_${++t}`,"cylinder",MAT.treeTrunk,world([x,y+2.4,z]),[.7,4.8,.7],{classification:"presentation-vegetation"}); addPrimitive(trees,`PRESENTATION_Tree_Crown_${t}`,"cylinder",cx<0?MAT.woods:MAT.leaves,world([x,y+5.8,z]),[4.2,5.0,4.2],{classification:"presentation-vegetation"}); }
}
function createCamerasAndRoutes(){
  const camParent=groupByName.get("Authored_Cameras"); const pathParent=groupByName.get("Authored_Paths");
  for(const camera of plan.cameras){ const camIndex=(gltfCameras.push({type:"perspective",perspective:{yfov:48*Math.PI/180,znear:.1,zfar:5000}})-1); addNode({name:camera.name,camera:camIndex,translation:world(camera.position),extras:{classification:"presentation-camera",source:camera.source,target:world(camera.target)}},camParent); }
  for(const route of plan.routes){ const ri=addNode({name:route.name,extras:classify(route.classification,route.source)},pathParent); route.points.forEach((pt,k)=>addNode({name:`${route.name}_Waypoint_${String(k+1).padStart(2,"0")}`,translation:world(pt),extras:{classification:"presentation-waypoint"}},ri)); }
}
const gltfCameras=[];
createLandmarkParents();
createTerrain();
createRiver();
createRoads();
createLandmarks();
createNeighborhoodFabric();
createDowntownFabric();
createIndustrialAndTrees();
createCamerasAndRoutes();

const binary=Buffer.concat(buffers); const gltf={
  asset:{version:"2.0",generator:"Rock Springs deterministic map generator v8"},
  scene:0, scenes:[{name:"Rock_Springs_Source_Derived_Map",nodes:sceneNodes,extras:{modelId:plan.id,source:plan.source.work,writingRevision:plan.source.writingRevision,canonNotice:"Named locations and stated relationships are source-derived. Unspecified coordinates, bearings, dimensions, architecture, and filler geometry remain interpretive."}}],
  nodes, meshes, materials, cameras:gltfCameras, accessors, bufferViews, buffers:[{byteLength:binary.length}]
};
const jsonRaw=Buffer.from(JSON.stringify(gltf)); const jsonPad=Buffer.concat([jsonRaw,Buffer.alloc((4-jsonRaw.length%4)%4,0x20)]); const binPad=Buffer.concat([binary,Buffer.alloc((4-binary.length%4)%4)]);
const total=12+8+jsonPad.length+8+binPad.length; const header=Buffer.alloc(12); header.write("glTF",0); header.writeUInt32LE(2,4); header.writeUInt32LE(total,8); const jh=Buffer.alloc(8); jh.writeUInt32LE(jsonPad.length,0); jh.writeUInt32LE(0x4E4F534A,4); const bh=Buffer.alloc(8); bh.writeUInt32LE(binPad.length,0); bh.writeUInt32LE(0x004E4942,4); const glb=Buffer.concat([header,jh,jsonPad,bh,binPad]);
mkdirSync(dirname(outputPath),{recursive:true}); writeFileSync(outputPath,glb);

let baseTriangles=0,primitives=0; for(const mesh of meshes){ for(const primitive of mesh.primitives){ primitives++; baseTriangles+=Math.floor(accessors[primitive.indices].count/3); } }
if(manifestPath){
  let manifest={schemaVersion:1,id:plan.id,title:"Rock Springs",model:{},fallback:{kind:"neutral",alt:"Neutral background behind the interpretive scene"},provenance:{},canon:{},requiredLandmarkNodes:[],authoredViews:[],descent:{},authoredRoutes:[],anchors:[]};
  try{ manifest=JSON.parse(readFileSync(manifestPath,"utf8")); }catch{}
  manifest.schemaVersion=1; manifest.id=plan.id; manifest.title="Rock Springs";
  manifest.model={url:"/assets/scenes/jackies-window/rock-springs-jackies-window.glb",sha256:createHash("sha256").update(glb).digest("hex"),bytes:glb.length,format:"glTF 2.0 binary",stats:{nodes:nodes.length,meshes:meshes.length,primitives,baseTriangles,materials:materials.length,cameras:gltfCameras.length},extensions:[]};
  manifest.fallback={kind:"neutral",alt:"Neutral background behind the interpretive scene"};
  manifest.provenance={classification:"generated-presentation-media",sourceReferences:["Jackie's Window, Part 1, Chapters 1–8","Canonical unpublished-derived map evidence (no manuscript prose)"],auditedAgainstRevision:plan.source.writingRevision,spatialPlan:"scene-data/jackies-window-spatial-plan.json",evidenceDocument:"docs/phase-2/JACKIES_WINDOW_SPATIAL_EVIDENCE.md",generator:"scripts/generate-town-scene.mjs"};
  manifest.canon={geometry:"interpretive",distances:"source-stated distances are scaled; otherwise approximate",architecture:"source-derived categories; dimensions and filler structures are interpretive",publicLandmarks:false,nodeNaming:"CANON_* identifies source-established locations or relationships; INFERRED_* identifies reasoned placement; PRESENTATION_* identifies connective geometry.",notice:"The scene is an interpretive visualization. Unspecified distances, coordinates, bearings, and architecture are not asserted as canon."};
  manifest.requiredLandmarkNodes=plan.landmarks.map(x=>x.nodeName);
  manifest.authoredViews=plan.cameras.map(c=>({cameraNode:c.name,label:c.label,sourceReferences:c.source}));
  manifest.descent={startCameraNode:"Camera_Town_Overview",endCameraNode:"Camera_Downtown"};
  manifest.authoredRoutes=plan.routes.map(r=>r.name); manifest.anchors=[];
  writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+"\n");
}
console.log(`Generated ${outputPath}: ${glb.length} bytes · ${nodes.length} nodes · ${meshes.length} meshes · ${baseTriangles} base triangles · ${gltfCameras.length} cameras`);
