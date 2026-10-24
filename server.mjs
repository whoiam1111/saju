import http from 'http';
import { readFileSync } from 'fs';
import { saju, todayPillar, relation } from './engine.mjs';

const PORT = process.env.PORT || 3000;
const LOGO = readFileSync(new URL('./assets/wave-on.png', import.meta.url));
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const TITLE = { '생을 받음': '도움 받는 날', 비화: '나랑 닮은 날', '내가 극함': '내가 이끄는 날', '생을 줌': '힘을 나눠 주는 날', '극을 받음': '쉬어 가는 날' };
const KO = { 목: '나무', 화: '불', 토: '흙', 금: '쇠', 수: '물' };
const josa = (w, a, b) => w + ((w.charCodeAt(w.length - 1) - 0xac00) % 28 ? a : b); // 받침 있으면 a
const RANK = { '생을 받음': 1, 비화: 2, '내가 극함': 3, '생을 줌': 4, '극을 받음': 5 };
const EL = { 목: ['🌳', '초록', '#3cb371'], 화: ['🔥', '빨강', '#ff5a5f'], 토: ['🌻', '노랑', '#f5b800'], 금: ['💎', '하양', '#9aa5b1'], 수: ['💧', '파랑', '#3b82f6'] };

const ME = {
  목: '쭉쭉 자라는 나무 같은 사람. 새로 시작하는 걸 좋아하고 마음이 곧아요.',
  화: '활활 타는 불 같은 사람. 밝고 솔직하며 분위기를 띄워요.',
  토: '든든한 땅 같은 사람. 믿음직하고 사람들을 품어 줘요.',
  금: '단단한 쇠 같은 사람. 맺고 끊는 게 분명하고 의리가 있어요.',
  수: '흐르는 물 같은 사람. 생각이 깊고 어디든 잘 적응해요.',
};
const WHY = {
  비화: (me, it) => `오늘은 나와 같은 ${it} 기운이 들어오는 날이라 마음이 편안해요.`,
  '생을 받음': (me, it) => `오늘의 ${josa(it, '이', '가')} 나(${me})를 키워 줘요. 기운을 가득 채워 받는 날이에요.`,
  '생을 줌': (me, it) => `나(${me})가 오늘의 ${josa(it, '을', '를')} 키워 줘요. 내 힘을 나눠 쓰는 날이라 조금 피곤할 수 있어요.`,
  '내가 극함': (me, it) => `나(${me})가 오늘의 ${it}보다 힘이 세요. 일을 내 뜻대로 끌고 가기 좋아요.`,
  '극을 받음': (me, it) => `오늘의 ${josa(it, '이', '가')} 나(${me})보다 힘이 세요. 무리하지 말고 한발 물러서는 게 좋아요.`,
};
const GUIDE = `<details class="guide"><summary>🤔 이게 다 무슨 뜻이야?</summary>
<p><b>사주</b>는 태어난 날을 한자 두 글자씩 짝지어 나타낸 거예요. 연주(태어난 해), 월주(달), 일주(날)가 있어요. 태어난 시간까지 넣으면 시주가 붙지만 여기서는 쓰지 않아요.</p>
<p><b>일주</b>의 첫 글자가 '나 자신'을 나타내요. 이 글자가 <b>오행</b>(나무·불·흙·쇠·물) 가운데 하나에 속하는데, 그게 내 기본 기운이에요.</p>
<p><b>오늘 일진</b>은 오늘 날짜를 같은 방식으로 나타낸 거예요. 오늘의 기운과 내 기운이 서로 맞는지로 순위를 매겨요.</p>
<p>🌳→🔥→🌻→💎→💧→🌳 순서로 앞의 것이 뒤의 것을 <b>키워 줘요</b> (나무는 불을 피우고, 불은 재가 되어 흙이 돼요).<br>
🌳→🌻→💧→🔥→💎→🌳 순서로 앞의 것이 뒤의 것을 <b>눌러요</b> (나무는 흙을 파고들고, 흙은 물을 막아요).</p>
<p><b>확정 불가</b>는 절기(계절이 바뀌는 날)에 태어났다는 뜻이에요. 태어난 시간에 따라 해와 달 글자가 달라져서 정하지 않았어요. 오늘 운세는 일주만 쓰기 때문에 결과에는 영향이 없어요.</p>
</details>`;

const chip =(label, v) => `<div class="chip"><small>${label}</small><b>${v ?? '?'}</b>${v ? '' : '<em>확정 불가</em>'}</div>`;

function result(q) {
  if (!q.has('date')) return '';
  try {
    const [year, month, day] = q.get('date').split('-');
    const r = saju({ year, month, day, lunar: q.get('cal') === 'lunar', leap: q.has('leap') });
    const today = todayPillar(), rel = relation(r.day, today), rank = RANK[rel.kind];
    const [meIcon] = EL[rel.me], [itIcon] = EL[rel.it], [luckyIcon, lucky, luckyHex] = EL[rel.lucky];
    return `<section class="card result r${rank}">
  <div class="badge"><span>${rank}</span>위</div>
  <h2>${TITLE[rel.kind]}</h2>
  <p class="msg">${esc(rel.text)}</p>
  <div class="vs"><span>${meIcon}<small>나 · ${KO[rel.me]}</small></span><i>×</i><span>${itIcon}<small>오늘 · ${KO[rel.it]}</small></span></div>
  <div class="explain">
    <p><b>📖 나는 어떤 사람?</b><br>일주 '${r.day}'의 첫 글자 '${r.day[0]}'은(는) ${meIcon} ${KO[rel.me]}(${rel.me}) 기운이에요. ${ME[rel.me]}</p>
    <p><b>📅 오늘은 왜 ${rank}위?</b><br>오늘 일진 '${today}'의 첫 글자 '${today[0]}'은(는) ${itIcon} ${KO[rel.it]}(${rel.it}) 기운이에요. ${WHY[rel.kind](KO[rel.me], KO[rel.it])}</p>
  </div>
  <div class="chips">${chip('연주', r.year)}${chip('월주', r.month)}${chip('일주', r.day)}${chip('오늘 일진', today)}</div>
  ${GUIDE}
  <p class="lucky">🍀 행운의 색 <b style="background:${luckyHex}">${lucky}</b></p>
  <p class="note">${luckyIcon} ${KO[rel.lucky]} 기운이 나와 오늘 사이를 이어 줘요</p>
  <p class="note">양력 ${r.solar} 기준 · 재미로 보는 운세예요</p>
</section>`;
  } catch (e) {
    return `<section class="card error" role="alert">😵 ${esc(e.message)}</section>`;
  }
}

function render(q) {
  const lunar = q.get('cal') === 'lunar';
  return `<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>오늘의 사주 운세</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Jua&display=swap">
<style>
:root{--ink:#3a2e5c;--pink:#ff7eb6;--yellow:#ffe066;--sky:#7ed6ff}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;font-family:Jua,system-ui,sans-serif;color:var(--ink);
  background:radial-gradient(circle at 20% 10%,#fff6 0 8%,transparent 9%),radial-gradient(circle at 85% 25%,#fff5 0 5%,transparent 6%),
  linear-gradient(160deg,#fff3a8 0%,#ffc2dd 45%,#a8e4ff 100%) fixed}
main{max-width:460px;margin:0 auto;padding:28px 16px 48px}
.brand{display:flex;justify-content:center;margin:0 0 18px}
.brand img{height:22px;width:auto;padding:9px 18px;box-sizing:content-box;background:var(--ink);border-radius:999px;box-shadow:3px 3px 0 var(--pink)}
h1{text-align:center;font-size:2.4rem;margin:0 0 4px;letter-spacing:1px;
  color:#fff;-webkit-text-stroke:2px var(--ink);paint-order:stroke;text-shadow:4px 4px 0 var(--pink)}
.sub{text-align:center;margin:0 0 20px;font-size:1.05rem}
.card{background:#fff;border:3px solid var(--ink);border-radius:28px;padding:22px;box-shadow:6px 6px 0 var(--ink);margin-bottom:22px}
label{font-size:1.1rem}
input[type=date]{width:100%;margin-top:6px;padding:12px 14px;font:inherit;font-size:1.1rem;color:inherit;border:3px solid var(--ink);border-radius:16px;background:#fffbe6}
.seg{display:flex;gap:8px;margin:14px 0}
.seg label{flex:1;text-align:center;padding:10px 0;border:3px solid var(--ink);border-radius:999px;cursor:pointer;background:#fff}
.seg input{position:absolute;opacity:0}
.seg label:has(input:checked){background:var(--yellow)}
.seg label:has(input:focus-visible){outline:3px solid var(--sky);outline-offset:2px}
button{width:100%;padding:14px;font:inherit;font-size:1.3rem;color:#fff;background:var(--pink);border:3px solid var(--ink);border-radius:999px;box-shadow:0 5px 0 var(--ink);cursor:pointer}
button:active{transform:translateY(4px);box-shadow:0 1px 0 var(--ink)}
.result{text-align:center;position:relative;animation:pop .5s cubic-bezier(.2,1.6,.4,1)}
@keyframes pop{from{transform:scale(.6);opacity:0}}
@media (prefers-reduced-motion:reduce){.result{animation:none}}
.badge{width:110px;height:110px;margin:-70px auto 8px;border-radius:50%;border:3px solid var(--ink);display:flex;align-items:center;justify-content:center;font-size:1.3rem;background:var(--bg);box-shadow:4px 4px 0 var(--ink)}
.badge span{font-size:3.4rem;line-height:1;margin-right:2px}
.r1{--bg:linear-gradient(135deg,#ffd700,#ffef8a)}.r2{--bg:linear-gradient(135deg,#e3e8ef,#fff)}.r3{--bg:linear-gradient(135deg,#f0a868,#ffd9b3)}
.r4{--bg:#c9f0ff}.r5{--bg:#e6dcff}
.r1 .badge::after{content:"👑";position:absolute;top:-58px;font-size:2rem}
h2{margin:6px 0;font-size:1.9rem}
.msg{font-size:1.15rem;line-height:1.5;margin:0 0 16px}
.vs{display:flex;align-items:center;justify-content:center;gap:14px;font-size:2.4rem;margin-bottom:16px}
.vs span{display:flex;flex-direction:column;align-items:center}
.vs small{font-size:.95rem}
.vs i{font-style:normal;font-size:1.6rem;color:var(--pink)}
.chips{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}
.chip{background:#fffbe6;border:2px dashed var(--ink);border-radius:16px;padding:10px 6px;display:flex;flex-direction:column}
.chip b{font-size:1.5rem}
.chip em{font-style:normal;font-size:.8rem;color:#8a7fa8}
.lucky{margin:18px 0 6px;font-size:1.15rem}
.lucky b{color:#fff;padding:3px 12px;border-radius:999px;border:2px solid var(--ink);-webkit-text-stroke:.5px var(--ink)}
.note{font-size:.85rem;color:#6b6189;margin:8px 0 0}
.explain{text-align:left;background:#fff5fa;border-radius:18px;padding:4px 16px;margin-bottom:16px;line-height:1.6}
.guide{text-align:left;margin-top:16px;background:#eef9ff;border-radius:18px;padding:12px 16px;line-height:1.6}
.guide summary{cursor:pointer;font-size:1.1rem}
.error{background:#ffe3e3;text-align:center;font-size:1.15rem}
</style>
<main>
<header class="brand"><img src="/logo.png" alt="WAVE ON" width="578" height="106"></header>
<h1>✨ 오늘의 운세 ✨</h1>
<p class="sub">생일만 넣으면 오늘 나의 순위를 알려줘요!</p>
${result(q)}
<form class="card">
  <label>🎂 생일<input name="date" type="date" required min="1900-01-01" max="2050-12-31" value="${esc(q.get('date') ?? '')}"></label>
  <div class="seg" role="radiogroup" aria-label="달력">
    <label><input type="radio" name="cal" value="solar" ${lunar ? '' : 'checked'}>☀️ 양력</label>
    <label><input type="radio" name="cal" value="lunar" ${lunar ? 'checked' : ''}>🌙 음력</label>
    <label><input type="checkbox" name="leap" ${q.has('leap') ? 'checked' : ''}>윤달</label>
  </div>
  <button>운세 보기 🔮</button>
</form>
</main></html>`;
}

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/logo.png') return res.writeHead(200, { 'content-type': 'image/png', 'cache-control': 'max-age=86400' }).end(LOGO);
  if (url.pathname !== '/') return res.writeHead(404).end();
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }).end(render(url.searchParams));
}).listen(PORT, () => console.log(`http://localhost:${PORT}`));
