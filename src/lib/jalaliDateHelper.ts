/**
 * Persian (Jalali / Shamsi) Calendar helper utility
 * Provides accurate Gregorian-Jalali conversions, date formatting,
 * and calendar grid metadata.
 */

import { toPersianDigits, toEnglishDigits } from './persianNumberHelper';

export const PERSIAN_MONTH_NAMES = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند'
] as const;

export const PERSIAN_WEEK_DAYS = [
  { short: 'ش', full: 'شنبه', index: 0 },
  { short: 'ی', full: 'یکشنبه', index: 1 },
  { short: 'د', full: 'دوشنبه', index: 2 },
  { short: 'س', full: 'سه‌شنبه', index: 3 },
  { short: 'چ', full: 'چهارشنبه', index: 4 },
  { short: 'پ', full: 'پنج‌شنبه', index: 5 },
  { short: 'ج', full: 'جمعه', index: 6 }
] as const;

/**
 * Checks if a Jalali year is a leap year (کبیسه)
 */
export function isJalaliLeapYear(jy: number): boolean {
  const breaks = [
    -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210,
    1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178
  ];
  let jp = breaks[0];
  let jump = 0;
  if (jy < jp || jy >= breaks[breaks.length - 1]) return false;

  for (let i = 1; i < breaks.length; i++) {
    const jm = breaks[i];
    jump = jm - jp;
    if (jy < jm) break;
    jp = jm;
  }
  let n = jy - jp;
  if (jump - n < 6) n = n - jump + ((jump + 4) / 33) * 33;
  let leap = ((((n + 1) % 33) - 1) % 4);
  if (leap === -1) leap = 4;
  return leap === 0;
}

/**
 * Returns number of days in a given Jalali month (1-12)
 */
export function getDaysInJalaliMonth(year: number, month: number): number {
  if (month < 1 || month > 12) return 30;
  if (month <= 6) return 31;
  if (month <= 11) return 30;
  return isJalaliLeapYear(year) ? 30 : 29;
}

/**
 * Converts Gregorian date to Jalali (Shamsi) date
 */
export function gregorianToJalali(gy: number, gm: number, gd: number): [number, number, number] {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let gy2 = gm > 2 ? gy + 1 : gy;
  let days = 355666 + (365 * gy) + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) + gd + g_d_m[gm - 1];
  let jy = -1595 + (33 * Math.floor(days / 12053));
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  let jm: number;
  let jd: number;
  if (days < 186) {
    jm = 1 + Math.floor(days / 31);
    jd = 1 + (days % 31);
  } else {
    jm = 7 + Math.floor((days - 186) / 30);
    jd = 1 + ((days - 186) % 30);
  }
  return [jy, jm, jd];
}

/**
 * Converts Jalali date to Gregorian
 */
export function jalaliToGregorian(jy: number, jm: number, jd: number): [number, number, number] {
  jy += 1595;
  let days = -355668 + (365 * jy) + (Math.floor(jy / 33) * 8) + Math.floor(((jy % 33) + 3) / 4) + jd + ((jm < 7) ? (jm - 1) * 31 : ((jm - 7) * 30) + 186);
  let gy = 400 * Math.floor(days / 146097);
  days %= 146097;
  if (days > 36524) {
    gy += 100 * Math.floor(--days / 36524);
    days %= 36524;
    if (days >= 365) days++;
  }
  gy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    gy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  const gd_m = [0, 31, ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm = 0;
  while (gm < 13 && days > gd_m[gm]) {
    days -= gd_m[gm];
    gm++;
  }
  return [gy, gm, days];
}

/**
 * Gets day of week for a Jalali date (0 = شنبه, 1 = یکشنبه, ..., 6 = جمعه)
 */
export function getJalaliDayOfWeek(jy: number, jm: number, jd: number): number {
  const [gy, gm, gd] = jalaliToGregorian(jy, jm, jd);
  const date = new Date(gy, gm - 1, gd);
  const gDay = date.getDay(); // 0 = Sunday, 1 = Monday, ... 6 = Saturday
  // Convert to Saturday-first index (0 for شنبه)
  return (gDay + 1) % 7;
}

/**
 * Returns today's Jalali date object
 */
export function getTodayJalali(): {
  year: number;
  month: number;
  day: number;
  formatted: string;
  persianFormatted: string;
  monthName: string;
} {
  const now = new Date();
  const [year, month, day] = gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
  const pad = (n: number) => String(n).padStart(2, '0');
  const formatted = `${year}/${pad(month)}/${pad(day)}`;
  const persianFormatted = toPersianDigits(formatted);
  const monthName = PERSIAN_MONTH_NAMES[month - 1] || '';

  return {
    year,
    month,
    day,
    formatted,
    persianFormatted,
    monthName
  };
}

/**
 * Returns yesterday's Jalali date object
 */
export function getYesterdayJalali(): {
  year: number;
  month: number;
  day: number;
  formatted: string;
  persianFormatted: string;
} {
  const now = new Date();
  now.setDate(now.getDate() - 1);
  const [year, month, day] = gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
  const pad = (n: number) => String(n).padStart(2, '0');
  const formatted = `${year}/${pad(month)}/${pad(day)}`;
  return {
    year,
    month,
    day,
    formatted,
    persianFormatted: toPersianDigits(formatted)
  };
}

/**
 * Formats a raw Jalali string like "1403/8/5" or "1403/08/05" into clean "۱۴۰۳/۰۸/۰۵"
 */
export function normalizeJalaliDate(val: string | undefined | null): string {
  if (!val) return '';
  const clean = toEnglishDigits(val).replace(/[^\d/]/g, '');
  const parts = clean.split('/');
  if (parts.length === 3) {
    const y = parts[0];
    const m = parts[1].padStart(2, '0');
    const d = parts[2].padStart(2, '0');
    return toPersianDigits(`${y}/${m}/${d}`);
  }
  return toPersianDigits(val);
}

/**
 * Parse a Jalali string "1403/08/15" into numeric components
 */
export function parseJalaliDate(val: string | undefined | null): { year: number; month: number; day: number } | null {
  if (!val) return null;
  const clean = toEnglishDigits(val).replace(/[^\d/]/g, '');
  const parts = clean.split('/');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    if (!isNaN(year) && !isNaN(month) && !isNaN(day) && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return { year, month, day };
    }
  }
  return null;
}
