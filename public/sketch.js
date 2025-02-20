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
let saucerSound;
let isExploding = false;
let explosionTimer = 0;
let saucer = null;
let saucerBullets = [];
let saucerShotCounter = 0;
let saucerSpawned = false;
let levelCompleted = false;
let initialAsteroids = 2;
let saucerShotDirection = 1;

const PAUSE_DURATION = 3000;
const MUSIC_VOLUME = 0.5;
const SHOOT_VOLUME = 0.3;

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
    saucerSound = loadSound('saucer.mp3');
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
    saucer = null;
    saucerBullets = [];
    saucerShotCounter = 0;
    saucerSpawned = false;
    levelCompleted = false;
    saucerShotDirection = 1;
    
    backgroundMusic.loop();
    backgroundMusic.setVolume(MUSIC_VOLUME);
    shootSound.setVolume(SHOOT_VOLUME);
    saucerSound.stop();
    
    for (let i = 0; i < initialAsteroids; i++) {
        asteroids.push(createAsteroid('large'));
    }
}

function draw() {
    background(0);
    
    if (!gameOver && !levelCompleted) {
        if (isExploding) {
            updateExplosion();
            drawExplosion();
            explosionTimer += deltaTime;
            if (explosionTimer >= PAUSE_DURATION) {
                isExploding = false;
                explosionTimer = 0;
                explosionParticles = [];
                ship.speed = 0;
                checkWinCondition();
            }
        } else {
            updateGame();
            drawGame();
        }
    } else if (gameOver) {
        drawGameOver();
        backgroundMusic.stop();
    } else if (levelCompleted) {
        drawLevelCompleted();
        backgroundMusic.stop();
    }
}

function updateGame() {
    if (keys.left) ship.angle -= 0.1;
    if (keys.right) ship.angle += 0.1;
    
    if (keys.up) {
        ship.speed = min(ship.speed + 0.2, ship.maxSpeed);
    } else {
        ship.speed = max(ship.speed - 0.1, 0);
    }
    
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

    let thrustAngle = ship.angle - PI / 2;
    ship.x += cos(thrustAngle) * ship.speed;
    ship.y += sin(thrustAngle) * ship.speed;
    
    ship.x = (ship.x + width) % width;
    ship.y = (ship.y + height) % height;
    
    if (asteroids.length === 2 && !saucerSpawned && saucer === null) {
        saucer = {
            x: 0,
            y: height/8,  // Start at middle of top 1/4
            dx: 3,
            dy: 1,        // Vertical speed for zig-zag
            shootTimer: 0,
            direction: 1  // 1 for down, -1 for up
        };
        saucerShotCounter = 0;
        saucerSpawned = true;
        saucerSound.loop();
    }
    
    if (saucer) {
        saucer.x += saucer.dx;
        saucer.y += saucer.dy * saucer.direction;
        saucer.shootTimer += deltaTime;
        saucerShotCounter += deltaTime;
        
        // Zig-zag within top 1/4
        if (saucer.y > height/4) {
            saucer.y = height/4;
            saucer.direction = -1;  // Move up
        } else if (saucer.y < 0) {
            saucer.y = 0;
            saucer.direction = 1;   // Move down
        }
        
        if (saucer.x > width) {
            saucer.x = 0;
        }
        
        let baseInterval = map(saucerShotCounter, 0, 30000, 2000, 500);
        if (saucer.shootTimer > random(baseInterval, baseInterval + 500)) {
            let shootAngle = saucerShotDirection > 0 ? PI/4 : 3*PI/4;
            saucerBullets.push({
                x: saucer.x,
                y: saucer.y,
                dx: cos(shootAngle) * 5,
                dy: sin(shootAngle) * 5
            });
            saucerShotDirection *= -1;
            saucer.shootTimer = 0;
        }
    }
    
    for (let i = asteroids.length - 1; i >= 0; i--) {
        let a = asteroids[i];
        a.x += a.dx;
        a.y += a.dy;
        
        a.x = (a.x + width) % width;
        a.y = (a.y + height) % height;
        
        if (dist(ship.x, ship.y, a.x, a.y) < a.size + 10) {
            lives--;
            asteroids.splice(i, 1);
            triggerShipExplosion();
            ship.x = width/2;
            ship.y = height/2;
            if (lives <= 0) {
                gameOver = true;
            }
            break;
        }
        
        for (let j = bullets.length - 1; j >= 0; j--) {
            let b = bullets[j];
            if (dist(b.x, b.y, a.x, a.y) < a.size) {
                let asteroidSize = a.sizeType;
                asteroids.splice(i, 1);
                bullets.splice(j, 1);
                score += asteroidSize === 'large' ? 20 : asteroidSize === 'medium' ? 50 : 100;
                hits++;
                
                if (asteroidSize === 'large') {
                    asteroids.push(createAsteroid('medium', a.x, a.y));
                    asteroids.push(createAsteroid('small', a.x, a.y));
                    asteroids.push(createAsteroid('small', a.x, a.y));
                } else if (asteroidSize === 'medium') {
                    asteroids.push(createAsteroid('small', a.x, a.y));
                }
                checkWinCondition();
                break;
            }
        }
    }
    
    if (saucer) {
        for (let j = bullets.length - 1; j >= 0; j--) {
            let b = bullets[j];
            if (dist(b.x, b.y, saucer.x, saucer.y) < 15) {
                score += 100;
                triggerSaucerExplosion(saucer.x, saucer.y);
                saucer = null;
                saucerSound.stop();
                bullets.splice(j, 1);
                checkWinCondition();
                break;
            }
        }
    }
    
    for (let i = bullets.length - 1; i >= 0; i--) {
        let b = bullets[i];
        b.x += b.dx;
        b.y += b.dy;
        
        if (b.x < 0 || b.x > width || b.y < 0 || b.y > height) {
            bullets.splice(i, 1);
        }
    }
    
    for (let i = saucerBullets.length - 1; i >= 0; i--) {
        let b = saucerBullets[i];
        b.x += b.dx;
        b.y += b.dy;
        
        if (dist(ship.x, ship.y, b.x, b.y) < 15) {
            lives--;
            saucerBullets.splice(i, 1);
            triggerShipExplosion();
            ship.x = width/2;
            ship.y = height/2;
            if (lives <= 0) {
                gameOver = true;
            }
            break;
        }
        
        if (b.x < 0 || b.x > width || b.y < 0 || b.y > height) {
            saucerBullets.splice(i, 1);
            checkWinCondition();
        }
    }
}

function checkWinCondition() {
    if (asteroids.length === 0 && saucer === null && saucerBullets.length === 0) {
        levelCompleted = true;
    }
}

function triggerShipExplosion() {
    isExploding = true;
    explosionTimer = 0;
    explosionSound.play();
    for (let i = 0; i < 20; i++) {
        explosionParticles.push({
            x: ship.x,
            y: ship.y,
            vx: random(-2, 2),
            vy: random(-2, 2),
            size: random(2, 5),
            life: 60
        });
    }
}

function triggerSaucerExplosion(x, y) {
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
        if (p.life <= 0) explosionParticles.splice(i, 1);
    }
}

function drawGame() {
    push();
    translate(ship.x, ship.y);
    rotate(ship.angle);
    fill(255);
    triangle(-10, 10, 0, -15, 10, 10);
    pop();
    
    asteroids.forEach(a => {
        fill(150);
        circle(a.x, a.y, a.size * 2);
    });
    
    fill(255);
    bullets.forEach(b => circle(b.x, b.y, 5));
    
    if (saucer) {
        push();
        translate(saucer.x, saucer.y);
        // Lower disc with black and white outline
        fill(0);  // Black outline
        beginShape();
        vertex(-22, 2);      // Left edge slightly wider for outline
        bezierVertex(-17, 7, -7, 7, 0, 2);
        bezierVertex(7, 7, 17, 7, 22, 2);
        bezierVertex(17, -3, 7, -3, 0, 2);
        bezierVertex(-7, -3, -17, -3, -22, 2);
        endShape(CLOSE);
        fill(255);  // White inner fill
        beginShape();
        vertex(-20, 0);
        bezierVertex(-15, 5, -5, 5, 0, 0);
        bezierVertex(5, 5, 15, 5, 20, 0);
        bezierVertex(15, -5, 5, -5, 0, 0);
        bezierVertex(-5, -5, -15, -5, -20, 0);
        endShape(CLOSE);
        // Solid grey dome
        fill(150, 150, 150);
        ellipse(0, -5, 10, 10);
        pop();
    }
    
    fill(255, 0, 0);
    saucerBullets.forEach(b => circle(b.x, b.y, 5));
    
    textSize(20);
    fill(255);
    text(`Score: ${score}`, 10, 30);
    text(`Lives: ${lives}`, 10, 50);
}

function drawExplosion() {
    fill(255, 150, 0);
    explosionParticles.forEach(p => circle(p.x, p.y, p.size));
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

function drawLevelCompleted() {
    textSize(60);
    textAlign(CENTER, CENTER);
    fill(255, 0, 0);
    text("Level Completed!", width/2 + 2, height/2 - 32);
    fill(0, 255, 0);
    text("Level Completed!", width/2 - 2, height/2 - 32);
    fill(0, 0, 255);
    text("Level Completed!", width/2, height/2 - 30 + 2);
    fill(255, 255, 0);
    text("Level Completed!", width/2, height/2 - 30);
    
    textSize(20);
    fill(255);
    text("Press the Enter Key to Continue", width/2, height/2 + 20);
}

function createAsteroid(sizeType, x, y) {
    if (x === undefined || y === undefined) {
        let edge = floor(random(4));
        switch(edge) {
            case 0: x = 0; y = random(height); break;
            case 1: x = width; y = random(height); break;
            case 2: x = random(width); y = 0; break;
            case 3: x = random(width); y = height; break;
        }
    }
    
    let dx = random(-3, 3);
    let dy = random(-3, 3);
    
    let size;
    if (sizeType === 'large') size = 30;
    else if (sizeType === 'medium') size = 20;
    else if (sizeType === 'small') size = 10;
    
    return { x, y, dx, dy, size, sizeType };
}

function keyPressed() {
    if (keyCode === LEFT_ARROW) keys.left = true;
    else if (keyCode === RIGHT_ARROW) keys.right = true;
    else if (keyCode === UP_ARROW) keys.up = true;
    else if (keyCode === 32) keys.space = true;
    else if (keyCode === 13 && levelCompleted) {
        initialAsteroids++;
        resetGame();
    }
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