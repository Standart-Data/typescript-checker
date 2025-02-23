import React, { useState, useEffect } from "react";

function NavigationMenu({ items, activeLink }) {
  const [used, setUsed] = useState(false);

  useEffect(() => {
    console.log("Я родился");
  }, []);

  const handleClick = (e) => {
    e.preventDefault();
    setUsed(!used);
  };

  return (
    <nav>
      ({used ? "Меню использовано" : "Меню не использовано"})
      <ul>
        {items.map((item) => (
          <li key={item.link}>
            <a
              href={item.link}
              className={item.link === activeLink ? "active" : ""}
              onClick={handleClick}
            >
              {item.Название}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default NavigationMenu;

function App() {
  const menuItems = [
    { Название: "Главная", link: "/" },
    { Название: "О нас", link: "/about" },
    { Название: "Услуги", link: "/services" },
    { Название: "Контакты", link: "/contact" },
  ];

  return (
    <div>
      <h1>Мое приложение</h1>
      <NavigationMenu items={menuItems} activeLink="/" />
    </div>
  );
}

export { App };
