import { afterEach, describe, expect, it, vi } from "vitest";
import { slaUppOff } from "./openfoodfacts";

const svar = (status: number, body: unknown) => Promise.resolve(new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } }));

afterEach(() => vi.unstubAllGlobals());

describe("Open Food Facts-uppslag", () => {
  it("normaliserar en vinträff och skickar egen User-Agent", async () => {
    const fetchMock = vi.fn(() =>
      svar(200, { status: 1, product: { code: "2000000000011", product_name: "Testvin", brands: "Testgård", categories_tags: ["en:wines", "en:white-wines"], quantity: "75 cl", origins_tags: ["en:germany"] } }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const r = await slaUppOff("2000000000011");
    expect(r.status).toBe("hittad");
    if (r.status === "hittad") expect(r.dryck).toMatchObject({ namn: "Testvin", kategori: "vitt", land: "Tyskland", volymMl: 750, kalla: "openfoodfacts", licens: "ODbL-1.0" });
    const init = (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1];
    expect(String((init.headers as Record<string, string>)["User-Agent"])).toMatch(/^Vinkallaren\//);
  });
  it("känner igen produkter som inte är vin eller sprit", async () => {
    vi.stubGlobal("fetch", vi.fn(() => svar(200, { status: 1, product: { code: "2000000000035", product_name: "Testöl", categories_tags: ["en:beers"] } })));
    expect(await slaUppOff("2000000000035")).toEqual({ status: "inte-dryck", namn: "Testöl" });
  });
  it("hanterar saknade produkter", async () => {
    vi.stubGlobal("fetch", vi.fn(() => svar(404, { status: 0 })));
    expect((await slaUppOff("2000000000042")).status).toBe("saknas");
  });
  it("hanterar nätverksfel", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("offline"))));
    expect((await slaUppOff("2000000000059")).status).toBe("fel");
  });
});
