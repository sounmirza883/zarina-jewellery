/**
 * Sacred Verse Constant for Hero Section
 * 
 * DEVELOPER NOTICE:
 * Please verify the Arabic text and vowel markings (tashkeel) against Quran.com (Surah Al-A'raf 7:31)
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
  surahNameArabic: "سورۃ الاعراف: 31",
  surahNameEnglish: "Surah Al-A’raf 7:31",
  referenceLabel: "Surah Al-A’raf 7:31 (سورۃ الاعراف: 31)",
  arabicText: "يَا بَنِي آدَمَ خُذُوا زِينَتَكُمْ عِندَ كُلِّ مَسْجِدٍ",
  urduText: "اے اولادِ آدم! ہر نماز کے وقت اپنی زینت اختیار کرو۔",
};
