import { describe, expect, it } from "vitest";
import { faqEntries } from "../src/faq-data";
import { getCategory, getEntriesByCategory, matchFaq, matchMultipleFaq, normalize } from "../src/pattern-matcher";

describe("FAQ dataset", () => {
  it("memiliki 150 baris FAQ terkurasi yang diimpor", () => {
    expect(faqEntries).toHaveLength(150);
  });

  it.each([
    ["Layanan", 25],
    ["Pajak", 28],
    ["Dokumen", 20],
    ["Balik Nama", 17],
    ["Mutasi", 17],
    ["Cek Fisik", 14],
    ["SIGNAL", 12],
    ["Samsat Keliling", 7],
    ["Fasilitas", 6],
    ["Pengaduan", 4]
  ] as const)("memetakan kategori %s ke %s baris", (category, count) => {
    expect(getEntriesByCategory(category)).toHaveLength(count);
  });
});

describe("matchFaq", () => {
  it("tetap mencocokkan seluruh pertanyaan resmi ke FAQ asalnya", () => {
    for (const entry of faqEntries) {
      expect(matchFaq(entry.question)?.entry.id, entry.question).toBe(entry.id);
    }
  });

  it("tidak fallback saat urutan kata pertanyaan resmi dibalik", () => {
    for (const entry of faqEntries) {
      const reversedQuestion = normalize(entry.question).split(" ").reverse().join(" ");
      const result = matchFaq(reversedQuestion);

      expect(result, reversedQuestion).not.toBeNull();
    }
  });

  it("tidak fallback pada variasi percakapan kalau pertanyaan bagaimana", () => {
    const failures: string[] = [];

    for (const entry of faqEntries) {
      const conversationalQuestion = `Kalau ${entry.question} bagaimana?`;
      const result = matchFaq(conversationalQuestion);

      if (!result) {
        failures.push(conversationalQuestion);
      }
    }

    expect(failures).toEqual([]);
  });

  it.each([
    ["alamat samsat bandung timur", 10, "Layanan"],
    ["samsat buka hari sabtu?", 7, "Layanan"],
    ["Samsat di hari selasa buka jam berapa?", 5, "Layanan"],
    ["Kalau tutup jam berapa?", 6, "Layanan"],
    ["Kalau tutup operasional samsat jam berapa?", 6, "Layanan"],
    ["Kalau Sabtu?", 7, "Layanan"],
    ["Kalau Minggu?", 8, "Layanan"],
    ["Kalau mutasi?", 90, "Mutasi"],
    ["Kalau balik nama?", 73, "Balik Nama"],
    ["Kalau pajak online?", 35, "Pajak"],
    ["Kalau SIGNAL?", 117, "SIGNAL"],
    ["Kalau parkir?", 136, "Fasilitas"],
    ["Kalau komplain?", 142, "Pengaduan"],
    ["syarat bayar pajak kendaraan", 47, "Pajak"],
    ["bisa bayar pajak online?", 35, "Pajak"],
    ["stnk saya hilang", 54, "Dokumen"],
    ["Bagaimana jika stnk hilang?", 54, "Dokumen"],
    ["Kalau stnk hilang bagaimana?", 54, "Dokumen"],
    ["dokumen balik nama", 73, "Balik Nama"],
    ["alur mutasi kendaraan", 90, "Mutasi"],
    ["kalau mau mutasi?", 90, "Mutasi"],
    ["Kalau begitu mobil saya Toyota, kalau mau di mutasi apa syaratnya?", 90, "Mutasi"],
    ["jadwal samsat keliling", 134, "Samsat Keliling"],
    ["apa itu signal", 117, "SIGNAL"]
  ] as const)("mencocokkan %s", (input, expectedId, expectedCategory) => {
    const result = matchFaq(input);

    expect(result?.entry.id).toBe(expectedId);
    expect(result?.entry.category).toBe(expectedCategory);
  });

  it.each([
    ["drive-thru samsat", 146, "Layanan"],
    ["drivethru samsat", 146, "Layanan"],
    ["surat tanda nomor kendaraan hilang", 54, "Dokumen"],
    ["buku pemilik kendaraan bermotor hilang", 55, "Dokumen"],
    ["pajak 5 tahunan", 30, "Pajak"],
    ["pajak lima tahun", 30, "Pajak"],
    ["syarat pajak 5 tahunan", 48, "Pajak"],
    ["cabut berkas kendaraan", 90, "Mutasi"],
    ["pindah domisili kendaraan", 90, "Mutasi"],
    ["gesek rangka kendaraan", 103, "Cek Fisik"]
  ] as const)("mencocokkan variasi regex: %s", (input, expectedId, expectedCategory) => {
    const result = matchFaq(input);

    expect(result?.entry.id).toBe(expectedId);
    expect(result?.entry.category).toBe(expectedCategory);
  });

  it.each([
    ["hilang stnk saya bagaimana", 54, "Dokumen"],
    ["bpkb hilang harus bagaimana", 55, "Dokumen"],
    ["pajak kendaraan bayar syaratnya apa", 47, "Pajak"],
    ["lima tahunan pajak syaratnya apa", 48, "Pajak"],
    ["balik nama kendaraan syaratnya apa", 73, "Balik Nama"],
    ["nama balik dokumen apa saja", 73, "Balik Nama"],
    ["mutasi kendaraan apa saja syaratnya", 90, "Mutasi"],
    ["kendaraan mutasi mau syaratnya apa", 90, "Mutasi"],
    ["fisik cek mutasi wajib tidak", 107, "Cek Fisik"],
    ["keliling samsat jadwalnya kapan", 134, "Samsat Keliling"],
    ["signal daftar caranya gimana", 120, "SIGNAL"],
    ["drive thru syaratnya apa", 150, "Layanan"],
    ["pengaduan layanan samsat bagaimana cara", 142, "Pengaduan"]
  ] as const)("mencocokkan urutan kata yang dibalik: %s", (input, expectedId, expectedCategory) => {
    const result = matchFaq(input);

    expect(result?.entry.id).toBe(expectedId);
    expect(result?.entry.category).toBe(expectedCategory);
  });

  it.each([
    ["stnk ilang harus ngapain ya", 54, "Dokumen"],
    ["stnk raib kebawa banjir gimana min", 54, "Dokumen"],
    ["bpkb lenyap entah kemana urusnya gimana", 55, "Dokumen"],
    ["motor mati pajak 3 tahun masih bisa dibayar?", 33, "Pajak"],
    ["telat pajak motor lama banget dendanya gimana", 26, "Pajak"],
    ["pajak motor mau bayar tapi stnk hilang duluan", 42, "Pajak"],
    ["beli motor bekas tapi nama masih pemilik lama harus apa", 79, "Balik Nama"],
    ["motor bekas belum balik nama pajaknya gimana", 85, "Balik Nama"],
    ["plat luar kota mau pindah ke bandung timur gimana", 90, "Mutasi"],
    ["cabut berkas motor ke domisili baru apa aja", 90, "Mutasi"],
    ["gesek rangka mesin buat apa sih", 103, "Cek Fisik"],
    ["nomor rangka susah dicari gimana", 115, "Cek Fisik"],
    ["signal gagal selfie wajah buram harus apa", 126, "SIGNAL"],
    ["mau daftar signal tapi verifikasi muka gagal", 126, "SIGNAL"],
    ["pajak tahunan pake hp aplikasi apa", 45, "Pajak"],
    ["samsat keliling hari ini nongkrong dimana", 135, "Samsat Keliling"],
    ["toilet di samsat ada ga", 138, "Fasilitas"],
    ["mushola ada ga kalau nunggu pajak", 139, "Fasilitas"],
    ["petugas jutek komplain kemana", 142, "Pengaduan"],
    ["drive thru bawa berkas apa aja", 150, "Layanan"]
  ] as const)("mencocokkan pertanyaan aneh tapi masih terkait Samsat: %s", (input, expectedId, expectedCategory) => {
    const result = matchFaq(input);

    expect(result?.entry.id).toBe(expectedId);
    expect(result?.entry.category).toBe(expectedCategory);
  });

  it.each([
    ["deadline pajak motor kapan sih", 22, "Pajak"],
    ["cariin tagihan pkb motor dong", 23, "Pajak"],
    ["pajak telat apakah kena denda", 26, "Pajak"],
    ["mau bayar pkb online lewat e-samsat", 35, "Pajak"],
    ["stnknya raib cara urus gimana", 54, "Dokumen"],
    ["bpkbnya ilang ngurus dimana", 55, "Dokumen"],
    ["dokumen apa bwt balik nama motor second", 73, "Balik Nama"],
    ["motor seken pajaknya nunggak bisa balik nama ga", 85, "Balik Nama"],
    ["pelat luar daerah mau cabut berkas", 90, "Mutasi"],
    ["motor wajib dibawa pas mutasi?", 92, "Mutasi"],
    ["mutasi perlu bpkb ori ga", 94, "Mutasi"],
    ["cek fisik itu buat gesek mesin doang?", 103, "Cek Fisik"],
    ["kapan kendaraan harus cek fisik", 105, "Cek Fisik"],
    ["nomer rangka susah ketemu", 115, "Cek Fisik"],
    ["bikin akun sinyal gimana", 120, "SIGNAL"],
    ["signal bisa dipakai di jabar?", 121, "SIGNAL"],
    ["face matching signal error kenapa", 126, "SIGNAL"],
    ["jadwal samkel hari ini ada dimana", 135, "Samsat Keliling"],
    ["ada cs atau loket informasi di samsat?", 140, "Fasilitas"],
    ["drive through bawa apa aja", 150, "Layanan"]
  ] as const)("mencocokkan slang, singkatan, dan imbuhan: %s", (input, expectedId, expectedCategory) => {
    const result = matchFaq(input);

    expect(result?.entry.id).toBe(expectedId);
    expect(result?.entry.category).toBe(expectedCategory);
  });

  it.each([
    ["Motor saya waktunya ganti plat, syaratnya apa aja?", 48, "Pajak"],
    ["Ganti plat harus cek fisik ya?", 48, "Pajak"],
    ["Bisa ganti plat di Samsat Keliling gak?", 133, "Samsat Keliling"],
    ["Mobil masih kredit dan BPKB di leasing, kalau ganti plat gimana?", 48, "Pajak"],
    ["Kalau plat nomor rusak dan tulisannya sudah gak jelas bisa diganti?", 66, "Dokumen"],
    ["Saya sudah bayar lewat SIGNAL tapi statusnya belum berubah.", 143, "Pengaduan"],
    ["Min saya kemarin sudah bayar pajak kendaraan lewat aplikasi SIGNAL dan saldo rekening juga sudah terpotong, tapi waktu saya cek status pembayarannya belum berubah. Kalau seperti ini saya harus bayar ulang atau menunggu dulu?", 143, "Pengaduan"],
    ["Uang sudah terpotong tapi pembayaran pajak gagal, gimana?", 143, "Pengaduan"],
    ["Saya salah memasukkan nomor polisi di aplikasi, gimana?", 143, "Pengaduan"],
    ["Katanya BBNKB kendaraan bekas gratis, kok masih ada biaya?", 40, "Pajak"],
    ["Balik nama gratis itu maksudnya semua biaya gratis?", 40, "Pajak"]
  ] as const)("menjaga intent pertanyaan natural hasil audit: %s", (input, expectedId, expectedCategory) => {
    const result = matchFaq(input);

    expect(result?.entry.id).toBe(expectedId);
    expect(result?.entry.category).toBe(expectedCategory);
  });

  it.each([
    [
      "Min saya kemarin kena musibah banjir, motor sempat terendam dan plat nomor depannya hilang kebawa air, tapi STNK sama BPKB masih ada. Kalau saya mau bikin plat nomor baru itu harus bikin surat kehilangan dari polisi dulu atau bisa langsung datang ke Samsat?",
      67,
      "Dokumen"
    ],
    [
      "Saya mau tanya, beberapa hari lalu motor saya kena banjir dan setelah air surut ternyata STNK yang disimpan di motor sama plat nomornya hilang. Kalau dua-duanya hilang seperti ini saya harus mengurus surat kehilangan dulu atau bagaimana alurnya?",
      67,
      "Dokumen"
    ],
    [
      "Min saya mau mengurus plat nomor yang hilang karena kemarin kebawa banjir. Saya sempat tanya katanya tidak perlu surat kehilangan, tapi pas cari informasi lain katanya harus pakai surat kehilangan dari kepolisian. Kalau mau mengurusnya di Samsat sebenarnya dokumen yang benar-benar harus saya siapkan apa saja?",
      67,
      "Dokumen"
    ],
    [
      "Min saya baru beli motor bekas dari orang, tapi ternyata nama di STNK masih pemilik yang sebelumnya lagi dan saya juga tidak punya fotokopi KTP orang yang namanya ada di STNK. Kalau pajaknya sebentar lagi habis saya masih bisa bayar pajak atau harus balik nama dulu?",
      84,
      "Balik Nama"
    ],
    [
      "Saya mau bayar pajak motor punya bapak saya, tapi bapak saya sudah meninggal beberapa waktu lalu dan STNK masih atas nama beliau. Kalau saya sebagai anak mau bayar pajaknya itu bisa langsung atau kendaraannya harus dibalik nama dulu?",
      80,
      "Balik Nama"
    ],
    [
      "Bapak saya sudah meninggal dan STNK motor masih atas nama beliau, saya mau bayar pajak tahunan apakah harus balik nama dulu?",
      80,
      "Balik Nama"
    ],
    [
      "Saya beli motor bekas dari teman, tapi teman saya ternyata beli juga dari orang lain dan belum pernah balik nama, jadi nama di STNK bukan nama teman saya. Kalau sekarang saya mau balik nama langsung ke nama saya sendiri itu prosesnya bagaimana?",
      79,
      "Balik Nama"
    ],
    [
      "Ayah saya meninggal dan meninggalkan kendaraan yang sampai sekarang STNK dan BPKB-nya masih atas nama beliau. Keluarga berencana kendaraan tersebut mau saya gunakan dan dibalik nama ke nama saya. Kalau kasus kendaraan warisan seperti ini apa saja yang harus dipersiapkan?",
      71,
      "Balik Nama"
    ],
    [
      "mau nanya min motor saya beli second udah lama cuma blm sempet balik nama sekarang pajaknya mau abis tapi ktp yang punya lama ga ada dan orangnya juga udah ga tau dimana, itu masih bisa bayar pajak ga ya atau saya harus balik nama dulu?",
      84,
      "Balik Nama"
    ],
    [
      "Min motor saya masih kredit dan BPKB masih di leasing, kebetulan tahun ini waktunya pajak lima tahunan sekaligus ganti plat. Kalau BPKB aslinya masih di leasing apakah saya tetap bisa mengurus pajak lima tahunan?",
      48,
      "Pajak"
    ],
    [
      "Saya sekarang kerja di luar kota dan motor saya ikut dibawa ke tempat saya kerja, tapi sebentar lagi sudah waktunya ganti plat lima tahunan. Apa motornya harus dibawa pulang ke Samsat asal atau bisa cek fisik di Samsat terdekat?",
      48,
      "Pajak"
    ],
    [
      "Min saya rencana besok mau ke Samsat Bandung Timur karena kebetulan sedang libur kerja dan rumah saya lumayan jauh. Saya mau bayar pajak lima tahunan motor sekaligus ganti plat. Saya takut sudah jauh-jauh datang ternyata dokumennya kurang, jadi sebenarnya apa saja yang harus saya bawa dan apakah motornya juga wajib dibawa?",
      48,
      "Pajak"
    ],
    [
      "Saya sekarang sudah tinggal dan kerja di Bandung tapi motor saya masih plat luar Jawa Barat. Kalau saya mau bayar pajak tahunan apakah bisa dilakukan di Samsat Bandung Timur atau harus pulang ke daerah asal kendaraan?",
      98,
      "Mutasi"
    ],
    [
      "Min saya beli motor bekas plat Jakarta dan sekarang saya tinggal di Bandung. Saya ingin platnya jadi Bandung sekaligus STNK-nya dibalik nama menjadi nama saya sendiri. Apakah mutasi dan balik nama bisa diurus sekaligus dan saya harus mulai mengurus dari Samsat mana?",
      101,
      "Mutasi"
    ],
    [
      "Saya beli motor plat Jakarta mau mutasi dan balik nama ke nama saya sendiri, mulai dari mana?",
      101,
      "Mutasi"
    ],
    [
      "Saya punya motor lama yang sudah beberapa tahun tidak dipakai jadi pajaknya juga sudah mati cukup lama. Sekarang motornya mau saya pakai lagi dan saya ingin mengaktifkan surat-suratnya, kira-kira saya harus mulai mengurus dari mana?",
      33,
      "Pajak"
    ],
    [
      "Saya kehilangan dompet dan kebetulan STNK motor ada di dalamnya, sedangkan BPKB motor masih disimpan pihak leasing karena motor belum lunas. Kalau saya mau mengurus STNK yang hilang itu bagaimana ya, apakah tetap bisa diproses?",
      54,
      "Dokumen"
    ],
    [
      "Saya mau bayar pajak motor tahunan yang sudah telat beberapa bulan, tapi saya juga baru sadar STNK saya hilang. Kalau kondisinya seperti ini apakah saya harus mengurus STNK yang hilang terlebih dahulu atau bisa sekalian membayar pajaknya?",
      42,
      "Pajak"
    ],
    [
      "Saya baru pertama kali bayar pajak kendaraan secara online lewat SIGNAL dan pembayarannya sudah berhasil. Tapi saya bingung setelah itu apakah masih harus datang ke Samsat untuk pengesahan STNK atau semuanya sudah selesai secara online?",
      127,
      "SIGNAL"
    ],
    [
      "Kalau pembayaran SIGNAL sudah berhasil, QR Code E-Pengesahan dan E-TBPKP itu sudah cukup atau STNK fisik tetap harus disimpan?",
      127,
      "SIGNAL"
    ],
    [
      "Min beberapa waktu lalu motor saya mengalami kecelakaan dan plat nomor bagian depannya rusak sampai bengkok dan tulisannya sudah tidak terbaca jelas. Kalau saya mau mengganti dengan plat baru apakah harus menunggu masa ganti plat lima tahunan atau bisa diurus sekarang?",
      66,
      "Dokumen"
    ],
    [
      "Min saya beli motor bekas sekitar dua tahun lalu tapi sampai sekarang belum balik nama dan nama di STNK masih pemilik lama. Sekarang pajaknya sudah telat, sebentar lagi masuk waktu ganti plat lima tahunan, sementara saya sudah tidak punya kontak pemilik sebelumnya dan KTP-nya juga tidak ada. Kalau saya mau membereskan semuanya supaya kendaraan bisa atas nama saya sendiri, saya harus mulai dari proses apa dulu?",
      84,
      "Balik Nama"
    ]
  ] as const)("menangani pertanyaan random panjang hasil stress test: %s", (input, expectedId, expectedCategory) => {
    const result = matchFaq(input);

    expect(result?.entry.id).toBe(expectedId);
    expect(result?.entry.category).toBe(expectedCategory);
  });

  it("mengembalikan null jika tidak ada pola FAQ yang cukup cocok", () => {
    expect(matchFaq("halo admin selamat pagi")).toBeNull();
  });

  it("menjaga skor pertanyaan panjang yang relevan tetap aman", () => {
    const shortQuestion = matchFaq("mutasi");
    const longQuestion = matchFaq("Kalau begitu mobil saya Toyota, kalau mau di mutasi apa syaratnya?");

    expect(shortQuestion?.entry.id).toBe(90);
    expect(longQuestion?.entry.id).toBe(90);
    expect(shortQuestion?.score).toBeGreaterThanOrEqual(75);
    expect(longQuestion?.score).toBeGreaterThanOrEqual(75);
  });

  it.each([
    "Kalau begitu syarat saya mencintai dia?",
    "Kalau begitu apa saja kekurangan dari bot ini?",
    "Kalau saya punya pacar, mobil saya dipinjam pacar, apakah saya harus marah?",
    "Bagaimana cara memasak nasi goreng?",
    "Apakah besok akan hujan?",
    "Siapa presiden Indonesia?",
    "Kenapa laptop saya lambat?",
    "Apa obat untuk sakit kepala?",
    "Berapa hasil 25 dikali 12?",
    "Siapa yang menang pertandingan sepak bola tadi malam?",
    "Mobil saya warna merah, bagusnya diberi nama apa?",
    "Motor saya dipinjam teman, kapan harus diminta kembali?",
    "Apakah tersedia toilet di pusat perbelanjaan?",
    "Lokasi samsat bandung barat?",
    "Apakah cek fisik harus ngegym?",
    "Apa itu mutasi genetik?",
    "Bagaimana cara membayar pajak cinta?",
    "Apakah SIGNAL wifi saya rusak?",
    "STNK adalah singkatan sayang tanpa kenal?",
    "pajak kendaraan di Jepang bagaimana cara menghitungnya?",
    "pajak kendaraan listrik Tesla di Amerika berapa?",
    "samsat jakarta timur buka jam berapa?",
    "cara bayar pajak kendaraan di DKI Jakarta?",
    "ganti pelat nama rumah yang rusak harus bagaimana?",
    "status pembayaran marketplace belum berubah lewat aplikasi signal wifi",
    "balik nama sertifikat tanah warisan bapak meninggal bagaimana?",
    "pajak tahunan perusahaan saya di luar negeri bagaimana?",
    "nomor polisi hilang saat main game, apa harus lapor?",
    "Kalau motor saya mogok, apakah bisa diperbaiki di Samsat Bandung Timur?",
    "Di Samsat Bandung Timur bisa bikin SIM baru sekalian bayar pajak motor nggak?",
    "Saya kehilangan kartu ATM saat mau bayar pajak, apakah bisa dibuat ulang di Samsat?",
    "BPKB saya ada, tapi kunci motor saya hilang. Apakah Samsat bisa membuatkan kunci baru?",
    "Plat nomor motor saya Bandung, kalau mau ganti warna motor harus beli cat di Samsat?",
    "Pajak motor saya sudah dibayar, apakah Samsat juga bisa membayar tagihan listrik rumah saya?",
    "Saya mau bayar pajak motor sambil perpanjang paspor, bisa dilakukan di Samsat Bandung Timur?",
    "Apakah bayar pajak kendaraan harus datang ke tempat gym?"
  ])("menolak pertanyaan di luar topik: %s", (input) => {
    expect(matchFaq(input)).toBeNull();
  });

  it.each([
    ["berapa pajak mobil saya", "Pajak"],
    ["syarat mutasi mobil", "Mutasi"],
    ["bagaimana jika STNK hilang", "Dokumen"],
    ["apa syarat balik nama", "Balik Nama"],
    ["apakah perlu cek fisik", "Cek Fisik"],
    ["dimana lokasi cek fisik kendaraan", "Cek Fisik"],
    ["apakah cek fisik wajib untuk mutasi", "Cek Fisik"],
    ["Apakah tersedia toilet", "Fasilitas"]
  ] as const)("tetap menerima pertanyaan Samsat: %s", (input, category) => {
    expect(matchFaq(input)?.entry.category).toBe(category);
  });

  it.each([
    ["jam buka samsat bandung timur", "Layanan"],
    ["cara cek pajak kendaraan online", "Pajak"],
    ["apa fungsi BPKB", "Dokumen"],
    ["dokumen untuk balik nama mobil", "Balik Nama"],
    ["syarat pindah domisili kendaraan", "Mutasi"],
    ["dimana cek fisik kendaraan", "Cek Fisik"],
    ["cara daftar aplikasi SIGNAL", "SIGNAL"],
    ["layanan samsat keliling apa saja", "Samsat Keliling"],
    ["apakah samsat punya tempat parkir", "Fasilitas"],
    ["cara komplain layanan samsat", "Pengaduan"]
  ] as const)("mengenali variasi kategori Samsat: %s", (input, category) => {
    expect(matchFaq(input)?.entry.category).toBe(category);
  });
});

describe("matchMultipleFaq", () => {
  it.each([
    [
      "STNK saya hilang dan pajak motor mati bertahun tahun gimana?",
      [54, 33]
    ],
    [
      "Saya mau balik nama motor bekas, terus ganti plat lima tahunan syaratnya apa?",
      [73, 48]
    ],
    [
      "Mutasi dan balik nama gimana?",
      [90, 73]
    ]
  ] as const)("mendeteksi beberapa intent dalam satu pesan: %s", (input, expectedIds) => {
    expect(matchMultipleFaq(input).map((result) => result.entry.id)).toEqual(expectedIds);
  });

  it("membatasi jumlah jawaban agar chat tidak terlalu panjang", () => {
    const resultIds = matchMultipleFaq(
      "STNK hilang, BPKB hilang, mutasi, balik nama, dan ganti plat lima tahunan",
      2
    ).map((result) => result.entry.id);

    expect(resultIds).toHaveLength(2);
    expect(new Set(resultIds).size).toBe(2);
  });

  it("tetap mengembalikan satu jawaban untuk pertanyaan tunggal", () => {
    expect(matchMultipleFaq("Kalau stnk hilang bagaimana?").map((result) => result.entry.id)).toEqual([54]);
  });

  it("menolak pesan multi-intent jika mengandung layanan di luar Samsat", () => {
    expect(
      matchMultipleFaq(
        "Saya mau bayar pajak motor sambil perpanjang paspor, bisa dilakukan di Samsat Bandung Timur?"
      )
    ).toEqual([]);
  });
});

describe("getCategory", () => {
  it("menormalisasi label callback kategori", () => {
    expect(getCategory("layanan tambahan")).toBe("Layanan Tambahan");
  });
});
