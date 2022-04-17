const CELL_SIZE = 16.5;
const CELL_GAP = 2

const createCellElements = (gridElement, gridSize) => {
    const cells = []
    for (let i = 0; i < gridSize * gridSize; i++){
        const cell = document.createElement('div')
        cell.classList.add('cell')
        cells.push(cell)
        gridElement.append(cell)
    }
    return cells
}

export default class Grid {
    #cells
    constructor (gridElement, gridSize = 3) {
        this.gridSize = gridSize
        gridElement.style.setProperty("--grid-size", gridSize)
        gridElement.style.setProperty("--cell-size", `${CELL_SIZE}vmin`)
        gridElement.style.setProperty("--cell-gap", `${CELL_GAP}vmin`)
        this.#cells = createCellElements(gridElement, gridSize).map((cellElement, index) => {
            return new Cell (
                cellElement,
                index % gridSize,
                Math.floor( index / gridSize )
            );
        });
    }

    get cells(){
        return this.#cells;
    }

    get cellsByColumn(){
        return this.#cells.reduce((cellArray, cell) => {
            cellArray[cell.x] = cellArray[cell.x] || [];
            cellArray[cell.x][cell.y] = cell;
            return cellArray
        }, [])
    }

    get cellsByRow(){
        return this.#cells.reduce((cellArray, cell) => {
            cellArray[cell.y] = cellArray[cell.y] || [];
            cellArray[cell.y][cell.x] = cell;
            return cellArray
        }, [])
    }

    get #emptyCells() {
        return this.#cells.filter(cell => cell.tile == null)
    }

    randomEmptyCell(){
        const randomIndex = Math.floor(Math.random() * this.#emptyCells.length)
        return this.#emptyCells[randomIndex]
    }
}

class Cell {
    #x
    #y
    #cellElement
    #tile
    #mergeTile
    #justMerged
    constructor (cellElement, x, y) {
        this.#x = x;
        this.#y = y;
        this.#cellElement = cellElement;
    }

    get x() {
        return this.#x
    }

    get y() {
        return this.#y
    }

    get justMerged () {
        return this.#justMerged;
    }

    get tile(){
        return this.#tile
    }

    set tile(value){
        this.#tile = value
        if (value == null) return;
        this.#tile.x = this.#x;
        this.#tile.y = this.#y
    }

    get mergeTile(){
        return this.#mergeTile
    }

    set mergeTile (value) {
        this.#mergeTile = value;
        if (value == null) {
            return
        }
        this.#mergeTile.x = this.#x
        this.#mergeTile.y = this.#y
    }

    canAccept(tile){
        return this.tile == null ||
        (this.mergeTile == null && (this.tile.value === tile.value))
        // this.tile.value === tile.value
    }

    mergeTiles(){
        this.#justMerged = false;
        if (this.mergeTile == null || this.tile == null)return
        this.tile.value = this.mergeTile.value + this.tile.value
        this.#justMerged = true
        this.mergeTile.remove()
        this.mergeTile = null
    }
}
 