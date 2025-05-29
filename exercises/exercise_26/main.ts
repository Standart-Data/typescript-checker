type CarBodyType = "седан" | "кроссовер" | "микроавтобус";

interface Person {
  name: string;
  phoneNumber: string;
}

interface Car {
  model: string;
  bodyType: CarBodyType;
  plateNumber: string;
}
