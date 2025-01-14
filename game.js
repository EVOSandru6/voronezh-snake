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

const buildings = [];
let backgroundOffset = 0;

class Building {
    constructor(x, y, width, height, windows) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.windows = windows;
        this.color = '#2A2A3C';
        this.windowColor = 'rgba(255, 248, 150, 0.3)';
    }

    draw() {
        const currentX = this.x + backgroundOffset;
        
        // Draw building
        ctx.fillStyle = this.color;
        ctx.fillRect(currentX, canvas.height - this.height, this.width, this.height);
        
        // Draw windows
        const windowWidth = 15;
        const windowHeight = 20;
        const windowSpacingX = 25;
        const windowSpacingY = 30;
        
        for (let row = 0; row < this.windows.y; row++) {
            for (let col = 0; col < this.windows.x; col++) {
                // Randomly light up some windows
                ctx.fillStyle = Math.random() > 0.7 ? 
                    'rgba(255, 248, 150, 0.7)' : 
                    this.windowColor;
                
                ctx.fillRect(
                    currentX + 20 + (col * windowSpacingX),
                    canvas.height - this.height + 20 + (row * windowSpacingY),
                    windowWidth,
                    windowHeight
                );
            }
        }
    }
}

function initBuildings() {
    buildings.length = 0; // Clear existing buildings
    
    // Parameters for building generation
    const buildingWidth = 100;
    const spacing = 50;
    let currentX = 0;
    
    // Generate buildings to fill screen width plus extra for scrolling
    while (currentX < canvas.width + buildingWidth * 2) {
        // Randomly decide if this is a high-rise or five-story building
        const isHighRise = Math.random() < 0.2; // 20% chance for high-rise
        
        const height = isHighRise ? 500 : 150; // 20 stories vs 5 stories
        const windows = {
            x: 3,
            y: isHighRise ? 15 : 4
        };
        
        buildings.push(new Building(
            currentX,
            0,
            buildingWidth,
            height,
            windows
        ));
        
        currentX += buildingWidth + spacing;
    }
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gridSize = 20;
    tileCountX = Math.floor(canvas.width / gridSize);
    tileCountY = Math.floor(canvas.height / gridSize);
    
    if (!snake) {
        snake = [{ 
            x: Math.floor(tileCountX / 2), 
            y: Math.floor(tileCountY / 2) 
        }];
        food = spawnFood();
    }
    
    initBuildings(); // Initialize buildings after resize
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
    // Clear canvas with gradient sky
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#1a1a2e'); // Dark blue at top
    gradient.addColorStop(1, '#4a4a6a'); // Lighter blue at bottom
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Update and draw buildings
    backgroundOffset -= 0.5; // Adjust speed of background movement
    if (Math.abs(backgroundOffset) >= (buildings[0].width + 50)) {
        backgroundOffset = 0;
        // Move first building to end
        const firstBuilding = buildings.shift();
        firstBuilding.x = buildings[buildings.length - 1].x + buildings[0].width + 50;
        buildings.push(firstBuilding);
    }
    
    // Draw all buildings
    buildings.forEach(building => building.draw());

    // Clear canvas
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw "Voronezh"
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.font = '48px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText('Voronezh', canvas.width / 2, canvas.height / 2);

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