// Generates a self-contained inline JavaScript string (~10KB) that renders
// a 3D numbered die using raw WebGL. No external dependencies.

/** Variables that must be defined before WEBGL_DICE_CODE executes. */
export type WebGLDiceContext = {
  diceCount: number;
  diceSides: number;
  diceResults: number[];
  diceLabel: string;
  diceModifier: number;
};

/**
 * Self-contained WebGL die renderer (~10KB). Inject into a `<script>` block.
 *
 * Requires the following variables to be defined in scope before execution
 * (see {@link WebGLDiceContext}):
 *   CONFIG     — die config object (faceCount, numberRange, geometryType, customVertices, customFaces, trianglesPerFace, paired)
 *   ROLL       — rolled value (number)
 *   FONT_SCALE — font scale for this die type (number)
 *   IS_D2      — boolean
 *   IS_D100    — boolean
 */
export const WEBGL_DICE_CODE: string = `
// ══════════════════════════════════════════════════
// Minimal WebGL Dice Renderer — no dependencies
// ══════════════════════════════════════════════════

(function(){
var canvas=document.getElementById('die-canvas');
if(!canvas)return;
var gl=canvas.getContext('webgl')||canvas.getContext('experimental-webgl');
if(!gl)return;
gl.enable(gl.DEPTH_TEST);
gl.clearColor(0,0,0,0);
gl.enable(gl.CULL_FACE);

// ── Vec3 ──
function v3sub(a,b){return[a[0]-b[0],a[1]-b[1],a[2]-b[2]]}
function v3cross(a,b){return[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]}
function v3dot(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]}
function v3len(v){return Math.sqrt(v[0]*v[0]+v[1]*v[1]+v[2]*v[2])}
function v3norm(v){var l=v3len(v)||1;return[v[0]/l,v[1]/l,v[2]/l]}

// ── Quat [x,y,z,w] ──
function qnorm(q){var l=Math.sqrt(q[0]*q[0]+q[1]*q[1]+q[2]*q[2]+q[3]*q[3])||1;return[q[0]/l,q[1]/l,q[2]/l,q[3]/l]}
function quatFromUV(a,b){
  var d=v3dot(a,b);
  if(d>0.9999)return[0,0,0,1];
  if(d<-0.9999){var ax=v3norm(v3cross([1,0,0],a));if(v3len(ax)<0.01)ax=v3norm(v3cross([0,1,0],a));return[ax[0],ax[1],ax[2],0]}
  var c=v3cross(a,b);return qnorm([c[0],c[1],c[2],1+d]);
}
function qslerp(a,b,t){
  var d=a[0]*b[0]+a[1]*b[1]+a[2]*b[2]+a[3]*b[3];
  if(d<0){b=[-b[0],-b[1],-b[2],-b[3]];d=-d}
  if(d>0.9995){return qnorm([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t,a[3]+(b[3]-a[3])*t])}
  var th=Math.acos(d),s=Math.sin(th),s0=Math.sin((1-t)*th)/s,s1=Math.sin(t*th)/s;
  return[a[0]*s0+b[0]*s1,a[1]*s0+b[1]*s1,a[2]*s0+b[2]*s1,a[3]*s0+b[3]*s1];
}
// ── Mat4 (column-major) ──
function m4(){return new Float32Array(16)}
function m4id(){var m=m4();m[0]=m[5]=m[10]=m[15]=1;return m}
function m4mul(a,b){
  var o=m4();
  for(var j=0;j<4;j++)for(var i=0;i<4;i++){var s=0;for(var k=0;k<4;k++)s+=a[i+k*4]*b[k+j*4];o[i+j*4]=s}
  return o;
}
function m4persp(fov,asp,near,far){
  var o=m4(),f=1/Math.tan(fov*0.5),nf=1/(near-far);
  o[0]=f/asp;o[5]=f;o[10]=(far+near)*nf;o[11]=-1;o[14]=2*far*near*nf;return o;
}
function m4fromQ(q){
  var o=m4(),x=q[0],y=q[1],z=q[2],w=q[3],x2=x+x,y2=y+y,z2=z+z;
  var xx=x*x2,yx=y*x2,yy=y*y2,zx=z*x2,zy=z*y2,zz=z*z2,wx=w*x2,wy=w*y2,wz=w*z2;
  o[0]=1-yy-zz;o[1]=yx+wz;o[2]=zx-wy;o[4]=yx-wz;o[5]=1-xx-zz;o[6]=zy+wx;
  o[8]=zx+wy;o[9]=zy-wx;o[10]=1-xx-yy;o[15]=1;return o;
}
function m4trans(m,v){
  var o=new Float32Array(m);
  o[12]+=m[0]*v[0]+m[4]*v[1]+m[8]*v[2];
  o[13]+=m[1]*v[0]+m[5]*v[1]+m[9]*v[2];
  o[14]+=m[2]*v[0]+m[6]*v[1]+m[10]*v[2];
  return o;
}

// ── Shaders ──
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

// ── Polyhedra data ──
var T=(1+Math.sqrt(5))/2,R=1/T;
var GEOS={
  d4:{v:[[1,1,1],[-1,-1,1],[-1,1,-1],[1,-1,-1]],f:[[2,1,0],[0,3,2],[1,3,0],[2,3,1]],tpf:1},
  d6:{v:[[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1],[-1,-1,-1],[-1,1,-1],[1,1,-1],[1,-1,-1]],
    f:[[0,1,2],[0,2,3],[4,5,6],[4,6,7],[3,2,6],[3,6,5],[0,4,7],[0,7,1],[1,7,6],[1,6,2],[0,3,5],[0,5,4]],tpf:2},
  d8:{v:[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]],
    f:[[0,2,4],[0,4,3],[0,3,5],[0,5,2],[1,4,2],[1,3,4],[1,5,3],[1,2,5]],tpf:1},
  d12:{v:[[-1,-1,-1],[-1,-1,1],[-1,1,-1],[-1,1,1],[1,-1,-1],[1,-1,1],[1,1,-1],[1,1,1],
    [0,-R,-T],[0,-R,T],[0,R,-T],[0,R,T],[-R,-T,0],[-R,T,0],[R,-T,0],[R,T,0],
    [-T,0,-R],[-T,0,R],[T,0,-R],[T,0,R]],
    f:[3,11,7,3,7,15,3,15,13,7,19,17,7,17,6,7,6,15,17,4,8,17,8,10,17,10,6,
      8,0,16,8,16,2,8,2,10,0,12,1,0,1,18,0,18,16,6,10,2,6,2,13,6,13,15,
      2,16,18,2,18,3,2,3,13,18,1,9,18,9,11,18,11,3,4,14,12,4,12,0,4,0,8,
      11,9,5,11,5,19,11,19,7,19,5,14,19,14,4,19,4,17,1,12,14,1,14,5,1,5,9],tpf:3},
  d20:{v:[[-1,T,0],[1,T,0],[-1,-T,0],[1,-T,0],[0,-1,T],[0,1,T],[0,-1,-T],[0,1,-T],
    [T,0,-1],[T,0,1],[-T,0,-1],[-T,0,1]],
    f:[[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],
      [3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]],tpf:1}
};

// Normalise all polyhedra vertices to unit sphere
for(var k in GEOS){var g=GEOS[k];if(!g.v)continue;for(var i=0;i<g.v.length;i++)g.v[i]=v3norm(g.v[i])}

// Unpack d12 flat face array into triples
(function(){var ff=GEOS.d12.f,tr=[];for(var i=0;i<ff.length;i+=3)tr.push([ff[i],ff[i+1],ff[i+2]]);GEOS.d12.f=tr})();

// ── Build mesh ──
function buildMesh(verts,faces,faceCount,tpf){
  var pos=[],nrm=[],uv=[],fNorms=[];
  var cols=Math.ceil(Math.sqrt(faceCount)),rows=Math.ceil(faceCount/cols);

  for(var fi=0;fi<faceCount;fi++){
    var col=fi%cols,row=Math.floor(fi/cols);
    var cu0=col/cols,cu1=(col+1)/cols,cv0=1-(row+1)/rows,cv1=1-row/rows;

    // Compute face centroid and tangent frame for UV projection
    var allV=[],fn=null;
    for(var t=0;t<tpf;t++){
      var tri=faces[fi*tpf+t];
      var a=verts[tri[0]],b=verts[tri[1]],c=verts[tri[2]];
      allV.push(a,b,c);
      if(t===0){
        var e1=v3sub(b,a),e2=v3sub(c,a);
        fn=v3norm(v3cross(e1,e2));
      }
    }
    fNorms.push(fn);

    // Tangent frame
    var cen=[0,0,0];
    for(var i=0;i<allV.length;i++){cen[0]+=allV[i][0];cen[1]+=allV[i][1];cen[2]+=allV[i][2]}
    cen[0]/=allV.length;cen[1]/=allV.length;cen[2]/=allV.length;
    var tang=v3norm(v3sub(allV[1],allV[0]));
    var bitan=v3norm(v3cross(fn,tang));

    // Project to 2D and find bounds
    var us=[],vs=[];
    for(var i=0;i<allV.length;i++){
      var r=v3sub(allV[i],cen);
      us.push(v3dot(r,tang));vs.push(v3dot(r,bitan));
    }
    var umin=Math.min.apply(null,us),umax=Math.max.apply(null,us);
    var vmin=Math.min.apply(null,vs),vmax=Math.max.apply(null,vs);
    var ur=umax-umin||1,vr=vmax-vmin||1;

    // Emit triangles
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

// ── Texture atlas ──
function createAtlas(faceCount,range,fontScale,fg,bg,labelFn){
  var cols=Math.ceil(Math.sqrt(faceCount)),rows=Math.ceil(faceCount/cols);
  var cw=128,ch=128;
  var atlas=document.createElement('canvas');
  atlas.width=cols*cw;atlas.height=rows*ch;
  var ctx=atlas.getContext('2d');
  if(!ctx)return atlas;
  ctx.fillStyle=bg;ctx.fillRect(0,0,atlas.width,atlas.height);
  ctx.fillStyle=fg;ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.font='bold '+Math.round(cw*fontScale)+'px sans-serif';
  for(var i=0;i<faceCount;i++){
    var x=(i%cols)*cw+cw/2,y=Math.floor(i/cols)*ch+ch/2;
    var lbl=labelFn?labelFn(i):String(range[0]+i);
    ctx.fillText(lbl,x,y);
  }
  return atlas;
}

// ── GL helpers ──
function mkBuf(data,attr,size){
  var b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);
  gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);
  var loc=gl.getAttribLocation(prog,attr);
  gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,size,gl.FLOAT,false,0,0);
  return b;
}
function mkTex(img){
  var t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);
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

// ── Draw scene ──
var W=canvas.width,H=canvas.height;
var projM=m4persp(50*Math.PI/180,W/H,0.1,100);
var viewOff=IS_D100?-5:-3.5;

function draw(modelQ,offset){
  var model=m4fromQ(modelQ);
  if(offset)model=m4trans(model,offset);
  var view=m4id();view[14]=viewOff;
  var mvp=m4mul(projM,m4mul(view,model));
  gl.uniformMatrix4fv(uMVP,false,mvp);
  gl.uniformMatrix4fv(uM,false,model);
}

// ── Animation ──
function easeOutBack(t){var c=1.70158;return 1+(c+1)*Math.pow(t-1,3)+c*Math.pow(t-1,2)}
var cs=getComputedStyle(document.documentElement);
var reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── Main setup ──
var dieBg=cs.getPropertyValue('--ta-die-bg').trim()||'#2a2a3a';
var dieTx=cs.getPropertyValue('--ta-die-text-color').trim()||'#e8e8f0';

// Shared spin→settle animation for a single die
function spinSettle(tq,count,offset){
  if(reduced){
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    draw(tq,offset);gl.drawArrays(gl.TRIANGLES,0,count);return;
  }
  var dur=parseFloat(cs.getPropertyValue('--ta-die-spin-duration'))||0.6;
  var total=Math.round(dur*60),spinEnd=Math.round(total*0.75),frame=0;
  var sr=qnorm([Math.random()-0.5,Math.random()-0.5,Math.random()-0.5,Math.random()]),eq=null;
  (function step(){
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    var q;
    if(frame<spinEnd){var t=frame/spinEnd,e=1-Math.pow(1-t,2);q=qslerp(sr,tq,e)}
    else{if(!eq)eq=qslerp(sr,tq,1-Math.pow(0.25,2));var st=(frame-spinEnd)/(total-spinEnd);q=qslerp(eq,tq,Math.min(easeOutBack(Math.min(st,1)),1))}
    draw(q,offset);gl.drawArrays(gl.TRIANGLES,0,count);
    frame++;if(frame<=total)requestAnimationFrame(step);
  })();
}

if(IS_D2){
  // Coin: flat 16-sided polygon
  var cv=[],cf=[];
  var N=16;
  cv.push([0,0.08,0]);cv.push([0,-0.08,0]);
  for(var i=0;i<N;i++){var a=i*2*Math.PI/N;cv.push([0.8*Math.cos(a),0.08,0.8*Math.sin(a)])}
  for(var i=0;i<N;i++){var a=i*2*Math.PI/N;cv.push([0.8*Math.cos(a),-0.08,0.8*Math.sin(a)])}
  for(var i=0;i<N;i++)cf.push([0,2+i,2+(i+1)%N]);
  for(var i=0;i<N;i++)cf.push([1,2+N+(i+1)%N,2+N+i]);
  var mesh=buildMesh(cv,cf,2,N);
  mkBuf(mesh.pos,'aP',3);mkBuf(mesh.nrm,'aN',3);mkBuf(mesh.uv,'aU',2);
  var atlas=createAtlas(2,[1,2],0.5,dieTx,dieBg);mkTex(atlas);
  var tq=quatFromUV(ROLL===1?[0,1,0]:[0,-1,0],[0,0,1]);
  spinSettle(tq,mesh.count,null);

}else if(IS_D100){
  // I1 fix: ROLL%100 handles 100→(0,0) correctly (00+0=100 convention)
  var tens=Math.floor((ROLL%100)/10),units=ROLL%10;
  var cv=CONFIG.customVertices,cf=[];
  for(var i=0;i<CONFIG.customFaces.length;i++)cf.push(CONFIG.customFaces[i]);
  var m1=buildMesh(cv,cf,10,2);
  var a1=createAtlas(10,[0,9],FONT_SCALE,dieTx,dieBg,function(i){return String(i*10).padStart(2,'0')});
  var m2=buildMesh(cv,cf,10,2);
  var a2=createAtlas(10,[0,9],FONT_SCALE,dieTx,dieBg);
  // Create buffers and textures ONCE — not per frame
  var bp1=mkBuf(m1.pos,'aP',3),bn1=mkBuf(m1.nrm,'aN',3),bu1=mkBuf(m1.uv,'aU',2);
  var t1=mkTex(a1);
  var bp2=mkBuf(m2.pos,'aP',3),bn2=mkBuf(m2.nrm,'aN',3),bu2=mkBuf(m2.uv,'aU',2);
  var t2=mkTex(a2);
  var tq1=quatFromUV(m1.fNorms[tens],[0,0,1]);
  var tq2=quatFromUV(m2.fNorms[units],[0,0,1]);
  function bindD1(){bindBuf(bp1,'aP',3);bindBuf(bn1,'aN',3);bindBuf(bu1,'aU',2);gl.bindTexture(gl.TEXTURE_2D,t1)}
  function bindD2(){bindBuf(bp2,'aP',3);bindBuf(bn2,'aN',3);bindBuf(bu2,'aU',2);gl.bindTexture(gl.TEXTURE_2D,t2)}
  if(reduced){
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    bindD1();draw(tq1,[-0.9,0,0]);gl.drawArrays(gl.TRIANGLES,0,m1.count);
    bindD2();draw(tq2,[0.9,0,0]);gl.drawArrays(gl.TRIANGLES,0,m2.count);
  }else{
    var dur=parseFloat(cs.getPropertyValue('--ta-die-spin-duration'))||0.8;
    var total=Math.round(dur*60),spinEnd=Math.round(total*0.75),frame=0;
    var sr1=qnorm([Math.random()-0.5,Math.random()-0.5,Math.random()-0.5,Math.random()]);
    var sr2=qnorm([Math.random()-0.5,Math.random()-0.5,Math.random()-0.5,Math.random()]);
    var eq1=null,eq2=null;
    (function step(){
      gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
      var q1,q2;
      if(frame<spinEnd){
        var t=frame/spinEnd,e=1-Math.pow(1-t,2);
        q1=qslerp(sr1,tq1,e);q2=qslerp(sr2,tq2,e);
      }else{
        if(!eq1){eq1=qslerp(sr1,tq1,1-Math.pow(0.25,2));eq2=qslerp(sr2,tq2,1-Math.pow(0.25,2))}
        var st=(frame-spinEnd)/(total-spinEnd),eb=Math.min(easeOutBack(Math.min(st,1)),1);
        q1=qslerp(eq1,tq1,eb);q2=qslerp(eq2,tq2,eb);
      }
      bindD1();draw(q1,[-0.9,0,0]);gl.drawArrays(gl.TRIANGLES,0,m1.count);
      bindD2();draw(q2,[0.9,0,0]);gl.drawArrays(gl.TRIANGLES,0,m2.count);
      frame++;if(frame<=total)requestAnimationFrame(step);
    })();
  }

}else{
  // Standard die: d4, d6, d8, d10, d12, d20
  var geoKey=CONFIG.geometryType==='BufferGeometry'?null:
    CONFIG.geometryType.replace('Geometry','').toLowerCase();
  var geoMap={tetrahedron:'d4',box:'d6',octahedron:'d8',dodecahedron:'d12',icosahedron:'d20'};
  var dk=geoKey?geoMap[geoKey]||'d20':'custom';
  var verts,faces,fCount=CONFIG.faceCount,tpf=CONFIG.trianglesPerFace;
  if(dk==='custom'){
    verts=CONFIG.customVertices;
    faces=[];for(var i=0;i<CONFIG.customFaces.length;i++)faces.push(CONFIG.customFaces[i]);
  }else{
    verts=GEOS[dk].v;faces=GEOS[dk].f;
  }
  var mesh=buildMesh(verts,faces,fCount,tpf);
  mkBuf(mesh.pos,'aP',3);mkBuf(mesh.nrm,'aN',3);mkBuf(mesh.uv,'aU',2);
  var atlas=createAtlas(fCount,CONFIG.numberRange,FONT_SCALE,dieTx,dieBg);mkTex(atlas);
  var idx=ROLL-CONFIG.numberRange[0];
  if(idx<0||idx>=mesh.fNorms.length)idx=0;
  var tq=quatFromUV(mesh.fNorms[idx],[0,0,1]);
  spinSettle(tq,mesh.count,null);
}
})();`.trim();

// Keep the function as a thin wrapper for backward compat
export function generateWebGLDiceCode(): string { return WEBGL_DICE_CODE; }
