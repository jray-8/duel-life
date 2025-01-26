// Grid
let gridWidth = 50;
let gridHeight = 50;
let cellSize = 15;
let showGridlines = true;

let grid = [];
let stateGrid = []; // Store only the CellTypes

const container = document.getElementById('game-container');

class CellTypes {
	static ALLY = 1;
	static ENEMY = 2;
	static BARRICADE = 3;
	static MOUNTAIN = 4;
	static EMPTY = 0;

	/** Update the state grid with a new cell type */
	static setCell(x, y, type) {
		stateGrid[y][x] = type;
	}

	/** Give a cell type EMPTY */
	static clearCell(x, y) {
		stateGrid[y][x] = CellTypes.EMPTY;
	}

	/** Check if a cell is a camp (ally or enemy) */
	static isCamp(x, y){
		const type = this.get(x, y);
		return type === CellTypes.ALLY || type === CellTypes.ENEMY;
	}

	static isAlly(x, y){
		return stateGrid[y][x] === CellTypes.ALLY;
	}

	static isEnemy(x, y){
		return stateGrid[y][x] === CellTypes.ENEMY;
	}

	static isBarricade(x, y){
		return stateGrid[y][x] === CellTypes.BARRICADE;
	}

	static isMountain(x, y){
		return stateGrid[y][x] === CellTypes.MOUNTAIN;
	}

	static isEmpty(x, y){
		return stateGrid[y][x] === CellTypes.EMPTY;
	}

	/** Returns the state of a cell based on its position */
	static get(x, y) {
		return stateGrid[y][x];
	}
}

function createGrid() {
	container.innerHTML = ''; // clear previous grid
	container.style.display = 'grid';
	container.style.gridTemplateColumns = `repeat(${gridWidth}, ${cellSize}px)`;
	container.style.gridTemplateRows = `repeat(${gridHeight}, ${cellSize}px)`;

	grid = Array.from({ length: gridHeight }, () => Array(gridWidth).fill(null));
	stateGrid = Array.from({ length: gridHeight }, () => Array(gridWidth).fill(CellTypes.EMPTY));

	for (let y=0; y < gridHeight; ++y){
		for (let x=0; x < gridWidth; ++x){
			const cell = document.createElement('div');
			cell.classList.add('cell');
			cell.dataset.x = x;
			cell.dataset.y = y;
			container.appendChild(cell);
			grid[y][x] = cell;
		}
	}
}

/** Return the position [x, y] of a cell */
function getCellPos(cell) {
	return [parseInt(cell.dataset.x), parseInt(cell.dataset.y)]
}

/** Generate the sequence of [x, y] positions relative to a center cell */
function* getNeighbors(x, y, diagonals = true) {
	const offsets = [-1, 0, 1];
	for (let dx of offsets) {
		for (let dy of offsets) {
			if (dx === 0 && dy === 0) {
				continue; // skip self
			}
			if (!diagonals && dx && dy) {
				continue; // skip diagonals
			}
			const nx = x + dx;
			const ny = y + dy;
			if (nx >= 0 && nx < gridWidth && ny >= 0 && ny < gridHeight){
				yield [nx, ny];
			}
		}
	}
}

/** Count the number of each cell state in the Moore neighborhood */
function countNeighbors(x, y, diagonals = true){
	const neighborhood = {};
	// Initialize counts for each cell type
	for (let type of Object.values(CellTypes)) {
		neighborhood[type] = 0;
	}
	// Count all neighbors
	for (const [nx, ny] of getNeighbors(x, y, diagonals)) {
		const state = stateGrid[ny][nx];
		neighborhood[state] += 1;
	}
	return neighborhood;
}

/** Return the total number of neighboring spaces that are either empty or camps (from either team) */
function countOpenings(neighborCounts) {
	return neighborCounts[CellTypes.ALLY] + neighborCounts[CellTypes.ENEMY] + neighborCounts[CellTypes.EMPTY];
}


function setGridGap() {
	let size = 1;
	if (!showGridlines){ // no gaps
		size = 0;
	}
	container.style.gap = `${size}px`;
}

function getGridGap() {
	const gap = container.style.gap;
	return gap ? parseInt(gap) : 0;
}

/** Sets length of a single cell */
function rescaleCellSize() {
	setGridGap();
	const viewportHeight = window.innerHeight;
	// minus gapsize
	cellSize = 0.95 * (viewportHeight / gridHeight) - getGridGap();
}

/** Resize, rescale, and create new grid */
function updateGrid() {
	const newSize = parseInt(gridSizeSlider.value);
	gridWidth = newSize;
	gridHeight = newSize;
	rescaleCellSize();
	// reset grid
	createGrid();
}


// Sliders
const gridSizeSlider = document.getElementById('gridSize');
const gridSizeDisplay = document.getElementById('gridSizeValue');

function updateSizeDisplay() {
	const newSize = parseInt(gridSizeSlider.value);
	gridSizeDisplay.textContent = `${newSize}x${newSize}`;
}

gridSizeSlider.addEventListener('change', updateGrid);
gridSizeSlider.addEventListener('input', updateSizeDisplay);


// Button effects
function redrawGrid() {
	rescaleCellSize();
	container.style.gridTemplateColumns = `repeat(${gridWidth}, ${cellSize}px)`;
	container.style.gridTemplateRows = `repeat(${gridHeight}, ${cellSize}px)`;
}

window.addEventListener('resize', redrawGrid);

function toggleGridlines() {
	showGridlines = !showGridlines; // flip
	redrawGrid();
}

// Initialize grid
updateSizeDisplay();
updateGrid();

export { CellTypes, toggleGridlines, countOpenings, countNeighbors, getNeighbors, getCellPos, stateGrid, grid };
