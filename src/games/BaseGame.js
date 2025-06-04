import { realWordles, allowedGuesses, combinedWordList } from '../wordlists.js';
import { updateKeyColor } from "../ui/keyboard.js";
import { STATUS } from "./glitch/statusConstants.js";

export class BaseGame {
    constructor({ gameTitle, titleId, boardId, keyboardId, messageId, guessCountId, restartBtnId, maxGuesses }) {
        // html elements
        this.titleEl = document.getElementById(titleId);
        this.boardEl = document.getElementById(boardId);
        this.keyboardEl = document.getElementById(keyboardId);
        this.messageEl = document.getElementById(messageId);
        this.countEl = document.getElementById(guessCountId);
        this.restartBtn = document.getElementById(restartBtnId);

        this.gameTitle = gameTitle;

        // from data/
        this.realWordles = realWordles;
        this.allowedGuesses = allowedGuesses;
        this.combinedWordList = combinedWordList;

        this.maxGuesses = maxGuesses;
        this.wordLength = 5;

        // Tile click handlers (for extensions like detectors)
        this.tileClickHandlers = [];

        this.init();
    }

    init() {
        this.titleEl.textContent = this.gameTitle;
        this.resetState();
        this.createNewRow();
        this.addListeners();
    }

    resetState() {
        this.currentGuess = "";
        this.currentRow = 0;
        this.isGameOver = false;
        this.targetWord = this.pickRandomWord();
        this.countEl.textContent = `Guess 1`;
        this.boardEl.innerHTML = "";
        this.messageEl.textContent = "";
        this.clearKeyboardColors();
        this.clearTileStyles();
    }

    // used in resetState()
    clearKeyboardColors() {
        this.keyStatus = {};
        this.keyboardEl.querySelectorAll('.key').forEach(btn => {
            btn.classList.remove('gray', 'yellow', 'green');
        });
    }

    // Clear any special tile styling
    clearTileStyles() {
        const tiles = this.boardEl.querySelectorAll('.tile');
        tiles.forEach(tile => {
            // Remove all possible tile state classes
            tile.classList.remove(
                'checked', 'glitch-detected', 'correct-tile',
                'detector-reveal', 'detector-correct',
                STATUS.GRAY, STATUS.YELLOW, STATUS.GREEN
            );
        });
    }

    // used in resetState()
    pickRandomWord() {
        const word = this.realWordles[Math.floor(Math.random() * this.realWordles.length)];
        console.log("targetWord:", word);
        return word;
    }

    // used in init()
    addListeners() {
        this._listeners = [
            { target: document, event: "keydown", handler: this.onKeydown.bind(this) },
            { target: this.keyboardEl, event: "click", handler: this.onKeyboardClick.bind(this) },
            { target: this.restartBtn, event: "click", handler: this.onRestartClick.bind(this) },
            { target: this.boardEl, event: "click", handler: this.onTileClick.bind(this) }
        ];
        this._listeners.forEach(({ target, event, handler }) =>
            target.addEventListener(event, handler)
        );
    }

    // Handle tile clicks and delegate to registered handlers
    onTileClick(e) {
        if (!e.target.classList.contains('tile')) return;

        const tile = e.target;
        const row = tile.closest('.row');
        if (!row) return;

        const rowIndex = Array.from(this.boardEl.querySelectorAll('.row')).indexOf(row);
        const tileIndex = Array.from(row.querySelectorAll('.tile')).indexOf(tile);

        // Call all registered tile click handlers
        this.tileClickHandlers.forEach(handler => {
            handler(tile, rowIndex, tileIndex, e);
        });
    }

    // Allow subclasses or systems to register tile click handlers
    addTileClickHandler(handler) {
        this.tileClickHandlers.push(handler);
    }

    // Remove a tile click handler
    removeTileClickHandler(handler) {
        const index = this.tileClickHandlers.indexOf(handler);
        if (index > -1) {
            this.tileClickHandlers.splice(index, 1);
        }
    }

    // used in startGame()
    resetListeners() {
        if (!this._listeners) return;
        this._listeners.forEach(({ target, event, handler }) =>
            target.removeEventListener(event, handler)
        );
        this._listeners = null;
    }

    handleKey(key) {
        if (this.isGameOver) return;
        if (key === "ENTER") return this.submitGuess();
        if (key === "BACKSPACE") return this.deleteLetter();
        if (/^[A-Z]$/i.test(key)) return this.addLetter(key.toLowerCase());
    }

    onKeydown(e) {
        this.handleKey(e.key.toUpperCase());
    }

    // keyboard handler
    onKeyboardClick(e) {
        if (!e.target.matches(".key")) return;
        this.handleKey(e.target.dataset.key);
    }

    // restartBtnhandler
    onRestartClick(e) {
        e.target.blur();
        this.resetState();
        this.createNewRow();
    }

    deleteLetter() {
        this.currentGuess = this.currentGuess.slice(0, -1);
        this.updateInputTiles();
    }

    addLetter(letter) {
        if (this.currentGuess.length < this.wordLength) {
            this.currentGuess += letter;
            this.updateInputTiles();
        }
    }

    createNewRow() {
        const row = document.createElement("div");
        row.className = "row input"; // Current input row
        // create tiles
        this.tiles = Array.from({ length: this.wordLength }, () => {
            const tile = document.createElement("div");
            tile.className = "tile";
            row.appendChild(tile);
            return tile;
        });
        this.boardEl.appendChild(row);
    }

    updateInputTiles() {
        this.tiles.forEach((tile, i) => {
            tile.textContent = this.currentGuess[i]?.toUpperCase() || "";
        });
    }

    /**
     * Reveal the correct color for a tile (used by detector systems)
     * @param {HTMLElement} tile - The tile element
     * @param {string} correctColor - The correct color class to apply
     */
    revealTileColor(tile, correctColor) {
        tile.classList.remove(STATUS.GRAY, STATUS.YELLOW, STATUS.GREEN);
        tile.classList.add(correctColor);
        tile.classList.add('detector-reveal');
        setTimeout(() => {
            tile.classList.remove('detector-reveal');
        }, 2000);
    }

    /**
     * Mark a tile as checked (for detector systems)
     * @param {HTMLElement} tile - The tile element
     */
    markTileChecked(tile) {
        tile.classList.add('checked');
    }

    /**
     * Check if a tile has been checked
     * @param {HTMLElement} tile - The tile element
     * @returns {boolean}
     */
    isTileChecked(tile) {
        return tile.classList.contains('checked');
    }

    /**
     * Mark a tile as correct 
     * @param {HTMLElement} tile - The tile element
     */
    markTileCorrect(tile) {
        tile.classList.add('correct-tile');
    }

    /**
     * Mark a tile as having a detected glitch
     * @param {HTMLElement} tile - The tile element
     */
    markTileGlitchDetected(tile) {
        tile.classList.add('glitch-detected');
    }

    /**
     * Get tile coordinates from a tile element
     * @param {HTMLElement} tile - The tile element
     * @returns {{rowIndex: number, tileIndex: number, row: HTMLElement} | null}
     */
    getTileCoordinates(tile) {
        const row = tile.closest('.row');
        if (!row) return null;

        const rowIndex = Array.from(this.boardEl.querySelectorAll('.row')).indexOf(row);
        const tileIndex = Array.from(row.querySelectorAll('.tile')).indexOf(tile);

        return { rowIndex, tileIndex, row };
    }

    /**
     * Get a tile element by coordinates
     * @param {number} rowIndex - Row index
     * @param {number} tileIndex - Tile index within the row
     * @returns {HTMLElement | null}
     */
    getTileByCoordinates(rowIndex, tileIndex) {
        const rows = this.boardEl.querySelectorAll('.row');
        if (rowIndex >= rows.length) return null;

        const tiles = rows[rowIndex].querySelectorAll('.tile');
        if (tileIndex >= tiles.length) return null;

        return tiles[tileIndex];
    }

    /**
     * Get all completed rows
     * @returns {NodeList}
     */
    getCompletedRows() {
        return this.boardEl.querySelectorAll('.row.completed');
    }

    /**
     * Check if a row is completed
     * @param {HTMLElement} row - The row element
     * @returns {boolean}
     */
    isRowCompleted(row) {
        return row.classList.contains('completed');
    }

    submitGuess() {
        if (this.currentGuess.length !== this.wordLength) return;

        if (!this.combinedWordList.includes(this.currentGuess)) {
            this.messageEl.textContent = "❌ Not in word list";
            return;
        }
        this.messageEl.textContent = ""; // clear old msg

        if (this.currentGuess === this.targetWord) {
            this.tiles.forEach((tile, i) => {
                tile.classList.add("green");
            });
            this.endGame(`🎉 You win!`);
            return;
        }

        let feedback = this.getFeedback(this.currentGuess, this.targetWord);
        this.tiles.forEach((tile, i) => {
            tile.classList.add(feedback[i]);
        });

        for (let i = 0; i < this.currentGuess.length; i++) {
            updateKeyColor(this.currentGuess[i], feedback[i]);
        }

        // Mark current row as completed
        const currentRowEl = this.boardEl.querySelector('.row.input');
        if (currentRowEl) {
            currentRowEl.classList.remove('input');
            currentRowEl.classList.add('completed');
        }

        this.currentRow++;
        this.currentGuess = "";

        if (this.currentRow >= this.maxGuesses) {
            this.endGame(`💀 Game Over! The word was ${this.targetWord.toUpperCase()}`);
            return;
        }

        this.countEl.textContent = `Guess ${this.currentRow + 1}`;
        this.createNewRow();
    }

    getFeedback(guess, target) {
        const feedback = Array(this.wordLength).fill("gray");
        const freq = {};

        // greens + build frequency for others
        for (let i = 0; i < this.wordLength; i++) {
            if (guess[i] === target[i]) {
                feedback[i] = "green";
            } else {
                freq[target[i]] = (freq[target[i]] || 0) + 1;
            }
        }
        // yellows
        for (let i = 0; i < this.wordLength; i++) {
            if (feedback[i] === "gray" && freq[guess[i]] > 0) {
                feedback[i] = "yellow";
                freq[guess[i]]--;
            }
        }
        return feedback;
    }

    endGame(msg) {
        this.messageEl.textContent = msg;
        this.isGameOver = true;
    }
}