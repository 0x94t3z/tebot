import { describe, expect, it } from "vitest";
import faqEntriesJson from "../src/data/faq-samsat-bandung-timur.json";
import { faqCategories, faqEntries } from "../src/faq-data";
import { getCategory, getEntriesByCategory, matchFaq } from "../src/pattern-matcher";

describe("FAQ dataset", () => {
  it("mengimpor semua baris FAQ dari file JSON", () => {
    expect(faqEntries).toHaveLength(faqEntriesJson.length);
  });

  it("membuat daftar kategori otomatis dari dataset", () => {
    const categoriesFromDataset = [...new Set(faqEntriesJson.map((entry) => entry.category))];

    expect(faqCategories).toEqual(categoriesFromDataset);
  });

  it.each(faqCategories)("memetakan kategori %s sesuai isi dataset", (category) => {
    const count = faqEntriesJson.filter((entry) => entry.category === category).length;

    expect(getEntriesByCategory(category)).toHaveLength(count);
  });
});

describe("matchFaq", () => {
  it.each([
    ["alamat samsat bandung timur", 10, "Layanan"],
    ["samsat buka hari sabtu?", 7, "Layanan"],
    ["syarat bayar pajak kendaraan", 64, "Pajak"],
    ["bisa bayar pajak online?", 45, "Pajak"],
    ["stnk saya hilang", 76, "Dokumen"],
    ["dokumen balik nama", 105, "Balik Nama"],
    ["alur mutasi kendaraan", 136, "Mutasi"],
    ["jadwal samsat keliling", 196, "Samsat Keliling"],
    ["cek fisik kendaraan", 151, "Cek Fisik"],
    ["antrian samsat ramai", 26, "Layanan"]
  ] as const)("mencocokkan %s", (input, expectedId, expectedCategory) => {
    const result = matchFaq(input);

    expect(result?.entry.id).toBe(expectedId);
    expect(result?.entry.category).toBe(expectedCategory);
  });

  it("mengembalikan null jika tidak ada pola FAQ yang cukup cocok", () => {
    expect(matchFaq("halo admin selamat pagi")).toBeNull();
  });

  it("menolak pertanyaan di luar konteks yang hanya memuat satu kata mirip FAQ", () => {
    expect(matchFaq("Kalau begitu syarat saya mencitai dia?")).toBeNull();
    expect(matchFaq("Kalau begitu apa saja kekurangan dari bot ini?")).toBeNull();
  });

  it("tetap mencocokkan pertanyaan domain yang singkat", () => {
    const result = matchFaq("Kalau mau mutasi?");

    expect(result?.entry.question).toBe("Apa itu mutasi kendaraan");
    expect(result?.entry.category).toBe("Mutasi");
  });
});

describe("getCategory", () => {
  it("menormalisasi label callback kategori", () => {
    expect(getCategory("samsat keliling")).toBe("Samsat Keliling");
  });
});
