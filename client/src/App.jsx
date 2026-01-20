import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useContext, useState } from "react"; 
import AuthContext, { AuthProvider } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import Scanner from "./components/Scanner";
import Gallery from "./components/Gallery";

// Protected Route
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div>Loading...</div>;
  return user ? children : <Navigate to="/login" />;
};

// Dashboard Component
const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [refreshGallery, setRefreshGallery] = useState(false); 

  const handleScanComplete = () => {
    setRefreshGallery(prev => !prev);
  };

  return (
    <div className="min-h-screen bg-dark-900 text-gray-100 font-sans">
      {/* Navbar */}
      <nav className="border-b border-gray-800 bg-dark-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
               <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
                 <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
               </div>
               <span className="font-bold text-xl tracking-tight">CamScan<span className="text-brand-400">Clone</span></span>
            </div>
            
            <div className="flex items-center gap-6">
              <span className="text-gray-400 text-sm hidden sm:block">Welcome, <span className="text-white font-medium">{user?.name}</span></span>
              <button 
                onClick={logout} 
                className="px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded-md transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="py-10 px-4">
        {/* 1. The Scanner Section */}
        <section className="mb-12">
          <Scanner onScanComplete={handleScanComplete} />
        </section>

        {/* 2. The Gallery Section */}
        <section>
          <Gallery refreshTrigger={refreshGallery} />
        </section>
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;