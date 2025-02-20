// public/sketch.js
let ship;
let asteroids = [];
let bullets = [];
let score = 0;
let gameOver = false;
let shotsFired = 0;
let hits = 0;
let lives = 3;
let explosionParticles = [];
let explosionSound;
let shootSound;
let backgroundMusic;
let isExploding = false;
let explosionTimer = 0;
const PAUSE_DURATION = 3000;
const MUSIC_VOLUME = 0.5;
const SHOOT_VOLUME = 0.3;

// Key state tracking
let keys = {
    left: false,
    right: false,
    up: false,
    space: false
};

function preload() {
    // TODO: When deploying on-line update the location of the sound file, typically with URL of hosted sound file or asset
    explosionSound = loadSound('explosion.mp3');
    shootSound = loadSound('shoot.mp3');
    backgroundMusic = loadSound('background.mp3');
}

function setup() {
    createCanvas(800, 600);
    resetGame();
}

function resetGame() {
    ship = {
        x: width/2,
        y: height/2,
        angle: 0,
        speed: 0,
        maxSpeed: 5
    };
    asteroids = [];
    bullets = [];
    score = 0;
    gameOver = false;
    shotsFired = 0;
    hits = 0;
    lives = 3;
    explosionParticles = [];
    isExploding = false;
    explosionTimer = 0;
    
    backgroundMusic.loop();
    backgroundMusic.setVolume(MUSIC_VOLUME);
    shootSound.setVolume(SHOOT_VOLUME);
}

function draw() {
    background(0);
    
    if (!gameOver) {
        if (isExploding) {
            updateExplosion();
            drawExplosion();
            explosionTimer += deltaTime;
            if (explosionTimer >= PAUSE_DURATION) {
                isExploding = false;
                explosionTimer = 0;
                explosionParticles = [];
                ship.speed = 0;
            }
        } else {
            updateGame();
            drawGame();
        }
    } else {
        drawGameOver();
        backgroundMusic.stop();
    }
}

function updateGame() {
    // Handle continuous rotation
    if (keys.left) {
        ship.angle -= 0.1;
    }
    if (keys.right) {
        ship.angle += 0.1;
    }
    
    // Handle thrust
    if (keys.up) {
        ship.speed = min(ship.speed + 0.2, ship.maxSpeed);
    } else {
        ship.speed = max(ship.speed - 0.1, 0);
    }
    
    // Handle firing
    if (keys.space) {
        let firingAngle = ship.angle - PI / 2;
        let noseX = ship.x + cos(firingAngle) * 15;
        let noseY = ship.y + sin(firingAngle) * 15;
        
        bullets.push({
            x: noseX,
            y: noseY,
            dx: cos(firingAngle) * 7,
            dy: sin(firingAngle) * 7
        });
        shotsFired++;
        shootSound.play();
        keys.space = false;
    }

    // Update ship position
    let thrustAngle = ship.angle - PI / 2;
    ship.x += cos(thrustAngle) * ship.speed;
    ship.y += sin(thrustAngle) * ship.speed;
    
    // Wrap around edges
    ship.x = (ship.x + width) % width;
    ship.y = (ship.y + height) % height;
    
    // Spawn asteroids
    if (random() < 0.02) {
        asteroids.push(createAsteroid());
    }
    
    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
        let a = asteroids[i];
        a.x += a.dx;
        a.y += a.dy;
        
        // Wrap asteroids
        a.x = (a.x + width) % width;
        a.y = (a.y + height) % height;
        
        // Check collision with ship
        if (dist(ship.x, ship.y, a.x, a.y) < a.size + 10) {
            lives--;
            asteroids.splice(i, 1);
            triggerExplosion(ship.x, ship.y);
            ship.x = width/2;
            ship.y = height/2;
            if (lives <= 0) {
                gameOver = true;
            }
            break;
        }
        
        // Check collision with bullets
        for (let j = bullets.length - 1; j >= 0; j--) {
            let b = bullets[j];
            if (dist(b.x, b.y, a.x, a.y) < a.size) {
                asteroids.splice(i, 1);
                bullets.splice(j, 1);
                score += 10;
                hits++;
                break;
            }
        }
    }
    
    // Update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        let b = bullets[i];
        b.x += b.dx;
        b.y += b.dy;
        
        if (b.x < 0 || b.x > width || b.y < 0 || b.y > height) {
            bullets.splice(i, 1);
        }
    }
}

function triggerExplosion(x, y) {
    isExploding = true;
    explosionTimer = 0;
    explosionSound.play();
    for (let i = 0; i < 20; i++) {
        explosionParticles.push({
            x: x,
            y: y,
            vx: random(-2, 2),
            vy: random(-2, 2),
            size: random(2, 5),
            life: 60
        });
    }
}

function updateExplosion() {
    for (let i = explosionParticles.length - 1; i >= 0; i--) {
        let p = explosionParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        if (p.life <= 0) {
            explosionParticles.splice(i, 1);
        }
    }
}

function drawGame() {
    // Draw ship
    push();
    translate(ship.x, ship.y);
    rotate(ship.angle);
    fill(255);
    triangle(-10, 10, 0, -15, 10, 10);
    pop();
    
    // Draw asteroids
    fill(150);
    asteroids.forEach(a => {
        circle(a.x, a.y, a.size * 2);
    });
    
    // Draw bullets (white)
    fill(255);
    bullets.forEach(b => {
        circle(b.x, b.y, 5);
    });
    
    // Draw score and lives
    textSize(20);
    fill(255);
    text(`Score: ${score}`, 10, 30);
    text(`Lives: ${lives}`, 10, 50);
}

function drawExplosion() {
    fill(255, 150, 0);
    explosionParticles.forEach(p => {
        circle(p.x, p.y, p.size);
    });
}

function drawGameOver() {
    textSize(40);
    fill(255);
    textAlign(CENTER, CENTER);
    
    let accuracy = shotsFired > 0 ? (hits / shotsFired * 100).toFixed(2) : 0;
    let gameOverText = `Game Over\nScore: ${score}\nShots Fired: ${shotsFired}\nHits: ${hits}\nAccuracy: ${accuracy}%`;
    text(gameOverText, width/2, height/2 - 50);
    
    fill(100);
    rectMode(CENTER);
    rect(width/2, height/2 + 100, 200, 50);
    fill(255);
    textSize(20);
    text("Restart", width/2, height/2 + 105);
}

function createAsteroid() {
    let edge = floor(random(4));
    let x, y, dx, dy;
    
    switch(edge) {
        case 0: x = 0; y = random(height); dx = random(1, 3); dy = random(-1, 1); break;
        case 1: x = width; y = random(height); dx = random(-3, -1); dy = random(-1, 1); break;
        case 2: x = random(width); y = 0; dx = random(-1, 1); dy = random(1, 3); break;
        case 3: x = random(width); y = height; dx = random(-1, 1); dy = random(-3, -1);
    }
    
    return { x, y, dx, dy, size: random(10, 30) };
}

function keyPressed() {
    if (keyCode === LEFT_ARROW) keys.left = true;
    else if (keyCode === RIGHT_ARROW) keys.right = true;
    else if (keyCode === UP_ARROW) keys.up = true;
    else if (keyCode === 32) keys.space = true;
}

function keyReleased() {
    if (keyCode === LEFT_ARROW) keys.left = false;
    else if (keyCode === RIGHT_ARROW) keys.right = false;
    else if (keyCode === UP_ARROW) keys.up = false;
}

function mousePressed() {
    if (gameOver) {
        let buttonX = width/2 - 100;
        let buttonY = height/2 + 75;
        let buttonWidth = 200;
        let buttonHeight = 50;
        
        if (mouseX > buttonX && mouseX < buttonX + buttonWidth &&
            mouseY > buttonY && mouseY < buttonY + buttonHeight) {
            resetGame();
        }
    }
}
