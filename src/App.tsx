import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { ProtectedRoute } from './components/ProtectedRoute';
import { MainLayout } from './layouts/MainLayout';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { QuizTake } from './pages/QuizTake';
import { QuizResultsPage } from './pages/QuizResultsPage';
import { QuizHistoryPage } from './pages/QuizHistoryPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected Routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/history" 
              element={
                <ProtectedRoute>
                  <QuizHistoryPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/quiz/:quizId/take" 
              element={
                <ProtectedRoute>
                  <QuizTake />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/quiz/:quizId/results/:attemptId" 
              element={
                <ProtectedRoute>
                  <QuizResultsPage />
                </ProtectedRoute>
              } 
            />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
