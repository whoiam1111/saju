import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { Solar } = require('lunar-javascript');
const KLC = require('korean-lunar-calendar');
const fs = await import('@fullstackfamily/manseryeok');
const ms = await import('manseryeok');
const s = Solar.fromYmdHms(2024, 2, 4, 12, 0, 0);
const l = s.getLunar(); const ec = l.getEightChar();
console.log('lunar-js', l.getYear(), l.getMonth(), l.getDay(), ec.getYear(), ec.getMonth(), ec.getDay(), l.getDayInGanZhi());
const k = new KLC(); k.setSolarDate(2024, 2, 4); console.log('klc', k.getLunarCalendar(), k.getKoreanGapja());
console.log('fsf', JSON.stringify(fs.solarToLunar(2024, 2, 4)));
console.log('fsf getGapja', JSON.stringify(fs.getGapja(2024, 2, 4)));
console.log('ms', ms.solarToLunar(2024, 2, 4), calc());
function calc(){ const r = ms.calculateFourPillars({year:2024,month:2,day:4,hour:12,minute:0}); return r.toObject(); }
console.log('ms keys', Object.keys(ms).join(','));
console.log('fs keys', Object.keys(fs).join(','));
