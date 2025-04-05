const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- Game Configuration ---
canvas.width = 400;
canvas.height = 600;

let gameSpeed = 2; // Controls how fast stars move down
let score = 0;
let gameOver = false;
let gameRunning = true;

// --- Player (Airplane/Spacecraft) ---
const player = {
    x: canvas.width / 2 - 25, // Start in horizontal center
    y: canvas.height - 70,    // Position near the bottom
    width: 50,
    height: 30,
    color: 'lightblue',
    speed: 5,
    dx: 0, // Direction of movement (-1 left, 1 right, 0 stationary)
    tiltAngle: 0, // Radians for tilt
    maxTilt: Math.PI / 12 // Max tilt angle (15 degrees)
};

function drawPlayer() {
    ctx.save(); // Save the current canvas state
    ctx.translate(player.x + player.width / 2, player.y + player.height / 2); // Move origin to player center
    ctx.rotate(player.tiltAngle); // Rotate around the center
    ctx.fillStyle = player.color;
    // Draw a simple blocky shape
    ctx.fillRect(-player.width / 2, -player.height / 2, player.width, player.height);
    // Add a small "cockpit" block
    ctx.fillStyle = 'white';
    ctx.fillRect(-player.width / 4, -player.height / 2 - 5, player.width / 2, 5);
    ctx.restore(); // Restore the canvas state
}

function movePlayer() {
    player.x += player.dx * player.speed;

    // Update tilt based on movement
    const targetTilt = player.dx * player.maxTilt;
    // Smoothly interpolate tilt angle
    player.tiltAngle += (targetTilt - player.tiltAngle) * 0.2;


    // Boundary detection - Keep player within canvas bounds
    if (player.x < 0) {
        player.x = 0;
    }
    if (player.x + player.width > canvas.width) {
        player.x = canvas.width - player.width;
    }
}

// --- Shooting Stars (Obstacles) ---
const stars = [];
const starProps = {
    width: 5,
    height: 15,
    color: 'yellow',
    spawnRate: 0.03 // Probability of spawning a star each frame (lower is less frequent)
};

function spawnStar() {
    if (Math.random() < starProps.spawnRate) {
        const x = Math.random() * (canvas.width - starProps.width); // Random horizontal position
        const speedMultiplier = 1 + Math.random(); // Add some speed variation
        stars.push({
            x: x,
            y: -starProps.height, // Start just above the canvas
            width: starProps.width,
            height: starProps.height,
            color: starProps.color,
            speed: gameSpeed * speedMultiplier
        });
    }
}

function updateStars() {
    for (let i = stars.length - 1; i >= 0; i--) {
        const star = stars[i];
        star.y += star.speed;

        // Draw star
        ctx.fillStyle = star.color;
        ctx.fillRect(star.x, star.y, star.width, star.height);

        // Collision detection with player
        if (
            player.x < star.x + star.width &&
            player.x + player.width > star.x &&
            player.y < star.y + star.height &&
            player.y + player.height > star.y
        ) {
            gameOver = true;
            gameRunning = false;
        }

        // Remove stars that go off-screen
        if (star.y > canvas.height) {
            stars.splice(i, 1);
            if (!gameOver) {
                 score++; // Increment score when a star is successfully dodged
            }
        }
    }
}

// --- Game Loop & Drawing ---
function clearCanvas() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawScore() {
     ctx.fillStyle = 'white';
     ctx.font = '20px Arial';
     ctx.fillText(`Score: ${score}`, 10, 30);
}

function drawGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; // Semi-transparent overlay
    ctx.fillRect(0, canvas.height / 2 - 50, canvas.width, 130);

    ctx.fillStyle = 'red';
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER!', canvas.width / 2, canvas.height / 2);

    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 + 35);
    ctx.fillText('Press Enter to Restart', canvas.width / 2, canvas.height / 2 + 65);
    ctx.textAlign = 'left'; // Reset alignment
}

function update() {
    if (!gameRunning) {
        if (gameOver) {
            drawGameOver();
        }
        return; // Stop the loop if game is not running
    }

    clearCanvas();
    spawnStar();
    updateStars(); // Includes drawing stars and collision checks
    movePlayer();
    drawPlayer();
    drawScore();

    // Increase difficulty slightly over time (optional)
    // gameSpeed += 0.001;

    requestAnimationFrame(update); // Request the next frame
}

// --- Input Handling ---
function handleKeyDown(e) {
    if (e.key === 'ArrowLeft' || e.key === 'a') {
        player.dx = -1; // Move left
    } else if (e.key === 'ArrowRight' || e.key === 'd') {
        player.dx = 1; // Move right
    } else if (e.key === 'Enter' && gameOver) {
        restartGame();
    }
}

function handleKeyUp(e) {
    if (
        (e.key === 'ArrowLeft' || e.key === 'a') && player.dx === -1 ||
        (e.key === 'ArrowRight' || e.key === 'd') && player.dx === 1
       ) {
        player.dx = 0; // Stop horizontal movement
    }
}

// --- Game Initialization & Restart ---
function restartGame() {
    score = 0;
    gameOver = false;
    gameRunning = true;
    stars.length = 0; // Clear existing stars
    player.x = canvas.width / 2 - player.width / 2;
    player.y = canvas.height - 70;
    player.dx = 0;
    player.tiltAngle = 0;
    gameSpeed = 2; // Reset game speed
    update(); // Start the game loop again
}

// --- Event Listeners ---
document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);

// --- Start the game ---
update();