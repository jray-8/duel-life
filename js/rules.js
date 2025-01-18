import { PaintTypes, isCellAlive, giveLife, takeLife, grid, gridWidth, gridHeight } from './grid.js';

/** Count the number of live cells (of each type) in the Moore neighbourhood */
function countLiveNeighbours(x, y){
	const liveNeighbours = {green: 0, red: 0, hybrid: 0};

	const offsets = [-1, 0, 1];
	offsets.forEach((dx) => {
		offsets.forEach((dy) => {
			if (dx === 0 && dy === 0){
				return; // skip self
			}
			const nx = x + dx;
			const ny = y + dy;
			if (nx >= 0 && nx < gridWidth && ny >= 0 && ny < gridHeight){
				const neighbour = grid[ny][nx];
				if (isCellAlive(neighbour)){
					const type = neighbour.dataset.life;
					if (type in liveNeighbours){
						liveNeighbours[type] += 1;
					} 
				}
			}
		});
	});
	return liveNeighbours;
}

/** Rules - Day & Night
 * 
 * 1) Birth:
 * Any dead cell with exactly 3, 6, 7, or 8 live neighbours becomes a live cell
 * 
 * 2) Survival:
 * Any live cell with 3, 4, 6, 7, or 8 live neighbours continues to live
 */
function applyGameRules() {
	const birthNeighbours = [3, 6, 7, 8];
	const survivalNeighbours = [3, 4, 6, 7, 8];
	const updates = [];

	grid.forEach((row, y) => {
		row.forEach((cell, x) => {
			const liveNeighbours = countLiveNeighbours(x, y);
			const totalAlive = Object.values(liveNeighbours).reduce((sum, value) => sum + value, 0);

			const selfAlive = isCellAlive(cell);
			// fail to survive
			if (selfAlive && (!survivalNeighbours.includes(totalAlive))){
				updates.push({cell, alive: null}); // dies
			}
			// birth
			else if (birthNeighbours.includes(totalAlive)){
				let type;
				if (liveNeighbours.green > 0 && liveNeighbours.red > 0){
					type = PaintTypes.BAR;
				}
				else if (liveNeighbours.green > 0){
					type = PaintTypes.ALLY;
				}
				else {
					type = PaintTypes.ENEMY;
				}
				updates.push({cell, alive: type});
			}
		});
	});

	// Apply changes
	updates.forEach(({cell, alive}) => {
		alive ? giveLife(cell, alive) : takeLife(cell);
	});
}

export { isCellAlive, applyGameRules };