import test from 'node:test';
import assert from 'node:assert/strict';
import { saju, todayPillar, relation } from './engine.mjs';

test('양력 일반일', () => {
  assert.deepEqual(saju({ year: 1990, month: 5, day: 15 }), { solar: '1990-05-15', year: '경오', month: '신사', day: '경진' });
});

test('입춘 당일은 연·월주 확정 불가', () => {
  const r = saju({ year: 2024, month: 2, day: 4 });
  assert.equal(r.year, null);
  assert.equal(r.day, '무술');
});

test('음력·윤달 변환', () => {
  assert.equal(saju({ year: 2020, month: 4, day: 1, lunar: true, leap: true }).solar, '2020-05-23');
  assert.throws(() => saju({ year: 2021, month: 4, day: 1, lunar: true, leap: true }));
  assert.throws(() => saju({ year: 2024, month: 1, day: 30, lunar: true }));
});

test('없는 양력 날짜 거부', () => {
  assert.throws(() => saju({ year: 2023, month: 2, day: 29 }));
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
