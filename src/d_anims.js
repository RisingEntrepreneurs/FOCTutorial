/* ===================== 模块 D 交互动画 ===================== */
(function(){
'use strict';
const {D2R,TAU,clamp,HH,split,inset,plotBox,pline,pfn,hl,vl,arrow,dline,info,legend,hr}=window.FOC_DRAW;
const SPECS=window.FOC_ANIM_SPECS;
/* 复数小工具 */
const cx=(r,i)=>({r,i}),cadd=(a,b)=>cx(a.r+b.r,a.i+b.i),cmul=(a,b)=>cx(a.r*b.r-a.i*b.i,a.r*b.i+a.i*b.r),cdiv=(a,b)=>{const d=b.r*b.r+b.i*b.i;return cx((a.r*b.r+a.i*b.i)/d,(a.i*b.r-a.r*b.i)/d);},cabs=a=>Math.hypot(a.r,a.i),cexp=t=>cx(Math.cos(t),Math.sin(t));

/* ---------- D01 离散化 ---------- */
SPECS.push({host:'anim-D01',title:'一阶低通的三种离散化：前向 / 后向欧拉 / Tustin',h:HH,
 params:[{k:'r',label:'fc / fs',min:0.01,max:0.4,step:0.005,v:0.05,dp:3}],
 draw(ctx,w,h,st,C){const p=st.p,S=split(w,h),Ts=1,tau=1/(TAU*p.r),N=Math.min(400,Math.ceil(8*tau/Ts)+5);
  const run=(m)=>{let y=0,xp=0;const ys=[0];for(let k=1;k<=N;k++){const x=1;if(m===0)y=y+(Ts/tau)*(xp-y);else if(m===1)y=y+Ts/(tau+Ts)*(x-y);else y=((2*tau-Ts)*y+Ts*(x+xp))/(2*tau+Ts);xp=x;ys.push(y);}return ys;};
  const xs=[...Array(N+1).keys()],ym=[run(0),run(1),run(2)];let mx=1.2,mn=-0.2;ym[0].forEach(v=>{if(isFinite(v)){mx=Math.max(mx,Math.min(v,3));mn=Math.min(mn,Math.max(v,-2));}});
  const P1=plotBox(ctx,C,inset(S.L,40,22,10,30),[0,N],[mn,mx],{nx:4,ny:4,title:'阶跃响应（横轴：采样序号）',xl:'k'});
  pfn(ctx,P1,k=>1-Math.exp(-k*Ts/tau),0,N,200,C.muted,1.6,[5,4]);
  [[0,C.bad],[1,C.acc],[2,C.ok]].forEach(([m,c])=>pline(ctx,P1,xs,ym[m].map(v=>clamp(v,-5,5)),c,1.8));
  legend(ctx,C,[['连续',C.muted],['前向',C.bad],['后向',C.acc],['Tustin',C.ok]],P1.b.x+6,P1.b.y+P1.b.h-6);
  const Hc=f=>1/Math.hypot(1,f/p.r);
  const Hd=(m,f)=>{const z=cexp(TAU*f*Ts),zi=cdiv(cx(1,0),z);let H;if(m===0){H=cdiv(cx(Ts/tau,0),cadd(z,cx(-(1-Ts/tau),0)));}else if(m===1){const a=Ts/(tau+Ts);H=cdiv(cx(a,0),cadd(cx(1,0),cmul(cx(-(1-a),0),zi)));}else{const b=Ts/(2*tau+Ts),a=(2*tau-Ts)/(2*tau+Ts);H=cdiv(cmul(cx(b,0),cadd(cx(1,0),zi)),cadd(cx(1,0),cmul(cx(-a,0),zi)));}return cabs(H);};
  const P2=plotBox(ctx,C,inset(S.R,40,22,10,30),[0.005,0.5],[-20,10],{nx:5,ny:6,title:'离散幅频 − 连续幅频（dB），横轴 f/fs',xl:'f / fs（0.5 = 奈奎斯特）'});
  [[0,C.bad],[1,C.acc],[2,C.ok]].forEach(([m,c])=>pfn(ctx,P2,f=>20*Math.log10(Hd(m,f)/Hc(f)),0.005,0.5,200,c,1.8));vl(ctx,P2,[-20,10],p.r,C.warn);
  const unstable=Ts/tau>2;
  info(ctx,C,['Ts/τ = '+(Ts/tau).toFixed(3),unstable?['⚠ 前向欧拉：|1 − Ts/τ| > 1 → 发散',C.bad]:(Ts/tau>1?['前向欧拉：振荡衰减',C.warn]:['前向欧拉稳定',C.ok]),'在 fc 处误差：后向 '+(20*Math.log10(Hd(1,p.r)/Hc(p.r))).toFixed(2)+' dB，Tustin '+(20*Math.log10(Hd(2,p.r)/Hc(p.r))).toFixed(2)+' dB'],P2.b.x+8,P2.b.y+16);}});

/* ---------- D02 定点溢出 ---------- */
SPECS.push({host:'anim-D02',title:'定点表示：回绕 vs 饱和、小数位与量化误差',h:HH,
 params:[{k:'A',label:'信号幅值（pu）',min:0.1,max:1.5,step:0.01,v:0.8,dp:2},{k:'K',label:'后续增益 K',min:0.5,max:2,step:0.01,v:1.0,dp:2},{k:'n',label:'小数位 n（Q(15−n).n）',min:4,max:15,step:1,v:15,dp:0}],
 draw(ctx,w,h,st,C){const p=st.p,S=split(w,h),n=p.n,m=15-n,lsb=Math.pow(2,-n),hi=Math.pow(2,m)-lsb,lo=-Math.pow(2,m);
  const q=v=>Math.round(v/lsb)*lsb;const wrap=v=>{let r=Math.round(v/lsb);r=((r+32768)%65536+65536)%65536-32768;return r*lsb;};const sat=v=>clamp(q(v),lo,hi);
  const x=t=>p.A*Math.sin(TAU*t+st.t);const yr=Math.max(1.6,p.A*p.K*1.2,hi*1.1);
  const P1=plotBox(ctx,C,inset(S.L,44,22,10,30),[0,1],[-yr,yr],{nx:4,ny:4,title:'K·x：理想（灰）回绕（红）饱和（蓝）',xl:'周期'});
  hl(ctx,P1,[0,1],hi,C.warn);hl(ctx,P1,[0,1],lo,C.warn);
  pfn(ctx,P1,t=>p.K*x(t),0,1,300,C.muted,1.4,[5,4]);pfn(ctx,P1,t=>wrap(p.K*q(x(t))),0,1,600,C.bad,1.6);pfn(ctx,P1,t=>sat(p.K*q(x(t))),0,1,600,C.acc,2);
  const P2=plotBox(ctx,C,inset(S.R,44,22,10,30),[0,1],[-lsb*0.8,lsb*0.8],{nx:4,ny:4,title:'量化误差 q(x) − x（±0.5 LSB）',xl:'周期',yf:v=>v.toExponential(1)});
  pfn(ctx,P2,t=>q(x(t))-x(t),0,1,600,C.d,1.4);
  const ov=p.A*p.K>hi;
  info(ctx,C,['格式 Q'+m+'.'+n+'：范围 ['+lo+', '+hi.toFixed(4)+']','LSB = '+lsb.toExponential(2),ov?['⚠ 超范围：回绕产生符号翻转',C.bad]:['未溢出',C.ok],ov?['饱和：只削顶，方向不变',C.acc]:''].filter(s=>s!==''),P2.b.x+8,P2.b.y+16);}});

/* ---------- D03 中断时间轴 ---------- */
SPECS.push({host:'anim-D03',title:'中断与任务时间轴：抢占、负载与关中断延迟',h:w=>w>=620?300:360,
 params:[{k:'cf',label:'FOC 主中断执行时间',min:5,max:45,step:1,v:20,unit:'µs',dp:0},{k:'c1',label:'1 ms 任务执行时间',min:50,max:700,step:10,v:150,unit:'µs',dp:0},{k:'cs',label:'1 ms 任务内关中断时长',min:0,max:60,step:1,v:0,unit:'µs',dp:0}],
 draw(ctx,w,h,st,C){const p=st.p,T=2000,L=70,R=w-12,X=t=>L+t/T*(R-L);const rows=[['FOC 50µs',40],['1 ms 任务',100],['后台/XCP',160]];
  ctx.font='11px system-ui';rows.forEach(([n,y])=>{ctx.fillStyle=C.muted;ctx.textAlign='left';ctx.fillText(n,4,y+14);ctx.strokeStyle=C.grid;ctx.strokeRect(L,y,R-L,22);});
  for(let t=0;t<=T;t+=500){ctx.fillStyle=C.muted;ctx.textAlign='center';ctx.fillText(t+' µs',X(t),210);}
  /* 简单离散事件模拟，步长 1 µs */
  let fPend=[],fRem=0,fStart=0,tRem=0,tStart=-1,crit=0,late=0,maxLate=0,busyF=0,busyT=0;const segF=[],segT=[],segB=[];let curB=null;
  for(let t=0;t<T;t++){
    if(t%50===0)fPend.push(t);
    if(t%1000===0){tRem=p.c1;}
    let run='b';
    if(fRem===0&&fPend.length&&crit===0){const rel=fPend.shift();const d=t-rel;if(d>0){late++;maxLate=Math.max(maxLate,d);}fRem=p.cf;fStart=t;segF.push([t,t+p.cf,d>0]);}
    if(fRem>0){fRem--;run='f';busyF++;}
    else if(tRem>0){const done=p.c1-tRem;if(p.cs>0&&done>=p.c1*0.4&&done<p.c1*0.4+p.cs)crit=1;else crit=0;tRem--;run='t';busyT++;if(tRem===0)crit=0;}
    else crit=0;
    if(run==='t'){if(!segT.length||segT[segT.length-1][1]!==t)segT.push([t,t+1,crit]);else{segT[segT.length-1][1]=t+1;if(crit)segT[segT.length-1][2]=1;}}
    if(run==='b'){if(!segB.length||segB[segB.length-1][1]!==t)segB.push([t,t+1]);else segB[segB.length-1][1]=t+1;}}
  segF.forEach(([a,b,l])=>{ctx.fillStyle=l?C.bad:C.acc;ctx.fillRect(X(a),42,Math.max(1,X(b)-X(a)),18);});
  segT.forEach(([a,b,c])=>{ctx.fillStyle=c?C.warn:C.ok;ctx.fillRect(X(a),102,Math.max(1,X(b)-X(a)),18);});
  segB.forEach(([a,b])=>{ctx.fillStyle=C.muted;ctx.globalAlpha=0.35;ctx.fillRect(X(a),162,Math.max(1,X(b)-X(a)),18);ctx.globalAlpha=1;});
  const U=(busyF+busyT)/T*100;
  info(ctx,C,['FOC 负载 '+(p.cf/50*100).toFixed(0)+'%，总负载 ≈ '+U.toFixed(0)+'%',late?['⚠ 主中断被推迟 '+late+' 次，最大 '+maxLate+' µs',C.bad]:['主中断准时',C.ok],p.cf>=50?['⚠ 主中断执行时间 ≥ 周期：超载',C.bad]:'橙色 = 1 ms 任务关中断区'],X(1050),h>300?240:236);}});

/* ---------- D06 I/F 启动 ---------- */
SPECS.push({host:'anim-D06',title:'I/F 启动：开环角度、负载角 γ 与失步',h:HH,
 params:[{k:'I',label:'I/F 电流幅值',min:2,max:40,step:1,v:20,unit:'A',dp:0},{k:'acc',label:'电频率加速度',min:5,max:400,step:5,v:50,unit:'Hz/s',dp:0},{k:'TL',label:'负载转矩',min:0,max:0.8,step:0.01,v:0.1,unit:'N·m',dp:2}],
 draw(ctx,w,h,st,C){const p=st.p,J=2e-5,B=1.5e-3,pp=4,Kt=0.021,dt=5e-5,Tend=1.2,N=Tend/dt,fmax=40;
  /* 对齐后起动：转子 d 轴与电流矢量重合（γ = 0）；γ = 电流矢量与转子 d 轴夹角，Te = Kt·I·sin γ */
  let th=0,thr=0,wm=0;const tx=[],fx=[],wx=[],dx=[];let slip=-1;
  for(let k=0;k<N;k++){const t=k*dt,f=Math.min(fmax,p.acc*t);th+=TAU*f*dt;const g=th-thr;const Tm=Kt*p.I*Math.sin(g);
    const TL=Math.abs(wm)>0.5?p.TL*Math.sign(wm):clamp(Tm,-p.TL,p.TL);wm+=(Tm-TL-B*wm)/J*dt;thr+=pp*wm*dt;
    if(slip<0&&g>Math.PI/2+0.2)slip=t;
    if(k%40===0){tx.push(t);fx.push(f*60/pp);wx.push(wm*60/TAU);dx.push(clamp(g/D2R,-180,400));}}
  const S=split(w,h),fr=st.t===0?1:clamp((st.t%5)/4,0.02,1),n=Math.max(2,Math.floor(tx.length*fr));
  const P1=plotBox(ctx,C,inset(S.L,46,22,10,30),[0,Tend],[-200,800],{nx:4,ny:5,title:'转速 rpm：开环给定（灰）转子（蓝）',xl:'时间 s'});
  pline(ctx,P1,tx.slice(0,n),fx.slice(0,n),C.muted,1.6,[5,4]);pline(ctx,P1,tx.slice(0,n),wx.slice(0,n),C.acc,2);
  const P2=plotBox(ctx,C,inset(S.R,46,22,10,30),[0,Tend],[-180,400],{nx:4,ny:4,title:'负载角 γ（电流矢量与转子 d 轴夹角，°电角度）',xl:'时间 s'});
  hl(ctx,P2,[0,Tend],90,C.bad);pline(ctx,P2,tx.slice(0,n),dx.slice(0,n),C.d,2);
  const need=p.TL+J*TAU*p.acc/pp,cap=Kt*p.I;
  info(ctx,C,['最大电磁转矩 Kt·|I| = '+cap.toFixed(3)+' N·m','需要：负载 + 摩擦 + J·α ≈ '+(need+B*TAU*fmax/pp).toFixed(3)+' N·m',slip>=0?['⚠ 失步于 t = '+slip.toFixed(2)+' s',C.bad]:['跟随成功，γ < 90°',C.ok]],P2.b.x+8,P2.b.y+16);}});

/* ---------- D07 扫频 ---------- */
SPECS.push({host:'anim-D07',title:'扫频注入测电流环闭环频响（含 1 拍延迟的离散模型）',h:HH,
 params:[{k:'lr',label:'真实 Lq / 标定 L̂',min:0.4,max:1.6,step:0.05,v:1.0,dp:2},{k:'ks',label:'Kp 缩放',min:0.3,max:2.5,step:0.05,v:1.0,dp:2}],
 draw(ctx,w,h,st,C){const p=st.p,Ts=50e-6,R=0.012,Lh=75e-6,wc=TAU*1000;
  const T=(f,L,kp,ki)=>{const a=Math.exp(-R*Ts/L),b=(1-a)/R,z=cexp(TAU*f*Ts),zi=cdiv(cx(1,0),z);
    const P=cdiv(cmul(cx(b,0),zi),cadd(cx(1,0),cmul(cx(-a,0),zi)));const Cc=cadd(cx(kp,0),cdiv(cx(ki*Ts,0),cadd(cx(1,0),cmul(cx(-1,0),zi))));
    const G=cmul(cmul(Cc,P),zi);return cdiv(G,cadd(cx(1,0),G));};
  const kp=wc*Lh*p.ks,ki=wc*R*p.ks;
  const P=plotBox(ctx,C,inset({x:0,y:0,w,h},50,22,14,30),[1.5,4],[-20,10],{nx:5,ny:6,title:'闭环幅频 |iq/iqRef|（dB）：设计（虚线）与「实测」（点）',xl:'频率 Hz（对数，30 Hz ~ 10 kHz）',xf:v=>{const f=Math.pow(10,v);return f>=1000?(f/1000).toFixed(f>=10000?0:1)+'k':f.toFixed(0);}});
  pfn(ctx,P,lg=>20*Math.log10(cabs(T(Math.pow(10,lg),Lh,wc*Lh,wc*R))),1.5,4,200,C.muted,1.6,[5,4]);hl(ctx,P,[1.5,4],-3,C.warn);
  const nPts=st.t===0?30:Math.min(30,1+Math.floor(st.t*6)%31);let bw=null,pk=-99;
  for(let i=0;i<30;i++){const lg=1.5+2.5*i/29,f=Math.pow(10,lg),m=20*Math.log10(cabs(T(f,Lh*p.lr,kp,ki)));pk=Math.max(pk,m);if(bw===null&&m<-3)bw=f;
    if(i<nPts){ctx.fillStyle=C.bad;ctx.beginPath();ctx.arc(P.X(lg),P.Y(clamp(m,-20,10)),3.5,0,TAU);ctx.fill();}}
  const Lz=(f,L)=>{const a=Math.exp(-R*Ts/L),b=(1-a)/R,z=cexp(TAU*f*Ts),zi=cdiv(cx(1,0),z);const P=cdiv(cmul(cx(b,0),zi),cadd(cx(1,0),cmul(cx(-a,0),zi)));const Cc=cadd(cx(kp,0),cdiv(cx(ki*Ts,0),cadd(cx(1,0),cmul(cx(-1,0),zi))));return cmul(cmul(Cc,P),zi);};
  let fcx=null;for(let lg=1.5;lg<4;lg+=0.002){if(cabs(Lz(Math.pow(10,lg),Lh*p.lr))<1){fcx=Math.pow(10,lg);break;}}
  const Lc=fcx?Lz(fcx,Lh*p.lr):null,pm=Lc?180+Math.atan2(Lc.i,Lc.r)/D2R:null;
  info(ctx,C,['开环穿越 fc ≈ '+(fcx?fcx.toFixed(0)+' Hz':'—')+'，相位裕度 ≈ '+(pm!==null?((pm+360)%360).toFixed(0)+'°':'—'),['Kp = '+kp.toFixed(3)+' V/A，Ki = '+ki.toFixed(1),C.fg],['闭环 −3 dB ≈ '+(bw?bw.toFixed(0)+' Hz（延迟使其高于 fc）':'> 10 kHz'),C.fg],[ '谐振峰 = '+Math.max(0,pk).toFixed(2)+' dB',pk>1?C.bad:C.ok],p.lr<1?'真实电感偏小（饱和）→ 带宽升高、相位裕度下降':(p.lr>1?'真实电感偏大 → 带宽降低':'参数匹配')],P.b.x+8,P.b.y+P.b.h*0.58);}});
})();
