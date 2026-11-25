import { describe, it, expect } from "vitest";
import { slugify, stripDiacritics, generateListingSlug } from "@/lib/slug";

describe("slugify", () => {
  it("strips all Czech diacritics accurately", () => {
    expect(stripDiacritics("ěščřžýáíéúůďťň ĚŠČŘŽÝÁÍÉÚŮĎŤŇ")).toBe("escrzyaieuudtn ESCRZYAIEUUDTN");
    expect(slugify("Příliš žluťoučký kůň úpěl ďábelské ódy")).toBe(
      "prilis-zlutoucky-kun-upel-dabelske-ody",
    );
  });

  it("handles Czech city districts and dispositions", () => {
    expect(slugify("Praha 5 – Smíchov")).toBe("praha-5-smichov");
    expect(slugify("Ústí nad Labem")).toBe("usti-nad-labem");
    expect(slugify("České Budějovice")).toBe("ceske-budejovice");
    expect(slugify("3+kk")).toBe("3-kk");
  });

  it("generates listing slug in canonical format", () => {
    const slug = generateListingSlug({
      category: "flat",
      disposition: "3+kk",
      locationName: "Praha 5 – Smíchov",
      area: 78.4,
      suffix: "a1b2c3",
    });
    expect(slug).toBe("byt-3-kk-praha-5-smichov-78m2-a1b2c3");
  });
});
