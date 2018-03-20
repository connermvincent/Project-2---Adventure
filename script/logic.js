////////////////////////////////////////////////////////
// Prepare the canvas
////////////////////////////////////////////////////////
var canvas = document.querySelector("#gameCanvas");
var ctx = canvas.getContext("2d");

////////////////////////////////////////////////////////
// Define Classes
////////////////////////////////////////////////////////
class spriteMap {
    constructor (x, y, size){
        this.x = x;
        this.y = y;
        this.size = size;
    }
};

////////////////////////////////////////////////////////
// Declare Variables
////////////////////////////////////////////////////////
// Document queries
var introScreen = document.querySelector("#introScreen");
var gameScreen = document.querySelector("#gameScreen");
var startButton = document.querySelector("#start");
var gameOutput = document.querySelector("#gameOutput");
var healthBar = $("#healthBar");
var potionSound = document.querySelector("#potionSound");
var monsterSound = document.querySelector("#monsterSound");
var victorySound = document.querySelector("#victorySound");

const playerStart = {x: 1, y: 1};
const monsterStart = {x: 5, y: 6};
const potionStart = {x: 8, y: 1};

// Sprite data
var spriteSheet = new Image();
const tileSize = 48;
spriteSheet.src = "img/dungeonTileset.png";
var groundTile = new spriteMap(64, 112, 16);
var wallTile = new spriteMap(0, 16, 16);
var playerTile = new spriteMap(96, 240, 16);
var monsterTile = new spriteMap(32, 192, 16);
var stairUpTile = new spriteMap(64, 240, 16);
var stairDownTile = new spriteMap(80, 240, 16);
var potionTile = new spriteMap(193, 178, 15);

// Objects
var player = {
    x: playerStart.x,
    y: playerStart.y,
    playerTile,
    life: 3
};

var stairUp = {
    x: 1,
    y: 7,
    stairUpTile
};

var stairDown = {
    x: monsterStart.x,
    y: monsterStart.y,
    stairDownTile
};
    
var monster = {
    x: monsterStart.x,
    y: monsterStart.y,
    monsterTile
};

var potion = {
    x: potionStart.x,
    y: potionStart.y,
    potionTile,
    exists: true
};

// Global variables
var gamePlaying = false;

// Level data
var level = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 1, 0, 0, 0, 1],
    [1, 0, 1, 0, 0, 0, 0, 1, 0, 1],
    [1, 0, 1, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 0, 0, 1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1, 1, 1, 0, 0, 1],
    [1, 1, 0, 0, 0, 0, 0, 0, 1, 1],
    [1, 0, 1, 1, 0, 0, 1, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
];

// Key Codes
var upArrow = 38;
var rightArrow = 39;
var downArrow = 40;
var leftArrow = 37;
var space = 32;

////////////////////////////////////////////////////////
// Declare Functions
////////////////////////////////////////////////////////
// Hides the intro screen and reveals the game screen
function switchToGame() {
	// Hide the intro screen, show the game screen
	introScreen.style.display = "none";
	gameScreen.style.display = "block";
    gamePlaying = true;
    
    // Reset values to starting values.
    player.x = playerStart.x;
    player.y = playerStart.y;
    player.life = 3;
    healthBar.animate({width : player.life*100 }, 1000, 'swing');
    
    monster.x = monsterStart.x;
    monster.y = monsterStart.y;
    
    potion.exists = true;
    renderField();
}

function switchToWin() {
    // Hide the game screen, show the intro screen, rewrite its text to exclaim victory
    introScreen.style.display = "block";
    gameScreen.style.display = "none";
    
    $("#introHeader").text("You win!");
    $("#introText").text("You successfully escape from the dungeon, surviving to fight another day. Press Start to play again.")
}

// Wrapper for drawing images from the sprite sheet
function drawFromSheet(context, tileLoc, x, y) {
    context.drawImage(spriteSheet,
                     tileLoc.x, tileLoc.y, tileLoc.size, tileLoc.size,
                     x, y, tileSize, tileSize);
}

// Function that returns the distance between two coordinates. I decided this would be better as an arrow function,
// since it's concise and essentially a wrapper on a Math.abs() formula.
var getDistance = (x1, y1, x2, y2) => Math.abs(x1 - x2) + Math.abs(y1 - y2);

// Render the field
function renderField() {
    // Loop through the level map and draw all the base tiles
    for (let i = 0; i < level.length; i++) {
            for (let j = 0; j < level[0].length; j++){
                    let tile;
                    switch (level[i][j]) {
                        case 0:
                            tile = groundTile;
                            break;
                        case 1:
                            tile = wallTile;
                            break;
                        default:
                            console.log("Invalid tile code: " + level[i][j]);
                            break;
                    }
                    drawFromSheet(ctx, tile, j*tileSize, i*tileSize);
                }
        }
    // Draw the objects using their data
    drawFromSheet(ctx, stairUp.stairUpTile, stairUp.x*tileSize, stairUp.y*tileSize);
    drawFromSheet(ctx, stairDown.stairDownTile, stairDown.x*tileSize, stairDown.y*tileSize);
    // Only draw the potion if exists == true, otherwise it's already been used
    potion.exists == (true) ? drawFromSheet(ctx, potion.potionTile, potion.x*tileSize, potion.y*tileSize) : "";
    drawFromSheet(ctx, player.playerTile, player.x*tileSize, player.y*tileSize);
    drawFromSheet(ctx, monster.monsterTile, monster.x*tileSize, monster.y*tileSize);
}

// Checks which adjacent spaces are valid moves, then determines which one is closest to the player and moves the monster there.
// If no space is closer to the player than their current location, or if the player is in their tile, don't move.
// Based on the island adventure monster mechanics. Uses additional logic to decide where to move instead of
// pure randomness. The monster is still pretty stupid, however, and can't maneuver around walls without some luck. 
function monsterMove() {
    // Calculate the monster's distance from the player.
    var distToPlayer = getDistance(player.x, player.y, monster.x, monster.y);
    
    console.log("Distance to Player: " + distToPlayer);
    
    // If the monster's distance from the player isn't 0, move.
    if (distToPlayer > 0){
        // The 4 possible directions that the monster can move
        var UP = 1;
        var DOWN = 2;
        var LEFT = 3;
        var RIGHT = 4;

        // An array to store the valid direction that the monster is allowed to move in
        var validDirections = [];

        // Check whether adjacent spaces are valid for movement. If they are, pushes an object to validDirections with
        // the appropriate direction and a calculation of how far the space is from the player.
        if (monster.y > 0){
            if (level[monster.y-1][monster.x] != 1){
                validDirections.push({direction: UP, distance: getDistance(player.x, player.y, monster.x, monster.y-1)});
            }
        }
        if (monster.x < level[0].length) {
            if (level[monster.y][monster.x+1] != 1){
                 validDirections.push({direction: RIGHT, distance: getDistance(player.x, player.y, monster.x+1, monster.y)});
            }
        }
        if (monster.y < level.length) {
            if (level[monster.y+1][monster.x] != 1){
                validDirections.push({direction: DOWN, distance: getDistance(player.x, player.y, monster.x, monster.y+1)});
            }
        }
        if (monster.x > 0) {
            if (level[monster.y][monster.x-1] != 1){
                validDirections.push({direction: LEFT, distance: getDistance(player.x, player.y, monster.x-1, monster.y)});
            }
        }

        console.log(validDirections);
        
        var shortestDistance = validDirections[0].distance;
        var bestDirection = validDirections[0].direction;
        
        // Loop through the list of valid directions. If a direction has a closer distance to the player, make it
        // the new best.
        for (let i = 0; i < validDirections.length; i++) {
            if (validDirections[i].distance < shortestDistance) {
                shortestDistance = validDirections[i].distance;
            }
        }
        
        // Loop through the list again, this time removing any directions with potential distances greater than the best.
        for (let i = 0; i < validDirections.length; i++) {
            if (validDirections[i].distance > shortestDistance) {
                validDirections.splice(i, 1);
                i--;
            }
        }
        
        // Randomly select one of the remaining directions and make it the best direction.
        let randomIndex = Math.floor(Math.random() * validDirections.length);
        bestDirection = validDirections[randomIndex].direction;
        
        console.log("Best Direction: " + bestDirection);
        
        // Commented bits enable AI that prevents the monster from moving if it would move further away from the player.
        // I disabled them so it would have a random chance to maneuver its way around corners.
        
        // Move in the best direction, unless it would take the monster further from the player than it already is.
        //if (shortestDistance < distToPlayer) {
            switch (bestDirection) {
                case UP:
                    monster.y--;
                    break;
                case RIGHT:
                    monster.x++;
                    break;
                case DOWN:
                    monster.y++;
                    break;
                case LEFT:
                    monster.x--;
                    break;
            }
        //}
    }
    else {
        console.log("Best to stay still.");
    }
    
}

// Remove a life point from the player and animate the life bar decreasing. If they're at 0 after this, end the game.
function hurtPlayer() {
    player.life--;
    healthBar.animate({width : player.life*100 }, 1000, 'swing');
    monsterSound.play();
    
    if (player.life > 0) { // If the player still has life after being hurt, tell them they've been hurt.
        gameOutput.textContent = "You've been hurt! Another slime is crawling up from the depths...";
    }
    else { // Otherwise, it's game over.
        gamePlaying = false;
        gameOutput.textContent = "Overcome by your wounds, you collapse. GAME OVER"
    }
}

// Takes keyboard input from the player to move their character. After each input, run through the monster's turn and any
// additional game logic (such as victory, or picking up a potion).
function inputHandler(event) {
    if (gamePlaying == true){
        // Only do anything if a useful key is pressed.
        if (event.keyCode != upArrow && event.keyCode != rightArrow
            && event.keyCode !=  downArrow && event.keyCode != leftArrow
            && event.keyCode != space){
            return;
        }
        switch (event.keyCode) {
            case upArrow:
                // Not a fan of nested if statements. Needed to avoid checking invalid indexes, though.
                if (player.y > 0){
                    if (level[player.y-1][player.x] != 1){
                        player.y--;
                    }
                    else {
                        gameOutput.textContent = "You bump into a wall."
                    }
                }
                break;
            case rightArrow:
                if (player.x < level[0].length) {
                    if (level[player.y][player.x+1] != 1){
                        player.x++;
                    }
                    else {
                        gameOutput.textContent = "You bump into a wall."
                    }
                }
                break;
            case downArrow:
                if (player.y < level.length) {
                    if (level[player.y+1][player.x] != 1){
                        player.y++;
                    }
                    else {
                        gameOutput.textContent = "You bump into a wall."
                    }
                }
                break;
            case leftArrow:
                if (player.x > 0) {
                    if (level[player.y][player.x-1] != 1){
                        player.x--;
                    }
                    else {
                        gameOutput.textContent = "You bump into a wall."
                    }
                }
            case space:
                break;
        }
        
        monsterMove();
        
        // If, after the monster moves, they're in the same tile as the player, hurt them and respawn the monster at the stairs down.
        if (getDistance(player.x, player.y, monster.x, monster.y) == 0) {
            monster.x = stairDown.x;
            monster.y = stairDown.y;
            hurtPlayer();
        }
        
        // If the player touches the potion, remove it from the game and heal the player.
        if ((getDistance(player.x, player.y, potion.x, potion.y) == 0) && potion.exists === true) {
            potion.exists = false;
            player.life = 3;
            healthBar.animate({width : player.life*100 }, 1000, 'swing');
            gameOutput.textContent = "You quickly chug the potion, healing any wounds you had.";
            potionSound.play();
        }
        
        // If, after the player moves, they're in the same tile as the stairs up, tell them they've won and end the game.
        if (getDistance(player.x, player.y, stairUp.x, stairUp.y) == 0) {
            switchToWin();
            gamePlaying = false;
            victorySound.play();
        }
        
        renderField();
    }
}


////////////////////////////////////////////////////////
// Assign Event Handlers
////////////////////////////////////////////////////////
startButton.addEventListener("click",switchToGame,false);
window.addEventListener("keydown",inputHandler,false);

////////////////////////////////////////////////////////
// Initialization
////////////////////////////////////////////////////////
// Runs when the document is loaded. 
$(function(){
    for (let i = 0; i < 5; i++) {
        renderField();
    }
});



