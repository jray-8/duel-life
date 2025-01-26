import { CellTypes, countOpenings, countNeighbors, stateGrid } from './grid.js';
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
	const barricadeTheshold = 0.74;

	for (let y=0; y < stateGrid.length; ++y) {
		for (let x=0; x < stateGrid[y].length; ++x) {

			// Expansion
			if (CellTypes.isEmpty(x, y)) {
				const vonNeumannCounts = countNeighbors(x, y, false);

				if (vonNeumannCounts[CellTypes.ENEMY] === 0 && vonNeumannCounts[CellTypes.ALLY] > 0) {
					updates.push({x, y, type: CellTypes.ALLY});
				}
				else if (vonNeumannCounts[CellTypes.ALLY] === 0 && vonNeumannCounts[CellTypes.ENEMY] > 0) {
					updates.push({x, y, type: CellTypes.ENEMY});
				}
				// Both non-zero
				else if (vonNeumannCounts[CellTypes.ALLY] && vonNeumannCounts[CellTypes.ENEMY]) {
					updates.push({x, y, type: CellTypes.BARRICADE});
				}
				continue;
			}

			// Capture - stochastic
			const neighborCounts = countNeighbors(x, y, true);
			const totalOpenings = countOpenings(neighborCounts);

			// Ally Team
			if (CellTypes.isAlly(x, y)) {
				// Probability of enemies capturing this cell
				const enemyPower = neighborCounts[CellTypes.ENEMY] / totalOpenings;
				if (Math.random() < enemyPower) {
					updates.push({x, y, type: CellTypes.ENEMY});
				}
			}

			// Enemy Team
			else if (CellTypes.isEnemy(x, y)) {
				// Probability of allies capturing this cell
				const allyPower = neighborCounts[CellTypes.ALLY] / totalOpenings;
				if (Math.random() < allyPower) {
					updates.push({x, y, type: CellTypes.ALLY});
				}
			}
			
			// Barricades - won by majority (75%) control of neighbors
			else if (CellTypes.isBarricade(x, y)) {
				// Allies takes control
				if (neighborCounts[CellTypes.ALLY] / totalOpenings > barricadeTheshold) {
					updates.push({x, y, type: CellTypes.ALLY});
				}
				// Enemies take control
				else if (neighborCounts[CellTypes.ENEMY] / totalOpenings > barricadeTheshold) {
					updates.push({x, y, type: CellTypes.ENEMY});
				}
			}
		}
	}

	// Apply changes
	for (let i = 0; i < updates.length; i++) {
		const {x, y, type} = updates[i];
		CellTypes.setCell(x, y, type);
	}

	// Dynamic coloring
	updateAllCellColors();
}
  
export { applyGameRules };