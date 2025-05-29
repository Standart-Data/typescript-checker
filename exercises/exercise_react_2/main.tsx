// Это упражнение на использование хуков в React с TypeScript
// Задача: 
// 1. Создать интерфейс Task с полями:
//    - id: number
//    - title: string
//    - completed: boolean
// 2. Типизировать useState для массива задач (tasks)
// 3. Типизировать функцию добавления задачи
// 4. Использовать useEffect для логирования числа задач при его изменении

import React, { useState, useEffect } from 'react';

// Создайте здесь интерфейс Task


const TaskManager = () => {
  // Используйте правильную типизацию для useState
  const [tasks, setTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // Правильно типизируйте эту функцию
  const addTask = () => {
    if (newTaskTitle.trim() === '') return;
    
    const newTask = {
      id: Date.now(),
      title: newTaskTitle,
      completed: false
    };
    
    setTasks([...tasks, newTask]);
    setNewTaskTitle('');
  };

  // Используйте useEffect для вывода в консоль количества задач при изменении массива tasks
  // Код должен выводить: `Число задач: ${tasks.length}`


  return (
    <div>
      <h1>Список задач</h1>
      <div>
        <input
          type="text"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          placeholder="Название задачи"
        />
        <button onClick={addTask}>Добавить</button>
      </div>
      <ul>
        {tasks.map((task) => (
          <li key={task.id}>
            <span style={{ textDecoration: task.completed ? 'line-through' : 'none' }}>
              {task.title}
            </span>
            <button
              onClick={() => {
                setTasks(
                  tasks.map((t) =>
                    t.id === task.id ? { ...t, completed: !t.completed } : t
                  )
                );
              }}
            >
              {task.completed ? 'Вернуть' : 'Завершить'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TaskManager; 