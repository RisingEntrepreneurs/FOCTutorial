/* ===================== FOC 教程 核心脚本（导航 / 搜索 / 进度 / 习题 / 错题本 / 试卷 / 调试模拟 / 动画框架） ===================== */
window.FOC_Q = window.FOC_Q || [];
window.FOC_ANIM_SPECS = window.FOC_ANIM_SPECS || [];
window.FOC_SIM = window.FOC_SIM || [];
(function(){
'use strict';
const LS={get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d;}catch(e){return d;}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}};
const $=(s,r)=>(r||document).querySelector(s), $$=(s,r)=>Array.from((r||document).querySelectorAll(s));
function el(tag,cls,html){const e=document.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;return e;}
function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function esc(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}

/* ---------------- 导航数据（未交付章节自动置灰，交付后自动启用） ---------------- */
const NAV=[
 {g:'导读',items:[['intro','课程导读与统一案例']]},
 {g:'模块 A：前置工程数学',items:[['A01','A01 基础代数'],['A02','A02 平面矢量'],['A03','A03 三角函数'],['A04','A04 复数'],['A05','A05 微分与差分'],['A06','A06 积分与累加'],['A07','A07 拉普拉斯与传递函数'],['A08','A08 PID 控制理论'],['A-test','模块 A 综合自测卷']]},
 {g:'模块 B：基础扫盲',items:[['B01','B01 为什么用 FOC'],['B02','B02 PMSM 基础'],['B03','B03 坐标系'],['B04','B04 矢量控制思想'],['B05','B05 控制环层级'],['B06','B06 PWM/ADC/中断时序'],['B07','B07 常用信号'],['B-test','模块 B 综合自测卷']]},
 {g:'模块 C：核心 FOC 链路',items:[['C01','C01 电流采样与校准'],['C02','C02 Clarke 变换'],['C03','C03 Park / 反 Park'],['C04','C04 SVPWM'],['C05','C05 电流环 PID'],['C06','C06 MTPA'],['C07','C07 弱磁控制'],['C08','C08 速度环 / 位置环'],['C09','C09 角度传感方案'],['C10','C10 无感观测'],['C11','C11 参数辨识'],['C12','C12 保护与诊断'],['C13','C13 扰动补偿'],['C-test','模块 C 综合自测卷']]},
 {g:'模块 D：嵌入式落地实战',items:[['D01','D01 离散化'],['D02','D02 定点实现'],['D03','D03 中断架构'],['D04','D04 代码架构'],['D05','D05 Simulink 仿真'],['D06','D06 台架上电流程'],['D07','D07 标定实战'],['D08','D08 标定变量与 XCP'],['D-test','模块 D 综合自测卷']]},
 {g:'模块 E：故障与调试实战',items:[['E01','E01 故障根因库'],['E02','E02 示波器抓取要点'],['E03','E03 仿真 vs 台架差异'],['E04','E04 定位流程'],['E-test','模块 E 综合自测卷']]},
 {g:'模块 F：拓展对比',items:[['F01','F01 FOC vs DTC'],['F02','F02 有感 vs 无感'],['F03','F03 SPMSM vs IPMSM'],['F04','F04 主驱 vs EPS 辅驱'],['F05','F05 厂商方案特点'],['F-test','模块 F 综合自测卷']]},
 {g:'重点强化',items:[['X1','X1 端到端数据流追踪'],['X2','X2 浮点 vs 定点'],['X3','X3 仿真证据 vs 台架证据'],['X4','X4 参数表模板']]},
 {g:'考核',items:[['final','结业综合大试卷'],['#wb','【错题本】全局错题'],['#sim','台架调试模拟']]}
];
function buildNav(){
  const nav=$('#sidenav'); nav.innerHTML='';
  const closed=LS.get('foc_navclosed',{});
  NAV.forEach((g,gi)=>{
    const box=el('div','nav-g'+(closed[gi]?' closed':''));
    const h=el('div','nav-gh','<span>'+g.g+'</span><span class="car">▾</span>');
    h.onclick=()=>{box.classList.toggle('closed');closed[gi]=box.classList.contains('closed');LS.set('foc_navclosed',closed);};
    const list=el('div','nav-items');
    g.items.forEach(([id,t])=>{
      const a=el('a');
      if(id==='#wb'){a.href='javascript:void(0)';a.textContent=t;a.onclick=e=>{e.preventDefault();openWB();};}
      else if(id==='#sim'){a.href='javascript:void(0)';a.textContent=t;a.onclick=e=>{e.preventDefault();openSim();};}
      else{
        a.href='#'+id;a.dataset.id=id;
        const ok=!!document.getElementById(id);
        a.innerHTML='<span>'+t+'</span>'+(ok?'<span class="done"></span>':'<span class="pill">后续分段</span>');
        if(!ok)a.classList.add('pending');
        a.addEventListener('click',()=>document.body.classList.remove('nav-open'));
      }
      list.append(a);
    });
    box.append(h,list); nav.append(box);
  });
}

/* ---------------- 进度 ---------------- */
function learnable(){return $$('section.chap').filter(s=>s.id&&s.id!=='final');}
function refreshProgress(){
  const done=LS.get('foc_done',{}); const secs=learnable();
  const n=secs.filter(s=>done[s.id]).length;
  $('#progTxt').textContent='已学 '+n+' / '+secs.length+' 节';
  $('#progFill').style.width=(secs.length?n/secs.length*100:0)+'%';
  $$('#sidenav a[data-id]').forEach(a=>{const d=a.querySelector('.done');if(d)d.textContent=done[a.dataset.id]?'✓':'';});
  $$('.btn-learn').forEach(b=>{const on=!!done[b.dataset.id];b.textContent=on?'✓ 已学':'标记已学';b.classList.toggle('btn-pri',on);});
}
function addLearnButtons(){
  learnable().forEach(s=>{
    const h=$('.chap-h',s); if(!h||$('.btn-learn',h))return;
    const b=el('button','btn btn-sm btn-learn no-print'); b.dataset.id=s.id;
    b.onclick=()=>{const d=LS.get('foc_done',{});d[s.id]=!d[s.id];LS.set('foc_done',d);refreshProgress();};
    h.append(b);
  });
}

/* ---------------- 当前章节高亮 ---------------- */
function watchActive(){
  if(!('IntersectionObserver' in window))return;
  const io=new IntersectionObserver(ents=>{ents.forEach(en=>{if(en.isIntersecting){$$('#sidenav a.active').forEach(a=>a.classList.remove('active'));const a=$('#sidenav a[data-id="'+en.target.id+'"]');if(a){a.classList.add('active');}}});},{rootMargin:'-35% 0px -60% 0px'});
  $$('section.chap').forEach(s=>io.observe(s));
}

/* ---------------- 搜索 ---------------- */
let IDX=[];
function buildIndex(){IDX=$$('section.chap').map(s=>({id:s.id,title:s.dataset.title||s.id,text:(s.innerText||'').replace(/\s+/g,' ')}));}
function doSearch(q){
  const box=$('#searchRes'); q=q.trim();
  if(!q){box.style.display='none';return;}
  const ql=q.toLowerCase(); const res=[];
  IDX.forEach(it=>{
    let from=0,cnt=0; const tl=it.text.toLowerCase();
    while(cnt<3){const i=tl.indexOf(ql,from);if(i<0)break;res.push({it,i});from=i+ql.length;cnt++;}
  });
  box.innerHTML='';
  if(!res.length){box.innerHTML='<a href="javascript:void(0)">未找到「'+esc(q)+'」</a>';}
  res.slice(0,20).forEach(r=>{
    const s=Math.max(0,r.i-24), snip=r.it.text.substr(s,70);
    const hi=esc(snip).replace(new RegExp(esc(q).replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'gi'),m=>'<mark>'+m+'</mark>');
    const a=el('a',null,'<b>'+esc(r.it.title)+'</b><small>…'+hi+'…</small>'); a.href='#'+r.it.id;
    a.onclick=()=>{box.style.display='none';};
    box.append(a);
  });
  box.style.display='block';
}

/* ---------------- 复制按钮 ---------------- */
function copyText(t,btn){
  const done=()=>{if(btn){const o=btn.textContent;btn.textContent='已复制';setTimeout(()=>btn.textContent=o,1200);}};
  if(navigator.clipboard&&window.isSecureContext){navigator.clipboard.writeText(t).then(done,()=>fallback());}else fallback();
  function fallback(){const ta=document.createElement('textarea');ta.value=t;ta.style.position='fixed';ta.style.opacity='0';document.body.append(ta);ta.select();try{document.execCommand('copy');}catch(e){}ta.remove();done();}
}
function addCopy(){
  $$('pre').forEach(p=>{if($('.copy-btn',p))return;const b=el('button','copy-btn','复制');b.onclick=()=>copyText(p.querySelector('code')?p.querySelector('code').innerText:p.innerText,b);p.append(b);});
  $$('table.copyable').forEach(t=>{if(t.previousElementSibling&&t.previousElementSibling.classList.contains('tbl-copy'))return;const b=el('button','copy-btn tbl-copy','复制表格');b.onclick=()=>copyText($$('tr',t).map(r=>$$('th,td',r).map(c=>c.innerText.trim()).join('\t')).join('\n'),b);t.parentNode.insertBefore(b,t);});
}

/* ---------------- 弹窗 ---------------- */
function openModal(title,node){$('#modalTitle').textContent=title;const b=$('#modalBody');b.innerHTML='';b.append(node);$('#modal').classList.add('on');}
function closeModal(){$('#modal').classList.remove('on');}

/* ---------------- 习题 ---------------- */
const TN={single:'单选题',tf:'判断题',short:'简答题',analysis:'工程分析题'};
const isObj=q=>q.type==='single'||q.type==='tf';
const getWB=()=>LS.get('foc_wb',[]);
function inWB(id){return getWB().indexOf(id)>=0;}
function addWB(id){const w=getWB();if(w.indexOf(id)<0){w.push(id);LS.set('foc_wb',w);}updWB();}
function rmWB(id){LS.set('foc_wb',getWB().filter(x=>x!==id));updWB();}
function updWB(){const c=$('#wbCount');if(c)c.textContent=getWB().filter(id=>FOC_Q.some(q=>q.id===id)).length;}
function secTitle(id){const s=document.getElementById(id);return s?(s.dataset.title||id):id;}
function linksHtml(q){return (q.links||[q.sec]).map(id=>document.getElementById(id)?'<a href="#'+id+'" data-jump="1">→ '+esc(secTitle(id))+'</a>':'<span class="pill">'+id+'（后续分段）</span>').join(' ');}
function bumpStat(sec,right){const s=LS.get('foc_qstat',{});s[sec]=s[sec]||{n:0,r:0};s[sec].n++;if(right)s[sec].r++;LS.set('foc_qstat',s);const c=$('#quiz-'+sec+' .quiz-stat');if(c)c.textContent=statTxt(sec);}
function statTxt(sec){const s=(LS.get('foc_qstat',{})[sec])||{n:0,r:0};return '本节累计作答 '+s.n+' 次，正确 '+s.r+' 次'+(s.n?'（'+Math.round(s.r/s.n*100)+'%）':'');}

function buildQ(q,num,mode){
  const box=el('div','q'); box.dataset.qid=q.id;
  const head=el('div','q-head','<span class="tg tg-quiz">【习题】</span><span class="q-type">'+TN[q.type]+'</span><span class="q-num">#'+num+(mode!=='inline'?' · '+esc(secTitle(q.sec)):'')+'</span><span class="sp"></span>');
  const wb=el('button','btn btn-xs'); const rw=()=>{wb.textContent=inWB(q.id)?'★ 已在错题本':'☆ 加入错题本';};
  wb.onclick=()=>{inWB(q.id)?rmWB(q.id):addWB(q.id);rw();}; rw(); head.append(wb);
  box.append(head, el('div','q-stem',q.q));
  const st={sel:null,graded:false,right:false}; box._st=st;
  if(isObj(q)){
    const opts=q.type==='tf'?['正确','错误']:q.opts, ans=q.type==='tf'?(q.ans?0:1):q.ans;
    const list=el('div','q-opts'); const exp=el('div','q-exp'); exp.hidden=true;
    opts.forEach((o,i)=>{const b=el('button','q-opt',(q.type==='single'?String.fromCharCode(65+i)+'. ':'')+o);
      b.onclick=()=>{if(st.graded)return; if(mode==='exam'){st.sel=i;$$('.q-opt',list).forEach((x,j)=>x.classList.toggle('sel',j===i));return;} grade(i);};
      list.append(b);});
    function grade(i){
      st.sel=i; st.graded=true; st.right=(i===ans);
      $$('.q-opt',list).forEach((x,j)=>{x.classList.remove('sel');if(j===ans)x.classList.add('ok');if(j===i&&i!==ans)x.classList.add('bad');});
      if(i!==null&&!st.right){addWB(q.id);rw();}
      if(mode!=='exam')bumpStat(q.sec,st.right);
      exp.innerHTML='<div class="q-verdict '+(st.right?'ok':'bad')+'">'+(i===null?'未作答':(st.right?'✔ 回答正确':'✘ 回答错误，已自动加入错题本'))+'</div><b>解析：</b>'+q.exp+'<div class="q-links">关联章节：'+linksHtml(q)+'</div>';
      exp.hidden=false;
      if(mode!=='exam'){const r=el('button','btn btn-xs','↺ 重做');r.onclick=()=>box.replaceWith(buildQ(q,num,mode));exp.append(' ',r);}
    }
    box._grade=()=>{grade(st.sel);return st.right;};
    box.append(list,exp);
  }else{
    const d=el('details','q-ref','<summary>查看参考解答（自查，不自动判分）</summary><div class="q-ans">'+q.ans+'<div class="q-exp"><b>评分要点：</b>'+q.exp+'<div class="q-links">关联章节：'+linksHtml(q)+'</div></div></div>');
    box.append(d);
  }
  if(mode==='wb'){const bar=el('div','q-links');bar.innerHTML='<a href="#'+q.sec+'" data-jump="1">↗ 跳转原章节</a> ';const rm=el('button','btn btn-xs','移出错题本');rm.onclick=()=>{rmWB(q.id);box.remove();};bar.append(rm);box.append(bar);}
  return box;
}
const ORDER={single:0,tf:1,short:2,analysis:3};
function renderQuizzes(){
  $$('.quiz[data-sec]').forEach(c=>{
    const sec=c.dataset.sec; const qs=FOC_Q.filter(q=>q.sec===sec).sort((a,b)=>ORDER[a.type]-ORDER[b.type]);
    c.innerHTML='';
    const h=el('div','quiz-h','<span>共 '+qs.length+' 题：单选 / 判断即时判分，简答 / 工程分析题展开参考解答。</span><span class="quiz-stat">'+statTxt(sec)+'</span>');
    c.append(h); qs.forEach((q,i)=>c.append(buildQ(q,i+1,'inline')));
  });
}

/* ---------------- 试卷 ---------------- */
function buildExam(c){
  const scope=c.dataset.scope, nObj=+c.dataset.nobj, nSub=+c.dataset.nsub, key=c.dataset.key;
  const pool=FOC_Q.filter(q=>scope==='ALL'||q.sec.indexOf(scope)===0);
  const objs=shuffle(pool.filter(isObj)).slice(0,nObj), subs=shuffle(pool.filter(q=>!isObj(q))).slice(0,nSub);
  c.innerHTML='';
  const hist=LS.get('foc_'+key,{times:0,best:null,last:null});
  const info=el('div','note','题库规模：客观题 '+pool.filter(isObj).length+'、主观题 '+pool.filter(q=>!isObj(q)).length+'。本卷客观题 '+objs.length+' 道、主观题 '+subs.length+' 道。历史：已交卷 '+hist.times+' 次'+(hist.best!=null?'，最高 '+hist.best+' 分，上次 '+hist.last+' 分':'')+'。');
  const bar=el('div','quiz-h'); const re=el('button','btn','↺ 重新组卷'); re.onclick=()=>buildExam(c); bar.append(re);
  c.append(info,bar);
  const boxes=[];
  c.append(el('h4','sub','一、客观题（每题 '+(objs.length?(100/objs.length).toFixed(1):0)+' 分）'));
  objs.forEach((q,i)=>{const b=buildQ(q,i+1,'exam');boxes.push(b);c.append(b);});
  if(subs.length){c.append(el('h4','sub','二、主观题（自评，不计分）'));subs.forEach((q,i)=>c.append(buildQ(q,i+1,'exam')));}
  const sub=el('button','btn btn-pri','✔ 交卷判分'); const res=el('div');
  sub.onclick=()=>{
    if(sub.disabled)return; sub.disabled=true;
    let r=0,un=0; boxes.forEach(b=>{if(b._st.sel===null)un++; if(b._grade())r++;});
    const score=objs.length?Math.round(r/objs.length*100):0;
    const h=LS.get('foc_'+key,{times:0,best:null,last:null}); h.times++; h.last=score; h.best=h.best==null?score:Math.max(h.best,score); LS.set('foc_'+key,h);
    res.innerHTML='<div class="exam-res"><b>得分：'+score+' / 100</b>　正确 '+r+' / '+objs.length+'，未作答 '+un+'。错题已加入错题本。'+(score>=80?' 掌握良好。':' 建议回到对应章节复习后重新组卷。')+'</div>';
    res.scrollIntoView({behavior:'smooth',block:'center'});
  };
  const sbar=el('div','quiz-h'); sbar.append(sub); c.append(sbar,res);
}

/* ---------------- 错题本 ---------------- */
function openWB(){
  const wrap=el('div'); const ids=getWB(); const qs=ids.map(id=>FOC_Q.find(q=>q.id===id)).filter(Boolean);
  const top=el('div','quiz-h','<span>共 '+qs.length+' 题。答错的单选 / 判断题会自动加入；也可手动加入任意题。可在此重做。</span>');
  const clr=el('button','btn btn-sm','清空错题本'); clr.onclick=()=>{if(confirm('确定清空错题本？')){LS.set('foc_wb',[]);updWB();openWB();}}; top.append(clr);
  wrap.append(top);
  if(!qs.length)wrap.append(el('p',null,'错题本为空。'));
  qs.forEach((q,i)=>wrap.append(buildQ(q,i+1,'wb')));
  openModal('【错题本】全局错题汇总',wrap);
}

/* ---------------- 台架调试模拟 ---------------- */
function openSim(){
  const wrap=el('div');
  wrap.append(el('p',null,'情景推演：资深标定工程师描述台架现象，你选择下一步排查动作，工程师会根据你的选择追问或纠正，直到给出根因、修复方案与验证信号。与习题独立，不计分。'));
  FOC_SIM.forEach(sc=>{const b=el('button','btn','▶ '+sc.title);b.style.margin='4px';b.onclick=()=>runSim(sc,wrap);wrap.append(b);});
  openModal('台架调试模拟',wrap);
}
function runSim(sc,wrap){
  wrap.innerHTML=''; const log=el('div'); wrap.append(el('h4','sub',sc.title),log);
  const back=el('button','btn btn-sm','← 返回场景列表'); back.onclick=openSim; wrap.prepend(back);
  function show(nid){
    const n=sc.nodes[nid];
    log.append(el('div','sim-msg sim-eng','<b>标定工程师：</b>'+n.text));
    if(!n.opts||!n.opts.length){log.append(el('div','sim-msg sim-fb','<b>场景结束。</b> 关联复习：'+(n.links||[]).map(id=>'<a href="#'+id+'" data-jump="1">'+esc(secTitle(id))+'</a>').join('、')));return;}
    const box=el('div','sim-opts');
    n.opts.forEach(o=>{const b=el('button','q-opt',o.t);b.onclick=()=>{box.remove();log.append(el('div','sim-msg sim-you','<b>你：</b>'+o.t));if(o.fb)log.append(el('div','sim-msg sim-fb',o.fb));show(o.next);setTimeout(()=>log.lastElementChild&&log.lastElementChild.scrollIntoView({behavior:'smooth',block:'nearest'}),30);};box.append(b);});
    log.append(box);
  }
  show(sc.start);
}

/* ===================== 动画框架 ===================== */
const ANIMS=[]; let COL={};
function readCol(){const cs=getComputedStyle(document.documentElement);const g=k=>cs.getPropertyValue(k).trim();
  COL={cbg:g('--cbg'),fg:g('--fg'),muted:g('--muted'),grid:g('--grid'),axis:g('--axis'),acc:g('--acc'),acc2:g('--acc2'),ok:g('--ok'),bad:g('--bad'),warn:g('--warn'),a:g('--pa'),b:g('--pb'),c:g('--pc'),d:g('--pd'),q:g('--pq'),panel:g('--panel2')};
  window.FOC_COL=COL;}
function makeAnim(spec){
  const host=document.getElementById(spec.host); if(!host)return null;
  const st={t:0,running:false,p:{},tog:{},w:600,h:300};
  (spec.params||[]).forEach(q=>st.p[q.k]=q.v); (spec.toggles||[]).forEach(q=>st.tog[q.k]=!!q.v);
  host.className='anim-box'; host.innerHTML='';
  const bar=el('div','anim-bar','<span class="tg tg-anim">【交互动画】</span><b>'+spec.title+'</b>');
  const bp=el('button','btn btn-sm','▶ 启动'), br=el('button','btn btn-sm','↺ 复位'); bar.append(bp,br);
  const wrap=el('div','anim-canvas'), cv=document.createElement('canvas'); wrap.append(cv);
  const ctl=el('div','anim-ctl'); host.append(bar,wrap,ctl);
  const ins={}, tgs={};
  (spec.params||[]).forEach(q=>{const row=el('label','ctl-row');const nm=el('span',null,q.label);const r=document.createElement('input');r.type='range';r.min=q.min;r.max=q.max;r.step=q.step;r.value=q.v;const val=el('span','ctl-val');
    const show=()=>{val.textContent=(+st.p[q.k]).toFixed(q.dp!=null?q.dp:2)+(q.unit?' '+q.unit:'');};show();
    r.addEventListener('input',()=>{st.p[q.k]=parseFloat(r.value);show();render();});row.append(nm,r,val);ctl.append(row);ins[q.k]={r,show};});
  (spec.toggles||[]).forEach(q=>{const row=el('label','ctl-tog');const c=document.createElement('input');c.type='checkbox';c.checked=!!q.v;c.onchange=()=>{st.tog[q.k]=c.checked;render();};row.append(c,el('span',null,q.label));ctl.append(row);tgs[q.k]=c;});
  const ctx=cv.getContext('2d');
  function render(){ctx.setTransform(window.devicePixelRatio||1,0,0,window.devicePixelRatio||1,0,0);ctx.clearRect(0,0,st.w,st.h);ctx.fillStyle=COL.cbg;ctx.fillRect(0,0,st.w,st.h);try{spec.draw(ctx,st.w,st.h,st,COL);}catch(e){if(window.console)console.error(spec.host,e);}}
  function resize(){const w=Math.max(280,Math.floor(wrap.clientWidth||600));const h=typeof spec.h==='function'?spec.h(w):spec.h;const d=window.devicePixelRatio||1;cv.width=Math.round(w*d);cv.height=Math.round(h*d);cv.style.height=h+'px';st.w=w;st.h=h;render();}
  const api={host:spec.host,title:spec.title,st,render,resize,vis:true,
    setRun(v){st.running=v;bp.textContent=v?'⏸ 暂停':'▶ 启动';refreshRbAnims();},
    setP(k,v){st.p[k]=v;if(ins[k]){ins[k].r.value=v;ins[k].show();}},
    setT(k,v){st.tog[k]=v;if(tgs[k])tgs[k].checked=v;}};
  if(spec.buttons&&spec.buttons.length){const bb=el('div','ctl-btns');spec.buttons.forEach(b=>{const x=el('button','btn btn-sm',b.label);x.onclick=()=>{b.fn(api);render();};bb.append(x);});ctl.append(bb);}
  bp.onclick=()=>api.setRun(!st.running);
  br.onclick=()=>{st.t=0;(spec.params||[]).forEach(q=>api.setP(q.k,q.v));(spec.toggles||[]).forEach(q=>api.setT(q.k,!!q.v));render();};
  ANIMS.push(api); resize(); return api;
}
function refreshRbAnims(){const box=$('#rbAnims');if(!box)return;box.innerHTML='';ANIMS.forEach(a=>{const b=el('button','btn btn-sm','<span>'+a.host.replace('anim-','')+' '+a.title.slice(0,12)+'…</span><span>'+(a.st.running?'⏸':'▶')+'</span>');b.onclick=()=>a.setRun(!a.st.running);box.append(b);});
  const all=el('button','btn btn-sm','<span>全部暂停</span><span>■</span>');all.onclick=()=>ANIMS.forEach(a=>a.setRun(false));box.append(all);}
let lastTs=null;
function loop(ts){const dt=lastTs==null?0:Math.min(0.05,(ts-lastTs)/1000);lastTs=ts;ANIMS.forEach(a=>{if(a.st.running&&a.vis){a.st.t+=dt;a.render();}});requestAnimationFrame(loop);}

/* ---------------- 初始化 ---------------- */
function init(){
  readCol(); buildNav(); addLearnButtons(); refreshProgress(); watchActive();
  renderQuizzes(); $$('.exam').forEach(buildExam); updWB();
  FOC_ANIM_SPECS.forEach(makeAnim); refreshRbAnims();
  const rq=$('#rbQuiz'); if(rq){$$('.quiz[data-sec]').forEach(c=>{const a=el('a','btn btn-sm',c.dataset.sec+' 习题组');a.href='#'+c.id;rq.append(a);});$$('.exam').forEach(c=>{const s=c.closest('section');const a=el('a','btn btn-sm',esc(s.dataset.title));a.href='#'+s.id;rq.append(a);});}
  if('IntersectionObserver' in window){const io=new IntersectionObserver(es=>es.forEach(e=>{const a=ANIMS.find(x=>x.host===e.target.id);if(a)a.vis=e.isIntersecting;}));ANIMS.forEach(a=>io.observe(document.getElementById(a.host)));}
  addCopy(); buildIndex();
  let rt=null; window.addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(()=>ANIMS.forEach(a=>a.resize()),150);});
  const mq=window.matchMedia?window.matchMedia('(prefers-color-scheme: dark)'):null; if(mq&&mq.addEventListener)mq.addEventListener('change',()=>{readCol();ANIMS.forEach(a=>a.render());});
  $('#navToggle').onclick=()=>{if(window.innerWidth<=900)document.body.classList.toggle('nav-open');else document.body.classList.toggle('nav-collapsed');};
  const sb=$('#searchBox'); sb.addEventListener('input',()=>doSearch(sb.value)); sb.addEventListener('focus',()=>doSearch(sb.value));
  document.addEventListener('click',e=>{if(!e.target.closest('#searchWrap'))$('#searchRes').style.display='none';
    if(e.target.closest('a[data-jump]'))closeModal();
    const g=e.target.closest('.flow-svg g[data-link]'); if(g){location.hash='#'+g.dataset.link;}});
  $('#btnWB').onclick=openWB; $('#btnSim').onclick=openSim; $('#modalClose').onclick=closeModal;
  $('#modal').addEventListener('click',e=>{if(e.target.id==='modal')closeModal();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();});
  $('#toTop').onclick=()=>window.scrollTo({top:0,behavior:'smooth'});
  $('#btnPrint').onclick=()=>window.print();
  window.addEventListener('beforeprint',()=>$$('details').forEach(d=>d.open=true));
  $('#btnTheme').onclick=()=>{const r=document.documentElement;const cur=r.getAttribute('data-theme');const dark=cur?cur==='dark':(window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches);r.setAttribute('data-theme',dark?'light':'dark');LS.set('foc_theme',r.getAttribute('data-theme'));readCol();ANIMS.forEach(a=>a.render());};
  requestAnimationFrame(loop);
}
const th=LS.get('foc_theme',null); if(th)document.documentElement.setAttribute('data-theme',th);
window.FOC_INIT=init;
})();
