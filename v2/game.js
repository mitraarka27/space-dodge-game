const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- Game Configuration ---
canvas.width = 800;
canvas.height = 600;

let score = 0;
let gameOver = false;
let gameRunning = true;
let starSpeed = 1.5;
let starSpawnRate = 0.018; // Slightly increased spawn rate for balance testing
const STAR_TRAIL_LENGTH = 4;
const STAR_TRAIL_FADE = 0.6;
const PLAYER_TRAIL_LENGTH = 25; // Longer trail for streamlined ship
const PLAYER_TRAIL_FADE_SPEED = 0.035;
const PLAYER_TRAIL_SPAWN_RATE = 0.7;
const lines = [];
const LINE_SPAWN_RATE = 0.15;
const LINE_SPEED = 8;
const LINE_LENGTH = 15;
const LINE_COLOR = 'rgba(200, 200, 255, 0.5)';
const LINE_WIDTH = 1.5;

// --- Perspective Settings ---
const vanishingPoint = { x: canvas.width / 2, y: canvas.height / 2 };
const maxStarZ = 150;
const playerZ = 1;
const perspectiveFactor = 350;

// --- Player Spacecraft ---
const player = {
    screenX: canvas.width / 2,
    screenY: canvas.height * 0.8, // Position near bottom
    // *** Adjusted Size for Forward-Pointing Shape ***
    width: 90,  // Narrower
    height: 110, // Taller
    speed: 4.0,
    dx: 0,
    dy: 0,
    // *** Adjusted Collision Scale for this shape ***
    collisionScale: 0.6, // More forgiving vertically
    trails: []
};

// --- Player Drawing (Streamlined, Pointing Away) ---
function drawPlayer() {
    ctx.save();
    ctx.translate(player.screenX, player.screenY);

    const w = player.width;
    const h = player.height;
    const offsetX = -w / 2;
    const offsetY = -h / 2;

    // --- Draw from back to front ---

    // Engine Glow (Large central engine)
    const engineY = offsetY + h * 0.9; // Positioned near the very bottom
    const engineRadiusOuter = w * 0.35;
    const engineRadiusInner = w * 0.20;
    const engineRadiusCore = w * 0.10;

    // Outer Glow (Blue)
    ctx.fillStyle = 'rgba(100, 180, 255, 0.7)';
    ctx.beginPath();
    ctx.ellipse(offsetX + w*0.5, engineY, engineRadiusOuter, h * 0.1, 0, 0, Math.PI*2); // Wider ellipse
    ctx.fill();
    // Inner Glow (Light Blue/White)
    ctx.fillStyle = 'rgba(200, 220, 255, 0.9)';
    ctx.beginPath();
    ctx.ellipse(offsetX + w*0.5, engineY, engineRadiusInner, h * 0.07, 0, 0, Math.PI*2);
    ctx.fill();
    // Core (White Hot)
    ctx.fillStyle = 'rgba(255, 255, 255, 1)';
    ctx.beginPath();
    ctx.ellipse(offsetX + w*0.5, engineY, engineRadiusCore, h * 0.05, 0, 0, Math.PI*2);
    ctx.fill();

    // Main Fuselage Body (Darker) - Trapezoid shape, wider at bottom
    ctx.fillStyle = '#555565'; // Dark grey/blue
    ctx.beginPath();
    ctx.moveTo(offsetX + w * 0.3, offsetY + h * 0.2); // Top left (narrower)
    ctx.lineTo(offsetX + w * 0.7, offsetY + h * 0.2); // Top right (narrower)
    ctx.lineTo(offsetX + w * 0.9, offsetY + h * 0.8); // Bottom right (wider)
    ctx.lineTo(offsetX + w * 0.1, offsetY + h * 0.8); // Bottom left (wider)
    ctx.closePath();
    ctx.fill();

    // Wings (Swept back AND slightly angled down for perspective) - Lighter color
    ctx.fillStyle = '#888898'; // Medium grey
    // Left Wing
    ctx.beginPath();
    ctx.moveTo(offsetX + w * 0.3, offsetY + h * 0.3);  // Root top (on fuselage)
    ctx.lineTo(offsetX + w * 0.1, offsetY + h * 0.85); // Root bottom (slightly below fuselage bottom)
    ctx.lineTo(offsetX - w * 0.2, offsetY + h * 0.75); // Tip Back (lower Y than tip front)
    ctx.lineTo(offsetX - w * 0.1, offsetY + h * 0.25); // Tip Front (higher Y, further "away")
    ctx.closePath();
    ctx.fill();
    // Right Wing
    ctx.beginPath();
    ctx.moveTo(offsetX + w * 0.7, offsetY + h * 0.3);  // Root top
    ctx.lineTo(offsetX + w * 0.9, offsetY + h * 0.85); // Root bottom
    ctx.lineTo(offsetX + w * 1.2, offsetY + h * 0.75); // Tip Back
    ctx.lineTo(offsetX + w * 1.1, offsetY + h * 0.25); // Tip Front
    ctx.closePath();
    ctx.fill();

    // Vertical Stabilizer (Tail Fin) - Draw on top of fuselage
    ctx.fillStyle = '#707080'; // Medium-dark grey
    ctx.beginPath();
    ctx.moveTo(offsetX + w * 0.5, offsetY + h * 0.15); // Base on fuselage top-center
    ctx.lineTo(offsetX + w * 0.5, offsetY - h * 0.1);  // Point slightly "up" (further away)
    ctx.lineTo(offsetX + w * 0.55, offsetY + h * 0.2); // Trailing edge angled slightly back
    ctx.lineTo(offsetX + w * 0.45, offsetY + h * 0.2); // Leading edge angled slightly back
    ctx.closePath();
    ctx.fill();

    // Cockpit Hint (Subtle dark shape near top/front)
    ctx.fillStyle = '#333340';
    ctx.beginPath();
    ctx.ellipse(offsetX + w * 0.5, offsetY + h*0.25, w * 0.1, h * 0.05, 0, 0, Math.PI*2);
    ctx.fill();


    ctx.restore();
}


// --- Player Movement & Trail Update ---
function movePlayer() {
    player.screenX += player.dx;
    player.screenY += player.dy;

    // Boundary Detection
    const halfW = player.width / 2;
    const halfH = player.height / 2;
    if (player.screenX - halfW < 0) player.screenX = halfW;
    if (player.screenX + halfW > canvas.width) player.screenX = canvas.width - halfW;
    if (player.screenY - halfH < 0) player.screenY = halfH;
    if (player.screenY + halfH > canvas.height) player.screenY = canvas.height - halfH;

    // Add Player Trail Particle (Adjust Y for central engine)
    if (Math.random() < PLAYER_TRAIL_SPAWN_RATE) {
        const trailX = player.screenX + (Math.random() - 0.5) * player.width * 0.3; // Spread around center X
        const trailY = player.screenY + player.height * 0.45; // Originate near bottom center (engine)
        player.trails.push({ x: trailX, y: trailY, alpha: 1.0, size: Math.random() * 3.5 + 2.5 }); // Slightly larger trail particles
    }
    // Limit trail length
    if (player.trails.length > PLAYER_TRAIL_LENGTH) { player.trails.shift(); }
    // Update existing trail particles
    for (let i = player.trails.length - 1; i >= 0; i--) {
        const p = player.trails[i];
        p.alpha -= PLAYER_TRAIL_FADE_SPEED;
        if (p.alpha <= 0) { player.trails.splice(i, 1); }
    }
}

// --- Draw Player Trail Function ---
function drawPlayerTrail() { // Use new ship's engine colors
    for (const p of player.trails) {
        ctx.globalAlpha = p.alpha;
        const colorChance = Math.random();
        if (colorChance > 0.6) ctx.fillStyle = 'white';         // Core
        else if (colorChance > 0.3) ctx.fillStyle = '#ccddff'; // Light blue glow
        else ctx.fillStyle = '#88bbff';                     // Mid blue glow

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.alpha, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1.0;
}

// --- Shooting Stars (Projectiles) ---
const stars = [];
const starBaseSize = 1.5; // Keep projectiles small

function spawnStar() { // Keep projectile logic
    if (gameOver || Math.random() > starSpawnRate) return;
    let targetScreenX, targetScreenY;
    const edge = Math.floor(Math.random() * 4);
    const buffer = 50;
    switch (edge) {
        case 0: targetScreenY = Math.random()*(vanishingPoint.y*0.5); targetScreenX = buffer+Math.random()*(canvas.width-2*buffer); break;
        case 1: targetScreenX = canvas.width-Math.random()*(vanishingPoint.x*0.5); targetScreenY = buffer+Math.random()*(canvas.height-2*buffer); break;
        case 2: targetScreenY = canvas.height-Math.random()*(vanishingPoint.y*0.5); targetScreenX = buffer+Math.random()*(canvas.width-2*buffer); break;
        case 3: targetScreenX = Math.random()*(vanishingPoint.x*0.5); targetScreenY = buffer+Math.random()*(canvas.height-2*buffer); break;
    }
    const worldX = (targetScreenX - vanishingPoint.x) * playerZ / perspectiveFactor;
    const worldY = (targetScreenY - vanishingPoint.y) * playerZ / perspectiveFactor;
    stars.push({
        worldX: worldX, worldY: worldY, z: maxStarZ,
        speed: starSpeed * (0.9 + Math.random() * 0.4),
        color: `hsl(${Math.random() * 60 + 180}, 100%, 75%)`,
        collided: false, hitPlayer: false
    });
}

// --- Project 3D point to 2D screen ---
function projectPoint(worldX, worldY, z) { // Keep as is
    if (z <= 0) return null;
    const scale = perspectiveFactor / z;
    if (scale > 1000) return null;
    const screenX = vanishingPoint.x + worldX * scale;
    const screenY = vanishingPoint.y + worldY * scale;
    const size = starBaseSize * scale;
    return { screenX, screenY, size, scale };
}

// --- Update and Draw Stars/Projectiles ---
function updateStars() { // Keep collision logic
    for (let i = stars.length - 1; i >= 0; i--) {
        const star = stars[i];
        star.z -= star.speed;

        if (star.z <= 0) { // Scoring / Removal
            if (!star.hitPlayer && !gameOver) { score++; }
            stars.splice(i, 1); continue;
        }
        const currentProj = projectPoint(star.worldX, star.worldY, star.z);
        if (!currentProj) continue;

        // Draw Star Trail
        ctx.fillStyle = star.color;
        let trailZ = star.z; let trailAlpha = 0.6;
        for (let t = 0; t < STAR_TRAIL_LENGTH; t++) {
            trailZ += star.speed * (STAR_TRAIL_FADE / (t + 1));
            const trailProj = projectPoint(star.worldX, star.worldY, trailZ);
            if (trailProj) {
                ctx.globalAlpha = trailAlpha * (1 - t / STAR_TRAIL_LENGTH);
                ctx.beginPath(); ctx.arc(trailProj.screenX, trailProj.screenY, Math.max(0.3, trailProj.size * (0.7 - t * 0.12)), 0, Math.PI * 2); ctx.fill();
                trailAlpha *= STAR_TRAIL_FADE;
            } else { break; }
        }
        ctx.globalAlpha = 1.0;

        // Draw the Main Star
        ctx.fillStyle = star.color; ctx.beginPath(); ctx.arc(currentProj.screenX, currentProj.screenY, Math.max(0.8, currentProj.size / 2), 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'white'; ctx.beginPath(); ctx.arc(currentProj.screenX, currentProj.screenY, Math.max(0.4, currentProj.size / 4), 0, Math.PI * 2); ctx.fill();

        // Collision Detection
        if (!star.collided && star.z <= playerZ && star.z + star.speed > playerZ) {
            star.collided = true;
            const collisionProj = projectPoint(star.worldX, star.worldY, playerZ);
            if (!collisionProj) continue;

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

            // --- DEBUG ---
            /*
            ctx.save(); ctx.strokeStyle = 'red'; ctx.lineWidth = 1;
            ctx.strokeRect(playerLeft, playerTop, playerCollisionWidth, playerCollisionHeight);
            ctx.strokeStyle = 'lime'; ctx.strokeRect(starLeft, starTop, starSize, starSize);
            ctx.restore();
            */
            // --- End DEBUG ---

            if (playerLeft < starRight && playerRight > starLeft && playerTop < starBottom && playerBottom > starTop) {
                star.hitPlayer = true; gameOver = true; gameRunning = false;
            }
        }
    }
}


// --- Star Lines Functions ---
function spawnLine() { // Keep as is
    if (gameOver || Math.random() > LINE_SPAWN_RATE) return;
    let x, y;
    const edge = Math.floor(Math.random() * 4);
    const centerX = canvas.width / 2; const centerY = canvas.height / 2;
    switch (edge) {
        case 0: x = Math.random() * canvas.width; y = -LINE_LENGTH; break;
        case 1: x = canvas.width + LINE_LENGTH; y = Math.random() * canvas.height; break;
        case 2: x = Math.random() * canvas.width; y = canvas.height + LINE_LENGTH; break;
        case 3: x = -LINE_LENGTH; y = Math.random() * canvas.height; break;
    }
    const dx = centerX - x; const dy = centerY - y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    const vx = (dx / dist) * LINE_SPEED; const vy = (dy / dist) * LINE_SPEED;
    lines.push({ x, y, vx, vy });
}
function updateLines() { // Keep as is
    const centerX = canvas.width / 2; const centerY = canvas.height / 2;
    const removalDistanceSq = 20 * 20;
    for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i]; line.x += line.vx; line.y += line.vy;
        const distSq = Math.pow(line.x - centerX, 2) + Math.pow(line.y - centerY, 2);
        if (distSq < removalDistanceSq) { lines.splice(i, 1); }
    }
}
function drawLines() { // Keep as is
    ctx.strokeStyle = LINE_COLOR; ctx.lineWidth = LINE_WIDTH;
    for (const line of lines) {
        const tailX = line.x - line.vx * (LINE_LENGTH / LINE_SPEED);
        const tailY = line.y - line.vy * (LINE_LENGTH / LINE_SPEED);
        ctx.beginPath(); ctx.moveTo(tailX, tailY); ctx.lineTo(line.x, line.y); ctx.stroke();
    }
}

// --- Game Loop & Drawing ---
function clearCanvas() { ctx.fillStyle = 'black'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
const bgStarsArr = []; for (let i = 0; i < 150; i++) { bgStarsArr.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, size: Math.random() * 1.8, opacity: Math.random() * 0.4 + 0.1 }); }
function drawBackground() { ctx.fillStyle = 'white'; bgStarsArr.forEach(star => { ctx.globalAlpha = star.opacity; ctx.fillRect(star.x, star.y, star.size, star.size); }); ctx.globalAlpha = 1.0; }
function drawUI() { ctx.fillStyle = 'white'; ctx.font = '24px Arial'; ctx.textAlign = 'left'; ctx.fillText(`Score: ${score}`, 20, 40); }
function drawGameOver() { ctx.fillStyle = 'rgba(0, 0, 0, 0.75)'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = 'red'; ctx.font = '52px Arial'; ctx.textAlign = 'center'; ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 20); ctx.fillStyle = 'white'; ctx.font = '28px Arial'; ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 + 35); ctx.font = '22px Arial'; ctx.fillText('Press Enter to Restart', canvas.width / 2, canvas.height / 2 + 80); }

// --- Main Update Function ---
function update() {
    if (gameOver) { // Draw final frame
        clearCanvas(); drawBackground(); drawLines(); drawPlayerTrail();
        stars.forEach(star => {
            const proj = projectPoint(star.worldX, star.worldY, star.z);
            if (proj) { ctx.fillStyle = star.color; ctx.beginPath(); ctx.arc(proj.screenX, proj.screenY, Math.max(0.8, proj.size / 2), 0, Math.PI * 2); ctx.fill(); }
        });
        drawPlayer(); drawGameOver(); return;
    }
    if (!gameRunning) return;

    clearCanvas();
    drawBackground();
    spawnLine(); updateLines(); drawLines(); // Background effects first
    drawPlayerTrail();                       // Player trail
    spawnStar(); updateStars();              // Projectiles
    movePlayer();                            // Player move + trail update
    drawPlayer();                            // Player sprite
    drawUI();                                // Score

    requestAnimationFrame(update);
}

// --- Input Handling ---
const keysPressed = {};
function handleKeyDown(e) { keysPressed[e.key.toLowerCase()] = true; if (gameOver && e.key === 'Enter') { restartGame(); return; } if (!gameRunning) return; updatePlayerVelocity(); }
function handleKeyUp(e) { keysPressed[e.key.toLowerCase()] = false; if (!gameRunning && !gameOver) return; updatePlayerVelocity(); }
function updatePlayerVelocity() { // Keep as is
    player.dx = 0; player.dy = 0;
    if (keysPressed['arrowleft'] || keysPressed['a']) player.dx = -player.speed;
    if (keysPressed['arrowright'] || keysPressed['d']) player.dx = player.speed;
    if (keysPressed['arrowup'] || keysPressed['w']) player.dy = -player.speed;
    if (keysPressed['arrowdown'] || keysPressed['s']) player.dy = player.speed;
    if (player.dx !== 0 && player.dy !== 0) { const factor = player.speed / Math.sqrt(player.dx*player.dx + player.dy*player.dy); player.dx *= factor; player.dy *= factor; }
}

// --- Game Initialization & Restart ---
function restartGame() {
    score = 0; gameOver = false; gameRunning = true;
    stars.length = 0; lines.length = 0; player.trails = []; // Clear all dynamic elements
    player.screenX = canvas.width / 2; player.screenY = canvas.height * 0.8; // Reset position
    player.dx = 0; player.dy = 0;
    for (let key in keysPressed) { keysPressed[key] = false; }
    starSpeed = 1.5; starSpawnRate = 0.018; // Reset parameters

    requestAnimationFrame(update);
}

// --- Event Listeners ---
document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);

// --- Start the game ---
requestAnimationFrame(update);