#include <stdint.h>
#include <stdbool.h>

extern void canvas_set_fill_style(uint32_t color);
extern void canvas_fill_rect(int32_t x, int32_t y, int32_t width, int32_t height);
extern void canvas_fill(void);
extern void snake_score_change(int32_t score);
extern void step_period_update(int32_t period);
extern void game_over(void);
extern int32_t random(int32_t max);

#define COLOR_BACKGROUND 0x00000000
#define COLOR_SNAKE 0x00ff00
#define COLOR_APPLE 0xff0000
#define CELL_SIZE 10
#define GRID_WIDTH 40
#define GRID_HEIGHT 40

typedef enum {
    DIRECTION_UP,
    DIRECTION_DOWN,
    DIRECTION_LEFT,
    DIRECTION_RIGHT
} Direction;

typedef enum {
    KEY_CODE_ARROW_UP,
    KEY_CODE_ARROW_DOWN,
    KEY_CODE_ARROW_LEFT,
    KEY_CODE_ARROW_RIGHT
} KeyCode;

bool direction_is_opposite(Direction dir, Direction other) {
    return dir == DIRECTION_UP && other == DIRECTION_DOWN ||
           dir == DIRECTION_DOWN && other == DIRECTION_UP ||
           dir == DIRECTION_LEFT && other == DIRECTION_RIGHT ||
           dir == DIRECTION_RIGHT && other == DIRECTION_LEFT;
}

int32_t direction_x(Direction d) {
    if (d == DIRECTION_LEFT) {
        return -1;
    } else if (d == DIRECTION_RIGHT) {
        return 1;
    } else {
        return 0;
    }
}

int32_t direction_y(Direction d) {
    if (d == DIRECTION_UP) {
        return -1;
    } else if (d == DIRECTION_DOWN) {
        return 1;
    } else {
        return 0;
    }
}

typedef struct {
    int32_t xs[GRID_WIDTH * GRID_HEIGHT];
    int32_t ys[GRID_WIDTH * GRID_HEIGHT];
    int32_t length;
    int32_t head;
    int32_t apple_x;
    int32_t apple_y;
    int32_t stepPeriod;
    int32_t score;
    int32_t next_reward;
    Direction direction;
} Snake;

bool snake_eats_himself(Snake *snake) {
    for (int32_t i = 0; i < snake->length; i++) {
        if (i == snake->head) {
            continue;
        }
        if (snake->xs[snake->head] == snake->xs[i] && snake->ys[snake->head] == snake->ys[i]) {
            return true;
        }
    }
    return false;
}

bool snake_is_out_of_bounds(Snake *snake, int32_t width, int32_t height) {
    return snake->xs[snake->head] < 0 ||
           snake->xs[snake->head] >= width ||
           snake->ys[snake->head] < 0 ||
           snake->ys[snake->head] >= height;
}

void snake_move_ahead(Snake *snake) {
    int32_t next_x = snake->xs[snake->head] + direction_x(snake->direction);
    int32_t next_y = snake->ys[snake->head] + direction_y(snake->direction);
    if (snake->head == snake->length - 1) {
        snake->head = 0;
    } else {
        snake->head++;
    }
    snake->xs[snake->head] = next_x;
    snake->ys[snake->head] = next_y;
}

void snake_grow(Snake *snake) {
    int32_t next_x = snake->xs[snake->head] + direction_x(snake->direction);
    int32_t next_y = snake->ys[snake->head] + direction_y(snake->direction);
    if (snake->head == snake->length) {
        snake->xs[snake->length] = next_x;
        snake->ys[snake->length] = next_y;
    } else {
        for (int32_t i = snake->length; i > snake->head; i--) {
            snake->xs[i + 1] = snake->xs[i];
            snake->ys[i + 1] = snake->ys[i];
        }
        snake->xs[snake->head + 1] = next_x;
        snake->ys[snake->head + 1] = next_y;
    }
    snake->length++;
}

void paint_background(void) {
    canvas_set_fill_style(COLOR_BACKGROUND);
    canvas_fill_rect(0, 0, GRID_WIDTH * CELL_SIZE, GRID_HEIGHT * CELL_SIZE);
}

void paint_snake(Snake *snake) {
    canvas_set_fill_style(COLOR_SNAKE);
    for (int i = 0; i < snake->length; i++) {
        canvas_fill_rect(snake->xs[i] * CELL_SIZE, snake->ys[i] * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    }
}

void paint_apple(int32_t x, int32_t y) {
    canvas_set_fill_style(COLOR_APPLE);
    canvas_fill_rect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
}

static Snake GAME_STATE;


void change_snake_direction(Snake *state, Direction d) {
    if (direction_is_opposite(state->direction, d)) {
        return;
    }
    state->direction = d;
}

void speedup_game(Snake *state) {
    if (state->stepPeriod > 50) {
        state->stepPeriod -= 25;
        step_period_update(state->stepPeriod);
    }
}

bool snake_will_eat_apple(Snake *snake) {
    return 
        snake->xs[snake->head] + direction_x(snake->direction) == snake->apple_x &&
        snake->ys[snake->head] + direction_y(snake->direction) == snake->apple_y;
}

void update_score(Snake *state) {
    state->score += state->next_reward;
    state->next_reward += 10;
}

void teleport_apple(Snake *state) {
    state->apple_x = random(GRID_WIDTH);
    state->apple_y = random(GRID_HEIGHT);
}

void repaint(Snake *state) {
    paint_background();
    paint_snake(state);
    paint_apple(state->apple_x, state->apple_y);
    canvas_fill();
}

void on_key_down(KeyCode code) {
    switch (code) {
    case KEY_CODE_ARROW_UP:
        change_snake_direction(&GAME_STATE, DIRECTION_UP);
        break;
    case KEY_CODE_ARROW_DOWN:
        change_snake_direction(&GAME_STATE, DIRECTION_DOWN);
        break;
    case KEY_CODE_ARROW_LEFT:
        change_snake_direction(&GAME_STATE, DIRECTION_LEFT);
        break;
    case KEY_CODE_ARROW_RIGHT:
        change_snake_direction(&GAME_STATE, DIRECTION_RIGHT);
        break;
    }
}

void step(int32_t timestamp) {
    if (snake_will_eat_apple(&GAME_STATE)) {
        snake_grow(&GAME_STATE);
        teleport_apple(&GAME_STATE);
        speedup_game(&GAME_STATE);
        update_score(&GAME_STATE);
        snake_score_change(GAME_STATE.score);
    } else {
        snake_move_ahead(&GAME_STATE);
    }
    if (snake_is_out_of_bounds(&GAME_STATE, GRID_WIDTH, GRID_HEIGHT) || snake_eats_himself(&GAME_STATE)) {
        game_over();
    }
    repaint(&GAME_STATE);
}

void init() {
    GAME_STATE.stepPeriod = 300;
    GAME_STATE.next_reward = 10;
    teleport_apple(&GAME_STATE);
    GAME_STATE.length = 4;
    GAME_STATE.head = 3;
    GAME_STATE.direction = DIRECTION_RIGHT;
    GAME_STATE.xs[1] = 1;
    GAME_STATE.xs[2] = 2;
    GAME_STATE.xs[3] = 3;
    repaint(&GAME_STATE);
    snake_score_change(0);
}