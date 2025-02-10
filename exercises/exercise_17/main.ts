interface Person {
  name: string;
  phoneNumber: string;
}

interface Car {
  brand: string;
  model: string;
  plateNumber: string;
  bodyType: "sedan" | "coupe" | "suv";
}

interface Client extends Person, Car {
  appointmentTime: string;
}