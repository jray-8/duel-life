import { CellTypes, countNeighbors, getNeighbors, grid } from './grid.js'

const cellPosLabel = document.getElementById('cell-location');
const brushColorDisplay = document.getElementById('brushColorDisplay');

// Color boxes (from legend)
const allyBox = document.getElementById('allyColor');
const enemyBox = document.getElementById('enemyColor');
const barricadeBox = document.getElementById('barricadeColor');
const mountainBox = document.getElementById('mountainColor');

// Parameters
let campCoverage = 0;
let mountainCoverage = 0;

const colors = {
	[CellTypes.ALLY]: null,
	[CellTypes.ENEMY]: null,
	[CellTypes.BARRICADE]: null,
	[CellTypes.MOUNTAIN]: null
};

/** Accepts a CellTypes string */
function typeToColor(type) {
	return colors[type] || ''; // Default -> use css rules instead
}

/** Accepts a cell (div) */
function getColor(cell) {
	const type = cell.dataset.type;
	return typeToColor(type);
}

/** Darken and return a new hex color (string) 
 * - Darkens by (%) amount
 */
function darkenHexColor(hex, percent) {
	// Remove the '#' if present
	hex = hex.replace(/^#/, '');

	// Expand shorthand (abc -> aabbcc)
	if (hex.length === 3) {
		hex = hex.split('').map(c => c + c).join('');
	}

	// Parse each RGB component from hex
	let r = parseInt(hex.substring(0, 2), 16);
	let g = parseInt(hex.substring(2, 4), 16);
	let b = parseInt(hex.substring(4, 6), 16);

	// Darken each component
	r = Math.max(0, Math.floor(r * (1 - percent / 100)));
	g = Math.max(0, Math.floor(g * (1 - percent / 100)));
	b = Math.max(0, Math.floor(b * (1 - percent / 100)));

	// Convert the darkened values back to hex
	const darkHex = [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');

	return `#${darkHex}`;
}


/** Set the background color of a cell according to its type.
 * 
 * Dynamically color camp cells by darkening them based on the control of opposing forces, `p`. 
 * 
 * If a cell has `A` allied neighbors and `E` enemy neighbors,
 * - The allies have a power of `A/(A+E)`
 * - The enemies have a power of `E/(A+E)`
 * 
 * Darken the cell by `(p * 75)%`
*/
function updateCellColor(cell) {
	const isAlly = CellTypes.isAlly(cell);
	const isEnemy = CellTypes.isEnemy(cell);
	if (isAlly || isEnemy) {
		const baseColor = getColor(cell);

		// Control (%) of opposing force on this cell
		const opposingType = isAlly ? CellTypes.ENEMY : CellTypes.ALLY;
		const neighborCounts = countNeighbors(...getCellPos(cell), true);
		const totalContesting = neighborCounts[CellTypes.ALLY] + neighborCounts[CellTypes.ENEMY];
		const power = totalContesting > 0 ? neighborCounts[opposingType] / totalContesting : 0;
		const darkenPercent = 75 * power; // Darkened by 75% at total lack of power
		
		// Apply darkening effect
		const hex = darkenHexColor(baseColor, darkenPercent);
		cell.style.backgroundColor = hex;
	}
	// Static colors
	else {
		cell.style.backgroundColor = getColor(cell);
	}
}

function updateAllCellColors() {
	for (let i = 0; i < grid.length; ++i) {
		for (let j = 0; j < grid[i].length; ++j){
			updateCellColor(grid[i][j]);
		}
	}
}

/** Updates the background color of a cell based on its type.  
 * 
 * Does not dynamically color camps
 */
function applyStaticColor(cell) {
	cell.style.backgroundColor = getColor(cell);
}


/** Return position [x, y] of a cell */
function getCellPos(cell) {
	return [parseInt(cell.dataset.x), parseInt(cell.dataset.y)]
}

class PaintBrush {
	constructor() {
		this.isMouseDown = false; 		// track mouse click state
		this.mode = 'draw'; 			// draw or erase (cells)
		this.paint = CellTypes.ALLY; 	// type of cell to draw
	}

	/** Match color box (for brush) to its paint type */
	updateColorBox() {
		brushColorDisplay.style.backgroundColor = typeToColor(this.paint);
	}

	setPaint(type){
		this.paint = type;
		this.updateColorBox();
	}

	swapPaint(dir = 1){
		const paintOrder = [
			CellTypes.ALLY,
			CellTypes.ENEMY,
			CellTypes.MOUNTAIN,
			CellTypes.BARRICADE
		];

		const currentIndex = paintOrder.indexOf(this.paint);

		// Normalize direction
		dir = Math.sign(dir);

		const newIndex = (currentIndex + dir + paintOrder.length) % paintOrder.length;
		
		this.setPaint(paintOrder[newIndex]);
	}

	/** Change cell state and color its background based on brush mode 
	 * - or include the cell `type` to paint
	*/
	brushCell(cell){
		// Draw: add new type
		if (this.mode === 'draw'){
			CellTypes.setCell(cell, this.paint);
		}
		// Erase type
		else if (this.mode === 'erase'){
			CellTypes.clearCell(cell);
		}
		// Update dynamic colors
		for (const neighbor of getNeighbors(...getCellPos(cell), true)) {
			if (CellTypes.isCamp(neighbor)) {
				updateCellColor(neighbor);
			}
		}
		updateCellColor(cell); // Center cell
	}
}

const brush = new PaintBrush();


/** Add event listeners draw/erase cells, and track brush position */
function enableInteractivity() {
	// Start a new stroke
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

	// End stroke
	document.addEventListener('mouseup', () => {
		brush.isMouseDown = false;
	});

	// Continue stroking, or move cursor
	document.addEventListener('mousemove', (e) => {
		if (e.target.classList.contains('cell')){
			const cell = e.target;
			if (brush.isMouseDown) {
				brush.brushCell(cell);
			}
			// Track cell position
			const [xPos, yPos] = getCellPos(cell);
			cellPosLabel.textContent = `(${xPos}, ${yPos})`; 
		}
	});

	const container = document.getElementById('game-container'); // Div for grid

	// Mouse left grid
	container.addEventListener('mouseleave', () => {
		cellPosLabel.textContent = '';
	})

	// Prevent right-clicking in game area
	container.addEventListener('contextmenu', (e) => {
		e.preventDefault();
	});

	// Mouse wheel to scroll through paints
	document.addEventListener("wheel", (e) => {
		if (e.target === document.body || container.contains(e.target)){
			brush.swapPaint(e.deltaY);
		}
	});

	// Add types to color boxes
	allyBox.dataset.type = CellTypes.ALLY;
	enemyBox.dataset.type = CellTypes.ENEMY;
	barricadeBox.dataset.type = CellTypes.BARRICADE;
	mountainBox.dataset.type = CellTypes.MOUNTAIN;

	// Update color boxes
	const pickers = document.querySelectorAll('.color-picker');
	pickers.forEach(pickr => {
		
		function changeColor() {
			const colorBox = pickr.parentElement;
			colorBox.style.backgroundColor = pickr.value;
			colors[CellTypes.get(colorBox)] = pickr.value; // store new color
			if (colorBox.dataset.type === brush.paint) {
				brush.updateColorBox();
			}
		}

		pickr.addEventListener('input', () => {
			changeColor();
		});
		changeColor();
	});
}


/** Randomize board with living cells based on coverage 
 * - Perserves mountains
*/
function randomizeCamps() {
	for (const row of grid) {
		for (const cell of row) {
			if (CellTypes.isMountain(cell)) { // Do not build camps on mountains
				continue;
			}
			const paint = Math.random() < 0.5 ? CellTypes.ALLY : CellTypes.ENEMY;
			Math.random() < campCoverage ? CellTypes.setCell(cell, paint) : CellTypes.clearCell(cell);
		}
	}
	updateAllCellColors();
}

/** Randomize mountain cells based on coverage 
 * - Clears all other cells
*/
function randomizeTerrain() {
	for (const row of grid) {
		for (const cell of row) {
			Math.random() < mountainCoverage ? CellTypes.setCell(cell, CellTypes.MOUNTAIN) : CellTypes.clearCell(cell);
			applyStaticColor(cell);
		}
	}
}

/** Kill all cells */
function clearGrid() {
	for (const row of grid) {
		for (const cell of row) {
			CellTypes.clearCell(cell);
			applyStaticColor(cell);
		}
	}
}


// Sliders
const campCoverageSlider = document.getElementById('campCoverage');
const campCoverageDisplay = document.getElementById('campCoverageValue');

const mountainCoverageSlider = document.getElementById('mountainCoverage');
const mountainCoverageDisplay = document.getElementById('mountainCoverageValue');

function updateCampCoverage() {
	campCoverage = parseFloat(campCoverageSlider.value);
	campCoverageDisplay.textContent = `${(campCoverage * 100).toFixed(0)}%`;
}

function updateMountainCoverage() {
	mountainCoverage = parseFloat(mountainCoverageSlider.value);
	mountainCoverageDisplay.textContent = `${(mountainCoverage * 100).toFixed(0)}%`;
}

campCoverageSlider.addEventListener('input', updateCampCoverage);
mountainCoverageSlider.addEventListener('input', updateMountainCoverage);


// Initialize values from sliders
updateCampCoverage();
updateMountainCoverage();

// Make grid interactive
enableInteractivity();

export { brush, updateAllCellColors, clearGrid, randomizeCamps, randomizeTerrain };