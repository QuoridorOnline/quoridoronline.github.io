// Written by Dylan Ho 23/06/2016

'use strict';

function canAddWall(inCol, inRow, inDirection) {
    if (gameState.activePlayer == Player.EMPTY) throw Error("Player cannot be EMPTY");

    //Hack to clamp the wall addition
    if (inCol == -1) inCol = 0;
    else if (inCol == COLS-1) inCol = COLS-2;
    if (inRow == -1) inRow = 0;
    else if (inRow == ROWS-1) inRow = ROWS-2;

    var horizontalWalls = gameState.horizontalWalls;
    var verticalWalls = gameState.verticalWalls;

    var clashesHorizontally = horizontalWalls[inCol][inRow] != Player.EMPTY;
    var clashesVertically = verticalWalls[inCol][inRow] != Player.EMPTY;
    var clashesBack, clashesForward;

    if (inDirection == Direction.HORIZONTAL) // if isHorizontal check left and right (same inRow different inCol)
    {
        if (inCol != 0) clashesBack = horizontalWalls[inCol-1][inRow] != Player.EMPTY;
        else clashesBack = false;
        if (inCol != COLS-2) clashesForward = horizontalWalls[inCol+1][inRow] != Player.EMPTY;
        else clashesForward = false;
    } else // Direction.VERTICAL check up and down (same inCol different inRow)
    {
        if (inRow != 0) clashesBack = verticalWalls[inCol][inRow-1] != Player.EMPTY;
        else clashesBack = false;
        if (inRow != ROWS-2) clashesForward = verticalWalls[inCol][inRow+1] != Player.EMPTY;
        else clashesForward = false;
    }

    var clashes = clashesHorizontally || clashesVertically || clashesBack || clashesForward;
    if (clashes) return false;
    else return true;
}

function addWall(inCol, inRow, inDirection) {
    if (inDirection == Direction.HORIZONTAL)
    {
        gameState.horizontalWalls[inCol][inRow] = gameState.activePlayer;

        // If it becomes unsolvable, PURGE IT and fail
        if (!isSolvable())
        {
            gameState.horizontalWalls[inCol][inRow] = Player.EMPTY;
            return false;
        }
    } else // inDirection == Direction.VERTICAL
    {
        gameState.verticalWalls[inCol][inRow] = gameState.activePlayer;

        if (!isSolvable())
        {
            gameState.verticalWalls[inCol][inRow] = Player.EMPTY;
            return false;
        }
    }
    //console.log("Successfully added " + inDirection + " wall at: "+inRow+","+inCol);

    updateGame();
    return true;
}

function isNextToWallOrBorder (inCol, inRow, inUDLR) {
    if (gameState.activePlayer == Player.EMPTY) throw Error("Player cannot be EMPTY");

    var horizontalWalls = gameState.horizontalWalls;
    var verticalWalls = gameState.verticalWalls;

    if (inUDLR === UDLR.UP)
    {

        if (inRow === 0) return true;
        else if (inCol === 0) return horizontalWalls[0][inRow-1] !== Player.EMPTY;
        else if (inCol === COLS-1) return horizontalWalls[COLS-2][inRow-1] !== Player.EMPTY;
        else return horizontalWalls[inCol-1][inRow-1] !== Player.EMPTY || horizontalWalls[inCol][inRow-1] !== Player.EMPTY;
    }
    else if (inUDLR === UDLR.DOWN)
    {
        if (inRow === ROWS-1) return true;
        else if (inCol === 0) return horizontalWalls[0][inRow] !== Player.EMPTY;
        else if (inCol === COLS-1) return horizontalWalls[COLS-2][inRow] !== Player.EMPTY;
        else return horizontalWalls[inCol-1][inRow] !== Player.EMPTY || horizontalWalls[inCol][inRow] !== Player.EMPTY;
    }
    else if (inUDLR === UDLR.LEFT)
    {
        if (inCol === 0) return true;
        else if (inRow === 0) return verticalWalls[inCol-1][0] !== Player.EMPTY;
        else if (inRow === ROWS-1) return verticalWalls[inCol-1][ROWS-2] !== Player.EMPTY;
        else return verticalWalls[inCol-1][inRow-1] !== Player.EMPTY || verticalWalls[inCol-1][inRow] !== Player.EMPTY;
    }
    else // (inUDLR === UDLR.RIGHT)
    {
        if (inCol === COLS-1) return true;
        else if (inRow === 0) return verticalWalls[inCol][0] !== Player.EMPTY;
        else if (inRow === ROWS-1) return verticalWalls[inCol][ROWS-2] !== Player.EMPTY;
        else return verticalWalls[inCol][inRow-1] !== Player.EMPTY || verticalWalls[inCol][inRow] !== Player.EMPTY;
    }
}

function updateValidMovements () {
    if (gameState.activePlayer === Player.EMPTY) throw Error("Player cannot be EMPTY");
    var validMovements = [];
    var activeX, activeY, inactiveX, inactiveY;
    if (gameState.activePlayer === Player.RED)
    {
        activeX = gameState.redX;
        activeY = gameState.redY;
        inactiveX = gameState.bluX;
        inactiveY = gameState.bluY;
    }
    else // gameState.activePlayer === Player.BLU
    {
        activeX = gameState.bluX;
        activeY = gameState.bluY;
        inactiveX = gameState.redX;
        inactiveY = gameState.redY;
    }
    var isNextToOpponent, opponentHasWallBehindHim;

    // Check if can move up
    if (!isNextToWallOrBorder(activeX, activeY, UDLR.UP))
    {
        isNextToOpponent = inactiveX === activeX && inactiveY === activeY - 1;
        if (!isNextToOpponent) validMovements.push([activeX,activeY-1]);
        else
        {
            opponentHasWallBehindHim = isNextToWallOrBorder(inactiveX, inactiveY, UDLR.UP);
            if (!opponentHasWallBehindHim) validMovements.push([activeX,activeY-2]);
            else
            {
                if (!isNextToWallOrBorder(inactiveX, inactiveY, UDLR.LEFT)) validMovements.push([inactiveX-1,inactiveY]);
                if (!isNextToWallOrBorder(inactiveX, inactiveY, UDLR.RIGHT)) validMovements.push([inactiveX+1,inactiveY]);
            }
        }
    }

    // Check if can move down
    if (!isNextToWallOrBorder(activeX, activeY, UDLR.DOWN))
    {
        isNextToOpponent = inactiveX === activeX && inactiveY === activeY + 1;
        if (!isNextToOpponent) validMovements.push([activeX,activeY+1]);
        else
        {
            opponentHasWallBehindHim = isNextToWallOrBorder(inactiveX, inactiveY, UDLR.DOWN);
            if (!opponentHasWallBehindHim) validMovements.push([activeX,activeY+2]);
            else
            {
                if (!isNextToWallOrBorder(inactiveX, inactiveY, UDLR.LEFT)) validMovements.push([inactiveX-1,inactiveY]);
                if (!isNextToWallOrBorder(inactiveX, inactiveY, UDLR.RIGHT)) validMovements.push([inactiveX+1,inactiveY]);
            }
        }
    }

    // Check if can move left
    if (!isNextToWallOrBorder(activeX, activeY, UDLR.LEFT))
    {
        isNextToOpponent = inactiveX === activeX-1 && inactiveY === activeY;
        if (!isNextToOpponent) validMovements.push([activeX-1,activeY]);
        else // can jump
        {
            opponentHasWallBehindHim = isNextToWallOrBorder(inactiveX, inactiveY, UDLR.LEFT);
            if (!opponentHasWallBehindHim) validMovements.push([activeX-2,activeY]);
            else
            {
                if (!isNextToWallOrBorder(inactiveX, inactiveY, UDLR.UP)) validMovements.push([inactiveX,inactiveY-1]);
                if (!isNextToWallOrBorder(inactiveX, inactiveY, UDLR.DOWN)) validMovements.push([inactiveX,inactiveY+1]);
            }
        }
    }

    // Check if can move right
    if (!isNextToWallOrBorder(activeX,activeY,UDLR.RIGHT))
    {
        isNextToOpponent = inactiveX === activeX + 1 && inactiveY === activeY;
        if (!isNextToOpponent) validMovements.push([activeX+1,activeY]);
        else
        {
            opponentHasWallBehindHim = isNextToWallOrBorder(inactiveX, inactiveY, UDLR.RIGHT);
            if (!opponentHasWallBehindHim) validMovements.push([activeX+2,activeY]);
            else
            {
                if (!isNextToWallOrBorder(inactiveX, inactiveY, UDLR.UP)) validMovements.push([inactiveX,inactiveY-1]);
                if (!isNextToWallOrBorder(inactiveX, inactiveY, UDLR.DOWN)) validMovements.push([inactiveX,inactiveY+1]);
            }
        }
    }

    if (gameState.activePlayer === Player.RED) gameState.validMovementsRed = validMovements;
    else gameState.validMovementsBlu = validMovements;
}

var wasHere = [];

function isSolvable() {
    wasHere.length = COLS;
    for (var col = 0; col < COLS; col++)
    {
        var temporaryArrayForHorizontal = [];
        temporaryArrayForHorizontal.length = ROWS;
        for (var row = 0; row < ROWS; row++)
        {
            temporaryArrayForHorizontal[row] = false;
        }
        wasHere[col] = temporaryArrayForHorizontal;
    }

    var bluPossible = true;
    var redPossible = recursiveSolve(gameState.redX, gameState.redY, Player.RED);
    if (redPossible)
    {
        for (var col = 0; col < COLS; col++){
            for (var row = 0; row < ROWS; row++){
                wasHere[col][row] = false;
            }
        }
        bluPossible = recursiveSolve(gameState.bluX, gameState.bluY, Player.BLU);
    }
    if (!bluPossible) changeGameText("Invalid move. Blue cannot win.");
    else if (!redPossible) changeGameText("INVALID MOVE. RED CANNOT WIN.");
    //console.log("Is Red/Blu possible? "+redPossible+"/"+bluPossible);
    return redPossible && bluPossible;
}

function recursiveSolve (inX, inY) {
    if (gameState.activePlayer == Player.EMPTY) throw Error("Player cannot be EMPTY");

    // Teriminating Conditions
    if (gameState.activePlayer == Player.RED && inY == 0) return true;
    else if (gameState.activePlayer == Player.BLU && inY == ROWS-1) return true;
    wasHere[inX][inY] = true;

    // Check if can go up
    var canGoUp = !isNextToWallOrBorder(inX, inY, UDLR.UP) && !wasHere[inX][inY-1];
    var canGoDown = !isNextToWallOrBorder(inX, inY, UDLR.DOWN) && !wasHere[inX][inY+1];
    var canGoLeft = !isNextToWallOrBorder(inX, inY, UDLR.LEFT) && !wasHere[inX-1][inY];
    var canGoRight = !isNextToWallOrBorder(inX, inY, UDLR.RIGHT) && !wasHere[inX+1][inY];

    if (canGoUp)
    {
        //console.log("From: " +inX+", "+inY+". We can go up, going.");
        if (recursiveSolve(inX, inY-1, gameState.activePlayer)) return true;
    }
    //else console.log("From: " +inX+", "+inY+". We can't go up.");
    if (canGoDown){
        //console.log("From: " +inX+", "+inY+". We can go down, going.");
        if (recursiveSolve(inX, inY+1, gameState.activePlayer)) return true;
    }
    //else console.log("From: " +inX+", "+inY+". We can't go down.");
    if (canGoLeft)
    {
        //console.log("From: " +inX+", "+inY+". We can go left, going.");
        if (recursiveSolve(inX-1, inY, gameState.activePlayer)) return true;
    }
    //else console.log("From: " +inX+", "+inY+". We can't go left.");
    if (canGoRight)
    {
        //console.log("From: " +inX+", "+inY+". We can go right, going.");
        if (recursiveSolve(inX+1, inY, gameState.activePlayer)) return true;
    }
    //else console.log("From: " +inX+", "+inY+". We can't go right.");
    return false;
}