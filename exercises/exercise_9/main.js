// Create a type alias `Address` with properties `street`, `city`, and `zipcode`.

// Create another type alias `Person` that includes an `address` of type `Address`.

// Write a function `showPersonDetails` that takes a `Person` and logs their address details.


type Address = {
};

type Person = {
};

function showPersonDetails(person: Person): void {
  console.log(`${person.name} lives at ${person.address.street}, ${person.address.city}, ${person.address.zipcode}`);
}