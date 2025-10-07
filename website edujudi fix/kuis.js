// Tahun footer
document.getElementById('year')?.append(new Date().getFullYear());

// KUIS
(function initQuiz(){
  const form = document.getElementById('quizForm');
  if(!form) return;

  const sets = [...form.querySelectorAll('.qset')];
  const total = sets.length;
  const stepNow = document.getElementById('stepNow');
  const stepTotal = document.getElementById('stepTotal');
  const bar = document.getElementById('progressBar');
  const btnPrev = document.getElementById('btnPrev');
  const btnNext = document.getElementById('btnNext');
  const btnSubmit = document.getElementById('btnSubmit');
  const resultBox = document.getElementById('quizResult');

  stepTotal.textContent = String(total);

  let idx = 0; // index set aktif

  const answerKey = { q1:'D', q2:'D', q3:'A', q4:'C' };

  function show(i){
    idx = Math.max(0, Math.min(total-1, i));
    sets.forEach((s, n)=> s.classList.toggle('is-current', n===idx));
    stepNow.textContent = String(idx+1);
    const pct = Math.round(((idx)/ (total-1 || 1)) * 100); // 0..100
    bar.style.width = (total===1?100:pct) + '%';
    btnPrev.disabled = idx===0;
    btnNext.classList.toggle('is-hidden', idx===total-1);
    btnSubmit.classList.toggle('is-hidden', idx!==total-1);
    sets[idx].scrollIntoView({behavior:'smooth', block:'start'});
  }

  function next(){
    // wajib pilih salah satu sebelum lanjut
    const name = 'q'+(idx+1);
    const chosen = form.querySelector(`input[name="${name}"]:checked`);
    if(!chosen){ sets[idx].style.boxShadow='0 0 0 2px rgba(255,80,80,.35)'; setTimeout(()=>sets[idx].style.boxShadow='',800); return;}
    show(idx+1);
  }

  // tombol
  btnPrev.addEventListener('click', ()=> show(idx-1));
  btnNext.addEventListener('click', next);

  // keyboard 1..9 untuk pilih
  document.addEventListener('keydown', (e)=>{
    if(/^[1-9]$/.test(e.key)){
      const radios = [...sets[idx].querySelectorAll('input[type="radio"]')];
      const r = radios[Math.min(Number(e.key)-1, radios.length-1)];
      if(r){ r.checked=true; r.dispatchEvent(new Event('change',{bubbles:true})); }
    }
    if(e.key==='Enter'){ e.preventDefault(); (idx===total-1? form.requestSubmit(): next()); }
    if(e.key==='ArrowRight') next();
    if(e.key==='ArrowLeft') btnPrev.click();
  });

  // submit → skor + hasil
  form.addEventListener('submit',(e)=>{
    e.preventDefault();
    // pastikan semua terisi
    for(let i=1;i<=total;i++){
      if(!form.querySelector(`input[name="q${i}"]:checked`)){ show(i-1); return; }
    }
    let correct=0;
    Object.keys(answerKey).forEach(k=>{
      const v = form.querySelector(`input[name="${k}"]:checked`)?.value;
      if(v===answerKey[k]) correct++;
    });
    const pct = Math.round((correct/total)*100);

    resultBox.classList.remove('is-hidden');
    resultBox.innerHTML = `
      <h2 class="result__title">Hasil Kuis</h2>
      <div class="result__grid">
        <div><span class="badge">Benar</span> ${correct} dari ${total}</div>
        <div><span class="badge">Skor</span> ${pct}%</div>
      </div>
      <p style="margin-top:10px;color:var(--muted)">${
        pct>=85? 'Mantap! Pemahamanmu sangat baik.' :
        pct>=70? 'Bagus. Masih ada ruang untuk memperkuat pemahaman.' :
                 'Perlu penguatan. Coba ulangi modul dan kerjakan lagi.'
      }</p>
      <div class="quiz-nav" style="justify-content:flex-start;margin-top:12px">
        <button class="btn-ghost" id="retry">Ulangi Kuis</button>
        <a class="btn-primary" href="modul.html">Kembali ke Modul</a>
      </div>
    `;
    document.getElementById('retry').addEventListener('click',()=>{
      form.reset(); show(0); resultBox.classList.add('is-hidden'); resultBox.innerHTML='';
      bar.style.width='0%';
    });
    resultBox.scrollIntoView({behavior:'smooth', block:'start'});
  });

  // init
  show(0);
})();
