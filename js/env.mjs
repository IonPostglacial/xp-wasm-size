const canvas = document.getElementById("canvas");
const scoreDisplay = document.getElementById("score-display");
const cx = canvas.getContext("2d");
let stepPeriod = 300;

export function canvas_set_fill_style(hexColor) {
    var color = "#" + hexColor.toString(16).padStart(6, "0");
    cx.fillStyle = color;
}

export function canvas_fill_rect(x, y, width, height) {
    cx.fillRect(x | 0, y | 0, width | 0, height | 0);
}

export function canvas_fill() {
    cx.fill();
}

export function snake_score_change(score) {
    scoreDisplay.textContent = score;
}

export function step_period_update(period) {
    stepPeriod = period;
}

export function game_over() {
    window.alert("Game Over !");
    window.location.reload();
}

export function random(max) {
    return (Math.random() * max) | 0;
}