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
      expect(loggedCalls).not.toContain('"method":"sendMessage"');
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
