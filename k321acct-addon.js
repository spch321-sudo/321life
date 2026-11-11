/* 321生命操練 × 321 共用帳號（ES5 外掛；需要 ../321steward/k321acct.js）
 * ‧「備份與還原」上方加一張「321 共用帳號」卡片
 * ‧ 登入後自動加密備份全部操練紀錄（位置 'life'），換手機用同一組帳號碼找回
 * ‧ 把操練摘要公開給 321管家（位置 'life-pub'）：五道門戶與五重領域最近的舊人／新人分數、操練的日子、生命健檢與日記次數 */
(function(){
 var A=window.K321ACCT;if(!A)return;
 function lang(){try{return (JSON.parse(localStorage.getItem('r321-life-set')||'{}').lang)||'zh';}catch(e){return 'zh';}}
 var TX={
  zh:{t:'321 共用帳號',intro:'一組帳號碼，所有 321 App 共用：自動加密備份你的操練紀錄，換手機找回；操練的進展也會出現在 321管家「與己」頁，小智回顧時一起參考。',open:'建立或登入 321 帳號',on:'✓ 已登入',last:'上次同步：',never:'尚未同步',sync:'立即同步',acct:'帳號碼與登出',synced:'已同步到 321 帳號',fail:'同步失敗：',ask:'321 帳號裡有你的生命操練備份（{n} 筆紀錄），要下載到這支手機嗎？會取代這支手機上的紀錄。'},
  zs:{t:'321 共用账号',intro:'一组账号码，所有 321 App 共用：自动加密备份你的操练记录，换手机找回；操练的进展也会出现在 321管家「与己」页，小智回顾时一起参考。',open:'建立或登录 321 账号',on:'✓ 已登录',last:'上次同步：',never:'尚未同步',sync:'立即同步',acct:'账号码与登出',synced:'已同步到 321 账号',fail:'同步失败：',ask:'321 账号里有你的生命操练备份（{n} 笔记录），要下载到这部手机吗？会取代这部手机上的记录。'},
  en:{t:'321 Account',intro:'One code for every 321 app: encrypted backup of your practice records, restored on a new phone; your progress also appears on the 321 Steward “Self” page and in Xiaozhi\'s reviews.',open:'Create or sign in to a 321 Account',on:'✓ Signed in',last:'Last sync: ',never:'Not synced yet',sync:'Sync now',acct:'Account code / sign out',synced:'Synced to your 321 Account',fail:'Sync failed: ',ask:'Your 321 Account has a Life Practice backup ({n} records). Download it to this phone? It replaces the records on this phone.'}
 };
 function X(){return TX[lang()]||TX.zh;}
 function note(m){try{if(typeof window.toast==='function'){window.toast(m);return;}}catch(e){}}
 function store(){var s={},i,k;for(i=0;i<localStorage.length;i++){k=localStorage.key(i);if(k&&(k.indexOf('r321-life-')===0||k.indexOf('r321-draft-')===0)&&k.indexOf('r321-life-pack-')!==0)s[k]=localStorage.getItem(k);}return s;}
 var EN=null;
 function loadEN(cb){if(EN){cb();return;}var x=new XMLHttpRequest();try{x.open('GET','lang-en.json');}catch(e){EN={};cb();return;}x.onload=function(){try{EN=JSON.parse(x.responseText)||{};}catch(e){EN={};}cb();};x.onerror=function(){EN={};cb();};x.send();}
 function sumA(a){var t=0;for(var i=0;i<(a||[]).length;i++)t+=a[i]||0;return t;}
 function summary(){
  var es=[];try{es=JSON.parse(localStorage.getItem('r321-life-entries')||'[]')||[];}catch(e){}
  var G=window.GROUPS||[],groups=[],latest={exam:{},train:{}},prev={exam:{},train:{}},hist=[],days={},cnt={check:0,journal:0},i,j,e,k;
  for(i=0;i<G.length;i++)groups.push({id:G[i].id,kind:G[i].kind,zh:G[i].name,en:(EN&&EN[G[i].name])||G[i].name});
  es.sort(function(a,b){return b.ts-a.ts;});
  for(i=0;i<es.length;i++){e=es[i];if(!e)continue;if(e.date)days[e.date]=1;
   if(e.scores&&(e.kind==='exam'||e.kind==='train')){var tot=0,n=0;
    for(k in e.scores){if(!e.scores.hasOwnProperty(k))continue;var v=sumA(e.scores[k]);tot+=v;n++;
     if(latest[e.kind][k]==null)latest[e.kind][k]=v;else if(prev[e.kind][k]==null)prev[e.kind][k]=v;}
    if(hist.length<80&&n)hist.push({d:e.date,k:e.kind,avg:Math.round(tot/n*10)/10,n:n});}
   else if(e.kind==='check')cnt.check++;else cnt.journal++;}
  var dl=[];for(k in days)dl.push(k);dl.sort();
  return {v:1,at:Date.now(),groups:groups,latest:latest,prev:prev,hist:hist,days:dl.slice(-90),checks:cnt.check,journals:cnt.journal,total:es.length};
 }
 var busy=false,timer=null;
 function sync(cb){
  if(!A.get()||busy){if(cb)cb('busy');return;}busy=true;
  loadEN(function(){
   A.put('life',{v:1,at:Date.now(),store:store()},function(e1){
    A.put('life-pub',summary(),function(e2){busy=false;paint();if(cb)cb(e1||e2);});
   });
  });
 }
 function soon(){if(!A.get())return;clearTimeout(timer);timer=setTimeout(function(){sync(null);},45000);}
 if(typeof window.lsSet==='function'){var _ls=window.lsSet;window.lsSet=function(k,v){var r=_ls(k,v);try{if(k==='r321-life-entries'||k==='r321-life-hl'||k==='r321-life-fav')soon();}catch(e){}return r;};}
 function restore(){
  A.fetch('life',function(err,o){
   if(err||!o||!o.store){sync(null);return;}
   var n=0;try{n=(JSON.parse(o.store['r321-life-entries']||'[]')||[]).length;}catch(e){}
   if(n&&confirm(X().ask.replace('{n}',n))){for(var k in o.store){try{localStorage.setItem(k,o.store[k]);}catch(e){}}location.reload();}
   else sync(null);
  });
 }
 function changed(kind){
  if(kind==='login'){A.syncProfile();restore();}
  else if(kind==='create'){A.syncProfile();sync(function(e){note(e?X().fail+e:X().synced);});}
  paint();
 }
 function open(){A.open({lang:lang(),onChange:changed});}
 function card(){
  var a=A.get(),at=Math.max(A.lastAt('life'),A.lastAt('life-pub')),t=X();
  return '<section class="card" id="k321acctcard"><div class="eyebrow">🔑 '+t.t+'</div>'+
   (a?'<p class="small" style="margin:0;color:#2A8550;font-weight:700">'+t.on+'</p><p class="small" style="margin:4px 0 0">'+(at?t.last+new Date(at).toLocaleString():t.never)+'</p><div class="row"><button class="btn wide" onclick="K321L.sync()">'+t.sync+'</button><button class="btn ghost wide" onclick="K321L.open()">'+t.acct+'</button></div>'
   :'<p class="small" style="margin:0">'+t.intro+'</p><div class="row"><button class="btn wide" onclick="K321L.open()">'+t.open+'</button></div>')+'</section>';
 }
 function paint(){var el=document.getElementById('k321acctcard');if(el)el.outerHTML=card();}
 if(typeof window.backupCard==='function'){var _bc=window.backupCard;window.backupCard=function(){return card()+_bc.apply(this,arguments);};try{if(typeof window.render==='function')window.render();}catch(e){}}
 window.K321L={sync:function(){sync(function(e){note(e&&e!=='busy'?X().fail+e:X().synced);});},open:open};
 setTimeout(function(){if(!A.get())return;A.syncProfile();if(Date.now()-A.lastAt('life-pub')>10*60000)sync(null);},4000);
 document.addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden'&&A.get()&&Date.now()-A.lastAt('life-pub')>3*60000)sync(null);});
})();
