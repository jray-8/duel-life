import { CellTypes, countNeighbors, grid } from './grid.js';
import { updateAllCellColors } from './draw.js'

/** Rules for war
 * 
 * Expansion:
 * - Use von Neumann neighborhood
 * 
 * 1. Barracks:
 * 		- An empty cell touched by camps of only one side becomes a camp for that side
 * 
 * 2. Defense:
 * 		- An empty cell touched by camps from both sides of the war becomes a barricade for defense
 * 
 * - An empty cell touched by neither side remains empty
 * 
 * Capture:
 * - Use Moore neighborhood
 * - A camp cell (allied or enemy) has `A` allied neighbors and `E` enemy neighbors (not including its self)
 * - The total contest for the cell is `A + E`
 * 
 * 1. Ally capture:
 * 		- An enemy camp has a `A/(A+E)` chance to convert to an allied camp
 * 
 * 2. Enemy capture:
 * 		- An allied camp has a `E/(A+E)` chance to convert to an enemy camp
 * 
 * 3. Barricade takeover:
 * 		- A barricade will convert to the camp who controls at least 3/4 (75%) of its neighbors
 */
function applyGameRules() {
	const updates = [];

	for (let y=0; y < grid.length; ++y) {
		for (let x=0; x < grid[y].length; ++x) {
			const cell = grid[y][x];
			const vonNeumannCounts = countNeighbors(x, y, false);

			// Expansion
			if (CellTypes.isEmpty(cell)) {
				if (vonNeumannCounts[CellTypes.ENEMY] === 0 && vonNeumannCounts[CellTypes.ALLY] > 0) {
					updates.push({cell, life: CellTypes.ALLY});
				}
				else if (vonNeumannCounts[CellTypes.ALLY] === 0 && vonNeumannCounts[CellTypes.ENEMY] > 0) {
					updates.push({cell, life: CellTypes.ENEMY});
				}
				// Both non-zero
				else if (vonNeumannCounts[CellTypes.ALLY] && vonNeumannCounts[CellTypes.ENEMY]) {
					updates.push({cell, life: CellTypes.BARRICADE});
				}
				continue;
			}

			// Capture - stochastic
			const neighborCounts = countNeighbors(x, y, true);
			/** Number of non-mountain, non-barricades */
			const totalCapturable = neighborCounts[CellTypes.ALLY] + neighborCounts[CellTypes.ENEMY] + neighborCounts[CellTypes.EMPTY];

			// Ally Team
			if (CellTypes.isAlly(cell)) {
				// Probability of enemies capturing this cell
				const enemyPower = neighborCounts[CellTypes.ENEMY] / totalCapturable;
				if (Math.random() < enemyPower) {
					updates.push({cell, life: CellTypes.ENEMY});
				}
			}

			// Enemy Team
			else if (CellTypes.isEnemy(cell)) {
				// Probability of allies capturing this cell
				const allyPower = neighborCounts[CellTypes.ALLY] / totalCapturable;
				if (Math.random() < allyPower) {
					updates.push({cell, life: CellTypes.ALLY});
				}
			}
			
			// Barricades - won only by strategy, not by chance
			else if (CellTypes.isBarricade(cell)) {
				const threshold = 0.74; //$$$
				// Allies takes control
				if (neighborCounts[CellTypes.ALLY] / totalCapturable > threshold) {
					updates.push({cell, life: CellTypes.ALLY});
				}
				// Enemies take control
				else if (neighborCounts[CellTypes.ENEMY] / totalCapturable > threshold) {
					updates.push({cell, life: CellTypes.ENEMY});
				}
			}
		}
	}

	// Apply changes
	for (let i = 0; i < updates.length; i++) {
		const {cell, life} = updates[i];
		life ? CellTypes.setCell(cell, life) : CellTypes.clearCell(cell);
	}

	// Dynamic coloring
	updateAllCellColors();
}
  
export { applyGameRules };