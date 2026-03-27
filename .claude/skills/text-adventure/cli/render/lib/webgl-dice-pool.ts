// Self-contained inline WebGL renderer for mixed dice pools on one canvas.

export const WEBGL_DICE_POOL_CODE: string = `
(function(){
var canvas=document.getElementById('dice-pool-canvas');
if(!canvas)return;
var root=document.getElementById('dice-pool-target')||canvas;
var hint=document.getElementById('dice-pool-hint');
var result=document.getElementById('dice-pool-result');
var totalEl=document.getElementById('dice-pool-total');
var modEl=document.getElementById('dice-pool-modifier');
var groupsEl=document.getElementById('dice-pool-groups');
function hideHint(){if(hint)hint.classList.add('is-hidden')}
function showResult(){if(result)result.classList.add('is-visible')}
function setAria(txt){canvas.setAttribute('aria-label',txt)}

var MAX_RENDERED_DICE=typeof POOL_MAX_DICE==='number'&&POOL_MAX_DICE>0?Math.floor(POOL_MAX_DICE):24;
var MAX_CANVAS_W=900;
var MAX_CANVAS_H=1320;

function sanitisePoolGroups(raw){
  if(!Array.isArray(raw))return{groups:[],total:0,original:0,omitted:0};
  var safe=[],total=0,original=0;
  for(var i=0;i<raw.length;i++){
    var item=raw[i];
    if(!item||typeof item!=='object')continue;
    var dieType=String(item.dieType||'').trim();
    if(!POOL_CONFIG_MAP[dieType])continue;
    var count=Math.floor(Number(item.count));
    if(!isFinite(count)||count<1)continue;
    original+=count;
    var allowed=Math.min(count,Math.max(0,MAX_RENDERED_DICE-total));
    if(allowed>0){
      safe.push({dieType:dieType,count:allowed});
      total+=allowed;
    }
  }
  return{groups:safe,total:total,original:original||total,omitted:Math.max(original-total,0)};
}

var gl=canvas.getContext('webgl')||canvas.getContext('experimental-webgl');
if(!gl)return;
gl.enable(gl.DEPTH_TEST);
gl.clearColor(0,0,0,0);
gl.enable(gl.CULL_FACE);
if(canvas.width>MAX_CANVAS_W)canvas.width=MAX_CANVAS_W;
if(canvas.height>MAX_CANVAS_H)canvas.height=MAX_CANVAS_H;

function v3s(a,b){return[a[0]-b[0],a[1]-b[1],a[2]-b[2]]}
function v3x(a,b){return[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]}
function v3d(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]}
function v3n(v){var l=Math.sqrt(v[0]*v[0]+v[1]*v[1]+v[2]*v[2])||1;return[v[0]/l,v[1]/l,v[2]/l]}

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
  if(d>0.9995)return qnm([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t,a[3]+(b[3]-a[3])*t]);
  var th=Math.acos(d),s=Math.sin(th),s0=Math.sin((1-t)*th)/s,s1=Math.sin(t*th)/s;
  return[a[0]*s0+b[0]*s1,a[1]*s0+b[1]*s1,a[2]*s0+b[2]*s1,a[3]*s0+b[3]*s1];
}

function m4(){return new Float32Array(16)}
function m4i(){var m=m4();m[0]=m[5]=m[10]=m[15]=1;return m}
function m4m(a,b){var o=m4();for(var j=0;j<4;j++)for(var i=0;i<4;i++){var s=0;for(var k=0;k<4;k++)s+=a[i+k*4]*b[k+j*4];o[i+j*4]=s}return o}
function m4p(fov,asp,near,far){var o=m4(),f=1/Math.tan(fov*0.5),nf=1/(near-far);o[0]=f/asp;o[5]=f;o[10]=(far+near)*nf;o[11]=-1;o[14]=2*far*near*nf;return o}
function m4q(q){
  var o=m4(),x=q[0],y=q[1],z=q[2],w=q[3],x2=x+x,y2=y+y,z2=z+z;
  var xx=x*x2,yx=y*x2,yy=y*y2,zx=z*x2,zy=z*y2,zz=z*z2,wx=w*x2,wy=w*y2,wz=w*z2;
  o[0]=1-yy-zz;o[1]=yx+wz;o[2]=zx-wy;o[4]=yx-wz;o[5]=1-xx-zz;o[6]=zy+wx;
  o[8]=zx+wy;o[9]=zy-wx;o[10]=1-xx-yy;o[15]=1;return o;
}
function m4s(s){var o=m4i();o[0]=o[5]=o[10]=s;return o}
function m4tr(v){var o=m4i();o[12]=v[0];o[13]=v[1];o[14]=v[2]||0;return o}

var VS='attribute vec3 aP,aN;attribute vec2 aU;uniform mat4 uMVP,uM;varying vec3 vN;varying vec2 vU;void main(){gl_Position=uMVP*vec4(aP,1);vN=mat3(uM)*aN;vU=aU;}';
var FS='precision mediump float;varying vec3 vN;varying vec2 vU;uniform sampler2D uT;uniform vec3 uL;void main(){vec3 n=normalize(vN);float d=max(dot(n,uL),0.0);gl_FragColor=vec4(texture2D(uT,vU).rgb*(vec3(0.3)+0.9*d),1.0);}';
function mkSh(src,type){var s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){console.error(gl.getShaderInfoLog(s));return null}return s}
var prog=gl.createProgram(),vsh=mkSh(VS,gl.VERTEX_SHADER),fsh=mkSh(FS,gl.FRAGMENT_SHADER);
if(!vsh||!fsh)return;
gl.attachShader(prog,vsh);gl.attachShader(prog,fsh);gl.linkProgram(prog);
if(!gl.getProgramParameter(prog,gl.LINK_STATUS))return;
gl.useProgram(prog);
var uMVP=gl.getUniformLocation(prog,'uMVP'),uM=gl.getUniformLocation(prog,'uM');
gl.uniform3f(gl.getUniformLocation(prog,'uL'),0.485,0.728,0.485);
gl.uniform1i(gl.getUniformLocation(prog,'uT'),0);

function buildMesh(verts,faces,faceCount,tpf){
  var pos=[],nrm=[],uv=[],fNorms=[],cols=Math.ceil(Math.sqrt(faceCount)),rows=Math.ceil(faceCount/cols);
  for(var fi=0;fi<faceCount;fi++){
    var col=fi%cols,row=Math.floor(fi/cols),cu0=col/cols,cu1=(col+1)/cols,cv0=1-(row+1)/rows,cv1=1-row/rows;
    var allV=[],fn=null;
    for(var t=0;t<tpf;t++){var tri=faces[fi*tpf+t],a=verts[tri[0]],b=verts[tri[1]],c=verts[tri[2]];allV.push(a,b,c);if(t===0)fn=v3n(v3x(v3s(b,a),v3s(c,a)))}
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
        pos.push(v[0],v[1],v[2]);nrm.push(fn[0],fn[1],fn[2]);
        uv.push(cu0+(0.05+0.9*(us[idx]-umin)/ur)*(cu1-cu0),cv0+(0.05+0.9*(vs[idx]-vmin)/vr)*(cv1-cv0));
      }
    }
  }
  return{pos:new Float32Array(pos),nrm:new Float32Array(nrm),uv:new Float32Array(uv),count:pos.length/3,fNorms:fNorms};
}

function createAtlas(faceCount,range,fontScale,fg,bg,labelFn,mirror,offY){
  var cols=Math.ceil(Math.sqrt(faceCount)),rows=Math.ceil(faceCount/cols),cw=128,ch=128;
  var atlas=document.createElement('canvas');atlas.width=cols*cw;atlas.height=rows*ch;
  var ctx=atlas.getContext('2d');if(!ctx)return atlas;
  ctx.fillStyle=bg;ctx.fillRect(0,0,atlas.width,atlas.height);
  ctx.fillStyle=fg;ctx.textAlign='center';ctx.textBaseline='middle';
  var fs=Math.round(cw*fontScale);ctx.font='bold '+fs+'px sans-serif';
  for(var i=0;i<faceCount;i++){
    var cx=(i%cols)*cw+cw/2,cy=Math.floor(i/cols)*ch+ch/2,lbl=labelFn?labelFn(i):String(range[0]+i);
    ctx.save();ctx.translate(cx,cy);if(mirror)ctx.scale(-1,-1);ctx.fillText(lbl,0,offY);
    if(lbl==='6'||lbl==='9'){var tw=ctx.measureText(lbl).width;ctx.fillRect(-tw/2,(mirror?offY:0)+Math.round(fs*0.55),tw,2)}
    ctx.restore();
  }
  return atlas;
}

function mkBuf(data,attr,size){var b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);var loc=gl.getAttribLocation(prog,attr);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,size,gl.FLOAT,false,0,0);return b}
function bindBuf(buf,attr,size){gl.bindBuffer(gl.ARRAY_BUFFER,buf);var loc=gl.getAttribLocation(prog,attr);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,size,gl.FLOAT,false,0,0)}
function mkTex(img,flipY){var t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,!!flipY);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);return t}

function eOB(t){var c=1.70158;return 1+(c+1)*Math.pow(t-1,3)+c*Math.pow(t-1,2)}
function randQ(){return qnm([Math.random()-0.5,Math.random()-0.5,Math.random()-0.5,Math.random()])}
function idleQ(a){return qnm([Math.sin(a)*0.28,Math.cos(a)*0.35,Math.sin(a*0.63)*0.22,1])}
function coinQ(a){var tilt=0.22,s=Math.sqrt(1-tilt*tilt);return qnm([tilt,Math.sin(a)*s,0,Math.cos(a)*s])}
function lerpQ(start,target,eq,frame,total,spinEnd){
  if(frame<spinEnd){var t=frame/spinEnd,e=1-Math.pow(1-t,2);return qsl(start,target,e)}
  if(!eq.v)eq.v=qsl(start,target,1-Math.pow(0.25,2));
  var st=(frame-spinEnd)/(total-spinEnd),eb=Math.min(eOB(Math.min(st,1)),1);
  return qsl(eq.v,target,eb);
}

var poolSafety=sanitisePoolGroups(POOL_GROUPS);
var poolGroups=poolSafety.groups;
var totalDice=poolSafety.total;
var originalDice=poolSafety.original;
var omittedDice=poolSafety.omitted;
if(!totalDice)return;
if(omittedDice>0&&hint)hint.textContent='CLICK THE POOL TO ROLL ('+totalDice+' OF '+originalDice+' DICE SHOWN)';

function poolLayout(total){
  var cols=total<=2?total:Math.min(4,Math.ceil(Math.sqrt(total))),rows=Math.ceil(total/Math.max(cols,1));
  var scale=total<=2?0.95:total<=4?0.82:total<=8?0.66:0.56;
  var xStep=total<=2?2.8:total<=4?2.45:total<=8?2.2:2.0;
  var yStep=rows<=1?0:(total<=4?2.5:total<=8?2.15:1.9);
  var viewOff=total<=2?4.8:total<=4?5.8:total<=8?7.0:8.2;
  return{cols:cols,rows:rows,scale:scale,xStep:xStep,yStep:yStep,viewOff:viewOff};
}
var layout=poolLayout(totalDice),projM=m4p(50*Math.PI/180,canvas.width/canvas.height,0.1,100),viewOff=layout.viewOff;
function slotOffset(index){
  var col=index%layout.cols,row=Math.floor(index/layout.cols);
  return[(col-(layout.cols-1)/2)*layout.xStep,((layout.rows-1)/2-row)*layout.yStep,0];
}
function drawModel(q,offset,scale){
  var model=m4m(m4tr(offset),m4m(m4q(q),m4s(scale)));
  var view=m4i();view[14]=-viewOff;
  gl.uniformMatrix4fv(uMVP,false,m4m(projM,m4m(view,model)));
  gl.uniformMatrix4fv(uM,false,model);
}

var cs=getComputedStyle(document.documentElement),reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var dieBg=cs.getPropertyValue('--ta-die-bg').trim()||'#2a2a3a';
var dieTx=cs.getPropertyValue('--ta-die-text-color').trim()||'#e8e8f0';

var ASSETS={};
function createCoinAsset(){
  var cv=[],cf=[],N=16;
  cv.push([0,0.08,0]);cv.push([0,-0.08,0]);
  for(var i=0;i<N;i++){var a=i*2*Math.PI/N;cv.push([0.8*Math.cos(a),0.08,0.8*Math.sin(a)])}
  for(var i=0;i<N;i++){var a=i*2*Math.PI/N;cv.push([0.8*Math.cos(a),-0.08,0.8*Math.sin(a)])}
  for(var i=0;i<N;i++)cf.push([0,2+(i+1)%N,2+i]);
  for(var i=0;i<N;i++)cf.push([1,2+N+i,2+N+(i+1)%N]);
  var mesh=buildMesh(cv,cf,2,N),bp=mkBuf(mesh.pos,'aP',3),bn=mkBuf(mesh.nrm,'aN',3),bu=mkBuf(mesh.uv,'aU',2),tx=mkTex(createAtlas(2,[1,2],0.5,dieTx,dieBg,function(i){return i===0?'H':'T'},false,0),true);
  return{
    roll:function(){return Math.random()<0.5?1:2},
    target:function(roll){return qAl(roll===1?[0,1,0]:[0,-1,0],[0,0,1])},
    draw:function(q,offset,scale){bindBuf(bp,'aP',3);bindBuf(bn,'aN',3);bindBuf(bu,'aU',2);gl.bindTexture(gl.TEXTURE_2D,tx);drawModel(q,offset,scale);gl.drawArrays(gl.TRIANGLES,0,mesh.count)}
  };
}
function createStandardAsset(dieType){
  var cfg=POOL_CONFIG_MAP[dieType],mesh=buildMesh(cfg.customVertices,cfg.customFaces,cfg.faceCount,cfg.trianglesPerFace);
  var mirror=(cfg.trianglesPerFace===1||cfg.trianglesPerFace===3),offY=cfg.trianglesPerFace===1?-Math.round(0.15*128):0;
  var labelFn=cfg.assign?function(i){return String(cfg.assign[i])}:null;
  var atlas=createAtlas(cfg.faceCount,cfg.numberRange,POOL_FONT_MAP[dieType],dieTx,dieBg,labelFn,mirror,offY);
  var bp=mkBuf(mesh.pos,'aP',3),bn=mkBuf(mesh.nrm,'aN',3),bu=mkBuf(mesh.uv,'aU',2),tx=mkTex(atlas,true);
  return{
    range:cfg.numberRange,
    assign:cfg.assign||null,
    fNorms:mesh.fNorms,
    count:mesh.count,
    roll:function(){var r=cfg.numberRange;return Math.floor(Math.random()*(r[1]-r[0]+1))+r[0]},
    target:function(roll){
      var idx=0,r=cfg.numberRange;
      if(cfg.assign){for(var i=0;i<cfg.assign.length;i++){if(cfg.assign[i]===roll){idx=i;break}}}
      else{idx=roll-r[0];if(idx<0||idx>=mesh.fNorms.length)idx=0}
      return qAl(mesh.fNorms[idx],[0,0,1]);
    },
    draw:function(q,offset,scale){bindBuf(bp,'aP',3);bindBuf(bn,'aN',3);bindBuf(bu,'aU',2);gl.bindTexture(gl.TEXTURE_2D,tx);drawModel(q,offset,scale);gl.drawArrays(gl.TRIANGLES,0,mesh.count)}
  };
}
function createD100Asset(){
  var cfg=POOL_CONFIG_MAP.d100,m1=buildMesh(cfg.customVertices,cfg.customFaces,10,2),m2=buildMesh(cfg.customVertices,cfg.customFaces,10,2);
  var bp1=mkBuf(m1.pos,'aP',3),bn1=mkBuf(m1.nrm,'aN',3),bu1=mkBuf(m1.uv,'aU',2),t1=mkTex(createAtlas(10,[0,9],POOL_FONT_MAP.d100,dieTx,dieBg,function(i){return String(i*10).padStart(2,'0')},false,0),true);
  var bp2=mkBuf(m2.pos,'aP',3),bn2=mkBuf(m2.nrm,'aN',3),bu2=mkBuf(m2.uv,'aU',2),t2=mkTex(createAtlas(10,[0,9],POOL_FONT_MAP.d100,dieTx,dieBg,null,false,0),true);
  function bind1(){bindBuf(bp1,'aP',3);bindBuf(bn1,'aN',3);bindBuf(bu1,'aU',2);gl.bindTexture(gl.TEXTURE_2D,t1)}
  function bind2(){bindBuf(bp2,'aP',3);bindBuf(bn2,'aN',3);bindBuf(bu2,'aU',2);gl.bindTexture(gl.TEXTURE_2D,t2)}
  return{
    roll:function(){return Math.floor(Math.random()*100)+1},
    target:function(roll){var tens=Math.floor((roll%100)/10),units=roll%10;return{q1:qAl(m1.fNorms[tens],[0,0,1]),q2:qAl(m2.fNorms[units],[0,0,1])}},
    draw:function(q1,q2,offset,scale){
      var pairScale=scale*0.72,gap=0.86*scale;
      bind1();drawModel(q1,[offset[0]-gap,offset[1],0],pairScale);gl.drawArrays(gl.TRIANGLES,0,m1.count);
      bind2();drawModel(q2,[offset[0]+gap,offset[1],0],pairScale);gl.drawArrays(gl.TRIANGLES,0,m2.count);
    }
  };
}
function getAsset(dieType){
  if(!ASSETS[dieType])ASSETS[dieType]=dieType==='d2'?createCoinAsset():dieType==='d100'?createD100Asset():createStandardAsset(dieType);
  return ASSETS[dieType];
}

function formatRoll(dieType,roll){return dieType==='d2'?(roll===1?'H':'T'):String(roll)}
function renderResults(groups,subtotal){
  var total=subtotal+POOL_MODIFIER;
  if(totalEl)totalEl.textContent=String(total);
  var subtotalLabel=omittedDice>0?'Displayed subtotal ':'Subtotal ';
  var suffix=omittedDice>0?' ('+totalDice+' of '+originalDice+' dice shown)':'';
  if(modEl)modEl.textContent=POOL_MODIFIER?subtotalLabel+subtotal+' '+(POOL_MODIFIER>=0?'+ ':'- ')+Math.abs(POOL_MODIFIER)+' = '+total+suffix:subtotalLabel+subtotal+suffix;
  if(groupsEl){
    groupsEl.innerHTML='';
    for(var i=0;i<groups.length;i++){
      var group=groups[i],row=document.createElement('div'),label=document.createElement('div'),values=document.createElement('div');
      row.className='dice-pool-group';label.className='dice-pool-group-label';values.className='dice-pool-group-values';
      var shown=[],groupTotal=0;
      for(var j=0;j<group.rolls.length;j++){shown.push(formatRoll(group.dieType,group.rolls[j]));groupTotal+=group.rolls[j]}
      label.textContent=group.count+group.dieType;
      values.textContent=shown.join(', ')+(group.rolls.length>1?' = '+groupTotal:'');
      row.appendChild(label);row.appendChild(values);groupsEl.appendChild(row);
    }
    if(omittedDice>0){
      var noteRow=document.createElement('div'),noteLabel=document.createElement('div'),noteValue=document.createElement('div');
      noteRow.className='dice-pool-group';noteLabel.className='dice-pool-group-label';noteValue.className='dice-pool-group-values';
      noteLabel.textContent='notice';
      noteValue.textContent=omittedDice+' dice omitted to keep the pool render stable.';
      noteRow.appendChild(noteLabel);noteRow.appendChild(noteValue);groupsEl.appendChild(noteRow);
    }
  }
  showResult();
  setAria(POOL_LABEL+' — total '+total+(omittedDice>0?', '+omittedDice+' dice omitted':''));
}

var dice=[],index=0;
for(var gi=0;gi<poolGroups.length;gi++){
  var group=poolGroups[gi],asset=getAsset(group.dieType);
  for(var k=0;k<group.count;k++){
    if(group.dieType==='d100')dice.push({index:index++,groupIndex:gi,dieType:group.dieType,asset:asset,q1:randQ(),q2:randQ(),sq1:null,sq2:null,tq1:null,tq2:null,eq1:null,eq2:null,roll:0});
    else dice.push({index:index++,groupIndex:gi,dieType:group.dieType,asset:asset,q:randQ(),sq:null,tq:null,eq:null,roll:0});
  }
}

function drawDie(die){
  var offset=slotOffset(die.index);
  if(die.dieType==='d100')die.asset.draw(die.q1,die.q2,offset,layout.scale);
  else die.asset.draw(die.q,offset,layout.scale);
}
function renderAll(){
  gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  for(var i=0;i<dice.length;i++)drawDie(dice[i]);
}

var locked=false,iR=null,ia=0;
function idle(){
  if(locked)return;
  ia+=0.004;
  for(var i=0;i<dice.length;i++){
    var die=dice[i],phase=ia+i*0.43;
    if(die.dieType==='d100'){die.q1=idleQ(phase);die.q2=idleQ(phase+Math.PI/3)}
    else if(die.dieType==='d2')die.q=coinQ(phase*3);
    else die.q=idleQ(phase);
  }
  renderAll();
  iR=requestAnimationFrame(idle);
}
renderAll();
if(!reduced)idle();

root.style.cursor='pointer';
root.addEventListener('click',function(){
  if(locked)return;
  locked=true;
  root.style.cursor='default';
  hideHint();
  if(iR){cancelAnimationFrame(iR);iR=null}

  var groups=[],subtotal=0;
  for(var gi=0;gi<poolGroups.length;gi++)groups.push({dieType:poolGroups[gi].dieType,count:poolGroups[gi].count,rolls:[]});
  for(var i=0;i<dice.length;i++){
    var die=dice[i],roll=die.asset.roll();
    die.roll=roll;groups[die.groupIndex].rolls.push(roll);subtotal+=roll;
    if(die.dieType==='d100'){
      var target=die.asset.target(roll);
      die.sq1=die.q1;die.sq2=die.q2;die.tq1=target.q1;die.tq2=target.q2;die.eq1={v:null};die.eq2={v:null};
      if(reduced){die.q1=die.tq1;die.q2=die.tq2}
    }else{
      die.sq=die.q;die.tq=die.asset.target(roll);die.eq={v:null};
      if(reduced)die.q=die.tq;
    }
  }
  if(reduced){renderAll();renderResults(groups,subtotal);return}

  var dur=parseFloat(cs.getPropertyValue('--ta-die-spin-duration'))||0.8,total=Math.round(dur*60),spinEnd=Math.round(total*0.75),frame=0;
  (function step(){
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    for(var i=0;i<dice.length;i++){
      var die=dice[i];
      if(die.dieType==='d100'){
        die.q1=lerpQ(die.sq1,die.tq1,die.eq1,frame,total,spinEnd);
        die.q2=lerpQ(die.sq2,die.tq2,die.eq2,frame,total,spinEnd);
      }else{
        die.q=lerpQ(die.sq,die.tq,die.eq,frame,total,spinEnd);
      }
      drawDie(die);
    }
    frame++;if(frame<=total)requestAnimationFrame(step);else renderResults(groups,subtotal);
  })();
});
})();`.trim();

export function generateWebGLDicePoolCode(): string { return WEBGL_DICE_POOL_CODE; }
