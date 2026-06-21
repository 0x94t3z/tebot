import { describe, expect, it } from "vitest";
import { faqEntries } from "../src/faq-data";
import {
  buildDirectFaqMessage,
  buildFaqMessage,
  buildCategoryMessage,
  buildQuestionKeyboard,
  buildUnsupportedMessage,
  mainMenu,
  buildRatingKeyboard
} from "../src/replies";

describe("tampilan kategori FAQ", () => {
  it("menampilkan maksimal 7 pertanyaan tanpa nomor ID pada halaman pertama", () => {
    const message = buildCategoryMessage("Umum");
    const questionLines = message.split("\n").filter((line) => line.startsWith("- "));
    const keyboard = buildQuestionKeyboard("Umum");
    const questionButtons = keyboard.inline_keyboard.filter((row) => row[0]?.callback_data?.startsWith("faq:"));

    expect(questionLines).toHaveLength(7);
    expect(questionLines[0]).toBe("- Harus ke Samsat");
    expect(questionLines.some((line) => /^\- \d+\./.test(line))).toBe(false);
    expect(questionButtons).toHaveLength(7);
    expect(questionButtons[0][0].text).toBe("Harus ke Samsat");
  });

  it("menampilkan tombol berikutnya dan sebelumnya sesuai halaman kategori", () => {
    const firstPageKeyboard = buildQuestionKeyboard("Umum", 0);
    const secondPageKeyboard = buildQuestionKeyboard("Umum", 1);

    expect(JSON.stringify(firstPageKeyboard)).toContain("Berikutnya ➡️");
    expect(JSON.stringify(firstPageKeyboard)).not.toContain("⬅️ Sebelumnya");
    expect(JSON.stringify(secondPageKeyboard)).toContain("⬅️ Sebelumnya");
    expect(JSON.stringify(secondPageKeyboard)).toContain("Berikutnya ➡️");
    expect(JSON.stringify(secondPageKeyboard)).toContain("↩️ Kembali ke kategori");
  });

  it("menampilkan icon pada menu kategori utama", () => {
    expect(JSON.stringify(mainMenu)).toContain("🏢 Layanan");
    expect(JSON.stringify(mainMenu)).toContain("💰 Pajak");
    expect(JSON.stringify(mainMenu)).toContain("ℹ️ Umum");
  });

  it("menampilkan tombol rating 1 sampai 5", () => {
    const ratingKeyboard = buildRatingKeyboard(15);

    expect(JSON.stringify(ratingKeyboard)).toContain("rate:1");
    expect(JSON.stringify(ratingKeyboard)).toContain("rate:15:1");
    expect(JSON.stringify(ratingKeyboard)).toContain("rate:15:5");
  });
});

describe("format jawaban FAQ", () => {
  it("menampilkan pertanyaan, jawaban, dan sumber pada hasil pattern matching", () => {
    const message = buildFaqMessage({
      entry: faqEntries[14],
      score: 100,
      matchedTerms: ["syarat", "bayar", "pajak"]
    });

    expect(message).toBe("Pertanyaan: Syarat bayar pajak\n\nSTNK dan KTP\n\nSumber: Referensi\n\nSilakan beri rating untuk jawaban ini:");
    expect(message).not.toContain("Jawaban:");
    expect(message).not.toContain("Kategori:");
    expect(message).toContain("Pertanyaan:");
    expect(message).not.toContain("Metode:");
  });

  it("menampilkan pertanyaan, jawaban, dan sumber pada pilihan tombol FAQ", () => {
    const message = buildDirectFaqMessage(faqEntries[25]);

    expect(message).toBe("Pertanyaan: STNK hilang\n\nHarus lapor polisi\n\nSumber: Referensi\n\nSilakan beri rating untuk jawaban ini:");
    expect(message).not.toContain("Jawaban:");
    expect(message).not.toContain("Kategori:");
    expect(message).toContain("Pertanyaan:");
  });

  it("menampilkan panduan command pada pesan kategori", () => {
    const message = buildCategoryMessage("Pajak");

    expect(message).toContain("/start - tampilkan menu utama");
    expect(message).toContain("/clear - bersihkan chat");
    expect(message).not.toContain("/withdraw");
    expect(message).not.toContain("/consent - ikut data riset");
  });

  it("menampilkan pesan khusus untuk input selain teks", () => {
    const message = buildUnsupportedMessage();

    expect(message).toContain("Bot hanya mendukung pesan teks.");
    expect(message).toContain("/start - tampilkan menu utama");
    expect(message).toContain("/clear - bersihkan chat");
  });
});
