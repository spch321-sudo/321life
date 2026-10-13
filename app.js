/* 321生命操練 — 主程式（ES5）。介面字串一律寫成繁體原文 T("…")，简体／英文由 lang-zs.json／lang-en.json 對照 */

/* ---------- 工具 ---------- */
if(!Element.prototype.matches){Element.prototype.matches=Element.prototype.msMatchesSelector||Element.prototype.webkitMatchesSelector;}
function closestBtn(el,root){while(el&&el!==root){if(el.tagName==="BUTTON")return el;el=el.parentNode;}return null;}
function lsGet(k,d){try{var v=localStorage.getItem(k);return v?JSON.parse(v):d;}catch(e){return d;}}
function lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true;}catch(e){return false;}}
function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});}
function sum(a){var t=0;for(var i=0;i<a.length;i++){t+=a[i]||0;}return t;}
function has(arr,x){return arr.indexOf(x)>-1;}
function pad2(n){return n<10?"0"+n:""+n;}
function now(){return new Date().getTime();}
function trim(s){return String(s==null?"":s).replace(/^\s+|\s+$/g,"");}
function dkey(d){return d.getFullYear()+"-"+pad2(d.getMonth()+1)+"-"+pad2(d.getDate());}
function $(id){return document.getElementById(id);}
function qa(sel,root){var l=(root||document).querySelectorAll(sel),o=[];for(var i=0;i<l.length;i++)o.push(l[i]);return o;}
function eachA(a,f){for(var i=0;i<a.length;i++)f(a[i],i);}

/* ---------- 三語 ---------- */
var SET=lsGet("r321-life-set",null);
if(!SET){var nl=String(navigator.language||"zh").toLowerCase();
  var olduser=false;try{olduser=!!localStorage.getItem("r321-life-entries");}catch(e){}
  SET={lang:olduser?"zh":(/^zh-(cn|sg|hans)/.test(nl)?"zs":(/^zh/.test(nl)?"zh":(/^en/.test(nl)?"en":"zh"))),font:0,theme:"",voice:0,rate:0,human:true,aud:"adult"};}
function saveSet(){lsSet("r321-life-set",SET);}
var PACK={zh:{}};
function L(){return SET.lang||"zh";}
function isEN(){return L()==="en";}
function isZS(){return L()==="zs";}
function T(k){var d=PACK[L()]||{},s=d[k];if(s==null)s=k;
  for(var i=1;i<arguments.length;i++)s=s.split("{"+(i-1)+"}").join(arguments[i]);return s;}
function DOT(){return isEN()?" · ":"・";}
function Q(s){return isEN()?"“"+s+"”":"「"+s+"」";}
var MON_EN=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function fmtDate(k){var p=String(k).split("-");return isEN()?MON_EN[(+p[1])-1]+" "+(+p[2]):(+p[1])+T("月")+(+p[2])+T("日");}
var WDN=["主日","一","二","三","四","五","六"];
var WDN_EN=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
var WDS_EN=["S","M","T","W","T","F","S"];
function wdName(d){return isEN()?WDN_EN[d]:T("星期")+WDN[d];}

function toast(t){var old=qa(".toast");eachA(old,function(o){o.parentNode.removeChild(o);});
  var el=document.createElement("div");el.className="toast";el.textContent=t;document.body.appendChild(el);setTimeout(function(){if(el.parentNode)el.parentNode.removeChild(el);},2400);}

/* ---------- 逐句（畫線與朗讀的單位） ---------- */
function splitS(text){
  text=String(text||"");var out=[],cur="",i;
  if(isEN()){var re=/[^.!?]*[.!?]+["'”’\)\]]*(\s+|$)/g,m,last=0;
    while((m=re.exec(text))!==null){if(trim(m[0]))out.push(m[0]);last=re.lastIndex;if(re.lastIndex===m.index)re.lastIndex++;}
    if(last<text.length&&trim(text.slice(last)))out.push(text.slice(last));return out.length?out:[text];}
  for(i=0;i<text.length;i++){cur+=text.charAt(i);
    if("。！？".indexOf(text.charAt(i))>=0){while(i+1<text.length&&"」』）〕”".indexOf(text.charAt(i+1))>=0)cur+=text.charAt(++i);out.push(cur);cur="";}}
  if(cur)out.push(cur);return out;
}
/* ST：把一段文字切成可點的句子；hk 是這一塊的固定代號（畫線依它存） */
function ST(hk,text){var ss=splitS(text),h="";for(var i=0;i<ss.length;i++)h+='<span class="sent" data-k="'+esc(hk)+'" data-s="'+i+'">'+esc(ss[i])+'</span>';return h;}
function verseHTML(v,hk){return '<blockquote class="verse">'+(hk?ST(hk,T(v[0])):esc(T(v[0])))+'<cite class="rd">'+esc(T(v[1]))+'</cite></blockquote>';}

/* ---------- 儲存（本機） ---------- */
var LS="r321-life-entries";
var entries=lsGet(LS,[]);
function saveAll(){return lsSet(LS,entries);}
function putEntry(e){var out=[];for(var i=0;i<entries.length;i++){if(entries[i].id!==e.id)out.push(entries[i]);}out.push(e);entries=out;return saveAll();}
function delEntry(id){var out=[];for(var i=0;i<entries.length;i++){if(entries[i].id!==id)out.push(entries[i]);}entries=out;return saveAll();}
function byNewest(a,b){return b.ts-a.ts;}
function filterEntries(fn){var out=[];for(var i=0;i<entries.length;i++){if(fn(entries[i]))out.push(entries[i]);}return out;}
function band(mode,n){var b=BANDS[mode];for(var i=0;i<b.length;i++){if(n<=b[i][0])return b[i];}return b[b.length-1];}
function answeredCount(a){var c=0;for(var i=0;i<a.length;i++){if(a[i]!=null)c++;}return c;}
var SAVE_FAIL="儲存失敗：瀏覽器不允許儲存資料，請關閉無痕模式後再試";

/* ---------- 狀態 ---------- */
var today=new Date();
var TODAY=dkey(today),WD=today.getDay();
var defaultSel=WEEK[WD]||["see","idea"];
var state={tab:"home",
  exam:{sel:defaultSel.slice(),ans:lsGet("r321-draft-exam",{}),done:null},
  train:{sel:defaultSel.slice(),ans:lsGet("r321-draft-train",{}),done:null},
  jmode:"renew",confirmDel:null};
var TABS=["home","check","exam","train","growth","journal"];
var hash=location.hash.replace("#","");
if(has(TABS,hash))state.tab=hash;
function gname(id){return T(G[id].name);}

/* ---------- 今日 ---------- */
function viewHome(){
  var pair=WEEK[WD];
  var fruit=FRUITS[Math.floor(today.getTime()/864e5)%9];
  var mon=new Date(today.getFullYear(),today.getMonth(),today.getDate()-((WD+6)%7));
  var days={};for(var i=0;i<entries.length;i++){days[entries[i].date]=1;}
  var week="",nWeek=0;
  for(var k=0;k<7;k++){
    var d=new Date(mon.getFullYear(),mon.getMonth(),mon.getDate()+k),key=dkey(d),done=!!days[key],wd=(k+1)%7;
    if(done)nWeek++;
    week+='<div class="d"><span class="dot'+(done?" done":"")+(key===TODAY?" today":"")+'">'+(done?"✓":"")+'</span>'+(isEN()?WDS_EN[wd]:(k===6?T("日"):T(WDN[wd])))+'</div>';
  }
  var focus;
  if(pair){
    focus='<div class="eyebrow">'+esc(T("{0}・今日重點",wdName(WD)))+'</div>'+
      '<h2 class="rd">'+gname(pair[0])+' ＋ '+gname(pair[1])+'</h2>'+
      '<p class="small" style="margin:0">'+ST("h:fr",T("對應果子：{0}",T(WEEK_FRUIT[WD])))+'</p>'+
      '<div class="row"><button class="btn old wide" data-go="exam">'+T("檢視舊人")+'</button><button class="btn new wide" data-go="train">'+T("操練新人")+'</button></div>';
  }else if(WD===6){
    focus='<div class="eyebrow">'+esc(T("{0}・同行日",wdName(6)))+'</div><h2 class="rd">'+T("與屬靈同伴分享")+'</h2>'+
      '<p style="margin:0">'+ST("h:sat",T("把一週所見的得勝與掙扎帶到「2」屬靈同伴面前，彼此代禱。"))+'</p>'+
      '<div class="row"><button class="btn new wide" data-go="growth">'+T("看一週成長")+'</button><button class="btn ghost wide" data-go="journal">'+T("寫得勝見證")+'</button></div>';
  }else{
    focus='<div class="eyebrow">'+T("主日・感恩日")+'</div><h2 class="rd">'+T("敬拜感恩，榮耀歸神")+'</h2>'+
      '<p style="margin:0">'+ST("h:sun",T("回顧這一週，數算主恩，把一切榮耀歸給耶穌。"))+'</p>'+
      '<div class="row"><button class="btn new wide" data-go="growth">'+T("回顧一週")+'</button><button class="btn ghost wide" data-go="journal">'+T("寫下感恩")+'</button></div>';
  }
  return '<figure class="kv"><img src="hero.jpg" srcset="hero-720.jpg 720w, hero.jpg 1080w" sizes="(max-width:640px) 100vw, 640px" width="1080" height="1080" alt="'+esc(T("321主視覺：一人背著行囊、手拿聖經，走在從打開的聖經延伸出的光明道路上，遠方是十字架與光明之城"))+'">'+
    '<figcaption><span>'+T("耶穌是我的榜樣")+'</span>・<span>'+T("聖經是我的準則")+'</span>・<span>'+T("聖靈是我的引導")+'</span><small>'+T("讓耶穌作王　讓耶穌得著一切的榮耀　建立屬神的體系")+'</small></figcaption></figure>'+
    '<section class="card hero">'+focus+'</section>'+
  '<section class="card"><div class="eyebrow">'+T("生命健檢")+'</div><h3 class="rd" style="font-size:20px">'+T("今天有一件事讓你不平安嗎？")+'</h3>'+
    '<p style="margin:0">'+ST("h:ck",T("把事件、看到聽到的、心裡的意念情緒、說了做了的寫下來，小智用 321 陪你看見生命光景，找到更新的路。"))+'</p>'+
    '<button class="btn new" data-go="check">'+T("開始生命健檢")+'</button></section>'+
  '<section class="card"><div class="eyebrow">'+T("本週操練")+'</div><div class="week">'+week+'</div>'+
    '<p class="small" style="margin:0">'+ST("h:wk",T("本週已操練 {0} 天。改變不在一次的用力，而在天天的交出。",nWeek))+'</p></section>'+
  '<section class="card"><div class="eyebrow">'+T("今日的一個果子")+'</div>'+
    '<div class="fruit"><span class="ch">'+(isEN()?T(fruit[1]).charAt(0):T(fruit[0]))+'</span><div><h3 class="rd" style="font-size:20px">'+T(fruit[1])+'</h3>'+
    '<p style="margin:0">'+ST("h:f1",T("取代：{0}",T(fruit[2])))+'<br>'+T("今天操練：")+'<b>'+ST("h:f2",T(fruit[3]))+'</b></p></div></div></section>'+
  '<section class="card">'+verseHTML(["我已經與基督同釘十字架，現在活著的不再是我，乃是基督在我裡面活著。","加拉太書2:20"],"h:gal")+
    '<p class="small" style="margin:0">'+ST("h:920",T("920：在每一個「2」面前，操練「0」無己，結出「9」聖靈的果子。"))+'</p></section>'+
  '<section class="card"><div class="eyebrow">'+T("321 理念")+'</div>'+
    '<div class="pillars"><div>'+T("<b>耶穌</b>是我的榜樣")+'</div><div>'+T("<b>聖經</b>是我的準則")+'</div><div>'+T("<b>聖靈</b>是我的引導")+'</div></div>'+
    '<p class="small" style="margin:0">'+ST("h:321",T("兩個核心：讓耶穌作王，讓耶穌得著一切的榮耀。一個目的：建立屬神的體系。"))+'</p></section>';
}

/* ---------- 檢視 / 操練 ---------- */
function chipHTML(mode,g){return '<button class="chip" data-pick="'+g.id+'" aria-pressed="'+has(state[mode].sel,g.id)+'">'+T(g.name)+'</button>';}
function viewPractice(mode){
  var S=state[mode];
  if(S.done)return viewResult(mode);
  var isOld=mode==="exam",i,j,pre="p:"+mode+":";
  var intro=isOld
    ?'<div class="eyebrow">'+T("舊人有己生命檢視表")+'</div><h2 class="rd" style="font-size:24px">'+T("在光中看見有己")+'</h2>'+
      verseHTML(["神啊，求你鑒察我，知道我的心思，試煉我，知道我的意念，看在我裡面有甚麼惡行沒有，引導我走永生的道路。","詩篇139:23-24"],pre+"v")+
      '<p class="small" style="margin:0">'+ST(pre+"n",T("依過去一週的實況作答。分數高不是失敗的宣判，而是恩典的入口。"))+'</p>'
    :'<div class="eyebrow">'+T("新人無己生命操練表")+'</div><h2 class="rd" style="font-size:24px">'+T("穿上新人，讓基督活出來")+'</h2>'+
      verseHTML(["並且穿上新人；這新人是照著神的形像造的，有真理的仁義和聖潔。","以弗所書4:24"],pre+"v")+
      '<p class="small" style="margin:0">'+ST(pre+"n",T("依過去一週的實際操練作答。分數是見證恩典的記號，不是自我誇口的成績單。"))+'</p>';
  var gates="",areas="";
  for(i=0;i<5;i++)gates+=chipHTML(mode,GROUPS[i]);
  for(i=5;i<10;i++)areas+=chipHTML(mode,GROUPS[i]);
  var legend="";for(i=0;i<4;i++)legend+='<div><b>'+i+'</b>'+T(SCALE[mode][i])+'</div>';
  var groups="",ready=false;
  for(i=0;i<GROUPS.length;i++){
    var g=GROUPS[i];if(!has(S.sel,g.id))continue;
    var t=g[mode],a=S.ans[g.id]||[],items="",gk=pre+g.id+":";
    for(j=0;j<5;j++){
      var it=t.items[j],text=isOld?it:it[0],seg="";
      for(var n=0;n<4;n++)seg+='<button data-score="'+g.id+':'+j+':'+n+'" aria-pressed="'+(a[j]===n)+'" aria-label="'+esc(T("{0}分 {1}",n,T(SCALE[mode][n])))+'">'+n+'</button>';
      items+='<div class="item"><p>'+ST(gk+"i"+j,T(text))+'</p>'+(isOld?"":'<span class="sym">'+T("對應有己：")+esc(T(it[1]))+'</span>')+
        '<div class="seg" role="group" aria-label="'+T("分數")+'">'+seg+'</div></div>';
    }
    var cnt=answeredCount(a);if(cnt===5)ready=true;
    var helps=isOld
      ?'<p><b>'+esc(T("新人的{0}",T(g.name)))+'</b>'+ST(gk+"np",T(t.newp))+'</p><p><b>'+T("經文")+'</b>'+ST(gk+"v",T(t.verse[0]))+'<span class="vref">'+T("（")+'<span class="rd">'+esc(T(t.verse[1]))+'</span>'+T("）")+'</span></p>'
      :'<p><b>'+T("經文")+'</b>'+ST(gk+"v",T(t.verse[0]))+'<span class="vref">'+T("（")+'<span class="rd">'+esc(T(t.verse[1]))+'</span>'+T("）")+'</span></p><p><b>'+T("宣告")+'</b>'+ST(gk+"d",T(t.decl))+'</p><p><b>'+T("本週操練")+'</b>'+ST(gk+"pr",T(t.practice))+'</p>';
    groups+='<section class="card group" data-g="'+g.id+'"><div class="eyebrow">'+T(g.kind)+DOT()+T(g.name)+'</div><h3 class="rd">'+esc((isEN()?T(g.name)+" — "+T(t.title):T(g.name)+"——"+T(t.title)))+'</h3>'+items+
      '<div class="gscore"><span class="small">'+T("已答 {0}/5",cnt)+'</span><strong>'+sum(a)+'<span class="small"> / 15</span></strong></div>'+
      '<div class="helps">'+helps+'</div></section>';
  }
  return '<section class="card">'+intro+'</section>'+
  '<section class="card"><div class="eyebrow">'+T(isOld?"選擇今天要檢視的部分":"選擇今天要操練的部分")+'</div>'+
    '<div class="split">'+T("五道門戶")+'</div><div class="chips">'+gates+'</div>'+
    '<div class="split">'+T("五重領域")+'</div><div class="chips">'+areas+'</div>'+
    '<div class="legend">'+legend+'</div></section>'+
  (groups||'<div class="card empty">'+T("請在上方選擇至少一道門戶或一個領域。")+'</div>')+
  '<button class="btn '+(isOld?"old":"new")+'" data-finish="'+mode+'"'+(ready?"":" disabled")+'>'+T(isOld?"完成檢視，來到十字架前":"完成操練，把榮耀歸給神")+'</button>'+
  (ready?"":'<p class="small" style="margin:0;text-align:center">'+T("至少完整回答一組（5 題）即可完成。")+'</p>');
}
function viewResult(mode){
  var isOld=mode==="exam",r=state[mode].done,bands="",steps="",id,pre="r:"+mode+":";
  for(id in r.scores){if(!r.scores.hasOwnProperty(id))continue;
    var n=sum(r.scores[id]),b=band(mode,n);
    bands+='<div class="band"><span class="n">'+n+'<span class="small">/15</span></span><div><b class="rd">'+esc(gname(id)+DOT()+T(b[1]))+'</b><br><span class="small">'+T("下一步：")+ST(pre+id,T(b[2]))+'</span></div></div>';}
  for(var i=0;i<STEPS[mode].length;i++)steps+='<li><b>'+T(STEPS[mode][i][0])+'</b>'+T("：")+ST(pre+"s"+i,T(STEPS[mode][i][1]))+'</li>';
  return '<section class="card result"><div class="eyebrow">'+esc(T("{0}・已儲存",fmtDate(r.date)))+'</div>'+
    '<h2 class="rd" style="font-size:24px">'+T(isOld?"看見問題，是聖靈動工的好消息":"基督在你裡面興旺")+'</h2>'+bands+
    verseHTML(isOld?["如今，那些在基督耶穌裡的就不定罪了。","羅馬書8:1"]:["他必興旺，我必衰微。","約翰福音3:30"],pre+"v")+'</section>'+
  '<section class="card"><div class="eyebrow">'+T(isOld?"更新五步：從看見到結果子":"每日操練五步驟")+'</div><ol class="steps">'+steps+'</ol></section>'+
  '<section class="card" data-say="'+esc(T("讓我們一起禱告。"))+'"><div class="eyebrow">'+T(isOld?"認罪更新禱告":"晨間奉獻禱告")+'</div><p class="prayer">'+ST(pre+"pray",T(PRAYER[mode]))+'</p></section>'+
  '<div class="row"><button class="btn '+(isOld?"old":"new")+' wide" data-go="journal" data-jm="'+(isOld?"renew":"victory")+'">'+T(isOld?"寫更新記錄":"寫得勝見證")+'</button>'+
  '<button class="btn ghost wide" data-again="'+mode+'">'+T("再做一次")+'</button></div>';
}

/* ---------- 成長 ---------- */
function latest(kind,id){
  var xs=filterEntries(function(e){return e.kind===kind&&e.scores&&e.scores[id];}).sort(byNewest);
  return xs.length?sum(xs[0].scores[id]):null;
}
function delControls(id){
  return state.confirmDel===id
    ?'<span><button class="linkbtn danger" data-del="'+id+'">'+T("確定刪除")+'</button><button class="linkbtn" data-cancel="1">'+T("取消")+'</button></span>'
    :'<button class="linkbtn" data-ask="'+id+'">'+T("刪除")+'</button>';
}
function chartRows(from,to){
  var out="";
  for(var i=from;i<to;i++){var g=GROUPS[i],o=latest("exam",g.id),n=latest("train",g.id);
    out+='<div class="crow"><span class="lbl">'+T(g.name)+'</span><div class="bars">'+
      '<div class="track o"><i style="width:'+((o||0)/15*100)+'%"></i></div>'+
      '<div class="track n"><i style="width:'+((n||0)/15*100)+'%"></i></div></div>'+
      '<span class="nums">'+(o==null?"–":o)+'<br>'+(n==null?"–":n)+'</span></div>';}
  return out;
}
function backupCard(){
  return '<section class="card" id="backup"><div class="eyebrow">'+T("備份與還原")+'</div>'+
    '<p class="small" style="margin:0">'+T("記錄只存在這支手機的瀏覽器裡。換手機或清除瀏覽器資料前，請先匯出備份檔；在新裝置上匯入即可接續。")+'</p>'+
    '<div class="row"><button class="btn ghost wide" data-export="1">'+T("匯出備份")+'</button><button class="btn ghost wide" data-import="1">'+T("匯入備份")+'</button></div>'+
    '<input type="file" id="importFile" accept=".json,application/json" hidden></section>';
}
function viewGrowth(){
  var sessions=filterEntries(function(e){return !!e.scores;}).sort(byNewest);
  if(!sessions.length)return '<section class="card empty"><h2 class="rd" style="font-size:22px;color:var(--fg)">'+T("成長圖會在這裡出現")+'</h2>'+
    '<p>'+ST("g:empty",T("完成第一次「檢視舊人」或「操練新人」後，這裡會並排顯示每一道門戶與領域的分數：舊人的分數下降、新人的分數上升，就是生命正在更新的記號。"))+'</p>'+
    '<div class="row" style="justify-content:center"><button class="btn old" data-go="exam">'+T("開始檢視")+'</button><button class="btn new" data-go="train">'+T("開始操練")+'</button></div></section>'+backupCard();
  var recs="";
  for(var i=0;i<sessions.length&&i<30;i++){var e=sessions[i],isOld=e.kind==="exam",parts=[];
    for(var id in e.scores){if(e.scores.hasOwnProperty(id)&&G[id])parts.push(gname(id)+" "+sum(e.scores[id]));}
    recs+='<div class="rec"><div class="h"><span><span class="tag '+(isOld?"old":"new")+'">'+T(isOld?"檢視":"操練")+'</span> '+fmtDate(e.date)+'</span>'+delControls(e.id)+'</div>'+
      '<span class="small tnum">'+esc(parts.join(DOT()))+'</span></div>';}
  return '<section class="card"><div class="eyebrow">'+T("最近一次分數（每組滿分 15）")+'</div>'+
    '<h2 class="rd" style="font-size:22px">'+T("舊人衰微，新人興旺")+'</h2>'+
    '<div class="key"><span class="k-old">'+T("舊人有己（越低越好）")+'</span><span class="k-new">'+T("新人無己（越高越好）")+'</span></div>'+
    '<div class="chart"><div class="split">'+T("五道門戶")+'</div>'+chartRows(0,5)+'<div class="split">'+T("五重領域")+'</div>'+chartRows(5,10)+'</div></section>'+
  '<section class="card"><div class="eyebrow">'+T("操練記錄（共 {0} 次）",sessions.length)+'</div>'+recs+'</section>'+backupCard();
}

/* ---------- 生命健檢 ---------- */
var XI_ENDPOINT="https://xiaozhi-proxy.spch321.workers.dev";
var XI_MODEL="claude-sonnet-4-6";
var CK_FIELDS=[["ev","事件","發生了甚麼事？（時間、地點、和誰）","例：晚餐時，太太說我又把碗放著沒洗"],
 ["see","看到甚麼","我的眼睛看到甚麼？","例：她皺著眉頭，孩子在旁邊看"],
 ["hear","聽到甚麼","我的耳朵聽到甚麼？","例：「你每次都這樣」"],
 ["thought","產生甚麼意念","心裡第一個念頭是甚麼？","例：我上班已經很累了，她都不體諒我"],
 ["feel","產生甚麼情緒","當下的感受","例：生氣、委屈"],
 ["said","說了甚麼","我口裡說出的話","例：「你也沒好到哪裡去」"],
 ["did","做了甚麼","我的行動與態度","例：把碗一推，回房間滑手機"]];
var CK_EMOS=["生氣","委屈","煩躁","焦慮","害怕","難過","失望","羞愧","嫉妒","不服氣","被冒犯","冷漠","平安","喜樂","感恩"];
/*NOI18N*/
/*@@CKBASE@@*/
/* 語言：系統提示主體保留 321 原文，回答語言與格式依介面語言改 */
function langLine(){
  if(isEN())return "Write every word of your reply in natural, warm English (the user reads English). Quote Scripture from the World English Bible (WEB) with English book names, e.g. James 1:19. Keep the 321 terms in plain English: old self (self-centered, 'having self'), new self (selfless, 'no self'), the '2' (each person in my life), '0' (selflessness), '9' (the ninefold fruit of the Spirit).";
  if(isZS())return "全部用简体中文回答；引用经文一律用和合本（简体）原文，出处要正确，没有把握的经文宁可不引。";
  return "全部用繁體中文；引用經文一律用和合本原文，出處要正確，沒有把握的經文寧可不引。";
}
function ckBase(){return CK_BASE.replace("全部用繁體中文；引用經文一律用和合本原文，出處要正確，沒有把握的經文寧可不引。",langLine());}
function ckSys(){
  var s=ckBase()+CK_TASK+CK_JSON;
  if(isEN())s+="\n\n[ENGLISH OUTPUT] All JSON string values must be in English. \"who\" must be exactly one of: Old self reigns | Old and new at war | New self reigns. \"area\" must be one of: See, Hear, Think, Speak, Act, Mindset, Life, Living, Relationships, Ministry. \"chain\" k values: Perception, Reaction, Response. Use straight double quotes only for JSON syntax; inside strings use “” for quotations. The prayer ends with: in the name of the Lord Jesus Christ we pray, Amen.";
  else if(isZS())s+="\n\n【简体输出】所有 JSON 字串值一律用简体中文；who、area、chain.k 的选项也用简体（旧人作王｜新旧交战｜新人作王；看｜听｜想｜讲｜行｜观念｜生命｜生活｜关系｜事工；感应｜反应｜回应）。";
  return s+audLine();
}
function ckChatSys(){return ckBase()+CK_TASK+"\n"+CK_CHAT+(isEN()?"\nWrite in English. The last line is always: **Next step to overcome:** one concrete action.":"")+audLine();}
var CK_JSON="【輸出格式】只輸出一個 JSON 物件，不要任何其他文字，不要用```包起來。字串裡不可出現半形雙引號，引用話語一律用「」。每個欄位都要精簡，整份控制在900字以內，務必完整輸出到最後的 }。欄位：\n"+
"{\"title\":\"十五字內的一句話，點出這次健檢的核心\",\n"+
"\"who\":\"舊人作王｜新舊交戰｜新人作王 三選一\",\n"+
"\"picture\":\"生命光景，2到4句\",\n"+
"\"chain\":[{\"k\":\"感應\",\"old\":\"有己的看與聽\",\"new\":\"無己的看與聽可以是\"},{\"k\":\"反應\",\"old\":\"有己的意念與情緒\",\"new\":\"無己的意念與情緒可以是\"},{\"k\":\"回應\",\"old\":\"有己的說與做\",\"new\":\"無己的說與做可以是（寫出可以真的說出口的一句話）\"}],\n"+
"\"root\":\"有己的根：我要的是甚麼，怎樣離開本位、抓住權力\",\n"+
"\"view\":{\"from\":\"我原本的觀點\",\"to\":\"神的觀點\"},\n"+
"\"area\":\"看｜聽｜想｜講｜行｜觀念｜生命｜生活｜關係｜事工 十選一，最需要操練的\",\n"+
"\"fruit\":{\"lack\":\"取代了哪個聖靈果子的舊人表現\",\"grow\":\"這次要結的果子（聖靈九果之一或二）\"},\n"+
"\"verses\":[{\"ref\":\"書卷 章:節\",\"text\":\"和合本經文\"}],（一到二處）\n"+
"\"steps\":[\"更新建議\"],（三到四條，每條40字內，具體可行，涵蓋：向神、向自己、向那位「2」）\n"+
"\"tomorrow\":\"明天一個具體的無己行動，一句話\",\n"+
"\"asks\":[\"三個他最值得繼續追問的問題，第一人稱、具體貼近這件事，每題20字內\"],\n"+
"\"prayer\":\"第一人稱的禱告，約100字，奉主耶穌基督的名禱告，阿們\"}";
var CK_CHAT="【現在的任務：陪他繼續追問】你已經為這件事做過生命健檢（內容在前面的對話裡）。現在他要繼續追問，目標是：實際面對問題、真正解決問題、在這件事上成為得勝者。\n"+
"回答原則：\n1. 緊扣他這件事和他的問題，不重複健檢已說過的內容，往更深、更實際的地方走。\n"+
"2. 要給做得到的東西：可以直接說出口的話（用「」寫出完整句子）、具體步驟、時間點、怎樣面對對方可能的反應、跌倒了怎麼重新起來。\n"+
"3. 先生命、再關係、後事工；先與神、再與自己、再與人、再與事。焦點帶回耶穌，用心靠聖靈。\n"+
"4. 用 markdown 排版：### 小標題、- 條列、1. 編號、**粗體**、> 引用經文（和合本，後面寫出處）。段落短，手機好讀。\n"+
"5. 長度約400到700字，不要寫成 JSON。\n"+
"6. 最後一行固定寫：**得勝的下一步：**一句具體行動。需要時，可在前面問他一個幫助更深的問題。";
/*END*/
var CK_ASKS=["我該怎麼開口道歉、和好？","如果對方不接受，我該怎麼辦？","這個有己的模式常出現，怎樣根本改變？","幫我擬一個七天得勝操練計畫","我心裡還是過不去，怎麼辦？","怎樣邀請屬靈同伴陪我走？"];
var CK_DRAFT="r321-draft-check";
var ck={draft:lsGet(CK_DRAFT,{}),busy:false,err:"",show:null};
function ckVal(k){return ck.draft[k]||"";}
function ckSaveDraft(){
  var qq=$("ck-q");if(qq)ck.askDraft=qq.value;
  for(var i=0;i<CK_FIELDS.length;i++){var el=$("c-"+CK_FIELDS[i][0]);if(el)ck.draft[CK_FIELDS[i][0]]=el.value;}
  lsSet(CK_DRAFT,ck.draft);
}
function ckBlank(s){return !String(s||"").replace(/\s/g,"");}
function ckField(i){var f=CK_FIELDS[i];
  return '<label class="f">'+T(f[1])+'<span class="small" style="font-weight:400">'+T(f[2])+'</span><textarea id="c-'+f[0]+'" placeholder="'+esc(T(f[3]))+'">'+esc(ckVal(f[0]))+'</textarea></label>';}
function ckGroup(no,t,sub,inner){return '<div class="ckgrp"><h3><span class="ckno">'+no+'</span>'+T(t)+'<em>'+T(sub)+'</em></h3>'+inner+'</div>';}

function viewCheck(){
  if(ck.show){var e=ckFind(ck.show);if(e)return viewCheckResult(e);ck.show=null;}
  var emo="";for(var j=0;j<CK_EMOS.length;j++)emo+='<button class="chip" data-emo="'+esc(T(CK_EMOS[j]))+'">'+T(CK_EMOS[j])+'</button>';
  var form='<section class="card"><div class="eyebrow">'+T("生命健檢")+'</div><h2 class="rd" style="font-size:24px">'+T("從一件事，看見生命光景")+'</h2>'+
    verseHTML(["神啊，求你鑒察我，知道我的心思，試煉我，知道我的意念，看在我裡面有甚麼惡行沒有，引導我走永生的道路。","詩篇139:23-24"],"c:form:v")+
    '<p class="small" style="margin:0">'+ST("c:form:n",T("照實寫下就好，不必修飾。小智會沿著「感應→反應→回應」，用 321 陪你看見有己的根，並提出更新的建議。"))+'</p>'+
    ckGroup(1,"事件","發生了甚麼",ckField(0))+
    ckGroup(2,"感應","看到甚麼、聽到甚麼",ckField(1)+ckField(2))+
    ckGroup(3,"反應","產生甚麼意念、甚麼情緒",ckField(3)+ckField(4)+'<div class="emos" aria-label="'+T("點選加入情緒")+'">'+emo+'</div>')+
    ckGroup(4,"回應","說了甚麼、做了甚麼",ckField(5)+ckField(6))+
    (ck.busy
      ?'<div class="busy card" style="background:var(--vine-soft);border:0"><span class="spin"></span><span>'+T("小智正在用 321 為你健檢，約需二、三十秒……")+'</span></div>'
      :'<button class="btn new" data-ck="run">'+T("用 321 分析我的生命光景")+'</button>')+
    (ck.err?'<p class="small" style="margin:0;color:var(--plum)">'+esc(ck.err)+'</p>':'')+
    '<button class="linkbtn" data-ck="clear" style="justify-self:center">'+T("清空重寫")+'</button></section>';
  var list=filterEntries(function(e){return e.kind==="check";}).sort(byNewest),h="";
  for(var k=0;k<list.length&&k<40;k++){var x=list[k],t=x.ai&&x.ai.title?x.ai.title:(x.input.ev||"").slice(0,24);
    h+='<button class="ckrec" data-ckopen="'+x.id+'"><span class="small">'+fmtDate(x.date)+(x.ai&&x.ai.who?DOT()+esc(x.ai.who):'')+'</span><b>'+esc(t)+'</b></button>';}
  return form+'<section class="card"><div class="eyebrow">'+T("健檢記錄")+'</div>'+(h||'<p class="empty" style="margin:0">'+T("還沒有記錄。")+'</p>')+'</section>';
}

function ckWhoClass(w){w=w||"";return /^(新人|New)/i.test(w)?"n":/交戰|交战|war/i.test(w)?"m":"o";}
function ckChatHTML(e,a){
  var ch=e.chat||[],h="",i,asks=(a&&a.asks&&a.asks.length)?a.asks.slice(0,3):[],seen={};
  for(i=0;i<ch.length;i++)seen[ch[i].q]=1;
  for(i=0;i<ch.length;i++){
    h+='<div class="turn"><p class="q">'+esc(ch[i].q)+'</p><div class="ans md">'+mdHTML(ch[i].a)+'</div>'+
      '<div class="msg-actions"><button class="msg-act" data-cka="tts" data-i="'+i+'">🔊 '+T("朗讀")+'</button><button class="msg-act" data-cka="copy" data-i="'+i+'">⧉ '+T("複製")+'</button><button class="msg-act" data-cka="share" data-i="'+i+'">↗ '+T("分享")+'</button><button class="msg-act" data-cka="fav" data-i="'+i+'">★ '+T("收藏")+'</button></div></div>';}
  if(ck.asking===e.id)h+='<div class="turn" id="ck-asking"><p class="q">'+esc(ck.askq)+'</p>'+(ck.partial?'<div class="ans md">'+mdHTML(ck.partial)+'</div>':'')+'<div class="busy"><span class="spin"></span><span>'+T(ck.partial?"小智還在接著寫…":"小智正在思想，陪你找到得勝的路……")+'</span></div></div>';
  for(i=0;i<CK_ASKS.length&&asks.length<6;i++)asks.push(T(CK_ASKS[i]));
  var chips="";for(i=0;i<asks.length;i++){if(seen[asks[i]])continue;seen[asks[i]]=1;chips+='<button class="chip" data-ckask="'+esc(asks[i])+'">'+esc(asks[i])+'</button>';}
  return '<section class="card chat"><div class="eyebrow">'+T("繼續追問小智")+'</div>'+
    '<h3 class="rd" style="font-size:20px">'+T("面對它、解決它，在這件事上得勝")+'</h3>'+
    (ch.length?'':'<p class="small" style="margin:0">'+T("點一個問題，或寫下你自己的問題。小智會給你可以說出口的話、具體的步驟，陪你一步一步走出來。")+'</p>')+h+
    '<div class="emos">'+chips+'</div>'+
    '<textarea id="ck-q" placeholder="'+esc(T("例：她如果又提起罰單，我該怎麼回應？"))+'">'+esc(ck.askDraft||"")+'</textarea>'+
    (ck.askErr?'<p class="small" style="margin:0;color:var(--plum)">'+esc(ck.askErr)+'</p>':'')+
    '<button class="btn new" data-ck="ask" data-id="'+e.id+'"'+(ck.asking?' disabled':'')+'>'+T(ck.asking?"小智回答中……":"追問小智")+'</button></section>';
}
function viewCheckResult(e){
  var a=e.ai||{},inp=e.input,i,out="",pk="c:"+e.id+":";
  if(a.raw&&!a.title){var re=ckParse(a.raw);if(re.title){a=e.ai=re;putEntry(e);}}
  var mine=[["感應",[inp.see,inp.hear]],["反應",[inp.thought,inp.feel]],["回應",[inp.said,inp.did]]];
  out+='<section class="card result"><div class="eyebrow">'+esc(T("{0}・生命健檢",fmtDate(e.date)))+'</div>';
  if(a.raw||!a.title){
    out+='<h2 class="rd" style="font-size:22px">'+T("小智的健檢回覆")+'</h2><div class="md">'+(a.raw?mdHTML(a.raw):'<p>'+T("（這次沒有收到分析，可以按「重新分析」再試一次。）")+'</p>')+'</div></section>';
  }else{
    out+='<h2 style="font-size:24px">'+ST(pk+"t",a.title)+'</h2>'+(a.who?'<span class="who '+ckWhoClass(a.who)+'">'+esc(a.who)+'</span>':'')+
      '<p style="margin:0">'+ST(pk+"pic",a.picture)+'</p>'+
      (a.cut?'<p class="small" style="margin:0;color:var(--gold)">'+T("小智這次的回覆不完整，部分欄位可能空白，可以按下方「重新分析」。")+'</p>':'')+'</section>';
    out+='<section class="card"><div class="eyebrow">'+T("事件")+'</div><p style="margin:0">'+esc(inp.ev)+'</p>';
    var ch=a.chain||[];
    for(i=0;i<3;i++){var c=ch[i]||{},m=mine[i][1],my=[];if(!ckBlank(m[0]))my.push(m[0]);if(!ckBlank(m[1]))my.push(m[1]);
      out+='<div class="lk"><b class="rd">'+T(mine[i][0])+'</b>'+(my.length?'<p class="mine">'+T("我：")+esc(my.join(isEN()?"; ":"；"))+'</p>':'')+
        '<dl class="on">'+(c.old?'<dt class="o">'+T("有己")+'</dt><dd>'+ST(pk+"o"+i,c.old)+'</dd>':'')+(c["new"]?'<dt class="n">'+T("無己")+'</dt><dd>'+ST(pk+"n"+i,c["new"])+'</dd>':'')+'</dl></div>';}
    out+='</section>';
    if(a.root)out+='<section class="card"><div class="eyebrow">'+T("有己的根")+'</div><p style="margin:0">'+ST(pk+"root",a.root)+'</p></section>';
    if(a.view&&(a.view.from||a.view.to))out+='<section class="card"><div class="eyebrow">'+T("觀點轉換：從人的觀點到神的觀點")+'</div><div class="shift">'+
      '<p class="f"><b>'+T("原本：")+'</b>'+ST(pk+"vf",a.view.from||"")+'</p><p class="t"><b>'+T("神看：")+'</b>'+ST(pk+"vt",a.view.to||"")+'</p></div></section>';
    var fr=a.fruit||{};
    out+='<section class="card"><div class="eyebrow">'+T("920・在這個「2」面前")+'</div>'+
      (a.area?'<p style="margin:0"><b>'+T("最需要操練：")+'</b>'+esc(a.area)+'</p>':'')+
      (fr.lack?'<p style="margin:0"><b>'+T("舊人的表現：")+'</b>'+ST(pk+"fl",fr.lack)+'</p>':'')+
      (fr.grow?'<p style="margin:0"><b>'+T("要結的果子：")+'</b>'+ST(pk+"fg",fr.grow)+'</p>':'')+'</section>';
    var vs=a.verses||[];for(i=0;i<vs.length&&i<2;i++){if(vs[i]&&vs[i].text)out+='<section class="card"><blockquote class="verse">'+ST(pk+"v"+i,vs[i].text)+'<cite class="rd">'+esc(vs[i].ref||"")+'</cite></blockquote></section>';}
    var st=a.steps||[],sh="";for(i=0;i<st.length;i++)sh+='<li>'+ST(pk+"s"+i,st[i])+'</li>';
    if(sh)out+='<section class="card"><div class="eyebrow">'+T("更新改變的建議")+'</div><ol class="steps">'+sh+'</ol></section>';
    if(a.tomorrow)out+='<section class="card"><div class="eyebrow">'+T("明天的無己行動")+'</div><p class="act">'+ST(pk+"tm",a.tomorrow)+'</p>'+
      '<p class="small" style="margin:0">'+T("照八大步驟走下去：資訊、啟示、信服、實踐、檢討、修正、反覆、繁殖。")+'</p>'+
      '<button class="btn ghost" data-ck="victory" data-id="'+e.id+'">'+T("我做到了！寫得勝見證")+'</button></section>';
    if(a.prayer)out+='<section class="card" data-say="'+esc(T("讓我們一起禱告。"))+'"><div class="eyebrow">'+T("禱告")+'</div><p class="prayer">'+ST(pk+"pr",a.prayer)+'</p></section>';
  }
  out+=ckChatHTML(e,a);
  out+='<p class="small" style="margin:0;text-align:center">'+T("小智的分析是陪伴與提醒，請以聖經與聖靈的引導為準，也可以和你的屬靈同伴一起禱告。")+'</p>'+
    '<div class="row">'+(a.title?'<button class="btn old wide" data-ck="tojournal" data-id="'+e.id+'">'+T("寫進更新記錄")+'</button>':'')+
    '<button class="btn ghost wide" data-ck="again" data-id="'+e.id+'">'+T("重新分析")+'</button></div>'+
    '<div class="row"><button class="btn new wide" data-ck="new">'+T("健檢另一件事")+'</button></div>'+
    '<div style="text-align:center">'+delControls(e.id)+'</div>';
  return out;
}

function ckPrompt(inp){
  function v(x){return ckBlank(x)?T("（沒有寫）"):x;}
  return T("請為我這件事做生命健檢：")+"\n\n"+T("【事件】")+v(inp.ev)+"\n\n"+T("【感應】")+"\n"+T("看到：")+v(inp.see)+"\n"+T("聽到：")+v(inp.hear)+
    "\n\n"+T("【反應】")+"\n"+T("意念：")+v(inp.thought)+"\n"+T("情緒：")+v(inp.feel)+"\n\n"+T("【回應】")+"\n"+T("說了：")+v(inp.said)+"\n"+T("做了：")+v(inp.did);
}
/* 解析小智的 JSON；被截斷時盡量補回結構 */
function ckTryJSON(t){try{var o=JSON.parse(t);return (o&&typeof o==="object")?o:null;}catch(e){return null;}}
function ckRepair(t){
  var st=[],inS=false,esc1=false,cuts=[],i,c;
  for(i=0;i<t.length;i++){c=t.charAt(i);
    if(inS){if(esc1)esc1=false;else if(c==="\\")esc1=true;else if(c==='"')inS=false;continue;}
    if(c==='"')inS=true;else if(c==="{"||c==="[")st.push(c);else if(c==="}"||c==="]")st.pop();
    else if(c===",")cuts.push([i,st.slice()]);}
  function close(stk){var o="";for(var k=stk.length-1;k>=0;k--)o+=stk[k]==="{"?"}":"]";return o;}
  var base=t;if(inS){if(esc1)base=base.slice(0,-1);base+='"';}
  var o=ckTryJSON(base+close(st));if(o)return o;
  o=ckTryJSON(base+':""'+close(st));if(o)return o;
  for(i=cuts.length-1;i>=0&&i>=cuts.length-40;i--){o=ckTryJSON(t.slice(0,cuts[i][0])+close(cuts[i][1]));if(o)return o;}
  return null;
}
function ckParse(t){
  t=String(t||"").replace(/```(json)?/g,"");
  var a=t.indexOf("{");if(a<0)return {raw:t};
  var b=t.lastIndexOf("}"),o=b>a?ckTryJSON(t.slice(a,b+1)):null,cut=false;
  if(!o){o=ckRepair(t.slice(a));cut=true;}
  if(o&&o.title){if(cut)o.cut=true;return o;}
  return {raw:t};
}
/* 小智請求：messages 陣列，回傳 (錯誤, 文字, 是否被截斷, 原始資料) */
function xiCall(sys,msgs,maxTok,done){
  var x;try{x=new XMLHttpRequest();}catch(e){done(T("這個瀏覽器無法連線"));return;}
  var fin=false;function end(err,txt,cut,d){if(fin)return;fin=true;done(err,txt,cut,d);}
  x.open("POST",XI_ENDPOINT,true);
  x.setRequestHeader("Content-Type","application/json");
  x.timeout=120000;
  x.onreadystatechange=function(){
    if(x.readyState!==4)return;
    if(x.status<200||x.status>=300){end(T("小智暫時連不上（{0}），請稍後再試一次。",x.status||T("網路")));return;}
    try{var d=JSON.parse(x.responseText),t=extractReply(d);
      if(!t)throw 0;end(null,t,isCut(d,t),d);
    }catch(e){end(T("小智的回覆讀不出來，請再試一次。"));}
  };
  x.ontimeout=function(){end(T("等太久沒有回應，請再試一次。"));};
  x.onerror=function(){end(T("網路連不上小智，連上網路後再試一次。"));};
  x.send(JSON.stringify({model:XI_MODEL,max_tokens:maxTok,system:sys,messages:msgs}));
}
function extractReply(d){if(!d)return "";if(typeof d==="string")return d;var t="";
  if(d.content&&d.content.length){for(var i=0;i<d.content.length;i++){if(d.content[i].type==="text"||d.content[i].text)t+=d.content[i].text||"";}if(t)return t;}
  return d.reply||d.text||d.message||(d.choices&&d.choices[0]&&d.choices[0].message?d.choices[0].message.content:"")||"";}
/* 回答被截斷？有 stop_reason 就照它；沒有時，長文沒有結束標點才猜是截斷 */
function isCut(d,t){
  var sr=d&&(d.stop_reason||d.finish_reason||(d.choices&&d.choices[0]&&d.choices[0].finish_reason));
  if(sr)return sr==="max_tokens"||sr==="length";
  t=trim(mdStrip(t));return t.length>300&&!/[。！？.!?」』”)）們men]$/.test(t);
}
function joinCont(a,b){
  b=String(b).replace(/^\s*(好的|好|接續|繼續|继续|接着|接著|Continuing|Sure)[，,:：。.!！]?\s*/i,"");
  for(var n=Math.min(80,a.length,b.length);n>=6;n--)if(a.slice(-n)===b.slice(0,n))return a+b.slice(n);
  var nl=/^(#|>|-|\*|\d+[.、]|\|)/.test(trim(b))&&!/\n$/.test(a);
  return a+(nl?"\n\n":"")+b;
}
/* 自動接續：被截斷就把已寫的當 assistant，再請它從中斷處接著寫，最多再接 max 次；onPart 邊收邊顯示 */
function xiChat(sys,msgs,maxTok,max,onPart,done){
  var acc="";
  (function round(k){
    var ms=msgs.slice();if(k){ms.push({role:"assistant",content:acc});ms.push({role:"user",content:T("請從中斷的地方直接接著寫完，不要重複前面已經寫過的內容，也不要加開場白。")});}
    xiCall(sys,ms,maxTok,function(err,txt,cut,d){
      if(err){if(acc){done(null,acc);return;}done(err);return;}
      var sure=d&&(d.stop_reason||d.finish_reason);
      acc=k?joinCont(acc,txt):txt;
      if(cut&&k<(sure?max:1)){if(onPart)onPart(acc);round(k+1);return;}
      done(null,acc);
    });
  })(0);
}
function ckRun(inp,oldId){
  ck.busy=true;ck.err="";if(oldId)ck.show=null;render();
  if(!oldId)setTimeout(function(){var b=document.querySelector(".busy");if(b&&b.scrollIntoView)b.scrollIntoView({block:"center"});},30);
  xiCall(ckSys(),[{role:"user",content:ckPrompt(inp)}],4000,function(err,txt){
    ck.busy=false;
    if(err){ck.err=err+(oldId?"":T("草稿已保留。"));if(oldId)ck.show=oldId;if(state.tab==="check")keepScroll();toast(err.split(/[，,]/)[0]);return;}
    var tnow=now(),rec={id:oldId||("check-"+tnow),kind:"check",date:TODAY,ts:tnow,input:inp,ai:ckParse(txt),chat:[],lang:L()};
    if(oldId){var old=ckFind(oldId);if(old){rec.date=old.date;rec.ts=old.ts;rec.chat=old.chat||[];}}
    if(!putEntry(rec)){toast(T(SAVE_FAIL));}
    if(!oldId){ck.draft={};lsSet(CK_DRAFT,ck.draft);}
    ck.show=rec.id;
    if(state.tab==="check"){render();window.scrollTo(0,0);}
    toast(T("健檢完成"));
  });
}
/*NOI18N*/
function ckSummary(a){
  if(!a||!a.title)return String(a&&a.raw||"").slice(0,1500);
  var o=["【健檢結果】"+a.title+"（"+(a.who||"")+"）",a.picture||""],i,c=a.chain||[];
  for(i=0;i<c.length;i++){if(c[i])o.push(c[i].k+"——有己："+(c[i].old||"")+"；無己："+(c[i]["new"]||""));}
  if(a.root)o.push("有己的根："+a.root);
  if(a.view)o.push("觀點轉換："+(a.view.from||"")+" → "+(a.view.to||""));
  if(a.area)o.push("最需要操練："+a.area);
  if(a.fruit)o.push("要結的果子："+(a.fruit.grow||""));
  if(a.steps)o.push("建議："+a.steps.join("；"));
  if(a.tomorrow)o.push("明天的無己行動："+a.tomorrow);
  return o.join("\n");
}
/*END*/
function ckAskMore(id,q){
  var e=ckFind(id);if(!e||ck.asking)return;
  q=trim(q);if(!q){toast(T("請寫下想追問的問題"));return;}
  e.chat=e.chat||[];
  var msgs=[{role:"user",content:ckPrompt(e.input)},{role:"assistant",content:ckSummary(e.ai)}],i,from=Math.max(0,e.chat.length-5);
  for(i=from;i<e.chat.length;i++){msgs.push({role:"user",content:e.chat[i].q});msgs.push({role:"assistant",content:e.chat[i].a});}
  msgs.push({role:"user",content:q});
  ck.asking=id;ck.askq=q;ck.askErr="";ck.askDraft="";ck.partial="";keepScroll();
  setTimeout(function(){var b=$("ck-asking");if(b&&b.scrollIntoView)b.scrollIntoView({block:"center"});},30);
  xiChat(ckChatSys(),msgs,2500,3,function(part){ck.partial=part;if(state.tab==="check"&&ck.show===id&&!hlOpen())keepScroll();},function(err,txt){
    ck.asking=null;ck.partial="";
    if(err){ck.askErr=err;ck.askDraft=q;if(state.tab==="check")keepScroll();toast(err.split(/[，,]/)[0]);return;}
    var cur=ckFind(id);if(!cur)return;cur.chat=cur.chat||[];
    cur.chat.push({q:q,a:txt,ts:now()});
    putEntry(cur);
    if(state.tab==="check"&&ck.show===id){render();setTimeout(function(){var ls=document.querySelectorAll(".turn");if(ls.length&&ls[ls.length-1].scrollIntoView)ls[ls.length-1].scrollIntoView({block:"start"});},30);}
    toast(T("小智回答了"));
  });
}
function ckFind(id){for(var i=0;i<entries.length;i++){if(entries[i].id===id)return entries[i];}return null;}
function ckClick(b){
  var act=b.getAttribute("data-ck"),id=b.getAttribute("data-id");
  if(act==="run"){
    ckSaveDraft();var inp={};for(var i=0;i<CK_FIELDS.length;i++){var k=CK_FIELDS[i][0];inp[k]=trim(ck.draft[k]||"");}
    if(ckBlank(inp.ev)){toast(T("請先寫下發生了甚麼事"));$("c-ev").focus();return;}
    if(ckBlank(inp.thought+inp.feel+inp.said+inp.did)){toast(T("請至少寫下一項反應或回應"));return;}
    if(ck.busy)return;ckRun(inp,null);return;
  }
  if(act==="clear"){ck.draft={};lsSet(CK_DRAFT,ck.draft);ck.err="";render();return;}
  if(act==="new"){ck.show=null;ck.err="";ck.askDraft="";ck.askErr="";render();window.scrollTo(0,0);return;}
  if(act==="again"){var e=ckFind(id);if(e&&!ck.busy)ckRun(e.input,id);return;}
  if(act==="ask"){var qa2=$("ck-q");ckAskMore(id,qa2?qa2.value:"");return;}
  if(act==="victory"){var rv=ckFind(id);if(!rv)return;var av=rv.ai||{};
    state.jmode="victory";jdraft={mode:"victory",area:areaOf(av.area),a:rv.input.ev,b:av.tomorrow||"",c:"",d:"",fruits:fruitsOf(av.fruit&&av.fruit.grow)};
    go("journal");toast(T("已帶入得勝見證，寫下感恩後按儲存"));return;}
  if(act==="tojournal"){var r=ckFind(id);if(!r)return;var a=r.ai||{};
    var v=(a.verses&&a.verses[0])?(a.verses[0].ref+" "+a.verses[0].text):"";
    state.jmode="renew";jdraft={mode:"renew",area:areaOf(a.area),a:r.input.ev,b:a.root||"",c:v,d:a.tomorrow||"",fruits:[]};
    go("journal");toast(T("已帶入更新記錄，確認後按儲存"));return;}
}
/* 小智回的領域／果子（可能是繁、简、英）對回原本的繁體名稱 */
function areaOf(s){s=String(s||"");for(var g=0;g<GROUPS.length;g++){var n=GROUPS[g].name;if(s.indexOf(n)>-1||s.indexOf(T(n))>-1||(PACK.zs&&PACK.zs[n]&&s.indexOf(PACK.zs[n])>-1))return n;}return "關係";}
function fruitsOf(s){s=String(s||"");var o=[];for(var f=0;f<FRUITS.length;f++){var n=FRUITS[f][1];if(s.indexOf(n)>-1||s.toLowerCase().indexOf(T(n).toLowerCase())>-1)o.push(n);}return o;}

/* ---------- 日記 ---------- */
function areaOptions(){var o="";for(var i=0;i<GROUPS.length;i++)o+='<option value="'+GROUPS[i].name+'">'+T(GROUPS[i].name)+'</option>';return o;}
function viewJournal(){
  if(state.jmode==="marks")return jSeg()+marksHTML();
  var isR=state.jmode==="renew",form,i;
  if(isR){
    form='<label class="f">'+T("門戶／領域")+'<select id="j-area">'+areaOptions()+'</select></label>'+
      '<label class="f">'+T("發生了甚麼")+'<textarea id="j-a" placeholder="'+esc(T("例：配偶提醒我遲到，我立刻頂回去"))+'"></textarea></label>'+
      '<label class="f">'+T("有己的根（我要的是甚麼？）")+'<textarea id="j-b" placeholder="'+esc(T("例：我要面子，不要被指正"))+'"></textarea></label>'+
      '<label class="f">'+T("神的觀點（經文）")+'<textarea id="j-c" placeholder="'+esc(T("例：雅各書1:19 快快的聽，慢慢的說"))+'"></textarea></label>'+
      '<label class="f">'+T("明天的無己行動")+'<textarea id="j-d" placeholder="'+esc(T("例：明早先說「謝謝你提醒我」"))+'"></textarea></label>';
  }else{
    var fr="";for(i=0;i<FRUITS.length;i++)fr+='<button class="chip" data-fruit="'+FRUITS[i][1]+'" aria-pressed="false">'+T(FRUITS[i][1])+'</button>';
    form='<label class="f">'+T("門戶／領域")+'<select id="j-area">'+areaOptions()+'</select></label>'+
      '<label class="f">'+T("遇到的處境")+'<textarea id="j-a" placeholder="'+esc(T("例：配偶提醒我遲到"))+'"></textarea></label>'+
      '<label class="f">'+T("我如何讓耶穌作王")+'<textarea id="j-b" placeholder="'+esc(T("例：先停三秒禱告，說「謝謝你提醒我，對不起」"))+'"></textarea></label>'+
      '<div class="f"><span class="small" style="font-weight:700">'+T("結出的果子")+'</span><div class="chips">'+fr+'</div></div>'+
      '<label class="f">'+T("感恩與榮耀歸神")+'<textarea id="j-d" placeholder="'+esc(T("例：謝謝主，一場爭吵變成一個擁抱"))+'"></textarea></label>';
  }
  var list=filterEntries(function(e){return e.kind==="renew"||e.kind==="victory";}).sort(byNewest),html="";
  for(i=0;i<list.length;i++){var e=list[i],r=e.kind==="renew",frs=[];
    eachA(e.fruits||[],function(f){frs.push(T(f));});
    var body=r?[["發生",e.a],["有己的根",e.b],["神的觀點",e.c],["無己行動",e.d]]:[["處境",e.a],["讓耶穌作王",e.b],["果子",frs.join(isEN()?", ":"、")],["感恩",e.d]],bh="";
    for(var j=0;j<body.length;j++){if(body[j][1])bh+='<span><b class="small">'+T(body[j][0])+T("：")+'</b>'+esc(body[j][1])+'</span>';}
    html+='<div class="rec"><div class="h"><span><span class="tag '+(r?"old":"new")+'">'+T(r?"更新記錄":"得勝見證")+'</span> '+fmtDate(e.date)+DOT()+esc(T(e.area))+'</span>'+delControls(e.id)+'</div>'+bh+'</div>';}
  return jSeg()+'<section class="card">'+
    '<p class="small" style="margin:0">'+T(isR?"把看見的有己帶到十字架前，寫下明天一個具體的無己行動。":"記下讓耶穌作王的時刻，凡事謝恩，把榮耀歸給耶穌。")+'</p>'+
    form+'<button class="btn '+(isR?"old":"new")+'" id="j-save">'+T("儲存")+'</button></section>'+
  '<section class="card"><div class="eyebrow">'+T("我的記錄")+'</div>'+(html||'<p class="empty" style="margin:0">'+T("還沒有記錄。第一筆可以從今天一件小事開始寫起。")+'</p>')+'</section>';
}
function jSeg(){var m=state.jmode;
  return '<div class="seg3"><button data-jmode="renew" aria-pressed="'+(m==="renew")+'">'+T("更新記錄")+'</button><button data-jmode="victory" aria-pressed="'+(m==="victory")+'">'+T("得勝見證")+'</button><button data-jmode="marks" aria-pressed="'+(m==="marks")+'">'+T("畫線收藏")+'</button></div>';}

/* ---------- 日記草稿 ---------- */
var jdraft=null;
function saveJournalDraft(){
  if(!$("j-a"))return jdraft;
  var fr=[],bs=document.querySelectorAll("[data-fruit]");
  for(var i=0;i<bs.length;i++){if(bs[i].getAttribute("aria-pressed")==="true")fr.push(bs[i].getAttribute("data-fruit"));}
  jdraft={mode:state.jmode,area:$("j-area").value,a:$("j-a").value,b:$("j-b").value,c:$("j-c")?$("j-c").value:"",d:$("j-d").value,fruits:fr};
  return jdraft;
}
function restoreJournalDraft(d){
  if(!d||d.mode!==state.jmode||!$("j-a"))return;
  $("j-area").value=d.area;$("j-a").value=d.a;$("j-b").value=d.b;if($("j-c"))$("j-c").value=d.c;$("j-d").value=d.d;
  var bs=document.querySelectorAll("[data-fruit]");
  for(var i=0;i<bs.length;i++){if(has(d.fruits,bs[i].getAttribute("data-fruit")))bs[i].setAttribute("aria-pressed","true");}
}

/* ---------- 繪製 ---------- */
var app=$("app");
function render(){
  app.className="view"+(state.tab==="exam"?" mode-old":state.tab==="train"?" mode-new":"");
  var v=state.tab;
  app.innerHTML=v==="home"?viewHome():v==="check"?viewCheck():v==="exam"?viewPractice("exam"):v==="train"?viewPractice("train"):v==="growth"?viewGrowth():viewJournal();
  var tb=document.querySelectorAll("#tabs button");
  for(var i=0;i<tb.length;i++){tb[i].setAttribute("aria-current",tb[i].getAttribute("data-tab")===state.tab?"page":"false");}
  if(state.tab==="journal"&&jdraft)restoreJournalDraft(jdraft);
  afterRender();
}
function keepScroll(){var y=window.pageYOffset;render();window.scrollTo(0,y);}
function go(tab){
  if(state.tab==="journal")saveJournalDraft();
  if(tab==="check"&&state.tab!=="check")ck.show=null;
  if(tab!==state.tab)stopAll();
  state.tab=tab;state.confirmDel=null;
  try{history.replaceState(null,"","#"+tab);}catch(e){}
  render();window.scrollTo(0,0);
}

/* ---------- 備份 ---------- */
function exportBackup(){
  var data=JSON.stringify({app:"321生命操練",version:2,exported:new Date().toISOString(),entries:entries,hl:HL,fav:FAV},null,1);
  try{
    var blob=new Blob([data],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");
    a.href=url;a.download=(isEN()?"321life-backup-":"321生命操練備份-")+TODAY+".json";document.body.appendChild(a);a.click();
    setTimeout(function(){document.body.removeChild(a);URL.revokeObjectURL(url);},1000);
    toast(T("已匯出備份檔"));
  }catch(e){toast(T("這個瀏覽器無法下載檔案，請改用 Safari 或 Chrome 開啟"));}
}
function importBackup(file){
  var rd=new FileReader();
  rd.onload=function(){
    try{
      var obj=JSON.parse(rd.result),list=obj&&obj.entries;
      if(!list||typeof list.length!=="number")throw 0;
      var seen={},i,added=0;
      for(i=0;i<entries.length;i++)seen[entries[i].id]=1;
      for(i=0;i<list.length;i++){if(list[i]&&list[i].id&&!seen[list[i].id]){entries.push(list[i]);seen[list[i].id]=1;added++;}}
      if(obj.hl&&typeof obj.hl==="object"){for(var k in obj.hl){if(obj.hl.hasOwnProperty(k)&&!HL[k])HL[k]=obj.hl[k];}saveHL();}
      if(obj.fav&&obj.fav.length){eachA(obj.fav,function(f){if(f&&f.text&&!isFav(f.text))FAV.push(f);});saveFav();}
      saveAll();render();toast(T("已匯入 {0} 筆記錄",added));
    }catch(e){toast(T("這不是 321生命操練的備份檔，請重新選擇"));}
  };
  rd.readAsText(file);
}

/* ---------- 事件 ---------- */
$("tabs").addEventListener("click",function(e){var b=closestBtn(e.target,this);if(b)go(b.getAttribute("data-tab"));});
app.addEventListener("input",function(){if(state.tab==="journal")saveJournalDraft();else if(state.tab==="check")ckSaveDraft();});
app.addEventListener("change",function(e){
  if(e.target.id==="importFile"&&e.target.files&&e.target.files[0]){importBackup(e.target.files[0]);e.target.value="";}
  else if(state.tab==="journal")saveJournalDraft();
});
app.addEventListener("click",function(e){
  var sn=e.target;while(sn&&sn!==app&&!(sn.className&&String(sn.className).indexOf("sent")===0))sn=sn.parentNode;
  if(sn&&sn!==app&&!closestBtn(e.target,app)){onSentTap(sn);return;}
  var nt=e.target;while(nt&&nt!==app&&!(nt.className==="hl-note"))nt=nt.parentNode;
  if(nt&&nt!==app){var own=sentByKey(nt.getAttribute("data-hk"));if(own)openHlSheet(own);return;}
  var b=closestBtn(e.target,app);if(!b)return;
  var at=function(n){return b.getAttribute("data-"+n);},S,mode,i;
  if(at("ck")){ckClick(b);return;}
  if(at("cka")){ckAct(at("cka"),+at("i"));return;}
  if(at("mk")){marksAct(b);return;}
  if(at("ckask")){if(ck.show)ckAskMore(ck.show,at("ckask"));return;}
  if(at("ckopen")){ck.show=at("ckopen");ck.err="";ck.askDraft="";ck.askErr="";render();window.scrollTo(0,0);return;}
  if(at("emo")){var ta=$("c-feel");if(ta){var w=at("emo");ta.value=ta.value.replace(/\s+$/,"")+(ta.value.replace(/\s/g,"")?(isEN()?", ":"、"):"")+w;ckSaveDraft();}return;}
  if(at("go")){if(at("jm")){state.jmode=at("jm");jdraft=null;}go(at("go"));return;}
  if(at("pick")){
    S=state[state.tab];var id=at("pick"),sel=[];
    for(i=0;i<GROUPS.length;i++){var gid=GROUPS[i].id;if(gid===id?!has(S.sel,id):has(S.sel,gid))sel.push(gid);}
    S.sel=sel;keepScroll();return;
  }
  if(at("score")){
    var p=at("score").split(":");mode=state.tab;S=state[mode];
    var a=S.ans[p[0]]=S.ans[p[0]]||[null,null,null,null,null],ix=+p[1],n=+p[2];
    a[ix]=a[ix]===n?null:n;lsSet("r321-draft-"+mode,S.ans);keepScroll();return;
  }
  if(at("finish")){
    mode=at("finish");S=state[mode];var scores={},any=false;
    for(i=0;i<S.sel.length;i++){var aa=S.ans[S.sel[i]]||[];if(answeredCount(aa)===5){scores[S.sel[i]]=aa.slice();any=true;}}
    if(!any)return;
    var rec={id:mode+"-"+now(),kind:mode,date:TODAY,ts:now(),scores:scores};
    if(!putEntry(rec)){toast(T(SAVE_FAIL));return;}
    S.done=rec;for(var sid in scores){if(scores.hasOwnProperty(sid))delete S.ans[sid];}
    lsSet("r321-draft-"+mode,S.ans);stopAll();render();window.scrollTo(0,0);toast(T("已儲存"));return;
  }
  if(at("again")){state[at("again")].done=null;stopAll();render();window.scrollTo(0,0);return;}
  if(at("jmode")){if(state.jmode!=="marks")saveJournalDraft();state.jmode=at("jmode");if(jdraft&&jdraft.mode!==state.jmode)jdraft=null;render();return;}
  if(at("fruit")){b.setAttribute("aria-pressed",b.getAttribute("aria-pressed")==="true"?"false":"true");saveJournalDraft();return;}
  if(at("ask")){state.confirmDel=at("ask");keepScroll();return;}
  if(at("cancel")){state.confirmDel=null;keepScroll();return;}
  if(at("del")){if(ck.show===at("del"))ck.show=null;delEntry(at("del"));state.confirmDel=null;keepScroll();toast(T("已刪除"));return;}
  if(at("export")){exportBackup();return;}
  if(at("import")){$("importFile").click();return;}
  if(b.id==="j-save"){
    var j=saveJournalDraft();
    if(!j.a.replace(/\s/g,"")&&!j.b.replace(/\s/g,"")&&!j.d.replace(/\s/g,"")){toast(T("請至少寫下一欄內容"));return;}
    var r={id:j.mode+"-"+now(),kind:j.mode,date:TODAY,ts:now(),area:j.area,a:trim(j.a),b:trim(j.b),c:trim(j.c),d:trim(j.d),fruits:j.fruits};
    if(!putEntry(r)){toast(T(SAVE_FAIL));return;}
    jdraft=null;render();toast(T("已儲存，榮耀歸給耶穌"));
  }
});
