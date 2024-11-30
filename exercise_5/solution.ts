const inventoryItem: [string, number] = ["fidget wibbit", 11];

const [name, qty]: [string, number] = inventoryItem;

const msg: string = addInventory(name, qty);

function addInventory(name: string, quantity: number): string {
    return `Added ${quantity} ${name}s to inventory.`;
}