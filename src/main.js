// Written by Dylan Ho 22/06/2016
// Code adapted from: http://codepen.io/solartic/pen/qEGqNL

'use strict';

// Number of ROWS and COLS
var COLS = 9; // ROWS by COLS cells
var ROWS = 9;

// Named-varants of the various dimensions used for graphics drawing
var CELL_SIZE = 50; // cell width and height (square)
var CANVAS_WIDTH = CELL_SIZE * COLS;  // the drawing canvas
var CANVAS_HEIGHT = CELL_SIZE * ROWS;

// Players (circles) are displayed inside a cell, with padding from border
var CIRCLE_RADIUS = CELL_SIZE * 0.3; // width/height
var CIRCLE_LINEWIDTH = 2; // pen stroke width

// Grid varants
var GRIDLINE_WIDTH = 3;
var GRIDLINE_COLOR = "#ddd";

var WALL_STROKE_WIDTH = 4; // wall stroke width
var WALL_PADDING = CELL_SIZE / 10; // wall padding

// Javascript implementation of Enums. Could possibly use http://www.2ality.com/2016/01/enumify.html
var UDLR = { UP: 'UP', DOWN: 'DOWN', LEFT: 'LEFT', RIGHT: 'RIGHT' };
var Direction = { VERTICAL: 'VERTICAL', HORIZONTAL: 'HORIZONTAL'};
var Player = { RED: 'RED', BLU: 'BLUE', EMPTY: 'EMPTY'};
var GameStatus = { PLAYING: 'PLAYING', RED_WON: 'RED_WON', BLU_WON: 'BLU_WON'};

var NOTATION_PADDING = 30;
var TEXT_OFFSET_X = 30, TEXT_OFFSET_Y = 25;

/*
var titleText = document.getElementById('title-text');
titleText.width = NOTATION_PADDING + CANVAS_WIDTH;
titleText.height = NOTATION_PADDING;
var titleTextContext = titleText.getContext('2d');
titleTextContext.font = "32px Futura";
titleTextContext.fillText("QUORIDOR", NOTATION_PADDING + CANVAS_WIDTH/2 - 80, TEXT_OFFSET_Y);
*/

// TOP SPACE FOR BLUE WALLS
var topNotation = document.getElementById('top-notation');
topNotation.width = 2 * NOTATION_PADDING + CANVAS_WIDTH;
topNotation.height = 2 * CELL_SIZE - 6.5 * WALL_PADDING;
var topContext = topNotation.getContext('2d');
drawBluRemainingWalls(10);

// LEFT SPACE FOR TEXT
var leftNotation = document.getElementById('left-notation');
leftNotation.width = NOTATION_PADDING;
leftNotation.height = CANVAS_HEIGHT;
var leftContext = leftNotation.getContext('2d');
leftContext.font = "32px Arial";
for (var i=0; i < ROWS; i++) leftContext.fillText(9-i, 10, (i + 0.5) * CELL_SIZE + 10);

// BOT SPACE FOR TEXT AND RED WALLS
var botNotation = document.getElementById('bot-notation');
botNotation.width = 2 * NOTATION_PADDING + CANVAS_WIDTH;
botNotation.height = 2 * CELL_SIZE - 6.5 * WALL_PADDING;
var botContext = botNotation.getContext('2d');
drawRedRemainingWalls(10);

var gameText = document.getElementById('game-text');
gameText.width = NOTATION_PADDING + CANVAS_WIDTH;
gameText.height = NOTATION_PADDING;
var gameTextContext = gameText.getContext('2d');
gameTextContext.font = "24px Helvetica";

var canvas = document.getElementById('quoridor-board');
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;
var context = canvas.getContext('2d');

var btn_undo = document.getElementById('btn_undo');

// These 2 lines start the game.
var gameState = [];
initGameState();

// ------ GAMESTATE FUNCTIONS ------ //
function initGameState() {
    // Player positions
    var redX = 4, redY = ROWS-1;
    var bluX = 4, bluY = 0;

    // Initializing wall positions
    var horizontalWalls = [];
    var verticalWalls = [];
    horizontalWalls.length = COLS-1;
    verticalWalls.length = COLS-1;
    for (var col = 0; col < COLS-1; col++)
    {
        var temporaryWallArrayForHorizontal = [];
        var temporaryWallArrayForVertical = [];
        temporaryWallArrayForHorizontal.length = ROWS-1;
        temporaryWallArrayForVertical.length = ROWS-1;
        for (var row = 0; row < ROWS-1; row++)
        {
            temporaryWallArrayForHorizontal[row] = Player.EMPTY;
            temporaryWallArrayForVertical[row] = Player.EMPTY;
        }
        horizontalWalls[col] = temporaryWallArrayForHorizontal;
        verticalWalls[col] = temporaryWallArrayForVertical;
    }

    // Initializing valid movement coords
    var validMovementsRed = [[3,8],[4,7],[5,8]];
    var validMovementsBlu = [[3,0],[4,1],[5,0]];

    // Initialize current state and current player
    var currentStatus = GameStatus.PLAYING;
    var activePlayer = Player.RED;

    gameState =
    {
        redX : redX,
        redY : redY,
        redRemainingWalls : 10,
        bluX : bluX,
        bluY : bluY,
        bluRemainingWalls : 10,
        horizontalWalls : horizontalWalls,
        verticalWalls : verticalWalls,
        validMovementsRed : validMovementsRed,
        validMovementsBlu : validMovementsBlu,
        currentStatus : currentStatus,
        activePlayer : activePlayer,
        lastMove : null
    };
    changeGameText(gameState.activePlayer + "'S TURN (" + gameState.redRemainingWalls + " WALLS REMAINING)");
    redrawAll();
}
function updateGame() {
    // Swap active player
    if (gameState.activePlayer === Player.RED) {
        gameState.activePlayer = Player.BLU;
        changeGameText(gameState.activePlayer + "'S TURN (" + gameState.bluRemainingWalls + " WALLS REMAINING)");
    }
    else {
        gameState.activePlayer = Player.RED;
        changeGameText(gameState.activePlayer + "'S TURN (" + gameState.redRemainingWalls + " WALLS REMAINING)");
    }


    // Check if red or blu wins
    if (gameState.redY === 0) {changeGameText("RED WON! CLICK ANYWHERE TO RESTART."); gameState.currentStatus = GameStatus.RED_WON;}
    else if (gameState.bluY === ROWS-1) {changeGameText("BLUE WON! CLICK ANYWHERE TO RESTART."); gameState.currentStatus = GameStatus.BLU_WON;}

    // Update valid movements
    updateValidMovements();
    redrawAll();
}

// ------ DRAWING FUNCTIONS ------ //
function drawGridLines () {
    var lineStart = 0;
    var lineLength = CANVAS_WIDTH;
    context.lineWidth = GRIDLINE_WIDTH;
    context.strokeStyle = GRIDLINE_COLOR;
    context.lineCap = 'round';
    context.beginPath();

    // Horizontal lines
    for (var y = 1;y <= ROWS-1;y++) {
        context.moveTo(lineStart, y * CELL_SIZE);
        context.lineTo(lineLength, y * CELL_SIZE);
    }
    // Vertical lines
    for (var x = 1;x <= COLS-1;x++) {
        context.moveTo(x * CELL_SIZE, lineStart);
        context.lineTo(x * CELL_SIZE, lineLength);
    }
    context.stroke();

    context.lineWidth = 4;
    context.strokeStyle = "black";
    context.beginPath();
    // Horizontal Lines
    context.moveTo(0, 0);
    context.lineTo(CANVAS_WIDTH, 0);
    context.moveTo(0, CANVAS_HEIGHT);
    context.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT);
    // Vertical Lines
    context.moveTo(0, 0);
    context.lineTo(0, CANVAS_HEIGHT);
    context.moveTo(CANVAS_WIDTH, 0);
    context.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT);

    context.stroke();
}
function clearAll () {context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);}
function drawO (inX, inY, inPlayerColor, inIsHover) {
    // If we are hovering, draw a faded player token instead
    // default inIsHover = false
    inIsHover = typeof inIsHover !== 'undefined' ? inIsHover : false;

    // Draws player circles
    var halfSectionSize = CELL_SIZE / 2;
    var centerX = inX * CELL_SIZE + halfSectionSize;
    var centerY = inY * CELL_SIZE + halfSectionSize;
    var radius = CIRCLE_RADIUS;

    context.beginPath();
    context.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    if (!inIsHover) {
        context.strokeStyle = "black";
        if (inPlayerColor === Player.RED) context.fillStyle = "red";
        else if (inPlayerColor === Player.BLU) context.fillStyle = "blue";
        else return;
    }
    else {
        context.strokeStyle = "#b3b3b3";
        if (inPlayerColor === Player.RED) context.fillStyle = "#ff9999";
        else if (inPlayerColor === Player.BLU) context.fillStyle = "#9999ff";
    }
    context.fill();
    context.lineWidth = CIRCLE_LINEWIDTH;
    context.stroke();
}
function drawWall (inX, inY, inPlayerColor, inDirection, inIsHover) {
    // If we are hovering, draw a faded player token instead
    // default inIsHover = false
    inIsHover = typeof inIsHover !== 'undefined' ? inIsHover : false;

    context.lineWidth = WALL_STROKE_WIDTH;
    if (!inIsHover) {
        if (inPlayerColor === Player.RED) context.strokeStyle = "red";
        else if (inPlayerColor === Player.BLU) context.strokeStyle = "blue";
        else return;
    }
    else {
        if (inPlayerColor === Player.RED) context.strokeStyle = "#ff9999";
        else if (inPlayerColor === Player.BLU) context.strokeStyle = "#9999ff";
    }
    context.lineCap = 'round';
    context.beginPath();

    if (inDirection === Direction.HORIZONTAL)
    {
        var x1 = inX * CELL_SIZE + WALL_PADDING;
        var x2 = (inX + 2) * CELL_SIZE - WALL_PADDING;
        var y = (inY + 1) * CELL_SIZE;

        context.moveTo(x1, y);
        context.lineTo(x2, y);
    }
    else // Direction.VERTICAL
    {
        var x = (inX + 1) * CELL_SIZE;
        var y1 = inY * CELL_SIZE + WALL_PADDING;
        var y2 = (inY + 2) * CELL_SIZE - WALL_PADDING;
        context.moveTo(x, y1);
        context.lineTo(x, y2);
    }
    context.stroke();
}
function redrawAll () {
    // We will destroy everything on the game board
    clearAll();
    
    // Color the objective row the correct color
    if (gameState.activePlayer === Player.RED) {
        context.fillStyle = "#ff8080";
        context.fillRect(0, 0, CANVAS_WIDTH, CELL_SIZE);
    }
    else {
        context.fillStyle = "#8080ff";
        context.fillRect(0, CANVAS_HEIGHT - CELL_SIZE, CANVAS_WIDTH, CELL_SIZE);
    }

    // Then we redraw all the grid lines
    drawGridLines();

    // Draw all the players
    drawO(gameState.redX, gameState.redY, Player.RED);
    drawO(gameState.bluX, gameState.bluY, Player.BLU);

    // Draw all the game walls
    for (var col=0; col<COLS-1; col++) {
        for (var row=0; row<ROWS-1; row++) {
            drawWall(col, row, gameState.horizontalWalls[col][row], Direction.HORIZONTAL);
            drawWall(col, row, gameState.verticalWalls[col][row], Direction.VERTICAL);
        }
    }

    drawBluRemainingWalls(gameState.bluRemainingWalls);
    drawRedRemainingWalls(gameState.redRemainingWalls);
}
function changeGameText(inString) {
    gameTextContext.clearRect(0, 0, NOTATION_PADDING + CANVAS_WIDTH, NOTATION_PADDING + 10);
    gameTextContext.fillText(inString, TEXT_OFFSET_X, TEXT_OFFSET_Y);
}
function drawBluRemainingWalls(inWallsLeft) {
    topContext.clearRect(0 ,0, 2 * NOTATION_PADDING + CANVAS_WIDTH, 2 * CELL_SIZE);
    
    topContext.lineWidth = WALL_STROKE_WIDTH * .75;
    topContext.strokeStyle = "blue";
    topContext.lineCap = "round";

    topContext.beginPath();
    for(var i=0; i < inWallsLeft; i++) {
        var x = NOTATION_PADDING + 4 + i * CELL_SIZE;
        var y1 = WALL_PADDING / 2;
        var y2 = 2 * CELL_SIZE - 6.5 * WALL_PADDING;
        topContext.moveTo(x, y1);
        topContext.lineTo(x, y2);
    }
    topContext.stroke();
}
function drawRedRemainingWalls(inWallsLeft) {
    botContext.clearRect(0 ,0, 2 * NOTATION_PADDING + CANVAS_WIDTH, 2 * CELL_SIZE);
    
    // Creating the bot latter notation
    botContext.font = "32px Arial";
    for (var i=0; i < ROWS; i++) 
        botContext.fillText(String.fromCharCode(65+i), NOTATION_PADDING + (i + 0.5) * CELL_SIZE - 10, 30);
    
    botContext.lineWidth = WALL_STROKE_WIDTH * .75;
    botContext.strokeStyle = "red";
    botContext.lineCap = "round";

    botContext.beginPath();
    for(var j=0; j < inWallsLeft; j++) {
        var x = NOTATION_PADDING + 4 + j * CELL_SIZE;
        var y1 = WALL_PADDING / 2;
        var y2 = 2 * CELL_SIZE - 6.5 * WALL_PADDING;
        botContext.moveTo(x, y1);
        botContext.lineTo(x, y2);
    }
    botContext.stroke();
}

// ------ CONTROL FUNCTIONS ------ //

// Returns a object with the currently selected move based on mouse pos (does not do validation)
function selectMove (inMousePosition) {
    // Ascertain if user wants to place a wall or move the piece
    
    // Get selected cell mouse cursor is in
    var cellCol = Math.floor(inMousePosition.x / CELL_SIZE);
    var cellRow = Math.floor(inMousePosition.y / CELL_SIZE);
    
    // Get selected wall mouse cursor is near
    var wallCol = Math.round(inMousePosition.x / CELL_SIZE) - 1;
    var wallRow = Math.round(inMousePosition.y / CELL_SIZE) - 1;
	
    // Determine if mouse is near a wall
    var remainderX = inMousePosition.x % CELL_SIZE;
    var remainderY = inMousePosition.y % CELL_SIZE;
    
    var payload = {
        type: "wall",
        dir: null,
        col: wallCol,
        row: wallRow
    };
    
    if (remainderY <= WALL_PADDING || remainderY >= CELL_SIZE - WALL_PADDING) {
        // Hovering near a horizontal wall; attempt to place a horizontal wall
        payload.dir = Direction.HORIZONTAL;
    } else if (remainderX <= WALL_PADDING || remainderX >= CELL_SIZE - WALL_PADDING) {
        // Hovering near a vertical wall; attempt to place a vertical wall
        payload.dir = Direction.VERTICAL;
    } else {
        payload.type = "piece";
        payload.col = cellCol;
        payload.row = cellRow;
    }
    
    if (payload.type === "wall" &&
        (payload.col < 0 || 
        payload.col > COLS - 2 || 
        payload.row < 0 || 
        payload.row > ROWS - 2))
    {
        payload.type = null;
    }
    
    return payload;
}
function validateWall (inCol, inRow, inDirection) {
    // Wrapper around canAddWall to validate that player has enough walls
    var hasEnoughWalls;
    
    if (gameState.activePlayer === Player.RED) {
        hasEnoughWalls = (gameState.redRemainingWalls >= 1);
    } else {
        hasEnoughWalls = (gameState.bluRemainingWalls >= 1);
    }
    
    if (!hasEnoughWalls) return false;
    
    return canAddWall(inCol, inRow, inDirection);
}
function validateMove (inCol, inRow) {
    
    var validMovements;
    
    if (gameState.activePlayer === Player.RED) {
        validMovements = gameState.validMovementsRed;
    } else {
        // Assume activePlayer !== Player.EMPTY
        validMovements = gameState.validMovementsBlu;
    }
    
    for (var i = 0; i < validMovements.length; i++) {
        if (inCol === validMovements[i][0] && inRow === validMovements[i][1]) {
            return true; // Valid move found
        }
    }
    
    return false; // no valid move found
}


// ------ MOUSE FUNCTIONS ------ //
function hoverAt (inMousePosition) {
    if (gameState.currentStatus !== GameStatus.PLAYING) {
        return;
    }

    redrawAll();
    
    var move = selectMove(inMousePosition);
    
    if (move.type === "wall") {
        if (validateWall(move.col, move.row, move.dir)) {
            drawWall(move.col, move.row, gameState.activePlayer, move.dir, true)
        } // No else statement because it won't even create a hover predictor wall
        return;
    }
    
    if (move.type === "piece") {
        if (validateMove(move.col, move.row)) {
            drawO(move.col, move.row, gameState.activePlayer, true)
        }
    }
}

function clickAt (inMousePosition) {
    if (gameState.currentStatus !== GameStatus.PLAYING) {
        //socket.emit("game:restartGame", "");
		return;
    }
    
    var move = selectMove(inMousePosition);
    
    if (move.type === "wall") {
        if (validateWall(move.col, move.row, move.dir)) {
            var success = addWall(move.col, move.row, move.dir);
            if (success) {
                updateGame();
            }
        } // No else statement because it won't even create a hover predictor wall
        return;
    }
    
    if (move.type === "piece") {
        if (validateMove(move.col, move.row)) {
            if (gameState.activePlayer === Player.RED) {
                gameState.redX = move.col;
                gameState.redY = move.row;
            } else {
                gameState.bluX = move.col;
                gameState.bluY = move.row;
            }
            updateGame();
        }
    }
}

function getCanvasMousePosition (event) {
    var rect = canvas.getBoundingClientRect();

    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    }
}

// Mouse hover methods
canvas.addEventListener('mousemove', function(event) {
    var mousePosition = getCanvasMousePosition(event);
    hoverAt(mousePosition);
});

// Mouse click methods
canvas.addEventListener('click', function (event) {
    var mousePosition = getCanvasMousePosition(event);
    clickAt(mousePosition);
});

btn_undo.addEventListener('click', function() {
    removeWall(0,0,Direction.HORIZONTAL);
    redrawAll();
});