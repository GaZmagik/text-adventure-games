import type { DieType } from '../../types';
import { serialiseInlineScriptData } from '../../lib/html';
import type { DieConfig } from './die-geometries';

type WebGLDiceCodeOptions = {
  dieType: DieType;
  config: DieConfig;
  fontScale: number;
  modifier: number;
  dc: number | null;
};

function js(value: unknown): string {
  return serialiseInlineScriptData(value);
}

/** Emits the pure-math and quaternion helpers shared by all three render paths. */
function emitMathCore(): string {
  return `\
function v3n(v){var l=Math.sqrt(v[0]*v[0]+v[1]*v[1]+v[2]*v[2])||1;return[v[0]/l,v[1]/l,v[2]/l]}
function v3s(a,b){return[a[0]-b[0],a[1]-b[1],a[2]-b[2]]}
function v3x(a,b){return[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]}
function v3d(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]}
function qnm(q){var l=Math.sqrt(q[0]*q[0]+q[1]*q[1]+q[2]*q[2]+q[3]*q[3])||1;return[q[0]/l,q[1]/l,q[2]/l,q[3]/l]}
function qsl(a,b,t){
  var d=a[0]*b[0]+a[1]*b[1]+a[2]*b[2]+a[3]*b[3];
  if(d<0){b=[-b[0],-b[1],-b[2],-b[3]];d=-d}
  if(d>0.9995)return qnm([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t,a[3]+(b[3]-a[3])*t]);
  var th=Math.acos(Math.min(d,1)),sn=Math.sin(th),s0=Math.sin((1-t)*th)/sn,s1=Math.sin(t*th)/sn;
  return[a[0]*s0+b[0]*s1,a[1]*s0+b[1]*s1,a[2]*s0+b[2]*s1,a[3]*s0+b[3]*s1];
}
function qAl(from,to){
  var d=v3d(from,to);
  if(d>0.9999)return[0,0,0,1];
  if(d<-0.9999){
    var ax=v3n(v3x([1,0,0],from));
    if(Math.sqrt(ax[0]*ax[0]+ax[1]*ax[1]+ax[2]*ax[2])<0.01)ax=v3n(v3x([0,1,0],from));
    var ha=Math.PI/2;
    return[ax[0]*Math.sin(ha),ax[1]*Math.sin(ha),ax[2]*Math.sin(ha),Math.cos(ha)];
  }
  var ax=v3n(v3x(from,to)),ang=Math.acos(Math.min(Math.max(d,-1),1)),ha=ang/2;
  return[ax[0]*Math.sin(ha),ax[1]*Math.sin(ha),ax[2]*Math.sin(ha),Math.cos(ha)];
}

function m4(){return new Float32Array(16)}
function m4i(){var m=m4();m[0]=m[5]=m[10]=m[15]=1;return m}
function m4m(a,b){var o=m4();for(var j=0;j<4;j++)for(var i=0;i<4;i++){var s=0;for(var k=0;k<4;k++)s+=a[i+k*4]*b[k+j*4];o[i+j*4]=s}return o}
function m4p(fov,asp,n,f){var o=m4(),ft=1/Math.tan(fov/2),nf=1/(n-f);o[0]=ft/asp;o[5]=ft;o[10]=(f+n)*nf;o[11]=-1;o[14]=2*f*n*nf;return o}
function m4q(q){
  var o=m4(),x=q[0],y=q[1],z=q[2],w=q[3],x2=x+x,y2=y+y,z2=z+z;
  var xx=x*x2,xy=x*y2,xz=x*z2,yy=y*y2,yz=y*z2,zz=z*z2,wx=w*x2,wy=w*y2,wz=w*z2;
  o[0]=1-yy-zz;o[1]=xy+wz;o[2]=xz-wy;o[4]=xy-wz;o[5]=1-xx-zz;o[6]=yz+wx;
  o[8]=xz+wy;o[9]=yz-wx;o[10]=1-xx-yy;o[15]=1;return o;
}
function eOB(t){var k=1.70158;return 1+(k+1)*Math.pow(t-1,3)+k*Math.pow(t-1,2)}
function idleQuat(a){return qnm([Math.sin(a)*0.28,Math.cos(a)*0.35,Math.sin(a*0.63)*0.22,1])}`;
}

/** Emits the mesh-building and text-atlas helpers shared by all three render paths. */
function emitMeshHelpers(): string {
  return `\
function buildMesh(verts,faces,faceCount,tpf){
  var pos=[],nrm=[],uv=[],fNorms=[];
  var cols=Math.ceil(Math.sqrt(faceCount)),rows=Math.ceil(faceCount/cols);
  for(var fi=0;fi<faceCount;fi++){
    var col=fi%cols,row=Math.floor(fi/cols),cu0=col/cols,cu1=(col+1)/cols,cv0=1-(row+1)/rows,cv1=1-row/rows;
    var allV=[],fn=null;
    for(var t=0;t<tpf;t++){
      var tri=faces[fi*tpf+t],a=verts[tri[0]],b=verts[tri[1]],c=verts[tri[2]];
      allV.push(a,b,c);
      if(t===0)fn=v3n(v3x(v3s(b,a),v3s(c,a)));
    }
    fNorms.push(fn);
    var cen=[0,0,0];
    for(var i=0;i<allV.length;i++){cen[0]+=allV[i][0];cen[1]+=allV[i][1];cen[2]+=allV[i][2]}
    cen[0]/=allV.length;cen[1]/=allV.length;cen[2]/=allV.length;
    var tang=v3n(v3s(allV[1],allV[0])),bitan=v3n(v3x(fn,tang)),us=[],vs=[];
    for(var i=0;i<allV.length;i++){var r=v3s(allV[i],cen);us.push(v3d(r,tang));vs.push(v3d(r,bitan))}
    var umin=Math.min.apply(null,us),umax=Math.max.apply(null,us),vmin=Math.min.apply(null,vs),vmax=Math.max.apply(null,vs),ur=umax-umin||1,vr=vmax-vmin||1;
    for(var t=0;t<tpf;t++){
      var tri=faces[fi*tpf+t];
      for(var vi=0;vi<3;vi++){
        var v=verts[tri[vi]],idx=t*3+vi;
        pos.push(v[0],v[1],v[2]);
        nrm.push(fn[0],fn[1],fn[2]);
        uv.push(cu0+(0.05+0.9*(us[idx]-umin)/ur)*(cu1-cu0),cv0+(0.05+0.9*(vs[idx]-vmin)/vr)*(cv1-cv0));
      }
    }
  }
  return{pos:new Float32Array(pos),nrm:new Float32Array(nrm),uv:new Float32Array(uv),count:pos.length/3,fNorms:fNorms};
}

function createTextAtlas(labels,fontScale,fg,bg,mirror,offY,underline69){
  var faceCount=labels.length,cols=Math.ceil(Math.sqrt(faceCount)),rows=Math.ceil(faceCount/cols),cw=128,ch=128;
  var atl=document.createElement('canvas');
  atl.width=cols*cw;atl.height=rows*ch;
  var ctx=atl.getContext('2d');
  if(!ctx)return atl;
  ctx.fillStyle=bg;ctx.fillRect(0,0,atl.width,atl.height);
  ctx.fillStyle=fg;ctx.textAlign='center';ctx.textBaseline='middle';
  for(var i=0;i<faceCount;i++){
    var lbl=labels[i],fs=Math.round(cw*fontScale*(lbl.length>1?0.82:1));
    ctx.font='bold '+fs+'px sans-serif';
    var cx=(i%cols)*cw+cw/2,cy=Math.floor(i/cols)*ch+ch/2;
    ctx.save();ctx.translate(cx,cy);
    if(mirror)ctx.scale(-1,-1);
    ctx.fillText(lbl,0,offY);
    if(underline69&&(lbl==='6'||lbl==='9')){var tw=ctx.measureText(lbl).width;ctx.fillRect(-tw/2,(mirror?offY:0)+Math.round(fs*0.55),tw,2)}
    ctx.restore();
  }
  return atl;
}`;
}

function commonRuntime(viewOff: number): string {
  return `
var cv=document.getElementById('cv');if(!cv)return;
var gl=cv.getContext('webgl',{antialias:true});if(!gl)return;
gl.enable(gl.DEPTH_TEST);gl.clearColor(0,0,0,0);gl.enable(gl.CULL_FACE);
var reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var rootEl=cv.closest?cv.closest('.widget-dice'):document.querySelector('.widget-dice');
if(!rootEl)rootEl=document.documentElement;
var cs=getComputedStyle(rootEl);
var dieBg=cs.getPropertyValue('--dbg').trim()||'#2a2a3a';
var dieTx=cs.getPropertyValue('--dfg').trim()||'#e8e8f0';

${emitMathCore()}

function m4t(m,v){
  var o=new Float32Array(m);
  o[12]+=m[0]*v[0]+m[4]*v[1]+m[8]*v[2];
  o[13]+=m[1]*v[0]+m[5]*v[1]+m[9]*v[2];
  o[14]+=m[2]*v[0]+m[6]*v[1]+m[10]*v[2];
  return o;
}

var VS='attribute vec3 aP,aN;attribute vec2 aU;uniform mat4 uMVP,uM;varying vec3 vN;varying vec2 vU;void main(){gl_Position=uMVP*vec4(aP,1.0);vN=mat3(uM)*aN;vU=aU;}';
var FS='precision mediump float;varying vec3 vN;varying vec2 vU;uniform sampler2D uT;uniform vec3 uL;void main(){vec3 n=normalize(vN);float d=max(dot(n,uL),0.0);gl_FragColor=vec4(texture2D(uT,vU).rgb*(0.28+0.72*d),1.0);}';
function mkS(s,t){var sh=gl.createShader(t);gl.shaderSource(sh,s);gl.compileShader(sh);return gl.getShaderParameter(sh,gl.COMPILE_STATUS)?sh:null}
var pr=gl.createProgram(),vsh=mkS(VS,gl.VERTEX_SHADER),fsh=mkS(FS,gl.FRAGMENT_SHADER);
if(!vsh||!fsh)return;
gl.attachShader(pr,vsh);gl.attachShader(pr,fsh);gl.linkProgram(pr);
if(!gl.getProgramParameter(pr,gl.LINK_STATUS))return;
gl.useProgram(pr);
var uMVP=gl.getUniformLocation(pr,'uMVP'),uM=gl.getUniformLocation(pr,'uM');
gl.uniform3f(gl.getUniformLocation(pr,'uL'),0.485,0.728,0.485);
gl.uniform1i(gl.getUniformLocation(pr,'uT'),0);

${emitMeshHelpers()}

function createPipAtlas(assign,fg,bg){
  var faceCount=assign.length,cols=Math.ceil(Math.sqrt(faceCount)),rows=Math.ceil(faceCount/cols),cw=128,ch=128;
  var atl=document.createElement('canvas');
  atl.width=cols*cw;atl.height=rows*ch;
  var ctx=atl.getContext('2d');
  if(!ctx)return atl;
  ctx.fillStyle=bg;ctx.fillRect(0,0,atl.width,atl.height);
  ctx.fillStyle=fg;
  var PR=10,SP=30;
  var PIPS={
    1:[[0,0]],
    2:[[-SP/2,-SP/2],[SP/2,SP/2]],
    3:[[-SP/2,-SP/2],[0,0],[SP/2,SP/2]],
    4:[[-SP/2,-SP/2],[SP/2,-SP/2],[-SP/2,SP/2],[SP/2,SP/2]],
    5:[[-SP/2,-SP/2],[SP/2,-SP/2],[0,0],[-SP/2,SP/2],[SP/2,SP/2]],
    6:[[-SP/2,-SP],[SP/2,-SP],[-SP/2,0],[SP/2,0],[-SP/2,SP],[SP/2,SP]]
  };
  for(var fi=0;fi<faceCount;fi++){
    var cellX=(fi%cols)*cw,cellY=Math.floor(fi/cols)*ch,pips=PIPS[assign[fi]];
    if(!pips)continue;
    var cx=cellX+cw/2,cy=cellY+ch/2;
    for(var p=0;p<pips.length;p++){ctx.beginPath();ctx.arc(cx+pips[p][0],cy+pips[p][1],PR,0,Math.PI*2);ctx.fill()}
  }
  return atl;
}

function mkB(d,at,sz){var b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,d,gl.STATIC_DRAW);var l=gl.getAttribLocation(pr,at);if(l>=0){gl.enableVertexAttribArray(l);gl.vertexAttribPointer(l,sz,gl.FLOAT,false,0,0)}return b}
function mkT(img,flipY){
  var t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,!!flipY);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  return t;
}
function bindB(buf,at,sz){gl.bindBuffer(gl.ARRAY_BUFFER,buf);var l=gl.getAttribLocation(pr,at);if(l>=0){gl.enableVertexAttribArray(l);gl.vertexAttribPointer(l,sz,gl.FLOAT,false,0,0)}}

var W=cv.width,H=cv.height,pM=m4p(50*Math.PI/180,W/H,0.1,100);
gl.viewport(0,0,W,H);
function draw(q,offset){
  var md=m4q(q),vw=m4i();vw[14]=${viewOff};
  if(offset)md=m4t(md,offset);
  gl.uniformMatrix4fv(uMVP,false,m4m(pM,m4m(vw,md)));
  gl.uniformMatrix4fv(uM,false,md);
}

function spinSettle(tq,count,offset,startQ,onDone,dur){
  if(reduced){
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    draw(tq,offset);gl.drawArrays(gl.TRIANGLES,0,count);
    if(onDone)onDone();
    return;
  }
  var total=Math.round((dur||parseFloat(cs.getPropertyValue('--ta-die-spin-duration'))||0.6)*60),spinEnd=Math.round(total*0.75),frame=0,sr=startQ||qnm([Math.random()-.5,Math.random()-.5,Math.random()-.5,Math.random()]),eq=null;
  (function step(){
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    var q;
    if(frame<spinEnd){var t=frame/spinEnd;q=qsl(sr,tq,1-Math.pow(1-t,2))}
    else{if(!eq)eq=qsl(sr,tq,0.93);var st=(frame-spinEnd)/(total-spinEnd);q=qsl(eq,tq,Math.min(eOB(Math.min(st,1)),1))}
    draw(q,offset);gl.drawArrays(gl.TRIANGLES,0,count);
    frame++;
    if(frame<=total)requestAnimationFrame(step);
    else if(onDone)onDone();
  })();
}
function coinQuat(a){var tilt=0.22,s=Math.sqrt(1-tilt*tilt);return qnm([tilt,Math.sin(a)*s,0,Math.cos(a)*s])}
`;
}

function standardOutcomeCode(dieType: DieType): string {
  if (dieType === 'd12') {
    return `
  if(roll===range[1]){lbl='CRIT SUCCESS';bg='var(--sbg, rgba(91,186,111,0.15))';fg='var(--sfg, #5BBA6F)'}
  else if(roll===range[0]){lbl='CRIT FAILURE';bg='var(--fbg, rgba(224,82,82,0.15))';fg='var(--ffg, #E05252)'}
  else if(margin>=4){lbl='SUCCESS';bg='var(--sbg, rgba(91,186,111,0.15))';fg='var(--sfg, #5BBA6F)'}
  else if(margin>=0){lbl='NARROW SUCCESS';bg='var(--pbg, rgba(232,168,56,0.15))';fg='var(--pfg, #E8A838)'}
  else if(margin>=-3){lbl='NARROW FAILURE';bg='var(--fbg, rgba(224,82,82,0.15))';fg='var(--ffg, #E05252)'}
  else{lbl='FAILURE';bg='var(--fbg, rgba(224,82,82,0.15))';fg='var(--ffg, #E05252)'}`;
  }
  return `
  if(roll===range[1]){lbl='CRITICAL SUCCESS';bg='var(--sbg, rgba(91,186,111,0.15))';fg='var(--sfg, #5BBA6F)';bd='var(--sbd, #5BBA6F)'}
  else if(roll===range[0]){lbl='CRITICAL FAILURE';bg='var(--fbg, rgba(224,82,82,0.15))';fg='var(--ffg, #E05252)';bd='var(--fbd, #E05252)'}
  else if(margin>=5){lbl='SUCCESS';bg='var(--sbg, rgba(91,186,111,0.15))';fg='var(--sfg, #5BBA6F)'}
  else if(margin>=0){lbl='NARROW SUCCESS';bg='var(--pbg, rgba(232,168,56,0.15))';fg='var(--pfg, #E8A838)'}
  else if(margin>=-4){lbl='NARROW FAILURE';bg='var(--fbg, rgba(224,82,82,0.15))';fg='var(--ffg, #E05252)'}
  else{lbl='FAILURE';bg='var(--fbg, rgba(224,82,82,0.15))';fg='var(--ffg, #E05252)'}`;
}

function generateCoinCode(): string {
  return `
(function(){
${commonRuntime(-2.5)}
var rolling=false,locked=false;
var SEGS=16,CR=0.8,CY=0.08,TPF=SEGS,FACES=2;
var V=[[0,CY,0],[0,-CY,0]],F=[];
for(var i=0;i<SEGS;i++){var a=i*2*Math.PI/SEGS;V.push([CR*Math.cos(a),CY,CR*Math.sin(a)])}
for(var i=0;i<SEGS;i++){var a=i*2*Math.PI/SEGS;V.push([CR*Math.cos(a),-CY,CR*Math.sin(a)])}
for(var i=0;i<SEGS;i++)F.push([0,2+(i+1)%SEGS,2+i]);
for(var i=0;i<SEGS;i++)F.push([1,2+SEGS+i,2+SEGS+(i+1)%SEGS]);
var mesh=buildMesh(V,F,2,SEGS);
mkB(mesh.pos,'aP',3);mkB(mesh.nrm,'aN',3);mkB(mesh.uv,'aU',2);
mkT(createTextAtlas(['H','T'],0.5,dieTx,dieBg,false,0,false),true);

function renderCoin(q){
  gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  draw(q,null);gl.drawArrays(gl.TRIANGLES,0,mesh.count);
}

var curQ=[0,0,0,1],ia=0,iR=null;
function idle(){
  if(rolling||locked)return;
  ia+=0.012;
  curQ=coinQuat(ia);
  renderCoin(curQ);
  iR=requestAnimationFrame(idle);
}
renderCoin(curQ=qnm([Math.random()-.5,Math.random()-.5,Math.random()-.5,Math.random()]));
if(!reduced)idle();

function showRes(roll){
  var isHeads=roll===1,lbl=isHeads?'HEADS':'TAILS';
  document.getElementById('xv').textContent=lbl;
  var oe=document.getElementById('xo');
  oe.textContent=lbl;
  oe.style.background=isHeads?'var(--sbg, rgba(91,186,111,0.15))':'var(--fbg, rgba(224,82,82,0.15))';
  oe.style.color=isHeads?'var(--sfg, #5BBA6F)':'var(--ffg, #E05252)';
  oe.style.border='1.5px solid '+(isHeads?'var(--sbd, #5BBA6F)':'var(--fbd, #E05252)');
  document.getElementById('ra').classList.add('v');
}

function doFlip(){
  if(rolling||locked)return;
  rolling=true;locked=true;
  if(iR){cancelAnimationFrame(iR);iR=null}
  document.getElementById('hi').classList.add('hd');
  document.getElementById('ra').classList.remove('v');
  var roll=1+Math.floor(Math.random()*2);
  var tgtQ=qAl(roll===1?[0,1,0]:[0,-1,0],[0,0,1]);
  spinSettle(tgtQ,mesh.count,null,curQ,function(){rolling=false;showRes(roll)},0.67);
}

document.getElementById('cz').addEventListener('click',doFlip);
})();`.trim();
}

function generateStandardCode(options: WebGLDiceCodeOptions): string {
  const range = options.config.numberRange;
  const labels = options.config.assign
    ? options.config.assign.map(String)
    : Array.from({ length: options.config.faceCount }, (_, i) => String(range[0] + i));
  const assign = options.config.assign ?? labels.map(Number);
  const mirror = options.config.trianglesPerFace === 1 || options.config.trianglesPerFace === 3;
  const offY = options.config.trianglesPerFace === 1 ? -Math.round(0.12 * 128) : 0;
  const atlasExpr =
    options.dieType === 'd6'
      ? `createPipAtlas(ASSIGN,dieTx,dieBg)`
      : `createTextAtlas(${js(labels)},${options.fontScale},dieTx,dieBg,${mirror},${offY},${options.dieType !== 'd10'})`;

  return `
(function(){
${commonRuntime(-3.5)}
var MOD=${options.modifier},DC=${options.dc === null ? 'null' : options.dc},rolling=false,locked=false;
var V=${js(options.config.customVertices ?? [])},F=${js(options.config.customFaces ?? [])},FC=${options.config.faceCount},TPF=${options.config.trianglesPerFace},range=${js(range)},ASSIGN=${js(assign)};
var NUM_TO_FACE={};for(var i=0;i<ASSIGN.length;i++)NUM_TO_FACE[ASSIGN[i]]=i;
var mesh=buildMesh(V,F,FC,TPF);
mkB(mesh.pos,'aP',3);mkB(mesh.nrm,'aN',3);mkB(mesh.uv,'aU',2);
mkT(${atlasExpr},true);

function renderDie(q){
  gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  draw(q,null);gl.drawArrays(gl.TRIANGLES,0,mesh.count);
}

var curQ=[0,0,0,1],ia=0,iR=null;
function idle(){if(rolling||locked)return;ia+=0.004;curQ=idleQuat(ia);renderDie(curQ);iR=requestAnimationFrame(idle)}
renderDie(curQ=qnm([Math.random()-.5,Math.random()-.5,Math.random()-.5,Math.random()]));
if(!reduced)idle();

function showRes(roll){
  var total=roll+MOD,xv=document.getElementById('xv'),xm=document.getElementById('xm'),xt=document.getElementById('xt');
  if(xv)xv.textContent=String(roll);
  if(xm)xm.textContent=(MOD>=0?'+':'')+MOD;
  if(xt)xt.textContent=String(total);
  if(DC!==null){
    var margin=total-DC,lbl,bg,fg,bd='transparent';
    document.getElementById('xd').textContent='DC '+DC;
${standardOutcomeCode(options.dieType)}
    var oe=document.getElementById('xo');oe.textContent=lbl;oe.style.background=bg;oe.style.color=fg;oe.style.border='1.5px solid '+bd;
    var ge=document.getElementById('xg');
    if(margin!==0){ge.textContent=(margin>0?'Passed':'Failed')+' by '+Math.abs(margin);ge.style.display='block'}else ge.style.display='none';
  }else{
    document.getElementById('xd').style.display='none';
    document.getElementById('xo').style.display='none';
    document.getElementById('xg').style.display='none';
  }
  document.getElementById('ra').classList.add('v');
}

function doRoll(){
  if(rolling||locked)return;
  rolling=true;locked=true;
  if(iR){cancelAnimationFrame(iR);iR=null}
  document.getElementById('hi').classList.add('hd');
  document.getElementById('ra').classList.remove('v');
  var roll=range[0]+Math.floor(Math.random()*(range[1]-range[0]+1));
  var faceIdx=NUM_TO_FACE[roll];if(faceIdx===undefined)faceIdx=0;
  var tgtQ=qAl(mesh.fNorms[faceIdx],[0,0,1]);
  spinSettle(tgtQ,mesh.count,null,curQ,function(){rolling=false;showRes(roll)});
}

document.getElementById('cz').addEventListener('click',doRoll);
})();`.trim();
}

function generateD100Code(options: WebGLDiceCodeOptions): string {
  const assign = [1, 3, 5, 7, 9, 0, 8, 6, 4, 2];
  const tensLabels = assign.map(value => (value === 0 ? '00' : String(value * 10)));
  const unitLabels = assign.map(String);

  return `
(function(){
var reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

${emitMathCore()}

${emitMeshHelpers()}

var V=${js(options.config.customVertices ?? [])},F=${js(options.config.customFaces ?? [])};
var ASSIGN=${js(assign)};
var N2F={};for(var i=0;i<ASSIGN.length;i++)N2F[ASSIGN[i]]=i;

function makeDie(cvId,labels,idleOff,underline){
  var cv=document.getElementById(cvId);if(!cv)return null;
  var gl=cv.getContext('webgl',{antialias:true});if(!gl)return null;
  gl.enable(gl.DEPTH_TEST);gl.clearColor(0,0,0,0);gl.enable(gl.CULL_FACE);
  var rootEl=cv.closest?cv.closest('.widget-dice'):document.querySelector('.widget-dice');
  if(!rootEl)rootEl=document.documentElement;
  var cs=getComputedStyle(rootEl);
  var dieBg=cs.getPropertyValue('--dbg').trim()||'#2a2a3a';
  var dieTx=cs.getPropertyValue('--dfg').trim()||'#e8e8f0';

  var VS='attribute vec3 aP,aN;attribute vec2 aU;uniform mat4 uMVP,uM;varying vec3 vN;varying vec2 vU;void main(){gl_Position=uMVP*vec4(aP,1.0);vN=mat3(uM)*aN;vU=aU;}';
  var FS='precision mediump float;varying vec3 vN;varying vec2 vU;uniform sampler2D uT;uniform vec3 uL;void main(){vec3 n=normalize(vN);float d=max(dot(n,uL),0.0);gl_FragColor=vec4(texture2D(uT,vU).rgb*(0.28+0.72*d),1.0);}';
  function mkS(s,t){var sh=gl.createShader(t);gl.shaderSource(sh,s);gl.compileShader(sh);return gl.getShaderParameter(sh,gl.COMPILE_STATUS)?sh:null}
  var pr=gl.createProgram(),vsh=mkS(VS,gl.VERTEX_SHADER),fsh=mkS(FS,gl.FRAGMENT_SHADER);
  if(!vsh||!fsh)return null;
  gl.attachShader(pr,vsh);gl.attachShader(pr,fsh);gl.linkProgram(pr);
  if(!gl.getProgramParameter(pr,gl.LINK_STATUS))return null;
  gl.useProgram(pr);
  var uMVP=gl.getUniformLocation(pr,'uMVP'),uMat=gl.getUniformLocation(pr,'uM');
  gl.uniform3f(gl.getUniformLocation(pr,'uL'),0.485,0.728,0.485);
  gl.uniform1i(gl.getUniformLocation(pr,'uT'),0);

  var mesh=buildMesh(V,F,10,2);
  function mkB(d,at,sz){var b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,d,gl.STATIC_DRAW);var l=gl.getAttribLocation(pr,at);if(l>=0){gl.enableVertexAttribArray(l);gl.vertexAttribPointer(l,sz,gl.FLOAT,false,0,0)}}
  mkB(mesh.pos,'aP',3);mkB(mesh.nrm,'aN',3);mkB(mesh.uv,'aU',2);

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
  var tx=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tx);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,createTextAtlas(labels,${js(options.fontScale)},dieTx,dieBg,false,0,underline));
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);

  var VIEW_Z=-3.5;
  var W=cv.width,H=cv.height,tc=mesh.count;
  var pM=m4p(50*Math.PI/180,W/H,0.1,100);
  gl.viewport(0,0,W,H);

  function dd(q){
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    var md=m4q(q),vw=m4i();vw[14]=VIEW_Z;
    gl.uniformMatrix4fv(uMVP,false,m4m(pM,m4m(vw,md)));
    gl.uniformMatrix4fv(uMat,false,md);
    gl.drawArrays(gl.TRIANGLES,0,tc);
  }

  var curQ=[0,0,0,1],ia=idleOff||0,iR=null,isRolling=false;
  function idle(){
    if(isRolling)return;
    ia+=0.004;curQ=idleQuat(ia);dd(curQ);iR=requestAnimationFrame(idle);
  }
  dd(curQ);
  if(!reduced)idle();

  return{
    roll:function(val,onDone){
      isRolling=true;if(iR){cancelAnimationFrame(iR);iR=null}
      var tgtQ=qAl(mesh.fNorms[N2F[val]],[0,0,1]);
      if(reduced){dd(tgtQ);isRolling=false;if(onDone)onDone();return}
      var sQ=qnm([Math.random()-.5,Math.random()-.5,Math.random()-.5,Math.random()]);
      var tot=55,sp=38,fr=0,eQ=null;
      (function step(){
        var q;
        if(fr<sp){var t=fr/sp;q=qsl(sQ,tgtQ,1-Math.pow(1-t,2))}
        else{if(!eQ)eQ=qsl(sQ,tgtQ,0.93);var st=(fr-sp)/(tot-sp);q=qsl(eQ,tgtQ,Math.min(eOB(Math.min(st,1)),1))}
        dd(q);curQ=q;fr++;
        if(fr<=tot)requestAnimationFrame(step);
        else{isRolling=false;if(onDone)onDone()}
      })();
    }
  };
}

var dT=makeDie('cvT',${js(tensLabels)},0,false);
var dU=makeDie('cvU',${js(unitLabels)},Math.PI/3,true);
if(!dT||!dU)return;

var rolling=false,locked=false;

function doRoll(){
  if(rolling||locked)return;rolling=true;locked=true;
  document.getElementById('hi').classList.add('hd');
  document.getElementById('ra').classList.remove('v');
  var tv=Math.floor(Math.random()*10),uv=Math.floor(Math.random()*10);
  var d1=false,d2=false;
  function chk(){if(d1&&d2){rolling=false;showRes(tv,uv)}}
  dT.roll(tv,function(){d1=true;chk()});
  dU.roll(uv,function(){d2=true;chk()});
}

function showRes(tv,uv){
  var tot=tv*10+uv;if(tot===0)tot=100;
  document.getElementById('xvT').textContent=tv===0?'00':String(tv*10);
  document.getElementById('xvU').textContent=String(uv);
  document.getElementById('xt').textContent=String(tot);
  document.getElementById('ra').classList.add('v');
}

document.getElementById('rollArea').addEventListener('click',doRoll);
})();`.trim();
}

export function generateWebGLDiceCode(options: WebGLDiceCodeOptions): string {
  if (options.dieType === 'd2') return generateCoinCode();
  if (options.dieType === 'd100') return generateD100Code(options);
  return generateStandardCode(options);
}
