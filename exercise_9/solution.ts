
type Address = {
  street: string;
  city: string;
  zipcode: string;
};

type Person = {
  name: string;
  address: Address;
};

function showPersonDetails(person: Person): void {
  console.log(`${person.name} lives at ${person.address.street}, ${person.address.city}, ${person.address.zipcode}`);
}