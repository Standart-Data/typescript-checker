// • Add type annotations (as explicit as possible)
// • Fix errors (if applicable)

// We want to represent an inventoryItem as a structure where
// the first entry is the item name and the second is the quantity

const inventoryItem = ["fidget wibbit", 11];

const [name, qty] = inventoryItem;

const msg = addInventory(name, qty);

function addInventory(name: string, quantity: number): string {
    return `Added ${quantity} ${name}s to inventory.`;
}