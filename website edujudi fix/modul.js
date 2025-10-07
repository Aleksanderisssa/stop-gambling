/* =========================================================
   EduJudi — Interaksi Modul & Kuis
   - Search + Sort untuk kartu modul
   - Skoring kuis (Likert 1–5), simpan/restore jawaban
   ========================================================= */

// ---------- UTIL ----------
const $  = (sel, ctx=document) => ctx.querySelector(sel);
const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));
const toPercentNumber = (v) => {
  // input seperti "50%" atau "50" -> 50 (number)
  if (typeof v === "number") return v;
  if (!v) return 0;
  const num = String(v).trim().replace('%','');
  return Number.isFinite(+num) ? +num : 0;
};

// =========================================================
//  A) MODUL — Search + Sort (disuntik otomatis)
// =========================================================
(function enhanceModules(){
  const grid = $('.modules');
  if (!grid) return;

  // 1) Sisipkan toolbar (search + sort) tepat di atas grid
  const container = $('.main.container') || grid.parentElement;
  const toolbar = document.createElement('section');
  toolbar.className = 'module-toolbar';
  toolbar.innerHTML = `
    <form id="modToolbar" class="modbar" action="#" role="search" autocomplete="off">
      <input id="modSearch" class="modbar__input" type="search" placeholder="Cari modul…">
      <select id="modSort" class="modbar__select" aria-label="Urutkan">
        <option value="recent">Terbaru (default)</option>
        <option value="az">A–Z</option>
        <option value="progress">Progress</option>
      </select>
      <button class="modbar__btn" type="reset" title="Bersihkan">Clear</button>
    </form>
  `;
  container.insertBefore(toolbar, grid);

  // 2) Ambil kartu modul
  const cards = $$('.module-card', grid).map(card => {
    const titleEl = $('.module-title', card);
    const progEl  = $('.module-progress__value', card);
    const title   = (titleEl?.textContent || '').trim();
    const prog    = toPercentNumber(progEl?.style?.width);
    return { card, title, prog };
  });

  // 3) Handler Search
  const searchInput = $('#modSearch', toolbar);
  const onSearch = () => {
    const q = (searchInput.value || '').toLowerCase().trim();
    cards.forEach(({card, title}) => {
      const show = !q || title.toLowerCase().includes(q);
      card.style.display = show ? '' : 'none';
    });
  };

  // 4) Handler Sort
  const sortSel = $('#modSort', toolbar);
  const applySort = () => {
    const mode = sortSel.value;
    const sorted = [...cards].sort((a,b) => {
      if (mode === 'az') return a.title.localeCompare(b.title);
      if (mode === 'progress') return b.prog - a.prog; // tinggi -> rendah
      return 0; // recent (as-is)
    });
    // Append ulang sesuai urutan
    sorted.forEach(({card}) => grid.appendChild(card));
  };

  // 5) Reset -> tampilkan semua & urutan default
  toolbar.addEventListener('reset', (e) => {
    setTimeout(() => {
      searchInput.value = '';
      sortSel.value = 'recent';
      onSearch();
      applySort();
    }, 0);
  });

  searchInput.addEventListener('input', onSearch);
  sortSel.addEventListener('change', applySort);
})();

// =========================================================
//  B) KUIS — Skor + Kategori + Simpan ke localStorage
// =========================================================
(function quizLogic(){
  const form = $('.quiz__form');
  if (!form) return;

  const RESULT_KEY = 'edujudi_quiz_results_v1';

  // 1) Restore jawaban jika ada
  const saved = JSON.parse(localStorage.getItem(RESULT_KEY) || '{}');
  if (saved.answers) {
    Object.entries(saved.answers).forEach(([name, val]) => {
      const input = $(`input[name="${name}"][value="${val}"]`, form);
      if (input) input.checked = true;
    });
  }

  // 2) Buat container hasil
  const resultBox = document.createElement('section');
  resultBox.className = 'quiz__result';
  form.insertAdjacentElement('afterend', resultBox);

  // 3) Hitung skor saat submit
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Ambil semua fieldset (Q1..Qn)
    const groups = $$('.quiz-q', form);
    let total = 0, max = 0;
    const answers = {};

    for (const [idx, fs] of groups.entries()) {
      const name = `q${idx+1}`;
      const chosen = $(`input[name="${name}"]:checked`, fs);
      if (!chosen) {
        fs.scrollIntoView({behavior:'smooth', block:'center'});
        // beri outline singkat
        fs.style.boxShadow = '0 0 0 2px rgba(255,0,0,.35)';
        setTimeout(()=> fs.style.boxShadow = '', 800);
        return; // stop: masih ada yang belum diisi
      }
      const v = Number(chosen.value || 0);
      total += v;
      max   += 5;
      answers[name] = v;
    }

    // Kategori sederhana
    const pct = Math.round((total / max) * 100);
    let level = 'Rendah';
    let colorClass = 'ok';
    if (pct >= 70 && pct < 85) { level = 'Sedang'; colorClass = 'warn'; }
    else if (pct >= 85) { level = 'Tinggi'; colorClass = 'alert'; }

    // Simpan ke localStorage
    localStorage.setItem(RESULT_KEY, JSON.stringify({ total, max, pct, level, ts: Date.now(), answers }));

    // Tampilkan hasil
    resultBox.innerHTML = `
      <div class="result-card result-${colorClass}">
        <h3>Hasil Tes</h3>
        <p><strong>Skor:</strong> ${total} / ${max} (${pct}%)</p>
        <p><strong>Kategori:</strong> ${level}</p>
        <div class="result-tips">
          ${level === 'Rendah' ? `
            <p>Bagus! Tetap pertahankan kebiasaan sehat dan lanjutkan modul berikutnya.</p>
          ` : level === 'Sedang' ? `
            <p>Waspada. Pertimbangkan strategi pengendalian diri dan diskusikan dengan orang tepercaya.</p>
          ` : `
            <p>Risiko tinggi. Pertimbangkan untuk menghubungi konselor/psikolog, dan ikuti modul pemulihan.</p>
          `}
        </div>
        <div class="result-actions">
          <a class="btn-outline" href="#modul-lanjut">Lanjutkan Modul</a>
          <button class="btn-ghost" id="resetQuiz" type="button">Ulangi Kuis</button>
        </div>
      </div>
    `;

    // tombol ulang
    const resetBtn = $('#resetQuiz', resultBox);
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        $$('input[type="radio"]', form).forEach(r => r.checked = false);
        localStorage.removeItem(RESULT_KEY);
        resultBox.innerHTML = '';
        form.scrollIntoView({behavior:'smooth', block:'start'});
      });
    }

    resultBox.scrollIntoView({behavior:'smooth', block:'start'});
  });
})();
/* ========= Quiz reveal-down (multi-soal di bawah) ========= */
/* ===================== QUIZ – Reveal down + UX ===================== */
(() => {
  const form = document.getElementById('quizForm');
  if (!form) return;

  const sets  = Array.from(form.querySelectorAll('.qset'));
  const total = sets.length;
  const bar   = document.getElementById('quizBar');
  const step  = document.getElementById('quizStep');
  const actions   = document.getElementById('quizActions');
  const resultBox = document.getElementById('quizResult');

  // Kunci jawaban
  const answerKey = { q1:'D', q2:'D', q3:'A', q4:'C' };

  const answeredCount = () =>
    sets.reduce((n, fs, i) => n + (form.querySelector(`input[name="q${i+1}"]:checked`) ? 1 : 0), 0);

  const updateProgress = () => {
    const done = answeredCount();
    const pct  = Math.max(1, Math.round((done/total)*100));
    if (bar)  bar.style.width = pct + '%';
    if (step) step.textContent = String(Math.max(1, done || 1));
    if (done === total) actions?.classList.remove('is-hidden');
  };

  // Ripple kecil di kartu saat klik
  const addRipple = (el, ev) => {
    const r = document.createElement('span');
    r.className = 'ripple';
    const rect = el.getBoundingClientRect();
    const x = ev.clientX - rect.left, y = ev.clientY - rect.top;
    r.style.left = x + 'px'; r.style.top = y + 'px';
    el.appendChild(r);
    setTimeout(() => r.remove(), 450);
  };
  // Ripple CSS inject ringan
  const rippleStyle = document.createElement('style');
  rippleStyle.textContent = `
    .qopt__card{position:relative;overflow:hidden}
    .ripple{position:absolute;transform:translate(-50%,-50%);
      width:10px;height:10px;border-radius:999px;pointer-events:none;
      background:rgba(255,255,255,.15);animation:rip .45s ease-out}
    @keyframes rip{from{opacity:1;scale:1} to{opacity:0;scale:16}}
  `;
  document.head.appendChild(rippleStyle);

  // Reveal next on answer + ripple
  sets.forEach((fs, idx) => {
    fs.addEventListener('click', (e) => {
      const card = e.target.closest('.qopt__card');
      if (card) addRipple(card, e);
    });
    fs.addEventListener('change', (e) => {
      if (!(e.target instanceof HTMLInputElement)) return;
      const next = sets[idx+1];
      if (next && next.classList.contains('is-hidden')) {
        next.classList.remove('is-hidden');
        next.style.scrollMarginTop = '80px';
        next.scrollIntoView({ behavior:'smooth', block:'start' });
      }
      updateProgress();
    });
  });

  // Keyboard: 1..9 pilih opsi pada qset aktif terakhir yang terlihat
  document.addEventListener('keydown', (e) => {
    if (!/^[1-9]$/.test(e.key)) return;
    const visible = sets.filter(s => !s.classList.contains('is-hidden'));
    const active  = visible[visible.length - 1] || sets[0];
    const radios  = Array.from(active.querySelectorAll('input[type="radio"]'));
    const idx = Math.min(Number(e.key)-1, radios.length-1);
    if (radios[idx]) {
      radios[idx].checked = true;
      radios[idx].dispatchEvent(new Event('change', {bubbles:true}));
      const card = radios[idx].nextElementSibling;
      if (card) addRipple(card, {clientX: card.offsetLeft+20, clientY: card.offsetTop+10});
    }
  });

  // Submit → skor + hasil
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (answeredCount() !== total) return;

    let correct = 0;
    Object.keys(answerKey).forEach((q) => {
      const chosen = form.querySelector(`input[name="${q}"]:checked`);
      if (chosen && chosen.value === answerKey[q]) correct++;
    });
    const pct = Math.round((correct/total)*100);

    resultBox.innerHTML = `
      <div class="result-card">
        <h3>Hasil Kuis</h3>
        <p><strong>Benar:</strong> ${correct} / ${total} (${pct}%)</p>
        <div class="result-actions">
          <a class="btn-outline" href="#modul-lanjut">Lanjut ke Modul Berikutnya</a>
          <button id="retryQuiz" class="btn-ghost" type="button">Ulangi</button>
        </div>
      </div>
    `;
    document.getElementById('retryQuiz')?.addEventListener('click', () => {
      form.reset();
      sets.forEach((fs,i)=> i===0? fs.classList.remove('is-hidden') : fs.classList.add('is-hidden'));
      actions.classList.add('is-hidden');
      resultBox.innerHTML = '';
      if (bar) bar.style.width = '25%';
      if (step) step.textContent = '1';
      sets[0].scrollIntoView({behavior:'smooth', block:'start'});
    });
    resultBox.scrollIntoView({behavior:'smooth', block:'start'});
  });
// Progress & reveal bertahap (satu file JS untuk blok kuis ini)
(() => {
  const root = document.getElementById('kuis-modul-1');
  if (!root) return;

  const form  = root.querySelector('#quizForm');
  const sets  = Array.from(root.querySelectorAll('.qset'));
  const total = sets.length;

  const bar   = root.querySelector('#quizBar');
  const step  = root.querySelector('#quizStep');
  const totalEl = root.querySelector('#quizTotal');

  if (totalEl) totalEl.textContent = String(total);

  // hitung berapa fieldset yang sudah terisi (ada radio checked)
  const answeredCount = () =>
    sets.reduce((n, fs, i) => n + (form.querySelector(`input[name="q${i+1}"]:checked`) ? 1 : 0), 0);

  const updateProgress = () => {
    const done = answeredCount();
    const pct  = Math.max(1, Math.round((done / total) * 100)); // minimal 1% biar terlihat
    if (bar)  bar.style.width = pct + '%';
    if (step) step.textContent = String(Math.max(1, done || 1));
  };

  // Saat memilih jawaban di satu fieldset → tampilkan fieldset berikutnya + update progress
  sets.forEach((fs, idx) => {
    fs.addEventListener('change', (e) => {
      if (!(e.target instanceof HTMLInputElement) || e.target.type !== 'radio') return;

      const next = sets[idx + 1];
      if (next && next.classList.contains('is-hidden')) {
        next.classList.remove('is-hidden');
        next.style.scrollMarginTop = '80px';
        next.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      updateProgress();
    });
  });

  // Inisialisasi bar pada load
  updateProgress();
})();
  
  // init
  updateProgress();
})();
