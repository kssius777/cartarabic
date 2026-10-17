import { describe, expect, it } from "vitest";
import { choose, readSessionFromUrl } from "./cloud";
import { newSave, type Save } from "./rules";

const played = (answers: number): Save => ({
  ...newSave(),
  level: 1,
  history: {
    days: { "2026-10-16": [answers, answers] },
    levels: {},
    themes: {},
  },
});

describe("synchro du compte", () => {
  it("garde la partie qui a bougé depuis la dernière synchro", () => {
    const meta = { changedAt: 100, syncedAt: 100 };
    expect(choose(played(5), played(3), 200, meta)).toBe("remote");
    expect(
      choose(played(5), played(3), 50, { changedAt: 300, syncedAt: 100 }),
    ).toBe("local");
    expect(choose(played(5), played(3), 50, meta)).toBe("local");
  });

  it("si les deux ont bougé, garde celle où on a le plus joué", () => {
    const meta = { changedAt: 300, syncedAt: 100 };
    expect(choose(played(5), played(30), 200, meta)).toBe("remote");
    expect(choose(played(30), played(5), 200, meta)).toBe("local");
  });

  it("lit les jetons du lien de connexion", () => {
    const payload = btoa(
      JSON.stringify({ sub: "u1", email: "jijax@example.com" }),
    );
    const s = readSessionFromUrl(
      `#access_token=h.${payload}.s&refresh_token=r1&expires_in=3600&token_type=bearer`,
    );
    expect(s).toMatchObject({
      refresh_token: "r1",
      email: "jijax@example.com",
    });
    expect(readSessionFromUrl("#comment")).toBeNull();
  });
});
