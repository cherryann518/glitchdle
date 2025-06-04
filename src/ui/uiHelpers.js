import { keyStatus } from "./keyboard.js";
import { STATUS } from "../games/glitch/statusConstants.js";

/**
 * Paint an array of tiles based on statuses.
 * @param {Element[]} tiles - Array of tile elements.
 * @param {string[]} statuses - Array of statuses to apply.
 */
export function paintTiles(tiles, statuses) {
    tiles.forEach((tile, i) => {
        tile.classList.add(statuses[i]);
    });
}

/**
 * Replace the class on a tile element.
 * @param {Element} tile - The tile DOM element.
 * @param {string} fromClass - The current status class.
 * @param {string} toClass - The new status class.
 */
export function repaintTile(tile, fromClass, toClass) {
    tile.classList.replace(fromClass, toClass);
}

/**
 * Force-update a keyboard key's class and internal status map.
 * @param {string} letter - The letter to update.
 * @param {string} status - The new status ("gray"|"yellow"|"green").
 */
export function forceUpdateKey(letter, status) {
    const upper = letter.toUpperCase();
    const btn = document.querySelector(`.key[data-key="${upper}"]`);
    if (btn) {
        btn.classList.remove(STATUS.GRAY, STATUS.YELLOW, STATUS.GREEN);
        btn.classList.add(status);
    }
    keyStatus[upper] = status;
}