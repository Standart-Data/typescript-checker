import React, { FunctionComponent } from "react";
import { Transform } from "class-transformer";

// 1. Определите интерфейс UserProfileProps
// Он должен содержать:
// - name: string
// - age: number
// - email: string (опциональное поле)
interface UserProfileProps {
  name: string;
  age: number;
  email?: string;
}

// 2. Создайте компонент UserProfile
// Он должен быть функциональным компонентом, использующим UserProfileProps.
// Компонент должен отображать имя, возраст и email пользователя (если он есть).
const UserProfile: FunctionComponent<UserProfileProps> = ({
  name,
  age,
  email,
}) => {
  return (
    <div
      style={{ border: "1px solid #ccc", padding: "10px", borderRadius: "5px" }}
    >
      <h2>Профиль пользователя</h2>
      <p>
        <strong>Имя:</strong> {name}
      </p>
      <p>
        <strong>Возраст:</strong> {age}
      </p>
      {email && (
        <p>
          <strong>Email:</strong> {email}
        </p>
      )}
    </div>
  );
};

// 3. Экспортируйте компонент UserProfile по умолчанию
export default UserProfile;

// Пример использования (не обязательно для задания, но полезно для проверки):
// const App = () => {
//   return (
//     <div>
//       <UserProfile name="Alice" age={30} email="alice@example.com" />
//       <UserProfile name="Bob" age={24} />
//     </div>
//   );
// };
