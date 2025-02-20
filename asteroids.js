// asteroids.js
const readline = require('readline');

// Game setup
class Game {
    constructor() {
        this.width = 20;
        this.height = 10;
        this.player = { x: 10, y: 5 }; // Player's ship position
        this.asteroids = [];
        this.score = 0;
        this.gameOver = false;

        // Setup input handling
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        readline.emitKeypressEvents(process.stdin);
        process.stdin.setRawMode(true);
    }

    // Spawn new asteroid
    spawnAsteroid() {
        const asteroid = {
            x: this.width - 1,
            y: Math.floor(Math.random() * this.height)
        };
        this.asteroids.push(asteroid);
    }

    // Draw game state
    draw() {
        console.clear();
        let board = Array(this.height).fill().map(() => Array(this.width).fill(' '));

        // Place player
        board[this.player.y][this.player.x] = '^';

        // Place asteroids
        this.asteroids.forEach(a => {
            if (a.x >= 0 && a.x < this.width && a.y >= 0 && a.y < this.height) {
                board[a.y][a.x] = '*';
            }
        });

        // Print board
        console.log('Score:', this.score);
        console.log('-'.repeat(this.width + 2));
        board.forEach(row => console.log('|' + row.join('') + '|'));
        console.log('-'.repeat(this.width + 2));
    }

    // Update game state
    update() {
        // Move asteroids
        this.asteroids = this.asteroids.map(a => ({ ...a, x: a.x - 1 }))
            .filter(a => a.x >= 0);

        // Check collisions
        this.asteroids.forEach(a => {
            if (a.x === this.player.x && a.y === this.player.y) {
                this.gameOver = true;
            }
        });

        // Randomly spawn new asteroids
        if (Math.random() < 0.2) {
            this.spawnAsteroid();
        }

        this.score++;
    }

    // Handle input
    setupInput() {
        process.stdin.on('keypress', (str, key) => {
            if (key.ctrl && key.name === 'c') {
                process.exit();
            }
            if (!this.gameOver) {
                switch (key.name) {
                    case 'up':
                        this.player.y = Math.max(0, this.player.y - 1);
                        break;
                    case 'down':
                        this.player.y = Math.min(this.height - 1, this.player.y + 1);
                        break;
                }
            }
        });
    }

    // Main game loop
    run() {
        this.setupInput();
        this.draw();

        const gameLoop = setInterval(() => {
            if (!this.gameOver) {
                this.update();
                this.draw();
            } else {
                clearInterval(gameLoop);
                console.log('Game Over! Final Score:', this.score);
                this.rl.close();
            }
        }, 200);
    }
}

// Start the game
const game = new Game();
console.log('Use arrow keys to move. Ctrl+C to quit.');
game.run();
