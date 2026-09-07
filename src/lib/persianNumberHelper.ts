// Persian number and currency formatting helper

const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
const englishDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

export function toPersianDigits(num: string | number | undefined | null): string {
  if (num === undefined || num === null || num === '') return '';
  return String(num).replace(/[0-9]/g, (w) => persianDigits[parseInt(w, 10)]);
}

export function toEnglishDigits(str: string | number | undefined | null): string {
  if (!str) return '';
  return String(str)
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[^0-9]/g, '');
}

/**
 * Formats a raw number string with 3-digit separator
 * e.g. "1500000" -> "1,500,000"
 */
export function formatDigitSeparators(val: string | number | undefined | null, separator: ',' | '.' | '/' = ','): string {
  if (!val) return '';
  const clean = toEnglishDigits(val);
  if (!clean) return '';
  const num = BigInt(clean);
  const formatted = num.toLocaleString('en-US');
  if (separator === ',') return formatted;
  return formatted.replace(/,/g, separator);
}

/**
 * Formats raw number with 3-digit separator in Persian digits
 * e.g. "1500000" -> "۱,۵۰۰,۰۰۰"
 */
export function formatPersianDigitSeparators(val: string | number | undefined | null, separator: ',' | '.' | '/' | '،' = '،'): string {
  if (!val) return '';
  const clean = toEnglishDigits(val);
  if (!clean) return '';
  const num = BigInt(clean);
  const formattedEn = num.toLocaleString('en-US');
  const persian = formattedEn.replace(/[0-9]/g, (w) => persianDigits[parseInt(w, 10)]);
  if (separator === '،' || separator === ',') return persian.replace(/,/g, '،');
  return persian.replace(/,/g, separator);
}

/**
 * Convert numbers up to trillions into Persian words
 */
const ones = ['', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه'];
const teens = ['ده', 'یازده', 'دوازده', 'سیزده', 'چهارده', 'پانزده', 'شانزده', 'هفده', 'هجده', 'نوزده'];
const tens = ['', '', 'بیست', 'سی', 'چهل', 'پنجاه', 'شصت', 'هفتاد', 'هشتاد', 'نود'];
const hundreds = ['', 'یکصد', 'دویست', 'سیصد', 'چهارصد', 'پانصد', 'ششصد', 'هفتصد', 'هشتصد', 'نهصد'];
const thousands = ['', 'هزار', 'میلیون', 'میلیارد', 'تریلیون'];

function convertThreeDigitsToWords(num: number): string {
  if (num === 0) return '';
  const h = Math.floor(num / 100);
  const t = Math.floor((num % 100) / 10);
  const o = num % 10;
  const parts: string[] = [];

  if (h > 0) parts.push(hundreds[h]);

  if (t === 1) {
    parts.push(teens[o]);
  } else {
    if (t > 1) parts.push(tens[t]);
    if (o > 0) parts.push(ones[o]);
  }

  return parts.join(' و ');
}

export function numberToPersianWords(numInput: string | number | undefined | null): string {
  const clean = toEnglishDigits(numInput);
  if (!clean) return '';
  if (clean === '0') return 'صفر';

  const chunks: number[] = [];
  let temp = clean;
  while (temp.length > 0) {
    const chunk = temp.slice(-3);
    chunks.push(parseInt(chunk, 10));
    temp = temp.slice(0, -3);
  }

  const wordParts: string[] = [];
  for (let i = chunks.length - 1; i >= 0; i--) {
    const chunkNum = chunks[i];
    if (chunkNum > 0) {
      const chunkWords = convertThreeDigitsToWords(chunkNum);
      const scale = thousands[i];
      if (scale) {
        wordParts.push(`${chunkWords} ${scale}`);
      } else {
        wordParts.push(chunkWords);
      }
    }
  }

  return wordParts.join(' و ');
}

/**
 * Converts Rial amount to Toman and returns words description
 */
export function formatRialToWords(rialAmount: string | number | undefined | null): {
  rialFormatted: string;
  tomanFormatted: string;
  rialWords: string;
  tomanWords: string;
  tomanNum: number;
} {
  const clean = toEnglishDigits(rialAmount);
  if (!clean || clean === '0') {
    return {
      rialFormatted: '۰',
      tomanFormatted: '۰',
      rialWords: 'صفر ریال',
      tomanWords: 'صفر تومان',
      tomanNum: 0
    };
  }

  const rialBig = BigInt(clean);
  const tomanBig = rialBig / 10n;
  const tomanRemainder = rialBig % 10n;

  const rialFormatted = formatPersianDigitSeparators(clean, '،');
  const tomanFormatted = formatPersianDigitSeparators(tomanBig.toString(), '،') + (tomanRemainder > 0n ? `.${tomanRemainder}` : '');

  const rialWords = numberToPersianWords(clean) + ' ریال';
  const tomanWords = numberToPersianWords(tomanBig.toString()) + (tomanRemainder > 0n ? ` و ${tomanRemainder} ریال` : ' تومان');

  return {
    rialFormatted,
    tomanFormatted,
    rialWords,
    tomanWords,
    tomanNum: Number(tomanBig)
  };
}
