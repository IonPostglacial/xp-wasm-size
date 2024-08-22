import * as env from "./env.mjs";

const DIRECTION_UP = 0;
const DIRECTION_DOWN = 1;
const DIRECTION_LEFT = 2;
const DIRECTION_RIGHT = 3;
const COLOR_BACKGROUND = 0x00000000;
const COLOR_SNAKE = 0x00ff00;
const COLOR_APPLE = 0xff0000;
const CELL_SIZE = 10;
const GRID_WIDTH = 40;
const GRID_HEIGHT = 40;

function createArray(size) {
    let arr = [];
    for (let i = 0; i < size; i++) arr.push(0);
    return arr;
}

function direction_x(d) {
    if (d === DIRECTION_LEFT) {
        return -1;
    } else if (d === DIRECTION_RIGHT) {
        return 1;
    } else {
        return 0;
    }
}

function direction_y(d) {
    if (d === DIRECTION_UP) {
        return -1;
    } else if (d === DIRECTION_DOWN) {
        return 1;
    } else {
        return 0;
    }
}

class Snake {
    xs = createArray(GRID_WIDTH * GRID_HEIGHT);
    ys = createArray(GRID_WIDTH * GRID_HEIGHT);
    length = 4;
    direction = DIRECTION_RIGHT;
    headIndex = 3;

    constructor() {
        this.xs[1] = 1;
        this.xs[2] = 2;
        this.xs[3] = 3;
    }

    moveAhead() {
        let nextX = this.xs[this.headIndex] + direction_x(this.direction);
        let nextY = this.ys[this.headIndex] + direction_y(this.direction);
        if (this.headIndex === this.length - 1) {
            this.headIndex = 0;
        } else {
            this.headIndex++;
        }
        this.xs[this.headIndex] = nextX;
        this.ys[this.headIndex] = nextY;
    }

    grow() {
        let nextX = this.xs[this.headIndex] + direction_x(this.direction);
        let nextY = this.ys[this.headIndex] + direction_y(this.direction);
        if (this.headIndex === this.length) {
            this.xs[this.length] = nextX;
            this.ys[this.length] = nextY;
        } else {
            for (let i = this.length; i > this.headIndex; i--) {
                this.xs[i + 1] = this.xs[i];
                this.ys[i + 1] = this.ys[i];
            }
            this.xs[this.headIndex + 1] = nextX;
            this.ys[this.headIndex + 1] = nextY;
        }
        this.length++;
    }

    changeDirection(direction) {
        if (directionsAreOpposite(this.direction, direction)) return;
        this.direction = direction;
    }
}

function directionsAreOpposite(dir, other) {
    return dir == DIRECTION_UP && other == DIRECTION_DOWN ||
        dir == DIRECTION_DOWN && other == DIRECTION_UP ||
        dir == DIRECTION_LEFT && other == DIRECTION_RIGHT ||
        dir == DIRECTION_RIGHT && other == DIRECTION_LEFT;
}

function drawBackground() {
    env.canvas_set_fill_style(COLOR_BACKGROUND);
    env.canvas_fill_rect(0, 0, GRID_WIDTH * CELL_SIZE, GRID_HEIGHT * CELL_SIZE);
}

function drawSnake(snake) {
    env.canvas_set_fill_style(COLOR_SNAKE);
    for (let i = 0; i < snake.length; i++) {
        env.canvas_fill_rect(snake.xs[i] * CELL_SIZE, snake.ys[i] * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    }
}

function drawApple(x, y) {
    env.canvas_set_fill_style(COLOR_APPLE);
    env.canvas_fill_rect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
}

let appleX = 0, appleY = 0;
let stepPeriod = 300;
let score = 0;
let nextReward = 10;
let snake = new Snake();

function teleportApple() {
    appleX = env.random(GRID_WIDTH);
    appleY = env.random(GRID_HEIGHT);
}

function speedupGame() {
    if (stepPeriod > 50) {
        stepPeriod -= 25;
        env.step_period_update(stepPeriod);
    }
}

function updateScore(nextReward) {
    score += nextReward;
    nextReward += 10;
}

function repaint() {
    drawBackground();
    drawSnake(snake);
    drawApple(appleX, appleY);
    env.canvas_fill();
}

export function direction_changed(direction) {
    snake.changeDirection(direction);
}

function snakeBitesHimself(snake) {
    for (let i = 0; i < snake.length; i++) {
        if (i === snake.headIndex) continue;
        if (snake.xs[snake.headIndex] === snake.xs[i] && snake.ys[snake.headIndex] === snake.ys[i]) {
            return true;
        }
    }
    return false;
}

function snakeIsOutOfBounds(snake) {
    return snake.xs[snake.headIndex] < 0 ||
        snake.xs[snake.headIndex] >= GRID_WIDTH ||
        snake.ys[snake.headIndex] < 0 ||
        snake.ys[snake.headIndex] >= GRID_HEIGHT;
}

function snakeWillReachPosition(snake, x, y) {
    let nextX = snake.xs[snake.headIndex] + direction_x(snake.direction);
    let nextY = snake.ys[snake.headIndex] + direction_y(snake.direction);
    return nextX === x && nextY === y;
}

export function step(timestamp) {
    if (snakeWillReachPosition(snake, appleX, appleY)) {
        snake.grow();
        teleportApple();
        speedupGame();
        updateScore(nextReward);
        env.snake_score_change(score);
    } else {
        snake.moveAhead();
    }
    if (snakeIsOutOfBounds(snake) || snakeBitesHimself(snake)) {
        env.game_over();
    }
    repaint();
}

teleportApple();
repaint();

const keys = {
    ArrowUp: 0,
    ArrowDown: 1,
    ArrowLeft: 2,
    ArrowRight: 3,
};

window.addEventListener("load", () => {
    const up = document.getElementById("up");
    const left = document.getElementById("left");
    const down = document.getElementById("down");
    const right = document.getElementById("right");
    window.onkeydown = (e) => {
        e.stopPropagation();
        direction_changed(keys[e.code]);
    };

    up.onclick = () => direction_changed(keys.ArrowUp);
    down.onclick = () => direction_changed(keys.ArrowDown);
    left.onclick = () => direction_changed(keys.ArrowLeft);
    right.onclick = () => direction_changed(keys.ArrowRight);

    let lastUpdateTimestamp = -1;

    function _step(timestamp) {
        if (lastUpdateTimestamp < 0) lastUpdateTimestamp = timestamp;
        const progress = timestamp - lastUpdateTimestamp;
        if (progress >= stepPeriod) {
            lastUpdateTimestamp = timestamp;
            step(progress);
        }
        window.requestAnimationFrame(_step);
    }
    window.requestAnimationFrame(_step);
});