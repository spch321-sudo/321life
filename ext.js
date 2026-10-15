/* 321生命操練 — 擴充：三語切換、字級主題、畫線、逐句朗讀（背景播放）、小智（ES5） */
var APPVER="@@VER@@";
var SVC={xz:XI_ENDPOINT,tts:"https://azure-tts.spch321.workers.dev",model:XI_MODEL};
var VOICES={
  zh:[["zh-TW-YunJheNeural","雲哲"],["zh-CN-Yunfan:DragonHDLatestNeural","雲帆"],["zh-CN-Xiaochen:DragonHDLatestNeural","曉辰"]],
  zs:[["zh-CN-Yunfan:DragonHDLatestNeural","雲帆"],["zh-CN-Xiaochen:DragonHDLatestNeural","曉辰"],["zh-TW-YunJheNeural","雲哲"]],
  en:[["en-US-AndrewNeural","Andrew"],["en-US-EmmaNeural","Emma"],["en-US-BrianNeural","Brian"]]};
var RATES=["+0%","-12%","+12%"];
var HL=lsGet("r321-life-hl",{}),FAV=lsGet("r321-life-fav",[]),CHAT=lsGet("r321-life-chat",[]);
function saveHL(){lsSet("r321-life-hl",HL);}
function saveFav(){lsSet("r321-life-fav",FAV);}
function saveChat(){if(CHAT.length>60)CHAT=CHAT.slice(-60);lsSet("r321-life-chat",CHAT);}
if(SET.human==null)SET.human=true;if(!SET.aud)SET.aud="adult";

/* ---------- 語言包與外觀 ---------- */
function loadPack(l,cb){
  if(l==="zh"||PACK[l]){cb();return;}
  var key="r321-life-pack-"+l,c=lsGet(key,null);
  if(c&&c.v===APPVER&&c.d){PACK[l]=c.d;cb();return;}
  var x=new XMLHttpRequest(),fin=false;
  function end(){if(fin)return;fin=true;if(!PACK[l]&&c&&c.d)PACK[l]=c.d;cb();}
  try{x.open("GET","lang-"+l+".json?v="+APPVER,true);x.timeout=12000;
    x.onload=function(){if(x.status>=200&&x.status<300){try{PACK[l]=JSON.parse(x.responseText);lsSet(key,{v:APPVER,d:PACK[l]});}catch(e){}}end();};
    x.onerror=x.ontimeout=end;x.send();}catch(e){end();}
}
var FONT_URL={zs:"https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@600;800&family=Noto+Sans+SC:wght@400;500;700&display=swap"};
function applyChrome(){
  var h=document.documentElement;
  eachA(["fs-lg","fs-xl","fs-xxl"],function(c){h.classList.remove(c);});
  var F=["","fs-lg","fs-xl","fs-xxl"][SET.font||0];if(F)h.classList.add(F);
  h.setAttribute("lang",isEN()?"en":(isZS()?"zh-Hans":"zh-Hant-TW"));h.setAttribute("data-lang",L());
  if(SET.theme)h.setAttribute("data-theme",SET.theme);else h.removeAttribute("data-theme");
  if(FONT_URL[L()]&&!$("font-"+L())){var ln=document.createElement("link");ln.rel="stylesheet";ln.id="font-"+L();ln.href=FONT_URL[L()];document.head.appendChild(ln);}
  document.title=T("321生命操練");
  var hd=$("hdtitle");if(hd)hd.textContent=T("生命操練");
  eachA(qa("#langsw button"),function(b){b.className=b.getAttribute("data-l")===L()?"on":"";});
  var nb=qa("#tabs button");var NL=["今日","生命健檢","檢視舊人","操練新人","成長","日記"];
  eachA(nb,function(b,i){var sp=b.querySelector("span");if(sp)sp.textContent=T(NL[i]);});
  $("tabs").setAttribute("aria-label",T("主選單"));
  var fb=$("fabxz");if(fb)fb.setAttribute("aria-label",T("問小智"));
  drawFab();
}
function switchLang(l){
  if(l===L())return;stopAll();closeSheet();
  if(state.tab==="journal")saveJournalDraft();
  SET.lang=l;saveSet();
  loadPack(l,function(){applyChrome();render();if(XZ.open)drawXz();toast(T("已切換為繁體中文"));});
}
function cycleFont(){SET.font=((SET.font||0)+1)%4;saveSet();applyChrome();toast(T("字級：{0}",T(["標準","大","特大","超大"][SET.font])));if($("setsheet"))openSettings();}

/* ---------- 共用底部面板 ---------- */
function closeSheet(){var m=$("sheet");if(m)m.parentNode.removeChild(m);hlCur=null;}
function openSheet(html,id){
  closeSheet();var m=document.createElement("div");m.id="sheet";m.className="sheet-mask";
  m.innerHTML='<div class="sheet-card" role="dialog" aria-modal="true"'+(id?' id="'+id+'"':'')+'>'+html+'</div>';
  document.body.appendChild(m);m.onclick=function(e){if(e.target===m)closeSheet();};return m;
}
function hlOpen(){return !!$("sheet");}

/* ---------- 設定 ---------- */
function segBtns(name,opts,cur){var h='<div class="segx">';eachA(opts,function(o){h+='<button data-set="'+name+'" data-v="'+o[0]+'" class="'+(String(o[0])===String(cur)?"on":"")+'">'+esc(o[1])+'</button>';});return h+'</div>';}
function openSettings(){
  var vs=[];eachA(VOICES[L()],function(v,i){vs.push([i,v[1]]);});
  openSheet('<div class="sheet-title">'+T("設定")+'<button class="sheet-x" data-sa="close" aria-label="'+T("關閉")+'">✕</button></div>'+
    '<div class="setrow"><span>'+T("語言")+'</span>'+segBtns("lang",[["zh","繁體"],["zs","简体"],["en","English"]],L())+'</div>'+
    '<div class="setrow"><span>'+T("字級")+'</span>'+segBtns("font",[[0,T("標準")],[1,T("大")],[2,T("特大")],[3,T("超大")]],SET.font||0)+'</div>'+
    '<div class="setrow"><span>'+T("主題")+'</span>'+segBtns("theme",[["",T("自動")],["light",T("淺色")],["dark",T("深色")]],SET.theme||"")+'</div>'+
    '<div class="setrow"><span>'+T("朗讀語音")+'</span>'+segBtns("voice",vs,SET.voice||0)+'</div>'+
    '<div class="setrow"><span>'+T("朗讀速度")+'</span>'+segBtns("rate",[[1,T("慢")],[0,T("正常")],[2,T("快")]],SET.rate||0)+'</div>'+
    '<div class="setrow"><span>'+T("真人語音")+'</span>'+segBtns("human",[[1,T("開")],[0,T("關（用手機內建語音）")]],SET.human?1:0)+'</div>'+
    '<div class="setrow"><span>'+T("小智回答對象")+'</span>'+segBtns("aud",audOpts(),SET.aud)+'</div>'+
    '<div class="row" style="margin-top:6px"><button class="btn ghost wide" data-sa="marks">'+T("我的畫線與收藏")+'</button><button class="btn ghost wide" data-sa="backup">'+T("備份與還原")+'</button></div>'+
    '<div class="setver"><span>'+T("版本")+' '+esc(APPVER)+'</span><span><button class="linkbtn" data-sa="chk">'+T("檢查更新")+'</button><button class="linkbtn" data-sa="hard">'+T("強制更新")+'</button></span></div>','setsheet');
}
function setClick(b){
  var n=b.getAttribute("data-set"),v=b.getAttribute("data-v");
  if(n==="lang"){switchLang(v);setTimeout(openSettings,60);return;}
  if(n==="font"){SET.font=+v;saveSet();applyChrome();}
  else if(n==="theme"){SET.theme=v;saveSet();applyChrome();}
  else if(n==="voice"){SET.voice=+v;saveSet();stopAll();speakText(T("平安！我來為你朗讀。"),"try");}
  else if(n==="rate"){SET.rate=+v;saveSet();stopAll();}
  else if(n==="human"){SET.human=v==="1";saveSet();stopAll();}
  else if(n==="aud"){SET.aud=v;saveSet();if(XZ.open)drawXz();}
  toast(T("已更新設定"));openSettings();
}
/*NOI18N*/
var AUD_KEYS=["adult", "teen", "kid", "seeker", "elder", "single_parent", "single", "parent", "couple", "pastor"],AUD_ICON={"adult": "🧑", "teen": "🧒", "kid": "🧸", "seeker": "🌱", "elder": "👴", "single_parent": "👩‍👧", "single": "🙋", "parent": "👨‍👩‍👧", "couple": "💑", "pastor": "⛪"},AUD_NM={"zh": {"adult": "成人", "teen": "青少年", "kid": "兒童", "seeker": "慕道友", "elder": "長輩", "single_parent": "單親", "single": "單身", "parent": "父母", "couple": "夫妻", "pastor": "牧者"}, "zs": {"adult": "成人", "teen": "青少年", "kid": "儿童", "seeker": "慕道友", "elder": "长辈", "single_parent": "单亲", "single": "单身", "parent": "父母", "couple": "夫妻", "pastor": "牧者"}, "en": {"adult": "Adult", "teen": "Teen", "kid": "Child", "seeker": "Seeker", "elder": "Elder", "single_parent": "Single parent", "single": "Single", "parent": "Parent", "couple": "Couple", "pastor": "Pastor"}},AUD_SYS6={"zh": {"elder": "\n\n回答對象：長輩（約65歲以上）。請用尊敬、溫和、慢慢說的口吻，像晚輩敬重地陪長輩讀經；句子清楚、不拐彎，不用網路用語和英文縮寫；比喻取自一生的閱歷（田地、家人、歲月、病痛、孫子、老街坊）。重點先講，分成短段落，不要太長。肯定他們一生走過的路與在主裡的忠心，不說教、不指責、不用「你應該」。可以談健康與軟弱、孤單、放下與交託、把信仰傳給下一代、永恆的盼望與感恩。結尾給一件簡單、容易做到的小事（一句禱告、打電話問候家人、數算一件感謝）。若提到身體不適、孤單或失去親人，要先溫柔安慰，並鼓勵他和家人、教會關懷同工聯絡。", "single_parent": "\n\n回答對象：單親爸爸或媽媽（一個人撐起一個家）。請先接住他的辛苦：他常常很累、有愧疚、有孤單，也有經濟、時間與教養的壓力。口吻溫暖、接納、不評斷，不追問過去的原因，不說「你應該再找個伴」，也不把單親說成缺憾。引用神的心意：神是孤兒的父、寡婦的伸冤者（詩篇68:5），祂與我們同在。再給盼望與實際：每一個小步驟都要在忙碌中做得到（五分鐘禱告、跟孩子的一個小儀式、開口向弟兄姊妹求助）。內容簡短、段落要短。結尾給一個這個星期做得到的小步驟。若他提到被暴力對待、疲憊到撐不下去或想傷害自己，要溫柔回應，並鼓勵他立刻聯絡信任的人、教會同工或專業協助。", "single": "\n\n回答對象：單身的人（可能未婚、離婚、喪偶，或正在等候；不要預設他想結婚或不想結婚）。請不要把單身說成缺憾、「預備期」或「還沒到的人生」，也不要用催婚的口氣。談在基督裡的身分已經完整、被愛；談孤單時怎麼與神、與朋友、與團契連結；談時間、金錢與恩賜的運用與使命；談等待中的信靠；談感情與婚姻的智慧，以及在情感與身體上的聖潔，態度要尊重、不論斷。口吻真誠、平等、輕鬆。結尾給一個這個星期可以做的小步驟。若他提到孤單到想傷害自己，要溫柔回應並鼓勵他立刻聯絡信任的人或專業協助。", "parent": "\n\n回答對象：正在養育孩子的父母（孩子可能從嬰幼兒到成年）。請站在父母的位置：他們常常疲累、擔心孩子、也常常內疚。口吻溫暖、貼近生活、不評斷；承認每個孩子與每個家庭都不同。談陪伴與榜樣、管教與恩典的平衡、親子溝通（怎麼聽、怎麼說）、為孩子禱告、夫妻同心、面對自己的軟弱與失敗；可用日常場景當比喻（吃飯、功課、手機、睡前）。結尾給一個這個星期可以做的具體小步驟（一句話、一個擁抱、一段睡前禱告）。若提到孩子遭受傷害、家庭暴力或孩子有自傷的念頭，要溫柔回應並鼓勵立刻尋求專業協助與信任的人。", "couple": "\n\n回答對象：夫妻（正在經營婚姻的丈夫與妻子，可能是新婚、有孩子的中年夫妻，或相伴多年的伴侶）。請站在夫妻同行的位置：口吻溫暖、真誠、不評斷，不偏袒任何一方；承認每段婚姻都有磨合、疲累與受傷的時候。談愛是決定與付出、彼此饒恕、傾聽與表達（怎麼說、怎麼聽）、尊重與同心、金錢與家務的分工、姻親與孩子的教養、一起禱告與一起讀經、在主裡成為一體；可用日常場景當比喻（飯桌、手牽手、吵完架之後、睡前）。結尾給一個這個星期兩個人就能一起做的具體小步驟（一句感謝的話、一段兩人的禱告、一次不看手機的散步）。不要教導妻子順服或丈夫掌權的單方面要求，要強調彼此相愛、彼此順服。若提到家庭暴力、外遇、對方的威脅或有自傷念頭，要溫柔回應，把安全放在第一位，並鼓勵立刻尋求專業協助與信任的人，不要勸人一味忍耐。", "pastor": "\n\n回答對象：牧者與傳道同工（教會的牧師、傳道人、小組長與事奉的同工）。請站在同工的位置：他們常常肩負許多人的重擔，自己也會疲累、孤單、被誤解或灰心。口吻尊重、平等、真誠，像同工之間彼此扶持，不說教、不居高臨下。可以有適度的深度：點出經文脈絡、原文語境與關鍵字詞的意思，談牧養羊群與生命建造、預備講道與教導、帶領小組與門徒訓練、團隊同心與衝突、面對批評與孤單、屬靈爭戰、自己的靈命與家庭，以及不倦怠的安息與依靠；也可提供講章或查經的切入點、段落與應用建議，但要提醒最後仍須自己在神面前領受。結尾給一個這個星期可以做的具體小步驟（一段安靜親近神的時間、一通關心的電話、一次向同工的坦誠分享）。若提到極度疲憊、憂鬱、想放棄或有自傷念頭，要溫柔回應，並鼓勵立刻尋求信任的同工、屬靈長輩與專業協助。"}, "zs": {"elder": "\n\n回答对象：长辈（约65岁以上）。请用尊敬、温和、慢慢说的口吻，像晚辈敬重地陪长辈读经；句子清楚、不拐弯，不用网路用语和英文缩写；比喻取自一生的阅历（田地、家人、岁月、病痛、孙子、老街坊）。重点先讲，分成短段落，不要太长。肯定他们一生走过的路与在主里的忠心，不说教、不指责、不用「你应该」。可以谈健康与软弱、孤单、放下与交托、把信仰传给下一代、永恒的盼望与感恩。结尾给一件简单、容易做到的小事（一句祷告、打电话问候家人、数算一件感谢）。若提到身体不适、孤单或失去亲人，要先温柔安慰，并鼓励他和家人、教会关怀同工联络。", "single_parent": "\n\n回答对象：单亲爸爸或妈妈（一个人撑起一个家）。请先接住他的辛苦：他常常很累、有愧疚、有孤单，也有经济、时间与教养的压力。口吻温暖、接纳、不评断，不追问过去的原因，不说「你应该再找个伴」，也不把单亲说成缺憾。引用神的心意：神是孤儿的父、寡妇的伸冤者（诗篇68:5），祂与我们同在。再给盼望与实际：每一个小步骤都要在忙碌中做得到（五分钟祷告、跟孩子的一个小仪式、开口向弟兄姐妹求助）。内容简短、段落要短。结尾给一个这个星期做得到的小步骤。若他提到被暴力对待、疲惫到撑不下去或想伤害自己，要温柔回应，并鼓励他立刻联络信任的人、教会同工或专业协助。", "single": "\n\n回答对象：单身的人（可能未婚、离婚、丧偶，或正在等候；不要预设他想结婚或不想结婚）。请不要把单身说成缺憾、「预备期」或「还没到的人生」，也不要用催婚的口气。谈在基督里的身分已经完整、被爱；谈孤单时怎么与神、与朋友、与团契连结；谈时间、金钱与恩赐的运用与使命；谈等待中的信靠；谈感情与婚姻的智慧，以及在情感与身体上的圣洁，态度要尊重、不论断。口吻真诚、平等、轻松。结尾给一个这个星期可以做的小步骤。若他提到孤单到想伤害自己，要温柔回应并鼓励他立刻联络信任的人或专业协助。", "parent": "\n\n回答对象：正在养育孩子的父母（孩子可能从婴幼儿到成年）。请站在父母的位置：他们常常疲累、担心孩子、也常常内疚。口吻温暖、贴近生活、不评断；承认每个孩子与每个家庭都不同。谈陪伴与榜样、管教与恩典的平衡、亲子沟通（怎么听、怎么说）、为孩子祷告、夫妻同心、面对自己的软弱与失败；可用日常场景当比喻（吃饭、功课、手机、睡前）。结尾给一个这个星期可以做的具体小步骤（一句话、一个拥抱、一段睡前祷告）。若提到孩子遭受伤害、家庭暴力或孩子有自伤的念头，要温柔回应并鼓励立刻寻求专业协助与信任的人。", "couple": "\n\n回答对象：夫妻（正在经营婚姻的丈夫与妻子，可能是新婚、有孩子的中年夫妻，或相伴多年的伴侣）。请站在夫妻同行的位置：口吻温暖、真诚、不评断，不偏袒任何一方；承认每段婚姻都有磨合、疲累与受伤的时候。谈爱是决定与付出、彼此饶恕、倾听与表达（怎么说、怎么听）、尊重与同心、金钱与家务的分工、姻亲与孩子的教养、一起祷告与一起读经、在主里成为一体；可用日常场景当比喻（饭桌、手牵手、吵完架之后、睡前）。结尾给一个这个星期两个人就能一起做的具体小步骤（一句感谢的话、一段两人的祷告、一次不看手机的散步）。不要教导妻子顺服或丈夫掌权的单方面要求，要强调彼此相爱、彼此顺服。若提到家庭暴力、外遇、对方的威胁或有自伤念头，要温柔回应，把安全放在第一位，并鼓励立刻寻求专业协助与信任的人，不要劝人一味忍耐。", "pastor": "\n\n回答对象：牧者与传道同工（教会的牧师、传道人、小组长与事奉的同工）。请站在同工的位置：他们常常肩负许多人的重担，自己也会疲累、孤单、被误解或灰心。口吻尊重、平等、真诚，像同工之间彼此扶持，不说教、不居高临下。可以有适度的深度：点出经文脉络、原文语境与关键字词的意思，谈牧养羊群与生命建造、预备讲道与教导、带领小组与门徒训练、团队同心与冲突、面对批评与孤单、属灵争战、自己的灵命与家庭，以及不倦怠的安息与依靠；也可提供讲章或查经的切入点、段落与应用建议，但要提醒最后仍须自己在神面前领受。结尾给一个这个星期可以做的具体小步骤（一段安静亲近神的时间、一通关心的电话、一次向同工的坦诚分享）。若提到极度疲惫、忧郁、想放弃或有自伤念头，要温柔回应，并鼓励立刻寻求信任的同工、属灵长辈与专业协助。"}, "en": {"elder": "\n\nAudience: an elder (about 65 and older). Speak respectfully, gently and unhurriedly, like a younger person reading Scripture with an older one they honour. Short, clear sentences; no internet slang or abbreviations; pictures from a long life (fields, family, the years, illness, grandchildren, old neighbours). Main point first, in short paragraphs. Honour the road they have walked and their faithfulness in the Lord; never preach, scold, or say \"you should\". You may speak of health and frailty, loneliness, letting go and entrusting, passing faith to the next generation, eternal hope and gratitude. End with one simple thing that is easy to do (a short prayer, a phone call to family, counting one blessing). If they mention illness, loneliness or loss, comfort them first and encourage them to reach out to family or the church care team.", "single_parent": "\n\nAudience: a single parent (carrying a household alone). First receive their weariness: they are often exhausted, carry guilt and loneliness, and face pressure over money, time and raising children. Be warm, accepting and non-judging; do not ask why they are single, never say \"you should find a partner\", and never describe single parenting as a lack. Bring in God's heart: he is a father to the fatherless and a defender of widows (Psalm 68:5), and he is with us. Then give hope and practicality — every small step must be doable in a busy life (a five-minute prayer, one small ritual with the child, asking brothers and sisters for help). Keep it short, in short paragraphs. End with one step they can take this week. If they mention being abused, being too exhausted to go on, or wanting to harm themselves, answer gently and encourage them to contact someone they trust, a church worker or professional help right away.", "single": "\n\nAudience: a single person (never married, divorced, widowed, or still waiting — do not assume they want or do not want to marry). Never describe being single as a lack, a \"preparation stage\" or \"life not yet begun\", and never use a pushy-about-marriage tone. Speak of an identity in Christ that is already whole and loved; of connecting with God, friends and fellowship in loneliness; of using time, money and gifts for a purpose; of trusting while waiting; of wisdom in dating and marriage and of purity in heart and body, respectfully and without judging. Be sincere, equal and light. End with one step they can take this week. If they mention loneliness so deep they want to harm themselves, answer gently and encourage them to contact someone they trust or professional help right away.", "parent": "\n\nAudience: a parent raising children (from babies to adult children). Stand in the parent's shoes: they are often tired, worried about their children, and often feel guilty. Be warm, down-to-earth and non-judging; acknowledge that every child and every family is different. Speak of presence and example, balancing discipline and grace, parent–child communication (how to listen, how to speak), praying for children, husband and wife standing together, and facing one's own weakness and failure; use everyday scenes as pictures (mealtime, homework, phones, bedtime). End with one concrete step for this week (one sentence, a hug, a bedtime prayer). If a child is being harmed, there is domestic violence, or the child has thoughts of self-harm, answer gently and encourage seeking professional help and a trusted person right away.", "couple": "\n\nAudience: a married couple (husband and wife — newlyweds, parents in the thick of life, or long-time partners). Stand beside them as a fellow traveler: warm, sincere, never judging and never taking one side; admit every marriage has seasons of friction, weariness and hurt. Speak of love as a decision and a gift, forgiving one another, listening and speaking well, respect and unity, money and household work, in-laws and raising children, praying and reading Scripture together, becoming one in the Lord. Use everyday pictures (the dinner table, holding hands, after an argument, bedtime). Close with one small step the two of them can do together this week (a word of thanks, a short prayer together, a phone-free walk). Never lay one-sided demands on the wife to submit or the husband to rule; stress mutual love and mutual submission. If domestic violence, an affair, threats or thoughts of self-harm come up, respond gently, put safety first, and encourage reaching out at once to professionals and trusted people — never urge someone just to endure.", "pastor": "\n\nAudience: a pastor or ministry worker (pastor, preacher, small-group leader, church staff or volunteer). Stand beside them as a fellow worker: they carry many people's burdens and can themselves be weary, lonely, misunderstood or discouraged. Be respectful, equal and sincere — never lecturing or talking down. You may go deeper: the context of the passage, the sense of key words, shepherding and building lives, sermon and lesson preparation, leading groups and discipleship, team unity and conflict, criticism and loneliness, spiritual warfare, one's own walk and family, and resting in God without burning out. You may offer a sermon or Bible-study outline with points and applications, but remind them to receive the word from God themselves first. Close with one small step for this week (a quiet hour with God, a caring phone call, an honest talk with a coworker). If extreme exhaustion, depression, wanting to quit or self-harm come up, respond gently and encourage reaching out at once to trusted coworkers, spiritual elders and professionals."}};
function audName(k){var n=(AUD_NM[L()]||AUD_NM.zh)[k]||k;return AUD_ICON[k]+" "+n;}
function audOpts(){var o=[];eachA(AUD_KEYS,function(k){o.push([k,audName(k)]);});return o;}
function audLine(){
  var a=SET.aud||"adult";if(a==="adult"||AUD_KEYS.indexOf(a)<0)return "";
  if(AUD_SYS6.zh[a])return (AUD_SYS6[L()]||AUD_SYS6.zh)[a];
  if(isEN())return {teen:"\n\n[AUDIENCE: TEENAGER] Talk like a friend: humorous and light, a little playful, never preachy or flippant, never joke about God or the Bible. Keep it short.",
    kid:"\n\n[AUDIENCE: CHILD 5-11] Very simple words, short sentences, like telling a story; one idea per sentence; no hard terms.",
    seeker:"\n\n[AUDIENCE: SEEKER, NOT YET A CHRISTIAN] Start from their situation and questions, then bring in Scripture; use everyday words, no church jargon or insider 321 terms (explain any needed word right away); honest, respectful, no pressure, do not ask them to believe right now; clearly say who God is and what Jesus did for us; always give one or two small steps they can try this week; offer prayer only as an invitation (if you wish, you could say to God...)."}[a]||"";
  return {teen:"\n\n【回答對象：青少年】像朋友聊天、幽默風趣、可以有一點梗，但不說教、不輕浮、不拿神和聖經開玩笑；簡短。",
    kid:"\n\n【回答對象：兒童】非常淺顯、短句、像說故事、一句只講一件事、不用艱深名詞。",
    seeker:"\n\n【回答對象：慕道友】站在未信主者的立場；從他的處境與疑問切入，再帶到經文；用最平常的話，不出現「無己、作王、得勝、屬靈」這類內部用語，也不用教會與神學術語（必須用的詞馬上用生活說法解釋）；誠實、尊重、不說教、不施壓、不要求現在就相信；清楚說出神是怎樣的神、耶穌為我們做了什麼；一定給一兩個這個星期自己就能試的小步驟；禱告只當作「若你願意可以這樣對神說」的邀請。"}[a]+(isZS()?"（以上请用简体中文回答）":"");
}
/*END*/

/* ---------- 畫線 ---------- */
var HL_COLORS=["gold","green","blue","pink","purple","maroon","brown","charcoal"];
var HL_SWATCH={gold:"#D9B168",green:"#6FAE71",blue:"#6C93D1",pink:"#E58FA0",purple:"#A48AC9",maroon:"#8C4A4E",brown:"#8A6740",charcoal:"#54534E"};
var hlCur=null;
function sentList(){return qa(".sent",app);}
function hlKeyOf(el){return L()+"|"+el.getAttribute("data-k")+"|"+el.getAttribute("data-s");}
function sentByKey(k){if(!k)return null;var p=k.split("|");if(p.length<3)return null;var s=p.pop(),hk=p.slice(1).join("|");
  var l=sentList();for(var i=0;i<l.length;i++){if(l[i].getAttribute("data-k")===hk&&l[i].getAttribute("data-s")===s)return l[i];}return null;}
function blkOf(el){var n=el.parentNode;while(n&&n!==app&&!/^(P|BLOCKQUOTE|LI|DD|H2|H3)$/.test(n.tagName))n=n.parentNode;return n&&n!==app?n:el.parentNode;}
function hlRef(el){
  var bq=el.parentNode;if(bq&&bq.tagName==="BLOCKQUOTE"){var c=bq.querySelector("cite");if(c)return c.textContent;}
  var n=el;while(n&&n!==app&&!(n.tagName==="P"&&n.querySelector&&n.querySelector(".rd")))n=n.parentNode;
  if(n&&n!==app&&n.tagName==="P"){var r=n.querySelector(".rd");if(r)return trim(r.textContent).replace(/^[（(]|[）)]$/g,"");}
  var sec=el;while(sec&&sec!==app&&!(sec.className&&/\bcard\b/.test(sec.className)))sec=sec.parentNode;
  var eb=sec&&sec!==app?sec.querySelector(".eyebrow"):null;
  var tabN={home:"今日",check:"生命健檢",exam:"檢視舊人",train:"操練新人",growth:"成長",journal:"日記"}[state.tab];
  return T(tabN)+(eb?DOT()+trim(eb.textContent):"");
}
function hlText(els){var t="";eachA(els,function(e){t+=e.textContent+(isEN()?" ":"");});return trim(t.replace(/\s+/g," "));}
function sameBlockRun(el){var l=sentList(),i=l.indexOf(el),k=el.getAttribute("data-k"),o=[];for(var j=i;j<l.length&&l[j].getAttribute("data-k")===k;j++)o.push(l[j]);return o;}
function spanApply(el,h,n){var run=sameBlockRun(el);n=Math.max(1,Math.min(n,run.length));h.sp=n;h.t=hlText(run.slice(0,n));h.ref=hlRef(el);return h;}
function onSentTap(el){
  if(el.getAttribute("data-op")){var own=sentByKey(el.getAttribute("data-op"));if(own){openHlSheet(own);return;}}
  var k=hlKeyOf(el);
  if(!HL[k]){
    var h={c:SET.hlc||"gold",n:"",sp:1,t:"",ref:"",hk:el.getAttribute("data-k"),s:+el.getAttribute("data-s"),lang:L(),tab:state.tab,ts:now()};
    spanApply(el,h,1);HL[k]=h;saveHL();paintHl();toast(T("已畫線，再點一下可以換色、寫默想"));
  }else openHlSheet(el);
}
function paintHl(){
  var list=sentList(),cover=[];
  eachA(list,function(el,i){var k=hlKeyOf(el),h=HL[k];if(!h)return;var n=Math.max(1,+h.sp||1);
    for(var d=0;d<n&&i+d<list.length&&list[i+d].getAttribute("data-k")===el.getAttribute("data-k");d++)cover[i+d]={h:h,head:d===0,k:k};});
  eachA(list,function(el,i){var o=cover[i];
    if(o){el.setAttribute("data-hl","1");el.setAttribute("data-color",o.h.c);if(o.head)el.removeAttribute("data-op");else el.setAttribute("data-op",o.k);}
    else{el.removeAttribute("data-hl");el.removeAttribute("data-color");el.removeAttribute("data-op");}});
  eachA(qa(".hl-note",app),function(n){n.parentNode.removeChild(n);});
  var lastB=null,after=null;
  eachA(list,function(el,i){var o=cover[i];if(!o||!o.head||!o.h.n)return;var b=blkOf(el);
    var d=document.createElement("div");d.className="hl-note";d.setAttribute("data-color",o.h.c);d.setAttribute("data-hk",o.k);d.textContent=o.h.n;
    if(b.tagName==="LI"||b.tagName==="DD"||b.tagName==="H2"||b.tagName==="H3"){if(b.tagName==="LI"||b.tagName==="DD")b.appendChild(d);else b.parentNode.insertBefore(d,b.nextSibling);return;}
    if(b!==lastB){lastB=b;after=b;}
    after.parentNode.insertBefore(d,after.nextSibling);after=d;});
}
function openHlSheet(el){
  var k=hlKeyOf(el),h=HL[k];if(!h)return;
  var sw="";eachA(HL_COLORS,function(c){sw+='<button class="hlswatch'+(h.c===c?" on":"")+'" data-ha="c" data-c="'+c+'" style="background:'+HL_SWATCH[c]+'" aria-label="'+c+'"></button>';});
  openSheet('<div class="sheet-title">'+T("畫線")+'<span class="sheet-ref" id="hlRef">'+esc(h.ref)+'</span><button class="sheet-x" data-ha="close" aria-label="'+T("關閉")+'">✕</button></div>'+
    '<p class="sheet-quote" id="hlQuote">'+esc(h.t)+'</p>'+
    '<div class="sheet-row"><span class="sheet-lab">'+T("顏色")+'</span><div class="swatches">'+sw+'</div></div>'+
    '<div class="sheet-row"><span class="sheet-lab">'+T("範圍")+'</span><div class="spanrow"><button class="spanbtn" data-ha="sp" data-d="-1" aria-label="'+T("少一句")+'">－</button><span class="spannum" id="hlNum">'+esc(T("{0} 句",h.sp))+'</span><button class="spanbtn" data-ha="sp" data-d="1" aria-label="'+T("多一句")+'">＋</button><button class="spanbtn wide" data-ha="sp" data-d="p">'+T("整段")+'</button></div></div>'+
    '<textarea class="sheet-ta" id="hlNote" placeholder="'+esc(T("寫下你的默想、領受或要操練的一步……"))+'">'+esc(h.n||"")+'</textarea>'+
    '<div class="sheet-acts"><button class="btn new" data-ha="save">'+T("儲存")+'</button><button class="btn ghost" data-ha="ask">💬 '+T("問小智")+'</button></div>'+
    '<div class="sheet-acts2"><button class="btn sm" data-ha="read">🔊 '+T("朗讀這句")+'</button><button class="btn sm" data-ha="from">▶ '+T("從這裡朗讀")+'</button><button class="btn sm" data-ha="copy">⧉ '+T("複製")+'</button><button class="btn sm" data-ha="share">↗ '+T("分享")+'</button><button class="btn sm danger" data-ha="del">✕ '+T("刪除")+'</button></div>');
  hlCur={el:el,k:k,h:h};
}
function hlNoteGrab(){var ta=$("hlNote");if(ta&&hlCur){hlCur.h.n=trim(ta.value);saveHL();}}
function hlShareText(h){return Q(h.t)+"\n—— "+h.ref+(h.n?"\n\n"+h.n:"")+"\n\n"+T("321生命操練")+" · "+T("國度321空中團契")+"\nhttps://spch321-sudo.github.io/321life/";}
function hlClick(b){
  if(!hlCur)return;var a=b.getAttribute("data-ha"),h=hlCur.h,el=hlCur.el;
  if(a==="close"){hlNoteGrab();closeSheet();paintHl();return;}
  if(a==="c"){h.c=b.getAttribute("data-c");SET.hlc=h.c;saveSet();saveHL();paintHl();eachA(qa(".hlswatch"),function(s){s.className="hlswatch"+(s===b?" on":"");});return;}
  if(a==="sp"){var d=b.getAttribute("data-d"),n,run=sameBlockRun(el);
    if(d==="p"){n=run.length;toast(n===h.sp?T("這一段已經整段畫起來了"):T("已畫整段，共 {0} 句",n));}else{n=(h.sp||1)+(+d);if(n>run.length)toast(T("已經到這一段的最後一句"));}
    spanApply(el,h,n);saveHL();paintHl();$("hlQuote").textContent=h.t;$("hlNum").textContent=T("{0} 句",h.sp);return;}
  if(a==="save"){hlNoteGrab();closeSheet();paintHl();toast(T("已儲存"));return;}
  if(a==="ask"){hlNoteGrab();closeSheet();paintHl();openXz(T("請就這句幫助我默想，並用 321 給我今天可以操練的一步：{0}",Q(h.t))+(h.n?"\n"+T("我的領受：{0}",h.n):""),{t:h.t,ref:h.ref});return;}
  if(a==="read"){hlNoteGrab();closeSheet();paintHl();speakText(h.t,"hl");return;}
  if(a==="from"){hlNoteGrab();closeSheet();paintHl();ttsPage(el);return;}
  if(a==="copy"){copyText(hlShareText(h));return;}
  if(a==="share"){shareText(hlShareText(h));return;}
  if(a==="del"){delete HL[hlCur.k];saveHL();closeSheet();paintHl();toast(T("已刪除畫線"));return;}
}
function copyText(t){
  function fb(){try{var ta=document.createElement("textarea");ta.value=t;ta.style.position="fixed";ta.style.opacity="0";document.body.appendChild(ta);ta.select();document.execCommand("copy");document.body.removeChild(ta);toast(T("已複製"));}catch(e){toast(T("無法複製"));}}
  try{if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).then(function(){toast(T("已複製"));},fb);return;}}catch(e){}fb();
}
function shareText(t){try{if(navigator.share){navigator.share({text:t})["catch"](function(){});return;}}catch(e){}copyText(t);}

/* 我的畫線與收藏（日記第三頁） */
function marksHTML(){
  var arr=[],h="",k;for(k in HL){if(HL.hasOwnProperty(k)&&(HL[k].lang||"zh")===L())arr.push([k,HL[k]]);}
  arr.sort(function(a,b){return b[1].ts-a[1].ts;});
  h+='<section class="card"><div class="eyebrow">'+T("我的畫線（{0}）",arr.length)+'</div>';
  if(!arr.length)h+='<p class="empty" style="margin:0">'+T("還沒有畫線。在經文、題目、禱告或健檢結果上點一下任何一句，就會畫起來。")+'</p>';
  eachA(arr,function(e){var x=e[1];
    h+='<div class="hitem"><div class="q" data-color="'+x.c+'">'+esc(x.t)+'</div>'+(x.n?'<div class="n">'+esc(x.n)+'</div>':'')+
      '<div class="m"><span>'+esc(x.ref)+'</span><span><button class="linkbtn" data-mk="go" data-k="'+esc(e[0])+'">'+T("回到原處")+'</button><button class="linkbtn" data-mk="read" data-k="'+esc(e[0])+'">🔊</button><button class="linkbtn danger" data-mk="del" data-k="'+esc(e[0])+'">✕</button></span></div></div>';});
  h+='</section><section class="card"><div class="eyebrow">'+T("小智收藏（{0}）",FAV.length)+'</div>';
  if(!FAV.length)h+='<p class="empty" style="margin:0">'+T("在小智的回答下按「★ 收藏」，就會存在這裡。")+'</p>';
  for(var i=FAV.length-1;i>=0;i--){var f=FAV[i];
    h+='<div class="hitem">'+(f.q?'<div class="small">'+esc(f.q)+'</div>':'')+'<div class="md">'+mdHTML(f.text)+'</div><div class="m"><span>'+(f.ts?fmtDate(dkey(new Date(f.ts))):'')+'</span><span><button class="linkbtn" data-mk="fread" data-i="'+i+'">🔊</button><button class="linkbtn" data-mk="fshare" data-i="'+i+'">↗</button><button class="linkbtn danger" data-mk="fdel" data-i="'+i+'">✕</button></span></div></div>';}
  return h+'</section>';
}
function marksAct(b){
  var a=b.getAttribute("data-mk"),k=b.getAttribute("data-k"),i=+b.getAttribute("data-i");
  if(a==="go"){hlGo(k);return;}
  if(a==="read"){if(HL[k])speakText(HL[k].t+(HL[k].n?"。"+HL[k].n:""),"mk");return;}
  if(a==="del"){delete HL[k];saveHL();keepScroll();toast(T("已刪除畫線"));return;}
  if(a==="fread"){if(FAV[i])speakText(mdSpeak(FAV[i].text),"fav");return;}
  if(a==="fshare"){if(FAV[i])shareText(mdStrip(FAV[i].text)+"\n\n—— "+T("國度321空中團契"));return;}
  if(a==="fdel"){FAV.splice(i,1);saveFav();keepScroll();toast(T("已刪除"));return;}
}
function hlGo(k){
  var h=HL[k];if(!h)return;var hk=h.hk||"",p=hk.split(":"),tab=h.tab||"home";
  if(p[0]==="h")tab="home";else if(p[0]==="g")tab="growth";
  else if(p[0]==="p"||p[0]==="r"){tab=p[1];if(p[0]==="p"){state[tab].done=null;if(G[p[2]]&&!has(state[tab].sel,p[2]))state[tab].sel.push(p[2]);}}
  else if(p[0]==="c")tab="check";
  go(tab);
  if(p[0]==="c"&&p[1]!=="form"&&ckFind(p[1])){ck.show=p[1];render();}
  setTimeout(function(){var el=sentByKey(k);
    if(el){try{el.scrollIntoView({block:"center"});}catch(e){}el.className+=" flash";setTimeout(function(){el.className=el.className.replace(/\s*flash/g,"");},1600);}
    else toast(T("原處目前不在畫面上（例如結果頁已關閉）"));},60);
}

/* ---------- 簡易 markdown ---------- */
function mdInline(t){
  return esc(t).replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>").replace(/__([^_]+)__/g,"<strong>$1</strong>").replace(/(^|[^*])\*([^*\n]+)\*/g,"$1<em>$2</em>");
}
function tbRow(x){return /^\s*\|.*\|\s*$/.test(x);}
function tbSep(x){return /^\s*\|[\s:|\-]+\|\s*$/.test(x)&&x.indexOf("-")>=0;}
function tbCells(x){var a=trim(x).replace(/^\||\|$/g,"").split("|"),o=[];eachA(a,function(c){o.push(trim(c));});return o;}
function mdTableMap(src,fmt){
  var Ls=String(src||"").split("\n"),out=[],i=0;
  while(i<Ls.length){
    if(tbRow(Ls[i])&&i+1<Ls.length&&tbSep(Ls[i+1])){var head=tbCells(Ls[i]);i+=2;var rows=[];while(i<Ls.length&&tbRow(Ls[i])){rows.push(tbCells(Ls[i]));i++;}out.push(rows.length?fmt(head,rows):head.join(" "));continue;}
    out.push(Ls[i]);i++;
  }
  return out.join("\n");
}
function mdHTML(src){
  var tabs=[];
  var s=mdTableMap(String(src||"").replace(/```[a-z]*/g,"").replace(/\r/g,""),function(head,rows){
    var t='<table class="mdtb"><thead><tr>';eachA(head,function(c){t+="<th>"+mdInline(c)+"</th>";});t+="</tr></thead><tbody>";
    eachA(rows,function(r){t+="<tr>";eachA(r,function(c){t+="<td>"+mdInline(c)+"</td>";});t+="</tr>";});tabs.push(t+"</tbody></table>");return "\u0001"+(tabs.length-1);});
  var Ls=s.split("\n"),o="",list=null,i,m,ln;
  function endList(){if(list){o+="</"+list+">";list=null;}}
  for(i=0;i<Ls.length;i++){ln=Ls[i].replace(/\s+$/,"");
    if(!ln.replace(/\s/g,"")){endList();continue;}
    if((m=ln.match(/^\u0001(\d+)$/))){endList();o+='<div class="tbwrap">'+tabs[+m[1]]+'</div>';continue;}
    if((m=ln.match(/^\s*#{1,6}\s+(.*)$/))){endList();o+="<h4>"+mdInline(m[1].replace(/\*\*/g,""))+"</h4>";continue;}
    if(/^\s*(-{3,}|\*{3,})\s*$/.test(ln)){endList();o+="<hr>";continue;}
    if((m=ln.match(/^\s*>\s?(.*)$/))){endList();o+="<blockquote>"+mdInline(m[1])+"</blockquote>";continue;}
    if((m=ln.match(/^\s*[-*•・]\s+(.*)$/))){if(list!=="ul"){endList();o+="<ul>";list="ul";}o+="<li>"+mdInline(m[1])+"</li>";continue;}
    if((m=ln.match(/^\s*(\d+)[.、)]\s*(.*)$/))){if(list!=="ol"){endList();o+=(+m[1]>1?'<ol start="'+(+m[1])+'">':"<ol>");list="ol";}o+="<li>"+mdInline(m[2])+"</li>";continue;}
    endList();
    if(/^\s*\*\*(得勝的下一步|得胜的下一步|Next step)/i.test(ln)){o+='<p class="next">'+mdInline(ln)+"</p>";continue;}
    o+="<p>"+mdInline(ln)+"</p>";
  }
  endList();return o;
}
function mdStrip(x){
  return trim(mdTableMap(String(x||""),function(head,rows){var ls=[],hh=[];eachA(head,function(c){if(c)hh.push(c);});if(hh.length)ls.push(hh.join(" → "));eachA(rows,function(r){var r2=[];eachA(r,function(c){if(c)r2.push(c);});ls.push("・"+r2.join(" → "));});return ls.join("\n");})
    .replace(/^#{1,6} /gm,"").replace(/\*\*([\s\S]+?)\*\*/g,"$1").replace(/\*([\s\S]+?)\*/g,"$1").replace(/\*/g,"")
    .replace(/^> ?/gm,"").replace(/^---+$/gm,"").replace(/^[-*] /gm,"・").replace(/`+/g,"").replace(/\n{3,}/g,"\n\n"));
}
/*@@MDSPEAK@@*/

/* ---------- 朗讀（逐句跟讀、背景播放） ---------- */
var TTS_RETRY=[800,1600],TTS_LOOK=2,RA_COOL=4000;
var spk={on:false,items:[],idx:0,cache:{},native:false,abort:false},raManualAt=0,ttsEl=null,ttsUnlocked=false,ttsLastErr="",sayKey=null,wakeLock=null;
/*@@TTSFIX@@*/
var SILENT_WAV="data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAgD4AAAB9AAACABAAZGF0YQAAAAA=";
/*@@BKZH@@*/
var BKM={};
function bookMap(){var k=isZS()?"zs":"zh";if(BKM[k])return BKM[k];var m={},src=k==="zs"?T("@bkzs"):BK_ZH;if(src==="@bkzs")src=BK_ZH;eachA(src.split("|"),function(p){var a=p.split(":");m[a[0]]=a[1]||a[0];});return (BKM[k]=m);}
function ttsRef(x){
  return String(x||"").replace(/([^\s\d:：，。、；（）「」！？]{1,12}|[1-3]?\s?[A-Z][a-z]+\.?(?: of [A-Z][a-z]+)?)\s?(\d+)[:：](\d+)(?:\s*[–\-~～至]\s*(\d+))?/g,function(m,bk,c,v,v2){
    if(isEN())return bk.replace(/\.$/,"")+" chapter "+c+(v2?" verses "+v+" to "+v2:" verse "+v);
    var mp=bookMap(),pre=null,full="";
    for(var k=0;k<bk.length;k++){var suf=bk.slice(k);if(mp[suf]){pre=bk.slice(0,k);full=mp[suf];break;}}
    if(pre===null)return m;
    var ps=/^詩篇$|^诗篇$/.test(full);return pre+full+c+(ps?"篇":"章")+v+(v2?"到"+v2:"")+(isZS()?"节":"節");
  });
}
var EMOJI_RE=/\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|\uD83E[\uDC00-\uDFFF]|[←-⇿⌀-⏿■-➿⬀-⯿☀-⛿︎️‍⃣〰〽™ℹ]/g;
var REF_ONE=/^\s*(?:(?:參|参|見|见|另見|另见|參看|参看|參考|参考|cf\.?|see|See)\s*)?(?:(?:[1-3一二三]\s?)?[一-鿿]{1,6}|(?:[1-3]\s?)?[A-Z][a-z]+\.?(?:\s(?:of\s)?[A-Z][a-z]+)*)?\s*\d+(?:\s*[:：]\s*\d+(?:\s*[-–—~～至]\s*\d+)?)?(?:\s*[章節节篇])?(?:\s*[-–—~～至]\s*\d+(?:\s*[:：]\s*\d+)?)?\s*$/;
function isRefParen(inner){var ps=String(inner).split(/[；;、，,]/),ok=0;for(var i=0;i<ps.length;i++){if(!trim(ps[i]))continue;if(!REF_ONE.test(ps[i]))return false;ok++;}return ok>0;}
function dropRefParens(x){return x.replace(/([，,]?\s*(?:參|参|見|见|see|cf\.?)\s*)?[（(]([^（）()]{1,80})[）)]/g,function(m,lead,inner){return isRefParen(inner)?"":m;});}
function ttsPrep(s){
  var x=dropRefParens(String(s||"")).replace(/〔[^〕]*〕/g,"").replace(/\[[^\]]*\]/g,"").replace(EMOJI_RE,"").replace(/[＿_]{2,}/g,isEN()?" blank ":"某某");
  x=ttsRef(x);
  if(isEN())return trim(x.replace(/[*#>`_~|]/g,"").replace(/\s+/g," ").replace(/\s+([.,;:!?])/g,"$1"));
  x=x.replace(/[「」『』（）()〔〕\[\]《》〈〉*#>`_~|]/g,"").replace(/[—－]{1,2}/g,"，").replace(/→/g,"，").replace(/321/g,"三二一").replace(/920/g,"九二零").replace(/235/g,"二三五");
  eachA(TTS_FIX,function(f){x=x.replace(f[0],f[1]);});return trim(x.replace(/[ \t]{2,}/g," "));
}
function voiceName(){var v=VOICES[L()],i=SET.voice||0;return (v[i]||v[0])[0];}
function ttsAudio(){if(!ttsEl){ttsEl=new Audio();ttsEl.preload="auto";try{ttsEl.setAttribute("playsinline","");}catch(e){}}return ttsEl;}
function ttsUnlock(){if(ttsUnlocked)return;try{var a=ttsAudio();a.src=SILENT_WAV;var p=a.play();if(p&&p.then)p.then(function(){ttsUnlocked=true;},function(){});else ttsUnlocked=true;}catch(e){}}
function ajaxBuf(url,body,cb){
  var x=new XMLHttpRequest();try{x.open("POST",url,true);}catch(e){cb(0,null);return;}
  x.responseType="arraybuffer";x.timeout=25000;x.setRequestHeader("Content-Type","application/json");
  x.onload=function(){cb(x.status,x.response);};x.onerror=function(){cb(0,null);};x.ontimeout=function(){cb(-1,null);};
  try{x.send(JSON.stringify(body));}catch(e){cb(0,null);}
}
function ttsFetch(text,cb,tries){
  tries=tries||0;
  if(!SET.human||navigator.onLine===false){cb(null);return;}
  ajaxBuf(SVC.tts,{voice:voiceName(),rate:RATES[SET.rate||0],sil:140,silc:140,sile:260,text:text},function(st,buf){
    if(st===200&&buf&&buf.byteLength>128){cb(URL.createObjectURL(new Blob([buf],{type:"audio/mpeg"})));return;}
    ttsLastErr=st>0?"http "+st:(st<0?"timeout":"network");
    if(tries<TTS_RETRY.length)setTimeout(function(){ttsFetch(text,cb,tries+1);},TTS_RETRY[tries]);else cb(null);
  });
}
function keepAwake(on){try{if(on&&navigator.wakeLock&&!wakeLock){navigator.wakeLock.request("screen").then(function(w){wakeLock=w;},function(){});}else if(!on&&wakeLock){wakeLock.release();wakeLock=null;}}catch(e){}}
document.addEventListener("visibilitychange",function(){if(document.visibilityState==="visible"&&(spk.on||sayKey)){wakeLock=null;keepAwake(true);}});
function mediaSession(title){
  try{if("mediaSession" in navigator&&window.MediaMetadata){
    navigator.mediaSession.metadata=new MediaMetadata({title:title||T("321生命操練"),artist:T("國度321空中團契"),artwork:[{src:"icon-512-v2.png",sizes:"512x512",type:"image/png"}]});
    navigator.mediaSession.setActionHandler("pause",function(){stopAll();});navigator.mediaSession.setActionHandler("stop",function(){stopAll();});
    try{navigator.mediaSession.setActionHandler("nexttrack",function(){spkSkip(1);});navigator.mediaSession.setActionHandler("previoustrack",function(){spkSkip(-1);});}catch(e){}
  }}catch(e){}
}
function secOf(e){var n=e;while(n&&n!==app){if(n.className&&/(^|\s)card(\s|$)/.test(String(n.className)))return n;n=n.parentNode;}return null;}
function secLead(sec){
  if(!sec)return "";var say=sec.getAttribute("data-say");if(say)return say;
  var l=sec.querySelector(".eyebrow");if(!l)return "";var t=trim(l.textContent.replace(EMOJI_RE,""));if(!t)return "";
  if(/禱告|祷告|Pray/i.test(t))return isEN()?"Let us pray together. ":"讓我們一起禱告。";
  return isEN()?"Next: "+t+". ":T("接下來是「{0}」。",t);
}
function unitList(){return qa(".sent, .rd",app);}
function unitLoc(e){return e.getAttribute("data-k")!=null?{k:e.getAttribute("data-k"),s:e.getAttribute("data-s")}:{t:e.textContent};}
function buildQueue(fromEl){
  var els=unitList(),from=0,lastSec=null,i;
  if(fromEl){from=Math.max(0,els.indexOf(fromEl));}
  else{for(i=0;i<els.length;i++){if(els[i].getBoundingClientRect().bottom>70){from=i;break;}}}
  els=els.slice(from);var items=[],cur={text:"",segs:[],lens:[],locs:[],at:-1},MAX=isEN()?320:130;
  eachA(els,function(e){
    if(e.offsetParent===null&&e.getClientRects().length===0)return;
    var sc=secOf(e),lead=(sc&&sc!==lastSec)?secLead(sc):"";lastSec=sc;
    var t=e.textContent;if(!trim(t))return;
    if(!/[。！？.!?：:；;，,…]["'」』”]*$/.test(trim(t)))t=trim(t)+(isEN()?". ":"。");
    if((lead||cur.text.length+t.length>MAX)&&cur.text){items.push(cur);cur={text:"",segs:[],lens:[],locs:[],at:-1};}
    cur.text+=lead+t+(isEN()?" ":"");cur.segs.push(e);cur.locs.push(unitLoc(e));cur.lens.push(Math.max(1,ttsPrep(lead+t).length));
  });
  if(cur.text)items.push(cur);var out=[];eachA(items,function(it){if(ttsPrep(it.text))out.push(it);});return out;
}
/* 重畫後把朗讀標示接回新的元素 */
function ttsRebind(){
  if(!spk.on)return;var els=unitList(),pos=0;
  eachA(spk.items,function(it){eachA(it.locs,function(lc,j){var f=null;
    if(lc.k!=null){for(var i=0;i<els.length;i++){if(els[i].getAttribute("data-k")===lc.k&&els[i].getAttribute("data-s")===lc.s){f=els[i];pos=i;break;}}}
    else{for(var q=pos;q<els.length;q++){if(els[q].textContent===lc.t){f=els[q];pos=q;break;}}}
    it.segs[j]=f||it.segs[j];});});
  var cur=spk.items[spk.idx];if(cur&&cur.at>=0){var k=cur.at;cur.at=-1;var keep=raManualAt;raManualAt=now();raSeg(cur,k);raManualAt=keep;}
}
function raClear(){eachA(qa(".tts-reading"),function(e){e.className=e.className.replace(/\s*tts-reading/g,"");});}
function raSeg(item,k){
  if(!item||!item.segs.length)return;k=Math.max(0,Math.min(k,item.segs.length-1));
  if(item.at===k&&document.querySelector(".tts-reading"))return;item.at=k;raClear();var e=item.segs[k];if(!e||!e.parentNode)return;
  e.className+=" tts-reading";if(now()-raManualAt>RA_COOL){try{e.scrollIntoView({behavior:"smooth",block:"center"});}catch(x){}}
}
function raProgress(item,ratio){
  if(!item||item.lens.length<2||!(ratio>=0))return;var tot=0,acc=0,k=0,j;for(j=0;j<item.lens.length;j++)tot+=item.lens[j];
  var tg=Math.min(ratio,1)*tot;for(j=0;j<item.lens.length;j++){acc+=item.lens[j];k=j;if(tg<acc)break;}raSeg(item,k);
}
var TAB_TITLE={home:"今日",check:"生命健檢",exam:"檢視舊人",train:"操練新人",growth:"成長",journal:"日記"};
function ttsPage(fromEl){
  if(spk.on&&!fromEl){stopAll();return;}stopAll();ttsUnlock();
  var items=buildQueue(fromEl);if(!items.length){toast(T("這一頁沒有可以朗讀的文字"));return;}
  var title=T(TAB_TITLE[state.tab])+" · "+T("321生命操練");
  spk={on:true,items:items,idx:0,cache:{},native:false,abort:false,title:title};raManualAt=0;keepAwake(true);mediaSession(title);drawFab();ttsPlayFrom(0);
}
function ttsPrefetch(i,cb){var it=spk.items[i];if(!it||spk.cache[i]!==undefined){if(cb)cb();return;}spk.cache[i]=0;ttsFetch(ttsPrep(it.text),function(u){spk.cache[i]=u;if(cb)cb();});}
function ttsPlayFrom(i){
  if(!spk.on||spk.abort)return;if(i>=spk.items.length){stopAll();toast(T("朗讀完畢"));return;}
  spk.idx=i;spk.items[i].at=-1;raSeg(spk.items[i],0);drawSpk();
  var my=spk;
  var go2=function(){
    if(my!==spk)return;
    for(var k=i+1;k<=i+TTS_LOOK;k++)ttsPrefetch(k);if(!spk.on||spk.abort)return;var url=spk.cache[i];
    if(!url){ttsNativeFrom(i);return;}
    var a=ttsAudio();a.onended=null;a.onerror=null;a.ontimeupdate=null;a.src=url;
    a.ontimeupdate=function(){if(!spk.on||spk.idx!==i)return;var d=a.duration;if(d&&isFinite(d))raProgress(spk.items[i],a.currentTime/d);};
    a.onended=function(){a.ontimeupdate=null;if(spk.on&&!spk.abort&&my===spk)ttsPlayFrom(i+1);};
    a.onerror=function(){if(spk.on&&!spk.abort&&my===spk)ttsNativeFrom(i);};
    var p=a.play();if(p&&p["catch"])p["catch"](function(){if(spk.on&&!spk.abort&&my===spk)ttsNativeFrom(i);});
  };
  if(spk.cache[i]===undefined)ttsPrefetch(i,go2);else if(spk.cache[i]===0){var w=setInterval(function(){if(spk.cache[i]!==0||!spk.on||my!==spk){clearInterval(w);go2();}},120);}else go2();
}
function nativeLang(){return isEN()?"en-US":(isZS()?"zh-CN":"zh-TW");}
function ttsNativeFrom(i){
  if(!("speechSynthesis" in window)){toast(T("這支手機無法朗讀"));stopAll();return;}
  if(!spk.native){spk.native=true;if(SET.human)toast(T("改用裝置內建語音朗讀")+(ttsLastErr?(isEN()?" ("+ttsLastErr+")":"（"+ttsLastErr+"）"):""));}
  if(!spk.on||spk.abort||i>=spk.items.length){stopAll();return;}
  spk.idx=i;spk.items[i].at=-1;raSeg(spk.items[i],0);drawSpk();
  var say=ttsPrep(spk.items[i].text),u=new SpeechSynthesisUtterance(say);u.lang=nativeLang();u.rate=[.95,.85,1.08][SET.rate||0];
  u.onboundary=function(e){if(spk.on&&spk.idx===i&&say.length)raProgress(spk.items[i],(e.charIndex||0)/say.length);};
  u.onend=function(){if(spk.on&&!spk.abort&&spk.idx===i)ttsNativeFrom(i+1);};u.onerror=u.onend;
  try{speechSynthesis.speak(u);}catch(e){stopAll();}
}
/* 單段朗讀（小智回答、畫線句、試聽） */
function speakText(text,key,onEnd){
  stopAll();ttsUnlock();key=key||"x";sayKey=key;paintSay();keepAwake(true);mediaSession(T("321生命操練"));drawSpk();drawFab();
  var clean=ttsPrep(text).slice(0,1500);if(!clean){stopAll();return;}
  var done=function(){if(sayKey===key){sayKey=null;paintSay();keepAwake(false);drawSpk();drawFab();}if(onEnd)onEnd();};
  ttsFetch(clean,function(url){
    if(sayKey!==key)return;
    if(url){var a=ttsAudio();a.onended=done;a.onerror=function(){nat();};a.ontimeupdate=null;a.src=url;var p=a.play();if(p&&p["catch"])p["catch"](function(){nat();});}
    else nat();
  });
  function nat(){if(sayKey!==key)return;if("speechSynthesis" in window){var u=new SpeechSynthesisUtterance(clean);u.lang=nativeLang();u.rate=[.95,.85,1.08][SET.rate||0];u.onend=done;u.onerror=done;speechSynthesis.speak(u);}else{toast(T("這支手機無法朗讀"));done();}}
}
function paintSay(){eachA(qa("[data-xa=tts]"),function(b){var on=sayKey==="m"+b.getAttribute("data-i");b.className="msg-act"+(on?" on":"");b.innerHTML=on?"⏸ "+esc(T("停止")):"🔊 "+esc(T("朗讀"));});
  eachA(qa("[data-cka=tts]"),function(b){var on=sayKey==="ck"+b.getAttribute("data-i");b.className="msg-act"+(on?" on":"");b.innerHTML=on?"⏸ "+esc(T("停止")):"🔊 "+esc(T("朗讀"));});}
function stopAll(){
  spk.on=false;spk.abort=true;sayKey=null;try{if(ttsEl){ttsEl.onended=null;ttsEl.ontimeupdate=null;ttsEl.pause();}}catch(e){}
  try{if("speechSynthesis" in window)speechSynthesis.cancel();}catch(e){}raClear();paintSay();keepAwake(false);drawSpk();drawFab();
}
function drawSpk(){
  var el=$("spk"),on=spk.on||!!sayKey;
  if(!on){if(el)el.parentNode.removeChild(el);return;}
  if(!el){el=document.createElement("div");el.id="spk";el.className="spk";document.body.appendChild(el);}
  var prog=spk.on&&spk.items.length?" · "+(spk.idx+1)+"/"+spk.items.length:"";
  el.innerHTML='<span class="t">🔊 '+esc(spk.on?spk.title:T("朗讀中"))+prog+'</span>'+(spk.on?'<button data-spk="-1" aria-label="'+T("上一段")+'">⏮</button><button data-spk="1" aria-label="'+T("下一段")+'">⏭</button>':'')+'<button data-spk="0" aria-label="'+T("停止")+'">■</button>';
}
function spkSkip(n){if(!spk.on)return;var k=Math.max(0,Math.min(spk.items.length-1,spk.idx+n));try{if(ttsEl){ttsEl.onended=null;ttsEl.pause();}if("speechSynthesis" in window)speechSynthesis.cancel();}catch(e){}raManualAt=0;ttsPlayFrom(k);}
window.addEventListener("touchmove",function(){raManualAt=now();},{passive:true});
window.addEventListener("wheel",function(){raManualAt=now();},{passive:true});
document.addEventListener("click",function(e){var b=e.target;while(b&&b!==document&&b.tagName!=="BUTTON")b=b.parentNode;if(!b||b===document)return;var s=b.getAttribute("data-spk");if(s==null)return;if(s==="0")stopAll();else spkSkip(+s);});

/* 小智回答說成自然的口語用 mdSpeak（見上方） */

/* ---------- 浮動按鈕（朗讀這頁、問小智） ---------- */
function drawFab(){
  var b=$("fabtts");if(!b)return;var on=spk.on||!!sayKey;
  b.innerHTML=on?"■":"🔊";b.setAttribute("aria-label",on?T("停止朗讀"):T("朗讀這一頁"));b.className="fab"+(on?" on":"");
}

/* ---------- 小智 ---------- */
var XZ={open:false},chatBusy=false,chatSrc=null;
/*NOI18N*/
var XZ_TASK="【現在的任務】你是使用者在「321生命操練」App 裡的屬靈同伴。陪他把聖經真理與321理念用在每天的操練：五道門戶（看、聽、想、講、行）與五重領域（觀念、生命、生活、關係、事工）；幫助他看見舊人有己、穿上新人無己，在每一個「2」面前結出聖靈的果子，反敗為勝成為得勝者。回答要具體、做得到：給可以直接說出口的話（用「」寫出完整句子）與步驟；焦點帶回耶穌，用心靠聖靈；需要時在最後問他一個幫助更深的問題。若他談到暴力、虐待、人身危險或自傷輕生，要把安全放第一，鼓勵他立刻聯絡可信任的人或當地緊急求助。";
var SYS_FMT_ZH="\n\n【回答格式】用 markdown：### 短小標題、- 條列、1. 編號、**粗體**；需要並列對照時可以用 markdown 表格。請把最重要的那一句用「> 」標成引言；引用經文用「> 」並在後面寫出處。不要用 ASCII 圖案、程式碼區塊或唸不出來的裝飾符號。段落短，手機好讀，約300到600字。若寫到禱告，結尾一律用「奉主耶穌的名禱告，阿們」。";
var SYS_FMT_EN="\n\n[FORMAT] Use markdown: ### short headings, - bullets, 1. numbered steps, **bold**; a markdown table when comparing. Mark the single most important line with \"> \"; quote Scripture with \"> \" followed by the reference. No ASCII art, code blocks or decorative symbols. Short paragraphs, about 200-450 words. If you write a prayer, end it with \"in the name of the Lord Jesus we pray, Amen.\"";
function xzCtx(){
  var c=[],t=state.tab;
  c.push("【使用者目前在】"+{home:"今日",check:"生命健檢",exam:"檢視舊人",train:"操練新人",growth:"成長",journal:"日記"}[t]+"；今天"+(WEEK[WD]?"的檢視重點："+G[WEEK[WD][0]].name+"＋"+G[WEEK[WD][1]].name:"是"+(WD===6?"同行日":"主日感恩日")));
  if(t==="exam"||t==="train"){var S=state[t],ns=[];eachA(S.sel,function(id){var g=G[id];ns.push(g.name+"——"+g[t].title);});if(ns.length)c.push("正在"+(t==="exam"?"檢視舊人":"操練新人")+"："+ns.join("；"));
    if(S.done){var p=[];for(var id in S.done.scores){if(S.done.scores.hasOwnProperty(id))p.push(G[id].name+" "+sum(S.done.scores[id])+"/15");}c.push("剛完成的分數："+p.join("、"));}}
  if(t==="check"&&ck.show){var e=ckFind(ck.show);if(e&&e.ai&&e.ai.title)c.push("正在看的健檢："+e.ai.title+"（"+(e.ai.who||"")+"）；事件："+String(e.input.ev||"").slice(0,120));}
  return c.join("\n");
}
/*END*/
function xzSys(){return ckBase()+XZ_TASK+(isEN()?SYS_FMT_EN:SYS_FMT_ZH)+"\n\n"+xzCtx()+audLine();}
var QBANK=["怎樣分辨此刻是舊人作王還是新人作王？","我一被批評就想辯解，怎樣操練「快快的聽，慢慢的說」？","驕傲和謙卑在日常生活裡怎麼分辨？","用一個比喻說明「無己不是沒有，乃是進入無限」","我常拿自己和別人比較，怎樣用神的眼光看自己？","怎樣在家人（我的「2」）面前結出忍耐的果子？","憂慮一直來，怎樣把心意奪回、順服基督？","讓耶穌作王，在職場上具體會怎麼做？","改變觀念的八大步驟，怎樣用在一節經文上？","幫我擬一個七天的無己操練計畫"];
var FU=[["💬","說出口","請幫我寫出可以直接說出口的一兩句話，用在你剛才說的情況裡。"],["🏠","家庭","你剛才的回答，用在我和家人之間，具體可以怎麼做？"],["💼","職場","你剛才的回答，用在職場和同事之間，具體可以怎麼做？"],["🔁","又跌倒","如果我照你剛才說的去做，卻又失敗了，該怎樣重新起來？"],["🙏","禱告","請根據你剛才的回答，帶我做一個簡短的禱告。"],["📅","七天","請把你剛才的回答整理成七天的操練計畫，每天一個小行動。"]];
function isFav(t){for(var i=0;i<FAV.length;i++)if(FAV[i].text===t)return true;return false;}
function msgLong(m){return m&&m.role!=="user"&&mdStrip(m.text||"").length>(isEN()?420:200);}
function foldOld(){for(var k=0;k<CHAT.length-1;k++)if(msgLong(CHAT[k]))CHAT[k].fold=true;}
function msgFold(i){
  var m=CHAT[i];if(!m)return;m.fold=!m.fold;saveChat();
  var el=$("msg"+i);if(!el){paintChat();return;}
  el.className="msg ai"+(m.fold?" fold":"");
  var b=el.querySelector(".msg-more");if(b)b.textContent=T(m.fold?"展開全文 ▾":"收合 ▴");
  if(m.fold){try{el.scrollIntoView({block:"nearest"});}catch(e){}}
}
function foldAll(){var n=0;eachA(CHAT,function(m){if(msgLong(m)&&!m.fold){m.fold=true;n++;}});saveChat();paintChat();toast(T(n?"已收合所有長回答":"目前沒有需要收合的回答"));}
function lastOk(){for(var i=CHAT.length-1;i>=0;i--){if(CHAT[i].role!=="user")return CHAT[i].ok&&!CHAT[i].wait&&!CHAT[i].cont?i:-1;}return -1;}
function chatLogHtml(){
  if(!CHAT.length)return '<div class="xzhi">'+T("平安！我是小智，你的 321 生命陪伴者。今天想操練哪一道門戶、哪一個領域？也可以把一件讓你不平安的事告訴我。")+'<br><span class="small">'+T("小智的回答是陪伴與提醒，請以聖經與聖靈的引導為準。")+'</span></div>';
  var h="",lk=lastOk();
  eachA(CHAT,function(m,i){
    if(m.role==="user"){h+='<div class="msg user">'+esc(m.text)+'</div>';return;}
    var lg=!m.wait&&!m.cont&&msgLong(m),fd=lg&&m.fold;
    h+='<div class="msg ai'+(fd?" fold":"")+'" id="msg'+i+'"><div class="msg-body md">'+(m.wait?'<span class="typing"><i></i><i></i><i></i></span> '+esc(T("小智正在思想……")):mdHTML(m.text))+(m.cont?'<p class="small"><span class="typing"><i></i><i></i><i></i></span> '+esc(T("小智還在接著寫…"))+'</p>':'')+'</div>'+
      (lg?'<button class="msg-more" data-xa="fold" data-i="'+i+'">'+esc(T(fd?"展開全文 ▾":"收合 ▴"))+'</button>':'')+
      (m.wait||m.cont?'':'<div class="msg-actions"><button class="msg-act'+(isFav(m.text)?" on":"")+'" data-xa="fav" data-i="'+i+'">★ '+T("收藏")+'</button><button class="msg-act" data-xa="share" data-i="'+i+'">↗ '+T("分享")+'</button><button class="msg-act" data-xa="copy" data-i="'+i+'">⧉ '+T("複製")+'</button><button class="msg-act" data-xa="tts" data-i="'+i+'">🔊 '+T("朗讀")+'</button><button class="msg-act" data-xa="del" data-i="'+i+'" aria-label="'+T("刪除")+'">✕</button></div>')+'</div>';
    if(i===lk&&!chatBusy){var fu="";eachA(FU,function(f){fu+='<button class="fu-chip" data-xa="q" data-q="'+esc(T(f[2]))+'">'+f[0]+' '+esc(T(f[1]))+'</button>';});h+='<div class="fu"><span class="small">'+T("接著問：")+'</span>'+fu+'</div>';}
  });
  return h;
}
function openXz(q,src){XZ.open=true;if(src)chatSrc=src;drawXz();if(q)sendChat(q);}
function closeXz(){XZ.open=false;drawXz();}
function drawXz(){
  var el=$("xz");
  if(!el){el=document.createElement("div");el.id="xz";el.className="xz";el.setAttribute("role","dialog");document.body.appendChild(el);}
  el.className="xz"+(XZ.open?" on":"");document.body.style.overflow=XZ.open?"hidden":"";if(!XZ.open){el.innerHTML="";return;}
  var qs="";eachA(QBANK,function(q){qs+='<button class="qs-chip" data-xa="q" data-q="'+esc(T(q))+'">'+esc(T(q))+'</button>';});
  var ab="";
  eachA(AUD_KEYS,function(a){ab+='<button data-xa="aud" data-v="'+a+'" class="'+(SET.aud===a?"on":"")+'">'+esc(audName(a))+'</button>';});
  el.innerHTML='<div class="xzhd"><button class="ib" data-xa="close" aria-label="'+T("關閉")+'">✕</button><span class="xzav">智</span><div class="grow"><b>'+T("小智")+'</b><div class="small">'+T("321 生命陪伴者")+'</div></div><button class="hdbtn" data-xa="foldall">'+T("收合")+'</button><button class="hdbtn" data-xa="clear">'+T("新對話")+'</button></div>'+
    '<div class="xzbd" id="xzb"><div class="chatctx">'+esc(T("目前：{0}",T(TAB_TITLE[state.tab])))+'</div><div class="segx sm">'+ab+'</div>'+
    '<button class="qs-toggle" data-xa="qs">💡 '+T("看看範例問題")+'</button><div class="qs-panel" id="qsPanel" hidden>'+qs+'</div>'+
    '<div class="chatlog" id="chatlog">'+chatLogHtml()+'</div></div>'+
    '<div class="xzft"><textarea id="chatIn" rows="1" placeholder="'+esc(T("問小智任何操練上的問題……"))+'"></textarea><button class="btn new" data-xa="send">'+T("送出")+'</button></div>';
  var inp=$("chatIn");if(inp)inp.onkeydown=function(e){if(e.keyCode===13&&!e.shiftKey&&!e.isComposing){e.preventDefault();sendChat(inp.value);}};
  paintSay();var bd=$("xzb");if(bd)bd.scrollTop=bd.scrollHeight;
}
function paintChat(){var log=$("chatlog");if(!log)return;log.innerHTML=chatLogHtml();paintSay();var bd=$("xzb");if(bd)setTimeout(function(){bd.scrollTop=bd.scrollHeight;},30);}
function sendChat(text){
  text=trim(text);if(!text||chatBusy)return;var inp=$("chatIn");if(inp)inp.value="";
  if(navigator.onLine===false){CHAT.push({role:"user",text:text,ts:now()});CHAT.push({role:"ai",text:T("目前離線，連上網路後小智才能回答。"),ts:now()});saveChat();paintChat();return;}
  CHAT.push({role:"user",text:text,src:chatSrc,ts:now()});var src=chatSrc;chatSrc=null;
  CHAT.push({role:"ai",text:"",wait:true,src:src});if(CHAT.length>60)CHAT=CHAT.slice(-60);chatBusy=true;paintChat();
  var msgs=[];eachA(CHAT,function(m){if(!m.wait&&m.text&&!m.err)msgs.push({role:m.role==="user"?"user":"assistant",content:m.text});});msgs=msgs.slice(-12);
  while(msgs.length&&msgs[0].role!=="user")msgs.shift();
  var last=CHAT[CHAT.length-1];
  xiChat(xzSys(),msgs,1800,4,function(part){last.wait=false;last.cont=true;last.text=part;if(XZ.open)paintChat();},function(err,txt){
    last.wait=false;last.cont=false;foldOld();last.fold=false;last.ts=now();
    if(err){last.text=err;last.err=true;last.ok=false;}else{last.text=txt;last.ok=true;}
    chatBusy=false;saveChat();if(XZ.open)paintChat();else toast(T("小智回答了"));
  });
}
function xzClick(b){
  var a=b.getAttribute("data-xa"),i=+b.getAttribute("data-i"),m=CHAT[i];
  if(a==="close"){closeXz();return;}
  if(a==="send"){var inp=$("chatIn");sendChat(inp?inp.value:"");return;}
  if(a==="q"){sendChat(b.getAttribute("data-q"));var p=$("qsPanel");if(p)p.hidden=true;return;}
  if(a==="qs"){var pn=$("qsPanel");if(pn)pn.hidden=!pn.hidden;return;}
  if(a==="aud"){SET.aud=b.getAttribute("data-v");saveSet();drawXz();toast(T("小智回答對象：{0}",b.textContent));return;}
  if(a==="foldall"){foldAll();return;}
  if(a==="clear"){if(chatBusy)return;CHAT=[];saveChat();stopAll();paintChat();toast(T("已開始新對話"));return;}
  if(a==="fold"){msgFold(i);return;}
  if(!m)return;
  if(a==="fav"){if(isFav(m.text)){FAV=FAV.filter?FAV.filter(function(f){return f.text!==m.text;}):FAV;toast(T("已取消收藏"));}else{var q=CHAT[i-1]&&CHAT[i-1].role==="user"?CHAT[i-1].text:"";FAV.push({text:m.text,q:q,ts:now()});toast(T("已收藏，可在「日記→畫線收藏」找到"));}saveFav();b.className="msg-act"+(isFav(m.text)?" on":"");return;}
  if(a==="share"){var s=m.src?Q(m.src.t)+"\n—— "+m.src.ref+"\n\n":"";shareText(s+mdStrip(m.text)+"\n\n—— "+T("國度321空中團契")+"\nhttps://spch321-sudo.github.io/321life/");return;}
  if(a==="copy"){copyText(mdStrip(m.text));return;}
  if(a==="tts"){if(sayKey==="m"+i){stopAll();return;}speakText(mdSpeak(m.text),"m"+i);return;}
  if(a==="del"){CHAT.splice(i,1);if(CHAT[i-1]&&CHAT[i-1].role==="user"&&(!CHAT[i]||CHAT[i].role==="user"))CHAT.splice(i-1,1);saveChat();stopAll();paintChat();return;}
}
/* 健檢追問的回答：朗讀、複製、分享、收藏 */
function ckAct(a,i){
  var e=ckFind(ck.show);if(!e||!e.chat||!e.chat[i])return;var c=e.chat[i];
  if(a==="tts"){if(sayKey==="ck"+i){stopAll();return;}speakText(mdSpeak(c.a),"ck"+i);return;}
  if(a==="copy"){copyText(mdStrip(c.a));return;}
  if(a==="share"){shareText(Q(c.q)+"\n\n"+mdStrip(c.a)+"\n\n—— "+T("國度321空中團契"));return;}
  if(a==="fav"){if(!isFav(c.a)){FAV.push({text:c.a,q:c.q,ts:now()});saveFav();}toast(T("已收藏，可在「日記→畫線收藏」找到"));return;}
}

/* ---------- 重畫之後 ---------- */
function afterRender(){
  eachA(qa(".md > p, .md > ul > li, .md > ol > li, .md > blockquote, .md > h4, .turn > .q",app),function(e){if(e.className.indexOf("rd")<0)e.className=(e.className?e.className+" ":"")+"rd";});
  paintHl();ttsRebind();paintSay();if(typeof updIdle==="function")updIdle();
}

/* ---------- 頁首、浮動鈕、面板事件 ---------- */
document.addEventListener("click",function(e){
  var b=e.target;while(b&&b!==document&&b.tagName!=="BUTTON")b=b.parentNode;if(!b||b===document)return;
  if(b.getAttribute("data-l")&&b.parentNode&&b.parentNode.id==="langsw"){switchLang(b.getAttribute("data-l"));return;}
  if(b.id==="btnfont"){cycleFont();return;}
  if(b.id==="btnset"){openSettings();return;}
  if(b.id==="fabtts"){if(spk.on||sayKey){stopAll();return;}ttsPage();return;}
  if(b.id==="fabxz"){stopAll();openXz();return;}
  if(b.getAttribute("data-set")){setClick(b);return;}
  var sa=b.getAttribute("data-sa");
  if(sa){closeSheet();
    if(sa==="marks"){state.jmode="marks";go("journal");}
    else if(sa==="backup"){go("growth");setTimeout(function(){var k=$("backup");if(k)k.scrollIntoView();},60);}
    else if(sa==="chk")checkUpdate(1);else if(sa==="hard")applyUpdate(true);
    return;}
  if(b.getAttribute("data-ha")){hlClick(b);return;}
  if(b.getAttribute("data-xa")){xzClick(b);return;}
});
document.addEventListener("keydown",function(e){if(e.keyCode===27){if($("sheet")){hlNoteGrab();closeSheet();paintHl();}else if(XZ.open)closeXz();}});
