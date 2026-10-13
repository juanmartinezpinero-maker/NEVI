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

describe("racha de días", async () => {
  const { streakFrom } = await import("@/lib/streak");
  const today = new Date("2026-10-12T10:00:00Z");
  it("cuenta días seguidos hasta hoy o ayer", () => {
    expect(streakFrom(["2026-10-12", "2026-10-11", "2026-10-10", "2026-10-08"], today)).toBe(3);
    expect(streakFrom(["2026-10-11", "2026-10-10"], today)).toBe(2);
    expect(streakFrom(["2026-10-09"], today)).toBe(0);
    expect(streakFrom([], today)).toBe(0);
  });
});
