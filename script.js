import Game from "./Game.js";

const gameBoard = document.getElementById('game-board')
const undoBtn = document.querySelector('.undo-btn');
export const game = new Game(gameBoard)
game.start()

undoBtn.addEventListener('click', (e) => {
    game.undo()
})

