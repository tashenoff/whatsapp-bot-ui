// Файл: components/Layout.js
import { ThemeProvider } from '../utils/ThemeContext';
import ThemeToggle from './ThemeToggle';

export default function Layout({ children }) {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
        <header className="bg-blue-600 dark:bg-blue-800 text-white p-4 shadow-md">
          <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-2xl font-bold">WhatsApp Bot Manager</h1>
            <ThemeToggle />
          </div>
        </header>
        <main className="transition-colors duration-200">
          {children}
        </main>
        <footer className="bg-gray-800 dark:bg-gray-950 text-white p-4 mt-8">
          <div className="container mx-auto text-center">
            <p>&copy; {new Date().getFullYear()} WhatsApp Bot Manager</p>
          </div>
        </footer>
      </div>
    </ThemeProvider>
  );
}