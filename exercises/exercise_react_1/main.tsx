import type { FunctionComponent } from "react";

// Создайте здесь интерфейс GreetingProps

interface GreetingProps {
  name: string;
  age: number;
  isActive?: boolean;
}

// Используйте интерфейс для типизации компонента
const Greeting: FunctionComponent<GreetingProps> = (props) => {
  return (
    <div>
      <h1>Привет, {props.name}!</h1>
      <p>Тебе {props.age} лет</p>
      {props.isActive && <p>Пользователь активен</p>}
    </div>
  );
};

export default Greeting;
