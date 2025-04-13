// Файл: components/Layout.js
export default function Layout({ children }) {
    return (
      <div className="min-h-screen bg-gray-100">
        <header className="bg-blue-600 text-white p-4">
          <div className="container mx-auto">
            <h1 className="text-2xl font-bold">WhatsApp Bot Manager</h1>
          </div>
        </header>
        <main>
          {children}
        </main>
        <footer className="bg-gray-800 text-white p-4 mt-8">
          <div className="container mx-auto text-center">
            <p>&copy; {new Date().getFullYear()} WhatsApp Bot Manager</p>
          </div>
        </footer>
      </div>
    );
  }