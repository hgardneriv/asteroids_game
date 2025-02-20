// server.js
const express = require('express');
const app = express();

app.use(express.static('public'));

app.listen(3000, () => {
    console.log('Game running on http://localhost:3000');
});

// public/sketch.js (p5.js code)
let ship;
let asteroids = [];

function setup() {
    createCanvas(800, 600);
    ship = {
        x: width/2,
        y: height/2,
        angle: 0
    };
}

function draw() {
    background(0);
    
    // Draw ship
    push();
    translate(ship.x, ship.y);
    rotate(ship.angle);
    triangle(-10, 10, 0, -10, 10, 10);
    pop();

    // Handle asteroids
    if (random() < 0.02) {
        asteroids.push({
            x: width,
            y: random(height),
            speed: random(1, 3)
        });
    }

    for (let i = asteroids.length - 1; i >= 0; i--) {
        let a = asteroids[i];
        a.x -= a.speed;
        
        // Draw asteroid
        fill(150);
        circle(a.x, a.y, 20);
        
        if (a.x < 0) {
            asteroids.splice(i, 1);
        }
    }
}

function keyPressed() {
    if (keyCode === UP_ARROW) {
        ship.y -= 5;
    } else if (keyCode === DOWN_ARROW) {
        ship.y += 5;
    } else if (keyCode === LEFT_ARROW) {
        ship.angle -= 0.1;
    } else if (keyCode === RIGHT_ARROW) {
        ship.angle += 0.1;
    }
}
