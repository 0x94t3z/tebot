import faqEntriesJson from "./data/faq-samsat-bandung-timur.json";

export type FaqCategory = string;

// Struktur satu baris data FAQ.
export interface FaqEntry {
  id: number;
  category: FaqCategory;
  question: string;
  answer: string;
  source: string;
}

// Memuat dataset JSON dan memastikan struktur data valid.
export const faqEntries: FaqEntry[] = faqEntriesJson.map((entry, index) => {
  assertFaqEntry(entry, index);
  return entry;
});

// Daftar kategori dibuat otomatis dari dataset agar menu ikut berubah saat data diganti.
export const faqCategories = [...new Set(faqEntries.map((entry) => entry.category))];

// Validasi satu baris FAQ agar error dataset mudah ditemukan.
function assertFaqEntry(entry: unknown, index: number): asserts entry is FaqEntry {
  const row = entry as Partial<FaqEntry>;

  if (typeof row.id !== "number" || !Number.isInteger(row.id) || row.id <= 0) {
    throw new Error(`Invalid FAQ id at row ${index + 1}`);
  }

  for (const field of ["category", "question", "answer", "source"] as const) {
    if (typeof row[field] !== "string" || row[field]?.trim() === "") {
      throw new Error(`Invalid FAQ ${field} at row ${index + 1}`);
    }
  }
}
