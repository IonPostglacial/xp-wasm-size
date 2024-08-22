import * as env from "./env";

const DIRECTION_UP: u32 = 0;
const DIRECTION_DOWN: u32 = 1;
const DIRECTION_LEFT: u32 = 2;
const DIRECTION_RIGHT: u32 = 3;
const COLOR_BACKGROUND: u32 = 0x00000000;
const COLOR_SNAKE: u32 = 0x00ff00;
const COLOR_APPLE: u32 = 0xff0000;
const CELL_SIZE: u32 = 10;
const GRID_WIDTH: i32 = 40;
const GRID_HEIGHT: i32 = 40;

function direction_x(d: u32): i32 {
    if (d === DIRECTION_LEFT) {
        return -1;
    } else if (d=== DIRECTION_RIGHT) {
        return 1;
    } else {
        return 0;
    }
}

function direction_y(d: u32): i32 {
    if (d === DIRECTION_UP) {
        return -1;
    } else if (d === DIRECTION_DOWN) {
        return 1;
    } else {
        return 0;
    }
}

class Snake {
    xs: StaticArray<i32> = new StaticArray<i32>(GRID_WIDTH * GRID_HEIGHT);
    ys: StaticArray<i32> = new StaticArray<i32>(GRID_WIDTH * GRID_HEIGHT);
    length: u32 = 4;
    direction: u32 = DIRECTION_RIGHT;
    headIndex: u32 = 3;

    constructor() {
        this.xs[1] = 1;
        this.xs[2] = 2;
        this.xs[3] = 3;
    }

    moveAhead(): void {
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

    grow(): void {
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

    changeDirection(direction: u32): void {
        if (directionsAreOpposite(this.direction, direction)) return;
        this.direction = direction;
    }
}

function directionsAreOpposite(dir: u32, other: u32): bool {
    return dir == DIRECTION_UP && other == DIRECTION_DOWN ||
        dir == DIRECTION_DOWN && other == DIRECTION_UP ||
        dir == DIRECTION_LEFT && other == DIRECTION_RIGHT ||
        dir == DIRECTION_RIGHT && other == DIRECTION_LEFT;
}

function drawBackground(): void {
    env.canvas_set_fill_style(COLOR_BACKGROUND);
    env.canvas_fill_rect(0, 0, GRID_WIDTH * CELL_SIZE, GRID_HEIGHT * CELL_SIZE);
}

function drawSnake(snake: Snake): void {
    env.canvas_set_fill_style(COLOR_SNAKE);
    for (let i: u32 = 0; i < snake.length; i++) {
        env.canvas_fill_rect(snake.xs[i] * CELL_SIZE, snake.ys[i] * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    }
}

function drawApple(x: i32, y: i32): void {
    env.canvas_set_fill_style(COLOR_APPLE);
    env.canvas_fill_rect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
}

let appleX: i32 = 0, appleY: i32 = 0;
let stepPeriod: i32 = 300;
let score: i32 = 0;
let nextReward: i32 = 10;
let snake = new Snake();

function teleportApple(): void {
    appleX = env.random(GRID_WIDTH);
    appleY = env.random(GRID_HEIGHT);
}

function speedupGame(): void {
    if (stepPeriod > 50) {
        stepPeriod -= 25;
        env.step_period_update(stepPeriod);
    }
}

function updateScore(nextReward: i32): void {
    score += nextReward;
    nextReward += 10;
}

function repaint(): void {
    drawBackground();
    drawSnake(snake);
    drawApple(appleX, appleY);
    env.canvas_fill();
}

export function direction_changed(direction: u32): void {
    snake.changeDirection(direction);
}

function snakeBitesHimself(snake: Snake): bool {
    for (let i: u32 = 0; i < snake.length; i++) {
        if (i === snake.headIndex) continue;
        if (snake.xs[snake.headIndex] === snake.xs[i] && snake.ys[snake.headIndex] === snake.ys[i]) {
            return true;
        }
    }
    return false;
}

function snakeIsOutOfBounds(snake: Snake): bool {
    return snake.xs[snake.headIndex] < 0 ||
        snake.xs[snake.headIndex] >= GRID_WIDTH ||
        snake.ys[snake.headIndex] < 0 ||
        snake.ys[snake.headIndex] >= GRID_HEIGHT;
}

function snakeWillReachPosition(snake: Snake, x: i32, y: i32): bool {
    let nextX = snake.xs[snake.headIndex] + direction_x(snake.direction);
    let nextY = snake.ys[snake.headIndex] + direction_y(snake.direction);
    return nextX === x && nextY === y;
}

export function step(timestamp: u32): void {
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