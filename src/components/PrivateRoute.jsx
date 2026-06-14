import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PrivateRoute({ children }) {
  const { token, user } = useAuth();

  if (!token || !user) {
    return <Navigate to="/login" />;
  }

  // Check if user is Super Admin (role = 1)
  if (user.role !== 1) {
    return <Navigate to="/login" />;
  }

  return children;
}