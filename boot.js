/* ---------- 啟動 ---------- */
loadPack(L(),function(){
  applyChrome();render();initUpdate();
  setTimeout(function(){if(SET.human&&navigator.onLine!==false)ajaxBuf(SVC.tts,{voice:voiceName(),rate:"+0%",sil:140,silc:140,sile:260,text:"。"},function(){});},1200);
});
