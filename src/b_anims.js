/* ===================== 模块 B 交互动画（复用 FOC_DRAW 工具，方向约定与全书一致） ===================== */
(function(){
'use strict';
const {D2R,TAU,clamp,HH,split,inset,plotBox,pline,pfn,hl,vl,arrow,dline,info,legend,plane}=window.FOC_DRAW;
const SPECS=window.FOC_ANIM_SPECS;

/* ---------- B02 转矩–电流角 ---------- */
SPECS.push({host:'anim-B02',title:'转矩 vs 电流角：永磁转矩 + 磁阻转矩（IPMSM 的 MTPA 来源）',h:HH,
 params:[{k:'is',label:'电流幅值 |is|',min:5,max:80,step:1,v:35,unit:'A',dp:0},{k:'ld',label:'Ld',min:20,max:100,step:1,v:45,unit:'µH',dp:0},{k:'lq',label:'Lq',min:20,max:150,step:1,v:75,unit:'µH',dp:0},{k:'beta',label:'电流角 β（d 轴起）',min:0,max:180,step:1,v:90,unit:'°',dp:0}],
 draw(ctx,w,h,st,C){const p=st.p,S=split(w,h),pp=4,psi=3.5e-3,Ld=p.ld*1e-6,Lq=p.lq*1e-6;
  const Tm=b=>1.5*pp*psi*p.is*Math.sin(b*D2R),Tr=b=>1.5*pp*(Ld-Lq)*(p.is*Math.cos(b*D2R))*(p.is*Math.sin(b*D2R)),T=b=>Tm(b)+Tr(b);
  let bm=0,tm=-1e9;for(let b=0;b<=180;b+=0.25){const v=T(b);if(v>tm){tm=v;bm=b;}}
  const G=plane(ctx,C,inset(S.L,8,10,8,8),p.is*1.2+5,['d','q']);
  const b=p.beta*D2R,E=G.S(p.is*Math.cos(b),p.is*Math.sin(b)),Em=G.S(p.is*Math.cos(bm*D2R),p.is*Math.sin(bm*D2R));
  const F=G.S(p.is*0.9,0);arrow(ctx,G.cx,G.cy,F[0],F[1],C.muted,2,'ψf');
  dline(ctx,G.cx,G.cy,Em[0],Em[1],C.ok,1.5);arrow(ctx,G.cx,G.cy,E[0],E[1],C.warn,3,'is');
  const Ed=G.S(p.is*Math.cos(b),0);dline(ctx,E[0],E[1],Ed[0],Ed[1],C.d);
  ctx.fillStyle=C.ok;ctx.font='11px system-ui';ctx.fillText('MTPA',Em[0]+4,Em[1]-4);
  const ymax=Math.max(0.2,Math.ceil(Math.abs(tm)*12)/10);
  const P=plotBox(ctx,C,inset(S.R,46,22,10,30),[0,180],[-ymax*0.4,ymax],{nx:6,ny:5,title:'转矩 Te (N·m) vs 电流角 β',xl:'β (°)，90° = 纯 q 轴'});
  pfn(ctx,P,Tm,0,180,180,C.a,1.6);pfn(ctx,P,Tr,0,180,180,C.c,1.6);pfn(ctx,P,T,0,180,180,C.fg,2.4);
  vl(ctx,P,[-ymax*0.4,ymax],bm,C.ok);vl(ctx,P,[-ymax*0.4,ymax],p.beta,C.warn);
  legend(ctx,C,[['永磁',C.a],['磁阻',C.c],['总',C.fg]],P.b.x+8,P.b.y+P.b.h-8);
  const id=p.is*Math.cos(b),iq=p.is*Math.sin(b);
  info(ctx,C,['id = '+id.toFixed(1)+' A  iq = '+iq.toFixed(1)+' A','Te(β) = '+T(p.beta).toFixed(3)+' N·m',['MTPA：β = '+bm.toFixed(1)+'°，Te = '+tm.toFixed(3),C.ok],'id=0 时 Te = '+T(90).toFixed(3)+'（'+((tm/T(90)-1)*100).toFixed(1)+'% 损失）',p.ld>=p.lq?['Ld ≥ Lq：无正向磁阻增益',C.warn]:['Ld < Lq：负 id 产生正磁阻转矩',C.ok]],P.b.x+8,P.b.y+16);}});

/* ---------- B03 三坐标系 ---------- */
SPECS.push({host:'anim-B03',title:'abc → αβ → dq：同一电流在三个坐标系中的样子',h:w=>w>=620?320:820,
 params:[{k:'I',label:'电流幅值',min:5,max:40,step:1,v:30,unit:'A',dp:0},{k:'gam',label:'电流角 γ（相对 d）',min:0,max:180,step:1,v:100,unit:'°',dp:0},{k:'gb',label:'B 相增益误差',min:-15,max:15,step:0.5,v:0,unit:'%',dp:1},{k:'oa',label:'A 相偏移',min:-5,max:5,step:0.1,v:0,unit:'A',dp:1}],
 draw(ctx,w,h,st,C){const p=st.p,f=0.4,th=x=>TAU*f*(st.t+x);
  const ph=x=>th(x)+p.gam*D2R,ia=x=>p.I*Math.cos(ph(x))+p.oa,ib=x=>p.I*(1+p.gb/100)*Math.cos(ph(x)-TAU/3),ic=x=>-ia(x)-ib(x);
  const al=x=>ia(x),be=x=>(ia(x)+2*ib(x))/Math.sqrt(3);
  const id=x=>al(x)*Math.cos(th(x))+be(x)*Math.sin(th(x)),iq=x=>-al(x)*Math.sin(th(x))+be(x)*Math.cos(th(x));
  let R1,R2,R3;if(w>=620){const a=Math.round(w*0.36),b=Math.round(w*0.28);R1={x:0,y:0,w:a,h};R2={x:a,y:0,w:b,h};R3={x:a+b,y:0,w:w-a-b,h};}else{const a=Math.round(h/3);R1={x:0,y:0,w,h:a};R2={x:0,y:a,w,h:a};R3={x:0,y:2*a,w,h:h-2*a};}
  const P1=plotBox(ctx,C,inset(R1,38,22,8,30),[-2.5,0],[-45,45],{nx:5,ny:6,title:'① abc 三相电流',xl:'s'});
  pfn(ctx,P1,ia,-2.5,0,250,C.a,1.6);pfn(ctx,P1,ib,-2.5,0,250,C.b,1.6);pfn(ctx,P1,ic,-2.5,0,250,C.c,1.6);
  legend(ctx,C,[['ia',C.a],['ib',C.b],['ic',C.c]],P1.b.x+6,P1.b.y+P1.b.h-6);
  const G=plane(ctx,C,inset(R2,6,22,6,6),45,['α','β']);ctx.fillStyle=C.fg;ctx.font='11.5px system-ui';ctx.fillText('② αβ 平面（轨迹）',R2.x+8,R2.y+14);
  ctx.save();ctx.strokeStyle=C.acc;ctx.lineWidth=1.4;ctx.beginPath();for(let i=0;i<=200;i++){const x=-2.5+2.5*i/200,P=G.S(al(x),be(x));i?ctx.lineTo(P[0],P[1]):ctx.moveTo(P[0],P[1]);}ctx.stroke();ctx.restore();
  const Pn=G.S(al(0),be(0));arrow(ctx,G.cx,G.cy,Pn[0],Pn[1],C.warn,2.6,'i');
  const Dd=G.S(44*Math.cos(th(0)),44*Math.sin(th(0)));dline(ctx,G.cx,G.cy,Dd[0],Dd[1],C.d,1.2);
  const P3=plotBox(ctx,C,inset(R3,38,22,8,30),[-2.5,0],[-45,45],{nx:5,ny:6,title:'③ dq（直流）',xl:'s'});
  pfn(ctx,P3,id,-2.5,0,250,C.d,2);pfn(ctx,P3,iq,-2.5,0,250,C.q,2);legend(ctx,C,[['id',C.d],['iq',C.q]],P3.b.x+6,P3.b.y+P3.b.h-6);
  let mn=1e9,mx=-1e9;for(let i=0;i<=100;i++){const v=iq(-2.5*i/100);mn=Math.min(mn,v);mx=Math.max(mx,v);}
  const bad=Math.abs(p.gb)>0.2||Math.abs(p.oa)>0.05;
  info(ctx,C,['id='+id(0).toFixed(1)+' iq='+iq(0).toFixed(1),['iq 纹波 '+(mx-mn).toFixed(2)+' A',bad?C.bad:C.ok],bad?[Math.abs(p.oa)>0.05?'偏移→1×fe 纹波':'增益差→2×fe 纹波',C.bad]:['圆 + 直线：正常',C.ok]],P3.b.x+6,P3.b.y+16);}});

/* ---------- B04 电子换向 ---------- */
SPECS.push({host:'anim-B04',title:'电子换向：电流矢量始终与转子磁链正交（SPMSM）',h:HH,
 params:[{k:'eps',label:'角度误差 ε（零位错误）',min:-180,max:180,step:1,v:0,unit:'°',dp:0},{k:'beta',label:'给定电流角 β',min:0,max:180,step:1,v:90,unit:'°',dp:0},{k:'f',label:'转速（演示）',min:0.05,max:0.6,step:0.05,v:0.2,unit:'Hz',dp:2}],
 draw(ctx,w,h,st,C){const p=st.p,S=split(w,h),G=plane(ctx,C,inset(S.L,8,10,8,8),1.25,['α','β']);
  const th=TAU*p.f*st.t,thh=th+p.eps*D2R,ia=thh+p.beta*D2R;
  ctx.save();ctx.translate(G.cx,G.cy);ctx.rotate(-th);ctx.fillStyle=C.panel;ctx.strokeStyle=C.axis;ctx.beginPath();ctx.ellipse(0,0,G.R*0.55,G.R*0.32,0,0,TAU);ctx.fill();ctx.stroke();
  ctx.fillStyle=C.a;ctx.fillRect(G.R*0.18,-G.R*0.2,G.R*0.34,G.R*0.4);ctx.fillStyle=C.c;ctx.fillRect(-G.R*0.52,-G.R*0.2,G.R*0.34,G.R*0.4);
  ctx.fillStyle='#fff';ctx.font='bold 12px system-ui';ctx.fillText('N',G.R*0.3,4);ctx.fillText('S',-G.R*0.4,4);ctx.restore();
  const F=G.S(1.15*Math.cos(th),1.15*Math.sin(th));arrow(ctx,G.cx,G.cy,F[0],F[1],C.muted,2,'ψf（真实 d）');
  const Dh=G.S(1.05*Math.cos(thh),1.05*Math.sin(thh));dline(ctx,G.cx,G.cy,Dh[0],Dh[1],C.d,1.3);
  const I=G.S(0.95*Math.cos(ia),0.95*Math.sin(ia));arrow(ctx,G.cx,G.cy,I[0],I[1],C.warn,3.2,'is');
  const eff=Math.sin(ia-th);
  const P=plotBox(ctx,C,inset(S.R,46,22,10,30),[-180,180],[-1.1,1.1],{nx:6,ny:4,title:'转矩比例 Te/Tmax = sin(β + ε) vs ε',xl:'角度误差 ε (°)'});
  pfn(ctx,P,e=>Math.sin(p.beta*D2R+e*D2R),-180,180,200,C.acc,2);vl(ctx,P,[-1.1,1.1],p.eps,C.warn);
  ctx.fillStyle=eff>=0?C.ok:C.bad;const bx=P.b.x+P.b.w-30,by=P.b.y+P.b.h/2;ctx.fillRect(bx,by-eff*P.b.h/2*0.9,18,eff*P.b.h/2*0.9);
  info(ctx,C,['控制器认为的 d 轴（紫虚线）','实际转矩 = '+(eff*100).toFixed(1)+' %',['实际 id = '+(Math.cos(ia-th)).toFixed(2)+'·|is|',Math.abs(Math.cos(ia-th))>0.1?C.warn:C.fg],[eff<0?'⚠ 转矩反向：电机反转 / 抱死':(eff<0.9?'转矩不足：检查零位':'正常：正交换向'),eff<0?C.bad:(eff<0.9?C.warn:C.ok)]],P.b.x+8,P.b.y+16);}});

/* ---------- B05 串级 ---------- */
SPECS.push({host:'anim-B05',title:'串级控制：速度环带宽 vs 电流环带宽（带宽分离）',h:HH,
 params:[{k:'fi',label:'电流环带宽 f_i',min:20,max:1000,step:10,v:1000,unit:'Hz',dp:0},{k:'fs',label:'速度环带宽 f_s',min:5,max:200,step:1,v:40,unit:'Hz',dp:0},{k:'tf',label:'速度滤波 τf',min:0,max:10,step:0.1,v:1,unit:'ms',dp:1}],
 draw(ctx,w,h,st,C){const p=st.p,J=2e-5,Kt=0.021,dt=1e-4,N=4000,Imax=35;
  const ws=TAU*p.fs,Kp=ws*J/Kt,Ki=Kp*ws/10;
  let wm=0,iq=0,I=0,wf=0,kk=0,iqRef=0;const tx=[],sx=[],rx=[],qx=[];
  for(let k=0;k<N;k++){const t=k*dt,ref=t<0.05?0:1000*TAU/60,TL=t>0.25?0.2:0;
    if(k%10===0){const e=ref-wf;let In=I+Ki*1e-3*e;const u=Kp*e+In;if(Math.abs(u)<Imax||Math.sign(e)!==Math.sign(u))I=In;iqRef=clamp(Kp*e+I,-Imax,Imax);}
    iq+=(iqRef-iq)*(1-Math.exp(-TAU*p.fi*dt));wm+=(Kt*iq-TL)/J*dt;
    wf+=p.tf>0?(wm-wf)*(1-Math.exp(-dt/(p.tf*1e-3))):(wm-wf);
    if(k%8===0){tx.push(t);sx.push(wm*60/TAU);rx.push(ref*60/TAU);qx.push(iqRef);}}
  const S=split(w,h);
  const P1=plotBox(ctx,C,inset(S.L,46,22,10,30),[0,0.4],[-200,1600],{nx:4,ny:6,title:'速度 rpm：给定（灰）实际（蓝）',xl:'时间 s（0.25 s 加负载）'});
  pline(ctx,P1,tx,rx,C.muted,1.4,[5,4]);pline(ctx,P1,tx,sx,C.acc,2);
  const P2=plotBox(ctx,C,inset(S.R,40,22,10,30),[0,0.4],[-40,40],{nx:4,ny:4,title:'速度环输出 iqRef (A)，限幅 ±35 A',xl:'时间 s'});
  hl(ctx,P2,[0,0.4],35,C.bad);hl(ctx,P2,[0,0.4],-35,C.bad);pline(ctx,P2,tx,qx,C.q,1.8);
  let mx=0;for(let i=0;i<sx.length;i++)if(tx[i]<0.25)mx=Math.max(mx,sx[i]);const os=(mx-1000)/10;const ratio=p.fi/p.fs;
  info(ctx,C,['带宽比 f_i/f_s = '+ratio.toFixed(1),[ratio<5?'⚠ 小于 5：内环不够快':'带宽分离充分',ratio<5?C.bad:C.ok],['超调 = '+Math.max(0,os).toFixed(1)+' %',os>15?C.bad:C.ok],'Kp_s = ωs·J/Kt = '+Kp.toFixed(3)+' A/(rad/s)'],P2.b.x+8,P2.b.y+16);}});

/* ---------- B06 时序 ---------- */
SPECS.push({host:'anim-B06',title:'中心对齐 PWM、中点采样与 1.5Ts 控制延迟',h:w=>w>=620?360:440,
 params:[{k:'d',label:'A 相占空比',min:0.05,max:0.99,step:0.01,v:0.6,dp:2},{k:'off',label:'采样点偏移（相对顶点）',min:-20,max:20,step:0.5,v:0,unit:'µs',dp:1},{k:'tc',label:'中断执行时间',min:5,max:70,step:1,v:22,unit:'µs',dp:0}],
 draw(ctx,w,h,st,C){const p=st.p,Ts=50,T2=100,L=48,R=w-14,X=t=>L+(t/T2)*(R-L);
  const rows=[['载波 / 比较值',0.2],['A 上管 PWM',0.12],['A 相电流',0.22],['ADC / 中断',0.14],['占空比生效',0.12]];
  let y=18;const box=[];rows.forEach(r=>{const hh=(h-40)*r[1]/0.8;box.push({y,h:hh,t:r[0]});y+=hh+6;});
  ctx.font='11px system-ui';box.forEach(b=>{ctx.fillStyle=C.muted;ctx.textAlign='left';ctx.fillText(b.t,4,b.y+10);ctx.strokeStyle=C.grid;ctx.strokeRect(L,b.y,R-L,b.h);});
  for(let k=0;k<=2;k++){ctx.strokeStyle=C.grid;ctx.beginPath();ctx.moveTo(X(k*Ts),14);ctx.lineTo(X(k*Ts),h-14);ctx.stroke();ctx.fillStyle=C.muted;ctx.textAlign='center';ctx.fillText(k+'·Ts',X(k*Ts),h-2);}
  const car=t=>{const u=(t%Ts)/Ts;return u<0.5?u*2:2-u*2;};const b0=box[0];
  ctx.strokeStyle=C.acc;ctx.lineWidth=1.5;ctx.beginPath();for(let i=0;i<=400;i++){const t=T2*i/400,yy=b0.y+b0.h-car(t)*b0.h;i?ctx.lineTo(X(t),yy):ctx.moveTo(X(t),yy);}ctx.stroke();
  const cmp=1-p.d;ctx.strokeStyle=C.warn;ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(L,b0.y+b0.h-cmp*b0.h);ctx.lineTo(R,b0.y+b0.h-cmp*b0.h);ctx.stroke();ctx.setLineDash([]);
  const b1=box[1],on=t=>car(t)>=cmp;ctx.strokeStyle=C.a;ctx.lineWidth=1.8;ctx.beginPath();for(let i=0;i<=800;i++){const t=T2*i/800,yy=on(t)?b1.y+3:b1.y+b1.h-3;i?ctx.lineTo(X(t),yy):ctx.moveTo(X(t),yy);}ctx.stroke();
  const b2=box[2],rip=0.42;let cur=0;const cs=[];for(let i=0;i<=800;i++){const t=T2*i/800;cur+=(on(t)?(1-p.d):-p.d)*(T2/800);cs.push(cur);}
  const avg=cs.reduce((a,b)=>a+b,0)/cs.length,amp=Math.max(...cs.map(v=>Math.abs(v-avg)))||1;
  const cy=v=>b2.y+b2.h/2-(v-avg)/amp*b2.h*rip;ctx.strokeStyle=C.d;ctx.lineWidth=1.8;ctx.beginPath();cs.forEach((v,i)=>{const t=T2*i/800;i?ctx.lineTo(X(t),cy(v)):ctx.moveTo(X(t),cy(v));});ctx.stroke();
  ctx.strokeStyle=C.muted;ctx.setLineDash([3,3]);ctx.beginPath();ctx.moveTo(L,cy(avg));ctx.lineTo(R,cy(avg));ctx.stroke();ctx.setLineDash([]);
  const b3=box[3],tS=Ts/2+p.off,iS=Math.round(tS/T2*800),vs=cs[clamp(iS,0,800)];ctx.fillStyle=C.bad;ctx.beginPath();ctx.arc(X(tS),cy(vs),5,0,TAU);ctx.fill();
  ctx.fillStyle=C.bad;ctx.fillRect(X(tS)-1,b3.y,2,b3.h);ctx.fillStyle=C.q;ctx.globalAlpha=0.7;ctx.fillRect(X(tS+2),b3.y+4,X(tS+2+p.tc)-X(tS+2),b3.h-8);ctx.globalAlpha=1;ctx.fillStyle=C.fg;ctx.textAlign='left';ctx.fillText('ISR',X(tS+3),b3.y+b3.h/2+4);
  const b4=box[4],tEnd=tS+2+p.tc,tLoad=tEnd<=1.5*Ts?1.5*Ts:2.5*Ts;if(tLoad<T2){ctx.fillStyle=C.ok;ctx.fillRect(X(tLoad),b4.y+3,X(T2)-X(tLoad),b4.h-6);ctx.fillStyle=C.fg;ctx.fillText('新占空比（顶点加载）',X(tLoad)+4,b4.y+b4.h/2+4);}else{ctx.fillStyle=C.bad;ctx.fillText('新占空比在视窗外（错过加载点）',X(Ts)+4,b4.y+b4.h/2+4);}
  const lowOn=(1-p.d)*Ts,err=Math.abs(vs-avg)/amp*100;const dly=(tLoad+Ts/2-Ts/2)/Ts;
  info(ctx,C,['下管导通 '+lowOn.toFixed(1)+' µs'+(lowOn<3?' ⚠ 窗口不足':''),[ '采样误差 ≈ '+err.toFixed(0)+'% 纹波幅值',err>10?C.bad:C.ok],[tEnd>1.5*Ts?'⚠ 中断超出一个周期：延迟变为 '+dly.toFixed(1)+'·Ts':'等效延迟 ≈ '+dly.toFixed(1)+'·Ts（采样→新周期中心）',tEnd>1.5*Ts?C.bad:C.fg]],X(Ts)+8,box[0].y+14);}});

/* ---------- B07 机械角 vs 电角 ---------- */
SPECS.push({host:'anim-B07',title:'机械角度 θm 与电角度 θe = p·θm（p = 4）',h:HH,
 params:[{k:'n',label:'转速（演示）',min:0.05,max:0.5,step:0.01,v:0.12,unit:'转/s',dp:2},{k:'off',label:'零位偏移',min:0,max:360,step:1,v:0,unit:'°e',dp:0}],
 draw(ctx,w,h,st,C){const p=st.p,S=split(w,h),r=inset(S.L,8,10,8,8),cx=r.x+r.w/2,cy=r.y+r.h/2,R=Math.min(r.w,r.h)*0.42;
  const thm=(TAU*p.n*st.t)%TAU;
  for(let i=0;i<8;i++){const a0=thm+i*TAU/8,a1=a0+TAU/8;ctx.fillStyle=i%2?C.c:C.a;ctx.globalAlpha=0.75;ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,R,-a1,-a0);ctx.closePath();ctx.fill();ctx.globalAlpha=1;
    ctx.fillStyle='#fff';ctx.font='bold 11px system-ui';const am=(a0+a1)/2;ctx.fillText(i%2?'S':'N',cx+R*0.7*Math.cos(am)-4,cy-R*0.7*Math.sin(am)+4);}
  ctx.strokeStyle=C.axis;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+R+10,cy);ctx.stroke();
  arrow(ctx,cx,cy,cx+(R+6)*Math.cos(thm+TAU/16),cy-(R+6)*Math.sin(thm+TAU/16),C.fg,2,'θm');
  const P=plotBox(ctx,C,inset(S.R,52,22,10,30),[-1.5,0],[0,65535],{nx:3,ny:4,title:'uint16 角度：θm（灰）与 θe（紫）',xl:'时间 s',yf:v=>Math.round(v)});
  const fm=x=>{const a=((TAU*p.n*(st.t+x))%TAU+TAU)%TAU;return a/TAU*65536;},fe=x=>{const a=(((4*TAU*p.n*(st.t+x)-p.off*D2R)%TAU)+TAU)%TAU;return a/TAU*65536;};
  const seg=(f,col)=>{const xs=[],ys=[];let prev=null;for(let i=0;i<=600;i++){const x=-1.5+1.5*i/600,v=f(x);if(prev!==null&&Math.abs(v-prev)>30000){pline(ctx,P,xs.slice(),ys.slice(),col,1.8);xs.length=0;ys.length=0;}xs.push(x);ys.push(v);prev=v;}pline(ctx,P,xs,ys,col,1.8);};
  seg(fm,C.muted);seg(fe,C.d);
  const um=Math.round(fm(0))%65536,ue=Math.round(fe(0))%65536;
  info(ctx,C,['θm = '+(um/65536*360).toFixed(1)+'°  ('+um+')','θe = '+(ue/65536*360).toFixed(1)+'°  ('+ue+')','机械 1 圈 = 电角度 4 圈'],P.b.x+8,P.b.y+16);}});
})();
