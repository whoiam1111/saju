import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { Solar } = require('lunar-javascript');
const fsf = await import('@fullstackfamily/manseryeok');
const ms = await import('manseryeok');
// lunar-javascript 절기 시각(베이징) → KST
function ljTerms(y) {
  const out = {};
  const tbl = Solar.fromYmd(y, 6, 1).getLunar().getJieQiTable();
  for (const [name, s] of Object.entries(tbl)) {
    const kst = Solar.fromJulianDay(s.getJulianDay() + 1 / 24);
    out[name] = kst.toYmdHms();
  }
  return out;
}
const t1900 = ljTerms(1900);
console.log('lunar-js 1900 小暑', t1900['小暑'], ' 寒露', t1900['寒露']);
const msT = ms.getSolarTermsOfYear(1900).filter((t) => ['소서', '한로'].includes(t.name)).map((t) => `${t.name} ${new Date(t.date.getTime() + 9 * 3600e3).toISOString().slice(0, 16)}`);
console.log('manseryeok 1900', msT);
// 최근 연도 샘플: 2024 전체 절기 3종 비교
const lj = ljTerms(2024);
const H = { 小寒: '소한', 立春: '입춘', 惊蛰: '경칩', 清明: '청명', 立夏: '입하', 芒种: '망종', 小暑: '소서', 立秋: '입추', 白露: '백로', 寒露: '한로', 立冬: '입동', 大雪: '대설' };
for (const t of ms.getSolarTermsOfYear(2024).filter((t) => t.index % 2 === 0)) {
  const cn = Object.keys(H).find((k) => H[k] === t.name);
  console.log(t.name, 'ms', new Date(t.date.getTime() + 9 * 3600e3).toISOString().slice(0, 16).replace('T', ' '), 'lj', lj[cn]?.slice(0, 16));
}
