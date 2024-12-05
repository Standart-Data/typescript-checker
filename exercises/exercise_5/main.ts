// • Add type annotations (as explicit as possible)
// • Fix errors (if applicable)

// We want to represent an inventoryItem as a structure where
// the first entry is the item name and the second is the quantity

const inventoryItem: [string, number] = ["fidget wibbit", 11];

const [name, qty]: [string, number] = inventoryItem;

const msg: string = addInventory(name, qty);

function addInventory(name: any, quantity: any): string {
  return `Added ${quantity} ${name}s to inventory.`;
}
