// Get references to the new HTML elements
const scoreElement = document.getElementById('current-score');
const highScoreElement = document.getElementById('high-score');
const gamesPlayedElement = document.getElementById('games-played');

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- Game Configuration ---
canvas.width = 800;
canvas.height = 600;

let score = 0;
let gameOver = false;
let gameRunning = true;
let starSpeed = 1.5;
let starSpawnRate = 0.018;
const STAR_TRAIL_LENGTH = 4; const STAR_TRAIL_FADE = 0.6;
const PLAYER_TRAIL_LENGTH = 25; const PLAYER_TRAIL_FADE_SPEED = 0.035; const PLAYER_TRAIL_SPAWN_RATE = 0.7;
const lines = []; const LINE_SPAWN_RATE = 0.15; const LINE_SPEED = 8; const LINE_LENGTH = 15; const LINE_COLOR = 'rgba(200, 200, 255, 0.5)'; const LINE_WIDTH = 1.5;

// --- Perspective Settings ---
const vanishingPoint = { x: canvas.width / 2, y: canvas.height / 2 };
const maxStarZ = 150; const playerZ = 1; const perspectiveFactor = 350;

// --- Session Stats ---
let sessionHighScore = 0;
let sessionGamesPlayed = 0;

function loadSessionStats() {
    const storedHighScore = sessionStorage.getItem('spaceDodgeHighScore');
    const storedGamesPlayed = sessionStorage.getItem('spaceDodgeGamesPlayed');
    sessionHighScore = storedHighScore ? parseInt(storedHighScore, 10) : 0;
    sessionGamesPlayed = storedGamesPlayed ? parseInt(storedGamesPlayed, 10) : 0;
    updateUIDisplays(); // Update display on initial load
}

function saveSessionStats() {
    sessionStorage.setItem('spaceDodgeHighScore', sessionHighScore);
    sessionStorage.setItem('spaceDodgeGamesPlayed', sessionGamesPlayed);
}

// --- NEW: Update HTML UI elements ---
function updateUIDisplays() {
    scoreElement.textContent = `Score: ${score}`;
    highScoreElement.textContent = `High Score: ${sessionHighScore}`;
    gamesPlayedElement.textContent = `Games Played: ${sessionGamesPlayed}`;
}

// --- Player Spacecraft ---
const player = {
    screenX: canvas.width / 2, screenY: canvas.height * 0.8,
    width: 90, height: 110, speed: 4.0,
    dx: 0, dy: 0, collisionScale: 0.6, trails: []
};

// --- Player Drawing (Streamlined, Pointing Away) ---
function drawPlayer() {
    ctx.save(); ctx.translate(player.screenX, player.screenY);
    const w = player.width; const h = player.height;
    const offsetX = -w / 2; const offsetY = -h / 2;
    // Engine Glow
    const engineY = offsetY + h * 0.9; const engineRadiusOuter = w * 0.35; const engineRadiusInner = w * 0.20; const engineRadiusCore = w * 0.10;
    ctx.fillStyle = 'rgba(100, 180, 255, 0.7)'; ctx.beginPath(); ctx.ellipse(offsetX + w*0.5, engineY, engineRadiusOuter, h * 0.1, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = 'rgba(200, 220, 255, 0.9)'; ctx.beginPath(); ctx.ellipse(offsetX + w*0.5, engineY, engineRadiusInner, h * 0.07, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 1)'; ctx.beginPath(); ctx.ellipse(offsetX + w*0.5, engineY, engineRadiusCore, h * 0.05, 0, 0, Math.PI*2); ctx.fill();
    // Main Fuselage Body
    ctx.fillStyle = '#555565'; ctx.beginPath(); ctx.moveTo(offsetX + w * 0.3, offsetY + h * 0.2); ctx.lineTo(offsetX + w * 0.7, offsetY + h * 0.2); ctx.lineTo(offsetX + w * 0.9, offsetY + h * 0.8); ctx.lineTo(offsetX + w * 0.1, offsetY + h * 0.8); ctx.closePath(); ctx.fill();
    // Wings
    ctx.fillStyle = '#888898'; ctx.beginPath(); ctx.moveTo(offsetX + w * 0.3, offsetY + h * 0.3); ctx.lineTo(offsetX + w * 0.1, offsetY + h * 0.85); ctx.lineTo(offsetX - w * 0.2, offsetY + h * 0.75); ctx.lineTo(offsetX - w * 0.1, offsetY + h * 0.25); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(offsetX + w * 0.7, offsetY + h * 0.3); ctx.lineTo(offsetX + w * 0.9, offsetY + h * 0.85); ctx.lineTo(offsetX + w * 1.2, offsetY + h * 0.75); ctx.lineTo(offsetX + w * 1.1, offsetY + h * 0.25); ctx.closePath(); ctx.fill();
    // Vertical Stabilizer
    ctx.fillStyle = '#707080'; ctx.beginPath(); ctx.moveTo(offsetX + w * 0.5, offsetY + h * 0.15); ctx.lineTo(offsetX + w * 0.5, offsetY - h * 0.1); ctx.lineTo(offsetX + w * 0.55, offsetY + h * 0.2); ctx.lineTo(offsetX + w * 0.45, offsetY + h * 0.2); ctx.closePath(); ctx.fill();
    // Cockpit Hint
    ctx.fillStyle = '#333340'; ctx.beginPath(); ctx.ellipse(offsetX + w * 0.5, offsetY + h*0.25, w * 0.1, h * 0.05, 0, 0, Math.PI*2); ctx.fill();
    ctx.restore();
}

// --- Player Movement & Trail Update ---
function movePlayer() {
    player.screenX += player.dx; player.screenY += player.dy;
    const halfW = player.width / 2; const halfH = player.height / 2;
    if (player.screenX - halfW < 0) player.screenX = halfW; if (player.screenX + halfW > canvas.width) player.screenX = canvas.width - halfW;
    if (player.screenY - halfH < 0) player.screenY = halfH; if (player.screenY + halfH > canvas.height) player.screenY = canvas.height - halfH;
    if (Math.random() < PLAYER_TRAIL_SPAWN_RATE) { const trailX = player.screenX + (Math.random() - 0.5) * player.width * 0.3; const trailY = player.screenY + player.height * 0.45; player.trails.push({ x: trailX, y: trailY, alpha: 1.0, size: Math.random() * 3.5 + 2.5 }); }
    if (player.trails.length > PLAYER_TRAIL_LENGTH) { player.trails.shift(); }
    for (let i = player.trails.length - 1; i >= 0; i--) { const p = player.trails[i]; p.alpha -= PLAYER_TRAIL_FADE_SPEED; if (p.alpha <= 0) { player.trails.splice(i, 1); } }
}

// --- Draw Player Trail Function ---
function drawPlayerTrail() {
    for (const p of player.trails) { ctx.globalAlpha = p.alpha; const colorChance = Math.random(); if (colorChance > 0.6) ctx.fillStyle = 'white'; else if (colorChance > 0.3) ctx.fillStyle = '#ccddff'; else ctx.fillStyle = '#88bbff'; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * p.alpha, 0, Math.PI * 2); ctx.fill(); }
    ctx.globalAlpha = 1.0;
}

// --- Shooting Stars (Projectiles) ---
const stars = []; const starBaseSize = 1.5;
function spawnStar() { /* ... keep exact same logic ... */ if (gameOver || Math.random() > starSpawnRate) return; let targetScreenX, targetScreenY; const edge = Math.floor(Math.random() * 4); const buffer = 50; switch (edge) { case 0: targetScreenY = Math.random()*(vanishingPoint.y*0.5); targetScreenX = buffer+Math.random()*(canvas.width-2*buffer); break; case 1: targetScreenX = canvas.width-Math.random()*(vanishingPoint.x*0.5); targetScreenY = buffer+Math.random()*(canvas.height-2*buffer); break; case 2: targetScreenY = canvas.height-Math.random()*(vanishingPoint.y*0.5); targetScreenX = buffer+Math.random()*(canvas.width-2*buffer); break; case 3: targetScreenX = Math.random()*(vanishingPoint.x*0.5); targetScreenY = buffer+Math.random()*(canvas.height-2*buffer); break; } const worldX = (targetScreenX - vanishingPoint.x) * playerZ / perspectiveFactor; const worldY = (targetScreenY - vanishingPoint.y) * playerZ / perspectiveFactor; stars.push({ worldX, worldY, z: maxStarZ, speed: starSpeed * (0.9 + Math.random() * 0.4), color: `hsl(${Math.random() * 60 + 180}, 100%, 75%)`, collided: false, hitPlayer: false }); }
function projectPoint(worldX, worldY, z) { /* ... keep exact same logic ... */ if (z <= 0) return null; const scale = perspectiveFactor / z; if (scale > 1000) return null; const screenX = vanishingPoint.x + worldX * scale; const screenY = vanishingPoint.y + worldY * scale; const size = starBaseSize * scale; return { screenX, screenY, size, scale }; }
function updateStars() { /* ... keep exact same logic, BUT update score display on miss ... */
    for (let i = stars.length - 1; i >= 0; i--) {
        const star = stars[i]; star.z -= star.speed;
        if (star.z <= 0) { if (!star.hitPlayer && !gameOver) { score++; updateUIDisplays(); /* Update display */ } stars.splice(i, 1); continue; } // Score on miss
        const currentProj = projectPoint(star.worldX, star.worldY, star.z); if (!currentProj) continue;
        // Draw Star Trail ...
        ctx.fillStyle = star.color; let trailZ = star.z; let trailAlpha = 0.6; for (let t = 0; t < STAR_TRAIL_LENGTH; t++) { trailZ += star.speed * (STAR_TRAIL_FADE / (t + 1)); const trailProj = projectPoint(star.worldX, star.worldY, trailZ); if (trailProj) { ctx.globalAlpha = trailAlpha * (1 - t / STAR_TRAIL_LENGTH); ctx.beginPath(); ctx.arc(trailProj.screenX, trailProj.screenY, Math.max(0.3, trailProj.size * (0.7 - t * 0.12)), 0, Math.PI * 2); ctx.fill(); trailAlpha *= STAR_TRAIL_FADE; } else { break; } } ctx.globalAlpha = 1.0;
        // Draw the Main Star ...
        ctx.fillStyle = star.color; ctx.beginPath(); ctx.arc(currentProj.screenX, currentProj.screenY, Math.max(0.8, currentProj.size / 2), 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = 'white'; ctx.beginPath(); ctx.arc(currentProj.screenX, currentProj.screenY, Math.max(0.4, currentProj.size / 4), 0, Math.PI * 2); ctx.fill();
        // Collision Detection ...
        if (!star.collided && star.z <= playerZ && star.z + star.speed > playerZ) {
            star.collided = true; const collisionProj = projectPoint(star.worldX, star.worldY, playerZ); if (!collisionProj) continue;
            const playerCollisionWidth = player.width * player.collisionScale; 
            const playerCollisionHeight = player.height * player.collisionScale; 
            const playerLeft = player.screenX - playerCollisionWidth / 3; 
            const playerRight = player.screenX + playerCollisionWidth / 3; 
            const playerTop = player.screenY - playerCollisionHeight / 3; 
            const playerBottom = player.screenY + playerCollisionHeight / 3;
            const starSize = Math.max(1.5, collisionProj.size); 
            const starLeft = collisionProj.screenX - starSize / 3; 
            const starRight = collisionProj.screenX + starSize / 3; 
            const starTop = collisionProj.screenY - starSize / 3; 
            const starBottom = collisionProj.screenY + starSize / 3;
            /* // DEBUG HITBOXES ... */
            if (playerLeft < starRight && playerRight > starLeft && playerTop < starBottom && playerBottom > starTop) { star.hitPlayer = true; gameOver = true; gameRunning = false; }
        }
    }
}

// --- Star Lines Functions ---
function spawnLine() { /* ... keep exact same logic ... */ if (gameOver || Math.random() > LINE_SPAWN_RATE) return; let x, y; const edge = Math.floor(Math.random() * 4); const centerX = canvas.width / 2; const centerY = canvas.height / 2; switch (edge) { case 0: x = Math.random() * canvas.width; y = -LINE_LENGTH; break; case 1: x = canvas.width + LINE_LENGTH; y = Math.random() * canvas.height; break; case 2: x = Math.random() * canvas.width; y = canvas.height + LINE_LENGTH; break; case 3: x = -LINE_LENGTH; y = Math.random() * canvas.height; break; } const dx = centerX - x; const dy = centerY - y; const dist = Math.sqrt(dx*dx + dy*dy); const vx = (dx / dist) * LINE_SPEED; const vy = (dy / dist) * LINE_SPEED; lines.push({ x, y, vx, vy }); }
function updateLines() { /* ... keep exact same logic ... */ const centerX = canvas.width / 2; const centerY = canvas.height / 2; const removalDistanceSq = 20 * 20; for (let i = lines.length - 1; i >= 0; i--) { const line = lines[i]; line.x += line.vx; line.y += line.vy; const distSq = Math.pow(line.x - centerX, 2) + Math.pow(line.y - centerY, 2); if (distSq < removalDistanceSq) { lines.splice(i, 1); } } }
function drawLines() { /* ... keep exact same logic ... */ ctx.strokeStyle = LINE_COLOR; ctx.lineWidth = LINE_WIDTH; for (const line of lines) { const tailX = line.x - line.vx * (LINE_LENGTH / LINE_SPEED); const tailY = line.y - line.vy * (LINE_LENGTH / LINE_SPEED); ctx.beginPath(); ctx.moveTo(tailX, tailY); ctx.lineTo(line.x, line.y); ctx.stroke(); } }

// --- Game Loop & Drawing ---
function clearCanvas() { ctx.fillStyle = 'black'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
const bgStarsArr = []; for (let i = 0; i < 150; i++) { bgStarsArr.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, size: Math.random() * 1.8, opacity: Math.random() * 0.4 + 0.1 }); }
function drawBackground() { ctx.fillStyle = 'white'; bgStarsArr.forEach(star => { ctx.globalAlpha = star.opacity; ctx.fillRect(star.x, star.y, star.size, star.size); }); ctx.globalAlpha = 1.0; }
// --- REMOVED drawUI(), drawGameTitle(), drawCopyright() ---

// *** MODIFIED: Game Over only draws canvas elements ***
function drawGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)'; // Dimming overlay
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Main Game Over Text (on canvas)
    ctx.fillStyle = 'red';
    ctx.font = '52px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 20);

    // Final Score & Restart Prompt (on canvas)
    ctx.fillStyle = 'white';
    ctx.font = '28px Arial';
    ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 + 35);
    ctx.font = '22px Arial';
    ctx.fillText('Press Enter to Restart', canvas.width / 2, canvas.height / 2 + 80);
}

// --- Main Update Function ---
function update() {
    if (gameOver) {
        // Only draw final canvas state + Game Over message
        clearCanvas(); drawBackground(); drawLines(); drawPlayerTrail();
        stars.forEach(star => { const proj = projectPoint(star.worldX, star.worldY, star.z); if (proj) { ctx.fillStyle = star.color; ctx.beginPath(); ctx.arc(proj.screenX, proj.screenY, Math.max(0.8, proj.size / 2), 0, Math.PI * 2); ctx.fill(); } });
        drawPlayer();
        drawGameOver(); // Draws game over message ON the canvas
        return; // Stop the loop
    }

    if (!gameRunning) return;

    clearCanvas();
    drawBackground();
    spawnLine(); updateLines(); drawLines(); // Background effects
    drawPlayerTrail();                       // Player trail
    spawnStar(); updateStars();              // Projectiles (updates score display internally)
    movePlayer();                            // Player move + trail update
    drawPlayer();                            // Player sprite
    // --- UI drawing is now handled by HTML/CSS ---

    requestAnimationFrame(update);
}

// --- Input Handling ---
const keysPressed = {};
function handleKeyDown(e) {
    keysPressed[e.key.toLowerCase()] = true;
    if (gameOver && e.key === 'Enter') {
        if (score > sessionHighScore) { sessionHighScore = score; }
        sessionGamesPlayed++;
        saveSessionStats();
        updateUIDisplays(); // Update HTML display right before restart
        restartGame();
        return;
    }
    if (!gameRunning) return;
    updatePlayerVelocity();
}
function handleKeyUp(e) { keysPressed[e.key.toLowerCase()] = false; if (!gameRunning && !gameOver) return; updatePlayerVelocity(); }
function updatePlayerVelocity() { /* ... keep exact same logic ... */ player.dx = 0; player.dy = 0; if (keysPressed['arrowleft'] || keysPressed['a']) player.dx = -player.speed; if (keysPressed['arrowright'] || keysPressed['d']) player.dx = player.speed; if (keysPressed['arrowup'] || keysPressed['w']) player.dy = -player.speed; if (keysPressed['arrowdown'] || keysPressed['s']) player.dy = player.speed; if (player.dx !== 0 && player.dy !== 0) { const factor = player.speed / Math.sqrt(player.dx*player.dx + player.dy*player.dy); player.dx *= factor; player.dy *= factor; } }

// --- Game Initialization & Restart ---
function restartGame() {
    score = 0; gameOver = false; gameRunning = true;
    stars.length = 0; lines.length = 0; player.trails = [];
    player.screenX = canvas.width / 2; player.screenY = canvas.height * 0.8;
    player.dx = 0; player.dy = 0;
    for (let key in keysPressed) { keysPressed[key] = false; }
    starSpeed = 1.5; starSpawnRate = 0.018;
    updateUIDisplays(); // Ensure score resets to 0 on display
    requestAnimationFrame(update);
}

// --- Event Listeners ---
document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);

// --- Start the game ---
loadSessionStats(); // Load stats AND update displays
requestAnimationFrame(update);