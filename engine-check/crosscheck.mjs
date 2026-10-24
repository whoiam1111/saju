// 1900-01-01 ~ 2050-12-31 매일: 음력 변환·일주·연주·월주를 네 라이브러리끼리 비교
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { Solar } = require('lunar-javascript');
const KLC = require('korean-lunar-calendar');
const fsf = await import('@fullstackfamily/manseryeok');
const ms = await import('manseryeok');

const H2K = Object.fromEntries([...'甲乙丙丁戊己庚辛壬癸子丑寅卯辰巳午未申酉戌亥'].map((c, i) => [c, '갑을병정무기경신임계자축인묘진사오미신유술해'[i]]));
const k = (s) => [...s].map((c) => H2K[c] ?? c).join('');
const stats = { days: 0, fsfErrors: [], lunarKoreanDisagree: [], lunarChinaDiff: [], dayPillar: [], ymNoon: [], ymFsfVsMs: [], roundtrip: [] };
const klc = new KLC();
const pad = (n) => String(n).padStart(2, '0');
for (let t = Date.UTC(1900, 0, 1); t <= Date.UTC(2050, 11, 31); t += 864e5) {
  const d = new Date(t); const Y = d.getUTCFullYear(), M = d.getUTCMonth() + 1, D = d.getUTCDate();
  const ymd = `${Y}-${pad(M)}-${pad(D)}`;
  stats.days++;
  // 음력: KASI 기반 3종
  klc.setSolarDate(Y, M, D);
  const a = klc.getLunarCalendar();
  let b, fsP;
  try { b = fsf.solarToLunar(Y, M, D).lunar; fsP = fsf.getGapja(Y, M, D); } catch (e) { stats.fsfErrors.push(`${ymd} ${e.message}`); b = { year: 0, month: 0, day: 0 }; fsP = null; }
  const c = ms.solarToLunar(Y, M, D);
  const key = (x, leap) => `${x.year}-${x.month}-${x.day}${leap ? '윤' : ''}`;
  const ka = key(a, a.intercalation), kb = key(b, b.isLeapMonth), kc = key(c, c.isLeapMonth);
  if (fsP && !(ka === kb && kb === kc)) stats.lunarKoreanDisagree.push(`${ymd} klc=${ka} fsf=${kb} ms=${kc}`);
  else if (!fsP && ka !== kc) stats.lunarKoreanDisagree.push(`${ymd} klc=${ka} fsf=${kb} ms=${kc}`);
  // 중국 음력 (lunar-javascript)
  const lj = Solar.fromYmdHms(Y, M, D, 11, 0, 0).getLunar(); // 11:00 베이징 = 12:00 KST
  const kj = `${lj.getYear()}-${Math.abs(lj.getMonth())}-${lj.getDay()}${lj.getMonth() < 0 ? '윤' : ''}`;
  if (kj !== kc) stats.lunarChinaDiff.push(`${ymd} 한국=${kc} 중국=${kj}`);
  // 일주 4종
  const ec = lj.getEightChar();
  const msP = ms.calculateFourPillars({ year: Y, month: M, day: D, hour: 12, minute: 0 }).toObject();
  const dp = [k(lj.getDayInGanZhi()), klc.getKoreanGapja().day.replace('일', ''), msP.day, ...(fsP ? [fsP.dayPillar] : [])];
  if (new Set(dp).size !== 1) stats.dayPillar.push(`${ymd} ${dp.join(' ')}`);
  // 연주·월주 (KST 정오 기준): lunar-javascript vs manseryeok
  const ljYM = `${k(ec.getYear())}/${k(ec.getMonth())}`, msYM = `${msP.year}/${msP.month}`;
  if (ljYM !== msYM) stats.ymNoon.push(`${ymd} lunar-js=${ljYM} manseryeok=${msYM}`);
  const fsYM = fsP && `${fsP.yearPillar}/${fsP.monthPillar}`;
  if (fsP && fsYM !== msYM) stats.ymFsfVsMs.push(`${ymd} fsf(날짜만)=${fsYM} manseryeok(정오)=${msYM}`);
  // 음력→양력 왕복 (manseryeok)
  const back = ms.lunarToSolar(c.year, c.month, c.day, c.isLeapMonth);
  if (`${back.year}-${back.month}-${back.day}` !== `${Y}-${M}-${D}`) stats.roundtrip.push(`${ymd} → ${kc} → ${back.year}-${back.month}-${back.day}`);
}
const show = (name, arr, n = 8) => console.log(`${name}: ${arr.length}건${arr.length ? '\n  ' + arr.slice(0, n).join('\n  ') + (arr.length > n ? '\n  …' : '') : ''}`);
console.log('검사 일수', stats.days);
show('fsf 오류(지원 범위 내 날짜)', stats.fsfErrors);
show('KASI 기반 3종 음력 불일치', stats.lunarKoreanDisagree);
show('한국 vs 중국 음력 차이', stats.lunarChinaDiff, 12);
show('일주 불일치(4종)', stats.dayPillar);
show('연·월주 불일치 lunar-js vs manseryeok (정오)', stats.ymNoon);
show('연·월주 fsf(날짜만) vs manseryeok(정오)', stats.ymFsfVsMs, 12);
show('음력→양력 왕복 실패', stats.roundtrip);
