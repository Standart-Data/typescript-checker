// Define a type alias `User` that includes properties `id`, `name`, and `email`.
// Implement a function `printUserInfo` that takes a `User` object and logs the user's details.


type User = {}

function printUserInfo(user) {
    console.log(`User ID: ${user.id}, Name: ${user.name}, Email: ${user.email}`);
}

printUserInfo({ id: 1, name: 'Alice', email: 'alice@example.com' });
