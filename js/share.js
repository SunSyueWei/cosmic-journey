/* Share only after a click. Never include player identity or authentication data. */
(()=>{
 const url='https://sunsyuewei.github.io/cosmic-journey/',title='宇宙的奧祕與人生的意義',text='一起穿越九大行星，奔向福音聚會！';
 const $=id=>document.getElementById(id);
 $('share-url').value=url;
 $('share-line').href='https://social-plugins.line.me/lineit/share?url='+encodeURIComponent(url);
 $('share-facebook').href='https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(url);
 $('share-x').href='https://twitter.com/intent/tweet?text='+encodeURIComponent(text)+'&url='+encodeURIComponent(url);
 $('share-game').onclick=async()=>{
  try{if(navigator.share){await navigator.share({title,text,url});$('share-status').textContent='已交給系統分享介面。';return;}}
  catch(error){if(error.name==='AbortError')return;}
  $('share-fallback').hidden=false;
  try{await navigator.clipboard.writeText(url);$('share-status').textContent='網址已複製，可貼到 LINE、Instagram 或其他社群。';}
  catch(_){$('share-status').textContent='請選擇社群，或手動複製下方網址。';$('share-url').focus();$('share-url').select();}
 };
})();
