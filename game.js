const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let gridSize;
let tileCount;

// Fireworks array to store active fireworks
let fireworks = [];

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gridSize = Math.min(canvas.width, canvas.height) / 20;
    tileCount = Math.min(canvas.width, canvas.height) / gridSize;
}

// Add resize listener
window.addEventListener('resize', resizeCanvas);
resizeCanvas(); // Initial resize

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

let snake = [
    { x: 10, y: 10 }
];
let food = {
    x: Math.floor(Math.random() * tileCount),
    y: Math.floor(Math.random() * tileCount)
};
let dx = 0;
let dy = 0;
let score = 0;

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
    snake.unshift(head);

    // Check if snake ate food
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        food = {
            x: Math.floor(Math.random() * tileCount),
            y: Math.floor(Math.random() * tileCount)
        };
    } else {
        snake.pop();
    }

    // Game over conditions
    if (head.x < 0 || head.x >= tileCount || 
        head.y < 0 || head.y >= tileCount ||
        checkCollision()) {
        alert(`Game Over! Score: ${score}`);
        snake = [{ x: 10, y: 10 }];
        dx = 0;
        dy = 0;
        score = 0;
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

    setTimeout(gameLoop, 100);
}

function checkCollision() {
    return snake.slice(1).some(segment => 
        segment.x === snake[0].x && segment.y === snake[0].y
    );
}

gameLoop(); 