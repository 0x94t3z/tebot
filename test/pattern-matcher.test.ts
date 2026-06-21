import { describe, expect, it } from "vitest";
import { faqEntries } from "../src/faq-data";
import { getCategory, getEntriesByCategory, matchFaq } from "../src/pattern-matcher";

describe("FAQ dataset", () => {
  it("memiliki 100 baris FAQ yang diimpor", () => {
    expect(faqEntries).toHaveLength(100);
  });

  it.each([
    ["Layanan", 10],
    ["Pajak", 10],
    ["Dokumen", 10],
    ["Balik Nama", 10],
    ["Mutasi", 10],
    ["Layanan Tambahan", 15],
    ["Sistem", 10],
    ["Perkembangan", 5],
    ["Umum", 20]
  ] as const)("memetakan kategori %s ke %s baris", (category, count) => {
    expect(getEntriesByCategory(category)).toHaveLength(count);
  });
});

describe("matchFaq", () => {
  it.each([
    ["alamat samsat bandung timur", 6, "Layanan"],
    ["samsat buka hari sabtu?", 4, "Layanan"],
    ["syarat bayar pajak kendaraan", 15, "Pajak"],
    ["bisa bayar pajak online?", 16, "Pajak"],
    ["stnk saya hilang", 26, "Dokumen"],
    ["dokumen balik nama", 32, "Balik Nama"],
    ["alur mutasi kendaraan", 43, "Mutasi"],
    ["jadwal samsat keliling", 53, "Layanan Tambahan"],
    ["apa itu pattern matching", 69, "Sistem"],
    ["antrian samsat ramai", 93, "Umum"]
  ] as const)("mencocokkan %s", (input, expectedId, expectedCategory) => {
    const result = matchFaq(input);

    expect(result?.entry.id).toBe(expectedId);
    expect(result?.entry.category).toBe(expectedCategory);
  });

  it("mengembalikan null jika tidak ada pola FAQ yang cukup cocok", () => {
    expect(matchFaq("halo admin selamat pagi")).toBeNull();
  });
});

describe("getCategory", () => {
  it("menormalisasi label callback kategori", () => {
    expect(getCategory("layanan tambahan")).toBe("Layanan Tambahan");
  });
});
