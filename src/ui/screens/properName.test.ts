import { describe, expect, it } from "vitest";
import { properName } from "./PartyScreen";

describe("player names", () => {
  it("are capitalised for headlines, keeping Portuguese particles lowercase", () => {
    expect(properName("joaquim aguiar")).toBe("Joaquim Aguiar");
    expect(properName("  maria   da conceição dos santos ")).toBe("Maria da Conceição dos Santos");
    expect(properName("Ana McLaren")).toBe("Ana McLaren"); // never lowercase what the player typed
  });
});
