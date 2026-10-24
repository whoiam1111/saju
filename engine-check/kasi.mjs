// 한국천문연구원(KASI) 음양력 변환 공식 서비스와 표본 비교 (요청 간 0.3초 간격)
import { createRequire } from 'module';
import fsx from 'fs';
const require = createRequire(import.meta.url);
const { Solar } = require('lunar-javascript');
const KLC = require('korean-lunar-calendar');
const ms = await import('manseryeok');
const pad = (n) => String(n).padStart(2, '0');
let seed = 20261024; const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
const dates = new Set();
const lo = Date.UTC(1900, 0, 1), hi = Date.UTC(2050, 11, 31);
while (dates.size < 140) dates.add(new Date(lo + Math.floor(rnd() * ((hi - lo) / 864e5)) * 864e5).toISOString().slice(0, 10));
// 한·중 음력이 갈리기 시작하는 날 (앞뒤 하루씩)
let prev = false, splits = [];
for (let t = lo; t <= hi; t += 864e5) {
  const d = new Date(t); const [Y, M, D] = [d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()];
  const c = ms.solarToLunar(Y, M, D); const l = Solar.fromYmdHms(Y, M, D, 11, 0, 0).getLunar();
  const diff = c.day !== l.getDay();
  if (diff && !prev) splits.push(t);
  prev = diff;
}
for (const t of splits.filter((_, i) => i % 3 === 0).slice(0, 40)) for (const dt of [-1, 0]) dates.add(new Date(t + dt * 864e5).toISOString().slice(0, 10));
for (const x of ['2050-02-21', '2050-02-22', '2050-03-22', '1956-12-31', '2020-05-23', '2023-03-22', '2017-06-24', '1984-02-04', '2024-02-10', '1900-07-07', '1900-07-08']) dates.add(x);
const list = [...dates].sort();
const H2K = Object.fromEntries([...'甲乙丙丁戊己庚辛壬癸子丑寅卯辰巳午未申酉戌亥'].map((c, i) => [c, '갑을병정무기경신임계자축인묘진사오미신유술해'[i]]));
const res = { checked: 0, msLunar: [], klcLunar: [], ljLunar: [], dayPillar: [], fail: [] };
const klc = new KLC();
for (const ymd of list) {
  const [Y, M, D] = ymd.split('-').map(Number);
  let k;
  try {
    const r = await fetch(`https://astro.kasi.re.kr/life/solc?yyyy=${Y}&mm=${pad(M)}&dd=${pad(D)}&type=solc`, { headers: { 'X-Requested-With': 'XMLHttpRequest' } });
    k = await r.json();
  } catch (e) { res.fail.push(`${ymd} ${e.message}`); continue; }
  await new Promise((r) => setTimeout(r, 300));
  res.checked++;
  const kasi = `${+k.LUNC_YYYY}-${+k.LUNC_MM}-${+k.LUNC_DD}${k.LUNC_LEAP_MM === '윤' ? '윤' : ''}`;
  const c = ms.solarToLunar(Y, M, D); const msv = `${c.year}-${c.month}-${c.day}${c.isLeapMonth ? '윤' : ''}`;
  if (msv !== kasi) res.msLunar.push(`${ymd} KASI=${kasi} manseryeok=${msv}`);
  if (klc.setSolarDate(Y, M, D)) { const a = klc.getLunarCalendar(); const v = `${a.year}-${a.month}-${a.day}${a.intercalation ? '윤' : ''}`; if (v !== kasi) res.klcLunar.push(`${ymd} KASI=${kasi} klc=${v}`); }
  const l = Solar.fromYmdHms(Y, M, D, 11, 0, 0).getLunar(); const lv = `${l.getYear()}-${Math.abs(l.getMonth())}-${l.getDay()}${l.getMonth() < 0 ? '윤' : ''}`;
  if (lv !== kasi) res.ljLunar.push(`${ymd} KASI=${kasi} lunar-js(중국)=${lv}`);
  const iljin = k.LUNC_ILJIN.slice(0, 2);
  const dp = ms.calculateFourPillars({ year: Y, month: M, day: D, hour: 12, minute: 0 }).toObject().day;
  if (dp !== iljin) res.dayPillar.push(`${ymd} KASI=${iljin} manseryeok=${dp}`);
}
fsx.writeFileSync('kasi-result.json', JSON.stringify({ dates: list, ...res }, null, 1));
const show = (n, a) => console.log(`${n}: ${a.length}건${a.length ? '\n  ' + a.slice(0, 12).join('\n  ') : ''}`);
console.log('KASI 대조 날짜', res.checked, '/', list.length);
show('manseryeok 음력 ≠ KASI', res.msLunar);
show('korean-lunar-calendar 음력 ≠ KASI', res.klcLunar);
show('lunar-javascript(중국 음력) ≠ KASI', res.ljLunar);
show('일진 ≠ KASI', res.dayPillar);
show('요청 실패', res.fail);
