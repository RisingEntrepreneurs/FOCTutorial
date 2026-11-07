/* ===================== 重点强化 X 交互动画 ===================== */
(function(){
'use strict';
const {D2R,TAU,clamp,HH,split,inset,plotBox,pline,pfn,hl,vl,info,legend}=window.FOC_DRAW;
const SPECS=window.FOC_ANIM_SPECS;
const PP=4,R=0.012,LD=45e-6,LQ=75e-6,PSI=3.5e-3,TS=50e-6,G=100/4096,IMAX=50,FBW=1000,PWM_CNT=2000;
const Te=(id,iq)=>1.5*PP*(PSI*iq+(LD-LQ)*id*iq);
const A_=PSI/(2*(LQ-LD)),mtpa=iq=>A_-Math.sqrt(A_*A_+iq*iq);
function iqForT(T){let lo=0,hi=80;for(let k=0;k<50;k++){const m=(lo+hi)/2;Te(mtpa(m),m)<T?lo=m:hi=m;}return lo;}
const cols=w=>w>=900?5:(w>=620?4:(w>=440?3:2));
const BOXH=104,GAP=12;
const layoutH=w=>{const c=cols(w);return 16+Math.ceil(10/c)*(BOXH+GAP)+(w>=620?200:380);};

/* 计算某一时刻全链路数值 */
function chain(p,tog,phi){
  const we=PP*p.n/60*TAU,eps=p.eps*D2R,Vmax=0.95*p.vdc/Math.sqrt(3);
  /* 6 给定：MTPA → 弱磁 → 电流圆 */
  let iqR=iqForT(p.te),idR=mtpa(iqR),fw=false,sat=false;
  const vmag=(id,iq)=>Math.hypot(R*id-we*LQ*iq,R*iq+we*(LD*id+PSI));
  if(vmag(idR,iqR)>Vmax){fw=true;while(vmag(idR,iqR)>Vmax&&idR>-IMAX)idR-=0.1;}
  const iqLim=Math.sqrt(Math.max(0,IMAX*IMAX-idR*idR));if(iqR>iqLim){iqR=iqLim;sat=true;}
  if(vmag(idR,iqR)>Vmax){sat=true;let lo=0,hi=iqR;for(let k=0;k<40;k++){const m=(lo+hi)/2;vmag(idR,m)>Vmax?hi=m:lo=m;}iqR=lo;}
  const th=phi,c=Math.cos(th),s=Math.sin(th);
  /* 偏移在控制器 dq 中的等效：A 相偏移 b → αβ (b, b/√3) */
  const b=p.off*G,bd=b*c+b/Math.sqrt(3)*s,bq=-b*s+b/Math.sqrt(3)*c;
  const fe=we/TAU,k=fe/Math.hypot(fe,FBW);              /* 电流环对 1×fe 扰动的抑制程度（近似）*/
  const idA=idR-(1-k)*bd,iqA=iqR-(1-k)*bq;             /* 控制器坐标下实际电流 */
  const iaT=idA*c-iqA*s,ibT0=idA*s+iqA*c,ia_t=iaT,ib_t=-iaT/2+Math.sqrt(3)/2*ibT0;
  const adcA=clamp(Math.round(2048+p.off+ia_t/G),0,4095),adcB=clamp(Math.round(2048+ib_t/G),0,4095);
  const iaM=(adcA-2048)*G,ibM=(adcB-2048)*G;
  const iAl=iaM,iBe=(iaM+2*ibM)/Math.sqrt(3);
  const idM=iAl*c+iBe*s,iqM=-iAl*s+iBe*c;
  /* 真实坐标（零位误差 ε）*/
  const idT=idA*Math.cos(eps)-iqA*Math.sin(eps),iqT=idA*Math.sin(eps)+iqA*Math.cos(eps);
  const vdT=R*idT-we*LQ*iqT,vqT=R*iqT+we*(LD*idT+PSI);
  let vd=vdT*Math.cos(eps)+vqT*Math.sin(eps),vq=-vdT*Math.sin(eps)+vqT*Math.cos(eps);
  const vdFF=-we*LQ*iqR,vqFF=we*(LD*idR+PSI);
  const vm=Math.hypot(vd,vq),vSat=vm>Vmax;if(vSat){vd*=Vmax/vm;vq*=Vmax/vm;}
  const thc=th+(tog.comp?1.5*we*TS:0),cc=Math.cos(thc),sc=Math.sin(thc);
  const vAl=vd*cc-vq*sc,vBe=vd*sc+vq*cc;
  const va=vAl,vb=-vAl/2+Math.sqrt(3)/2*vBe,vc=-vAl/2-Math.sqrt(3)/2*vBe,v0=-(Math.max(va,vb,vc)+Math.min(va,vb,vc))/2;
  const du=x=>clamp(0.5+(x+v0)/p.vdc,0.03,0.94);
  const dA=du(va),dB=du(vb),dC=du(vc);
  const thE16=Math.round(((th%TAU+TAU)%TAU)/TAU*65536)%65536;
  return {we,fe,Vmax,idR,iqR,fw,sat,adcA,adcB,iaM,ibM,iAl,iBe,idM,iqM,idT,iqT,teRef:Te(idR,iqR),teAct:Te(idT,iqT),vd,vq,vdFF,vqFF,vm:Math.hypot(vd,vq),vSat,vAl,vBe,dA,dB,dC,thE16,dth:we*TS/D2R,thc};
}
const STAGE={off:1,eps:4,n:4,te:6,vdc:8,comp:9};
SPECS.push({host:'anim-X1',title:'端到端数据流追踪：拖动任一参数，观察它从源头一路传导到 PWM 寄存器',h:layoutH,
 params:[{k:'n',label:'转速',min:0,max:8000,step:100,v:2000,unit:'rpm',dp:0},{k:'te',label:'力矩需求',min:0,max:1.2,step:0.01,v:0.5,unit:'N·m',dp:2},{k:'off',label:'A 相偏移误差',min:-40,max:40,step:1,v:0,unit:'cnt',dp:0},{k:'eps',label:'零位误差 ε',min:-40,max:40,step:1,v:0,unit:'°e',dp:0},{k:'vdc',label:'母线电压 Vdc',min:9,max:16,step:0.1,v:12,unit:'V',dp:1}],
 toggles:[{k:'comp',label:'反 Park 延迟补偿（1.5Ts）',v:true}],
 draw(ctx,w,h,st,C){const p=st.p;
  /* 检测参数变化 → 传导高亮 */
  const cur=JSON.stringify([p,st.tog]);if(st._prev&&st._prev!==cur){const old=JSON.parse(st._prev);let s0=99;Object.keys(p).forEach(k=>{if(old[0][k]!==p[k])s0=Math.min(s0,STAGE[k]);});Object.keys(st.tog).forEach(k=>{if(old[1][k]!==st.tog[k])s0=Math.min(s0,STAGE[k]);});if(s0<99)st._hl={s:s0,t0:performance.now()};}
  st._prev=cur;
  const phi=TAU*0.15*st.t+0.6,v=chain(p,st.tog,phi);
  const f1=x=>x.toFixed(1),f2=x=>x.toFixed(2),f3=x=>x.toFixed(3),q15=(x,b)=>Math.round(clamp(x/b*32768,-32768,32767));
  const boxes=[
   ['ADC 码值','adcIa = '+v.adcA,'adcIb = '+v.adcB,'零点 2048'+(p.off?'（实际 '+(2048+p.off)+'）':'')],
   ['偏移 / 增益换算','ia = '+f2(v.iaM)+' A','ib = '+f2(v.ibM)+' A','Q15: '+q15(v.iaM,50)+' / '+q15(v.ibM,50)],
   ['Clarke','iα = '+f2(v.iAl)+' A','iβ = '+f2(v.iBe)+' A','|i| = '+f2(Math.hypot(v.iAl,v.iBe))+' A'],
   ['角度','θe = '+(v.thE16/65536*360).toFixed(1)+'°','uint16 = '+v.thE16,'Δθ/Ts = '+f2(v.dth)+'°'],
   ['Park（测得）','id = '+f2(v.idM)+' A','iq = '+f2(v.iqM)+' A',p.eps?'⚠ 坐标偏 '+p.eps+'°':'坐标正确'],
   ['给定 MTPA/弱磁','Te* = '+f2(p.te)+' N·m','idRef = '+f2(v.idR)+' A','iqRef = '+f2(v.iqR)+(v.fw?' 弱磁':'')+(v.sat?' 限幅':'')],
   ['电流环+前馈','vd = '+f3(v.vd)+' V','vq = '+f3(v.vq)+' V','前馈 '+f2(v.vdFF)+' / '+f2(v.vqFF)],
   ['电压限幅','|v| = '+f2(v.vm)+' V','vMax = '+f2(v.Vmax)+' V','利用率 '+(v.vm/v.Vmax*100).toFixed(0)+'%'+(v.vSat?' 饱和':'')],
   ['反 Park','vα = '+f3(v.vAl)+' V','vβ = '+f3(v.vBe)+' V','θc = θ'+(st.tog.comp?'+'+f1(1.5*v.dth)+'°':'（未补偿）')],
   ['SVPWM→寄存器','d = '+[v.dA,v.dB,v.dC].map(x=>x.toFixed(3)).join('/'),'CMP = '+[v.dA,v.dB,v.dC].map(x=>Math.round(x*PWM_CNT)).join('/'),'周期计数 '+PWM_CNT]];
  const nc=cols(w),bw=(w-16-(nc-1)*GAP)/nc,now=performance.now();let active=false;
  boxes.forEach((b,i)=>{const r=Math.floor(i/nc),cI=i%nc,x=8+cI*(bw+GAP),y=10+r*(BOXH+GAP),idx=i+1;
    let lit=0;if(st._hl&&idx>=st._hl.s){const dt=now-st._hl.t0-(idx-st._hl.s)*180;if(dt>0&&dt<1400){lit=1-dt/1400;}if(dt<1400)active=true;}
    ctx.fillStyle=C.panel;ctx.fillRect(x,y,bw,BOXH);
    if(lit>0){ctx.globalAlpha=0.55*lit;ctx.fillStyle=C.warn;ctx.fillRect(x,y,bw,BOXH);ctx.globalAlpha=1;}
    ctx.strokeStyle=lit>0?C.warn:C.acc;ctx.lineWidth=lit>0?2.5:1.2;ctx.strokeRect(x,y,bw,BOXH);ctx.lineWidth=1;
    ctx.fillStyle=C.acc;ctx.font='bold 12px system-ui';ctx.textAlign='left';ctx.fillText(idx+'. '+b[0],x+6,y+17);
    ctx.fillStyle=C.fg;ctx.font='11.5px ui-monospace,Consolas,monospace';for(let j=1;j<4;j++){const t=b[j];ctx.fillStyle=t.indexOf('⚠')>=0||t.indexOf('饱和')>=0?C.bad:C.fg;ctx.fillText(t,x+6,y+17+j*22);}
    if(i<9){ctx.fillStyle=C.axis;if(cI<nc-1){ctx.beginPath();ctx.moveTo(x+bw+2,y+BOXH/2-5);ctx.lineTo(x+bw+GAP-2,y+BOXH/2);ctx.lineTo(x+bw+2,y+BOXH/2+5);ctx.fill();}else{ctx.font='11px system-ui';ctx.textAlign='right';ctx.fillText('↩',x+bw-4,y+BOXH-4);}}});
  if(active&&st.req)st.req();
  /* 底部曲线：一个电周期 */
  const top=16+Math.ceil(10/nc)*(BOXH+GAP),area={x:0,y:top,w,h:h-top},S=split(area.w,area.h);S.L.y+=top;S.R.y+=top;
  const ser=f=>{const xs=[],ys=[];for(let i=0;i<=180;i++){const ph=TAU*i/180;xs.push(i*2);ys.push(f(chain(p,st.tog,ph)));}return[xs,ys];};
  const [x1,yq]=ser(c=>c.iqM),[,yd]=ser(c=>c.idM),[,yt]=ser(c=>c.teAct);
  const lim=Math.max(5,Math.ceil(Math.max(...yq.map(Math.abs),...yd.map(Math.abs))*1.2/5)*5);
  const P1=plotBox(ctx,C,inset(S.L,44,22,10,30),[0,360],[-lim,lim],{nx:4,ny:4,title:'控制器测得 id（紫）iq（橙），一个电周期',xl:'电角度 (°)'});
  pline(ctx,P1,x1,yd,C.d,1.8);pline(ctx,P1,x1,yq,C.q,1.8);vl(ctx,P1,[-lim,lim],((phi%TAU)/D2R+360)%360,C.muted);
  const tl=Math.max(0.3,Math.ceil(Math.max(...yt,p.te)*1.3*10)/10);
  const P2=plotBox(ctx,C,inset(S.R,44,22,10,30),[0,360],[0,tl],{nx:4,ny:4,title:'实际电磁力矩（蓝）vs 需求（灰）N·m',xl:'电角度 (°)'});
  hl(ctx,P2,[0,360],p.te,C.muted);pline(ctx,P2,x1,yt,C.acc,2);
  const rip=Math.max(...yt)-Math.min(...yt),mean=yt.reduce((a,b)=>a+b,0)/yt.length;
  info(ctx,C,['实际平均力矩 '+mean.toFixed(3)+' N·m（'+(p.te>0?(mean/p.te*100).toFixed(1):'—')+'%）',['力矩脉动 '+(rip*1000).toFixed(1)+' mN·m 峰峰',rip>0.005?C.bad:C.ok],v.fw?['弱磁区：idRef 已自动变负',C.warn]:'基速以下：MTPA',v.sat?['电压 / 电流受限：力矩不足',C.bad]:''].filter(s=>s!==''),P2.b.x+8,P2.b.y+16);}});

/* ---------- X2 float 角度累加精度 ---------- */
SPECS.push({host:'anim-X2',title:'float32 不取模累加电角度：每步增量的相对误差随运行时间增长',h:HH,
 params:[{k:'fe',label:'电频率（开环拖动）',min:1,max:200,step:1,v:20,unit:'Hz',dp:0},{k:'hrs',label:'显示时长',min:0.1,max:10,step:0.1,v:1,unit:'h',dp:1}],
 draw(ctx,w,h,st,C){const p=st.p,inc=TAU*p.fe*TS,Tmax=p.hrs*3600;
  const relErr=t=>{const th=Math.max(inc,TAU*p.fe*t);const ulp=Math.pow(2,Math.floor(Math.log2(th))-23);const q=Math.round(inc/ulp)*ulp;return Math.abs(q-inc)/inc*100;};
  const ulpRatio=t=>{const th=Math.max(inc,TAU*p.fe*t);return Math.pow(2,Math.floor(Math.log2(th))-23)/inc;};
  const S=split(w,h);
  const P1=plotBox(ctx,C,inset(S.L,46,22,10,30),[0,Tmax/60],[0,100],{nx:4,ny:5,title:'每步增量相对误差（%）',xl:'运行时间 min'});
  pfn(ctx,P1,m=>Math.min(100,relErr(m*60)),0,Tmax/60,400,C.bad,1.8);hl(ctx,P1,[0,Tmax/60],1,C.warn);
  const P2=plotBox(ctx,C,inset(S.R,46,22,10,30),[0,Tmax/60],[-12,4],{nx:4,ny:4,title:'log₂(ULP(θ) / Δθ)：> −1 时增量严重量化',xl:'运行时间 min',yf:v=>v.toFixed(0)});
  pfn(ctx,P2,m=>clamp(Math.log2(ulpRatio(m*60)),-12,4),0,Tmax/60,400,C.d,1.8);hl(ctx,P2,[0,Tmax/60],-1,C.bad);
  let t1=null;for(let m=0;m<=Tmax/60;m+=Tmax/60/2000){if(relErr(m*60)>1){t1=m;break;}}
  info(ctx,C,['Δθ = 2π·fe·Ts = '+inc.toExponential(3)+' rad',t1!==null?['误差首次 > 1%：约 '+t1.toFixed(1)+' min',C.bad]:['显示时长内误差 < 1%',C.ok],'uint32 相位累加器：分辨率 2π/2³² 恒定','修复：θ 每步对 2π 取模或用整数累加'],P2.b.x+8,P2.b.y+P2.b.h*0.55);}});
})();
