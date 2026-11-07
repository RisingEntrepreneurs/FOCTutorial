/* ===================== 模块 E 交互动画 ===================== */
(function(){
'use strict';
const {TAU,clamp,inset,plotBox,info,legend}=window.FOC_DRAW;
const SPECS=window.FOC_ANIM_SPECS;

/* ---------- E01 阶次频谱 ---------- */
SPECS.push({host:'anim-E01',title:'iq 频谱阶次定位器：哪些谱线随转速移动？',h:w=>w>=620?340:420,
 params:[{k:'n',label:'转速',min:30,max:1500,step:10,v:300,unit:'rpm',dp:0}],
 toggles:[{k:'off',label:'电流偏移（1×fe）',v:true},{k:'gain',label:'两相增益差（2×fe）',v:false},{k:'dt',label:'死区（6×fe）',v:true},{k:'res',label:'旋变不平衡（机械 2 阶）',v:false},{k:'cog',label:'齿槽（机械 24 阶，假设）',v:false},{k:'cl',label:'电流环振荡（固定 800 Hz）',v:false},{k:'mech',label:'机械谐振（固定 35 Hz）',v:false}],
 draw(ctx,w,h,st,C){const p=st.p,pp=4,fe=pp*p.n/60,fm=p.n/60,fmax=Math.max(200,Math.min(1200,fe*8+50),st.tog.cl?900:0);
  const lines=[];const add=(f,a,lab,col,fixed)=>{if(f<=fmax)lines.push([f,a,lab,col,fixed]);};
  if(st.tog.off)add(fe,0.8,'1×fe',C.a,0);if(st.tog.gain)add(2*fe,0.6,'2×fe',C.b,0);if(st.tog.dt)add(6*fe,0.7,'6×fe',C.c,0);
  if(st.tog.res)add(2*fm,0.5,'2×fm',C.d,0);if(st.tog.cog)add(24*fm,0.4,'24×fm',C.q,0);if(st.tog.cl)add(800,0.9,'800 Hz',C.bad,1);if(st.tog.mech)add(35,0.6,'35 Hz',C.warn,1);
  const P=plotBox(ctx,C,inset({x:0,y:0,w,h:h-40},46,22,14,30),[0,fmax],[0,1.1],{nx:6,ny:5,title:'iq 幅值谱（示意，A）',xl:'频率 Hz'});
  const jit=0.02*Math.sin(st.t*3);
  ctx.save();for(let i=1;i<=8;i++){const f=i*fe;if(f>fmax)break;ctx.strokeStyle=C.grid;ctx.setLineDash([3,3]);ctx.beginPath();ctx.moveTo(P.X(f),P.b.y);ctx.lineTo(P.X(f),P.b.y+P.b.h);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle=C.muted;ctx.font='10px system-ui';ctx.textAlign='center';ctx.fillText(i+'e',P.X(f),P.b.y+8);}ctx.restore();
  lines.forEach(([f,a,lab,col,fixed])=>{const x=P.X(f);ctx.strokeStyle=col;ctx.lineWidth=fixed?4:3;ctx.beginPath();ctx.moveTo(x,P.Y(0));ctx.lineTo(x,P.Y(a+jit));ctx.stroke();ctx.lineWidth=1;ctx.fillStyle=col;ctx.font='bold 11px system-ui';ctx.textAlign='center';ctx.fillText(lab,x,P.Y(a+jit)-4);});
  ctx.fillStyle=C.muted;ctx.font='11px system-ui';ctx.textAlign='left';ctx.fillText('灰色虚线：电频率整数倍（1e = fe）。粗线 = 与转速无关的固定频率。',8,h-12);
  info(ctx,C,['n = '+p.n+' rpm','fe = '+fe.toFixed(1)+' Hz，fm = '+fm.toFixed(2)+' Hz','电阶次 k = f/fe；机械阶次 = k × p','改变转速：阶次类谱线移动，固定频率不动'],P.b.x+P.b.w*0.5,P.b.y+P.b.h*0.4);}});
})();
