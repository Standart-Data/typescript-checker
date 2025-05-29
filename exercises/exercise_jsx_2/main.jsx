import React from "react";

// Классовый компонент React
class ClassComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      counter: 0,
    };
  }

  componentDidMount() {
    console.log("Component mounted");
  }

  incrementCounter = () => {
    this.setState({ counter: this.state.counter + 1 });
  };

  render() {
    const { title, items } = this.props;
    const { counter } = this.state;

    return (
      <div className="class-component">
        <h2>{title}</h2>
        <p>Counter: {counter}</p>
        <button onClick={this.incrementCounter}>Increment</button>
        <ul>
          {items && items.map((item, index) => <li key={index}>{item}</li>)}
        </ul>
      </div>
    );
  }
}

export default ClassComponent;
