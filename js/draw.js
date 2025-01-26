import { CellTypes, getCellPos, countOpenings, countNeighbors, getNeighbors, stateGrid, grid } from './grid.js'

const cellPosLabel = document.getElementById('cell-location');
const brushColorDisplay = document.getElementById('brushColorDisplay');

// Parameters
/** Number of starting camp cells (for each team) */
let baseCamps = 0;

/** Percent of mountains on grid */
let mountainCoverage = 0;

/** Maps CellTypes to hex colors */
const colors = {
	[CellTypes.ALLY]: null,
	[CellTypes.ENEMY]: null,
	[CellTypes.BARRICADE]: null,
	[CellTypes.MOUNTAIN]: null,
	[CellTypes.EMPTY]: '' // Blank, use base css color
};

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
 * Darken the cell by `(p * 70)%`
*/
function updateCellColor(x, y) {
	const cell = grid[y][x];
	const type = CellTypes.get(x, y);
	const isAlly = type === CellTypes.ALLY;

	if (isAlly || type === CellTypes.ENEMY) {
		const baseColor = colors[type];

		// Control (%) of opposing force on this cell
		const opposingType = isAlly ? CellTypes.ENEMY : CellTypes.ALLY;
		const neighborCounts = countNeighbors(x, y, true);
		const totalOpenings = countOpenings(neighborCounts);
		const opposingPower = totalOpenings > 0 ? neighborCounts[opposingType] / totalOpenings : 0;
		const darkenPercent = 70 * opposingPower; // Darkened by 70% at a total lack of power
		
		// Apply darkening effect
		const hex = darkenHexColor(baseColor, darkenPercent);
		cell.style.backgroundColor = hex;
	}
	// Static colors
	else {
		cell.style.backgroundColor = colors[type];
	}
}

function updateAllCellColors() {
	for (let y = 0; y < grid.length; ++y) {
		for (let x = 0; x < grid[y].length; ++x){
			updateCellColor(x, y);
		}
	}
}

/** Updates the background color of a cell based on its type.
 * 
 * Does not dynamically color camps
 */
function applyStaticColor(x, y) {
	grid[y][x].style.backgroundColor = colors[stateGrid[y][x]];
}


const brush = {
	isMouseDown: false, 		// track mouse click state
	mode: 'draw', 				// draw or erase (cells)
	paint: CellTypes.ALLY, 		// type of cell to draw

	/** Array of cell types (paint) */
	brushOrder: [
		CellTypes.ALLY,
		CellTypes.ENEMY,
		CellTypes.MOUNTAIN,
		CellTypes.BARRICADE
	],

	/** Match color box (for the brush) to its paint color */
	updateColorBox: function() {
		brushColorDisplay.style.backgroundColor = colors[this.paint];
	},

	/** Changes current paint (for cell type) */
	setPaint: function(type) {
		this.paint = type;
		this.updateColorBox();
	},

	swapPaint: function(dir = 1) {
		const currentIndex = this.brushOrder.indexOf(this.paint);

		// Normalize direction
		dir = Math.sign(dir);

		const newIndex = (currentIndex + dir + this.brushOrder.length) % this.brushOrder.length;
		
		this.setPaint(this.brushOrder[newIndex]);
	},

	/** Change cell state and color its background based on brush mode 
	 * - or include the cell `type` to paint
	*/
	brushCell: function(cell) {
		const [x, y] = getCellPos(cell);
		// Draw: add new type
		if (this.mode === 'draw'){
			CellTypes.setCell(x, y, this.paint);
		}
		// Erase type
		else if (this.mode === 'erase'){
			CellTypes.clearCell(x, y);
		}
		// Update dynamic colors
		for (const [nx, ny] of getNeighbors(x, y, true)) {
			if (CellTypes.isCamp(nx, ny)) {
				updateCellColor(nx, ny);
			}
		}
		updateCellColor(x, y); // Center cell
	}
}


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

	// Add types to color boxes (from legend)

	/** Maps ID of colorBoxes to its respective cell type */
	const colorBoxToType = {
		'allyColor': CellTypes.ALLY,
		'enemyColor': CellTypes.ENEMY,
		'barricadeColor': CellTypes.BARRICADE,
		'mountainColor': CellTypes.MOUNTAIN
	};

	// Update color boxes
	const pickers = document.querySelectorAll('.color-picker');
	pickers.forEach(pickr => {
		
		function changeColor() {
			const colorBox = pickr.parentElement;
			colorBox.style.backgroundColor = pickr.value;

			const type = colorBoxToType[colorBox.id];
			colors[type] = pickr.value; // store new color
			if (type === brush.paint) {
				brush.updateColorBox();
			}
			updateAllCellColors();
		}

		pickr.addEventListener('click', () => {
			const colorBox = pickr.parentElement;
			brush.setPaint(colorBoxToType[colorBox.id]);
		});

		pickr.addEventListener('input', () => {
			const colorBox = pickr.parentElement;
			colorBox.style.backgroundColor = pickr.value;
			brushColorDisplay.style.backgroundColor = pickr.value;
		});

		pickr.addEventListener('change', () => {
			changeColor();
		});

		// Get initial color
		changeColor();
	});
}


/** Randomize the grid with the starting base camps
 * - preserves mountains and barricases
 * - all other cells will be erased
*/
function randomizeCamps() {
	const availableCells = [];
	for (let y=0; y < stateGrid.length; ++y) {
		for (let x=0; x < stateGrid[y].length; ++x) {
			if (!CellTypes.isMountain(x, y) && !CellTypes.isBarricade(x, y)) {
				CellTypes.clearCell(x, y);
				availableCells.push([x, y]);
			}
		}
	}

	// Shuffle the available cells for randomness
	for (let i = availableCells.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		// Swap
		[availableCells[i], availableCells[j]] = [availableCells[j], availableCells[i]];
	}

	// Place base camps
	for (const type of [CellTypes.ALLY, CellTypes.ENEMY]) {
		for (let i = 0; i < baseCamps; ++i) {
			if (availableCells.length === 0) break; // No empty cells left
			const [x, y] = availableCells.pop();
			CellTypes.setCell(x, y, type);
		}
	}
	updateAllCellColors();
}

/** Randomize mountain cells based on coverage 
 * - Clears all other cells
*/
function randomizeTerrain() {
	for (let y=0; y < stateGrid.length; ++y) {
		for (let x=0; x < stateGrid[y].length; ++x) {
			Math.random() < mountainCoverage ? CellTypes.setCell(x, y, CellTypes.MOUNTAIN) : CellTypes.clearCell(x, y);
			applyStaticColor(x, y);
		}
	}
}

/** Erase all cells
 * - option to keep environment cells (mountains and barricades)
*/
function clearGrid(keepEnvironment = false) {
	for (let y=0; y < stateGrid.length; ++y) {
		for (let x=0; x < stateGrid[y].length; ++x) {
			if (keepEnvironment && (CellTypes.isMountain(x, y) || CellTypes.isBarricade(x, y))) {
				continue;
			}
			CellTypes.clearCell(x, y);
			applyStaticColor(x, y);
		}
	}
}


// Sliders
const baseCampsSlider = document.getElementById('baseCamps');
const baseCampsDisplay = document.getElementById('baseCampsValue');

const mountainCoverageSlider = document.getElementById('mountainCoverage');
const mountainCoverageDisplay = document.getElementById('mountainCoverageValue');

function updateCampCoverage() {
	baseCamps = parseInt(baseCampsSlider.value);
	baseCampsDisplay.textContent = `${baseCamps}`;
}

function updateMountainCoverage() {
	mountainCoverage = parseFloat(mountainCoverageSlider.value);
	mountainCoverageDisplay.textContent = `${(mountainCoverage * 100).toFixed(1)}%`;
}

baseCampsSlider.addEventListener('input', updateCampCoverage);
mountainCoverageSlider.addEventListener('input', updateMountainCoverage);


// Initialize values from sliders
updateCampCoverage();
updateMountainCoverage();

// Make grid interactive
enableInteractivity();

export { brush, updateAllCellColors, clearGrid, randomizeCamps, randomizeTerrain };