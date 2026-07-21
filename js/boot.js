/* Cinematic boot: terminal decrypt lines + progress + scanline wipe reveal.
   Shows once per session; REBOOT control replays it. */
(function () {
  const boot = document.getElementById('boot');
  const body = document.body;
  if (!boot) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = matchMedia('(hover: none), (pointer: coarse)').matches;
  const pace = coarse ? 0.42 : 1;
  const hardCap = coarse ? 1500 : 9000;
  const GLYPHS = 'ｱｲｳｴｵｶｷｸ01<>/\\#$%&*+=日本開発写真ABCDEF';
  const rand = s => s[Math.floor(Math.random() * s.length)];

  const linesEl = boot.querySelector('.boot-lines');
  const barEl = boot.querySelector('.boot-bar');
  const pctEl = boot.querySelector('.boot-pct');
  const skipEl = boot.querySelector('.boot-skip');

  const SEQ = [
    { txt: 'daikieOS // boot loader v2.0', cls: '' },
    { txt: 'POST .......................... <ok>OK</ok>', cls: '' },
    { txt: 'mounting /dev/identity ........ <ok>OK</ok>', cls: '' },
    { txt: 'decrypting neural_profile ..... <ok>OK</ok>', cls: '', scramble: true },
    { txt: 'loading webgl_renderer ........ <ok>OK</ok>', cls: '' },
    { txt: 'spawning particle_fields[3] ... <ok>OK</ok>', cls: '' },
    { txt: 'sync tokyo_uplink 35.6N 139.6E  <warn>LIVE</warn>', cls: '' },
    { txt: 'establishing HUD interface .... <ok>OK</ok>', cls: '' },
  ];

  function html(s) {
    return s.replace(/<ok>(.*?)<\/ok>/g, '<span class="ok">$1</span>')
            .replace(/<warn>(.*?)<\/warn>/g, '<span class="warn">$1</span>');
  }

  let done = false;
  let timers = [];
  const later = (fn, ms) => { const tm = setTimeout(fn, ms * pace); timers.push(tm); return tm; };
  const repeat = (fn, ms) => { const tm = setInterval(fn, ms * pace); timers.push(tm); return tm; };
  const clear = () => { timers.forEach(clearTimeout); timers.forEach(clearInterval); timers = []; };

  function finish() {
    if (done) return; done = true; clear();
    try { sessionStorage.setItem('daikie-booted', '1'); } catch (e) {}
    if (window.__sceneWarp) window.__sceneWarp();
    boot.classList.add('gone');
    body.removeAttribute('data-booting');
    body.classList.add('revealed');
    document.dispatchEvent(new Event('boot:done'));
    later(() => boot.remove(), 1000);
  }

  function typeLine(item, cb) {
    const el = document.createElement('div');
    el.className = 'boot-line ' + (item.cls || '');
    linesEl.appendChild(el);
    requestAnimationFrame(() => el.classList.add('in'));
    if (item.scramble) {
      // decrypt effect on a payload word
      let frames = 0; const total = 14;
      const iv = repeat(() => {
        frames++;
        if (frames >= total) { clearInterval(iv); el.innerHTML = html(item.txt); cb(); return; }
        let scrambled = item.txt.replace(/[a-z_]/gi, () => rand(GLYPHS));
        el.innerHTML = html(scrambled);
      }, 38);
    } else {
      el.innerHTML = html(item.txt);
      later(cb, 150 + Math.random() * 90);
    }
  }

  function run() {
    let i = 0, pct = 0;
    const step = () => {
      if (done) return;
      if (i >= SEQ.length) {
        // ramp progress to 100 then finish
        const iv = repeat(() => {
          pct = Math.min(100, pct + 7);
          barEl.style.width = pct + '%'; pctEl.textContent = String(pct).padStart(3, '0') + '% // SYSTEM ONLINE';
          if (pct >= 100) { clearInterval(iv); later(finish, 520); }
        }, 34);
        return;
      }
      typeLine(SEQ[i], () => {
        i++; pct = Math.min(96, Math.round((i / SEQ.length) * 96));
        barEl.style.width = pct + '%'; pctEl.textContent = String(pct).padStart(3, '0') + '%';
        step();
      });
    };
    step();
  }

  function instant() {
    if (done) return;
    done = true;
    clear();
    body.removeAttribute('data-booting');
    boot.remove();
    document.dispatchEvent(new Event('boot:done'));
  }

  skipEl && skipEl.addEventListener('click', finish);
  addEventListener('keydown', e => { if (e.key === 'Escape') finish(); }, { once: false });

  // public reboot
  window.__reboot = function () {
    document.body.setAttribute('data-booting', '');
    location.reload();
  };

  let already = false;
  try { already = sessionStorage.getItem('daikie-booted') === '1'; } catch (e) {}

  if (reduced || already) { instant(); }
  else {
    run();
    const capDelay = coarse ? Math.max(0, hardCap - performance.now()) : hardCap;
    timers.push(setTimeout(finish, capDelay));
  }   // hard cap — boot never hangs
})();
