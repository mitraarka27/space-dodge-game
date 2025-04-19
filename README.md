# Space Dodge Game

A simple web-based game where you pilot a spacecraft flying into the screen, dodging incoming projectiles using perspective view.

Available online at: https://space-dodge-app.netlify.app/

## Features

*   Perspective "into the screen" view.
*   Player-controlled spacecraft with free 2D movement (Arrow Keys or WASD).
*   Projectiles ("stars") spawning from the distance and moving towards the screen edges.
*   Visual effects: background star lines for motion, player engine trail, projectile trails.
*   Scoring based on successfully dodged projectiles.
*   Session-based high score and games played tracking using `sessionStorage`.
*   Retro/techno styled UI elements displayed outside the game canvas.

## Folder Structure

The project repository contains the following main folders:

*   `v1/`: An early experimental version (potentially Tetris-like influence). Not the deployed version.
*   `v2/`: Another experimental version (details may vary, e.g., different UI). Not the deployed version.
*   `space_dodge/`: Contains the final, deployable version of the game, including:
    *   `index.html`: The main HTML structure.
    *   `style.css`: CSS for styling elements.
    *   `game.js`: All the JavaScript game logic.

## Running Locally

1.  Clone or download this repository.
2.  Navigate to the `space_dodge` directory in your file explorer or terminal.
3.  Open the `index.html` file in a modern web browser (like Chrome, Firefox, Edge, Safari).
4.  The game should start automatically.

## Controls

*   **Move Up:** Up Arrow / W
*   **Move Down:** Down Arrow / S
*   **Move Left:** Left Arrow / A
*   **Move Right:** Right Arrow / D
*   **Restart (after Game Over):** Enter

## Deployment

The contents of the `space_dodge` folder are ready for deployment as a static web application. See deployment guides for platforms like [Netlify](https://docs.netlify.com/site-deploys/create-deploys/) or [Firebase Hosting](https://firebase.google.com/docs/hosting/quickstart). Ensure you configure the deployment to use the `space_dodge` directory as the public/publish root.

*MIT License*
