// 엔진 선택 근거: engine-check/REPORT.md
import { createRequire } from 'module';
import { calculateFourPillars } from 'manseryeok';
const KLC = createRequire(import.meta.url)('korean-lunar-calendar');

const ELEMENT = { 갑: '목', 을: '목', 병: '화', 정: '화', 무: '토', 기: '토', 경: '금', 신: '금', 임: '수', 계: '수' };
const NEXT = { 목: '화', 화: '토', 토: '금', 금: '수', 수: '목' }; // 상생
const CONTROL = { 목: '토', 토: '수', 수: '화', 화: '금', 금: '목' }; // 상극
const DAY = 864e5;

const at = (t, hour, minute) => {
  const d = new Date(t);
  return calculateFourPillars({ year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate(), hour, minute });
};

// 입력: { year, month, day, lunar?: boolean, leap?: boolean } → 잘못된 날짜는 Error
export function saju({ year, month, day, lunar = false, leap = false }) {
  [year, month, day] = [year, month, day].map(Number);
  if (lunar) {
    if (year < 1900 || year > 2050) throw new Error('음력은 1900~2050년만 지원합니다');
    const k = new KLC();
    if (!k.setLunarDate(year, month, day, !!leap)) throw new Error('없는 음력 날짜입니다');
    ({ year, month, day } = k.getSolarCalendar());
  }
  const t = Date.UTC(year, month - 1, day);
  if (new Date(t).getUTCDate() !== day || new Date(t).getUTCMonth() !== month - 1) throw new Error('없는 양력 날짜입니다');
  const noon = at(t, 12, 0);
  // 출생 시간이 없으므로 그날 앞뒤 1시간 여유(UTC+8:30·서머타임 시기 보정)까지 연·월주가 같아야 확정
  // shortcut: 모든 연도에 ±1시간을 적용해 경계 전후 날도 보수적으로 "확정 불가", 시간 입력을 받게 되면 제거
  const a = at(t - DAY, 23, 0), b = at(t + DAY, 0, 59);
  const fixed = a.yearString === b.yearString && a.monthString === b.monthString;
  return {
    solar: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    year: fixed ? noon.yearString : null,
    month: fixed ? noon.monthString : null,
    day: noon.dayString,
  };
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
