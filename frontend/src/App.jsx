import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Companies from './pages/Companies';
import CompanyDetails from './pages/CompanyDetails';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import Tasks from './pages/Tasks';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/companies" element={<Companies />} />
          <Route path="/companies/:id" element={<CompanyDetails />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
  );
}
