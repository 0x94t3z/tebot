import { faqCategories, faqEntries, type FaqCategory, type FaqEntry } from "./faq-data";

export interface PatternMatchResult {
  entry: FaqEntry;
  score: number;
  matchedTerms: string[];
}

interface ScoredPatternMatchResult extends PatternMatchResult {
  rankingScore: number;
}

// Metode utama: pattern matching dengan perhitungan skor.
// Regex dipakai sebagai pendukung preprocessing dan pendeteksian pola frasa,
// bukan sebagai pengganti algoritma utama pencocokan FAQ.
const minimumScore = 25;

interface RegexPatternSpec {
  pattern: RegExp;
  label: string;
  score: number;
}

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
  "dapat",
  "bisa",
  "hari",
  "berapa",
  "bagaimana",
  "gimana",
  "jika",
  "mengapa",
  "kapan",
  "kenapa",
  "kah",
  "kan",
  "nya",
  "saya",
  "aku",
  "gue",
  "gw",
  "mau",
  "kalau",
  "saat",
  "begitu",
  "saja",
  "aja",
  "dia",
  "ini",
  "tidak",
  "ada",
  "banget",
  "banjir",
  "belum",
  "buat",
  "bwt",
  "duluan",
  "dipakai",
  "doang",
  "entah",
  "ga",
  "gak",
  "kebawa",
  "kena",
  "lagi",
  "masih",
  "nunggu",
  "sih",
  "pas",
  "tapi",
  "via",
  "lewat",
  "ya",
  "tolong",
  "dong",
  "min",
  "admin",
  "kak",
  "kang",
  "mas",
  "pak",
  "bu",
  "teh",
  "gan"
]);

// Kelompok kata yang dianggap memiliki makna mirip saat pencocokan.
const synonymGroups = [
  ["alamat", "lokasi", "tempat", "dimana"],
  ["jam", "jadwal", "operasional"],
  ["buka", "beroperasi"],
  ["tutup"],
  ["cek", "periksa", "lihat", "mengetahui", "cari"],
  ["bayar", "pembayaran", "dibayar"],
  ["online", "digital", "hp", "aplikasi", "ponsel"],
  ["hilang", "kehilangan", "ilang", "raib", "lenyap"],
  ["wajib", "harus", "perlu"],
  ["fungsi", "manfaat", "kegunaan"],
  ["cepat", "kilat"],
  ["mutasi", "pindah", "domisili", "cabut"],
  ["kendaraan", "mobil", "motor"],
  ["jatuh", "tempo", "deadline"],
  ["telat", "terlambat", "keterlambatan"],
  ["menunggak", "nunggak", "tunggakan"],
  ["biaya", "tarif"],
  ["dokumen", "syarat", "persyaratan", "berkas"],
  ["asli", "ori", "original"],
  ["pemilik", "kepemilikan", "nama"],
  ["bekas", "second", "seken"],
  ["pengaduan", "keluhan", "komplain", "lapor", "kritik", "saran", "petugas", "jutek"],
  ["daftar", "mendaftar", "pendaftaran", "registrasi"],
  ["drive", "thru", "drivethru"],
  ["nomor", "nopol", "polisi"],
  ["plat", "pelat"],
  ["sulit", "susah"],
  ["ditemukan", "dicari"],
  ["wajah", "muka", "selfie", "face", "matching"],
  ["gagal", "error"],
  ["pemutihan", "keringanan", "diskon"],
  ["parkir", "parking"],
  ["mushola", "musala"],
  ["loket", "informasi", "cs"]
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
  22: ["jatuh tempo", "masa berlaku pajak", "deadline pajak", "tanggal jatuh tempo pajak"],
  23: ["cek pajak kendaraan", "cek tagihan pajak", "lihat pajak kendaraan", "cek pkb"],
  26: ["denda pajak", "telat bayar pajak", "telat pajak", "denda keterlambatan pajak", "pajak terlambat", "pajak telat"],
  30: ["pajak lima tahunan", "pajak 5 tahun"],
  33: ["mati pajak", "pajak bertahun tahun", "pajak menunggak bertahun tahun"],
  35: ["bayar pajak online", "pajak online", "bayar pkb online", "bayar e samsat"],
  42: ["pajak stnk hilang", "bayar pajak stnk hilang", "stnk hilang bayar pajak"],
  45: ["pajak aplikasi hp", "bayar pajak hp", "pajak pakai aplikasi", "bayar pajak signal", "pajak lewat signal"],
  47: ["syarat bayar pajak", "dokumen bayar pajak", "syarat pajak tahunan"],
  48: ["pajak lima tahunan", "pajak 5 tahun", "syarat pajak lima tahunan"],
  54: ["stnk hilang", "kehilangan stnk", "stnk hilang cara", "urus stnk hilang"],
  55: ["bpkb hilang", "kehilangan bpkb", "bpkb hilang cara", "urus bpkb hilang"],
  62: ["bpkb pajak lima tahunan", "bpkb diperlukan pajak lima tahunan"],
  73: [
    "syarat balik nama",
    "dokumen balik nama",
    "balik nama",
    "motor bekas nama pemilik lama",
    "nama masih pemilik lama",
    "kendaraan bekas pemilik lama",
    "balik nama motor second",
    "balik nama kendaraan seken"
  ],
  85: ["balik nama pajak menunggak", "belum balik nama pajak", "motor bekas belum balik nama pajak", "balik nama pajak nunggak", "balik nama tunggakan pajak"],
  90: [
    "mutasi",
    "syarat mutasi",
    "dokumen mutasi",
    "mau mutasi",
    "ingin mutasi",
    "cara mutasi",
    "proses mutasi",
    "alur mutasi",
    "plat luar pindah",
    "pelat luar pindah",
    "pindah domisili",
    "cabut berkas"
  ],
  92: ["kendaraan dibawa mutasi", "motor dibawa mutasi", "mobil dibawa mutasi"],
  94: ["mutasi bpkb asli", "mutasi bpkb ori", "bpkb asli mutasi"],
  105: ["kapan cek fisik", "kendaraan harus cek fisik", "cek fisik diperlukan"],
  107: ["cek fisik wajib mutasi", "cek fisik untuk mutasi", "cek fisik kendaraan mutasi"],
  117: ["signal", "aplikasi signal"],
  120: ["daftar signal", "cara daftar signal", "registrasi signal", "bikin akun signal", "buat akun signal"],
  121: ["signal jawa barat", "signal jabar"],
  126: ["verifikasi signal gagal", "signal gagal wajah", "signal wajah buram", "signal gagal selfie"],
  129: ["samsat keliling", "layanan keliling"],
  134: ["jadwal samsat keliling", "jam samsat keliling"],
  135: ["lokasi samsat keliling", "samsat keliling dimana", "samsat keliling hari ini"],
  136: ["parkir samsat", "tempat parkir samsat", "samsat punya tempat parkir", "area parking samsat"],
  138: ["toilet samsat", "ada toilet", "tersedia toilet"],
  139: ["mushola samsat", "ada mushola", "tersedia mushola"],
  140: ["loket informasi", "cs samsat", "customer service samsat", "tanya informasi samsat"],
  142: [
    "pengaduan",
    "komplain",
    "pengaduan samsat",
    "keluhan samsat",
    "komplain samsat",
    "komplain layanan samsat",
    "cara komplain layanan samsat",
    "petugas jutek",
    "komplain petugas",
    "lapor petugas"
  ],
  146: ["drive thru", "samsat drive thru"],
  147: ["memiliki drive thru", "tersedia drive thru", "samsat punya drive thru"],
  150: ["syarat drive thru", "dokumen drive thru", "persyaratan drive thru", "berkas drive thru", "bawa berkas drive thru"]
};

// Regex normalisasi menyamakan variasi penulisan sebelum tokenisasi.
// Contoh: "drive-thru" dan "drivethru" disamakan menjadi "drive thru".
const regexNormalizationRules = [
  { pattern: /\b(alamat|alur|biaya|cara|daftar|dokumen|fungsi|jadwal|lokasi|manfaat|mutasi|pajak|proses|syarat)nya\b/g, replacement: "$1" },
  { pattern: /\b(stnk|bpkb|tnkb|pkb|swdkllj)nya\b/g, replacement: "$1" },
  { pattern: /\b(ilang|raib|lenyap)\b/g, replacement: "hilang" },
  { pattern: /\b(ngapain|ngurus|urusnya|urusan|ngurusin)\b/g, replacement: "cara" },
  { pattern: /\b(kemana)\b/g, replacement: "dimana" },
  { pattern: /\b(pake|pakai|menggunakan)\b/g, replacement: "pakai" },
  { pattern: /\b(pengen|pingin|ingin)\b/g, replacement: "mau" },
  { pattern: /\b(ngecek|cekkin|cariin|nyari|mencari)\b/g, replacement: "cek" },
  { pattern: /\b(selfie|muka)\b/g, replacement: "wajah" },
  { pattern: /\b(face\s+matching|facematching)\b/g, replacement: "wajah" },
  { pattern: /\b(nongkrong)\b/g, replacement: "lokasi" },
  { pattern: /\b(ketemu|nemu)\b/g, replacement: "ditemukan" },
  { pattern: /\b(dendanya)\b/g, replacement: "denda" },
  { pattern: /\b(nunggak|tunggakan)\b/g, replacement: "menunggak" },
  { pattern: /\b(telat|keterlambatan)\b/g, replacement: "terlambat" },
  { pattern: /\bdrive\s*-?\s*thru\b/g, replacement: "drive thru" },
  { pattern: /\bdrive\s+through\b/g, replacement: "drive thru" },
  { pattern: /\bdrivethru\b/g, replacement: "drive thru" },
  { pattern: /\b(no\s*pol|nopol|nomor\s*polisi|no\s*polisi)\b/g, replacement: "nomor polisi" },
  { pattern: /\b(nmr|nomer|no)\b/g, replacement: "nomor" },
  { pattern: /\b(plat|pelat)\b/g, replacement: "pelat" },
  { pattern: /\b(luar\s+kota|luar\s+daerah|luar\s+provinsi)\b/g, replacement: "luar daerah" },
  { pattern: /\b(5|lima)\s*(tahun|tahunan)\b/g, replacement: "lima tahunan" },
  { pattern: /\b(e\s*-?\s*samsat|esamsat)\b/g, replacement: "e samsat" },
  { pattern: /\b(samsat\s+digital\s+nasional|signal\s+nasional|sinyal)\b/g, replacement: "signal" },
  { pattern: /\b(samkel)\b/g, replacement: "samsat keliling" },
  { pattern: /\bsurat\s+tanda\s+nomor\s+kendaraan\b/g, replacement: "stnk" },
  { pattern: /\bbuku\s+pemilik\s+kendaraan\s+bermotor\b/g, replacement: "bpkb" },
  { pattern: /\btanda\s+nomor\s+kendaraan\s+bermotor\b/g, replacement: "tnkb" },
  { pattern: /\b(cabut\s+berkas|pindah\s+domisili)\b/g, replacement: "syarat mutasi" },
  { pattern: /\b(gesek\s+rangka|gesek\s+mesin)\b/g, replacement: "cek fisik" },
  { pattern: /\b(bb?nkb|bea\s+balik\s+nama)\b/g, replacement: "balik nama" }
];

// Regex pattern memberi sinyal tambahan untuk FAQ yang punya bentuk kalimat
// khas. Skor ini tetap digabung dengan token/sinonim/custom pattern.
const regexPatterns: Record<number, RegexPatternSpec[]> = {
  5: [{ pattern: /\b(samsat\s+)?buka\s+(jam|pukul)?\b/, label: "regex:samsat buka", score: 85 }],
  6: [{ pattern: /\b(tutup).*\b(jam|pukul|operasional)\b|\b(jam|pukul|operasional).*\b(tutup)\b/, label: "regex:samsat tutup", score: 125 }],
  7: [{ pattern: /\b(sabtu).*\b(buka|layanan|operasional)\b|\b(buka|layanan|operasional).*\b(sabtu)\b/, label: "regex:sabtu buka", score: 90 }],
  8: [{ pattern: /\b(minggu).*\b(buka|layanan|operasional)\b|\b(buka|layanan|operasional).*\b(minggu)\b/, label: "regex:minggu buka", score: 90 }],
  10: [{ pattern: /\b(alamat|lokasi|dimana|tempat).*\b(samsat).*\b(bandung\s+timur)\b/, label: "regex:alamat samsat bandung timur", score: 95 }],
  22: [{ pattern: /\b(jatuh\s+tempo|deadline|masa\s+berlaku).*\b(pajak|stnk|kendaraan)\b|\b(pajak|stnk|kendaraan).*\b(jatuh\s+tempo|deadline|masa\s+berlaku)\b/, label: "regex:jatuh tempo pajak", score: 120 }],
  23: [{ pattern: /\b(cek|lihat|periksa).*\b(pajak|pkb|tagihan).*\b(kendaraan|motor|mobil)?\b|\b(tagihan|pajak|pkb).*\b(kendaraan|motor|mobil)?.*\b(cek|lihat|periksa)\b/, label: "regex:cek pajak", score: 115 }],
  26: [{ pattern: /\b(denda|terlambat).*\b(pajak|pkb)\b|\b(pajak|pkb).*\b(denda|terlambat)\b/, label: "regex:denda pajak", score: 125 }],
  35: [{ pattern: /\b(bayar|pembayaran).*\b(pajak|pkb).*\b(online|digital|signal|e\s+samsat)\b|\b(pajak|pkb).*\b(online|digital|signal|e\s+samsat)\b/, label: "regex:pajak online", score: 95 }],
  42: [{ pattern: /\b(pajak).*\b(stnk).*\b(hilang)\b|\b(stnk).*\b(hilang).*\b(pajak)\b/, label: "regex:pajak stnk hilang", score: 145 }],
  45: [{ pattern: /\b(pajak|pkb).*\b(tahunan)?.*\b(aplikasi|hp|ponsel|signal)\b|\b(aplikasi|hp|ponsel|signal).*\b(pajak|pkb)\b/, label: "regex:pajak aplikasi", score: 155 }],
  47: [{ pattern: /\b(syarat|dokumen|persyaratan).*\b(bayar|pembayaran).*\b(pajak)\b|\b(syarat|dokumen|persyaratan).*\b(pajak)\b/, label: "regex:syarat pajak", score: 95 }],
  30: [{ pattern: /\b(pajak).*\b(lima\s+tahunan)\b|\b(lima\s+tahunan).*\b(pajak)\b/, label: "regex:pajak lima tahunan", score: 70 }],
  33: [{ pattern: /\b(mati|menunggak).*\b(pajak).*\b(tahun|bertahun)\b|\b(pajak).*\b(mati|menunggak).*\b(tahun|bertahun)\b/, label: "regex:mati pajak bertahun", score: 140 }],
  48: [{ pattern: /\b(syarat|dokumen|persyaratan).*\b(pajak)?.*\b(lima\s+tahunan)\b|\b(lima\s+tahunan).*\b(pajak)?.*\b(syarat|dokumen|persyaratan)\b/, label: "regex:syarat pajak lima tahunan", score: 140 }],
  54: [{ pattern: /\b(stnk).*\b(hilang|kehilangan)\b|\b(hilang|kehilangan).*\b(stnk)\b/, label: "regex:stnk hilang", score: 95 }],
  55: [{ pattern: /\b(bpkb).*\b(hilang|kehilangan)\b|\b(hilang|kehilangan).*\b(bpkb)\b/, label: "regex:bpkb hilang", score: 95 }],
  62: [{ pattern: /\b(bpkb).*\b(pajak).*\b(lima\s+tahunan)\b|\b(pajak).*\b(lima\s+tahunan).*\b(bpkb)\b/, label: "regex:bpkb pajak lima tahunan", score: 135 }],
  73: [{ pattern: /\b(syarat|dokumen|persyaratan|cara|proses|bekas|seken|second|pemilik\s+lama).*\b(balik\s+nama)\b|\b(balik\s+nama).*\b(syarat|dokumen|persyaratan|cara|proses|bekas|seken|second|pemilik\s+lama)\b/, label: "regex:balik nama", score: 110 }],
  85: [{ pattern: /\b(balik\s+nama).*\b(pajak|menunggak)\b|\b(pajak|menunggak).*\b(balik\s+nama)\b/, label: "regex:balik nama pajak", score: 135 }],
  90: [{ pattern: /\b(syarat|dokumen|persyaratan|cara|proses|alur|mau|pindah|domisili|cabut|berkas|pelat\s+luar|luar\s+daerah).*\b(mutasi)\b|\b(mutasi).*\b(syarat|dokumen|persyaratan|cara|proses|alur|pindah|domisili|cabut|berkas|pelat\s+luar|luar\s+daerah)\b|\b(pindah|cabut).*\b(domisili|berkas)\b/, label: "regex:mutasi", score: 115 }],
  92: [{ pattern: /\b(kendaraan|motor|mobil).*\b(dibawa|bawa).*\b(mutasi)\b|\b(mutasi).*\b(kendaraan|motor|mobil).*\b(dibawa|bawa)\b/, label: "regex:kendaraan dibawa mutasi", score: 125 }],
  94: [{ pattern: /\b(mutasi).*\b(bpkb).*\b(asli|ori|original)\b|\b(bpkb).*\b(asli|ori|original).*\b(mutasi)\b/, label: "regex:bpkb asli mutasi", score: 130 }],
  103: [{ pattern: /\b(apa|pengertian).*\b(cek\s+fisik)\b|\b(cek\s+fisik).*\b(kendaraan|rangka|mesin|cek\s+fisik)\b/, label: "regex:apa cek fisik", score: 145 }],
  105: [{ pattern: /\b(kapan|perlu|wajib|harus|diperlukan).*\b(cek\s+fisik)\b|\b(cek\s+fisik).*\b(kapan|perlu|wajib|harus|diperlukan)\b/, label: "regex:kapan cek fisik", score: 115 }],
  107: [{ pattern: /\b(cek\s+fisik).*\b(wajib|perlu|harus).*\b(mutasi)\b|\b(mutasi).*\b(cek\s+fisik)\b/, label: "regex:cek fisik mutasi", score: 98 }],
  115: [{ pattern: /\b(nomor\s+rangka).*\b(sulit|susah|ditemukan|dicari)\b|\b(sulit|susah|ditemukan|dicari).*\b(nomor\s+rangka)\b/, label: "regex:nomor rangka sulit", score: 135 }],
  117: [{ pattern: /\b(signal|sambara|aplikasi\s+signal)\b/, label: "regex:signal", score: 95 }],
  120: [{ pattern: /\b(daftar|mendaftar|registrasi|cara|akun).*\b(signal)\b|\b(signal).*\b(daftar|mendaftar|registrasi|cara|akun)\b/, label: "regex:daftar signal", score: 125 }],
  121: [{ pattern: /\b(signal).*\b(jawa\s+barat|jabar)\b|\b(jawa\s+barat|jabar).*\b(signal)\b/, label: "regex:signal jawa barat", score: 120 }],
  126: [{ pattern: /\b(signal).*\b(gagal|verifikasi|wajah|buram)\b|\b(gagal|verifikasi|wajah|buram).*\b(signal)\b/, label: "regex:verifikasi signal gagal", score: 140 }],
  129: [{ pattern: /\b(samsat\s+keliling|layanan\s+keliling)\b/, label: "regex:samsat keliling", score: 95 }],
  134: [{ pattern: /\b(jadwal|jam|kapan).*\b(samsat\s+keliling|keliling\s+samsat)\b|\b(samsat\s+keliling|keliling\s+samsat).*\b(jadwal|jam|kapan)\b/, label: "regex:jadwal samsat keliling", score: 155 }],
  135: [{ pattern: /\b(lokasi|dimana|tempat).*\b(samsat\s+keliling|keliling\s+samsat)\b|\b(samsat\s+keliling|keliling\s+samsat).*\b(lokasi|dimana|tempat)\b/, label: "regex:lokasi samsat keliling", score: 135 }],
  136: [{ pattern: /\b(parkir|tempat\s+parkir|area\s+parkir).*\b(samsat)?\b/, label: "regex:parkir samsat", score: 90 }],
  138: [{ pattern: /\b(toilet).*\b(samsat)?\b|\b(samsat).*\b(toilet)\b/, label: "regex:toilet", score: 120 }],
  139: [{ pattern: /\b(mushola|musala).*\b(samsat)?\b|\b(samsat).*\b(mushola|musala)\b/, label: "regex:mushola", score: 120 }],
  140: [{ pattern: /\b(loket|cs|informasi|customer\s+service).*\b(samsat)?\b|\b(samsat).*\b(loket|cs|informasi|customer\s+service)\b/, label: "regex:loket informasi", score: 120 }],
  142: [{ pattern: /\b(pengaduan|keluhan|komplain|lapor|petugas|jutek).*\b(samsat|layanan|petugas)?\b/, label: "regex:pengaduan", score: 110 }],
  146: [{ pattern: /\b(drive\s+thru|drivethru)\b/, label: "regex:drive thru", score: 80 }],
  147: [{ pattern: /\b(memiliki|tersedia|ada|punya).*\b(drive\s+thru|drivethru)\b|\b(drive\s+thru|drivethru).*\b(memiliki|tersedia|ada|punya)\b/, label: "regex:ketersediaan drive thru", score: 130 }],
  150: [{ pattern: /\b(syarat|dokumen|persyaratan|berkas|bawa).*\b(drive\s+thru|drivethru)\b|\b(drive\s+thru|drivethru).*\b(syarat|dokumen|persyaratan|berkas|bawa)\b/, label: "regex:syarat drive thru", score: 135 }]
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
  "melayani",
  "layanan",
  "pelayanan",
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
  jadwalnya: "jadwal",
  kendaraannya: "kendaraan",
  lokasinya: "lokasi",
  manfaatnya: "manfaat",
  mobilnya: "mobil",
  motornya: "motor",
  mutasinya: "mutasi",
  pajaknya: "pajak",
  prosesnya: "proses",
  syaratnya: "syarat",
  daftarnya: "daftar",
  bayarnya: "bayar",
  membayar: "bayar",
  membayarkan: "bayar",
  dibayarkan: "bayar",
  pengesahan: "sah",
  mengesahkan: "sah",
  perpanjangan: "perpanjang",
  memperpanjang: "perpanjang",
  mengurus: "cara",
  urus: "cara",
  pengurusan: "cara",
  mencari: "cek",
  melihat: "cek",
  mengecek: "cek",
  memeriksa: "cek",
  mendaftar: "daftar",
  mendaftarkan: "daftar",
  registrasinya: "registrasi",
  persyaratan: "syarat",
  persyaratannya: "syarat",
  keterlambatan: "terlambat",
  terlambat: "terlambat",
  dendanya: "denda",
  tagihannya: "tagihan",
  seken: "bekas",
  second: "bekas",
  musala: "mushola"
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
  "signal",
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
  "e samsat",
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
  "cek", "periksa", "lihat", "mengetahui", "cari", "fisik", "kendaraan", "mobil", "motor", "wajib", "harus", "perlu",
  "balik", "nama", "mutasi", "pindah", "domisili", "cabut", "pajak", "stnk", "bpkb", "nomor",
  "rangka", "mesin", "biaya", "tarif", "dimana", "lokasi", "tempat", "alamat",
  "samsat", "hasil", "masa", "berlaku", "baru", "modifikasi", "dimodifikasi",
  "proses", "alur", "cara", "syarat", "persyaratan", "dokumen", "layanan",
  "melayani", "pelayanan", "memerlukan", "diperlukan", "pemilik", "kepemilikan",
  "bawa", "membawa", "dibawa", "diperiksa", "dikenakan", "diwakilkan",
  "tersedia", "area", "waktu", "lama", "gratis"
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
    .sort((a, b) => b.rankingScore - a.rankingScore || b.score - a.score);

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
  const normalized = value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");

  return applyRegexNormalization(normalized)
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Menjalankan aturan regex untuk menyamakan variasi istilah domain Samsat.
function applyRegexNormalization(value: string) {
  return regexNormalizationRules.reduce(
    (currentValue, rule) => currentValue.replace(rule.pattern, rule.replacement),
    value
  );
}

// Menghitung skor kecocokan antara input user dan satu data FAQ.
function scoreEntry(
  entry: FaqEntry,
  normalizedInput: string,
  baseQueryTokens: string[],
  queryTokens: string[]
): ScoredPatternMatchResult {
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
  let regexScore = 0;
  const matchedTerms = new Set<string>();

  // Skor tinggi diberikan jika input cocok persis atau cocok sebagian dengan pola.
  for (const patternSpec of patterns) {
    const pattern = normalize(patternSpec.value);
    if (!pattern) {
      continue;
    }

    const compactPattern = tokenize(pattern).join(" ");
    if (pattern === normalizedInput) {
      phraseScore = Math.max(phraseScore, patternSpec.exactScore + 100);
      matchedTerms.add(pattern);
    } else if (compactPattern === compactInput) {
      phraseScore = Math.max(phraseScore, patternSpec.exactScore + 40);
      matchedTerms.add(pattern);
    } else if (
      pattern.includes(normalizedInput) ||
      normalizedInput.includes(pattern) ||
      (compactInput.length > 0 && compactPattern.includes(compactInput)) ||
      (compactPattern.length > 0 && compactInput.includes(compactPattern))
    ) {
      phraseScore = Math.max(phraseScore, patternSpec.partialScore);
      matchedTerms.add(pattern);
    } else {
      const unorderedScore = getUnorderedPatternScore(pattern, queryTokens, patternSpec.partialScore);
      if (unorderedScore > 0) {
        phraseScore = Math.max(phraseScore, unorderedScore);
        matchedTerms.add(`unordered:${pattern}`);
      }
    }
  }

  for (const regexPattern of regexPatterns[entry.id] ?? []) {
    if (regexPattern.pattern.test(normalizedInput)) {
      regexScore = Math.max(regexScore, regexPattern.score);
      matchedTerms.add(regexPattern.label);
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
  const patternScore = Math.max(phraseScore, regexScore);
  const relevanceScore =
    patternScore * 0.65 +
    subjectCoverage * 20 +
    entryCoverage * 10 +
    queryCoverage * 5 +
    anchorBonus;

  return {
    entry,
    score: Math.min(100, Math.round(relevanceScore)),
    rankingScore: relevanceScore,
    matchedTerms: [...matchedTerms].slice(0, 6)
  };
}

// Custom pattern tetap dianggap cocok meski urutan kata user dibalik.
// Contoh: "syarat bayar pajak" tetap cocok dengan "pajak bayar syaratnya".
function getUnorderedPatternScore(pattern: string, queryTokens: string[], baseScore: number) {
  const basePatternTokens = tokenize(pattern);
  if (basePatternTokens.length < 2) {
    return 0;
  }

  const querySet = new Set(queryTokens);
  const isMatch = basePatternTokens.every((token) => tokenMatchesQuery(token, querySet));

  if (!isMatch) {
    return 0;
  }

  return baseScore + Math.min(basePatternTokens.length * 10, 40);
}

// Memecah teks menjadi kata penting dan membuang stop word.
function tokenize(value: string) {
  return normalize(value)
    .split(" ")
    .map((token) => toCanonicalToken(token))
    .filter((token) => token.length > 1 && !stopWords.has(token));
}

// Menyamakan token hasil tokenisasi ke bentuk kanonis yang dipakai dataset.
function toCanonicalToken(token: string) {
  return tokenAliases[token] ?? token;
}

// Satu token pola dianggap cocok jika input memiliki token yang sama atau
// salah satu sinonimnya. Ini menjaga pola tetap fleksibel tanpa mengharuskan
// seluruh sinonim muncul bersamaan.
function tokenMatchesQuery(patternToken: string, querySet: Set<string>) {
  if (querySet.has(patternToken)) {
    return true;
  }

  return synonymGroups.some((group) => (
    group.includes(patternToken) && group.some((synonym) => querySet.has(synonym))
  ));
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
