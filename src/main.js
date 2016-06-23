// Written by Dylan Ho 22/06/2016
// Code adapted from: http://codepen.io/solartic/pen/qEGqNL

'use strict';

// Number of ROWS and COLS
const COLS = 9; // ROWS by COLS cells
const ROWS = 9;

// Named-constants of the various dimensions used for graphics drawing
const CELL_SIZE = 50; // cell width and height (square)
const CANVAS_WIDTH = CELL_SIZE * COLS;  // the drawing canvas
const CANVAS_HEIGHT = CELL_SIZE * ROWS;

// Players (circles) are displayed inside a cell, with padding from border
const CIRCLE_RADIUS = 15; // width/height
const CIRCLE_LINEWIDTH = 2; // pen stroke width

// Grid constants
var GRIDLINE_WIDTH = 3;
var GRIDLINE_COLOR = "#ddd";

const WALL_STROKE_WIDTH = 4; // wall stroke width
const WALL_PADDING = 4; // wall padding

// Javascript implementation of Enums. Could possibly use http://www.2ality.com/2016/01/enumify.html
const UDLR = { UP: 'UP', DOWN: 'DOWN', LEFT: 'LEFT', RIGHT: 'RIGHT' };
const Direction = { VERTICAL: 'VERTICAL', HORIZONTAL: 'HORIZONTAL'};
const Player = { RED: 'RED', BLU: 'BLUE', EMPTY: 'EMPTY'};
const GameStatus = { PLAYING: 'PLAYING', RED_WON: 'RED_WON', BLU_WON: 'BLU_WON'};

const NOTATION_PADDING = 35;
const TEXT_OFFSET_X = 55, TEXT_OFFSET_Y = 25;

var titleText = document.getElementById('title-text');
titleText.width = NOTATION_PADDING + CANVAS_WIDTH;
titleText.height = NOTATION_PADDING * 1.5;
var titleTextContext = titleText.getContext('2d');
titleTextContext.font = "26px Futura";
titleTextContext.fillText("QUORIDOR", 190, TEXT_OFFSET_Y);

var leftNotation = document.getElementById('left-notation');
leftNotation.width = NOTATION_PADDING;
leftNotation.height = CANVAS_HEIGHT;
var leftContext = leftNotation.getContext('2d');
leftContext.font = "26px Arial";
for (var i=0; i < ROWS; i++) leftContext.fillText(9-i, 10, 35+i*CELL_SIZE);
var botNotation = document.getElementById('bot-notation');
botNotation.width = NOTATION_PADDING + CANVAS_WIDTH;
botNotation.height = NOTATION_PADDING;
var botContext = botNotation.getContext('2d');
botContext.font = "26px Arial";
for (var i=0; i < ROWS; i++) botContext.fillText(String.fromCharCode(65+i), 55+i*CELL_SIZE, 25);

var gameText = document.getElementById('game-text');
gameText.width = NOTATION_PADDING + CANVAS_WIDTH;
gameText.height = NOTATION_PADDING + 10;
var gameTextContext = gameText.getContext('2d');
gameTextContext.font = "22px Helvetica";
gameTextContext.fillText("RED'S TURN", TEXT_OFFSET_X, TEXT_OFFSET_Y);
function changeGameText(inString) {
    gameTextContext.clearRect(0, 0, NOTATION_PADDING + CANVAS_WIDTH, NOTATION_PADDING + 10);
    gameTextContext.fillText(inString, TEXT_OFFSET_X, TEXT_OFFSET_Y);
}

var canvas = document.getElementById('quoridor-board');
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;
var context = canvas.getContext('2d');

// These 2 lines start the game.
var gameState = [];
initGameState();

// The important functions are all below
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
        activePlayer : activePlayer
    };
    redrawAll();
}
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
function clearAll (inX, inY) {context.clearRect(0 ,0, CANVAS_WIDTH, CANVAS_HEIGHT);}
function drawO (inX, inY, inPlayerColor) {
    var halfSectionSize = CELL_SIZE / 2;
    var centerX = inX * CELL_SIZE + halfSectionSize;
    var centerY = inY * CELL_SIZE + halfSectionSize;
    //var radius = CELL_SIZE / 3;
    var radius = CIRCLE_RADIUS;

    context.beginPath();
    context.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    if (inPlayerColor === Player.RED) context.fillStyle = "red";
    else if (inPlayerColor === Player.BLU) context.fillStyle = "blue";
    else context.fillStyle = inPlayerColor;
    context.fill();
    context.lineWidth = CIRCLE_LINEWIDTH;
    context.strokeStyle = "black";
    context.stroke();
}
function drawWall (inX, inY, inPlayerColor, inDirection) {
    //Hack to clamp the wall addition
    if (inX == -1) return;
    else if (inX == COLS-1) return;
    if (inY == -1) return;
    else if (inY == ROWS-1) return;

    context.lineWidth = WALL_STROKE_WIDTH;
    if (inPlayerColor === Player.RED) context.strokeStyle = "red";
    else if (inPlayerColor === Player.BLU) context.strokeStyle = "blue";
    else context.strokeStyle = inPlayerColor;
    context.lineCap = 'butt';
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
    clearAll();
    drawGridLines();
    drawO(gameState.redX, gameState.redY, Player.RED);
    drawO(gameState.bluX, gameState.bluY, Player.BLU);

    for (var col=0; col<COLS-1; col++) {
        for (var row=0; row<ROWS-1; row++) {
            if (gameState.horizontalWalls[col][row] == Player.RED) drawWall(col,row,Player.RED,Direction.HORIZONTAL);
            else if (gameState.horizontalWalls[col][row] == Player.BLU) drawWall(col,row,Player.BLU,Direction.HORIZONTAL);
            else if (gameState.verticalWalls[col][row] == Player.RED) drawWall(col,row,Player.RED,Direction.VERTICAL);
            else if (gameState.verticalWalls[col][row] == Player.BLU) drawWall(col,row,Player.BLU,Direction.VERTICAL);
        }
    }
}
function clickAt (inMousePosition) {
    if (gameState.currentStatus === GameStatus.PLAYING) {
        // Wall placement
        var colSelected = Math.floor(inMousePosition.x / CELL_SIZE);
        var rowSelected = Math.floor(inMousePosition.y / CELL_SIZE);

        var hasEnoughWalls;
        if (gameState.activePlayer === Player.RED) hasEnoughWalls = gameState.redRemainingWalls >= 1;
        else hasEnoughWalls = gameState.bluRemainingWalls >= 1;

        if (hasEnoughWalls) {
            var remainderX = inMousePosition.x % CELL_SIZE;
            var remainderY = inMousePosition.y % CELL_SIZE;

            if (remainderY <= WALL_PADDING) {
                if (remainderX <= CELL_SIZE / 2) {
                    if (canAddWall(colSelected - 1, rowSelected - 1, Direction.HORIZONTAL)) addWall(colSelected - 1, rowSelected - 1, Direction.HORIZONTAL);
                    else changeGameText("WALL CLASH");
                }
                else if (canAddWall(colSelected, rowSelected - 1, Direction.HORIZONTAL)) addWall(colSelected, rowSelected - 1, Direction.HORIZONTAL);
                else changeGameText("WALL CLASH");
            }
            else if (remainderY >= CELL_SIZE - WALL_PADDING) {
                if (remainderX <= CELL_SIZE / 2) {
                    if (canAddWall(colSelected - 1, rowSelected, Direction.HORIZONTAL)) addWall(colSelected - 1, rowSelected, Direction.HORIZONTAL);
                    else changeGameText("WALL CLASH");
                }
                else if (canAddWall(colSelected, rowSelected, Direction.HORIZONTAL)) addWall(colSelected, rowSelected, Direction.HORIZONTAL);
                else changeGameText("WALL CLASH");
            }
            // Check that you're clicking on a vertical wall
            else if (remainderX <= WALL_PADDING) {
                if (remainderY <= CELL_SIZE / 2) {
                    if (canAddWall(colSelected - 1, rowSelected - 1, Direction.VERTICAL)) addWall(colSelected - 1, rowSelected - 1, Direction.VERTICAL);
                    else changeGameText("WALL CLASH");
                }
                else if (canAddWall(colSelected - 1, rowSelected, Direction.VERTICAL)) addWall(colSelected - 1, rowSelected, Direction.VERTICAL);
                else changeGameText("WALL CLASH");
            }
            else if (remainderX >= CELL_SIZE - WALL_PADDING) {
                if (remainderY <= CELL_SIZE / 2) {
                    if (canAddWall(colSelected, rowSelected - 1, Direction.VERTICAL)) addWall(colSelected, rowSelected - 1, Direction.VERTICAL);
                    else changeGameText("WALL CLASH");
                }
                else if (canAddWall(colSelected, rowSelected, Direction.VERTICAL)) addWall(colSelected, rowSelected, Direction.VERTICAL);
                else changeGameText("WALL CLASH");
            }
        }

        // Piece movement
        var validMovements;
        if (gameState.activePlayer === Player.RED) validMovements = gameState.validMovementsRed;
        else validMovements = gameState.validMovementsBlu; // Assume activePlayer !== Player.EMPTY
        for (var i = 0; i < validMovements.length; i++) {
            if (colSelected === validMovements[i][0] && rowSelected === validMovements[i][1]) {
                if (gameState.activePlayer === Player.RED) {gameState.redX = colSelected; gameState.redY = rowSelected;}
                else {gameState.bluX = colSelected; gameState.bluY = rowSelected;}
                updateGame();
            }
        }
    }
    else initGameState();
}
function hoverAt(inMousePosition) {
    if (gameState.currentStatus === GameStatus.PLAYING) {
        clearAll();
        redrawAll();

        /*
        var fadedColor;
        if (gameState.activePlayer === Player.RED) fadedColor = "FF7F7F";
        else fadedColor = "7F7FFF";
        */

        var colSelected = Math.floor(inMousePosition.x / CELL_SIZE);
        var rowSelected = Math.floor(inMousePosition.y / CELL_SIZE);

        var hasEnoughWalls;
        if (gameState.activePlayer === Player.RED) hasEnoughWalls = gameState.redRemainingWalls >= 1;
        else hasEnoughWalls = gameState.bluRemainingWalls >= 1;

        if (hasEnoughWalls) {
            var remainderX = inMousePosition.x % CELL_SIZE;
            var remainderY = inMousePosition.y % CELL_SIZE;

            if (remainderY <= WALL_PADDING) {
                if (remainderX <= CELL_SIZE / 2) {
                    if (canAddWall(colSelected - 1, rowSelected - 1, Direction.HORIZONTAL)) drawWall(colSelected - 1, rowSelected - 1, gameState.activePlayer, Direction.HORIZONTAL);
                }
                else if (canAddWall(colSelected, rowSelected - 1, Direction.HORIZONTAL)) drawWall(colSelected, rowSelected - 1, gameState.activePlayer, Direction.HORIZONTAL);
            }
            else if (remainderY >= CELL_SIZE - WALL_PADDING) {
                if (remainderX <= CELL_SIZE / 2) {
                    if (canAddWall(colSelected - 1, rowSelected, Direction.HORIZONTAL)) drawWall(colSelected - 1, rowSelected, gameState.activePlayer, Direction.HORIZONTAL);
                }
                else if (canAddWall(colSelected, rowSelected, Direction.HORIZONTAL)) drawWall(colSelected, rowSelected, gameState.activePlayer, Direction.HORIZONTAL);
            }
            // Check that you're clicking on a vertical wall
            else if (remainderX <= WALL_PADDING) {
                if (remainderY <= CELL_SIZE / 2) {
                    if (canAddWall(colSelected - 1, rowSelected - 1, Direction.VERTICAL)) drawWall(colSelected - 1, rowSelected - 1, gameState.activePlayer, Direction.VERTICAL);
                }
                else if (canAddWall(colSelected - 1, rowSelected, Direction.VERTICAL)) drawWall(colSelected - 1, rowSelected, gameState.activePlayer, Direction.VERTICAL);
            }
            else if (remainderX >= CELL_SIZE - WALL_PADDING) {
                if (remainderY <= CELL_SIZE / 2) {
                    if (canAddWall(colSelected, rowSelected - 1, Direction.VERTICAL)) drawWall(colSelected, rowSelected - 1, gameState.activePlayer, Direction.VERTICAL);
                }
                else if (canAddWall(colSelected, rowSelected, Direction.VERTICAL)) drawWall(colSelected, rowSelected, gameState.activePlayer, Direction.VERTICAL);
            }
        }

        // Piece prediction
        var validMovements;
        if (gameState.activePlayer === Player.RED) validMovements = gameState.validMovementsRed;
        else validMovements = gameState.validMovementsBlu; // Assume activePlayer !== Player.EMPTY
        for (var i = 0; i < validMovements.length; i++) {
            if (colSelected === validMovements[i][0] && rowSelected === validMovements[i][1]) {
                if (gameState.activePlayer === Player.RED) drawO(colSelected, rowSelected, gameState.activePlayer);
                else drawO(colSelected, rowSelected, gameState.activePlayer);
            }
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