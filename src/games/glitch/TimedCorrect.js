import { GlitchType, pickFalseFeedback } from "./GlitchType.js";

// One wrong color, then correct it on the next guess
export class TimedCorrect extends GlitchType {
    apply(feedback, guess) {
        const toFix = this._pending;
        const { mutated, idx, original } = pickFalseFeedback(feedback);

        // schedule correction for the current row (which will be marked completed)
        this._pending = {
            rowIndex: this.game.currentRow, 
            idx,
            originalColor: original,
            letter: guess[idx]
        };

        const result = { mutated, toFix };
        return result;
    }
}