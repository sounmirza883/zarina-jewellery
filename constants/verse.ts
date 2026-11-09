/**
 * Sacred Verse Constant for Hero Section
 * 
 * DEVELOPER NOTICE:
 * Please verify the Arabic text and vowel markings (tashkeel) against Quran.com (Surah As-Sajdah 32:7)
 * before production launch to ensure 100% orthographic and typographical accuracy.
 * 
 * Strict Guideline:
 * This verse is presented respectfully as an Islamic reflection on modesty, beauty, and decorum.
 * Do not attach marketing claims or imply that the verse mandates financial expenditure or commerce.
 */

export interface QuranVerse {
  surahNameArabic: string;
  surahNameEnglish: string;
  referenceLabel: string;
  arabicText: string;
  urduText: string;
  englishMeaning?: string;
}

export const HERO_VERSE: QuranVerse = {
  surahNameArabic: "سورۃ السجدہ: 7",
  surahNameEnglish: "Surah As-Sajdah 32:7",
  referenceLabel: "Surah As-Sajdah 32:7 (سورۃ السجدہ: 7)",
  arabicText: "الَّذِي أَحْسَنَ كُلَّ شَيْءٍ خَلَقَهُ",
  urduText: "جس نے ہر چیز کو خوبصورت بنایا جو اس نے پیدا کی۔",
};
