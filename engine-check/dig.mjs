import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { Solar, ShouXingUtil, Lunar } = require('lunar-javascript');
const KLC = require('korean-lunar-calendar');
const fsf = await import('@fullstackfamily/manseryeok');
const ms = await import('manseryeok');
// 1) 2050 불일치 전체 범위
const klc = new KLC(); const out = [];
for (let t = Date.UTC(2049, 0, 1); t <= Date.UTC(2050, 11, 31); t += 864e5) {
  const d = new Date(t); const Y = d.getUTCFullYear(), M = d.getUTCMonth() + 1, D = d.getUTCDate();
  klc.setSolarDate(Y, M, D); const a = klc.getLunarCalendar(); const c = ms.solarToLunar(Y, M, D);
  if (a.day !== c.day || a.month !== c.month) out.push(`${Y}-${M}-${D}`);
}
console.log('2049~2050 klc≠ms:', out.length, out[0], '~', out.at(-1));
// 2) 2050-02 무렵 합삭(신월) 시각: lunar-javascript 천문 계산
for (const [y, m, d] of [[2050, 1, 23], [2050, 2, 20], [2050, 2, 21], [2050, 3, 23]]) {
  const l = Solar.fromYmd(y, m, d).getLunar();
  console.log(`${y}-${m}-${d} 중국음력 ${l.getYear()}-${l.getMonth()}-${l.getDay()}`);
}
const jd0 = Solar.fromYmd(2050, 2, 15).getJulianDay() - 2451545; // J2000 기준
const shuo = ShouXingUtil.shuoHigh ? ShouXingUtil.shuoHigh(Math.floor((jd0 + 8) / 29.5306) * 2 * Math.PI) : null;
console.log('shuoHigh fn?', typeof ShouXingUtil.shuoHigh, typeof ShouXingUtil.calcShuo);
// 3) fsf 차이가 모두 절입일인지
const jie = new Set();
for (let y = 1900; y <= 2050; y++) for (const t of ms.getSolarTermsOfYear(y)) {
  const kst = new Date(t.date.getTime() + 9 * 3600e3);
  jie.add(`${kst.getUTCFullYear()}-${kst.getUTCMonth() + 1}-${kst.getUTCDate()}|${t.index ?? t.name}`);
}
console.log('sample term', JSON.stringify(ms.getSolarTermsOfYear(2024)[2]));
