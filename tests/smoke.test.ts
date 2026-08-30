import { describe, it, expect } from "vitest";
import { ANABRUNO_CHAT } from "./fixtures/chat";

describe("fixture smoke", () => {
    it("tem 19 mensagens e 2 participantes", () => {
        expect(ANABRUNO_CHAT.messages).toHaveLength(19);
        expect(ANABRUNO_CHAT.participants).toEqual(["Ana", "Bruno"]);
    });
});