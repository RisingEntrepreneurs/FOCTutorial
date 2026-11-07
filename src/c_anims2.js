/* ===================== 模块 C 交互动画（二）C07–C13 ===================== */
(function(){
'use strict';
const {D2R,TAU,clamp,HH,split,inset,plotBox,pline,pfn,hl,vl,arrow,dline,info,legend,hr,plane}=window.FOC_DRAW;
const SPECS=window.FOC_ANIM_SPECS;
const PP=4,PSI=3.5e-3,LD=45e-6,LQ=75e-6;
const Tq=(id,iq)=>1.5*PP*(PSI*iq+(LD-LQ)*id*iq);

/* ---------- C07 弱磁 ---------- */
function bestPoint(we,Vmax,Imax){let best=[0,0,0];for(let k=0;k<=400;k++){const id=-Imax*k/400;const iqc=Math.sqrt(Math.max(0,Imax*Imax-id*id));const d=(Vmax/we)**2-(PSI+LD*id)**2;if(d<0)continue;const iq=Math.min(iqc,Math.sqrt(d)/LQ);const T=Tq(id,iq);if(T>best[0])best=[T,id,iq];}return best;}
SPECS.push({host:'anim-C07',title:'弱磁：电压极限椭圆随转速收缩，工作点沿电流圆移动',h:HH,
 params:[{k:'n',label:'转速',min:500,max:12000,step:100,v:3000,unit:'rpm',dp:0},{k:'vdc',label:'母线电压',min:8,max:16,step:0.5,v:12,unit:'V',dp:1},{k:'imax',label:'电流极限 Imax',min:20,max:90,step:1,v:60,unit:'A',dp:0}],
 draw(ctx,w,h,st,C){const p=st.p,S=split(w,h),Vmax=0.95*p.vdc/Math.sqrt(3),we=PP*p.n/60*TAU,rad=Vmax/we;
  const r=inset(S.L,34,14,10,26),sc=Math.min(r.w/170,r.h/(2*90)),X=v=>r.x+(v+150)*sc,Y=v=>r.y+r.h/2-v*sc;
  ctx.save();ctx.beginPath();ctx.rect(S.L.x,S.L.y,S.L.w,S.L.h);ctx.clip();
  ctx.strokeStyle=C.axis;ctx.beginPath();ctx.moveTo(X(-150),Y(0));ctx.lineTo(X(20),Y(0));ctx.moveTo(X(0),Y(-90));ctx.lineTo(X(0),Y(90));ctx.stroke();
  ctx.fillStyle=C.muted;ctx.font='11px system-ui';ctx.fillText('id',X(16),Y(0)-4);ctx.fillText('iq',X(0)+4,Y(86));
  ctx.strokeStyle=C.muted;ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(X(0),Y(0),p.imax*sc,0,TAU);ctx.stroke();
  const cx0=-PSI/LD,ax=rad/LD,ay=rad/LQ;ctx.strokeStyle=C.acc;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(X(cx0),Y(0),ax*sc,ay*sc,0,0,TAU);ctx.stroke();ctx.lineWidth=1;
  ctx.fillStyle=C.acc;ctx.beginPath();ctx.arc(X(cx0),Y(0),3,0,TAU);ctx.fill();ctx.fillText('−ψf/Ld',X(cx0)-20,Y(0)+14);
  const a=PSI/(2*(LQ-LD));ctx.strokeStyle=C.ok;ctx.setLineDash([5,4]);ctx.beginPath();for(let i=0;i<=90;i++){const iq=i,id=a-Math.sqrt(a*a+iq*iq);i?ctx.lineTo(X(id),Y(iq)):ctx.moveTo(X(id),Y(iq));}ctx.stroke();ctx.setLineDash([]);
  const b=bestPoint(we,Vmax,p.imax);ctx.fillStyle=C.warn;ctx.beginPath();ctx.arc(X(b[1]),Y(b[2]),5.5,0,TAU);ctx.fill();ctx.restore();
  const P=plotBox(ctx,C,inset(S.R,46,22,10,30),[0,12000],[0,1.8],{nx:4,ny:6,title:'外特性：最大转矩 vs 转速',xl:'转速 rpm'});
  pfn(ctx,P,n=>bestPoint(PP*n/60*TAU,Vmax,p.imax)[0],200,12000,90,C.acc,2);vl(ctx,P,[0,1.8],p.n,C.warn);
  let nb=0;for(let n=200;n<12000;n+=50){const bb=bestPoint(PP*n/60*TAU,Vmax,p.imax);const idm=a-Math.sqrt(a*a+bb[2]*bb[2]);if(bb[1]<idm-0.5){nb=n;break;}}
  info(ctx,C,['Vmax = '+Vmax.toFixed(2)+' V，Vmax/ωe = '+(rad*1e3).toFixed(2)+' mWb','工作点 id = '+b[1].toFixed(1)+' A，iq = '+b[2].toFixed(1)+' A',['Te,max = '+b[0].toFixed(2)+' N·m',b[0]>0.05?C.ok:C.bad],'弱磁起点（基速）≈ '+(nb||'—')+' rpm',p.imax<PSI/LD?'Ich = 77.8 A > Imax：最高转速有限':['Ich ≤ Imax：理论可持续升速',C.ok]],P.b.x+8,P.b.y+16);}});

/* ---------- C08 位置环前馈 ---------- */
SPECS.push({host:'anim-C08',title:'位置环：纯 P 反馈 vs 速度前馈',h:HH,
 params:[{k:'f',label:'位置指令频率',min:0.2,max:5,step:0.1,v:1,unit:'Hz',dp:1},{k:'kp',label:'位置环 Kp',min:2,max:60,step:1,v:15,unit:'1/s',dp:0},{k:'fs',label:'速度环带宽',min:5,max:100,step:1,v:40,unit:'Hz',dp:0},{k:'kff',label:'前馈增益',min:0,max:1.5,step:0.05,v:1,dp:2}],
 toggles:[{k:'ff',label:'启用速度前馈',v:true}],
 draw(ctx,w,h,st,C){const p=st.p,dt=1e-3,T=3,N=T/dt,A=90,ws=TAU*p.fs;let th=0,w_=0;const tx=[],rx=[],yx=[],ex=[];let emax=0;
  for(let k=0;k<N;k++){const t=k*dt,ref=A*Math.sin(TAU*p.f*t),dref=A*TAU*p.f*Math.cos(TAU*p.f*t);
    const wr=p.kp*(ref-th)+(st.tog.ff?p.kff*dref:0);w_+=(wr-w_)*(1-Math.exp(-ws*dt));th+=w_*dt;
    if(k%5===0){tx.push(t);rx.push(ref);yx.push(th);ex.push(ref-th);}if(t>1)emax=Math.max(emax,Math.abs(ref-th));}
  const S=split(w,h),fr=st.t===0?1:clamp((st.t%5)/4,0.02,1),n=Math.max(2,Math.floor(tx.length*fr));
  const P1=plotBox(ctx,C,inset(S.L,46,22,10,30),[0,T],[-120,120],{nx:3,ny:4,title:'位置（°机械）：给定（灰）实际（蓝）',xl:'时间 s'});
  pline(ctx,P1,tx,rx,C.muted,1.4,[5,4]);pline(ctx,P1,tx.slice(0,n),yx.slice(0,n),C.acc,2);
  const em=Math.max(5,Math.ceil(emax*1.3/5)*5);
  const P2=plotBox(ctx,C,inset(S.R,46,22,10,30),[0,T],[-em,em],{nx:3,ny:4,title:'跟踪误差（°）',xl:'时间 s'});pline(ctx,P2,tx.slice(0,n),ex.slice(0,n),C.bad,1.8);
  info(ctx,C,['稳态误差峰值 = '+emax.toFixed(2)+'°',st.tog.ff?(Math.abs(p.kff-1)<0.06?['前馈 ≈ 1：误差仅来自内环动态',C.ok]:['前馈增益偏离 1',C.warn]):['纯 P：误差 ≈ ω/Kp',C.warn],'理论纯 P 误差 ≈ '+(A*TAU*p.f/p.kp).toFixed(1)+'°'],P2.b.x+8,P2.b.y+16);}});

/* ---------- C09 旋变误差 ---------- */
SPECS.push({host:'anim-C09',title:'旋变 sin/cos 非理想 → 解码角度误差谐波',h:HH,
 params:[{k:'amp',label:'幅值不平衡 Δk/k',min:-10,max:10,step:0.5,v:0,unit:'%',dp:1},{k:'off',label:'sin 直流偏置',min:-5,max:5,step:0.25,v:0,unit:'%',dp:2},{k:'ph',label:'非正交 δ',min:-5,max:5,step:0.25,v:0,unit:'°',dp:2}],
 draw(ctx,w,h,st,C){const p=st.p,S=split(w,h),G=plane(ctx,C,inset(S.L,8,10,8,8),1.25,['cos','sin']);
  const sn=t=>(1+p.amp/100)*Math.sin(t)+p.off/100,cs=t=>Math.cos(t+p.ph*D2R);
  const err=t=>{let e=Math.atan2(sn(t),cs(t))-t;while(e>Math.PI)e-=TAU;while(e<-Math.PI)e+=TAU;return e/D2R;};
  ctx.save();ctx.strokeStyle=C.acc;ctx.lineWidth=1.8;ctx.beginPath();for(let i=0;i<=200;i++){const t=TAU*i/200,P=G.S(cs(t),sn(t));i?ctx.lineTo(P[0],P[1]):ctx.moveTo(P[0],P[1]);}ctx.stroke();ctx.restore();
  ctx.save();ctx.strokeStyle=C.grid;ctx.beginPath();ctx.arc(G.cx,G.cy,G.k,0,TAU);ctx.stroke();ctx.restore();
  const th=(st.t*0.8)%TAU,Pp=G.S(cs(th),sn(th));arrow(ctx,G.cx,G.cy,Pp[0],Pp[1],C.warn,2.4,'θ̂');
  let em=0;for(let i=0;i<=360;i++)em=Math.max(em,Math.abs(err(i*D2R)));const yr=Math.max(1,Math.ceil(em*1.3));
  const P=plotBox(ctx,C,inset(S.R,46,22,10,30),[0,360],[-yr,yr],{nx:6,ny:4,title:'机械角度误差 θ̂ − θ（°）vs 真实角度',xl:'θ（°，1 对极旋变）'});
  pfn(ctx,P,x=>err(x*D2R),0,360,360,C.bad,2);vl(ctx,P,[-yr,yr],th/D2R,C.warn);
  let h1=0,h2=0;for(let i=0;i<360;i++){const t=i*D2R,e=err(t);h1+=e*Math.sin(t)/180;h2+=e*Math.sin(2*t)/180;}
  info(ctx,C,['误差峰值 = '+em.toFixed(2)+'° 机械 = '+(em*4).toFixed(2)+'° 电角度',['1 次分量 ≈ '+Math.abs(h1).toFixed(2)+'°（偏置）',Math.abs(h1)>0.1?C.warn:C.fg],['2 次分量 ≈ '+Math.abs(h2).toFixed(2)+'°（幅值 / 正交）',Math.abs(h2)>0.1?C.warn:C.fg],'电角度上表现为 4×、8× 机械阶次'],P.b.x+8,P.b.y+16);}});

/* ---------- C10 PLL 收敛 ---------- */
SPECS.push({host:'anim-C10',title:'反电动势观测 + PLL：角度收敛与低速信噪比',h:HH,
 params:[{k:'n',label:'转速',min:100,max:6000,step:50,v:2000,unit:'rpm',dp:0},{k:'bw',label:'PLL 带宽 ωn',min:30,max:1500,step:10,v:250,unit:'rad/s',dp:0},{k:'noise',label:'反电动势估计噪声',min:0,max:1,step:0.02,v:0.15,unit:'V',dp:2}],
 toggles:[{k:'lag',label:'SMO 低通相位未补偿（ωc = 1.5ωe）',v:false}],
 draw(ctx,w,h,st,C){const p=st.p,dt=50e-6,N=3000,we=PP*p.n/60*TAU,E=we*PSI,Ki=p.bw*p.bw,Kp=2*p.bw,lag=st.tog.lag?Math.atan(1/1.5):0;
  let th=0,thh=30*D2R,wi=0,wh=0;const tx=[],ex=[],wx=[];let es=0,ns=0;
  for(let k=0;k<N;k++){th+=we*dt;const tr=th-lag;const eA=-E*Math.sin(tr)+p.noise*hr(k*1.3),eB=E*Math.cos(tr)+p.noise*hr(k*2.7+11);
    const mag=Math.hypot(eA,eB)+1e-6,er=(-eA*Math.cos(thh)-eB*Math.sin(thh))/mag;wi+=Ki*dt*er;wh=Kp*er+wi;thh+=wh*dt;
    let e=th-thh;e=((e+Math.PI)%TAU+TAU)%TAU-Math.PI;if(k%6===0){tx.push(k*dt*1000);ex.push(e/D2R);wx.push(wh/(PP*TAU)*60);}if(k>N*0.6){es+=e*e;ns++;}}
  const S=split(w,h),fr=st.t===0?1:clamp((st.t%4)/3,0.02,1),n=Math.max(2,Math.floor(tx.length*fr)),G=plane(ctx,C,inset(S.L,8,10,8,8),1.3,['α','β']);
  const ti=Math.floor((n-1)*6),thN=we*ti*dt,eT=G.S(-Math.sin(thN-lag),Math.cos(thN-lag));arrow(ctx,G.cx,G.cy,eT[0],eT[1],C.muted,2.2,'e');
  const thE=thN-ex[n-1]*D2R,eE=G.S(-Math.sin(thE),Math.cos(thE));arrow(ctx,G.cx,G.cy,eE[0],eE[1],C.d,2.2,'PLL');
  const P=plotBox(ctx,C,inset(S.R,46,22,10,30),[0,150],[-45,45],{nx:5,ny:6,title:'角度误差 θ − θ̂（°电角度）',xl:'时间 ms'});
  pline(ctx,P,tx.slice(0,n),ex.slice(0,n),C.bad,1.6);
  const rms=Math.sqrt(es/Math.max(1,ns))/D2R,snr=E/Math.max(1e-6,p.noise);
  info(ctx,C,['|e| = ωe·ψf = '+E.toFixed(2)+' V，SNR = '+(p.noise>0?snr.toFixed(1):'∞'),['稳态误差 RMS = '+rms.toFixed(2)+'°',rms>5?C.bad:C.ok],'PLL ωn = '+p.bw+' rad/s，ζ = 1',st.tog.lag?['⚠ 未补偿低通滞后 '+(lag/D2R).toFixed(1)+'°',C.bad]:'',snr<3?['低速信噪比不足：观测不可靠',C.bad]:''].filter(s=>s!==''),P.b.x+8,P.b.y+16);}});

/* ---------- C13 死区 ---------- */
SPECS.push({host:'anim-C13',title:'死区效应：电压误差随电流方向翻转（dq 中为 6 倍频）',h:HH,
 params:[{k:'td',label:'死区时间 Td',min:0,max:3,step:0.1,v:1,unit:'µs',dp:1},{k:'v',label:'基波相电压幅值',min:0.3,max:6.5,step:0.1,v:1,unit:'V',dp:1},{k:'phi',label:'电流滞后电压角',min:0,max:90,step:1,v:30,unit:'°',dp:0},{k:'i0',label:'补偿线性区 I0（相对峰值）',min:0.01,max:0.5,step:0.01,v:0.1,dp:2}],
 toggles:[{k:'comp',label:'启用死区补偿',v:false}],
 draw(ctx,w,h,st,C){const p=st.p,S=split(w,h),dV=p.td/50*12,fs=x=>clamp(x/p.i0,-1,1);
  const vref=t=>p.v*Math.cos(t),ia=t=>Math.cos(t-p.phi*D2R);
  const vact=t=>vref(t)-dV*Math.sign(ia(t))+(st.tog.comp?dV*fs(ia(t)):0);
  const P1=plotBox(ctx,C,inset(S.L,44,22,10,30),[0,360],[-p.v*1.6-0.3,p.v*1.6+0.3],{nx:4,ny:4,title:'A 相：给定（灰）实际平均（红）电流方向（蓝）',xl:'电角度 (°)'});
  pfn(ctx,P1,x=>vref(x*D2R),0,360,360,C.muted,1.6);pfn(ctx,P1,x=>vact(x*D2R),0,360,720,C.bad,2);pfn(ctx,P1,x=>ia(x*D2R)*p.v,0,360,360,C.acc,1.2,[4,3]);
  const ed=t=>{let ea=0,eb=0;[0,1,2].forEach(j=>{const sh=j*TAU/3,e=vact(t-sh)-vref(t-sh);ea+=2/3*e*Math.cos(sh);eb+=2/3*e*Math.sin(sh);});return -ea*Math.sin(t)+eb*Math.cos(t);};
  const P2=plotBox(ctx,C,inset(S.R,44,22,10,30),[0,360],[-dV*2-0.1,dV*2+0.1],{nx:4,ny:4,title:'dq 中 q 轴电压误差（三相合成）',xl:'电角度 (°)'});
  pfn(ctx,P2,x=>ed(x*D2R),0,360,720,C.q,2);
  let pk=0;for(let i=0;i<360;i++)pk=Math.max(pk,Math.abs(ed(i*D2R)));
  info(ctx,C,['ΔV = Td/Ts·Vdc = '+dV.toFixed(3)+' V（12 V）',['误差 / 基波 = '+(dV/p.v*100).toFixed(0)+' %',dV/p.v>0.1?C.bad:C.ok],'q 轴误差峰值 = '+pk.toFixed(3)+' V（6 倍频）',st.tog.comp?['已补偿：残差来自线性区',C.ok]:['未补偿',C.warn]],P2.b.x+8,P2.b.y+16);}});
})();
