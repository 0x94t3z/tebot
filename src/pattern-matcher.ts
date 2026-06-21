import { faqCategories, faqEntries, type FaqCategory, type FaqEntry } from "./faq-data";

export interface PatternMatchResult {
  entry: FaqEntry;
  score: number;
  matchedTerms: string[];
}

// Metode utama: pattern matching dengan perhitungan skor.
// Regex hanya digunakan di dalam normalize() untuk preprocessing tanda baca/spasi,
// bukan sebagai algoritma utama pencocokan FAQ.
const minimumScore = 18;

// Kata umum yang diabaikan agar pencocokan fokus pada kata bermakna.
const stopWords = new Set([
  "apa",
  "apakah",
  "itu",
  "yang",
  "di",
  "ke",
  "dan",
  "atau",
  "untuk",
  "hari",
  "berapa",
  "bagaimana",
  "gimana",
  "kah",
  "nya",
  "saya",
  "mau"
]);

// Kelompok kata yang dianggap memiliki makna mirip saat pencocokan.
const synonymGroups = [
  ["alamat", "lokasi", "tempat", "dimana"],
  ["jam", "jadwal", "operasional", "buka", "tutup"],
  ["bayar", "pembayaran"],
  ["online", "digital", "hp"],
  ["hilang", "kehilangan"],
  ["wajib", "harus", "perlu"],
  ["fungsi", "manfaat", "kegunaan"],
  ["cepat", "kilat"],
  ["mutasi", "pindah"],
  ["biaya", "tarif"],
  ["dokumen", "syarat", "persyaratan"],
  ["pemilik", "kepemilikan", "nama"]
];

// Pola tambahan untuk FAQ tertentu agar variasi pertanyaan user tetap cocok.
const customPatterns: Record<number, string[]> = {
  1: ["jam layanan samsat", "jadwal layanan samsat"],
  2: ["samsat buka", "buka jam"],
  3: ["samsat tutup", "tutup jam"],
  4: ["samsat buka hari sabtu", "sabtu buka", "buka hari sabtu", "layanan sabtu"],
  5: ["samsat buka hari minggu", "minggu buka", "buka hari minggu", "layanan minggu"],
  6: ["alamat samsat bandung timur", "lokasi samsat bandung timur", "samsat soekarno hatta"],
  10: ["cek fisik samsat", "melayani cek fisik"],
  12: ["jatuh tempo", "masa berlaku pajak"],
  13: ["denda pajak", "telat bayar pajak"],
  15: ["syarat bayar pajak", "dokumen bayar pajak"],
  16: ["bayar pajak online", "pajak online signal"],
  17: ["pajak lima tahunan", "pajak 5 tahun"],
  18: ["cek fisik pajak", "pajak perlu cek fisik"],
  26: ["stnk hilang", "kehilangan stnk"],
  27: ["bpkb hilang", "kehilangan bpkb"],
  32: ["syarat balik nama", "dokumen balik nama"],
  35: ["proses balik nama", "alur balik nama"],
  42: ["syarat mutasi", "dokumen mutasi"],
  43: ["proses mutasi", "alur mutasi"],
  51: ["samsat keliling", "layanan keliling"],
  53: ["jadwal samsat keliling", "jam samsat keliling"],
  54: ["drive thru", "samsat drive thru"],
  56: ["e samsat", "e-samsat"],
  58: ["signal", "aplikasi signal"],
  60: ["sambara", "aplikasi sambara"],
  68: ["cara kerja chatbot", "chatbot pattern matching"],
  69: ["pattern matching", "pencocokan pola"],
  70: ["regex", "regular expression"],
  93: ["antrian samsat", "antrean samsat"]
};

// Fungsi utama untuk mencari FAQ yang paling cocok dengan pertanyaan user.
export function matchFaq(input: string): PatternMatchResult | null {
  const normalizedInput = normalize(input);
  const queryTokens = expandTokens(tokenize(normalizedInput));

  if (queryTokens.length === 0) {
    return null;
  }

  const ranked = faqEntries
    .map((entry) => scoreEntry(entry, normalizedInput, queryTokens))
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];
  return best && best.score >= minimumScore ? best : null;
}

// Mengambil satu FAQ berdasarkan ID, biasanya dipakai saat tombol FAQ diklik.
export function getFaqById(id: number) {
  return faqEntries.find((entry) => entry.id === id);
}

// Memvalidasi dan mengambil kategori dari callback Telegram.
export function getCategory(value: string): FaqCategory | null {
  const normalizedValue = normalize(value);
  return faqCategories.find((category) => normalize(category) === normalizedValue) ?? null;
}

// Mengambil semua FAQ dalam satu kategori.
export function getEntriesByCategory(category: FaqCategory) {
  return faqEntries.filter((entry) => entry.category === category);
}

// Menyamakan format teks sebelum dicocokkan.
export function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Menghitung skor kecocokan antara input user dan satu data FAQ.
function scoreEntry(
  entry: FaqEntry,
  normalizedInput: string,
  queryTokens: string[]
): PatternMatchResult {
  const patterns = [entry.question, entry.category, ...(customPatterns[entry.id] ?? [])];
  const normalizedPatterns = patterns.map(normalize).filter(Boolean);
  const entryTokens = expandTokens(tokenize([entry.question, entry.category].join(" ")));

  let score = 0;
  const matchedTerms = new Set<string>();

  // Skor tinggi diberikan jika input cocok persis atau cocok sebagian dengan pola.
  for (const pattern of normalizedPatterns) {
    if (pattern === normalizedInput) {
      score += 100;
      matchedTerms.add(pattern);
    } else if (pattern.includes(normalizedInput) || normalizedInput.includes(pattern)) {
      score += 45;
      matchedTerms.add(pattern);
    }
  }

  const querySet = new Set(queryTokens);
  const entrySet = new Set(entryTokens);
  const overlap = [...querySet].filter((token) => entrySet.has(token));

  for (const token of overlap) {
    matchedTerms.add(token);
  }

  const queryCoverage = overlap.length / querySet.size;
  const entryCoverage = overlap.length / Math.max(entrySet.size, 1);
  // Skor overlap memperhitungkan jumlah kata penting yang sama.
  score += queryCoverage * 45 + entryCoverage * 35;

  return {
    entry,
    score: Math.round(score),
    matchedTerms: [...matchedTerms].slice(0, 6)
  };
}

// Memecah teks menjadi kata penting dan membuang stop word.
function tokenize(value: string) {
  return normalize(value)
    .split(" ")
    .filter((token) => token.length > 1 && !stopWords.has(token));
}

// Menambahkan kata sinonim agar variasi pertanyaan tetap bisa dikenali.
function expandTokens(tokens: string[]) {
  const expanded = new Set(tokens);

  for (const token of tokens) {
    for (const group of synonymGroups) {
      if (group.includes(token)) {
        for (const synonym of group) {
          expanded.add(synonym);
        }
      }
    }
  }

  return [...expanded];
}
