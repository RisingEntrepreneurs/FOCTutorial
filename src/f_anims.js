/* ===================== 模块 F 交互动画 ===================== */
(function(){
'use strict';
const {TAU,clamp,HH,split,inset,plotBox,pline,hl,info,legend}=window.FOC_DRAW;
const SPECS=window.FOC_ANIM_SPECS;

/* ---------- F01 FOC vs DTC 转矩响应（教学简化）---------- */
SPECS.push({host:'anim-F01',title:'转矩阶跃：FOC（电流环 + 固定频率 PWM）vs 经典 DTC（转矩滞环）',h:HH,
 params:[{k:'band',label:'DTC 转矩滞环宽度',min:0.01,max:0.2,step:0.005,v:0.06,unit:'N·m',dp:3},{k:'fs',label:'DTC 采样频率',min:10,max:80,step:5,v:40,unit:'kHz',dp:0},{k:'fbw',label:'FOC 电流环带宽',min:200,max:2000,step:50,v:1000,unit:'Hz',dp:0}],
 draw(ctx,w,h,st,C){const p=st.p,dt=2e-6,T=0.004,N=T/dt,Kt=0.021,L=75e-6,psi=3.5e-3,we=1256.6,E=we*psi,V=6.93,Tref=t=>t<0.0005?0.2:0.6;
  /* DTC：q 轴电流积分模型，滞环决定施加 ±V 或零矢量（简化）*/
  let iq=0.2/Kt,u=0,cnt=0,sw=0;const tx=[],dx=[],fx=[];const Ts=1/(p.fs*1000);let nextS=0;
  let iqf=0.2/Kt;const a=1-Math.exp(-TAU*p.fbw*dt);
  for(let k=0;k<N;k++){const t=k*dt;
    if(t>=nextS){nextS+=Ts;const e=Tref(t)-Kt*iq;const nu=e>p.band/2?V:(e<-p.band/2?-V*0.3:E);if(nu!==u)sw++;u=nu;}
    iq+=(u-E-0.012*iq)/L*dt;
    const dmax=(V-E)/L*dt;iqf+=clamp((Tref(t)/Kt-iqf)*a,-dmax*3,dmax);   /* FOC 同样受可用电压限制 */
    if(k%5===0){tx.push(t*1000);dx.push(Kt*iq);fx.push(Kt*iqf+0.003*Math.sin(TAU*20000*t));}}
  const S=split(w,h);
  const P1=plotBox(ctx,C,inset(S.L,46,22,10,30),[0,4],[0,0.8],{nx:4,ny:4,title:'FOC 转矩（N·m）',xl:'时间 ms'});
  pline(ctx,P1,[0,0.5,0.5,4],[0.2,0.2,0.6,0.6],C.muted,1.2,[5,4]);pline(ctx,P1,tx,fx,C.acc,1.8);
  const P2=plotBox(ctx,C,inset(S.R,46,22,10,30),[0,4],[0,0.8],{nx:4,ny:4,title:'经典 DTC 转矩（N·m）',xl:'时间 ms'});
  pline(ctx,P2,[0,0.5,0.5,4],[0.2,0.2,0.6,0.6],C.muted,1.2,[5,4]);pline(ctx,P2,tx,dx,C.bad,1.2);
  let mn=9,mx=-9;for(let i=0;i<tx.length;i++)if(tx[i]>2){mn=Math.min(mn,dx[i]);mx=Math.max(mx,dx[i]);}
  info(ctx,C,['DTC 稳态脉动 ≈ '+(mx-mn).toFixed(3)+' N·m（峰峰）','DTC 开关状态切换 ≈ '+Math.round(sw/T/1000)+' k次/s（随工况变化）','FOC：固定 20 kHz PWM，纹波小；大阶跃时两者都受电压限制','（教学简化模型，仅示意趋势）'],P2.b.x+8,P2.b.y+P2.b.h*0.55);}});
})();
