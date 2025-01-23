import { toggleGridlines } from './grid.js';
import { applyGameRules } from './rules.js';
import { brush, randomizeCamps, randomizeTerrain, clearGrid } from './draw.js';

// Animation
let isRunning = false;
let intervalID; // ID for animation loop
let cycleTime = 100; // every 100 ms

function startSimulation() {
	if (isRunning) return;
	isRunning = true;
	animateButton.textContent = 'Pause';
	intervalID = setInterval(() => {
		applyGameRules();
	}, cycleTime);
}

function stopSimulation() {
	isRunning = false;
	clearInterval(intervalID);
	animateButton.textContent = 'Start';
}

function toggleSimulation() {
	if (isRunning){
		stopSimulation();
	} else {
		startSimulation();
	}
}

// Sliders
const speedSlider = document.getElementById('speed');
const speedDisplay = document.getElementById('speedValue');

function updateSpeedDisplay(){
	const newSpeed = speedSlider.value; // evolves per second
	speedDisplay.textContent = newSpeed;
}

function updateCellSpeed(){
	const newSpeed = speedSlider.value;
	speedDisplay.textContent = newSpeed;
	cycleTime = 1000 / newSpeed;
	if (isRunning) { // restart with new rate
		stopSimulation();
		startSimulation();
	}
}

speedSlider.addEventListener('input', () => {
	updateSpeedDisplay();
});

speedSlider.addEventListener('change', () => {
	updateCellSpeed();
});

const gridSizeSlider = document.getElementById('gridSize');
gridSizeSlider.addEventListener('change', stopSimulation);


// Buttons
const animateButton = document.getElementById('toggleAnimation');
const randCampsBtn = document.getElementById('campButton');
const randMountainsBtn = document.getElementById('mountainButton');
const eraseButton = document.getElementById('eraseButton');
const gridlineButton = document.getElementById('toggleGridlines');
const brushColorButton = document.getElementById('brushColor');

animateButton.addEventListener('click', () => {
	toggleSimulation();
});

randCampsBtn.addEventListener('click', () => {
	stopSimulation();
	randomizeCamps();
});

randMountainsBtn.addEventListener('click', () => {
	stopSimulation();
	randomizeTerrain();
});

eraseButton.addEventListener('click', () => {
	stopSimulation();
	clearGrid();
})

gridlineButton.addEventListener('click', () => {
	toggleGridlines();
});

brushColorButton.addEventListener('click', () => {
	brush.swapPaint();	
});

/** Adds the active class to a button temporarily */
function simulateButtonPress(button) {
	button.classList.add('active');
	setTimeout(() => {
		button.classList.remove('active');
	}, 150);
}

// Keyboard shortcuts
let keysPressed = {};

document.addEventListener('keydown', (e) => {
	if (keysPressed[e.code]){
		return;
	}
	keysPressed[e.code] = true;

	switch (e.code) {
		case 'Space':
			// Shortcut overrides any other focused element
			e.preventDefault();
			e.target.blur();
			simulateButtonPress(animateButton);
			toggleSimulation();
			break;
		case 'KeyR':
			stopSimulation();
			simulateButtonPress(randCampsBtn);
			randomizeCamps();
			break;
		case 'KeyT':
			stopSimulation();
			simulateButtonPress(randMountainsBtn);
			randomizeTerrain();
			break;
		case 'KeyE':
			stopSimulation();
			simulateButtonPress(eraseButton);
			clearGrid();
			break;
		case 'KeyG':
			simulateButtonPress(gridlineButton);
			toggleGridlines();
			break;
		case 'KeyX':
			simulateButtonPress(brushColorButton);
			brush.swapPaint();
			break;
		case 'Escape':
			// Lose focus on currently selected element
			document.activeElement.blur();
			break;
	}
});

document.addEventListener('keyup', (e) => {
	keysPressed[e.code] = false;
});

// Read first value from slider
updateCellSpeed();