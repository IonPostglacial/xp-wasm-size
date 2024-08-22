#![no_std]

#[link(wasm_import_module = "env")]
extern "C" {
    fn canvas_set_fill_style(color: u32);
    fn canvas_fill_rect(x: usize, y: usize, width: usize, height: usize);
    fn canvas_fill();
    fn snake_score_change(s: i32);
    fn step_period_update(period: i32);
    fn game_over();
    fn random(max: usize) -> i32;
}

const COLOR_BACKGROUND: u32 = 0x00000000;
const COLOR_SNAKE: u32 = 0x00ff00;
const COLOR_APPLE: u32 = 0xff0000;
const KEY_CODE_ARROW_UP: u32 = 0;
const KEY_CODE_ARROW_DOWN: u32 = 1;
const KEY_CODE_ARROW_LEFT: u32 = 2;
const KEY_CODE_ARROW_RIGHT: u32 = 3;
const CELL_SIZE: usize = 10;
const GRID_WIDTH: usize = 40;
const GRID_HEIGHT: usize = 40;

#[derive(Clone, Copy, PartialEq)]
enum Direction {
    Up,
    Down,
    Left,
    Right,
}

impl Direction {
    fn dx(&self) -> i32 {
        match self {
            Direction::Left => -1,
            Direction::Right => 1,
            _ => 0,
        }
    }

    fn dy(&self) -> i32 {
        match self {
            Direction::Up => -1,
            Direction::Down => 1,
            _ => 0,
        }
    }

    fn is_opposite(self, other: Direction) -> bool {
        self == Direction::Up && other == Direction::Down || 
        self == Direction::Down && other == Direction::Up ||
        self == Direction::Left && other == Direction::Right ||
        self == Direction::Right && other == Direction::Left
    }
}

struct Snake {
    xs: [i32; GRID_WIDTH * GRID_HEIGHT],
    ys: [i32; GRID_WIDTH * GRID_HEIGHT],
    length: usize,
    head: usize,
    direction: Direction,
}

impl Snake {
    fn eats_himself(self: &Snake) -> bool {
        for i in 0..self.length {
            if i == self.head {
                continue;
            }
            if self.xs[self.head] == self.xs[i] && self.ys[self.head] == self.ys[i] {
                return true;
            }
        }
        false
    }

    fn is_out_of_bounds(self: &Snake, width: usize, height: usize) -> bool {
        self.xs[self.head] < 0 || 
        self.xs[self.head] >= width as i32 || 
        self.ys[self.head] < 0 || 
        self.ys[self.head] >= height as i32
    }

    fn move_ahead(self: &mut Snake) {
        let next_x = self.xs[self.head] + self.direction.dx();
        let next_y = self.ys[self.head] + self.direction.dy();
        if self.head == self.length - 1 {
            self.head = 0;
        } else {
            self.head += 1;
        }
        self.xs[self.head] = next_x;
        self.ys[self.head] = next_y;
    }

    fn grow(self: &mut Snake) {
        let next_x = self.xs[self.head] + self.direction.dx();
        let next_y = self.ys[self.head] + self.direction.dy();
        if self.head == self.length {
            self.xs[self.length] = next_x;
            self.ys[self.length] = next_y;
        } else {
            for i in ((self.head+1)..=self.length).rev() {
                self.xs[i + 1] = self.xs[i];
                self.ys[i + 1] = self.ys[i];
            }
            self.xs[self.head + 1] = next_x;
            self.ys[self.head + 1] = next_y;
        }
        self.length += 1;
    }
}

fn paint_background() {
    unsafe {
        canvas_set_fill_style(COLOR_BACKGROUND);
        canvas_fill_rect(0, 0, GRID_WIDTH * CELL_SIZE, GRID_HEIGHT * CELL_SIZE);
    }
}

fn paint_snake(snake: &Snake) {
    unsafe {
        canvas_set_fill_style(COLOR_SNAKE);
        for i in 0..snake.length {
            canvas_fill_rect(
                snake.xs[i] as usize * CELL_SIZE,
                snake.ys[i] as usize * CELL_SIZE,
                CELL_SIZE,
                CELL_SIZE,
            );
        }
    }
}

fn paint_apple(x: i32, y: i32) {
    unsafe {
        canvas_set_fill_style(COLOR_APPLE);
        canvas_fill_rect(
            x as usize * CELL_SIZE,
            y as usize * CELL_SIZE,
            CELL_SIZE,
            CELL_SIZE,
        );
    }
}

pub struct GameState {
    snake: Snake,
    apple_x: i32,
    apple_y: i32,
    step_period: i32,
    score: i32,
    next_reward: i32,
}

impl GameState {
    pub const fn new() -> GameState {
        let mut game_state = GameState {
            snake: Snake {
                xs: [0; GRID_WIDTH * GRID_HEIGHT],
                ys: [0; GRID_WIDTH * GRID_HEIGHT],
                length: 4,
                head: 3,
                direction: Direction::Right,
            },
            apple_x: 0,
            apple_y: 0,
            step_period: 300,
            score: 0,
            next_reward: 10,
        };
        game_state.snake.xs[1] = 1;
        game_state.snake.xs[2] = 2;
        game_state.snake.xs[3] = 3;
        game_state
    }

    fn change_snake_direction(&mut self, d: Direction) {
        if self.snake.direction.is_opposite(d) {
            return;
        }
        self.snake.direction = d;
    }

    fn speedup_game(&mut self) {
        if self.step_period > 50 {
            self.step_period -= 25;
            unsafe {
                step_period_update(self.step_period);
            }
        }
    }

    fn snake_will_eat_apple(&self) -> bool {
        self.snake.xs[self.snake.head] == self.apple_x &&
        self.snake.ys[self.snake.head] == self.apple_y
    }

    fn update_score(&mut self) {
        self.score += self.next_reward;
        self.next_reward += 10;
    }

    fn teleport_apple(&mut self) {
        unsafe {
            self.apple_x = random(GRID_WIDTH);
            self.apple_y = random(GRID_HEIGHT);
        }
    }

    fn repaint(&self) {
        paint_background();
        paint_snake(&self.snake);
        paint_apple(self.apple_x, self.apple_y);
        unsafe {
            canvas_fill();
        }
    }

    pub fn on_key_down(&mut self, code: u32) {
        match code {
            KEY_CODE_ARROW_UP => self.change_snake_direction(Direction::Up),
            KEY_CODE_ARROW_DOWN => self.change_snake_direction(Direction::Down),
            KEY_CODE_ARROW_LEFT => self.change_snake_direction(Direction::Left),
            KEY_CODE_ARROW_RIGHT => self.change_snake_direction(Direction::Right),
            _ => todo!(),
        }
    }

    pub fn step(&mut self, _timestamp: i32) {
        if self.snake_will_eat_apple() {
            self.snake.grow();
            self.teleport_apple();
            self.speedup_game();
            self.update_score();
            unsafe {
                snake_score_change(self.score);
            }
        } else {
            self.snake.move_ahead();
        }
        if self.snake.is_out_of_bounds(GRID_WIDTH, GRID_HEIGHT) || self.snake.eats_himself()
        {
            unsafe { game_over() };
        }
        self.repaint();
    }
}

#[cfg(target_arch = "wasm32")]
use core::panic::PanicInfo;

#[cfg(not(test))]
#[cfg(target_arch = "wasm32")]
#[panic_handler]
fn panic(_info: &PanicInfo) -> ! {
    loop {}
}

#[cfg(target_arch = "wasm32")]
static mut GAME_STATE: GameState = GameState::new();

#[cfg(target_arch = "wasm32")]
#[no_mangle]
pub unsafe extern fn init() {
    GAME_STATE.teleport_apple();
    GAME_STATE.repaint();
}

#[cfg(target_arch = "wasm32")]
#[no_mangle]
pub unsafe extern fn step(_timestamp: i32) {
    GAME_STATE.step(_timestamp);
}

#[cfg(target_arch = "wasm32")]
#[no_mangle]
pub unsafe extern fn on_key_down(code: u32) {
    GAME_STATE.on_key_down(code);
}