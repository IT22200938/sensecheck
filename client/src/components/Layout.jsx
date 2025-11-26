import { useNavigate } from 'react-router-dom';

const Layout = ({ children, title, subtitle, showHome = true }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-gray-900/80 backdrop-blur-md border-b border-cyber-blue-500/30">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-cyber">
                Sensecheck Facility
              </h1>
              {subtitle && (
                <p className="text-gray-400 mt-1 text-sm">{subtitle}</p>
              )}
            </div>
            {showHome && (
              <button
                onClick={() => navigate('/')}
                className="btn-secondary"
              >
                🏠 Home
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        {title && (
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold mb-4 text-white">{title}</h2>
            <div className="w-24 h-1 bg-gradient-cyber mx-auto"></div>
          </div>
        )}
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900/80 backdrop-blur-md border-t border-cyber-purple-500/30 py-4">
        <div className="container mx-auto px-4 text-center text-gray-400 text-sm">
          <p>Sensecheck Facility © 2024 | Digital Navigator Assessment</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;

