import { GlitchType, pickFalseFeedback } from "./GlitchType.js";
import { STATUS } from "./statusConstants.js";

// Roll 0–2 glitches each guess based on dice probabilities
export class DiceRoll extends GlitchType {
    constructor(hardMode = false) {
        super();
        this.hardMode = hardMode;
        this.diceRolls = null;
        this.percentages = null;
        this.feedbackHistory = [];  // Array of {guess, feedback, glitchedIndices}
    }

    rollDice() {
        this.diceRolls = {
            Zero: Math.floor(Math.random() * 6) + 1,
            One: Math.floor(Math.random() * 6) + 1,
            Two: Math.floor(Math.random() * 6) + 1
        };

        this.percentages = this.calculatePercentages();

        return this.diceRolls;
    }

    // Calculate the percentage chance for each option (0, 1, 2 false feedbacks)
    calculatePercentages() {
        const { Zero, One, Two } = this.diceRolls;

        // Special case: if all dice roll 1, Zero gets 100%
        if (Zero === 1 && One === 1 && Two === 1) {
            return { Zero: 100, One: 0, Two: 0 };
        }

        // Convert 1s to 0 weight, keep others as-is
        const weights = {
            Zero: Zero === 1 ? 0 : Zero,
            One: One === 1 ? 0 : One,
            Two: Two === 1 ? 0 : Two
        };

        const totalWeight = weights.Zero + weights.One + weights.Two;

        const rawPercentages = {
            Zero: (weights.Zero / totalWeight) * 100,
            One: (weights.One / totalWeight) * 100,
            Two: (weights.Two / totalWeight) * 100
        };

        // Round to integers and ensure they sum to 100
        return this.normalizePercentages(rawPercentages);
    }

    // Ensure percentages are integers that sum to 100
    normalizePercentages(raw) {
        let rounded = {
            Zero: Math.round(raw.Zero),
            One: Math.round(raw.One),
            Two: Math.round(raw.Two)
        };

        let sum = rounded.Zero + rounded.One + rounded.Two;

        // Adjust for rounding errors
        if (sum !== 100) {
            const diff = 100 - sum;
            // Add/subtract the difference to the largest percentage
            const maxKey = Object.keys(rounded).reduce((a, b) =>
                rounded[a] > rounded[b] ? a : b
            );
            rounded[maxKey] += diff;
        }

        return rounded;
    }

    // Select number of false feedbacks based on calculated percentages
    getFalseFeedbackCount() {
        const rand = Math.random() * 100;

        // Use cumulative probability
        if (rand < this.percentages.Zero) {
            return 0;
        } else if (rand < this.percentages.Zero + this.percentages.One) {
            return 1;
        } else {
            return 2;
        }
    }

    apply(feedback, guess) {
        let mutated = [...feedback];
        const falseFeedbackCount = this.getFalseFeedbackCount();
        const glitchedIndices = [];

        for (let i = 0; i < falseFeedbackCount; i++) {
            const before = [...mutated];
            const result = pickFalseFeedback(mutated);
            mutated = result.mutated;
            glitchedIndices.push(result.idx);
        }

        // Store feedback history with ideal (pre-glitch) feedback
        this.feedbackHistory.push({
            guess,
            mutated,   // glitched feedback
            ideal: feedback,  // original feedback before glitches
            glitchedIndices,
            numGlitchesRolled: falseFeedbackCount,
            diceRolls: { ...this.diceRolls }
        });

        return { mutated, toFix: null };
    }

    // Reset for new game
    reset() {
        this.diceRolls = null;
        this.percentages = null;
        this.feedbackHistory = [];
    }
}