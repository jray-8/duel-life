// Grid
let gridWidth = 50;
let gridHeight = 50;
let cellSize = 15;
let showGridlines = true;

let grid = [];

const container = document.getElementById('game-container');

class CellTypes {
	static ALLY = 'ally';
	static ENEMY = 'enemy';
	static BARRICADE = 'barricade';
	static MOUNTAIN = 'mountain';
	static EMPTY = 'empty';

	/** Give a type to a cell */
	static setCell(cell, type) {
		cell.dataset.type = type;
	}

	/** Give a cell type EMPTY */
	static clearCell(cell) {
		cell.dataset.type = CellTypes.EMPTY;
	}

	/** Check if a cell is a camp (ally or enemy) */
	static isCamp(cell){
		return this.isAlly(cell) || this.isEnemy(cell);
	}

	static isAlly(cell){
		return cell.dataset.type === CellTypes.ALLY;
	}

	static isEnemy(cell){
		return cell.dataset.type === CellTypes.ENEMY;
	}

	static isBarricade(cell){
		return cell.dataset.type === CellTypes.BARRICADE;
	}

	static isMountain(cell){
		return cell.dataset.type === CellTypes.MOUNTAIN;
	}

	static isEmpty(cell){
		return !(cell.dataset.type) || cell.dataset.type === CellTypes.EMPTY;
	}

	/** Returns an object's dataset.type */
	static get(cell) {
		return cell.dataset.type;
	}
}

function createGrid() {
	container.innerHTML = ''; // clear previous grid
	container.style.display = 'grid';
	container.style.gridTemplateColumns = `repeat(${gridWidth}, ${cellSize}px)`;
	container.style.gridTemplateRows = `repeat(${gridHeight}, ${cellSize}px)`;

	grid = Array.from({ length: gridHeight }, () => Array(gridWidth).fill(null));

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

/** Generate the sequence neighbors relative to a cell */
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
				yield grid[ny][nx];
			}
		}
	}
}

/** Count the number of each type of cell in the Moore neighborhood */
function countNeighbors(x, y, diagonals = true){
	const neighborhood = {};
	// Initialize counts for each cell type
	for (let type of Object.values(CellTypes)) {
		neighborhood[type] = 0;
	}
	// Count all neighbors
	for (const neighbor of getNeighbors(x, y, diagonals)) {
		const type = neighbor.dataset.type;
		if (type in neighborhood){
			neighborhood[type] += 1;
		}
	}
	return neighborhood;
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

export { CellTypes, toggleGridlines, countNeighbors, getNeighbors, grid };
