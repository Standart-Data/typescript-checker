
type Direction = 'North' | 'South' | 'East' | 'West';

function move(direction: Direction): void {
  console.log(`Moving towards ${direction}`);
}

move('North'); // Should log: Moving towards North
move('West');  // Should log: Moving towards West