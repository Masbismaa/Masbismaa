// Interactive pieces inside the page sections. Each init* only touches its own section.
import { $, esc, countTo, wait, copyText } from '../util.js';
import { audio } from '../audio.js';
import { burst, burstAt } from '../fx.js';
import * as D from '../data.js';

export function initJourney() {
  $('journey').innerHTML = D.JOURNEY.map((j, i) => `
    <li class="journey-item">
      <span class="journey-no">${String(i + 1).padStart(2, '0')}</span>
      <div><span class="journey-when">${j.when}</span><h3>${esc(j.title)}</h3><p>${j.text}</p><p class="tags">${j.tags.join(' / ')}</p></div>
    </li>`).join('');
}

export function initAlr() {
  const label = { full: 'edit dan hapus', ro: 'lihat dan salin', none: 'tertutup' };
  const access = (role, r) => role === 'admin' ? (r.v === 'Public' ? 'full' : 'none') : r.o === role.toUpperCase() ? 'full' : r.v === 'Public' ? 'ro' : 'none';
  $('alrRows').innerHTML = D.ALR_ROWS.map(r => `
    <div class="alr-row" role="row">
      <span class="alr-title">${r.t}</span><span class="alr-cat">${r.c}</span><span class="alr-meta">${r.o}</span><span class="alr-meta">${r.v}</span><span class="alr-acc"></span>
      <span class="alr-shutter" aria-hidden="true"><b>tutup</b></span>
    </div>`).join('');
  const set = (role, fx) => {
    document.querySelectorAll('[data-role]').forEach(b => b.setAttribute('aria-pressed', b.dataset.role === role));
    $('alrNote').innerHTML = D.ALR_NOTES[role];
    const n = { full: 0, ro: 0, none: 0 };
    document.querySelectorAll('.alr-row').forEach((el, i) => {
      const a = access(role, D.ALR_ROWS[i]); n[a]++;
      setTimeout(() => {
        const was = el.classList.contains('closed');
        el.classList.toggle('closed', a === 'none');
        if (fx && a === 'none' && !was) audio.hit(160);
        const acc = el.querySelector('.alr-acc'); acc.dataset.a = a; acc.textContent = label[a];
      }, fx ? i * 80 : 0);
    });
    countTo($('nFull'), n.full); countTo($('nRo'), n.ro); countTo($('nNone'), n.none);
  };
  document.querySelectorAll('[data-role]').forEach(b => b.addEventListener('click', () => { audio.tick(); set(b.dataset.role, true); }));
  set('mbp');
}

export function initProjects() {
  const list = $('projects');
  list.innerHTML = D.PROJECTS.map((p, i) => `
    <li class="project${p.star ? ' project--lead' : ''}" data-c="${p.c}">
      <span class="project-no">${String(i + 1).padStart(2, '0')}</span>
      <div class="project-body">
        <h3>${esc(p.t)}</h3>
        <p>${esc(p.d)}</p>
        ${p.feat ? `<ul class="project-feat">${p.feat.map(f => `<li>${esc(f)}</li>`).join('')}</ul>` : ''}
      </div>
      <span class="project-cat">${D.PROJECT_CATS[p.c]}</span>
      <span class="project-stack">${p.tags.join(' / ')}</span>
    </li>`).join('');
  const f = $('projectFilter');
  f.innerHTML = [['all', `Semua ${D.PROJECTS.length}`]].concat(Object.entries(D.PROJECT_CATS).map(([k, v]) => [k, `${v} ${D.PROJECTS.filter(p => p.c === k).length}`]))
    .map(([k, v], i) => `<button class="btn btn--text" type="button" data-f="${k}" aria-pressed="${i === 0}">${v}</button>`).join('');
  f.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    audio.tick();
    f.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b));
    list.querySelectorAll('.project').forEach(el => { el.hidden = !(b.dataset.f === 'all' || el.dataset.c === b.dataset.f); });
  });
}

export function initScan() {
  let busy = false;
  const labels = { high: 'HIGH', med: 'MEDIUM', low: 'LOW' };
  $('scanBtn').addEventListener('click', async () => {
    if (busy) return;
    busy = true; $('scanBtn').disabled = true; $('fixBtn').disabled = true;
    $('alerts').innerHTML = ''; $('scanMeter').style.width = '0';
    for (let i = 0; i < D.FINDINGS.length; i++) {
      await wait(380 + Math.random() * 280);
      const [lv, nm] = D.FINDINGS[i];
      $('alerts').insertAdjacentHTML('beforeend', `<li class="alert"><span class="alert-lv" data-lv="${lv}">${labels[lv]}</span><span class="alert-nm">${nm}</span><span class="alert-st">ditemukan</span></li>`);
      $('scanMeter').style.width = ((i + 1) / D.FINDINGS.length * 100) + '%';
      audio.tick(lv === 'high' ? 900 : 1500);
    }
    busy = false; $('scanBtn').disabled = false; $('scanBtn').textContent = 'Scan ulang'; $('fixBtn').disabled = false;
  });
  $('fixBtn').addEventListener('click', async () => {
    $('fixBtn').disabled = true;
    const open = [...document.querySelectorAll('.alert:not(.fixed)')];
    for (const el of open) {
      await wait(240);
      el.classList.add('fixed'); el.querySelector('.alert-st').textContent = 'diperbaiki';
      audio.hit(700);
      const r = el.getBoundingClientRect(); burstAt(r.right - 40, r.top + r.height / 2, 8);
    }
    if (open.length) audio.ok();
  });
}

export function initFlow() {
  const strip = $('steps');
  strip.innerHTML = D.STEPS.map((s, i) => `<button class="step" type="button" role="tab" aria-selected="false"><span class="step-no">${i + 1}</span><span class="step-name">${s.t}</span></button>`).join('');
  const show = (i, fx) => {
    strip.querySelectorAll('.step').forEach((b, j) => { b.setAttribute('aria-selected', i === j); b.classList.toggle('done', j < i); });
    const s = D.STEPS[i], d = $('stepDetail');
    d.innerHTML = `<div><span class="kicker">langkah ${i + 1} dari ${D.STEPS.length}</span><h3>${s.h}</h3><p>${s.p}</p></div><pre class="code">${esc(s.code)}</pre>`;
    d.classList.remove('cut'); void d.offsetWidth; d.classList.add('cut');
    if (fx) audio.tick(1200 + i * 150);
  };
  strip.querySelectorAll('.step').forEach((b, i) => b.addEventListener('click', () => show(i, true)));
  show(0);
}

export function initTests() {
  $('testList').innerHTML = D.TESTS.map(t => `<li><span class="check" aria-hidden="true"></span><span>${t}</span><span class="pass">PASSED</span></li>`).join('');
  let busy = false;
  $('runBtn').addEventListener('click', async () => {
    if (busy) return;
    busy = true; $('runBtn').disabled = true;
    const items = document.querySelectorAll('#testList li');
    items.forEach(li => li.classList.remove('ok')); $('stamp').classList.remove('on');
    $('testScore').textContent = `0/${D.TESTS.length}`; $('testMeter').style.width = '0';
    await wait(250);
    for (let i = 0; i < items.length; i++) {
      await wait(230 + Math.random() * 200);
      items[i].classList.add('ok'); audio.tick(1100 + i * 90);
      $('testScore').textContent = `${i + 1}/${D.TESTS.length}`; $('testMeter').style.width = ((i + 1) / D.TESTS.length * 100) + '%';
    }
    await wait(200);
    $('stamp').classList.add('on'); audio.impact(); burst($('stamp'), 24);
    busy = false; $('runBtn').disabled = false; $('runBtn').textContent = 'Jalankan lagi';
  });
}

export function initCommit() {
  let type = 'feat';
  const desc = $('desc');
  $('types').innerHTML = D.COMMIT_TYPES.map(t => `<button class="btn btn--text" type="button" data-t="${t}" aria-pressed="${t === type}">${t}</button>`).join('');
  const render = () => {
    const d = desc.value;
    $('preview').innerHTML = `git commit -m "<span class="accent">${type}:</span> ${esc(d.trim()) || '...'}"`;
    $('rules').innerHTML = D.COMMIT_RULES.map(([t, f]) => `<li class="${f(d) ? 'ok' : ''}">${t}</li>`).join('');
  };
  $('types').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    type = b.dataset.t; audio.tick();
    $('types').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b));
    render();
  });
  desc.addEventListener('input', render);
  render();
  $('copyBtn').addEventListener('click', e => copyText(`git commit -m "${type}: ${desc.value.trim()}"`, e.currentTarget, 'Salin perintah', $('preview')));
}

export function initStack() {
  const total = D.STACK.reduce((a, g) => a + g.items.length, 0);
  $('stackGroups').innerHTML = D.STACK.map(g => `
    <div class="stack-group" data-g="${g.id}">
      <h3>${g.name} <small>${g.items.length}</small></h3>
      <dl>${g.items.map(([n, d, note]) => `<div class="stack-item"><dt>${n}${note ? `<em>${note}</em>` : ''}</dt><dd>${d}</dd></div>`).join('')}</dl>
    </div>`).join('');
  const f = $('stackFilter');
  f.innerHTML = [['all', `Semua ${total}`]].concat(D.STACK.map(g => [g.id, `${g.name} ${g.items.length}`]))
    .map(([k, v], i) => `<button class="btn btn--text" type="button" data-f="${k}" aria-pressed="${i === 0}">${v}</button>`).join('');
  f.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    audio.tick();
    f.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b));
    document.querySelectorAll('.stack-group').forEach(g => { g.hidden = !(b.dataset.f === 'all' || g.dataset.g === b.dataset.f); });
  });
}

export function initContact() {
  $('mailBtn').addEventListener('click', e => copyText('moch.bismap@gmail.com', e.currentTarget, 'Salin email', $('mailText')));
}
