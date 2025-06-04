import { STATUS } from "./statusConstants.js";

export class GlitchType {
    constructor() {
        /** @type {import("./GlitchTypes.js").PendingFix|null} */
        this._pending = null;
        /** @type {import("./Glitchdle.js").Glitchdle} */
        this.game = null;
    }

    /**
     * Apply this glitch strategy to a feedback array.
     * @param {string[]} feedback  – honest ["gray","yellow","green",…]
     * @param {string} guess       – the current guess word
     * @returns {{ mutated: string[], toFix: PendingFix|null }}
     */
    apply(feedback, guess) {
        throw new Error("Must override");
    }
}

/**
 * Helper to pick a tile and put wrong color
 * @param {string[]} feedback
 * @returns {{ mutated: string[], idx: number, original: string }}
 */
export function pickFalseFeedback(feedback) {
    const idx = Math.floor(Math.random() * feedback.length);
    const original = feedback[idx];
    const choices = Object.values(STATUS).filter(c => c !== original);
    const mutated = [...feedback];
    mutated[idx] = choices[Math.floor(Math.random() * choices.length)];
    return { mutated, idx, original };
}