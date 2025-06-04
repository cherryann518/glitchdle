import { Classic } from "./games/Classic.js";
import { Glitchdle } from "./games/Glitchdle.js";
import { buildKeyboard } from "./ui/keyboard.js";
import { TimedCorrect } from "./games/glitch/TimedCorrect.js";
import { SingleFalseFeedback } from "./games/glitch/SingleFalseFeedback.js";
import { DiceRoll } from "./games/glitch/DiceRoll.js";

let currentGame = null;
let isGlitchMode = false;
let currentGlitchType = 'timed';
let isHardMode = false;

const GLITCH_STRATEGIES = {
    timed: { instance: new TimedCorrect(), name: "Timed Correct", short: "Timed" },
    single: { name: "Single False", short: "Single" },
    dice: { instance: new DiceRoll(), name: "Dice Roll", short: "Dice" }
};

function getGlitchInstance(type, hardMode = false) {
    if (type === 'single') {
        return new SingleFalseFeedback(hardMode);
    }
    if (type === 'dice') {
        return new DiceRoll(hardMode);
    }
    return GLITCH_STRATEGIES[type].instance;
}

function cleanupDetectorUI() {
    const existingDetectorInfos = document.querySelectorAll('#detector-info, .detector-info');
    existingDetectorInfos.forEach(el => el.remove());
}

function startGame() {
    if (currentGame) {
        if (currentGame.destroy) {
            currentGame.destroy();
        }
        currentGame.resetListeners();
    }
    cleanupDetectorUI();
    
    const diceContainer = document.getElementById('dice-container');
    diceContainer.style.display = 'none';

    document.body.dataset.mode = isGlitchMode ? 'glitchdle' : 'classic';
    if (isGlitchMode) {
        const strategy = GLITCH_STRATEGIES[currentGlitchType];
        const glitchInstance = getGlitchInstance(currentGlitchType, isHardMode);
        
        const gameTitle = (currentGlitchType === 'single' || currentGlitchType === 'dice') && isHardMode 
            ? `Glitchdle - ${strategy.name} (Hard)`
            : `Glitchdle - ${strategy.name}`;
            
        currentGame = new Glitchdle({
            gameTitle,
            titleId: "game-title",
            boardId: "game-board",
            keyboardId: "keyboard",
            messageId: "message",
            guessCountId: "guess-count",
            restartBtnId: "restart-btn",
            maxGuesses: 20,
            glitchType: glitchInstance
        });
    } else {
        currentGame = new Classic({
            gameTitle: "",
            titleId: "game-title",
            boardId: "game-board",
            keyboardId: "keyboard",
            messageId: "message",
            guessCountId: "guess-count",
            restartBtnId: "restart-btn",
            maxGuesses: 6
        });
    }
    
    updateGlitchButtons();
}

function updateGlitchButtons() {
    const glitchBtn1 = document.getElementById("glitch-btn-1");
    const glitchBtn2 = document.getElementById("glitch-btn-2");
    const hardBtn = document.getElementById("hard-btn");
    
    if (!isGlitchMode) {
        // Hide all glitch buttons when in Classic
        glitchBtn1.style.display = 'none';
        glitchBtn2.style.display = 'none';
        hardBtn.style.display = 'none';
        return;
    }
    
    // Show mode switch buttons
    glitchBtn1.style.display = 'inline-block';
    glitchBtn2.style.display = 'inline-block';
    
    // Set buttons based on current mode
    switch (currentGlitchType) {
        case 'timed':
            glitchBtn1.textContent = GLITCH_STRATEGIES['single'].short;
            glitchBtn1.dataset.mode = 'single';
            glitchBtn2.textContent = GLITCH_STRATEGIES['dice'].short;
            glitchBtn2.dataset.mode = 'dice';
            break;
        case 'single':
            glitchBtn1.textContent = GLITCH_STRATEGIES['timed'].short;
            glitchBtn1.dataset.mode = 'timed';
            glitchBtn2.textContent = GLITCH_STRATEGIES['dice'].short;
            glitchBtn2.dataset.mode = 'dice';
            break;
        case 'dice':
            glitchBtn1.textContent = GLITCH_STRATEGIES['timed'].short;
            glitchBtn1.dataset.mode = 'timed';
            glitchBtn2.textContent = GLITCH_STRATEGIES['single'].short;
            glitchBtn2.dataset.mode = 'single';
            break;
    }
    
    // Show hard button for Single and Dice modes
    if (currentGlitchType === 'single' || currentGlitchType === 'dice') {
        hardBtn.style.display = 'inline-block';
        hardBtn.textContent = isHardMode ? 'Normal' : 'Hard';
    } else {
        hardBtn.style.display = 'none';
        isHardMode = false;
    }
}

function switchGlitchMode(newMode) {
    if (!isGlitchMode) return;
    
    currentGlitchType = newMode;
    isHardMode = false; 
    console.log(`Switching to ${GLITCH_STRATEGIES[newMode].name} mode`);
    startGame();
}

function toggleHardMode() {
    if (currentGlitchType !== 'single' && currentGlitchType !== 'dice') return;
    
    isHardMode = !isHardMode;
    console.log(`Toggling hard mode: ${isHardMode ? 'ON' : 'OFF'}`);
    startGame();
}

document.addEventListener("DOMContentLoaded", () => {
    buildKeyboard("keyboard");

    // Classic/Glitchdle
    const toggleBtn = document.getElementById("toggle-btn");
    toggleBtn.addEventListener("click", e => {
        e.target.blur();
        isGlitchMode = !isGlitchMode;
        isHardMode = false;
        toggleBtn.textContent = isGlitchMode
            ? "Exit Glitchdle"
            : "Switch to Glitchdle";
        startGame();
    });

    // Glitch mode buttons
    const glitchBtn1 = document.getElementById("glitch-btn-1");
    const glitchBtn2 = document.getElementById("glitch-btn-2");
    const hardBtn = document.getElementById("hard-btn");
    
    glitchBtn1.addEventListener("click", e => {
        e.target.blur();
        switchGlitchMode(e.target.dataset.mode);
    });
    
    glitchBtn2.addEventListener("click", e => {
        e.target.blur();
        switchGlitchMode(e.target.dataset.mode);
    });
    
    hardBtn.addEventListener("click", e => {
        e.target.blur();
        toggleHardMode();
    });

    // Initialize button labels & start first game
    toggleBtn.textContent = "Switch to Glitchdle";
    startGame();
});