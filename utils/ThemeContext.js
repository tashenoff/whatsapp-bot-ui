// Файл: utils/ThemeContext.js
import { createContext, useContext, useState, useEffect } from 'react';

// Создаем контекст
const ThemeContext = createContext();

// Настраиваемый хук для использования темы
export const useTheme = () => useContext(ThemeContext);

// Компонент-провайдер темы
export function ThemeProvider({ children }) {
  // Пытаемся получить сохраненную тему из локального хранилища
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  
  // При монтировании компонента проверяем localStorage и системные настройки
  useEffect(() => {
    // Проверяем сохраненное значение в localStorage
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme) {
      // Если в localStorage есть сохраненное значение, используем его
      setIsDarkTheme(savedTheme === 'dark');
    } else {
      // Иначе проверяем системные настройки
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkTheme(prefersDark);
    }
    
    // Добавляем слушатель изменения системной темы
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      // Обновляем тему только если пользователь не выбрал ее явно
      if (!localStorage.getItem('theme')) {
        setIsDarkTheme(e.matches);
      }
    };
    
    // Добавляем слушатель
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // Для старых браузеров
      mediaQuery.addListener(handleChange);
    }
    
    // Очищаем слушатель при размонтировании
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        // Для старых браузеров
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);
  
  // Обновляем класс body и сохраняем выбор в localStorage
  useEffect(() => {
    // Обновляем класс на body
    if (isDarkTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Сохраняем выбор в localStorage
    localStorage.setItem('theme', isDarkTheme ? 'dark' : 'light');
  }, [isDarkTheme]);
  
  // Функция переключения темы
  const toggleTheme = () => {
    setIsDarkTheme(prev => !prev);
  };
  
  const value = {
    isDarkTheme,
    toggleTheme
  };
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}