// 엔진 선택 근거: engine-check/REPORT.md
import { calculateFourPillars } from 'manseryeok';
import KLC from 'korean-lunar-calendar';

const ELEMENT = { 갑: '목', 을: '목', 병: '화', 정: '화', 무: '토', 기: '토', 경: '금', 신: '금', 임: '수', 계: '수' };
const NEXT = { 목: '화', 화: '토', 토: '금', 금: '수', 수: '목' }; // 상생
const CONTROL = { 목: '토', 토: '수', 수: '화', 화: '금', 금: '목' }; // 상극
const DAY = 864e5;

// 시계 시각을 당시 표준시(1954–61 UTC+8:30)·서머타임만 보정. 진태양시(경도) 보정은 학파마다 달라 안 함
const CLOCK = { trueSolarTime: { longitude: 135, applyEquationOfTime: false, applyHistoricalDst: true } };
const at = (t, hour, minute, extra) => {
  const d = new Date(t);
  return calculateFourPillars({ year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate(), hour, minute, ...extra });
};

// 입력: { year, month, day, lunar?, leap?, gender: 'male'|'female', time?: 'HH:MM' } → 잘못된 입력은 Error
export function saju({ year, month, day, lunar = false, leap = false, gender, time = '' }) {
  [year, month, day] = [year, month, day].map(Number);
  if (gender !== 'male' && gender !== 'female') throw new Error('성별을 골라 주세요');
  const hm = time ? /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time) : null;
  if (time && !hm) throw new Error('태어난 시간 형식이 잘못됐어요');
  if (lunar) {
    if (year < 1900 || year > 2050) throw new Error('음력은 1900~2050년만 지원합니다');
    const k = new KLC();
    if (!k.setLunarDate(year, month, day, !!leap)) throw new Error('없는 음력 날짜입니다');
    ({ year, month, day } = k.getSolarCalendar());
  }
  const t = Date.UTC(year, month - 1, day);
  if (new Date(t).getUTCDate() !== day || new Date(t).getUTCMonth() !== month - 1) throw new Error('없는 양력 날짜입니다');
  const solar = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  if (hm) {
    const p = at(t, +hm[1], +hm[2], { gender, ...CLOCK });
    return { solar, year: p.yearString, month: p.monthString, day: p.dayString, hour: p.hourString, luck: p.luckPillars };
  }
  const noon = at(t, 12, 0, { gender });
  // 출생 시간이 없으므로 그날 앞뒤 1시간 여유(UTC+8:30·서머타임 시기 보정)까지 연·월주가 같아야 확정
  // shortcut: 모든 연도에 ±1시간을 적용해 경계 전후 날도 보수적으로 "확정 불가", 시간을 넣으면 해소됨
  const a = at(t - DAY, 23, 0), b = at(t + DAY, 0, 59);
  const fixed = a.yearString === b.yearString && a.monthString === b.monthString;
  return {
    solar,
    year: fixed ? noon.yearString : null,
    month: fixed ? noon.monthString : null,
    day: noon.dayString,
    hour: null,
    luck: fixed ? noon.luckPillars : null, // 대운은 연·월주에서 나오므로 확정될 때만
  };
}

// 만 나이 기준으로 지금 지나고 있는 대운 (아직 시작 전이면 null)
export function currentLuck(luck, solar, now = Date.now()) {
  const d = new Date(now + 9 * 3600e3), [y, m, dd] = solar.split('-').map(Number);
  const age = d.getUTCFullYear() - y - (d.getUTCMonth() + 1 < m || (d.getUTCMonth() + 1 === m && d.getUTCDate() < dd) ? 1 : 0);
  return { age, now: luck.pillars.findLast((p) => p.age <= age) ?? null, next: luck.pillars.find((p) => p.age > age) ?? null };
}

// 오늘(KST) 일진
export function todayPillar(now = Date.now()) {
  const d = new Date(now + 9 * 3600e3);
  return at(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()), 12, 0).dayString;
}

const PREV = Object.fromEntries(Object.entries(NEXT).map(([a, b]) => [b, a])); // 나를 생해 주는 오행

// 일간 오행 × 오늘 일진 천간 오행 (재미용 콘텐츠 규칙)
// lucky: 부딪히는 두 기운 사이를 잇는 오행(통관), 도움받는 날은 그 기운 그대로
export function relation(dayPillar, today) {
  const me = ELEMENT[dayPillar[0]], it = ELEMENT[today[0]];
  if (me === it) return { me, it, lucky: me, kind: '비화', text: '나와 같은 기운의 날. 평소 페이스를 지키면 좋아요.' };
  if (NEXT[it] === me) return { me, it, lucky: it, kind: '생을 받음', text: '도움을 받는 날. 부탁이나 협업이 잘 풀려요.' };
  if (NEXT[me] === it) return { me, it, lucky: PREV[me], kind: '생을 줌', text: '내 힘을 쓰는 날. 표현하고 베풀기 좋아요.' };
  if (CONTROL[me] === it) return { me, it, lucky: NEXT[me], kind: '내가 극함', text: '주도권을 잡는 날. 결정과 정리에 좋아요.' };
  return { me, it, lucky: NEXT[it], kind: '극을 받음', text: '압박이 있는 날. 무리하지 말고 쉬어 가요.' };
}
