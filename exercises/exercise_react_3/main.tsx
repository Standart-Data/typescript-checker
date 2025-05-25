// Это упражнение на использование дженериков и React Context в TypeScript
// Задача: 
// 1. Создать дженерик тип DataState<T> с полями:
//    - data: T
//    - loading: boolean
//    - error: string | null
//
// 2. Создать интерфейс User с полями:
//    - id: number
//    - name: string
//    - email: string
//
// 3. Создать и типизировать контекст UserContext, использующий DataState<User>
//    - Создать дефолтное значение для контекста
//    - Типизировать провайдер и хук useContext
//
// 4. Добавить типизированные методы для работы с контекстом (setUser, setLoading, setError)

import React, { createContext, useContext, useState } from 'react';

// Определите здесь тип DataState<T>


// Определите здесь интерфейс User


// Создайте контекст с типом DataState<User>
// Подсказка: const UserContext = createContext<DataState<User> | null>(null);


// Компонент провайдера
const UserProvider: React.FC = ({ children }) => {
  // Используйте правильную типизацию для useState с DataState<User>
  const [state, setState] = useState({
    data: null,
    loading: false,
    error: null
  });

  // Типизируйте эти функции
  const setUser = (user) => {
    setState({
      data: user,
      loading: false,
      error: null
    });
  };

  const setLoading = (isLoading) => {
    setState({
      ...state,
      loading: isLoading
    });
  };

  const setError = (errorMessage) => {
    setState({
      ...state,
      loading: false,
      error: errorMessage
    });
  };

  // Верните провайдер с контекстом
  return (
    <UserContext.Provider 
      value={{
        ...state,
        setUser,
        setLoading,
        setError
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

// Создайте типизированный хук для использования контекста
// const useUserContext = () => {
//   // Реализуйте хук
// };

export { UserProvider, useUserContext }; 