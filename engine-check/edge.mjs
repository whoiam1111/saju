import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const KLC = require('korean-lunar-calendar');
const ms = await import('manseryeok');
const k = new KLC();
const tryMs = (f) => { try { return JSON.stringify(f()); } catch (e) { return `${e.name}: ${e.message}`; } };
console.log('2020 윤4월 1일   klc', k.setLunarDate(2020, 4, 1, true), JSON.stringify(k.getSolarCalendar()), ' ms', tryMs(() => ms.lunarToSolar(2020, 4, 1, true)));
console.log('2021 윤4월(없음)  klc', k.setLunarDate(2021, 4, 1, true), ' ms', tryMs(() => ms.lunarToSolar(2021, 4, 1, true)));
// 2024 음력 1월은 29일? 30일? 존재하지 않는 30일 입력
for (const [y, m] of [[2024, 1], [2024, 2]]) console.log(`${y} 음 ${m}월 30일  klc`, k.setLunarDate(y, m, 30, false), ' ms', tryMs(() => ms.lunarToSolar(y, m, 30, false)));
console.log('양력 2023-02-29  klc', k.setSolarDate(2023, 2, 29), ' ms', tryMs(() => ms.calculateFourPillars({ year: 2023, month: 2, day: 29, hour: 12, minute: 0 })));
// 출생 시간 없이 연·월주가 정해지지 않는 날(절입일) 비율: 그날 00:00 과 23:59 결과가 다른 날
let amb = 0, n = 0; const ex = [];
for (let t = Date.UTC(1940, 0, 1); t <= Date.UTC(2025, 11, 31); t += 864e5) {
  const d = new Date(t); const p = { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
  const a = ms.calculateFourPillars({ ...p, hour: 0, minute: 0 }).toObject(); const b = ms.calculateFourPillars({ ...p, hour: 23, minute: 59 }).toObject();
  n++; if (a.year + a.month !== b.year + b.month) { amb++; if (ex.length < 3) ex.push(`${d.toISOString().slice(0, 10)} ${a.year}/${a.month}→${b.year}/${b.month}`); }
}
console.log(`1940~2025 중 시간 없으면 연·월주 미확정인 날: ${amb}/${n} (${(amb / n * 100).toFixed(1)}%)`, ex);
