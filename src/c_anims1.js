/* ===================== 模块 C 交互动画（一）C01–C06 ===================== */
(function(){
'use strict';
const {D2R,TAU,clamp,HH,split,inset,plotBox,pline,pfn,hl,vl,arrow,dline,info,legend,hr,plane}=window.FOC_DRAW;
const SPECS=window.FOC_ANIM_SPECS;

/* ---------- C01 偏移校准 ---------- */
SPECS.push({host:'anim-C01',title:'上电偏移校准：累加平均收敛与失败模式',h:HH,
 params:[{k:'N',label:'平均次数 N',min:16,max:2048,step:16,v:1024,dp:0},{k:'sig',label:'ADC 噪声 σ',min:0,max:12,step:0.5,v:4,unit:'cnt',dp:1}],
 toggles:[{k:'early',label:'运放稳定前就开始校准',v:false},{k:'cur',label:'校准期间有电流（PWM 未关）',v:false}],
 draw(ctx,w,h,st,C){const p=st.p,S=split(w,h),z=2061,G=100/4096;
  const shown=st.t===0?p.N:Math.min(p.N,Math.floor(st.t*600));
  const sx=[],sy=[],ex=[],ey=[];let acc=0;
  for(let k=0;k<shown;k++){let v=z+p.sig*hr(k*1.7)*1.73;if(st.tog.early)v-=40*Math.exp(-k/(p.N*0.15));if(st.tog.cur)v+=6*Math.sin(k*0.07)+3;v=Math.round(v);acc+=v;if(k%Math.max(1,Math.floor(p.N/300))===0){sx.push(k);sy.push(v);ex.push(k);ey.push(acc/(k+1));}}
  const est=shown?acc/shown:z,err=est-z;
  const P1=plotBox(ctx,C,inset(S.L,48,22,10,30),[0,p.N],[z-50,z+30],{nx:4,ny:4,title:'ADC 采样点（灰）与累加平均（橙）',xl:'采样序号'});
  ctx.fillStyle=C.muted;sx.forEach((x,i)=>{ctx.fillRect(P1.X(x)-1,P1.Y(sy[i])-1,2,2);});pline(ctx,P1,ex,ey,C.q,2.2);hl(ctx,P1,[0,p.N],z,C.ok);
  const P2=plotBox(ctx,C,inset(S.R,40,22,10,30),[0,0.05],[-3,3],{nx:5,ny:6,title:'用该偏移运行时 iq 纹波（1×fe，1000 rpm）',xl:'时间 s'});
  const rip=Math.abs(err)*G;pfn(ctx,P2,t=>rip*Math.sin(TAU*66.7*t),0,0.05,300,C.q,2);
  info(ctx,C,['真实零点 = '+z+' cnt','估计值 = '+est.toFixed(2)+' cnt',['误差 = '+err.toFixed(2)+' cnt = '+(err*G).toFixed(3)+' A',Math.abs(err)>1?C.bad:C.ok],'理论噪声残差 σ/√N = '+(p.sig/Math.sqrt(p.N)).toFixed(2)+' cnt',['iq 1×fe 纹波 ≈ '+rip.toFixed(3)+' A',rip>0.05?C.bad:C.ok]],P2.b.x+8,P2.b.y+16);}});

/* ---------- C02 Clarke 合成 ---------- */
SPECS.push({host:'anim-C02',title:'Clarke：三个相轴分矢量合成空间矢量 i_s',h:HH,
 params:[{k:'I',label:'相电流峰值',min:5,max:40,step:1,v:30,unit:'A',dp:0},{k:'ang',label:'电流电角度',min:0,max:360,step:1,v:30,unit:'°',dp:0}],
 toggles:[{k:'pow',label:'使用功率不变系数 √(2/3)',v:false},{k:'brk',label:'C 相断线（ic = 0，但软件仍按平衡计算）',v:false}],
 draw(ctx,w,h,st,C){const p=st.p,S=split(w,h),G=plane(ctx,C,inset(S.L,8,10,8,8),50,['α (A)','β']);
  const th=(p.ang+st.t*40)*D2R;let ia=p.I*Math.cos(th),ib=p.I*Math.cos(th-TAU/3),ic=p.I*Math.cos(th+TAU/3);
  if(st.tog.brk){ic=0;const m=(ia+ib)/2;ia-=m;ib-=m;}
  [[0,'A',C.a],[120,'B',C.b],[240,'C',C.c]].forEach(([a,n,col])=>{const E=G.S(48*Math.cos(a*D2R),48*Math.sin(a*D2R));dline(ctx,G.cx,G.cy,E[0],E[1],col);ctx.fillStyle=col;ctx.font='11px system-ui';ctx.fillText(n+' 轴',E[0]+2,E[1]);});
  const K=st.tog.pow?Math.sqrt(2/3):2/3;const comps=[[ia,0,C.a,'ia'],[ib,120,C.b,'ib'],[ic,240,C.c,'ic']];
  let x=0,y=0;comps.forEach(([v,a,col,lab])=>{const dx=K*v*Math.cos(a*D2R),dy=K*v*Math.sin(a*D2R);const P0=G.S(x,y),P1=G.S(x+dx,y+dy);arrow(ctx,P0[0],P0[1],P1[0],P1[1],col,1.8,lab);x+=dx;y+=dy;});
  const Ps=G.S(x,y);arrow(ctx,G.cx,G.cy,Ps[0],Ps[1],C.warn,3.4,'i_s');
  const Px=G.S(x,0),Py=G.S(0,y);dline(ctx,Ps[0],Ps[1],Px[0],Px[1],C.muted);dline(ctx,Ps[0],Ps[1],Py[0],Py[1],C.muted);
  const P=plotBox(ctx,C,inset(S.R,40,22,10,30),[-3,0],[-50,50],{nx:3,ny:4,title:'iα（=ia）与 iβ 时域',xl:'s'});
  const fA=t=>{const a=(p.ang+(st.t+t)*40)*D2R;return K*1.5*p.I*Math.cos(a);},fB=t=>{const a=(p.ang+(st.t+t)*40)*D2R;return K*1.5*p.I*Math.sin(a);};
  if(!st.tog.brk){pfn(ctx,P,fA,-3,0,200,C.a,2);pfn(ctx,P,fB,-3,0,200,C.q,2);legend(ctx,C,[['iα',C.a],['iβ',C.q]],P.b.x+8,P.b.y+P.b.h-8);}
  const mag=Math.hypot(x,y);
  info(ctx,C,['iα = '+x.toFixed(1)+'  iβ = '+y.toFixed(1),['|i_s| = '+mag.toFixed(1)+' A（相峰值 '+p.I+' A）',Math.abs(mag-p.I)<0.5?C.ok:C.bad],st.tog.pow?['功率不变：|i_s| = √(3/2)·峰值',C.warn]:'幅值不变：|i_s| = 峰值',st.tog.brk?['C 相断线：矢量不再是圆轨迹',C.bad]:''].filter(s=>s!==''),P.b.x+8,P.b.y+16);}});

/* ---------- C03 延迟补偿 ---------- */
SPECS.push({host:'anim-C03',title:'反 Park 延迟补偿：θc = θ + Kc·ωe·Ts',h:HH,
 params:[{k:'n',label:'转速',min:0,max:8000,step:100,v:6000,unit:'rpm',dp:0},{k:'kc',label:'补偿系数 Kc',min:-2,max:3,step:0.1,v:0,dp:1},{k:'kt',label:'实际延迟（×Ts）',min:0.5,max:3,step:0.1,v:1.5,dp:1}],
 draw(ctx,w,h,st,C){const p=st.p,S=split(w,h),Ts=50e-6,G=plane(ctx,C,inset(S.L,8,10,8,8),1.3,['α','β']);
  const dth=n=>4*n/60*TAU*Ts/D2R, errDeg=n=>(p.kc-p.kt)*dth(n);
  const th0=(st.t*60)%360*D2R,thAct=th0+p.kt*dth(p.n)*D2R;
  const d0=G.S(1.2*Math.cos(th0),1.2*Math.sin(th0)),d1=G.S(1.2*Math.cos(thAct),1.2*Math.sin(thAct));
  dline(ctx,G.cx,G.cy,d0[0],d0[1],C.muted,1.4);arrow(ctx,G.cx,G.cy,d1[0],d1[1],C.d,2,'d（生效时）');
  const q1=G.S(1.2*Math.cos(thAct+Math.PI/2),1.2*Math.sin(thAct+Math.PI/2));dline(ctx,G.cx,G.cy,q1[0],q1[1],C.q,1.2);
  const va=th0+p.kc*dth(p.n)*D2R+Math.PI/2;const V=G.S(Math.cos(va),Math.sin(va));arrow(ctx,G.cx,G.cy,V[0],V[1],C.warn,3,'v（期望在 q）');
  const P=plotBox(ctx,C,inset(S.R,46,22,10,30),[0,8000],[-45,45],{nx:4,ny:6,title:'电压角误差 vs 转速（°电角度）',xl:'转速 rpm'});
  pfn(ctx,P,n=>-p.kt*dth(n),0,8000,50,C.muted,1.6,[5,4]);pfn(ctx,P,errDeg,0,8000,50,C.bad,2.2);vl(ctx,P,[-45,45],p.n,C.warn);
  legend(ctx,C,[['未补偿',C.muted],['当前 Kc',C.bad]],P.b.x+8,P.b.y+P.b.h-8);
  const e=errDeg(p.n);
  info(ctx,C,['Δθ/周期 = '+dth(p.n).toFixed(2)+'°','未补偿误差 = '+(-p.kt*dth(p.n)).toFixed(1)+'°',['当前误差 = '+e.toFixed(1)+'°',Math.abs(e)>2?C.bad:C.ok],'力矩系数 cos(误差) = '+(Math.cos(e*D2R)*100).toFixed(1)+'%'],P.b.x+8,P.b.y+16);}});

/* ---------- C04 SVPWM ---------- */
SPECS.push({host:'anim-C04',title:'SVPWM：六边形、扇区、T1/T2 与马鞍形占空比',h:w=>w>=620?360:680,
 params:[{k:'m',label:'调制幅值 |v|/(Vdc/√3)',min:0.1,max:1.25,step:0.01,v:0.9,dp:2},{k:'f',label:'旋转速度（演示）',min:0.05,max:0.5,step:0.05,v:0.15,unit:'Hz',dp:2}],
 toggles:[{k:'clip',label:'六边形截断（过调制处理）',v:true}],
 draw(ctx,w,h,st,C){const p=st.p,S=split(w,h),Vdc=1,r=inset(S.L,8,10,8,8),cx=r.x+r.w/2,cy=r.y+r.h/2,R=Math.min(r.w,r.h)*0.42,k=R/(2/3);
  const th=(TAU*p.f*st.t)%TAU,sec=Math.floor(th/(Math.PI/3));
  const V=i=>[2/3*Math.cos(i*Math.PI/3),2/3*Math.sin(i*Math.PI/3)],P=(x,y)=>[cx+x*k,cy-y*k];
  ctx.fillStyle=C.panel;ctx.beginPath();for(let i=0;i<6;i++){const q=P(...V(i));i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]);}ctx.closePath();ctx.fill();
  const a=P(...V(sec)),b=P(...V(sec+1));ctx.fillStyle=C.acc;ctx.globalAlpha=0.15;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.closePath();ctx.fill();ctx.globalAlpha=1;
  ctx.strokeStyle=C.axis;ctx.beginPath();for(let i=0;i<=6;i++){const q=P(...V(i));i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]);}ctx.stroke();
  ctx.strokeStyle=C.ok;ctx.setLineDash([4,4]);ctx.beginPath();ctx.arc(cx,cy,(1/Math.sqrt(3))*k,0,TAU);ctx.stroke();ctx.setLineDash([]);
  const names=['100','110','010','011','001','101'];ctx.font='10.5px ui-monospace';for(let i=0;i<6;i++){const q=P(...V(i));ctx.fillStyle=C.muted;ctx.fillText('V'+(i+1)+'('+names[i]+')',q[0]+(Math.cos(i*Math.PI/3)>0.1?2:(Math.cos(i*Math.PI/3)<-0.1?-40:-24)),q[1]+(Math.sin(i*Math.PI/3)>0.1?-6:14));
    const mid=P(0.42*Math.cos((i+0.5)*Math.PI/3),0.42*Math.sin((i+0.5)*Math.PI/3));ctx.fillStyle=i===sec?C.acc:C.muted;ctx.fillText(['Ⅰ','Ⅱ','Ⅲ','Ⅳ','Ⅴ','Ⅵ'][i],mid[0]-4,mid[1]+4);}
  const duty=(ang,mag)=>{let va=mag*Math.cos(ang),vb=mag*Math.cos(ang-TAU/3),vc=mag*Math.cos(ang+TAU/3);const mx=Math.max(va,vb,vc),mn=Math.min(va,vb,vc),v0=-(mx+mn)/2;let kk=1;const span=mx-mn;if(st.tog.clip&&span>Vdc)kk=Vdc/span;return[0.5+kk*(va+v0)/Vdc,0.5+kk*(vb+v0)/Vdc,0.5+kk*(vc+v0)/Vdc,kk];};
  const mag=p.m/Math.sqrt(3),dd=duty(th,mag);const vr=mag*dd[3],Vt=P(vr*Math.cos(th),vr*Math.sin(th));
  const tp=th-sec*Math.PI/3,T1=Math.sqrt(3)*vr*Math.sin(Math.PI/3-tp),T2=Math.sqrt(3)*vr*Math.sin(tp);
  const v1=V(sec),v2=V(sec+1);
  const s1=[v1[0]*T1,v1[1]*T1];const A1=P(s1[0],s1[1]),A2=P(s1[0]+v2[0]*T2,s1[1]+v2[1]*T2);
  arrow(ctx,cx,cy,A1[0],A1[1],C.a,1.8,'T1');arrow(ctx,A1[0],A1[1],A2[0],A2[1],C.b,1.8,'T2');arrow(ctx,cx,cy,Vt[0],Vt[1],C.warn,3,'v*');
  const Pp=plotBox(ctx,C,inset(S.R,40,22,10,30),[0,360],[-0.2,1.2],{nx:6,ny:7,title:'三相占空比（min-max 实现）',xl:'电角度 (°)'});
  hl(ctx,Pp,[0,360],1,C.bad);hl(ctx,Pp,[0,360],0,C.bad);
  [0,1,2].forEach((j,ji)=>pfn(ctx,Pp,x=>duty(x*D2R,mag)[j],0,360,240,[C.a,C.b,C.c][ji],1.8));vl(ctx,Pp,[-0.2,1.2],th/D2R,C.warn);
  legend(ctx,C,[['dA',C.a],['dB',C.b],['dC',C.c]],Pp.b.x+8,Pp.b.y+Pp.b.h-8);
  const over=dd.slice(0,3).some(v=>v>1.0001||v<-0.0001);
  info(ctx,C,['扇区 '+['Ⅰ','Ⅱ','Ⅲ','Ⅳ','Ⅴ','Ⅵ'][sec]+'，θ\' = '+(tp/D2R).toFixed(0)+'°','T1/Ts = '+T1.toFixed(3)+'  T2/Ts = '+T2.toFixed(3),'T0/Ts = '+(1-T1-T2).toFixed(3),p.m>1?[st.tog.clip?'过调制：已截到六边形（平顶）':'⚠ 未处理：占空比超出 [0,1]',st.tog.clip?C.warn:C.bad]:['线性区',C.ok],over?['⚠ duty 越界 → 硬件削顶',C.bad]:''].filter(s=>s!==''),Pp.b.x+8,Pp.b.y+16);}});

/* ---------- C05 解耦 ---------- */
SPECS.push({host:'anim-C05',title:'dq 交叉耦合与解耦前馈：iq 阶跃时 id 的扰动',h:w=>w>=620?380:520,
 params:[{k:'n',label:'转速',min:0,max:6000,step:100,v:2500,unit:'rpm',dp:0},{k:'perr',label:'前馈参数误差',min:-50,max:50,step:5,v:0,unit:'%',dp:0}],
 toggles:[{k:'ff',label:'启用解耦前馈（−ωLq·iq，ω(Ld·id+ψf)）',v:false}],
 draw(ctx,w,h,st,C){const p=st.p,R=0.012,Ld=45e-6,Lq=75e-6,psi=3.5e-3,Ts=50e-6,N=300,we=4*p.n/60*TAU,ke=1+p.perr/100;
  const ad=Math.exp(-R*Ts/Ld),bd=(1-ad)/R,aq=Math.exp(-R*Ts/Lq),bq=(1-aq)/R,wc=TAU*1000;
  const Kpd=wc*Ld,Kid=wc*R,Kpq=wc*Lq,Kiq=wc*R;let id=0,iq=0,Id=0,Iq=0,ud0=0,uq0=0;const tx=[],dx=[],qx=[],vdx=[],vqx=[];
  /* 初始化：稳态反电动势 */Iq=st.tog.ff?0:we*psi;
  for(let k=0;k<N;k++){const t=k*Ts,iqr=t<1e-3?0:20,idr=0;
    const fd=st.tog.ff?-we*Lq*ke*iq:0,fq=st.tog.ff?we*(Ld*ke*id+psi*ke):0;
    Id+=Kid*Ts*(idr-id);Iq+=Kiq*Ts*(iqr-iq);const ud=clamp(Kpd*(idr-id)+Id+fd,-6.6,6.6),uq=clamp(Kpq*(iqr-iq)+Iq+fq,-6.6,6.6);
    tx.push(t*1000);dx.push(id);qx.push(iq);vdx.push(ud);vqx.push(uq);
    const ed=-we*Lq*iq,eq=we*(Ld*id+psi);
    const nid=ad*id+bd*(ud0-ed),niq=aq*iq+bq*(uq0-eq);id=nid;iq=niq;ud0=ud;uq0=uq;}
  const top={x:46,y:22,w:w-58,h:Math.round(h*0.55)-40},bot={x:46,y:Math.round(h*0.55)+16,w:w-58,h:h-Math.round(h*0.55)-46};
  const P1=plotBox(ctx,C,top,[0,15],[-25,40],{nx:5,ny:5,title:'iq（橙）阶跃 0→20 A 时 id（紫）的扰动'});
  pline(ctx,P1,[0,1,1,15],[0,0,20,20],C.muted,1.2,[5,4]);pline(ctx,P1,tx,qx,C.q,2);pline(ctx,P1,tx,dx,C.d,2);
  const P2=plotBox(ctx,C,bot,[0,15],[-7,7],{nx:5,ny:4,title:'vd（紫）vq（橙），限幅 ±6.6 V',xl:'时间 ms'});
  pline(ctx,P2,tx,vdx,C.d,1.6);pline(ctx,P2,tx,vqx,C.q,1.6);
  let mx=0;for(const v of dx)mx=Math.max(mx,Math.abs(v));let t90=null;for(let i=0;i<N;i++)if(t90===null&&tx[i]>1&&qx[i]>=18)t90=tx[i]-1;
  const vNeed=Math.hypot(we*Lq*20,R*20+we*psi);
  info(ctx,C,['ωe = '+we.toFixed(0)+' rad/s，ωLq·20A = '+(we*Lq*20).toFixed(2)+' V',vNeed>6.6?['⚠ 稳态需 '+vNeed.toFixed(1)+' V > 6.6 V：电压饱和，需弱磁（C07）',C.bad]:'稳态所需电压 '+vNeed.toFixed(1)+' V',['id 最大偏离 = '+mx.toFixed(1)+' A',mx>3?C.bad:C.ok],'iq 达 90% 用时 = '+(t90!==null?t90.toFixed(2)+' ms':'未达到'),st.tog.ff?(p.perr!==0?['参数误差 '+p.perr+'% → 解耦残差',C.warn]:['前馈参数准确',C.ok]):['未解耦',C.warn]],P1.b.x+P1.b.w*0.45,P1.b.y+16);}});

/* ---------- C06 MTPA ---------- */
SPECS.push({host:'anim-C06',title:'MTPA：等转矩曲线与电流圆的切点',h:HH,
 params:[{k:'te',label:'转矩需求',min:0.1,max:1.5,step:0.01,v:0.8,unit:'N·m',dp:2},{k:'lq',label:'Lq（Ld = 45 µH）',min:45,max:150,step:1,v:75,unit:'µH',dp:0}],
 toggles:[{k:'z',label:'对比 id = 0 方案',v:true}],
 draw(ctx,w,h,st,C){const p=st.p,S=split(w,h),pp=4,psi=3.5e-3,Ld=45e-6,Lq=p.lq*1e-6,dL=Lq-Ld;
  const r=inset(S.L,36,14,10,26),sc=Math.min(r.w/78,r.h/84),X=v=>r.x+(v+72)*sc,Y=v=>r.y+r.h-v*sc;
  const Te=(id,iq)=>1.5*pp*(psi*iq+(Ld-Lq)*id*iq),iqFor=(id,T)=>T/(1.5*pp*(psi-dL*id));
  ctx.strokeStyle=C.axis;ctx.beginPath();ctx.moveTo(X(-70),Y(0));ctx.lineTo(X(10),Y(0));ctx.moveTo(X(0),Y(0));ctx.lineTo(X(0),Y(80));ctx.stroke();
  ctx.fillStyle=C.muted;ctx.font='11px system-ui';ctx.fillText('id (A)',X(-70),Y(0)+14);ctx.fillText('iq (A)',X(0)+4,Y(78));
  for(let rr=20;rr<=80;rr+=20){ctx.strokeStyle=C.grid;ctx.beginPath();ctx.arc(X(0),Y(0),rr*sc,Math.PI,1.5*Math.PI);ctx.stroke();ctx.fillStyle=C.muted;ctx.fillText(rr+'A',X(-rr*0.71)-14,Y(rr*0.71)-2);}
  [0.4,0.8,1.2,1.6].forEach(T=>{ctx.strokeStyle=C.c;ctx.globalAlpha=0.5;ctx.beginPath();for(let i=0;i<=100;i++){const id=-70*i/100,iq=iqFor(id,T);const yy=Y(Math.min(iq,85));i?ctx.lineTo(X(id),yy):ctx.moveTo(X(id),yy);}ctx.stroke();ctx.globalAlpha=1;});
  const a=psi/(2*dL);const mt=iq=>dL>1e-9?a-Math.sqrt(a*a+iq*iq):0;
  ctx.strokeStyle=C.ok;ctx.lineWidth=2;ctx.setLineDash([5,4]);ctx.beginPath();for(let i=0;i<=80;i++){const iq=i,id=mt(iq);i?ctx.lineTo(X(id),Y(iq)):ctx.moveTo(X(id),Y(iq));}ctx.stroke();ctx.setLineDash([]);ctx.lineWidth=1;
  let lo=0,hi=200;for(let k=0;k<60;k++){const m=(lo+hi)/2;Te(mt(m),m)<p.te?lo=m:hi=m;}const iqM=lo,idM=mt(iqM),isM=Math.hypot(idM,iqM);
  const iq0=p.te/(1.5*pp*psi);
  ctx.strokeStyle=C.c;ctx.lineWidth=2;ctx.beginPath();for(let i=0;i<=100;i++){const id=-70*i/100,iq=iqFor(id,p.te);i?ctx.lineTo(X(id),Y(Math.min(iq,85))):ctx.moveTo(X(id),Y(Math.min(iq,85)));}ctx.stroke();ctx.lineWidth=1;
  ctx.strokeStyle=C.warn;ctx.setLineDash([3,3]);ctx.beginPath();ctx.arc(X(0),Y(0),isM*sc,Math.PI,1.5*Math.PI);ctx.stroke();ctx.setLineDash([]);
  ctx.fillStyle=C.warn;ctx.beginPath();ctx.arc(X(idM),Y(iqM),5,0,TAU);ctx.fill();
  if(st.tog.z){ctx.fillStyle=C.bad;ctx.beginPath();ctx.arc(X(0),Y(iq0),4.5,0,TAU);ctx.fill();}
  const P=plotBox(ctx,C,inset(S.R,46,22,10,30),[0,1.6],[0,70],{nx:4,ny:7,title:'所需电流 |is| vs 转矩',xl:'Te (N·m)'});
  const isFor=T=>{let l=0,hh=300;for(let k=0;k<50;k++){const m=(l+hh)/2;Te(mt(m),m)<T?l=m:hh=m;}return Math.hypot(mt(l),l);};
  pfn(ctx,P,isFor,0,1.6,80,C.ok,2);pfn(ctx,P,T=>T/(1.5*pp*psi),0,1.6,10,C.bad,1.6,[5,4]);vl(ctx,P,[0,70],p.te,C.warn);
  legend(ctx,C,[['MTPA',C.ok],['id = 0',C.bad]],P.b.x+8,P.b.y+P.b.h-8);
  info(ctx,C,['MTPA：id = '+idM.toFixed(1)+' A，iq = '+iqM.toFixed(1)+' A',['|is| = '+isM.toFixed(1)+' A',C.ok],'id = 0：|is| = '+iq0.toFixed(1)+' A',['电流节省 '+((1-isM/iq0)*100).toFixed(1)+' %',C.ok]],P.b.x+8,P.b.y+16);}});
})();
