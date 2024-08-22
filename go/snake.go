package main

//export canvas_set_fill_style
func canvas_set_fill_style(color int)

//export canvas_fill_rect
func canvas_fill_rect(x int, y int, width int, height int)

//export canvas_fill
func canvas_fill()

//export snake_score_change
func snake_score_change(score int)

//export step_period_update
func step_period_update(period int)

//export game_over
func game_over()

//export js_random
func js_random(max int) int

type Direction int

func (dir Direction) isOpposite(other Direction) bool {
	return (dir == DIRECTION_UP && other == DIRECTION_DOWN) ||
		(dir == DIRECTION_DOWN && other == DIRECTION_UP) ||
		(dir == DIRECTION_LEFT && other == DIRECTION_RIGHT) ||
		(dir == DIRECTION_RIGHT && other == DIRECTION_LEFT)
}

func (dir Direction) x() int {
	switch dir {
	case DIRECTION_LEFT:
		return -1
	case DIRECTION_RIGHT:
		return 1
	default:
		return 0
	}
}

func (dir Direction) y() int {
	switch dir {
	case DIRECTION_UP:
		return -1
	case DIRECTION_DOWN:
		return 1
	default:
		return 0
	}
}

const (
	KEY_CODE_ARROW_UP = iota
	KEY_CODE_ARROW_DOWN
	KEY_CODE_ARROW_LEFT
	KEY_CODE_ARROW_RIGHT
)

const (
	DIRECTION_UP Direction = iota
	DIRECTION_DOWN
	DIRECTION_LEFT
	DIRECTION_RIGHT
)

const (
	COLOR_BACKGROUND = 0x00000000
	COLOR_SNAKE      = 0x00ff00
	COLOR_APPLE      = 0xff0000
	CELL_SIZE        = 10
	GRID_WIDTH       = 40
	GRID_HEIGHT      = 40
)

type Snake struct {
	xs          [GRID_WIDTH * GRID_HEIGHT]int
	ys          [GRID_WIDTH * GRID_HEIGHT]int
	length      int
	head        int
	apple_x     int
	apple_y     int
	stepPeriod  int
	score       int
	next_reward int
	direction   Direction
}

func (snake *Snake) snakeEatsHimself() bool {
	for i := int(0); i < snake.length; i++ {
		if i == snake.head {
			continue
		}
		if snake.xs[snake.head] == snake.xs[i] && snake.ys[snake.head] == snake.ys[i] {
			return true
		}
	}
	return false
}

func (snake *Snake) snakeIsOutOfBounds(width, height int) bool {
	return snake.xs[snake.head] < 0 ||
		snake.xs[snake.head] >= width ||
		snake.ys[snake.head] < 0 ||
		snake.ys[snake.head] >= height
}

func (snake *Snake) snakeMoveAhead() {
	nextX := snake.xs[snake.head] + snake.direction.x()
	nextY := snake.ys[snake.head] + snake.direction.y()
	if snake.head == snake.length-1 {
		snake.head = 0
	} else {
		snake.head++
	}
	snake.xs[snake.head] = nextX
	snake.ys[snake.head] = nextY
}

func (snake *Snake) snakeGrow() {
	nextX := snake.xs[snake.head] + snake.direction.x()
	nextY := snake.ys[snake.head] + snake.direction.y()
	if snake.head == snake.length {
		snake.xs[snake.length] = nextX
		snake.ys[snake.length] = nextY
	} else {
		for i := snake.length; i > snake.head; i-- {
			snake.xs[i+1] = snake.xs[i]
			snake.ys[i+1] = snake.ys[i]
		}
		snake.xs[snake.head+1] = nextX
		snake.ys[snake.head+1] = nextY
	}
	snake.length++
}

func paintBackground() {
	canvas_set_fill_style(COLOR_BACKGROUND)
	canvas_fill_rect(0, 0, GRID_WIDTH*CELL_SIZE, GRID_HEIGHT*CELL_SIZE)
}

func paintSnake(snake *Snake) {
	canvas_set_fill_style(COLOR_SNAKE)
	for i := int(0); i < snake.length; i++ {
		canvas_fill_rect(snake.xs[i]*CELL_SIZE, snake.ys[i]*CELL_SIZE, CELL_SIZE, CELL_SIZE)
	}
}

func paintApple(x, y int) {
	canvas_set_fill_style(COLOR_APPLE)
	canvas_fill_rect(x*CELL_SIZE, y*CELL_SIZE, CELL_SIZE, CELL_SIZE)
}

var GAME_STATE Snake

func changeSnakeDirection(state *Snake, d Direction) {
	if state.direction.isOpposite(d) {
		return
	}
	state.direction = d
}

func speedupGame(state *Snake) {
	if state.stepPeriod > 50 {
		state.stepPeriod -= 25
		step_period_update(state.stepPeriod)
	}
}

func (snake *Snake) snakeWillEatApple() bool {
	return snake.xs[snake.head]+snake.direction.x() == snake.apple_x &&
		snake.ys[snake.head]+snake.direction.y() == snake.apple_y
}

func updateScore(state *Snake) {
	state.score += state.next_reward
	state.next_reward += 10
}

func teleportApple(state *Snake) {
	state.apple_x = int(js_random(GRID_WIDTH))
	state.apple_y = int(js_random(GRID_HEIGHT))
}

func repaint(state *Snake) {
	paintBackground()
	paintSnake(state)
	paintApple(state.apple_x, state.apple_y)
	canvas_fill()
}

//export on_key_down
func on_key_down(code int) {
	switch code {
	case KEY_CODE_ARROW_UP:
		changeSnakeDirection(&GAME_STATE, DIRECTION_UP)
	case KEY_CODE_ARROW_DOWN:
		changeSnakeDirection(&GAME_STATE, DIRECTION_DOWN)
	case KEY_CODE_ARROW_LEFT:
		changeSnakeDirection(&GAME_STATE, DIRECTION_LEFT)
	case KEY_CODE_ARROW_RIGHT:
		changeSnakeDirection(&GAME_STATE, DIRECTION_RIGHT)
	}
}

//export step
func step(_timestamp int) {
	if GAME_STATE.snakeWillEatApple() {
		GAME_STATE.snakeGrow()
		teleportApple(&GAME_STATE)
		speedupGame(&GAME_STATE)
		updateScore(&GAME_STATE)
		snake_score_change(GAME_STATE.score)
	} else {
		GAME_STATE.snakeMoveAhead()
	}
	if GAME_STATE.snakeIsOutOfBounds(GRID_WIDTH, GRID_HEIGHT) || GAME_STATE.snakeEatsHimself() {
		game_over()
	}
	repaint(&GAME_STATE)
}

//export init
func init() {
	GAME_STATE.stepPeriod = 300
	GAME_STATE.next_reward = 10
	teleportApple(&GAME_STATE)
	GAME_STATE.length = 4
	GAME_STATE.head = 3
	GAME_STATE.direction = DIRECTION_RIGHT
	GAME_STATE.xs[1] = 1
	GAME_STATE.xs[2] = 2
	GAME_STATE.xs[3] = 3
	repaint(&GAME_STATE)
	snake_score_change(0)
}

func main() {}
