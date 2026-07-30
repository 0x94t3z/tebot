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

  async delete(key: string) {
    this.values.delete(key);
  }
}

describe("command clear", () => {
  it("menghapus pesan lama dari responden dan bot lalu menyisakan satu menu utama baru", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const messageStore = new MemoryKv();
    const chatId = 123456;
    const requests: Array<{ method: string; body: Record<string, unknown> }> = [];
    const fetchSpy = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const method = String(input).split("/").pop() ?? "";
      const body = JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>;
      requests.push({ method, body });

      if (method === "sendMessage") {
        return new Response(JSON.stringify({ ok: true, result: { message_id: 6 } }), { status: 200 });
      }

      return new Response(JSON.stringify({ ok: true, result: true }), { status: 200 });
    });

    await messageStore.put(`chat:${chatId}:message_ids`, JSON.stringify([1, 2, 4]));
    vi.stubGlobal("fetch", fetchSpy);

    try {
      await handleUpdate({
        update_id: 20,
        message: {
          message_id: 5,
          from: { id: 5565698191, first_name: "Khang" },
          chat: { id: chatId },
          text: "/clear"
        }
      }, {
        BOT_TOKEN: "test-token",
        MESSAGE_STORE: messageStore
      } as never);

      const sendMessageRequest = requests.find((request) => request.method === "sendMessage");
      const deleteMessagesRequest = requests.find((request) => request.method === "deleteMessages");
      const storedAfterClear = JSON.parse(await messageStore.get(`chat:${chatId}:message_ids`) ?? "[]");

      expect(sendMessageRequest?.body.text).toContain("Selamat datang di Chatbot FAQ SAMSAT Bandung Timur.");
      expect(deleteMessagesRequest?.body.message_ids).toEqual([5, 4, 3, 2, 1]);
      expect(deleteMessagesRequest?.body.message_ids).not.toContain(6);
      expect(storedAfterClear).toEqual([6]);
    } finally {
      vi.unstubAllGlobals();
      logSpy.mockRestore();
    }
  });
});
