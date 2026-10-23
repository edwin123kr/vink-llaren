import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Svar } from "./Svar";

describe("Svar (sommelierns markdown)", () => {
  it("renderar stycken, listor, fetstil och länkar", () => {
    const html = renderToStaticMarkup(<Svar text={"Hej **Barolo**!\n\n- ett\n- två\n\n1. först\n\n### Rubrik\nSe [källa](https://example.com)."} />);
    expect(html).toContain("<strong");
    expect(html).toContain("<ul");
    expect(html).toContain("<ol");
    expect(html).toContain("<h3");
    expect(html).toContain('href="https://example.com"');
  });

  it("släpper inte igenom HTML eller farliga länkar", () => {
    const html = renderToStaticMarkup(<Svar text={'<script>alert(1)</script> [x](javascript:alert(1))'} />);
    expect(html).not.toContain("<script>");
    expect(html).not.toContain('href="javascript');
  });
});
