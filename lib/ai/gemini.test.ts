import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { geminiStrom, geminiStrukturerat, tillDelar } from "./gemini";

const Schema = z.object({ namn: z.string(), argang: z.number().nullable() });

function svar(body: unknown, status = 200) {
  return new Response(typeof body === "string" ? body : JSON.stringify(body), { status });
}

beforeEach(() => {
  process.env.GEMINI_API_KEY = "test-nyckel";
});
afterEach(() => vi.unstubAllGlobals());

describe("Gemini", () => {
  it("konverterar text- och bildblock", () => {
    expect(tillDelar([{ type: "text", text: "hej" }, { type: "image", source: { media_type: "image/jpeg", data: "AAA" } }])).toEqual([{ text: "hej" }, { inlineData: { mimeType: "image/jpeg", data: "AAA" } }]);
  });

  it("skickar schema och bild, och tolkar svaret", async () => {
    const f = vi.fn().mockResolvedValue(svar({ candidates: [{ content: { parts: [{ text: '{"namn":"Barolo","argang":2019}' }] } }] }));
    vi.stubGlobal("fetch", f);
    const r = await geminiStrukturerat({ schema: Schema, system: "sys", content: [{ type: "image", source: { media_type: "image/jpeg", data: "AAA" } }, { type: "text", text: "läs" }] });
    expect(r).toEqual({ namn: "Barolo", argang: 2019 });
    const [url, init] = f.mock.calls[0];
    expect(url).toContain(":generateContent");
    expect(init.headers["x-goog-api-key"]).toBe("test-nyckel");
    const body = JSON.parse(init.body);
    expect(body.generationConfig.responseMimeType).toBe("application/json");
    expect(body.generationConfig.responseJsonSchema.properties.namn).toBeTruthy();
    expect(body.generationConfig.responseJsonSchema.$schema).toBeUndefined();
    expect(body.contents[0].parts[0].inlineData.data).toBe("AAA");
  });

  it("ger tydliga fel", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(svar({ error: { message: "API key not valid" } }, 400)));
    await expect(geminiStrukturerat({ schema: Schema, system: "", content: [] })).rejects.toThrow("nyckeln godkändes inte");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(svar({}, 429)));
    await expect(geminiStrukturerat({ schema: Schema, system: "", content: [] })).rejects.toThrow("gräns");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(svar({ candidates: [{ content: { parts: [{ text: "inte json" }] } }] })));
    await expect(geminiStrukturerat({ schema: Schema, system: "", content: [] })).rejects.toThrow("tolka");
  });

  it("strömmar text, sökningar och källor", async () => {
    const rad = (o: unknown) => `data: ${JSON.stringify(o)}\r\n\r\n`;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        svar(
          rad({ candidates: [{ content: { parts: [{ text: "Hej " }] }, groundingMetadata: { webSearchQueries: ["barolo 2019"] } }] }) +
            rad({ candidates: [{ content: { parts: [{ text: "världen" }] }, groundingMetadata: { groundingChunks: [{ web: { uri: "https://exempel.se/a", title: "Exempel" } }] } }] }),
        ),
      ),
    );
    const ut = [];
    for await (const h of geminiStrom("sys", [{ roll: "user", text: "a" }, { roll: "assistant", text: "b" }], "fråga")) ut.push(h);
    expect(ut).toEqual([
      { typ: "sok", fraga: "barolo 2019" },
      { typ: "text", text: "Hej " },
      { typ: "text", text: "världen" },
      { typ: "kallor", lista: [{ titel: "Exempel", url: "https://exempel.se/a" }] },
    ]);
  });
});
