import { faqCategories, faqEntries, type FaqCategory, type FaqEntry } from "./faq-data";

export interface PatternMatchResult {
  entry: FaqEntry;
  score: number;
  matchedTerms: string[];
}

// Metode utama: pattern matching dengan perhitungan skor.
// Regex hanya digunakan di dalam normalize() untuk preprocessing tanda baca/spasi,
// bukan sebagai algoritma utama pencocokan FAQ.
const minimumScore = 25;

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
  "mau",
  "kalau",
  "begitu",
  "saja",
  "dia",
  "ini",
  "tolong",
  "dong",
  "min",
  "admin",
  "kak",
  "mas",
  "pak",
  "bu"
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
  ["kendaraan", "mobil", "motor"],
  ["biaya", "tarif"],
  ["dokumen", "syarat", "persyaratan"],
  ["pemilik", "kepemilikan", "nama"],
  ["pengaduan", "keluhan", "komplain"],
  ["daftar", "mendaftar", "pendaftaran"]
];

// Pola tambahan untuk FAQ tertentu agar variasi pertanyaan user tetap cocok.
const customPatterns: Record<number, string[]> = {
  4: ["jam layanan samsat", "jadwal layanan samsat"],
  5: ["samsat buka", "buka jam"],
  6: ["samsat tutup", "tutup jam", "jam tutup", "kalau tutup", "operasional tutup"],
  7: ["samsat buka hari sabtu", "sabtu buka", "buka hari sabtu", "layanan sabtu"],
  8: ["samsat buka hari minggu", "minggu buka", "buka hari minggu", "layanan minggu"],
  9: ["lokasi samsat bandung timur", "samsat soekarno hatta"],
  10: ["alamat samsat bandung timur"],
  15: ["cek fisik samsat", "melayani cek fisik"],
  32: ["jatuh tempo", "masa berlaku pajak"],
  36: ["denda pajak", "telat bayar pajak"],
  45: ["bayar pajak online", "pajak online"],
  64: ["syarat bayar pajak", "dokumen bayar pajak", "syarat pajak tahunan"],
  65: ["pajak lima tahunan", "pajak 5 tahun", "syarat pajak lima tahunan"],
  76: ["stnk hilang", "kehilangan stnk"],
  77: ["bpkb hilang", "kehilangan bpkb"],
  105: ["syarat balik nama", "dokumen balik nama", "balik nama"],
  130: [
    "mutasi",
    "syarat mutasi",
    "dokumen mutasi",
    "mau mutasi",
    "ingin mutasi",
    "cara mutasi",
    "proses mutasi",
    "alur mutasi"
  ],
  155: ["cek fisik wajib mutasi", "cek fisik untuk mutasi", "cek fisik kendaraan mutasi"],
  171: ["signal", "aplikasi signal"],
  191: ["samsat keliling", "layanan keliling"],
  196: ["jadwal samsat keliling", "jam samsat keliling"],
  206: ["parkir samsat", "tempat parkir samsat", "samsat punya tempat parkir"],
  219: [
    "pengaduan",
    "komplain",
    "pengaduan samsat",
    "keluhan samsat",
    "komplain samsat",
    "komplain layanan samsat",
    "cara komplain layanan samsat"
  ],
  229: ["drive thru", "samsat drive thru"]
};

// Kata intent umum tidak cukup untuk membuktikan bahwa pertanyaan membahas
// Samsat. Ini mencegah kalimat seperti "syarat mencintai dia" cocok hanya
// karena kata "syarat" bersinonim dengan kategori Dokumen.
const genericIntentTokens = new Set([
  "alamat",
  "lokasi",
  "tempat",
  "dimana",
  "jam",
  "jadwal",
  "operasional",
  "buka",
  "tutup",
  "fungsi",
  "manfaat",
  "kegunaan",
  "wajib",
  "harus",
  "perlu",
  "biaya",
  "tarif",
  "kendaraan",
  "mobil",
  "motor",
  "dokumen",
  "syarat",
  "persyaratan",
  "cara",
  "proses",
  "alur",
  "online",
  "digital",
  "hilang",
  "kehilangan"
]);

// Bentuk kata percakapan yang sering memakai akhiran kepunyaan. Daftar
// eksplisit dipakai agar kata biasa seperti "hanya" tidak salah dipotong.
const tokenAliases: Record<string, string> = {
  alamatnya: "alamat",
  biayanya: "biaya",
  caranya: "cara",
  dokumennya: "dokumen",
  fungsinya: "fungsi",
  kendaraannya: "kendaraan",
  lokasinya: "lokasi",
  manfaatnya: "manfaat",
  mobilnya: "mobil",
  motornya: "motor",
  mutasinya: "mutasi",
  pajaknya: "pajak",
  persyaratannya: "persyaratan",
  prosesnya: "proses",
  syaratnya: "syarat"
};

// Istilah yang cukup spesifik untuk menunjukkan bahwa input membahas Samsat
// atau administrasi kendaraan. Kata umum seperti mobil/kendaraan sengaja tidak
// dimasukkan karena sering muncul dalam percakapan di luar layanan Samsat.
const domainAnchorTokens = new Set([
  "samsat",
  "pajak",
  "pkb",
  "swdkllj",
  "stnk",
  "bpkb",
  "tnkb",
  "mutasi",
  "sambara"
]);

const domainAnchorPhrases = [
  "buka jam",
  "tutup jam",
  "balik nama",
  "cek fisik",
  "nomor rangka",
  "nomor mesin",
  "nomor polisi",
  "pelat nomor",
  "plat nomor",
  "jatuh tempo",
  "drive thru",
  "aplikasi signal"
];

const vehicleBrandTokens = [
  "toyota", "honda", "suzuki", "daihatsu", "mitsubishi", "nissan", "mazda",
  "isuzu", "wuling", "hyundai", "kia", "bmw", "mercedes", "yamaha",
  "kawasaki", "vespa"
];

const dayOfWeekTokens = [
  "senin",
  "selasa",
  "rabu",
  "kamis",
  "jumat",
  "sabtu",
  "minggu"
];

const faqVocabulary = new Set([
  ...synonymGroups.flat(),
  ...vehicleBrandTokens,
  ...dayOfWeekTokens,
  ...faqEntries.flatMap((entry) =>
    tokenize(`${entry.question} ${entry.category} ${(customPatterns[entry.id] ?? []).join(" ")}`)
  )
]);

const outOfScopeBandungAreas = ["barat", "utara", "selatan", "tengah"];
const operationalHoursFaqIds = new Set([4, 5, 6, 7, 8]);
const operationalHoursTokens = new Set([
  "jam",
  "buka",
  "tutup",
  "operasional",
  ...dayOfWeekTokens
]);
const operationalHoursContextTokens = new Set(["jam", "buka", "tutup", "operasional"]);

// Kosakata yang masih masuk akal ketika user membahas cek fisik kendaraan.
// Kata di luar daftar ini menandakan bahwa frasa "cek fisik" dipakai dalam
// konteks lain, misalnya olahraga atau pemeriksaan kesehatan manusia.
const vehicleInspectionTokens = new Set([
  "cek", "fisik", "kendaraan", "mobil", "motor", "wajib", "harus", "perlu",
  "balik", "nama", "mutasi", "pindah", "pajak", "stnk", "bpkb", "nomor",
  "rangka", "mesin", "biaya", "tarif", "dimana", "lokasi", "tempat", "alamat",
  "samsat", "hasil", "masa", "berlaku", "baru", "modifikasi", "dimodifikasi",
  "proses", "alur", "cara", "syarat", "persyaratan", "dokumen", "bawa",
  "membawa", "waktu", "lama", "gratis"
]);

// Fungsi utama untuk mencari FAQ yang paling cocok dengan pertanyaan user.
export function matchFaq(input: string): PatternMatchResult | null {
  const normalizedInput = normalize(input);
  const baseQueryTokens = tokenize(normalizedInput);
  const queryTokens = expandTokens(baseQueryTokens);

  if (
    queryTokens.length === 0 ||
    !hasDomainContext(normalizedInput, queryTokens) ||
    hasConflictingContext(normalizedInput, queryTokens, baseQueryTokens)
  ) {
    return null;
  }

  const ranked = faqEntries
    .map((entry) => scoreEntry(entry, normalizedInput, baseQueryTokens, queryTokens))
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];
  if (!best || best.score < minimumScore || !hasSubjectOverlap(best.entry, queryTokens)) {
    return null;
  }

  return best;
}

// Menolak wilayah Bandung selain Timur dan pemakaian istilah Samsat dalam
// konteks yang jelas berbeda dari administrasi kendaraan.
function hasConflictingContext(
  normalizedInput: string,
  queryTokens: string[],
  baseQueryTokens: string[]
) {
  if (isExactFaqPattern(normalizedInput)) {
    return false;
  }

  const knownTokenCount = baseQueryTokens.filter((token) => faqVocabulary.has(token)).length;
  const unknownTokenCount = baseQueryTokens.length - knownTokenCount;

  // Satu istilah domain tidak boleh memaksa kecocokan ketika konteks lainnya
  // berasal dari topik berbeda (contoh: "mutasi genetik" atau "pajak cinta").
  if (unknownTokenCount > 0 && knownTokenCount < unknownTokenCount + 3) {
    return true;
  }

  const asksOtherBandungArea =
    normalizedInput.includes("bandung") &&
    !normalizedInput.includes("bandung timur") &&
    outOfScopeBandungAreas.some((area) => normalizedInput.includes(`bandung ${area}`));

  if (asksOtherBandungArea) {
    return true;
  }

  if (normalizedInput.includes("cek fisik")) {
    return queryTokens.some((token) => !vehicleInspectionTokens.has(token));
  }

  return false;
}

// Pertanyaan harus membawa konteks domain yang jelas. Pengecualian diberikan
// untuk pertanyaan/pola FAQ yang diketik persis, karena konteksnya sudah tidak
// ambigu di dalam bot Samsat.
function hasDomainContext(normalizedInput: string, queryTokens: string[]) {
  if (queryTokens.some((token) => domainAnchorTokens.has(token))) {
    return true;
  }

  if (domainAnchorPhrases.some((phrase) => normalizedInput.includes(phrase))) {
    return true;
  }

  if (queryTokens.some((token) => faqVocabulary.has(token))) {
    return true;
  }

  if (queryTokens.some((token) => operationalHoursContextTokens.has(token))) {
    return true;
  }

  if (
    queryTokens.some((token) => dayOfWeekTokens.includes(token)) &&
    (normalizedInput.includes("kalau") || normalizedInput.includes("hari"))
  ) {
    return true;
  }

  return isExactFaqPattern(normalizedInput);
}

function isExactFaqPattern(normalizedInput: string) {
  return faqEntries.some((entry) => {
    const patterns = [entry.question, ...(customPatterns[entry.id] ?? [])];
    return patterns.some((pattern) => normalize(pattern) === normalizedInput);
  });
}

// Sedikitnya satu kata subjek harus sama dengan FAQ tujuan. Kecocokan yang
// hanya berasal dari kata intent umum dianggap di luar konteks.
function hasSubjectOverlap(entry: FaqEntry, queryTokens: string[]) {
  const entryTokens = new Set(expandTokens(tokenize(`${entry.question} ${entry.category}`)));
  if (
    operationalHoursFaqIds.has(entry.id) &&
    queryTokens.some((token) => operationalHoursTokens.has(token))
  ) {
    return true;
  }
  return queryTokens.some((token) => !genericIntentTokens.has(token) && entryTokens.has(token));
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
  baseQueryTokens: string[],
  queryTokens: string[]
): PatternMatchResult {
  const patterns = [
    { value: entry.question, exactScore: 100, partialScore: 65 },
    { value: entry.category, exactScore: 45, partialScore: 20 },
    ...(customPatterns[entry.id] ?? []).map((value) => ({
      value,
      exactScore: 100,
      partialScore: 80
    }))
  ];
  const compactInput = baseQueryTokens.join(" ");
  const entryTokens = expandTokens(tokenize([entry.question, entry.category].join(" ")));

  let phraseScore = 0;
  const matchedTerms = new Set<string>();

  // Skor tinggi diberikan jika input cocok persis atau cocok sebagian dengan pola.
  for (const patternSpec of patterns) {
    const pattern = normalize(patternSpec.value);
    if (!pattern) {
      continue;
    }

    const compactPattern = tokenize(pattern).join(" ");
    if (pattern === normalizedInput || compactPattern === compactInput) {
      phraseScore = Math.max(phraseScore, patternSpec.exactScore);
      matchedTerms.add(pattern);
    } else if (
      pattern.includes(normalizedInput) ||
      normalizedInput.includes(pattern) ||
      (compactInput.length > 0 && compactPattern.includes(compactInput)) ||
      (compactPattern.length > 0 && compactInput.includes(compactPattern))
    ) {
      phraseScore = Math.max(phraseScore, patternSpec.partialScore);
      matchedTerms.add(pattern);
    }
  }

  const querySet = new Set(queryTokens);
  const entrySet = new Set(entryTokens);
  const overlap = [...querySet].filter((token) => entrySet.has(token));
  const meaningfulOverlap = overlap.filter((token) => !genericIntentTokens.has(token));
  const meaningfulEntryTokens = [...entrySet].filter((token) => !genericIntentTokens.has(token));
  const knownQueryTokens = [...querySet].filter((token) => faqVocabulary.has(token));

  for (const token of overlap) {
    matchedTerms.add(token);
  }

  const queryCoverage = overlap.length / Math.max(knownQueryTokens.length, 1);
  const entryCoverage = overlap.length / Math.max(entrySet.size, 1);
  const subjectCoverage = meaningfulOverlap.length / Math.max(meaningfulEntryTokens.length, 1);
  const anchorBonus = overlap.some((token) => domainAnchorTokens.has(token)) ? 10 : 0;
  // Skor relevansi mengutamakan pola/frasa dan kata inti FAQ. Kata tambahan
  // yang tidak ada di dataset tidak langsung membuat skor turun drastis.
  const relevanceScore =
    phraseScore * 0.65 +
    subjectCoverage * 20 +
    entryCoverage * 10 +
    queryCoverage * 5 +
    anchorBonus;

  return {
    entry,
    score: Math.min(100, Math.round(relevanceScore)),
    matchedTerms: [...matchedTerms].slice(0, 6)
  };
}

// Memecah teks menjadi kata penting dan membuang stop word.
function tokenize(value: string) {
  return normalize(value)
    .split(" ")
    .map((token) => tokenAliases[token] ?? token)
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
