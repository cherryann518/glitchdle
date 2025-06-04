import { SingleFalseFeedback } from "./SingleFalseFeedback.js";

/**
 * DetectorSystem handles the detector UI and functionality for glitch detection
 */
export class DetectorSystem {
    constructor(game, glitchType) {
        this.game = game;
        this.glitchType = glitchType;
        
        if (!(this.glitchType instanceof SingleFalseFeedback)) {
            return;
        }
        
        this.setupUI();
        this.addListeners();
    }

    /**
     * Set up the detector UI elements
     */
    setupUI() {
        this.createDetectorInterface();
        this.updateDisplay();
    }

    /**
     * Create the detector interface elements
     */
    createDetectorInterface() {
        // Add detector info display
        const detectorInfo = document.createElement('div');
        detectorInfo.id = 'detector-info';
        detectorInfo.className = 'detector-info';

        const gameBoard = document.getElementById('game-board');
        gameBoard.parentNode.insertBefore(detectorInfo, gameBoard);
    }

    /**
     * Update the detector display with current status
     */
    updateDisplay() {
        const detectorInfo = document.getElementById('detector-info');
        if (!detectorInfo) return;
        const info = this.glitchType.getDetectorInfo();
        if (info.hardMode) {
            detectorInfo.innerHTML = `
                <div class="detector-status">
                    🔒 <strong>Hard Mode</strong> - No detectors available
                </div>
            `;
        } else {
            detectorInfo.innerHTML = `
                <div class="detector-status">
                    🔍 <strong>Detectors:</strong> ${info.detectorsRemaining}/${info.maxDetectors} remaining
                    <br><small>Click on any completed tile to check if its feedback is correct</small>
                </div>
            `;
        }
    }

    /**
     * Add event listeners for detector functionality
     */
    addListeners() {
        this.tileClickHandler = this.handleTileClick.bind(this);
        this.game.addTileClickHandler(this.tileClickHandler);
    }

    /**
     * Remove event listeners (cleanup)
     */
    removeListeners() {
        if (this.tileClickHandler) {
            this.game.removeTileClickHandler(this.tileClickHandler);
            this.tileClickHandler = null;
        }
    }

    /**
     * Handle tile clicks for detector functionality
     * @param {HTMLElement} tile - The clicked tile
     * @param {number} rowIndex - Row index of the tile
     * @param {number} tileIndex - Tile index within the row
     * @param {Event} event - The click event
     */
    handleTileClick(tile, rowIndex, tileIndex, event) {
        if (!this.game.isRowCompleted(tile.closest('.row'))) {
            return;
        }

        if (this.game.isTileChecked(tile)) {
            this.showMessage("This tile has already been checked!", 2000);
            return;
        }

        this.useDetector(rowIndex, tileIndex, tile);
    }

    /**
     * Use a detector on a specific tile
     * @param {number} rowIndex - Row index of the tile
     * @param {number} tileIndex - Tile index within the row
     * @param {HTMLElement} tile - The tile element
     */
    useDetector(rowIndex, tileIndex, tile) {
        const result = this.glitchType.checkTileCorrectness(rowIndex, tileIndex);

        if (result.alreadyChecked) {
            this.showMessage(result.message, 2000);
            return;
        }

        if (result.isCorrect === null) {
            this.showMessage(result.message, 2000);
            return;
        }

        if (result.glitchedTile && result.rowChecked) {
            this.markRowTilesChecked(rowIndex);
            
            if (result.correctColor) {
                this.game.revealTileColor(tile, result.correctColor);
                this.game.markTileGlitchDetected(tile);
            }
        } else {
            this.game.markTileChecked(tile);

            if (result.isCorrect === true) {
                this.game.markTileCorrect(tile);
            }
        }

        this.showMessage(result.message, 3000);
        this.updateDisplay();
    }

    /**
     * Mark all tiles in a row as visually checked
     * @param {number} rowIndex - Row index to mark
     */
    markRowTilesChecked(rowIndex) {
        const completedRows = this.game.boardEl.querySelectorAll(".row.completed");
        if (completedRows[rowIndex]) {
            const tiles = completedRows[rowIndex].querySelectorAll(".tile");
            tiles.forEach(tile => {
                this.game.markTileChecked(tile);
            });
        }
    }

    /**
     * Show a temporary message to the user
     * @param {string} message - Message to show
     * @param {number} duration - Duration in milliseconds
     */
    showMessage(message, duration = 2000) {
        this.game.messageEl.textContent = message;
        setTimeout(() => {
            this.game.messageEl.textContent = "";
        }, duration);
    }

    /**
     * Reset the detector system (called when game resets)
     */
    reset() {
        if (this.glitchType && typeof this.glitchType.reset === 'function') {
            this.glitchType.reset();
        }
        this.updateDisplay();
        this.game.messageEl.textContent = "";
    }

    /**
     * Cleanup method for when the detector system is no longer needed
     */
    destroy() {
        this.removeListeners();

        const detectorInfo = document.getElementById('detector-info');
        if (detectorInfo) {
            detectorInfo.remove();
        }
    }
}