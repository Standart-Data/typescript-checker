class Window {
  private id: string;
  protected name: string;
  readonly access: boolean = true;
  length: any;

  constructor(id: string, name: string, length: any) {
    this.id = id;
    this.name = name;
    this.length = length;
  }
}

class Icon {
  #id: number;
  _name = 'window';
  title: string;

  constructor(id: number, title: any) {
    this.#id = id;
    this.title = title;
  }
}