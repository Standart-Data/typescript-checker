// Create a type alias for a set of string literal types.
// Define a type alias named `Direction` that includes the four main cardinal directions: `"North"`, `"South"`, `"East"`, and `"West"`.
// Use this `Direction` type alias in a function called `move` that logs a message indicating the direction provided.


type Direction = Any

function move(direction) {
  console.log(`Moving towards ${direction}`);
}

move('North'); // Should log: Moving towards North
move('West');  // Should log: Moving towards West