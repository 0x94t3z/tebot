import { describe, expect, it } from "vitest";
import { faqEntries } from "../src/faq-data";
import { getCategory, getEntriesByCategory, matchFaq } from "../src/pattern-matcher";

describe("FAQ dataset", () => {
  it("memiliki 233 baris FAQ yang diimpor", () => {
    expect(faqEntries).toHaveLength(233);
  });

  it.each([
    ["Layanan", 35],
    ["Pajak", 40],
    ["Dokumen", 30],
    ["Balik Nama", 25],
    ["Mutasi", 25],
    ["Cek Fisik", 20],
    ["SIGNAL", 20],
    ["Samsat Keliling", 15],
    ["Fasilitas", 13],
    ["Pengaduan", 10]
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

  it.each([
    ["alamat samsat bandung timur", 10, "Layanan"],
    ["samsat buka hari sabtu?", 7, "Layanan"],
    ["Samsat di hari selasa buka jam berapa?", 5, "Layanan"],
    ["Kalau tutup jam berapa?", 6, "Layanan"],
    ["Kalau tutup operasional samsat jam berapa?", 6, "Layanan"],
    ["Kalau Sabtu?", 7, "Layanan"],
    ["Kalau Minggu?", 8, "Layanan"],
    ["Kalau mutasi?", 130, "Mutasi"],
    ["Kalau balik nama?", 105, "Balik Nama"],
    ["Kalau pajak online?", 45, "Pajak"],
    ["Kalau SIGNAL?", 171, "SIGNAL"],
    ["Kalau parkir?", 206, "Fasilitas"],
    ["Kalau komplain?", 219, "Pengaduan"],
    ["syarat bayar pajak kendaraan", 64, "Pajak"],
    ["bisa bayar pajak online?", 45, "Pajak"],
    ["stnk saya hilang", 76, "Dokumen"],
    ["dokumen balik nama", 105, "Balik Nama"],
    ["alur mutasi kendaraan", 130, "Mutasi"],
    ["kalau mau mutasi?", 130, "Mutasi"],
    ["Kalau begitu mobil saya Toyota, kalau mau di mutasi apa syaratnya?", 130, "Mutasi"],
    ["jadwal samsat keliling", 196, "Samsat Keliling"],
    ["apa itu signal", 171, "SIGNAL"]
  ] as const)("mencocokkan %s", (input, expectedId, expectedCategory) => {
    const result = matchFaq(input);

    expect(result?.entry.id).toBe(expectedId);
    expect(result?.entry.category).toBe(expectedCategory);
  });

  it("mengembalikan null jika tidak ada pola FAQ yang cukup cocok", () => {
    expect(matchFaq("halo admin selamat pagi")).toBeNull();
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
    "STNK adalah singkatan sayang tanpa kenal?"
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

describe("getCategory", () => {
  it("menormalisasi label callback kategori", () => {
    expect(getCategory("layanan tambahan")).toBe("Layanan Tambahan");
  });
});
