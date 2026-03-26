// Generates a self-contained inline JavaScript string that renders
// a 3D numbered die using raw WebGL. No external dependencies.
// Geometry for all die types is serialised into CONFIG by dice.ts —
// no hardcoded polyhedra tables; output size scales with the die, not the set.

/**
 * Self-contained WebGL die renderer. Inject into a `<script>` block.
 *
 * Requires the following variables to be defined in scope before execution:
 *   CONFIG     — die config object (faceCount, numberRange, geometryType,
 *                customVertices, customFaces, assign, trianglesPerFace, paired)
 *   ROLL       — rolled value (number)
 *   FONT_SCALE — font scale for this die type (number)
 *   IS_D2      — boolean
 *   IS_D100    — boolean
 */
export const WEBGL_DICE_CODE: string = `
(function(){
var canvas=document.getElementById('die-canvas');
if(!canvas)return;
var gl=canvas.getContext('webgl')||canvas.getContext('experimental-webgl');
if(!gl)return;
gl.enable(gl.DEPTH_TEST);
gl.clearColor(0,0,0,0);
gl.enable(gl.CULL_FACE);

// ── Vec3 ──────────────────────────────────────────────────────────
function v3s(a,b){return[a[0]-b[0],a[1]-b[1],a[2]-b[2]]}
function v3x(a,b){return[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]}
function v3d(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]}
function v3n(v){var l=Math.sqrt(v[0]*v[0]+v[1]*v[1]+v[2]*v[2])||1;return[v[0]/l,v[1]/l,v[2]/l]}

// ── Quat [x,y,z,w] ────────────────────────────────────────────────
function qnm(q){var l=Math.sqrt(q[0]*q[0]+q[1]*q[1]+q[2]*q[2]+q[3]*q[3])||1;return[q[0]/l,q[1]/l,q[2]/l,q[3]/l]}
function qAl(a,b){
  var d=v3d(a,b);
  if(d>0.9999)return[0,0,0,1];
  if(d<-0.9999){var ax=v3n(v3x([1,0,0],a));if(Math.sqrt(ax[0]*ax[0]+ax[1]*ax[1]+ax[2]*ax[2])<0.01)ax=v3n(v3x([0,1,0],a));return[ax[0],ax[1],ax[2],0]}
  var c=v3x(a,b);return qnm([c[0],c[1],c[2],1+d]);
}
function qsl(a,b,t){
  var d=a[0]*b[0]+a[1]*b[1]+a[2]*b[2]+a[3]*b[3];
  if(d<0){b=[-b[0],-b[1],-b[2],-b[3]];d=-d}
  if(d>0.9995){return qnm([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t,a[3]+(b[3]-a[3])*t])}
  var th=Math.acos(d),s=Math.sin(th),s0=Math.sin((1-t)*th)/s,s1=Math.sin(t*th)/s;
  return[a[0]*s0+b[0]*s1,a[1]*s0+b[1]*s1,a[2]*s0+b[2]*s1,a[3]*s0+b[3]*s1];
}

// ── Mat4 (column-major) ───────────────────────────────────────────
function m4(){return new Float32Array(16)}
function m4i(){var m=m4();m[0]=m[5]=m[10]=m[15]=1;return m}
function m4m(a,b){
  var o=m4();
  for(var j=0;j<4;j++)for(var i=0;i<4;i++){var s=0;for(var k=0;k<4;k++)s+=a[i+k*4]*b[k+j*4];o[i+j*4]=s}
  return o;
}
function m4p(fov,asp,near,far){
  var o=m4(),f=1/Math.tan(fov*0.5),nf=1/(near-far);
  o[0]=f/asp;o[5]=f;o[10]=(far+near)*nf;o[11]=-1;o[14]=2*far*near*nf;return o;
}
function m4q(q){
  var o=m4(),x=q[0],y=q[1],z=q[2],w=q[3],x2=x+x,y2=y+y,z2=z+z;
  var xx=x*x2,yx=y*x2,yy=y*y2,zx=z*x2,zy=z*y2,zz=z*z2,wx=w*x2,wy=w*y2,wz=w*z2;
  o[0]=1-yy-zz;o[1]=yx+wz;o[2]=zx-wy;o[4]=yx-wz;o[5]=1-xx-zz;o[6]=zy+wx;
  o[8]=zx+wy;o[9]=zy-wx;o[10]=1-xx-yy;o[15]=1;return o;
}
function m4t(m,v){
  var o=new Float32Array(m);
  o[12]+=m[0]*v[0]+m[4]*v[1]+m[8]*v[2];
  o[13]+=m[1]*v[0]+m[5]*v[1]+m[9]*v[2];
  o[14]+=m[2]*v[0]+m[6]*v[1]+m[10]*v[2];
  return o;
}

// ── Shaders ───────────────────────────────────────────────────────
var VS='attribute vec3 aP,aN;attribute vec2 aU;uniform mat4 uMVP,uM;varying vec3 vN;varying vec2 vU;void main(){gl_Position=uMVP*vec4(aP,1);vN=mat3(uM)*aN;vU=aU;}';
var FS='precision mediump float;varying vec3 vN;varying vec2 vU;uniform sampler2D uT;uniform vec3 uL;void main(){vec3 n=normalize(vN);float d=max(dot(n,uL),0.0);gl_FragColor=vec4(texture2D(uT,vU).rgb*(vec3(0.3)+0.9*d),1.0);}';

function mkSh(src,type){
  var s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);
  if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){console.error('Shader:',gl.getShaderInfoLog(s));return null}
  return s;
}
var prog=gl.createProgram();
var vsh=mkSh(VS,gl.VERTEX_SHADER),fsh=mkSh(FS,gl.FRAGMENT_SHADER);
if(!vsh||!fsh)return;
gl.attachShader(prog,vsh);gl.attachShader(prog,fsh);
gl.linkProgram(prog);
if(!gl.getProgramParameter(prog,gl.LINK_STATUS)){console.error('Link:',gl.getProgramInfoLog(prog));return}
gl.useProgram(prog);

var uMVP=gl.getUniformLocation(prog,'uMVP');
var uM=gl.getUniformLocation(prog,'uM');
var uL=gl.getUniformLocation(prog,'uL');
var uT=gl.getUniformLocation(prog,'uT');
gl.uniform3f(uL,0.485,0.728,0.485);
gl.uniform1i(uT,0);

// ── Build mesh ────────────────────────────────────────────────────
function buildMesh(verts,faces,faceCount,tpf){
  var pos=[],nrm=[],uv=[],fNorms=[];
  var cols=Math.ceil(Math.sqrt(faceCount)),rows=Math.ceil(faceCount/cols);

  for(var fi=0;fi<faceCount;fi++){
    var col=fi%cols,row=Math.floor(fi/cols);
    var cu0=col/cols,cu1=(col+1)/cols,cv0=1-(row+1)/rows,cv1=1-row/rows;

    var allV=[],fn=null;
    for(var t=0;t<tpf;t++){
      var tri=faces[fi*tpf+t];
      var a=verts[tri[0]],b=verts[tri[1]],c=verts[tri[2]];
      allV.push(a,b,c);
      if(t===0){fn=v3n(v3x(v3s(b,a),v3s(c,a)))}
    }
    fNorms.push(fn);

    var cen=[0,0,0];
    for(var i=0;i<allV.length;i++){cen[0]+=allV[i][0];cen[1]+=allV[i][1];cen[2]+=allV[i][2]}
    cen[0]/=allV.length;cen[1]/=allV.length;cen[2]/=allV.length;
    var tang=v3n(v3s(allV[1],allV[0]));
    var bitan=v3n(v3x(fn,tang));

    var us=[],vs=[];
    for(var i=0;i<allV.length;i++){
      var r=v3s(allV[i],cen);
      us.push(v3d(r,tang));vs.push(v3d(r,bitan));
    }
    var umin=Math.min.apply(null,us),umax=Math.max.apply(null,us);
    var vmin=Math.min.apply(null,vs),vmax=Math.max.apply(null,vs);
    var ur=umax-umin||1,vr=vmax-vmin||1;

    for(var t=0;t<tpf;t++){
      var tri=faces[fi*tpf+t];
      for(var vi=0;vi<3;vi++){
        var v=verts[tri[vi]];
        pos.push(v[0],v[1],v[2]);
        nrm.push(fn[0],fn[1],fn[2]);
        var idx=t*3+vi;
        var nu=0.05+0.9*(us[idx]-umin)/ur;
        var nv=0.05+0.9*(vs[idx]-vmin)/vr;
        uv.push(cu0+nu*(cu1-cu0),cv0+nv*(cv1-cv0));
      }
    }
  }
  return{pos:new Float32Array(pos),nrm:new Float32Array(nrm),uv:new Float32Array(uv),count:pos.length/3,fNorms:fNorms};
}

// ── Texture atlas ─────────────────────────────────────────────────
// mirror: true for triangular-faced dice (tpf===1) and pentagonal (tpf===3)
// offY:  non-zero for triangular faces only (tpf===1) — pushes label toward centroid
function createAtlas(faceCount,range,fontScale,fg,bg,labelFn,mirror,offY){
  var cols=Math.ceil(Math.sqrt(faceCount)),rows=Math.ceil(faceCount/cols);
  var cw=128,ch=128;
  var atlas=document.createElement('canvas');
  atlas.width=cols*cw;atlas.height=rows*ch;
  var ctx=atlas.getContext('2d');
  if(!ctx)return atlas;
  ctx.fillStyle=bg;ctx.fillRect(0,0,atlas.width,atlas.height);
  ctx.fillStyle=fg;ctx.textAlign='center';ctx.textBaseline='middle';
  var fs=Math.round(cw*fontScale);
  ctx.font='bold '+fs+'px sans-serif';
  for(var i=0;i<faceCount;i++){
    var cx=(i%cols)*cw+cw/2,cy=Math.floor(i/cols)*ch+ch/2;
    var lbl=labelFn?labelFn(i):String(range[0]+i);
    ctx.save();
    ctx.translate(cx,cy);
    if(mirror)ctx.scale(-1,-1);
    ctx.fillText(lbl,0,offY);
    if(lbl==='6'||lbl==='9'){
      var tw=ctx.measureText(lbl).width;
      ctx.fillRect(-tw/2,(mirror?offY:0)+Math.round(fs*0.55),tw,2);
    }
    ctx.restore();
  }
  return atlas;
}

// ── GL helpers ────────────────────────────────────────────────────
function mkBuf(data,attr,size){
  var b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);
  gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);
  var loc=gl.getAttribLocation(prog,attr);
  gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,size,gl.FLOAT,false,0,0);
  return b;
}
function mkTex(img,flipY){
  var t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,!!flipY);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  return t;
}
function bindBuf(buf,attr,size){
  gl.bindBuffer(gl.ARRAY_BUFFER,buf);
  var loc=gl.getAttribLocation(prog,attr);
  gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,size,gl.FLOAT,false,0,0);
}

// ── Draw scene ────────────────────────────────────────────────────
var W=canvas.width,H=canvas.height;
var projM=m4p(50*Math.PI/180,W/H,0.1,100);
var viewOff=IS_D100?-5:-3.5;

function draw(modelQ,offset){
  var model=m4q(modelQ);
  if(offset)model=m4t(model,offset);
  var view=m4i();view[14]=viewOff;
  var mvp=m4m(projM,m4m(view,model));
  gl.uniformMatrix4fv(uMVP,false,mvp);
  gl.uniformMatrix4fv(uM,false,model);
}

// ── Animation ─────────────────────────────────────────────────────
function eOB(t){var c=1.70158;return 1+(c+1)*Math.pow(t-1,3)+c*Math.pow(t-1,2)}
var cs=getComputedStyle(document.documentElement);
var reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var dieBg=cs.getPropertyValue('--ta-die-bg').trim()||'#2a2a3a';
var dieTx=cs.getPropertyValue('--ta-die-text-color').trim()||'#e8e8f0';

function spinSettle(tq,count,offset){
  if(reduced){
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    draw(tq,offset);gl.drawArrays(gl.TRIANGLES,0,count);return;
  }
  var dur=parseFloat(cs.getPropertyValue('--ta-die-spin-duration'))||0.6;
  var total=Math.round(dur*60),spinEnd=Math.round(total*0.75),frame=0;
  var sr=qnm([Math.random()-0.5,Math.random()-0.5,Math.random()-0.5,Math.random()]),eq=null;
  (function step(){
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    var q;
    if(frame<spinEnd){var t=frame/spinEnd,e=1-Math.pow(1-t,2);q=qsl(sr,tq,e)}
    else{if(!eq)eq=qsl(sr,tq,1-Math.pow(0.25,2));var st=(frame-spinEnd)/(total-spinEnd);q=qsl(eq,tq,Math.min(eOB(Math.min(st,1)),1))}
    draw(q,offset);gl.drawArrays(gl.TRIANGLES,0,count);
    frame++;if(frame<=total)requestAnimationFrame(step);
  })();
}

// ── Coin (d2) ─────────────────────────────────────────────────────
if(IS_D2){
  var cv=[],cf=[];
  var N=16;
  cv.push([0,0.08,0]);cv.push([0,-0.08,0]);
  for(var i=0;i<N;i++){var a=i*2*Math.PI/N;cv.push([0.8*Math.cos(a),0.08,0.8*Math.sin(a)])}
  for(var i=0;i<N;i++){var a=i*2*Math.PI/N;cv.push([0.8*Math.cos(a),-0.08,0.8*Math.sin(a)])}
  for(var i=0;i<N;i++)cf.push([0,2+i,2+(i+1)%N]);
  for(var i=0;i<N;i++)cf.push([1,2+N+(i+1)%N,2+N+i]);
  var mesh=buildMesh(cv,cf,2,N);
  mkBuf(mesh.pos,'aP',3);mkBuf(mesh.nrm,'aN',3);mkBuf(mesh.uv,'aU',2);
  var atlas=createAtlas(2,[1,2],0.5,dieTx,dieBg,null,false,0);mkTex(atlas,true);
  var tq=qAl(ROLL===1?[0,1,0]:[0,-1,0],[0,0,1]);
  spinSettle(tq,mesh.count,null);

// ── Percentile (d100) ─────────────────────────────────────────────
}else if(IS_D100){
  var tens=Math.floor((ROLL%100)/10),units=ROLL%10;
  var cv=CONFIG.customVertices,cf=CONFIG.customFaces;
  var m1=buildMesh(cv,cf,10,2);
  var a1=createAtlas(10,[0,9],FONT_SCALE,dieTx,dieBg,function(i){return String(i*10).padStart(2,'0')},false,0);
  var m2=buildMesh(cv,cf,10,2);
  var a2=createAtlas(10,[0,9],FONT_SCALE,dieTx,dieBg,null,false,0);
  var bp1=mkBuf(m1.pos,'aP',3),bn1=mkBuf(m1.nrm,'aN',3),bu1=mkBuf(m1.uv,'aU',2);
  var t1=mkTex(a1,true);
  var bp2=mkBuf(m2.pos,'aP',3),bn2=mkBuf(m2.nrm,'aN',3),bu2=mkBuf(m2.uv,'aU',2);
  var t2=mkTex(a2,true);
  var tq1=qAl(m1.fNorms[tens],[0,0,1]);
  var tq2=qAl(m2.fNorms[units],[0,0,1]);
  function bindD1(){bindBuf(bp1,'aP',3);bindBuf(bn1,'aN',3);bindBuf(bu1,'aU',2);gl.bindTexture(gl.TEXTURE_2D,t1)}
  function bindD2(){bindBuf(bp2,'aP',3);bindBuf(bn2,'aN',3);bindBuf(bu2,'aU',2);gl.bindTexture(gl.TEXTURE_2D,t2)}
  if(reduced){
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    bindD1();draw(tq1,[-0.9,0,0]);gl.drawArrays(gl.TRIANGLES,0,m1.count);
    bindD2();draw(tq2,[0.9,0,0]);gl.drawArrays(gl.TRIANGLES,0,m2.count);
  }else{
    var dur=parseFloat(cs.getPropertyValue('--ta-die-spin-duration'))||0.8;
    var total=Math.round(dur*60),spinEnd=Math.round(total*0.75),frame=0;
    var sr1=qnm([Math.random()-0.5,Math.random()-0.5,Math.random()-0.5,Math.random()]);
    var sr2=qnm([Math.random()-0.5,Math.random()-0.5,Math.random()-0.5,Math.random()]);
    var eq1=null,eq2=null;
    (function step(){
      gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
      var q1,q2;
      if(frame<spinEnd){
        var t=frame/spinEnd,e=1-Math.pow(1-t,2);
        q1=qsl(sr1,tq1,e);q2=qsl(sr2,tq2,e);
      }else{
        if(!eq1){eq1=qsl(sr1,tq1,1-Math.pow(0.25,2));eq2=qsl(sr2,tq2,1-Math.pow(0.25,2))}
        var st=(frame-spinEnd)/(total-spinEnd),eb=Math.min(eOB(Math.min(st,1)),1);
        q1=qsl(eq1,tq1,eb);q2=qsl(eq2,tq2,eb);
      }
      bindD1();draw(q1,[-0.9,0,0]);gl.drawArrays(gl.TRIANGLES,0,m1.count);
      bindD2();draw(q2,[0.9,0,0]);gl.drawArrays(gl.TRIANGLES,0,m2.count);
      frame++;if(frame<=total)requestAnimationFrame(step);
    })();
  }

// ── Standard die (d4/d6/d8/d10/d12/d20) ──────────────────────────
// All geometry from CONFIG — no hardcoded polyhedra tables.
// mirror rule: triangular faces (tpf===1) and pentagonal (tpf===3) need ctx.scale(-1,-1)
// offY rule:   triangular faces only (tpf===1) offset label 15% toward centroid
}else{
  var verts=CONFIG.customVertices,faces=CONFIG.customFaces;
  var fCount=CONFIG.faceCount,tpf=CONFIG.trianglesPerFace;
  var ASSIGN=CONFIG.assign||null;
  var mirror=(tpf===1||tpf===3);
  var offY=tpf===1?-Math.round(0.15*128):0;
  var mesh=buildMesh(verts,faces,fCount,tpf);
  mkBuf(mesh.pos,'aP',3);mkBuf(mesh.nrm,'aN',3);mkBuf(mesh.uv,'aU',2);
  var labelFn=ASSIGN?function(i){return String(ASSIGN[i])}:null;
  var atlas=createAtlas(fCount,CONFIG.numberRange,FONT_SCALE,dieTx,dieBg,labelFn,mirror,offY);mkTex(atlas,true);
  var idx;
  if(ASSIGN){idx=0;for(var i=0;i<ASSIGN.length;i++){if(ASSIGN[i]===ROLL){idx=i;break}}}
  else{idx=ROLL-CONFIG.numberRange[0];if(idx<0||idx>=mesh.fNorms.length)idx=0}
  var tq=qAl(mesh.fNorms[idx],[0,0,1]);
  spinSettle(tq,mesh.count,null);
}
})();`.trim();

/** @internal — test-only; source files import WEBGL_DICE_CODE directly. */
export function generateWebGLDiceCode(): string { return WEBGL_DICE_CODE; }
