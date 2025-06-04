const KB_LAYOUT = [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
    ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACKSPACE"]];
const STATUS_PRIORITY = { green: 3, yellow: 2, gray: 1 };
export const keyStatus = {};

export function buildKeyboard(keyboardId) {
    const keyboardEl = document.getElementById(keyboardId);
    if (!keyboardEl) return;

    KB_LAYOUT.forEach(row => {
        const rowEl = document.createElement("div");
        rowEl.className = "kb-row";

        row.forEach(key => {
            const btn = document.createElement("button");
            btn.className = "key";
            btn.dataset.key = key;

            switch (key) {
                case "ENTER":
                    btn.textContent = "Enter";
                    break;
                case "BACKSPACE":
                    btn.textContent = "⌫";
                    break;
                default:
                    btn.textContent = key;
            }
            rowEl.appendChild(btn);
        });

        keyboardEl.appendChild(rowEl);
    });
}

export function updateKeyColor(letter, newStatus) {
    const upper = letter.toUpperCase();
    const prev = keyStatus[upper] || null;

    // only upgrade a key
    if (!prev || STATUS_PRIORITY[newStatus] > STATUS_PRIORITY[prev]) {
        keyStatus[upper] = newStatus;

        const btn = document.querySelector(`.key[data-key="${upper}"]`);
        if (btn) {
            btn.classList.remove("green", "yellow", "gray");
            btn.classList.add(newStatus);
        }
    }
}