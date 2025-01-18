// Grid
let gridWidth = 50;
let gridHeight = 50;
let cellSize = 15;
let coverage = 0.4;
let showGridlines = true;

let grid = [];

const container = document.getElementById('game-container');
const cellPosLabel = document.getElementById('cell-location');
const brushColorDisplay = document.getElementById('brushColorDisplay');

class PaintTypes {
	static ALLY = 'ally';
	static ENEMY = 'enemy';
	static BAR = 'barr'
}

class PaintBrush {
	constructor() {
		this.isMouseDown = false; 		// track mouse click state
		this.mode = 'draw'; 			// draw or erase (cells)
		this.color = PaintTypes.ALLY; 	// type of cell to draw

		brushColorDisplay.dataset.life = this.color; // apply first coat
	}

	swapPaint(){
		if (this.color === PaintTypes.ALLY){
			this.color = PaintTypes.ENEMY;
		}
		else {
			this.color = PaintTypes.ALLY;
		}
		// Update color box
		brushColorDisplay.dataset.life = this.color;
	}

	/** Handle changing cell state based on brush mode */
	brushCell(cell){
		const alive = isCellAlive(cell);
		// Draw: bring cell to life
		if (this.mode === 'draw'){
			giveLife(cell, brush.color);
		}
		// Erase: kill cell
		else if (this.mode === 'erase' && alive){
			takeLife(cell);
		}
	}
}

const brush = new PaintBrush();


/** Check if a cell is living */
function isCellAlive(cell){
	return cell && cell.dataset.life && cell.dataset.life !== 'none';
}

/** Give a type of live to a cell: */
function giveLife(cell, type) {
	cell.dataset.life = type;
}

function takeLife(cell) {
	cell.dataset.life = 'none';
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
			takeLife(cell); // default state
			cell.dataset.x = x;
			cell.dataset.y = y;
			container.appendChild(cell);
			grid[y][x] = cell;
		}
	}
}

/** Add event listeners draw/erase cells, and track brush position */
function enableInteractivity() {
	// start a new stroke
	document.addEventListener('mousedown', (e) => {
		brush.isMouseDown = true;

		// Select brush mode based on left/right click
		e.button === 0 ? brush.mode = 'draw' : brush.mode = 'erase';
		
		// Clicked cell
		if (e.target.classList.contains('cell')){
			const cell = e.target;
			brush.brushCell(cell)
		}
	});

	// end stroke
	document.addEventListener('mouseup', () => {
		brush.isMouseDown = false;
	});

	// continue stroking, or move cursor
	document.addEventListener('mousemove', (e) => {
		if (e.target.classList.contains('cell')){
			const cell = e.target;
			if (brush.isMouseDown) {
				brush.brushCell(cell);
			}
			// Track cell position
			let xPos = parseInt(cell.dataset.x) + 1;
			let yPos = parseInt(cell.dataset.y) + 1;
			cellPosLabel.textContent = `(${xPos}, ${yPos})`; 
		}
	});

	// mouse left grid
	container.addEventListener('mouseleave', () => {
		cellPosLabel.textContent = '';
	})

	// prevent right-clicking in game area
	container.addEventListener('contextmenu', (e) => {
		e.preventDefault();
	});
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

const coverageSlider = document.getElementById('coverageSlider');
const coverageDisplay = document.getElementById('coverageValue');

function updateSizeDisplay() {
	const newSize = parseInt(gridSizeSlider.value);
	gridSizeDisplay.textContent = `${newSize}x${newSize}`;
}

function updateCoverage() {
	coverage = parseFloat(coverageSlider.value);
	coverageDisplay.textContent = `${(coverage * 100).toFixed(0)}%`;
}

gridSizeSlider.addEventListener('change', updateGrid);
gridSizeSlider.addEventListener('input', updateSizeDisplay);

coverageSlider.addEventListener('input', updateCoverage);


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

/** Randomize cell states based on coverage */
function randomizeGrid() {
	grid.forEach((row) => {
		row.forEach((cell) => {
			const paint = Math.random() < 0.5 ? PaintTypes.ALLY : PaintTypes.ENEMY;
			Math.random() < coverage ? giveLife(cell, paint) : takeLife(cell);
		});
	});
}

/** Kill all cells */
function clearGrid() {
	grid.forEach((row) => {
		row.forEach((cell) => {
			takeLife(cell);
		});
	});
}


/** Creates first grid and initializes values from sliders */
function initGrid() {
	updateCoverage();
	updateSizeDisplay();
	updateGrid(); 
	enableInteractivity();
}

initGrid();

export { PaintTypes, brush, toggleGridlines, randomizeGrid, clearGrid, isCellAlive, giveLife, takeLife, grid, gridWidth, gridHeight};
