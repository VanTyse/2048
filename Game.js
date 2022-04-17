import Grid from "./Grid.js"
import Tile from "./Tile.js"
import { game } from "./script.js"

const scoreElement = document.querySelector('.score')

let score = 0


export default class Game {
    #history
    #grid
    #loseState
    #score
    constructor (gameBoard) {
        this.gameBoard = gameBoard
        this.#history = []
        this.#score;
    }

    get grid(){
        return this.#grid
    }

    get history(){
        return this.#history
    }

    set history(value){
        this.#history = value;
    }

    get score(){
        return this.#score
    }

    set score(value){
        this.#score = value
    }

    createGrid(){
        const gameBoard = this.gameBoard
        this.#grid = new Grid(gameBoard, 4)
        this.#grid.randomEmptyCell().tile = new Tile(gameBoard)
        this.#grid.randomEmptyCell().tile = new Tile(gameBoard)
    }

    undo(){
        const history = this.#history
        this.#grid.cells.forEach((cell, index) => {
            if (cell.tile != null){
                cell.tile.remove()
                cell.tile = null
            }
            if (history[index].tile != null){
                const { tile : {value}} = history[index]
                cell.tile = new Tile(this.gameBoard, value)
            }
            if(index === 15){
                score = history[index].score;
                this.#score = history[index].score
            }
            scoreElement.textContent = `Your Score is ${this.#score}`
        })
    }

    start(){
        this.createGrid()
        setInput(this.#grid, this.gameBoard, this.#history)  
        setUpTouchInput(this.#grid, this.gameBoard, this.#history);
    }
}

function setInput(grid, gameBoard, history){
    window.addEventListener('keydown', (e) => {handleInput(e, grid, gameBoard, history)}, {once : true})
}

async function handleInput (e, grid, gameBoard, history) {
    switch (e.key){
        case 'ArrowUp' :
            if(!canMoveUp(grid)){
                setInput(grid, gameBoard, history)
                return
            }
            setHistory(grid, history)
            await moveUp(grid);
            break
        case 'ArrowDown' :
            if(!canMoveDown(grid)){
                setInput(grid, gameBoard, history)
                return
            }
            setHistory(grid, history)
            await moveDown(grid)
            break
        case 'ArrowLeft' :
            if(!canMoveLeft(grid)){
                setInput(grid, gameBoard, history)
                return
            }
            setHistory(grid, history)
            await moveLeft(grid);
            break
        case 'ArrowRight' :
            if(!canMoveRight(grid)){
                setInput(grid, gameBoard, history)
                return
            }
            setHistory(grid, history)
            await moveRight(grid)
            break
        default : 
            setInput(grid, gameBoard, history)
            return
    }
    grid.cells.forEach(cell => cell.mergeTiles());
    setScore(grid)
    const newTile = new Tile(gameBoard);
    grid.randomEmptyCell().tile = newTile

    if (!canMoveUp(grid) && !canMoveDown(grid) && !canMoveLeft(grid) && !canMoveRight(grid)){
        await newTile.waitForTransition(true)
        alert('Game-Over')
    }
    setInput(grid, gameBoard, history)
}


function moveUp(grid){
    return slideTiles(grid.cellsByColumn)
}

function moveDown(grid){
    return slideTiles(grid.cellsByColumn.map(column => [...column].reverse()))
}

function moveLeft(grid){
    return slideTiles(grid.cellsByRow);
}

function moveRight(grid){
    return slideTiles(grid.cellsByRow.map(row => [...row].reverse()));
}

function slideTiles(cells){
    return Promise.all(
        cells.flatMap(group => {
            const promises = [];
            for (let i = 1; i < group.length; i++){
                const cell = group[i]
                let validCell;
                if (cell.tile == null)continue;
                for (let j = i-1; j >= 0; j--){
                    const destinationCell = group[j];
                    if (!destinationCell.canAccept(cell.tile))break
                    validCell = destinationCell
                }
    
                if(validCell != null){
                    promises.push(cell.tile.waitForTransition())
                    if(validCell.tile != null){
                        validCell.mergeTile = cell.tile
                    }
                    else{
                        validCell.tile = cell.tile;
                    }
                    cell.tile = null;
                }
            }
            return promises
        })
    )
}

function canMoveUp(grid){
    return canMove(grid.cellsByColumn)
}


function canMoveDown(grid){
    return canMove(grid.cellsByColumn.map(column => [...column].reverse()))
}


function canMoveLeft(grid){
    return canMove(grid.cellsByRow)
}


function canMoveRight(grid){
    return canMove(grid.cellsByRow.map(row => [...row].reverse()))
}

function canMove(cells){
    return cells.some(group => {
        return group.some((cell, index) => {
            const destinationCell = group[index-1]
            if (index === 0)return false;
            if (cell.tile == null)return false;
            return destinationCell.canAccept(cell.tile)
        })
    })
}

function setHistory(grid, history){
    grid.cells.forEach((cell, index) => {
        history[index] = {
            tile : !cell.tile ? null : {
                value : cell.tile.value
            }, 
            score : game.score,
        }
    })
}

function setScore(grid){
    grid.cells.forEach(cell =>{
        if (cell.justMerged){
            score += cell.tile.value
        }
    })
    game.score = score
    scoreElement.textContent = `Your Score is ${game.score}`
}

function setUpTouchInput(grid, gameBoard, history){
    let startX, startY, endX, endY, distX = 0, distY = 0, startTime, endTime, elapsedTime, 
    allowedTime = 350, minDistThreshold = 50, maxDistThreshold = 350

    gameBoard.addEventListener('touchstart', (e) => {
        const touchObj = e.changedTouches[0];
        startX = touchObj.pageX;
        startY = touchObj.pageY;
        startTime = Number(new Date().getTime()); //at this point I'm not certain if getTime() returns a number
        e.preventDefault()
    }, false)

    gameBoard.addEventListener('touchmove', (e) => {
        e.preventDefault()
    }, false)

    gameBoard.addEventListener('touchend', (e) => {
        const touchObj = e.changedTouches[0];
        endX = touchObj.pageX;
        endY = touchObj.pageY;
        endTime = Number(new Date().getTime()); 
        elapsedTime = endTime - startTime;
        distX = endX - startX
        distY = endY - startY

        // checking for right movement

        if ((elapsedTime <= allowedTime) && (distX <= maxDistThreshold && distX >= minDistThreshold) && (Math.abs(distY < 100))){
            handleTouchInput('right', grid, gameBoard, history)
            return
        }

        // checking for left movement

        if ((elapsedTime <= allowedTime) && (-distX <= maxDistThreshold && -distX >= minDistThreshold) && (Math.abs(distY < 100))){
            handleTouchInput('left', grid, gameBoard, history)
            return
        }

        // checking for up movement

        if ((elapsedTime <= allowedTime) && (-distY <= maxDistThreshold && -distY >= minDistThreshold) && (Math.abs(distX < 100))){
            handleTouchInput('up', grid, gameBoard, history)
            return
        }

        // checking for down movement

        if ((elapsedTime <= allowedTime) && (distY <= maxDistThreshold && distY >= minDistThreshold) && (Math.abs(distX < 100))){
            handleTouchInput('down', grid, gameBoard, history)
            return
        }
    }, false)

}

async function handleTouchInput(direction, grid, gameBoard, history){    
    switch (direction){
        case 'up' :
            if(!canMoveUp(grid)){
                setUpTouchInput(grid, gameBoard, history)
                return
            }
            setHistory(grid, history)
            await moveUp(grid);
            break
        case 'down' :
            if(!canMoveDown(grid)){
                setUpTouchInput(grid, gameBoard, history)
                return
            }
            setHistory(grid, history)
            await moveDown(grid)
            break
        case 'left' :
            if(!canMoveLeft(grid)){
                setUpTouchInput(grid, gameBoard, history)
                return
            }
            setHistory(grid, history)
            await moveLeft(grid);
            break
        case 'right' :
            if(!canMoveRight(grid)){
                setUpTouchInput(grid, gameBoard, history)
                return
            }
            setHistory(grid, history)
            await moveRight(grid)
            break
        default : 
            setUpTouchInput(grid, gameBoard, history)
            return
    }
    grid.cells.forEach(cell => cell.mergeTiles());
    setScore(grid)
    const newTile = new Tile(gameBoard);
    grid.randomEmptyCell().tile = newTile

    if (!canMoveUp(grid) && !canMoveDown(grid) && !canMoveLeft(grid) && !canMoveRight(grid)){
        await newTile.waitForTransition(true)
        alert('Game-Over')
    }
    setUpTouchInput(grid, gameBoard, history)
}
