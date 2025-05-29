import React, { useState } from "react";

// Компонент, определенный через стрелочную функцию
const ArrowComponent = ({ name, age }) => {
  const [expanded, setExpanded] = useState(false);

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  return (
    <div className="arrow-component">
      <h3>User Details</h3>
      <p>Name: {name}</p>

      <button onClick={toggleExpanded}>
        {expanded ? "Hide Details" : "Show Details"}
      </button>

      {expanded && (
        <div className="expanded-content">
          <p>Age: {age}</p>
          <p>Status: {age >= 18 ? "Adult" : "Minor"}</p>
        </div>
      )}
    </div>
  );
};

export default ArrowComponent;
