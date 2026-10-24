import test from 'node:test';
import assert from 'node:assert/strict';
import { saju, todayPillar, relation, currentLuck } from './engine.mjs';

const F = { gender: 'female' };

test('양력 일반일', () => {
  const r = saju({ year: 1990, month: 5, day: 15, ...F });
  assert.deepEqual([r.solar, r.year, r.month, r.day, r.hour], ['1990-05-15', '경오', '신사', '경진', null]);
});

test('입춘 당일은 연·월주 확정 불가', () => {
  const r = saju({ year: 2024, month: 2, day: 4, ...F });
  assert.equal(r.year, null);
  assert.equal(r.day, '무술');
});

test('음력·윤달 변환', () => {
  assert.equal(saju({ year: 2020, month: 4, day: 1, lunar: true, leap: true, ...F }).solar, '2020-05-23');
  assert.throws(() => saju({ year: 2021, month: 4, day: 1, lunar: true, leap: true, ...F }));
  assert.throws(() => saju({ year: 2024, month: 1, day: 30, lunar: true, ...F }));
});

test('없는 양력 날짜 거부', () => {
  assert.throws(() => saju({ year: 2023, month: 2, day: 29, ...F }));
});

test('오늘 일진은 KST 기준', () => {
  assert.equal(todayPillar(Date.UTC(2024, 1, 3, 15, 30)), '무술'); // KST 2024-02-04 00:30
});

test('오행 관계', () => {
  assert.equal(relation('갑자', '을축').kind, '비화');
  assert.equal(relation('갑자', '임신').kind, '생을 받음');
  assert.equal(relation('갑자', '병인').kind, '생을 줌');
  assert.equal(relation('갑자', '무진').kind, '내가 극함');
  assert.equal(relation('갑자', '경오').kind, '극을 받음');
});

test('행운의 오행은 관계마다 다름', () => {
  // 나=목: 비화→목, 수가 생해 줌→수, 화를 생해 줌→수, 토를 극함→화, 금에게 극받음→수(금생수, 수생목)
  assert.deepEqual(['을축', '임신', '병인', '무진', '경오'].map((t) => relation('갑자', t).lucky), ['목', '수', '수', '화', '수']);
  // 같은 날이라도 사람마다 다름
  assert.notEqual(relation('갑자', '경오').lucky, relation('병자', '경오').lucky);
});

test('성별은 필수, 시간 형식 검사', () => {
  assert.throws(() => saju({ year: 1990, month: 5, day: 15 }), /성별/);
  assert.throws(() => saju({ year: 1990, month: 5, day: 15, ...F, time: '25:00' }), /시간/);
});

test('태어난 시간을 넣으면 시주가 생기고 절입일도 확정', () => {
  const before = saju({ year: 2024, month: 2, day: 4, ...F, time: '17:00' }); // 입춘 17:27 전
  const after = saju({ year: 2024, month: 2, day: 4, ...F, time: '18:00' });
  assert.deepEqual([before.year, after.year], ['계묘', '갑진']);
  assert.ok(before.hour && before.luck);
});

test('서머타임 시기 시각은 표준시로 보정', () => {
  // 1987-07-01 00:30 서머타임 = 1987-06-30 23:30 KST → 전날 일주
  assert.equal(saju({ year: 1987, month: 7, day: 1, ...F, time: '00:30' }).day, saju({ year: 1987, month: 6, day: 30, ...F }).day);
});

test('성별에 따라 대운 방향이 반대', () => {
  const m = saju({ year: 1990, month: 5, day: 15, gender: 'male' }).luck, f = saju({ year: 1990, month: 5, day: 15, ...F }).luck;
  assert.equal(m.forward, !f.forward);
  assert.equal(saju({ year: 2024, month: 2, day: 4, ...F }).luck, null); // 시간 없는 절입일은 대운도 미정
});

test('지금 대운은 만 나이 기준', () => {
  const luck = { pillars: [{ age: 7, korean: '임오' }, { age: 17, korean: '계미' }] };
  const now = Date.UTC(2007, 4, 14, 3); // KST 2007-05-14, 생일 하루 전 → 만 16
  assert.deepEqual(currentLuck(luck, '1990-05-15', now), { age: 16, now: luck.pillars[0], next: luck.pillars[1] });
  assert.equal(currentLuck(luck, '2020-01-01', Date.UTC(2024, 0, 1)).now, null);
});
