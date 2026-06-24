/* ============================================================================
   DSI Course System — minimal JS helpers used by the Blazor Hybrid app.
   Only two responsibilities remain in JS: theme persistence and toast popups.
   Everything else (sidebar, topbar, modals, dropdowns, list filters,
   pagination, notifications, date pickers) is rendered/handled by Blazor.
   ========================================================================== */

var OK_IC  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>';
var ERR_IC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';

function ensureOverlays(){
  if(!document.getElementById('toastWrap'))
    document.body.insertAdjacentHTML('beforeend', '<div class="toastwrap" id="toastWrap"></div>');
}

function toast(msg, kind){
  ensureOverlays();
  var w = document.getElementById('toastWrap'); if(!w) return;
  var t = document.createElement('div');
  t.className = 'toast' + (kind === 'err' ? ' err' : '');
  t.innerHTML = '<span class="ti">' + (kind === 'err' ? ERR_IC : OK_IC) + '</span><span>' + msg + '</span>';
  w.appendChild(t);
  requestAnimationFrame(function(){ t.classList.add('show'); });
  setTimeout(function(){ t.classList.remove('show'); setTimeout(function(){ if(t.parentNode) t.parentNode.removeChild(t); }, 320); }, 2600);
}

/* ---- theme ---- */
function getTheme(){ try{ return localStorage.getItem('dsi-theme') || 'light'; }catch(e){ return 'light'; } }
function applyTheme(t){ document.documentElement.classList.toggle('dark', t === 'dark'); try{ localStorage.setItem('dsi-theme', t); }catch(e){} }
function toggleTheme(){ applyTheme(getTheme() === 'dark' ? 'light' : 'dark'); }

/* ---- dropdown/datepicker popup positioning (prototype ddToggle/dpOpen behavior) ----
   Pins the open menu as position:fixed under its trigger and flips it above when it
   would overflow the viewport. Called by DsiSelect / DsiDatePicker right after opening. */
function positionMenu(trigger, menu){
  if(!trigger || !menu) return;
  var r = trigger.getBoundingClientRect();
  menu.style.position = 'fixed';
  if(menu.classList.contains('dd-menu')) menu.style.width = r.width + 'px';
  menu.style.left = Math.max(8, Math.min(r.left, window.innerWidth - menu.offsetWidth - 8)) + 'px';
  menu.style.right = 'auto';
  menu.style.top = (r.bottom + 6) + 'px';
  var mh = menu.offsetHeight;
  if(r.bottom + 6 + mh > window.innerHeight - 8)
    menu.style.top = Math.max(8, r.top - mh - 6) + 'px';
  menu.classList.add('dd-pos');   // CSS keeps the menu invisible until this point
}

/* ---- click-outside close for Blazor dropdown components ----
   Registers a document-level listener that tells the component to close when the
   user clicks outside its root. Unlike a full-screen overlay, the click still
   reaches whatever was clicked — so switching between dropdowns takes one click. */
function dsiClickOutside(root, ref){
  function handler(e){
    if(root && root.contains(e.target)) return;
    document.removeEventListener('mousedown', handler, true);
    try{ ref.invokeMethodAsync('CloseFromJs'); }catch(_){}
  }
  document.addEventListener('mousedown', handler, true);
}

/* ---- Escape closes the active modal (one-shot, registered on open) ---- */
function dsiEscape(ref){
  function h(e){
    if(e.key !== 'Escape') return;
    document.removeEventListener('keydown', h, true);
    try{ ref.invokeMethodAsync('CloseFromJs'); }catch(_){}
  }
  document.addEventListener('keydown', h, true);
}

/* ---- UI language direction (set from Blazor on boot) ---- */
function applyDir(d){
  document.documentElement.setAttribute('dir', d);
  document.documentElement.setAttribute('lang', d === 'ltr' ? 'en' : 'ar');
}

/* ---- clipboard helper (phone numbers etc.) ---- */
function copyText(t){
  if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(t); return; }
  var ta = document.createElement('textarea');
  ta.value = t; document.body.appendChild(ta); ta.select();
  try{ document.execCommand('copy'); }catch(_){}
  document.body.removeChild(ta);
}

/* ---- print sheet: capture the live (possibly user-edited) document for PDF export ---- */
function getPrintDoc(){
  var st = document.getElementById('printcss');
  var body = document.querySelector('.pbody');
  if(!st || !body) return '';
  var clone = body.cloneNode(true);
  // overlays (print dialog, toasts) must never end up inside the printed document
  var overlays = clone.querySelectorAll('.backdrop,.toastwrap,.dd-menu');
  for(var o = 0; o < overlays.length; o++) overlays[o].parentNode.removeChild(overlays[o]);
  // inline every image as a data URI so the exported file is fully self-contained
  var liveImgs = body.querySelectorAll('img');
  var cloneImgs = clone.querySelectorAll('img');
  for(var i = 0; i < cloneImgs.length; i++){
    try{
      var src = liveImgs[i];
      if(!src || !src.naturalWidth) continue;
      var c = document.createElement('canvas');
      c.width = src.naturalWidth; c.height = src.naturalHeight;
      c.getContext('2d').drawImage(src, 0, 0);
      cloneImgs[i].setAttribute('src', c.toDataURL('image/png'));
    }catch(_){}
  }
  return '<style>' + st.innerHTML + '</style>' + clone.outerHTML;
}

/* ---- Ctrl+K focuses the global search ---- */
document.addEventListener('keydown', function(e){
  if((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')){
    e.preventDefault();
    var i = document.querySelector('.top .search input');
    if(i) i.focus();
  }
});

applyTheme(getTheme());
ensureOverlays();
