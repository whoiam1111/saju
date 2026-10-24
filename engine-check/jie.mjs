const fsf = await import('@fullstackfamily/manseryeok');
const ms = await import('manseryeok');
const jie = new Map();
for (let y = 1899; y <= 2051; y++) for (const t of ms.getSolarTermsOfYear(y)) {
  if (t.index % 2) continue; // 짝수 index = 節 (소한·입춘·경칩…), 월주가 바뀌는 절기
  const kst = new Date(t.date.getTime() + 9 * 3600e3);
  jie.set(kst.toISOString().slice(0, 10), `${t.name} ${kst.toISOString().slice(11, 16)} KST`);
}
let diff = 0, notJie = [], afterNoon = 0, beforeNoon = 0;
for (let t = Date.UTC(1900, 0, 1); t <= Date.UTC(2050, 11, 31); t += 864e5) {
  const d = new Date(t); const Y = d.getUTCFullYear(), M = d.getUTCMonth() + 1, D = d.getUTCDate();
  let f; try { f = fsf.getGapja(Y, M, D); } catch { continue; }
  const m = ms.calculateFourPillars({ year: Y, month: M, day: D, hour: 12, minute: 0 }).toObject();
  const ymd = d.toISOString().slice(0, 10);
  const j = jie.get(ymd);
  if (`${f.yearPillar}/${f.monthPillar}` !== `${m.year}/${m.month}`) { diff++; if (!j) notJie.push(ymd); else if (j.slice(-9) > '12:00') afterNoon++; else beforeNoon++; }
}
console.log({ diff, notJie: notJie.length, notJieSample: notJie.slice(0, 5), 절입이_정오이후: afterNoon, 절입이_정오이전: beforeNoon, 절입일총수: [...jie.keys()].filter((k) => k >= '1900' && k < '2051').length });
