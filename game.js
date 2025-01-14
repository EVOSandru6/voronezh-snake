const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let gridSize;
let tileCountX;
let tileCountY;
let snake;
let food;
let dx = 0;
let dy = 0;
let score = 0;

const pressedKeys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false
};

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gridSize = 20; // Fixed grid size for consistent gameplay
    tileCountX = Math.floor(canvas.width / gridSize);
    tileCountY = Math.floor(canvas.height / gridSize);
    
    // Initialize snake and food positions after resize
    if (!snake) {
        snake = [{ 
            x: Math.floor(tileCountX / 2), 
            y: Math.floor(tileCountY / 2) 
        }];
        food = spawnFood();
    }
}

// Add resize listener
window.addEventListener('resize', resizeCanvas);
resizeCanvas(); // Initial resize

function spawnFood() {
    return {
        x: Math.floor(Math.random() * tileCountX),
        y: Math.floor(Math.random() * tileCountY)
    };
}

// Fireworks array to store active fireworks
let fireworks = [];

class Firework {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = canvas.height;
        this.targetY = Math.random() * (canvas.height * 0.5);
        this.speed = 3 + Math.random() * 3;
        this.particles = [];
        this.exploded = false;
        this.color = `hsl(${Math.random() * 360}, 100%, 50%)`;
    }

    update() {
        if (!this.exploded) {
            this.y -= this.speed;
            if (this.y <= this.targetY) {
                this.explode();
            }
        } else {
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.1; // gravity
                p.alpha -= 0.02;
                if (p.alpha <= 0) this.particles.splice(i, 1);
            }
        }
    }

    explode() {
        this.exploded = true;
        for (let i = 0; i < 50; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3;
            this.particles.push({
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                alpha: 1
            });
        }
    }

    draw() {
        if (!this.exploded) {
            ctx.beginPath();
            ctx.fillStyle = this.color;
            ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
            ctx.fill();
        } else {
            for (const p of this.particles) {
                ctx.beginPath();
                ctx.fillStyle = `hsla(${this.color.match(/\d+/)[0]}, 100%, 50%, ${p.alpha})`;
                ctx.arc(p.x, p.y, 1, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
}

// Add new firework occasionally
setInterval(() => {
    if (Math.random() < 0.3) { // 30% chance every 500ms
        fireworks.push(new Firework());
    }
}, 500);

document.addEventListener('keydown', (e) => {
    switch(e.key) {
        case 'ArrowUp':
            if (dy !== 1) { dx = 0; dy = -1; }
            break;
        case 'ArrowDown':
            if (dy !== -1) { dx = 0; dy = 1; }
            break;
        case 'ArrowLeft':
            if (dx !== 1) { dx = -1; dy = 0; }
            break;
        case 'ArrowRight':
            if (dx !== -1) { dx = 1; dy = 0; }
            break;
    }
});

function gameLoop() {
    // Clear canvas
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw "Voronezh"
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.font = '48px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText('Voronezh', canvas.width / 2, canvas.height / 2);

    // Update and draw fireworks
    for (let i = fireworks.length - 1; i >= 0; i--) {
        fireworks[i].update();
        fireworks[i].draw();
        if (fireworks[i].exploded && fireworks[i].particles.length === 0) {
            fireworks.splice(i, 1);
        }
    }

    // Move snake
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    
    // Wrap around screen edges
    head.x = (head.x + tileCountX) % tileCountX;
    head.y = (head.y + tileCountY) % tileCountY;
    
    snake.unshift(head);

    // Check if snake ate food
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        food = spawnFood();
    } else {
        snake.pop();
    }

    // Game over only on self collision
    if (checkCollision()) {
        alert(`Game Over! Score: ${score}`);
        snake = [{ x: Math.floor(tileCountX / 2), y: Math.floor(tileCountY / 2) }];
        dx = 0;
        dy = 0;
        score = 0;
        food = spawnFood();
    }

    // Draw snake
    ctx.fillStyle = 'green';
    snake.forEach(segment => {
        ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize - 2, gridSize - 2);
    });

    // Draw food
    ctx.fillStyle = 'red';
    ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 2, gridSize - 2);

    // Draw score with padding and background
    const scoreText = `Score: ${score}`;
    ctx.font = '20px "Press Start 2P"';
    const metrics = ctx.measureText(scoreText);
    const padding = 15;
    
    // Draw score background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(
        canvas.width - metrics.width - padding * 3, 
        padding, 
        metrics.width + padding * 2, 
        parseInt(ctx.font) + padding * 2
    );
    
    // Draw score text
    ctx.fillStyle = '#00ff00';  // Bright green color
    ctx.fillText(
        scoreText, 
        canvas.width - metrics.width - padding * 2,
        padding * 2 + parseInt(ctx.font) * 0.8
    );

    drawControls();

    setTimeout(gameLoop, 100);
}

function checkCollision() {
    // Only check if snake hits itself
    return snake.slice(1).some(segment => 
        Math.round(segment.x) === Math.round(snake[0].x) && 
        Math.round(segment.y) === Math.round(snake[0].y)
    );
}

// Add this function to draw controls
function drawControls() {
    const padding = 20;
    const buttonSize = 55; // Slightly larger buttons
    const spacing = 5;    // Space between buttons
    const cornerX = canvas.width - (buttonSize * 3) - padding;
    const cornerY = canvas.height - (buttonSize * 3) - padding;
    
    function drawButton(x, y, rotation, key, text) {
        const isPressed = pressedKeys[key];
        const padding = 8; // Padding inside buttons
        
        // Button background with padding
        ctx.fillStyle = isPressed ? 'rgba(100, 100, 100, 0.8)' : 'rgba(50, 50, 50, 0.8)';
        ctx.beginPath();
        ctx.roundRect(x, y, buttonSize, buttonSize, 10);
        ctx.fill();

        // Button border
        ctx.strokeStyle = isPressed ? '#00ff00' : 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw arrow with adjusted position
        ctx.save();
        ctx.translate(x + buttonSize/2, y + buttonSize/2 - 5);
        ctx.rotate(rotation * Math.PI / 180);
        
        // Arrow
        ctx.fillStyle = isPressed ? '#00ff00' : 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.moveTo(-8, 4);
        ctx.lineTo(8, 4);
        ctx.lineTo(0, -8);
        ctx.closePath();
        ctx.fill();

        ctx.restore();

        // Button text
        ctx.fillStyle = isPressed ? '#00ff00' : 'rgba(255, 255, 255, 0.8)';
        ctx.font = '10px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText(text, x + buttonSize/2, y + buttonSize - padding);
    }

    // Semi-transparent background panel
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.beginPath();
    ctx.roundRect(
        cornerX - padding,
        cornerY - padding,
        buttonSize * 3 + padding * 2 + spacing * 2,
        buttonSize * 3 + padding * 2 + spacing * 2,
        15
    );
    ctx.fill();

    // Draw buttons
    drawButton(cornerX + buttonSize + spacing, cornerY, 0, 'ArrowUp', 'UP');
    drawButton(cornerX + buttonSize * 2 + spacing * 2, cornerY + buttonSize + spacing, 90, 'ArrowRight', 'RIGHT');
    drawButton(cornerX + buttonSize + spacing, cornerY + buttonSize * 2 + spacing * 2, 180, 'ArrowDown', 'DOWN');
    drawButton(cornerX, cornerY + buttonSize + spacing, 270, 'ArrowLeft', 'LEFT');
}

// Add these event listeners outside of any function, at the global scope
document.addEventListener('keydown', (e) => {
    if (pressedKeys.hasOwnProperty(e.key)) {
        pressedKeys[e.key] = true;
    }
});

document.addEventListener('keyup', (e) => {
    if (pressedKeys.hasOwnProperty(e.key)) {
        pressedKeys[e.key] = false;
    }
});

gameLoop(); 