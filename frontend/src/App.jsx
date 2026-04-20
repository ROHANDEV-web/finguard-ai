import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SpendingSummary from './pages/SpendingSummary';

// Wrapper so SpendingSummary can use useNavigate inside Router
function PostLoginFlow() {
  const [showSummary, setShowSummary] = useState(true);
  const navigate = useNavigate();

  if (showSummary) {
    return <SpendingSummary onContinue={() => setShowSummary(false)} />;
  }
  return <Dashboard />;
}

function App() {
  const PrivateRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    return token ? children : <Navigate to="/" />;
  };

  return (
    <Router>
      <div className="min-h-screen bg-[#0f172a] text-slate-100 font-sans">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={
            <PrivateRoute>
              <PostLoginFlow />
            </PrivateRoute>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
