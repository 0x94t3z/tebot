import { describe, expect, it } from "vitest";
import {
  buildDirectFaqMessage,
  buildFaqMessage,
  buildCategoryMessage,
  buildQuestionKeyboard,
  buildStartMessage,
  buildUnknownMessage,
  buildUnsupportedMessage,
  mainMenu,
  buildRatingKeyboard
} from "../src/replies";

describe("tampilan kategori FAQ", () => {
  it("menampilkan maksimal 7 pertanyaan tanpa nomor ID pada halaman pertama", () => {
    const message = buildCategoryMessage("Mutasi");
    const questionLines = message.split("\n").filter((line) => line.startsWith("- "));
    const keyboard = buildQuestionKeyboard("Mutasi");
    const questionButtons = keyboard.inline_keyboard.filter((row) => row[0]?.callback_data?.startsWith("faq:"));

    expect(questionLines).toHaveLength(7);
    expect(questionLines[0]).toBe("- Apa itu mutasi kendaraan");
    expect(questionLines.some((line) => /^\- \d+\./.test(line))).toBe(false);
    expect(questionButtons).toHaveLength(7);
    expect(questionButtons[0][0].text).toBe("Apa itu mutasi kendaraan");
  });

  it("menampilkan tombol berikutnya dan sebelumnya sesuai halaman kategori", () => {
    const firstPageKeyboard = buildQuestionKeyboard("Mutasi", 0);
    const secondPageKeyboard = buildQuestionKeyboard("Mutasi", 1);

    expect(JSON.stringify(firstPageKeyboard)).toContain("Berikutnya ➡️");
    expect(JSON.stringify(firstPageKeyboard)).not.toContain("⬅️ Sebelumnya");
    expect(JSON.stringify(secondPageKeyboard)).toContain("⬅️ Sebelumnya");
    expect(JSON.stringify(secondPageKeyboard)).toContain("Berikutnya ➡️");
    expect(JSON.stringify(secondPageKeyboard)).toContain("↩️ Kembali ke kategori");
  });

  it("menampilkan icon pada menu kategori utama", () => {
    expect(JSON.stringify(mainMenu)).toContain("cat:Layanan");
    expect(JSON.stringify(mainMenu)).toContain("cat:Pajak");
    expect(JSON.stringify(mainMenu)).toContain("cat:Pengaduan");
  });

  it("menampilkan tombol rating 1 sampai 5", () => {
    const ratingKeyboard = buildRatingKeyboard(15);

    expect(JSON.stringify(ratingKeyboard)).toContain("rate:1");
    expect(JSON.stringify(ratingKeyboard)).toContain("rate:15:1");
    expect(JSON.stringify(ratingKeyboard)).toContain("rate:15:5");
  });
});

describe("format jawaban FAQ", () => {
  it("menampilkan greeting formal pada pesan pembuka", () => {
    const message = buildStartMessage();

    expect(message).toContain("Selamat datang di Chatbot FAQ SAMSAT Bandung Timur.");
    expect(message).toContain("Silakan pilih kategori atau ketik pertanyaan Anda.");
    expect(message).toContain("Contoh:");
    expect(message).toContain("Ketik /clear untuk membersihkan chat.");
    expect(message).not.toContain("Dataset aktif");
    expect(message).not.toContain("Profil Telegram");
  });

  it("menampilkan pertanyaan, jawaban, dan sumber pada hasil pattern matching", () => {
    const message = buildFaqMessage({
      entry: {
        id: 999,
        category: "Pajak",
        question: "Syarat bayar pajak",
        answer: "STNK dan KTP",
        source: "Referensi"
      },
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
    const message = buildDirectFaqMessage({
      id: 998,
      category: "Dokumen",
      question: "STNK hilang",
      answer: "Harus lapor polisi",
      source: "Referensi"
    });

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

  it("menampilkan fallback khusus untuk pesan di luar topik", () => {
    const message = buildUnknownMessage();

    expect(message).toContain("hanya dapat menjawab pertanyaan seputar layanan SAMSAT Bandung Timur");
    expect(message).toContain("Pesan Anda tidak terkait");
  });
});
