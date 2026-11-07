/* ===================== 模块 A 交互动画（方向约定：逆时针为正，α 轴 = A 相，与全书代码一致） ===================== */
(function(){
'use strict';
const D2R=Math.PI/180, TAU=2*Math.PI;
const clamp=(v,a,b)=>v<a?a:(v>b?b:v);
const HH=w=>w>=620?340:620;
function fmt(v){const a=Math.abs(v);if(a===0)return'0';if(a>=100)return v.toFixed(0);if(a>=10)return v.toFixed(0);if(a>=1)return v.toFixed(1);return v.toFixed(2);}
function split(w,h){if(w>=620){const lw=Math.round(w*0.42);return{L:{x:0,y:0,w:lw,h},R:{x:lw,y:0,w:w-lw,h}};}const lh=Math.round(h*0.46);return{L:{x:0,y:0,w,h:lh},R:{x:0,y:lh,w,h:h-lh}};}
function inset(r,l,t,rr,b){return{x:r.x+l,y:r.y+t,w:r.w-l-rr,h:r.h-t-b};}
function plotBox(ctx,C,b,xr,yr,o){o=o||{};
  const X=v=>b.x+(v-xr[0])/(xr[1]-xr[0])*b.w, Y=v=>b.y+b.h-(v-yr[0])/(yr[1]-yr[0])*b.h;
  ctx.save();ctx.lineWidth=1;ctx.font='10px ui-monospace,Consolas,monospace';
  const nx=o.nx||5, ny=o.ny||4;
  for(let i=0;i<=nx;i++){const v=xr[0]+(xr[1]-xr[0])*i/nx,px=X(v);ctx.strokeStyle=C.grid;ctx.beginPath();ctx.moveTo(px,b.y);ctx.lineTo(px,b.y+b.h);ctx.stroke();ctx.fillStyle=C.muted;ctx.textAlign='center';ctx.fillText(o.xf?o.xf(v):fmt(v),px,b.y+b.h+12);}
  for(let i=0;i<=ny;i++){const v=yr[0]+(yr[1]-yr[0])*i/ny,py=Y(v);ctx.strokeStyle=C.grid;ctx.beginPath();ctx.moveTo(b.x,py);ctx.lineTo(b.x+b.w,py);ctx.stroke();ctx.fillStyle=C.muted;ctx.textAlign='right';ctx.fillText(o.yf?o.yf(v):fmt(v),b.x-4,py+3);}
  ctx.strokeStyle=C.axis;if(yr[0]<0&&yr[1]>0){ctx.beginPath();ctx.moveTo(b.x,Y(0));ctx.lineTo(b.x+b.w,Y(0));ctx.stroke();}
  ctx.strokeRect(b.x,b.y,b.w,b.h);
  ctx.fillStyle=C.fg;ctx.font='11.5px system-ui,sans-serif';ctx.textAlign='left';if(o.title)ctx.fillText(o.title,b.x,b.y-6);
  if(o.xl){ctx.textAlign='right';ctx.fillStyle=C.muted;ctx.fillText(o.xl,b.x+b.w,b.y+b.h+24);}
  ctx.restore();return{X,Y,b};}
function pline(ctx,P,xs,ys,col,lw,dash){ctx.save();ctx.beginPath();ctx.rect(P.b.x,P.b.y,P.b.w,P.b.h);ctx.clip();ctx.strokeStyle=col;ctx.lineWidth=lw||1.6;if(dash)ctx.setLineDash(dash);ctx.beginPath();for(let i=0;i<xs.length;i++){const px=P.X(xs[i]),py=P.Y(ys[i]);if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);}ctx.stroke();ctx.restore();}
function pfn(ctx,P,f,x0,x1,n,col,lw,dash){const xs=[],ys=[];for(let i=0;i<=n;i++){const x=x0+(x1-x0)*i/n;xs.push(x);ys.push(f(x));}pline(ctx,P,xs,ys,col,lw,dash);}
function hl(ctx,P,xr,y,col){pline(ctx,P,[xr[0],xr[1]],[y,y],col,1,[4,4]);}
function vl(ctx,P,yr,x,col){pline(ctx,P,[x,x],[yr[0],yr[1]],col,1,[4,4]);}
function arrow(ctx,x0,y0,x1,y1,col,lw,label){ctx.save();ctx.strokeStyle=col;ctx.fillStyle=col;ctx.lineWidth=lw||2;ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.stroke();const a=Math.atan2(y1-y0,x1-x0),L=Math.hypot(x1-x0,y1-y0);if(L>5){const hs=Math.min(10,L*0.35);ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x1-hs*Math.cos(a-0.4),y1-hs*Math.sin(a-0.4));ctx.lineTo(x1-hs*Math.cos(a+0.4),y1-hs*Math.sin(a+0.4));ctx.closePath();ctx.fill();}if(label){ctx.font='bold 12px system-ui,sans-serif';ctx.textAlign='left';ctx.fillText(label,x1+8*Math.cos(a)-4,y1+8*Math.sin(a)+4);}ctx.restore();}
function dline(ctx,x0,y0,x1,y1,col,lw){ctx.save();ctx.strokeStyle=col;ctx.lineWidth=lw||1;ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.stroke();ctx.restore();}
function info(ctx,C,arr,x,y){ctx.save();ctx.font='12px ui-monospace,Consolas,monospace';let w=0;arr.forEach(s=>{const t=Array.isArray(s)?s[0]:s;w=Math.max(w,ctx.measureText(t).width);});ctx.globalAlpha=0.88;ctx.fillStyle=C.panel;ctx.fillRect(x-4,y-13,w+10,arr.length*16+6);ctx.globalAlpha=1;arr.forEach((s,i)=>{ctx.fillStyle=Array.isArray(s)?s[1]:C.fg;ctx.textAlign='left';ctx.fillText(Array.isArray(s)?s[0]:s,x,y+i*16);});ctx.restore();}
function legend(ctx,C,items,x,y){ctx.save();ctx.font='11px system-ui,sans-serif';let cx=x;items.forEach(([t,c])=>{ctx.fillStyle=c;ctx.fillRect(cx,y-8,14,3);ctx.fillStyle=C.fg;ctx.textAlign='left';ctx.fillText(t,cx+18,y-3);cx+=ctx.measureText(t).width+32;});ctx.restore();}
function hr(k){const x=Math.sin(k*12.9898+78.233)*43758.5453;return(x-Math.floor(x))*2-1;}
function plane(ctx,C,r,maxv,labels){const cx=r.x+r.w/2,cy=r.y+r.h/2+4,R=Math.min(r.w,r.h)*0.43,k=R/maxv;ctx.save();ctx.strokeStyle=C.grid;ctx.lineWidth=1;ctx.beginPath();ctx.arc(cx,cy,R,0,TAU);ctx.stroke();ctx.strokeStyle=C.axis;ctx.beginPath();ctx.moveTo(cx-R-8,cy);ctx.lineTo(cx+R+8,cy);ctx.moveTo(cx,cy+R+8);ctx.lineTo(cx,cy-R-8);ctx.stroke();ctx.fillStyle=C.muted;ctx.font='11px system-ui,sans-serif';ctx.fillText(labels[0],cx+R+2,cy-4);ctx.fillText(labels[1],cx+4,cy-R-2);ctx.restore();return{cx,cy,R,k,S:(x,y)=>[cx+x*k,cy-y*k]};}

const SPECS=window.FOC_ANIM_SPECS;
window.FOC_DRAW={D2R,TAU,clamp,HH,fmt,split,inset,plotBox,pline,pfn,hl,vl,arrow,dline,info,legend,hr,plane};

/* ---------- A01 ---------- */
SPECS.push({host:'anim-A01',title:'ADC 码值 → 相电流 → Q15：线性映射、偏移与削顶',h:HH,
 params:[{k:'amp',label:'真实电流峰值',min:5,max:70,step:1,v:30,unit:'A',dp:0},
  {k:'hw',label:'硬件实际零点',min:1980,max:2120,step:1,v:2078,unit:'cnt',dp:0},
  {k:'off',label:'软件偏移 Cal_IaOffset_cnt',min:1980,max:2120,step:1,v:2048,unit:'cnt',dp:0},
  {k:'gc',label:'增益修正 Cal_IaGainCorr',min:0.9,max:1.1,step:0.005,v:1.0,dp:3}],
 draw(ctx,w,h,st,C){const p=st.p,t=st.t,G=100/4096,S=split(w,h);
  const iT=x=>p.amp*Math.sin(TAU*0.5*x), adc=i=>clamp(Math.round(p.hw+i/G),0,4095), meas=N=>(N-p.off)*G*p.gc;
  const P1=plotBox(ctx,C,inset(S.L,44,22,12,30),[0,4096],[-60,60],{nx:4,ny:6,title:'换算直线 I = (N − N0)·K',xl:'ADC 码值 N'});
  hl(ctx,P1,[0,4096],50,C.warn);hl(ctx,P1,[0,4096],-50,C.warn);
  pfn(ctx,P1,N=>(N-p.hw)*G,0,4096,2,C.muted,1.4,[5,4]);pfn(ctx,P1,meas,0,4096,2,C.acc,2.2);
  const i=iT(t),N=adc(i),im=meas(N);
  ctx.fillStyle=C.bad;ctx.beginPath();ctx.arc(P1.X(N),P1.Y(im),4.5,0,TAU);ctx.fill();
  const P2=plotBox(ctx,C,inset(S.R,40,22,10,30),[-4,0],[-75,75],{nx:4,ny:6,title:'时域：真实电流（灰）vs 软件测量（蓝）',xl:'时间 s（右端 = 当前）'});
  hl(ctx,P2,[-4,0],50,C.warn);hl(ctx,P2,[-4,0],-50,C.warn);
  pfn(ctx,P2,x=>iT(t+x),-4,0,300,C.muted,1.6);pfn(ctx,P2,x=>meas(adc(iT(t+x))),-4,0,300,C.acc,2);
  const q15=clamp(Math.round(im/50*32768),-32768,32767), clip=(N===0||N===4095), oe=(p.hw-p.off)*G;
  info(ctx,C,['i_true = '+i.toFixed(2)+' A','ADC N  = '+N,'i_meas = '+im.toFixed(2)+' A','Q15    = '+q15,['偏移误差 = '+oe.toFixed(2)+' A',Math.abs(oe)>0.1?C.bad:C.ok],[clip?'⚠ ADC 削顶（超量程）':'量程内',clip?C.bad:C.ok]],P2.b.x+8,P2.b.y+16);}});

/* ---------- A02 ---------- */
SPECS.push({host:'anim-A02',title:'矢量合成与投影：a + b 投影到旋转坐标轴 d、q',h:HH,
 params:[{k:'ma',label:'|a|',min:0,max:40,step:1,v:30,unit:'A',dp:0},{k:'ta',label:'∠a',min:0,max:360,step:1,v:30,unit:'°',dp:0},
  {k:'mb',label:'|b|',min:0,max:40,step:1,v:15,unit:'A',dp:0},{k:'tb',label:'∠b',min:0,max:360,step:1,v:120,unit:'°',dp:0},
  {k:'phi',label:'坐标轴角 φ（启动后自转）',min:0,max:360,step:1,v:0,unit:'°',dp:0}],
 draw(ctx,w,h,st,C){const p=st.p,S=split(w,h),G=plane(ctx,C,inset(S.L,8,10,8,8),45,['x','y']);
  const ph=(x)=>(p.phi+(st.t+x)*30)*D2R, phN=ph(0);
  const ax=p.ma*Math.cos(p.ta*D2R),ay=p.ma*Math.sin(p.ta*D2R),bx=p.mb*Math.cos(p.tb*D2R),by=p.mb*Math.sin(p.tb*D2R),sx=ax+bx,sy=ay+by;
  const O=G.S(0,0),A=G.S(ax,ay),B=G.S(bx,by),Sm=G.S(sx,sy);
  const ed=[Math.cos(phN),Math.sin(phN)],eq=[-Math.sin(phN),Math.cos(phN)];
  const dE=G.S(48*ed[0],48*ed[1]),dE2=G.S(-48*ed[0],-48*ed[1]),qE=G.S(48*eq[0],48*eq[1]),qE2=G.S(-48*eq[0],-48*eq[1]);
  dline(ctx,dE2[0],dE2[1],dE[0],dE[1],C.d,1.2);dline(ctx,qE2[0],qE2[1],qE[0],qE[1],C.q,1.2);
  ctx.fillStyle=C.d;ctx.font='bold 12px system-ui';ctx.fillText('d',dE[0]+3,dE[1]);ctx.fillStyle=C.q;ctx.fillText('q',qE[0]+3,qE[1]);
  const dv=sx*ed[0]+sy*ed[1],qv=sx*eq[0]+sy*eq[1];
  const Fd=G.S(dv*ed[0],dv*ed[1]),Fq=G.S(qv*eq[0],qv*eq[1]);
  dline(ctx,Sm[0],Sm[1],Fd[0],Fd[1],C.d);dline(ctx,Sm[0],Sm[1],Fq[0],Fq[1],C.q);
  arrow(ctx,O[0],O[1],Fd[0],Fd[1],C.d,4);arrow(ctx,O[0],O[1],Fq[0],Fq[1],C.q,4);
  dline(ctx,A[0],A[1],Sm[0],Sm[1],C.b);dline(ctx,B[0],B[1],Sm[0],Sm[1],C.a);
  arrow(ctx,O[0],O[1],A[0],A[1],C.a,2,'a');arrow(ctx,O[0],O[1],B[0],B[1],C.b,2,'b');arrow(ctx,O[0],O[1],Sm[0],Sm[1],C.acc,3,'a+b');
  const P=plotBox(ctx,C,inset(S.R,40,22,10,30),[-12,0],[-80,80],{nx:4,ny:4,title:'合成矢量在旋转轴上的分量（坐标轴以 30°/s 旋转）',xl:'时间 s'});
  const comp=(x,which)=>{const a=ph(x);return which?(-sx*Math.sin(a)+sy*Math.cos(a)):(sx*Math.cos(a)+sy*Math.sin(a));};
  pfn(ctx,P,x=>comp(x,0),-12,0,240,C.d,2);pfn(ctx,P,x=>comp(x,1),-12,0,240,C.q,2);
  legend(ctx,C,[['d 分量',C.d],['q 分量',C.q]],P.b.x+8,P.b.y+P.b.h-8);
  const mag=Math.hypot(sx,sy);
  info(ctx,C,['a+b = ('+sx.toFixed(1)+', '+sy.toFixed(1)+')','|a+b| = '+mag.toFixed(2)+' A','∠(a+b) = '+(Math.atan2(sy,sx)/D2R).toFixed(1)+'°  (atan2)','φ = '+((phN/D2R)%360).toFixed(1)+'°','d = '+dv.toFixed(2)+'  q = '+qv.toFixed(2),['√(d²+q²) = '+Math.hypot(dv,qv).toFixed(2)+'（守恒）',C.ok]],P.b.x+8,P.b.y+16);}});

/* ---------- A03 ---------- */
SPECS.push({host:'anim-A03',title:'单位圆旋转与三相余弦（ia+ib+ic）',h:HH,
 params:[{k:'f',label:'旋转频率（演示）',min:0.1,max:1.5,step:0.05,v:0.3,unit:'Hz',dp:2},{k:'dev',label:'C 相相位偏差',min:0,max:40,step:1,v:0,unit:'°',dp:0}],
 toggles:[{k:'three',label:'显示三相（否则显示 cos/sin）',v:true}],
 draw(ctx,w,h,st,C){const p=st.p,S=split(w,h),G=plane(ctx,C,inset(S.L,8,10,8,8),1.15,['α (A相)','β']);
  const th=TAU*p.f*st.t, c=Math.cos(th), s=Math.sin(th);
  if(st.tog.three){[[0,'A',C.a],[120,'B',C.b],[240,'C',C.c]].forEach(([a,n,col])=>{const E=G.S(1.12*Math.cos(a*D2R),1.12*Math.sin(a*D2R));dline(ctx,G.cx,G.cy,E[0],E[1],col);ctx.fillStyle=col;ctx.font='11px system-ui';ctx.fillText(n+' 轴',E[0]+2,E[1]);});}
  const Pt=G.S(c,s),Px=G.S(c,0),Py=G.S(0,s);
  ctx.save();ctx.strokeStyle=C.muted;ctx.beginPath();ctx.arc(G.cx,G.cy,18,0,-((th%TAU)),true);ctx.stroke();ctx.restore();
  dline(ctx,Pt[0],Pt[1],Px[0],Px[1],C.q);dline(ctx,Pt[0],Pt[1],Py[0],Py[1],C.a);
  arrow(ctx,G.cx,G.cy,Px[0],Px[1],C.a,4);arrow(ctx,G.cx,G.cy,Py[0],Py[1],C.q,4);arrow(ctx,G.cx,G.cy,Pt[0],Pt[1],C.acc,2.5,'θ');
  const P=plotBox(ctx,C,inset(S.R,40,22,10,30),[-3,0],[-2,2],{nx:6,ny:4,title:st.tog.three?'三相余弦与三相之和（黑虚线）':'cosθ（A 相投影）与 sinθ（β 投影）',xl:'时间 s（右端 = 当前）'});
  const T=x=>TAU*p.f*(st.t+x);
  if(st.tog.three){const fa=x=>Math.cos(T(x)),fb=x=>Math.cos(T(x)-TAU/3),fc=x=>Math.cos(T(x)+TAU/3+p.dev*D2R);
    pfn(ctx,P,fa,-3,0,300,C.a,1.8);pfn(ctx,P,fb,-3,0,300,C.b,1.8);pfn(ctx,P,fc,-3,0,300,C.c,1.8);pfn(ctx,P,x=>fa(x)+fb(x)+fc(x),-3,0,300,C.fg,1.6,[5,3]);
    legend(ctx,C,[['ia',C.a],['ib',C.b],['ic',C.c],['和',C.fg]],P.b.x+8,P.b.y+P.b.h-8);
    const sum=Math.cos(th)+Math.cos(th-TAU/3)+Math.cos(th+TAU/3+p.dev*D2R);
    info(ctx,C,['θ = '+((th/D2R)%360).toFixed(1)+'°','cosθ = '+c.toFixed(3)+'  sinθ = '+s.toFixed(3),[ 'ia+ib+ic = '+sum.toFixed(3),Math.abs(sum)>0.02?C.bad:C.ok],[p.dev>0?'三相不平衡：ic = −ia−ib 不成立':'平衡：可由两相推第三相',p.dev>0?C.bad:C.ok]],P.b.x+8,P.b.y+16);
  }else{pfn(ctx,P,x=>Math.cos(T(x)),-3,0,300,C.a,2);pfn(ctx,P,x=>Math.sin(T(x)),-3,0,300,C.q,2);legend(ctx,C,[['cosθ',C.a],['sinθ',C.q]],P.b.x+8,P.b.y+P.b.h-8);
    info(ctx,C,['θ = '+((th/D2R)%360).toFixed(1)+'°','cos²+sin² = '+(c*c+s*s).toFixed(3),'p=4 时：机械 1 圈 = 电角度 4 圈'],P.b.x+8,P.b.y+16);}}});

/* ---------- A04 ---------- */
SPECS.push({host:'anim-A04',title:'复数旋转与 Park：i_dq = i_αβ · e^(−jθ̂)',h:HH,
 params:[{k:'I',label:'电流幅值 |i|',min:5,max:40,step:1,v:30,unit:'A',dp:0},{k:'gam',label:'电流角 γ（相对真实 d）',min:0,max:180,step:1,v:100,unit:'°',dp:0},
  {k:'err',label:'角度偏差 θ̂ − θ',min:-60,max:60,step:1,v:0,unit:'°',dp:0},{k:'dw',label:'频率失配',min:-0.2,max:0.2,step:0.01,v:0,unit:'Hz',dp:2}],
 toggles:[{k:'wrong',label:'Park 方向写反（误用 e^(+jθ̂)）',v:false}],
 draw(ctx,w,h,st,C){const p=st.p,S=split(w,h),G=plane(ctx,C,inset(S.L,8,10,8,8),45,['α (Re)','β (Im)']);const f=0.25;
  const th=x=>TAU*f*(st.t+x), dl=x=>p.err*D2R+TAU*p.dw*(st.t+x), thh=x=>th(x)+dl(x);
  const ang=x=>st.tog.wrong?(th(x)+p.gam*D2R+thh(x)):(p.gam*D2R-dl(x));
  const t0=th(0),th0=thh(0),ia=p.I*Math.cos(t0+p.gam*D2R),ib=p.I*Math.sin(t0+p.gam*D2R);
  const Dt=G.S(46*Math.cos(t0),46*Math.sin(t0));dline(ctx,G.cx,G.cy,Dt[0],Dt[1],C.muted,1.2);ctx.fillStyle=C.muted;ctx.font='11px system-ui';ctx.fillText('d真',Dt[0]+2,Dt[1]);
  const Dh=G.S(44*Math.cos(th0),44*Math.sin(th0)),Qh=G.S(44*Math.cos(th0+Math.PI/2),44*Math.sin(th0+Math.PI/2));
  arrow(ctx,G.cx,G.cy,Dh[0],Dh[1],C.d,1.5,'d̂');arrow(ctx,G.cx,G.cy,Qh[0],Qh[1],C.q,1.5,'q̂');
  const Ip=G.S(ia,ib);arrow(ctx,G.cx,G.cy,Ip[0],Ip[1],C.warn,3.2,'i_s');
  const P=plotBox(ctx,C,inset(S.R,40,22,10,30),[-8,0],[-45,45],{nx:4,ny:6,title:'Park 输出 id、iq',xl:'时间 s（右端 = 当前）'});
  pfn(ctx,P,x=>p.I*Math.cos(ang(x)),-8,0,320,C.d,2);pfn(ctx,P,x=>p.I*Math.sin(ang(x)),-8,0,320,C.q,2);
  legend(ctx,C,[['id',C.d],['iq',C.q]],P.b.x+8,P.b.y+P.b.h-8);
  const a0=ang(0),idv=p.I*Math.cos(a0),iqv=p.I*Math.sin(a0);
  let diag=['正常：dq 为直流',C.ok]; if(st.tog.wrong)diag=['写反：dq 以 2 倍电频率振荡',C.bad]; else if(Math.abs(p.dw)>0.001)diag=['速度失配：dq 缓慢旋转摆动',C.bad]; else if(p.err!==0)diag=['角度偏差：dq 常值偏移（零位错误）',C.warn];
  info(ctx,C,['iα = '+ia.toFixed(1)+'  iβ = '+ib.toFixed(1),'id = '+idv.toFixed(2)+'  iq = '+iqv.toFixed(2),'真实 id = '+(p.I*Math.cos(p.gam*D2R)).toFixed(2)+'  真实 iq = '+(p.I*Math.sin(p.gam*D2R)).toFixed(2),diag],P.b.x+8,P.b.y+16);}});

/* ---------- A05 ---------- */
SPECS.push({host:'anim-A05',title:'后向差分求导：采样周期、噪声放大与一阶低通',h:HH,
 params:[{k:'Ts',label:'采样周期 Ts',min:0.05,max:2,step:0.05,v:0.5,unit:'ms',dp:2},{k:'noise',label:'采样噪声幅度',min:0,max:0.2,step:0.005,v:0.02,dp:3},{k:'alpha',label:'低通系数 α',min:0.02,max:1,step:0.01,v:0.3,dp:2}],
 draw(ctx,w,h,st,C){const p=st.p,S=split(w,h),Ts=p.Ts/1000,om=TAU*50,t0=st.t*0.02,W=0.04;
  const k0=Math.floor(t0/Ts)-400,k1=Math.ceil((t0+W)/Ts);let xp=null,y=0,e1=0,e2=0,n=0;const sx=[],sv=[],dv=[],yv=[];
  for(let k=k0;k<=k1;k++){const tk=k*Ts,x=Math.sin(om*tk)+p.noise*hr(k);if(xp!==null){const d=(x-xp)/Ts/om;y+=p.alpha*(d-y);if(tk>=t0){sx.push((tk-t0)*1000);sv.push(x);dv.push(d);yv.push(y);const tr=Math.cos(om*tk);e1+=(d-tr)*(d-tr);e2+=(y-tr)*(y-tr);n++;}}xp=x;}
  const P1=plotBox(ctx,C,inset(S.L,40,22,10,30),[0,40],[-1.5,1.5],{nx:4,ny:4,title:'信号 x = sin(ωt) + 噪声（50 Hz），采样点',xl:'时间 ms'});
  pfn(ctx,P1,x=>Math.sin(om*(t0+x/1000)),0,40,300,C.muted,1.4);
  const zx=[],zy=[];for(let i=0;i<sx.length;i++){zx.push(sx[i],sx[i]+p.Ts);zy.push(sv[i],sv[i]);}pline(ctx,P1,zx,zy,C.acc,1.4);
  if(sx.length<=120){ctx.fillStyle=C.acc;sx.forEach((x,i)=>{ctx.beginPath();ctx.arc(P1.X(x),P1.Y(sv[i]),2.4,0,TAU);ctx.fill();});}
  const P2=plotBox(ctx,C,inset(S.R,40,22,10,30),[0,40],[-2.5,2.5],{nx:4,ny:5,title:'导数 /ω：真实（灰）差分（红）低通后（蓝）',xl:'时间 ms'});
  pfn(ctx,P2,x=>Math.cos(om*(t0+x/1000)),0,40,300,C.muted,2);pline(ctx,P2,sx,dv,C.bad,1.1);pline(ctx,P2,sx,yv,C.acc,2);
  const lagDeg=360*50*Ts/2;
  info(ctx,C,['RMS 误差（差分）= '+Math.sqrt(e1/Math.max(1,n)).toFixed(3),'RMS 误差（低通）= '+Math.sqrt(e2/Math.max(1,n)).toFixed(3),'差分固有延迟 Ts/2 → 50 Hz 滞后 '+lagDeg.toFixed(2)+'°','噪声放大 ≈ √2·σ/(Ts·ω) = '+(1.414*p.noise/(Ts*om)).toFixed(3)],P2.b.x+8,P2.b.y+16);}});

/* ---------- A06 ---------- */
SPECS.push({host:'anim-A06',title:'数字积分器：偏置漂移、积分限幅与泄漏积分',h:HH,
 params:[{k:'bias',label:'输入直流偏置 b',min:0,max:0.2,step:0.005,v:0.05,dp:3},{k:'lam',label:'泄漏系数 λ',min:0,max:0.05,step:0.001,v:0,dp:3},{k:'lim',label:'积分器限幅',min:0.5,max:5,step:0.1,v:2,dp:1}],
 toggles:[{k:'clamp',label:'启用积分器限幅',v:false}],
 draw(ctx,w,h,st,C){const p=st.p,S=split(w,h),Ts=0.01;if(st.t>120)st.t=0;
  const N=Math.floor(st.t/Ts),start=Math.max(0,N-1000);let y=0;const hx=[],hy=[],hi=[],hu=[];let ymax=1;
  for(let k=0;k<=N;k++){const u=Math.sin(TAU*k*Ts)+p.bias;y=(1-p.lam)*y+u*Ts;if(st.tog.clamp)y=clamp(y,-p.lim,p.lim);if(k>=start){const tt=k*Ts-st.t;hx.push(tt);hy.push(y);hi.push((1-Math.cos(TAU*k*Ts))/TAU);hu.push(u*0.3);ymax=Math.max(ymax,Math.abs(y));}}
  const yr=Math.ceil(ymax*1.2*2)/2;
  const P1=plotBox(ctx,C,inset(S.L,40,22,10,30),[-10,0],[-1.5,1.5],{nx:5,ny:4,title:'输入 u = sin(2πt) + b',xl:'时间 s'});
  pfn(ctx,P1,x=>{const tt=st.t+x;return tt<0?0:Math.sin(TAU*tt)+p.bias;},-10,0,400,C.acc2,1.8);hl(ctx,P1,[-10,0],p.bias,C.bad);
  const P2=plotBox(ctx,C,inset(S.R,40,22,10,30),[-10,0],[-yr,yr],{nx:5,ny:4,title:'积分输出（蓝）vs 无偏置理想积分（灰虚线）',xl:'时间 s（右端 = 当前）'});
  pline(ctx,P2,hx,hi,C.muted,1.6,[5,4]);pline(ctx,P2,hx,hy,C.acc,2.2);
  if(st.tog.clamp){hl(ctx,P2,[-10,0],p.lim,C.bad);hl(ctx,P2,[-10,0],-p.lim,C.bad);}
  if(N===0){info(ctx,C,['点击「▶ 启动」开始累加（Ts = 10 ms 演示）'],P2.b.x+8,P2.b.y+16);return;}
  const sat=st.tog.clamp&&Math.abs(y)>=p.lim-1e-9;
  info(ctx,C,['t = '+st.t.toFixed(1)+' s','积分值 y = '+y.toFixed(3),'理想值 = '+((1-Math.cos(TAU*st.t))/TAU).toFixed(3),[p.lam>0?'泄漏积分：偏置误差有界 ≈ b·Ts/λ = '+(p.bias*Ts/p.lam).toFixed(3):'纯积分：偏置漂移 ≈ b·t = '+(p.bias*st.t).toFixed(2),p.lam>0?C.ok:(p.bias>0?C.bad:C.ok)],[sat?'⚠ 积分器贴限幅（饱和）':'',C.bad]].filter(s=>(Array.isArray(s)?s[0]:s)!==''),P2.b.x+8,P2.b.y+16);}});

/* ---------- A07 ---------- */
SPECS.push({host:'anim-A07',title:'RL 对象 1/(Ls+R)：阶跃响应与伯德图',h:HH,
 params:[{k:'R',label:'电阻 R',min:5,max:50,step:0.5,v:12,unit:'mΩ',dp:1},{k:'L',label:'电感 L',min:10,max:200,step:1,v:45,unit:'µH',dp:0},{k:'V',label:'阶跃电压',min:0.05,max:1,step:0.01,v:0.24,unit:'V',dp:2}],
 toggles:[{k:'dly',label:'相位叠加 1.5Ts = 75 µs 延迟',v:false}],
 draw(ctx,w,h,st,C){const p=st.p,S=split(w,h),R=p.R*1e-3,L=p.L*1e-6,tau=L/R,iss=p.V/R,fc=R/(TAU*L);
  const P1=plotBox(ctx,C,inset(S.L,44,22,10,30),[0,25],[0,Math.max(1,iss*1.15)],{nx:5,ny:4,title:'阶跃响应 i(t) = V/R·(1 − e^(−t/τ))',xl:'时间 ms'});
  pfn(ctx,P1,x=>iss*(1-Math.exp(-x/1000/tau)),0,25,300,C.acc,2.2);
  hl(ctx,P1,[0,25],0.632*iss,C.warn);if(tau*1000<25)vl(ctx,P1,[0,iss*1.15],tau*1000,C.warn);
  const tc=((st.t%3)/3)*25,ic=iss*(1-Math.exp(-tc/1000/tau));ctx.fillStyle=C.bad;ctx.beginPath();ctx.arc(P1.X(tc),P1.Y(ic),4.5,0,TAU);ctx.fill();
  info(ctx,C,['τ = L/R = '+(tau*1000).toFixed(2)+' ms','i∞ = V/R = '+iss.toFixed(1)+' A','63.2% = '+(0.632*iss).toFixed(1)+' A（黄虚线）','fc = R/(2πL) = '+fc.toFixed(1)+' Hz'],P1.b.x+P1.b.w*0.38,P1.b.y+P1.b.h*0.62);
  const R2=S.R, hh=(R2.h-30)/2;
  const fx=lg=>Math.pow(10,lg),mag=lg=>-20*Math.log10(Math.hypot(R,TAU*fx(lg)*L)),pha=lg=>-Math.atan(TAU*fx(lg)*L/R)/D2R-(st.tog.dly?360*fx(lg)*75e-6:0);
  const m0=mag(0),m1=mag(4),myr=[Math.floor((m1-5)/10)*10,Math.ceil((m0+5)/10)*10];
  const xf=v=>['1','10','100','1k','10k'][Math.round(v)]||'';
  const B1=plotBox(ctx,C,{x:R2.x+44,y:R2.y+22,w:R2.w-54,h:hh-26},[0,4],myr,{nx:4,ny:3,title:'幅频 |G(jω)| (dB, A/V)',xf});
  pfn(ctx,B1,mag,0,4,200,C.acc,2);vl(ctx,B1,myr,Math.log10(fc),C.warn);
  const pr=st.tog.dly?[-360,0]:[-90,0];
  const B2=plotBox(ctx,C,{x:R2.x+44,y:R2.y+22+hh,w:R2.w-54,h:hh-26},[0,4],pr,{nx:4,ny:4,title:'相频 ∠G (°)'+(st.tog.dly?' 含延迟':''),xf,xl:'频率 Hz'});
  pfn(ctx,B2,pha,0,4,300,C.d,2);vl(ctx,B2,pr,Math.log10(fc),C.warn);
  info(ctx,C,['1 kHz：|G| = '+mag(3).toFixed(1)+' dB，∠G = '+pha(3).toFixed(1)+'°'],B2.b.x+6,B2.b.y+B2.b.h-8);}});

/* ---------- A08 ---------- */
SPECS.push({host:'anim-A08',title:'离散 PI 电流环：零极点对消、积分饱和与延迟振荡（d 轴 RL 对象）',h:w=>w>=620?400:520,
 params:[{k:'kp',label:'Kp',min:0.02,max:1.5,step:0.001,v:0.283,unit:'V/A',dp:3},{k:'ki',label:'Ki',min:0,max:600,step:1,v:75,unit:'V/(A·s)',dp:0},{k:'vmax',label:'电压限幅 Vmax',min:0.5,max:6.93,step:0.01,v:6.93,unit:'V',dp:2}],
 toggles:[{k:'aw',label:'启用条件积分抗饱和',v:true},{k:'dly',label:'1 拍计算延迟（真实 MCU）',v:true}],
 buttons:[{label:'按 1 kHz 带宽零极点对消',fn:a=>{a.setP('kp',0.283);a.setP('ki',75);a.setP('vmax',6.93);}},
  {label:'演示积分饱和（Vmax=1 V，关抗饱和）',fn:a=>{a.setP('kp',0.283);a.setP('ki',300);a.setP('vmax',1.0);a.setT('aw',false);}},
  {label:'演示延迟导致振荡（Kp=1.2）',fn:a=>{a.setP('kp',1.2);a.setP('ki',75);a.setP('vmax',6.93);a.setT('dly',true);a.setT('aw',true);}}],
 draw(ctx,w,h,st,C){const p=st.p,R=0.012,L=45e-6,Ts=50e-6,N=400,a=Math.exp(-R*Ts/L),b=(1-a)/R;
  let i=0,I=0,uPrev=0;const tx=[],ix=[],ux=[],rx=[];let sat=0;
  for(let k=0;k<N;k++){const tt=k*Ts,ref=tt<1e-3?0:(tt<10e-3?20:5),e=ref-i,P=p.kp*e;let Inew=I+p.ki*Ts*e;
    if(st.tog.aw){Inew=clamp(Inew,-p.vmax,p.vmax);const un=P+Inew;if(un>p.vmax){if(e<0)I=Inew;}else if(un<-p.vmax){if(e>0)I=Inew;}else I=Inew;}else I=Inew;
    const u=clamp(P+I,-p.vmax,p.vmax);if(Math.abs(u)>=p.vmax-1e-9)sat++;
    tx.push(tt*1000);ix.push(i);ux.push(u);rx.push(ref);
    const ap=st.tog.dly?uPrev:u;i=a*i+b*ap;uPrev=u;}
  const frac=st.t===0?1:clamp((st.t%4)/3,0,1),n=Math.max(2,Math.floor(N*frac));
  const top={x:46,y:22,w:w-58,h:Math.round(h*0.56)-40},bot={x:46,y:Math.round(h*0.56)+16,w:w-58,h:h-Math.round(h*0.56)-46};
  const P1=plotBox(ctx,C,top,[0,20],[-5,45],{nx:10,ny:5,title:'电流：给定（灰虚线）与实际 id（蓝）'});
  pline(ctx,P1,tx,rx,C.muted,1.4,[5,4]);pline(ctx,P1,tx.slice(0,n),ix.slice(0,n),C.acc,2.2);
  const P2=plotBox(ctx,C,bot,[0,20],[-7.5,7.5],{nx:10,ny:4,title:'PI 输出电压 vd 与限幅（红虚线）',xl:'时间 ms'});
  hl(ctx,P2,[0,20],p.vmax,C.bad);hl(ctx,P2,[0,20],-p.vmax,C.bad);pline(ctx,P2,tx.slice(0,n),ux.slice(0,n),C.d,1.8);
  let mx=0,t10=null,t90=null;for(let k=20;k<200;k++){mx=Math.max(mx,ix[k]);if(t10===null&&ix[k]>=2)t10=tx[k];if(t90===null&&ix[k]>=18)t90=tx[k];}
  const os=Math.max(0,(mx-20)/20*100),bw=p.kp/L/TAU;
  info(ctx,C,['ωc = Kp/L → 带宽 ≈ '+bw.toFixed(0)+' Hz','推荐 Ki = ωc·R = '+(p.kp/L*R).toFixed(1),[ '超调 = '+os.toFixed(1)+' %',os>10?C.bad:C.ok],'上升时间 10→90% = '+(t10!==null&&t90!==null?(t90-t10).toFixed(2)+' ms':'未到达'),[ '电压饱和占比 = '+(sat/N*100).toFixed(1)+' %',sat>20?C.warn:C.fg],[ (st.tog.dly&&p.kp*b>=1)?'⚠ Kp·Ts/L ≥ 1：带延迟环路失稳':'',C.bad]].filter(s=>(Array.isArray(s)?s[0]:s)!==''),P1.b.x+P1.b.w*0.52,P1.b.y+16);}});
})();
