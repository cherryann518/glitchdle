import { BaseGame } from "./BaseGame.js";
import { updateKeyColor } from "../ui/keyboard.js";
import { repaintTile, forceUpdateKey, paintTiles } from "../ui/uiHelpers.js";
import { STATUS } from "./glitch/statusConstants.js";
import { SingleFalseFeedback } from "./glitch/SingleFalseFeedback.js";
import { DetectorSystem } from "./glitch/DetectorSystem.js";
import { DiceRoll } from "./glitch/DiceRoll.js";

export class Glitchdle extends BaseGame {
    constructor({ glitchType, ...opts }) {
        super(opts);
        this.glitchType = glitchType;
        this.glitchType.game = this;

        // Block access to DiceRoll normal mode
        if (this.glitchType instanceof DiceRoll && !this.glitchType.hardMode) {
            alert('Normal mode is still under construction. Please wait for an update.');
            return;
        }

        this.setupDetectorSystem();

        if (this.glitchType instanceof DiceRoll) {
            this.diceContainer = document.getElementById('dice-container');
            this.diceContainer.style.display = 'block';
            
            this.glitchType.rollDice();
            this.updateDiceDisplay();
            this.addDiceInfoToAllRows();
        }
    }

    /**
     * Set up the detector system for SingleFalseFeedback mode
     */
    setupDetectorSystem() {
        if (this.glitchType instanceof SingleFalseFeedback) {
            this.detectorSystem = new DetectorSystem(this, this.glitchType);
        }
    }

    /**
     * Override resetState to also reset detector system
     */
    resetState() {
        super.resetState();

        if (this.detectorSystem) {
            this.detectorSystem.reset();
        }
    }

    /**
     * Generate mutated feedback and any pending fix for a guess.
     * @param {string} guess - The current guess.
     * @param {string} target - The target word.
     * @returns {{ mutated: string[], toFix: import("./GlitchTypes.js").PendingFix|null }}
     */
    getGlitchFeedback(guess, target) {
        const honest = super.getFeedback(guess, target);
        return this.glitchType.apply(honest, guess);
    }

    /**
     * Override submitGuess to handle glitch feedback and pending fixes
     */
    submitGuess() {
        if (this.currentGuess.length !== this.wordLength) return;

        if (!this.combinedWordList.includes(this.currentGuess)) {
            this.messageEl.textContent = "❌ Not in word list";
            return;
        }

        this.messageEl.textContent = "";

        if (this.currentGuess === this.targetWord) {
            paintTiles(this.tiles, Array(this.wordLength).fill(STATUS.GREEN));
            this.endGame(`🎉 You win!`);
            return;
        }

        const { mutated, toFix } = this.getGlitchFeedback(this.currentGuess, this.targetWord);

        this.applyPendingFix(toFix);
        paintTiles(this.tiles, mutated);
        mutated.forEach((status, i) =>
            updateKeyColor(this.currentGuess[i], status)
        );

        this.markRowCompleted();

        this.currentRow++;
        this.currentGuess = "";

        if (this.glitchType instanceof DiceRoll) {
            this.glitchType.rollDice();
            this.updateDiceDisplay();
        }

        this.countEl.textContent = `Guess ${this.currentRow + 1}`;
        this.createNewRow();

        if (this.detectorSystem) {
            this.detectorSystem.updateDisplay();
        }
    }

    /**
     * Apply a pending fix from a previous guess
     * @param {Object|null} toFix - The pending fix object
     */
    applyPendingFix(toFix) {
        if (!toFix) return;

        const { rowIndex, idx, originalColor, letter } = toFix;

        const completedRows = this.boardEl.querySelectorAll(".row.completed");
        if (completedRows[rowIndex]) {
            const tile = completedRows[rowIndex].querySelectorAll(".tile")[idx];
            if (tile) {
                const currentWrongColor = [STATUS.GRAY, STATUS.YELLOW, STATUS.GREEN]
                    .find(color => tile.classList.contains(color));
                if (currentWrongColor) {
                    repaintTile(tile, currentWrongColor, originalColor);
                }
                forceUpdateKey(letter, originalColor);
            }
        }
    }

    /**
     * Mark the current input row as completed
     */
    markRowCompleted() {
        const currentRowEl = this.boardEl.querySelector('.row.input');
        if (currentRowEl) {
            currentRowEl.classList.remove('input');
            currentRowEl.classList.add('completed');
        }
    }

    /**
     * Cleanup when the game is destroyed
     */
    destroy() {
        if (this.detectorSystem) {
            this.detectorSystem.destroy();
            this.detectorSystem = null;
        }

        super.resetListeners();
    }

    updateDiceDisplay() {
        if (!(this.glitchType instanceof DiceRoll)) return;

        const diceValues = this.glitchType.diceRolls;
        const percentages = this.glitchType.percentages;

        const diceElements = this.diceContainer.querySelectorAll('.dice-value');
        const rollKeys = ['Zero', 'One', 'Two'];

        rollKeys.forEach((key, index) => {
            const diceEl = diceElements[index];
            
            diceEl.classList.add('rolling');

            const imageUrl = `./images/dice-${diceValues[key]}.png`;
            
            setTimeout(() => {
                diceEl.classList.remove('rolling');
                diceEl.style.backgroundImage = `url('${imageUrl}')`;
                diceEl.textContent = diceValues[key];
            }, 1000);
        });
    }

    /**
     * Add dice info to all existing rows when entering DiceRoll mode
     */
    addDiceInfoToAllRows() {
        const allRows = this.boardEl.querySelectorAll('.row');
        allRows.forEach(row => {
            if (!row.querySelector('.row-dice-info')) {
                const diceInfo = this.createRowDiceInfo();
                row.appendChild(diceInfo);
            }
        });
    }

    /**
     * Create a new row for input
     */
    createNewRow() {
        const row = document.createElement("div");
        row.className = "row input";
        
        const tilesContainer = document.createElement("div");
        tilesContainer.className = "row-tiles";
        
        for (let i = 0; i < this.wordLength; i++) {
            const tile = document.createElement("div");
            tile.className = "tile";
            
            if (this.glitchType instanceof DiceRoll && !this.glitchType.hardMode) {
                this.setupTileHover(tile, i);
            }
            
            tilesContainer.appendChild(tile);
        }
        
        row.appendChild(tilesContainer);
        
        if (this.glitchType instanceof DiceRoll) {
            const diceInfo = this.createRowDiceInfo();
            row.appendChild(diceInfo);
        }
        
        this.boardEl.appendChild(row);
        this.tiles = tilesContainer.querySelectorAll(".tile");
    }

    setupTileHover(tile, position) {
        const tooltip = document.createElement('div');
        tooltip.className = 'probability-tooltip';
        document.body.appendChild(tooltip);

        tile.addEventListener('mouseenter', (e) => {
            if (!(this.glitchType instanceof DiceRoll) || this.glitchType.hardMode) return;
            
            const probabilities = this.glitchType.calculateLetterProbabilities(position);
            if (!probabilities) return;

            tooltip.innerHTML = `
                <div class="prob-row">
                    <span><span class="prob-color prob-green"></span>Green</span>
                    <span>${probabilities.green}%</span>
                </div>
                <div class="prob-row">
                    <span><span class="prob-color prob-yellow"></span>Yellow</span>
                    <span>${probabilities.yellow}%</span>
                </div>
                <div class="prob-row">
                    <span><span class="prob-color prob-gray"></span>Gray</span>
                    <span>${probabilities.gray}%</span>
                </div>
            `;

            const rect = tile.getBoundingClientRect();
            tooltip.style.left = `${rect.left + rect.width / 2}px`;
            tooltip.style.top = `${rect.top}px`;
            tooltip.classList.add('visible');
        });

        tile.addEventListener('mouseleave', () => {
            tooltip.classList.remove('visible');
        });
    }

    /**
     * Create dice info display for a row
     */
    createRowDiceInfo() {
        if (!(this.glitchType instanceof DiceRoll)) {
            return null;
        }

        const diceInfo = document.createElement('div');
        diceInfo.className = 'row-dice-info';

        const currentPercentages = this.glitchType.percentages;
        
        diceInfo.innerHTML = `
            <div class="dice-percentages">
                <span>${currentPercentages.Zero}%</span>
                <span>${currentPercentages.One}%</span>
                <span>${currentPercentages.Two}%</span>
            </div>
        `;

        return diceInfo;
    }
}