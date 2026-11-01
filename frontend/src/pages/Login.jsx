import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Alert, Box, Button, Card, CardContent, TextField, Typography } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils/errors';
import { EMAIL_REGEX } from '../utils/validation';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Already signed in? Skip the login screen.
  if (user) return <Navigate to="/dashboard" replace />;

  const redirectTo = location.state?.from?.pathname || '/dashboard';

  const handleChange = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    if (apiError) setApiError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validation = {};
    if (!form.email.trim()) validation.email = 'Email is required';
    else if (!EMAIL_REGEX.test(form.email.trim())) validation.email = 'Enter a valid email address';
    if (!form.password) validation.password = 'Password is required';
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setSubmitting(true);
    setApiError('');
    try {
      await login(form.email.trim(), form.password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setApiError(getErrorMessage(err, 'Login failed. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 2 }}>
      <Card sx={{ width: '100%', maxWidth: 400 }}>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Typography variant="h5" component="h1" color="primary" sx={{ fontWeight: 800 }}>
            Mini CRM
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Sign in to continue
          </Typography>

          {apiError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {apiError}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: 'grid', gap: 2 }}>
            <TextField
              label="Email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={handleChange('email')}
              error={Boolean(errors.email)}
              helperText={errors.email}
              autoFocus
              required
            />
            <TextField
              label="Password"
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={handleChange('password')}
              error={Boolean(errors.password)}
              helperText={errors.password}
              required
            />
            <Button type="submit" variant="contained" size="large" disabled={submitting}>
              {submitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
