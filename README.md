# Duel-Life

This is a stochastic cellular automaton that simulates war between two teams!

![Big Earth](./assets/compressed-big-earth.gif)

![Big Earth](./assets/big-dick-resized.gif)

## Rules

There are 5 unique cell types:

- `Allied Camps`
- `Enemy Camps`
- `Barricades`
- `Mountains`
- `Empty Cells`

War has 2 distinct phases:

1. __Expansion__
	(uses von Neumann neighborhood)

	__Barracks__
	- An `empty cell` with neighboring camps from only _one_ team becomes another camp.

	__Defense__
	- An `empty cell` with neighboring camps from both teams becomes a barricade for defense.

	__Uncharted__
	- `Empty cells` with no neighboring camps remain empty.

1. __Capture__
	(uses Moore neighborhood)

	A cell has `A` allied neighbors, `E` enemy neighbors, and `X` empty cell neighbors (not including its self).  
	The total openings of a cell is equal to `A + E + X`.

	__Ally Capture__
	- An `enemy camp` has a `A / (A + E + X)` chance to convert to an allied camp.

	__Enemy Capture__
	- An `allied camp` has a `E / (A + E + X)` chance to convert to an enemy camp.

	__Barricade Takeover__
	- A barricade will convert to the camp that controls at least $75\%$ of its neighbors.

<br>

`Mountains` are simply impassable cells that act to reduce the number of openings a camp has, and make more interesting battlefields.

`Barricades` serve as temporary `mountains` until one team has enough control to dismantle it.


## Dynamic Coloring

The camp cells are darkened based on the number of opposing camps surrounding it.

An allied camp will be darkened by:
$$ \displaystyle \frac{E}{A + E + X} \cdot 70\% $$
<br>


Therefore, a completely surrounded camp is darkened by a full $70\%$.

## Controls & Features

- Draw and erase cells from the grid

- Use mouse wheel to scroll through cell types

- Change color of each cell type using the legend

- Change grid size

- Control combat rate (speed of animation)

- Randomly generate base camp positions  
(the locations of camp cells before the war)

- Randomly generate mountains

Generating mountains clears all other cells.  
Generating base camps clears existing camps, but not mountains or barricades.

Shortcut | Action 
:-----------:|-----------------------------
`Spacebar` 		| Start/pause war 
`G` 			| Toggle gridlines 
`R` 			| Randomize base camp placement
`T` 			| Randomize terrain (mountains)
`E` 			| Erase all cells 
`Shift + E` 	| Erase only camps
`1` 			| Select `Ally` paint
`2` 			| Select `Enemy` paint
`3` 			| Select `Mountain` paint
`4` 			| Select `Barricade` paint
`Esc` 			| Deselect color / slider

![Big Earth](./assets/big-dick.gif)