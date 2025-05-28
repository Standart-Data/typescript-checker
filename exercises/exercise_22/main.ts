class Island {
  protected name: string;
  readonly coordinates: { latitude: number; longitude: number };
  protected size: number;
  protected notes: string;
  protected features?: string[];

  constructor(
    name: string,
    coordinates: { latitude: number; longitude: number },
    size: number,
    notes: string = "Ничем не примечательный",
    features?: string[]
  ) {
    this.name = name;
    this.coordinates = coordinates;
    this.size = size;
    this.features = features;
    this.notes = notes;
  }

  report(): string {
    let report = `Отчет об острове ${this.name}:\n`;
    report += `Координаты: ${this.coordinates.latitude}, ${this.coordinates.longitude}\n`;
    report += `Размер: ${this.size} км²\n`;
    if (this.features && this.features.length > 0) {
      report += `Особенности: ${this.features.join(", ")}\n`;
    } else {
      report += `Особенности: нет данных\n`;
    }
    report += `Заметки: ${this.notes}\n`;
    return report;
  }
}

class ResourceIsland extends Island {
  private resources: string[];

  constructor(
    name: string,
    coordinates: { latitude: number; longitude: number },
    size: number,
    notes: string,
    resources: string[]
  ) {
    super(name, coordinates, size, notes);
    this.resources = resources;
  }

  getResources(): string[] {
    return this.resources;
  }
}
