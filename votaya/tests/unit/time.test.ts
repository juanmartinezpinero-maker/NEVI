import { describe, expect, it } from "vitest";
import { timeAgo } from "@/lib/time";

describe("timeAgo", () => {
  const now = Date.parse("2026-10-12T12:00:00Z");
  it("formatea en español", () => {
    expect(timeAgo(new Date(now - 30_000), now)).toBe("Ahora mismo");
    expect(timeAgo(new Date(now - 2 * 3600_000), now)).toBe("Hace 2 horas");
    expect(timeAgo(new Date(now - 864e5), now)).toBe("Hace 1 día");
    expect(timeAgo(null, now)).toBe("");
  });
});
