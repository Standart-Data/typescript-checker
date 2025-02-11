class Computer {
  private id: number;
  protected name: string;
  public model: string;
  public version: string;
  public color: string = 'blue';

  constructor(name: string, model: string, version: string, color: string)
  constructor(name: string, model: string, version: string, id: number)
  constructor(name: string, model: string, version: string, someThing: string | number) {
    this.name = name;
    this.version = version
    this.model = model
    if (typeof someThing === 'number') {
      this.id = someThing
    } else {
      this.color = someThing
    }
  }
}

const comp = new Computer('HP', 'Gaming RC 15', 'X', 4)
const comp1 = new Computer('Dell', 'Mell', '123123', 'red')
