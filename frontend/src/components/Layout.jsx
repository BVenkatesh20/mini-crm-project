import { useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../context/AuthContext';

const DRAWER_WIDTH = 240;

const NAV_ITEMS = [
  { label: 'Dashboard', to: '/dashboard', icon: <DashboardOutlinedIcon /> },
  { label: 'Leads', to: '/leads', icon: <PeopleAltOutlinedIcon /> },
  { label: 'Companies', to: '/companies', icon: <BusinessOutlinedIcon /> },
  { label: 'Tasks', to: '/tasks', icon: <TaskAltOutlinedIcon /> },
];

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar>
        <Typography variant="h6" color="primary" sx={{ fontWeight: 800 }}>
          Mini CRM
        </Typography>
      </Toolbar>
      <Divider />
      <List component="nav" aria-label="Main navigation" sx={{ flexGrow: 1, px: 1.5, py: 1.5 }}>
        {NAV_ITEMS.map((item) => (
          <ListItemButton
            key={item.to}
            component={NavLink}
            to={item.to}
            selected={location.pathname.startsWith(item.to)}
            onClick={() => setMobileOpen(false)}
            sx={{ borderRadius: 2, mb: 0.5 }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 600 }} />
          </ListItemButton>
        ))}
      </List>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
          {user?.name}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap display="block">
          {user?.email}
        </Typography>
        <Button fullWidth color="inherit" startIcon={<LogoutIcon />} onClick={handleLogout} sx={{ mt: 1.5 }}>
          Log out
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Top bar only on small screens */}
      <AppBar position="fixed" elevation={0} sx={{ display: { md: 'none' } }}>
        <Toolbar>
          <IconButton color="inherit" edge="start" aria-label="Open navigation" onClick={() => setMobileOpen(true)} sx={{ mr: 1 }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap>
            Mini CRM
          </Typography>
        </Toolbar>
      </AppBar>

      <Box component="aside" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' } }}
        >
          {drawerContent}
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={{ display: { xs: 'none', md: 'block' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' } }}
        >
          {drawerContent}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, minWidth: 0, p: { xs: 2, md: 4 } }}>
        <Toolbar sx={{ display: { md: 'none' } }} />
        <Outlet />
      </Box>
    </Box>
  );
}
