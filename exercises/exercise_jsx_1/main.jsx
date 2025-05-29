import React, { useState, useEffect } from "react";

// Функциональный компонент с использованием хуков
function SimpleComponent(props) {
  const { title, description } = props;
  const [count, setCount] = useState(0);

  useEffect(() => {
    document.title = `${title} - ${count}`;
  }, [title, count]);

  return (
    <div className="simple-component">
      <h1>{title}</h1>
      <p>{description}</p>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}

// Экспорт компонента
export default SimpleComponent;
