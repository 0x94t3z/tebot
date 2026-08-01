import { describe, expect, it, vi } from "vitest";
import { handleUpdate } from "../src/index";

class MemoryKv {
  private readonly values = new Map<string, string>();

  async get(key: string) {
    return this.values.get(key) ?? null;
  }

  async put(key: string, value: string) {
    this.values.set(key, value);
  }
}

describe("voting kepuasan", () => {
  it("tidak mengirim menu pembuka sebagai pesan baru setelah jawaban FAQ", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const fetchSpy = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      new Response(JSON.stringify({ ok: true, result: { message_id: 21 } }), { status: 200 })
    );

    vi.stubGlobal("fetch", fetchSpy);

    try {
      await handleUpdate({
        update_id: 10,
        message: {
          message_id: 20,
          from: { id: 5565698191, first_name: "Khang" },
          chat: { id: 999 },
          text: "Apa itu Samsat"
        }
      }, {
        BOT_TOKEN: "test-token"
      } as never);

      const sendMessageCalls = fetchSpy.mock.calls.filter(([input]) => String(input).includes("/sendMessage"));

      expect(sendMessageCalls).toHaveLength(1);
      expect(JSON.stringify(sendMessageCalls[0][1])).toContain("vote:1:");
      expect(JSON.stringify(sendMessageCalls[0][1])).not.toContain("Selamat datang di Chatbot FAQ SAMSAT Bandung Timur.");
    } finally {
      vi.unstubAllGlobals();
      logSpy.mockRestore();
    }
  });

  it("tidak mengirim menu pembuka sebagai pesan baru setelah memilih FAQ dari menu", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const fetchSpy = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      new Response(JSON.stringify({ ok: true, result: true }), { status: 200 })
    );

    vi.stubGlobal("fetch", fetchSpy);

    try {
      await handleUpdate({
        update_id: 11,
        callback_query: {
          id: "callback-faq",
          from: { id: 5565698191, first_name: "Khang" },
          data: "faq:1",
          message: {
            message_id: 30,
            chat: { id: 999 }
          }
        }
      }, {
        BOT_TOKEN: "test-token"
      } as never);

      const calledUrls = fetchSpy.mock.calls.map(([input]) => String(input)).join("\n");

      expect(calledUrls).toContain("/answerCallbackQuery");
      expect(calledUrls).toContain("/editMessageText");
      expect(calledUrls).not.toContain("/sendMessage");
    } finally {
      vi.unstubAllGlobals();
      logSpy.mockRestore();
    }
  });

  it("menghapus tombol voting dan mengirim menu pembuka setelah voting pada jawaban multi-FAQ", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const researchStore = new MemoryKv();
    let nextMessageId = 100;
    const fetchSpy = vi.fn(async (input: RequestInfo | URL, _init?: RequestInit) => {
      const url = String(input);

      if (url.includes("/sendMessage")) {
        return new Response(JSON.stringify({ ok: true, result: { message_id: nextMessageId++ } }), { status: 200 });
      }

      if (url.includes("/answerCallbackQuery") || url.includes("/editMessageText")) {
        return new Response(JSON.stringify({ ok: true, result: true }), { status: 200 });
      }

      return new Response(JSON.stringify({ ok: true, result: true }), { status: 200 });
    });

    vi.stubGlobal("fetch", fetchSpy);

    try {
      await handleUpdate({
        update_id: 12,
        message: {
          message_id: 50,
          from: { id: 5565698191, first_name: "Khang" },
          chat: { id: 999 },
          text: "STNK saya hilang dan pajak motor mati bertahun tahun gimana?"
        }
      }, {
        BOT_TOKEN: "test-token",
        RESEARCH_STORE: researchStore
      } as never);

      const sendMessageCallsAfterAnswers = fetchSpy.mock.calls.filter(([input]) => String(input).includes("/sendMessage"));
      const sendMessageBodiesAfterAnswers = sendMessageCallsAfterAnswers.map(([, init]) => JSON.stringify(init)).join("\n");
      const answerPayloads = sendMessageCallsAfterAnswers.map(([, init]) => JSON.parse(String(init?.body ?? "{}")) as {
        reply_markup?: { inline_keyboard?: Array<Array<{ callback_data?: string }>> };
      });
      const stnkSatisfiedCallback = findCallbackData(answerPayloads, "vote:54:s:");
      const pajakDissatisfiedCallback = findCallbackData(answerPayloads, "vote:33:d:");

      expect(sendMessageCallsAfterAnswers).toHaveLength(2);
      expect(sendMessageBodiesAfterAnswers).toContain("vote:54:");
      expect(sendMessageBodiesAfterAnswers).toContain("vote:33:");
      expect(sendMessageBodiesAfterAnswers).not.toContain("Selamat datang di Chatbot FAQ SAMSAT Bandung Timur.");
      expect(stnkSatisfiedCallback).toBeTruthy();
      expect(pajakDissatisfiedCallback).toBeTruthy();

      await handleUpdate({
        update_id: 13,
        callback_query: {
          id: "callback-multi-1",
          from: { id: 5565698191, first_name: "Khang" },
          data: stnkSatisfiedCallback,
          message: {
            message_id: 100,
            chat: { id: 999 }
          }
        }
      }, {
        BOT_TOKEN: "test-token",
        RESEARCH_STORE: researchStore
      } as never);

      await handleUpdate({
        update_id: 14,
        callback_query: {
          id: "callback-multi-2",
          from: { id: 5565698191, first_name: "Khang" },
          data: pajakDissatisfiedCallback,
          message: {
            message_id: 101,
            chat: { id: 999 }
          }
        }
      }, {
        BOT_TOKEN: "test-token",
        RESEARCH_STORE: researchStore
      } as never);

      const sendMessageCalls = fetchSpy.mock.calls.filter(([input]) => String(input).includes("/sendMessage"));
      const editMessageCalls = fetchSpy.mock.calls.filter(([input]) => String(input).includes("/editMessageText"));
      const sendMessageBodies = sendMessageCalls.map(([, init]) => JSON.stringify(init)).join("\n");
      const editMessagePayloads = editMessageCalls.map(([, init]) => JSON.parse(String(init?.body ?? "{}")) as {
        text: string;
        reply_markup?: { inline_keyboard?: unknown[] };
      });
      const editMessageTexts = editMessagePayloads.map((payload) => payload.text).join("\n");

      expect(sendMessageCalls).toHaveLength(3);
      expect(editMessageCalls).toHaveLength(2);
      expect(sendMessageBodies).toContain("Selamat datang di Chatbot FAQ SAMSAT Bandung Timur.");
      expect(sendMessageBodies).toContain("cat:Layanan");
      expect(editMessagePayloads.every((payload) => payload.reply_markup?.inline_keyboard?.length === 0)).toBe(true);
      expect(editMessageTexts).toContain("Hasil voting pengguna");
    } finally {
      vi.unstubAllGlobals();
      logSpy.mockRestore();
    }
  });

  it("memperbarui satu vote aktif per responden tanpa mengirim menu sebagai chat baru", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const researchStore = new MemoryKv();
    const env = {
      BOT_TOKEN: "test-token",
      TELEGRAM_DRY_RUN: "true",
      RESEARCH_STORE: researchStore
    };

    try {
      await handleUpdate({
        update_id: 1,
        callback_query: {
          id: "callback-1",
          from: { id: 5565698191, first_name: "Khang" },
          data: "vote:54:s",
          message: {
            message_id: 10,
            chat: { id: 999 }
          }
        }
      }, env as never);

      await handleUpdate({
        update_id: 2,
        callback_query: {
          id: "callback-2",
          from: { id: 5565698191, first_name: "Khang" },
          data: "vote:54:d",
          message: {
            message_id: 10,
            chat: { id: 999 }
          }
        }
      }, env as never);

      await handleUpdate({
        update_id: 3,
        callback_query: {
          id: "callback-3",
          from: { id: 999999999, first_name: "User Lain" },
          data: "vote:54:d",
          message: {
            message_id: 10,
            chat: { id: 999 }
          }
        }
      }, env as never);

      const stats = JSON.parse(await researchStore.get("research:faq_stats:54") ?? "{}");
      const firstUserVote = JSON.parse(await researchStore.get("research:faq_vote:54:5565698191") ?? "{}");
      const secondUserVote = JSON.parse(await researchStore.get("research:faq_vote:54:999999999") ?? "{}");
      const loggedCalls = logSpy.mock.calls.map(([value]) => String(value)).join("\n");

      expect(stats).toEqual({
        satisfied: 0,
        dissatisfied: 2
      });
      expect(firstUserVote.choice).toBe("dissatisfied");
      expect(secondUserVote.choice).toBe("dissatisfied");
      expect(loggedCalls).toContain('"changed":true');
      expect(loggedCalls).toContain('"saved_choice":"dissatisfied"');
      expect(loggedCalls).toContain('"method":"editMessageText"');
      expect(loggedCalls).toContain('"method":"sendMessage"');
      expect(loggedCalls).toContain("Selamat datang di Chatbot FAQ SAMSAT Bandung Timur.");
    } finally {
      logSpy.mockRestore();
    }
  });

  it("tidak mengirim chat baru saat edit pesan voting gagal", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const fetchSpy = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("/answerCallbackQuery")) {
        return new Response(JSON.stringify({ ok: true, result: true }), { status: 200 });
      }

      if (url.includes("/editMessageText")) {
        return new Response(JSON.stringify({ ok: false, description: "Bad Request: message is not modified" }), { status: 400 });
      }

      return new Response(JSON.stringify({ ok: true, result: { message_id: 99 } }), { status: 200 });
    });
    const researchStore = new MemoryKv();

    vi.stubGlobal("fetch", fetchSpy);

    try {
      await handleUpdate({
        update_id: 4,
        callback_query: {
          id: "callback-4",
          from: { id: 5565698191, first_name: "Khang" },
          data: "vote:54:d",
          message: {
            message_id: 10,
            chat: { id: 999 }
          }
        }
      }, {
        BOT_TOKEN: "test-token",
        RESEARCH_STORE: researchStore
      } as never);

      const calledUrls = fetchSpy.mock.calls.map(([input]) => String(input)).join("\n");

      expect(calledUrls).toContain("/answerCallbackQuery");
      expect(calledUrls).toContain("/editMessageText");
      expect(calledUrls).not.toContain("/sendMessage");
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('"mode":"edit_only"'));
    } finally {
      vi.unstubAllGlobals();
      logSpy.mockRestore();
    }
  });
});

function findCallbackData(
  payloads: Array<{ reply_markup?: { inline_keyboard?: Array<Array<{ callback_data?: string }>> } }>,
  prefix: string
) {
  for (const payload of payloads) {
    for (const row of payload.reply_markup?.inline_keyboard ?? []) {
      for (const button of row) {
        if (button.callback_data?.startsWith(prefix)) {
          return button.callback_data;
        }
      }
    }
  }

  return undefined;
}
