import { GlitchType, pickFalseFeedback } from "./GlitchType.js";

// One random wrong color each guess
export class SingleFalseFeedback extends GlitchType {
    constructor(hardMode = false) {
        super();
        this.hardMode = hardMode;
        this.detectorsUsed = 0;
        this.maxDetectors = 5; 
        this.glitchHistory = []; // which tiles were glitched
        this.checkedTiles = new Set(); 
        this.checkedRows = new Set(); // all tiles in a row checked
    }

    apply(feedback, guess) {
        const { mutated, idx, original } = pickFalseFeedback(feedback);

        const glitchInfo = {
            rowIndex: this.game.currentRow,
            glitchedTileIndex: idx,
            originalColor: original,
            fakeColor: mutated[idx],
            guess: guess
        };
        this.glitchHistory.push(glitchInfo);
        return { mutated, toFix: null };
    }

    // mark all tiles in a row as checked
    markRowChecked(rowIndex) {
        this.checkedRows.add(rowIndex);
        const glitchInfo = this.glitchHistory.find(g => g.rowIndex === rowIndex);
        if (!glitchInfo) return;

        const wordLength = glitchInfo.guess.length;
        for (let tileIndex = 0; tileIndex < wordLength; tileIndex++) {
            const tileKey = `${rowIndex}-${tileIndex}`;
            this.checkedTiles.add(tileKey);
        }
    }

    isRowChecked(rowIndex) {
        return this.checkedRows.has(rowIndex);
    }

    // check if a specific tile in a specific row has correct feedback
    checkTileCorrectness(rowIndex, tileIndex) {
        const tileKey = `${rowIndex}-${tileIndex}`;

        if (this.game.isGameOver) {
            return { isCorrect: null, message: null };
        }
        if (this.isRowChecked(rowIndex)) {
            return {
                isCorrect: null,
                message: "This entire row has already been checked!",
                alreadyChecked: true
            };
        }
        if (this.checkedTiles.has(tileKey)) {
            return {
                isCorrect: null,
                message: "This tile has already been checked!",
                alreadyChecked: true
            };
        }
        if (this.hardMode) {
            return { isCorrect: null, message: "Detectors disabled in Hard Mode!" };
        }
        if (this.detectorsUsed >= this.maxDetectors) {
            return { isCorrect: null, message: `No detectors left! (${this.maxDetectors} max per game)` };
        }

        const glitchInfo = this.glitchHistory.find(g => g.rowIndex === rowIndex);
        this.detectorsUsed++;
        const remainingDetectors = this.maxDetectors - this.detectorsUsed;

        if (tileIndex === glitchInfo.glitchedTileIndex) {
            this.markRowChecked(rowIndex);
            return {
                isCorrect: false,
                message: `🔍 GLITCH DETECTED! This tile should be ${glitchInfo.originalColor.toUpperCase()}. Entire row now checked. (${remainingDetectors} detectors left)`,
                correctColor: glitchInfo.originalColor,
                glitchedTile: true,
                tileKey: tileKey,
                rowChecked: true
            };
        } else {
            this.checkedTiles.add(tileKey);
            return {
                isCorrect: true,
                message: `✅ This tile is correct! (${remainingDetectors} detectors left)`,
                glitchedTile: false,
                tileKey: tileKey,
                rowChecked: false
            };
        }
    }

    isTileChecked(rowIndex, tileIndex) {
        const tileKey = `${rowIndex}-${tileIndex}`;
        return this.checkedTiles.has(tileKey);
    }

    // Get all checked tiles for UI styling
    getCheckedTiles() {
        return Array.from(this.checkedTiles);
    }

    // Get all checked rows for UI styling
    getCheckedRows() {
        return Array.from(this.checkedRows);
    }

    // Get info about detectors for UI
    getDetectorInfo() {
        return {
            hardMode: this.hardMode,
            detectorsUsed: this.detectorsUsed,
            detectorsRemaining: this.maxDetectors - this.detectorsUsed,
            maxDetectors: this.maxDetectors,
            checkedTiles: this.getCheckedTiles(),
            checkedRows: this.getCheckedRows()
        };
    }

    // Reset for new game
    reset() {
        this.detectorsUsed = 0;
        this.glitchHistory = [];
        this.checkedTiles.clear();
        this.checkedRows.clear();
    }
}