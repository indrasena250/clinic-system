import { useState } from "react";
import { useEffect } from "react";
import DemoStatus from "../components/DemoStatus";
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Button,
  Tooltip,
} from "@mui/material";

import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  MedicalServices as ScanIcon,
  MonitorHeart as UltrasoundIcon,
  ReceiptLong as ExpenseIcon,
  CurrencyRupee as IncomeIcon,
  AccountBalanceWallet as SettlementIcon,
  Payment as PaymentIcon,
  Description as ReportIcon,
  History as HistoryIcon,
  Settings as SettingsIcon,
  Draw as SignatureIcon,
  Logout as LogoutIcon,
} from "@mui/icons-material";

import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const drawerWidth = 260;

const DashboardLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleDrawerToggle = () => {
    setMobileOpen(prev => !prev);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname.startsWith(path);

  const drawerContent = (
    <Box>
      <Toolbar>
        <Typography variant="h6" fontWeight="bold">
          Clinic Admin
        </Typography>
      </Toolbar>

      <Divider />

      <List>

        {/* Dashboard */}
        <ListItemButton
          selected={location.pathname === "/dashboard"}
          onClick={() => navigate("/dashboard")}
        >
          <ListItemIcon>
            <DashboardIcon />
          </ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItemButton>

        <Divider sx={{ my: 1 }} />

        {/* Patients */}
        <ListItemButton
          selected={isActive("/dashboard/patients/add")}
          onClick={() => navigate("/dashboard/patients/add")}
        >
          <ListItemIcon>
            <PeopleIcon />
          </ListItemIcon>
          <ListItemText primary="Add Patient" />
        </ListItemButton>

        <ListItemButton
          selected={isActive("/dashboard/patients/ultrasound")}
          onClick={() => navigate("/dashboard/patients/ultrasound")}
        >
          <ListItemIcon>
            <ScanIcon />
          </ListItemIcon>
          <ListItemText primary="Ultrasound List" />
        </ListItemButton>

        <ListItemButton
          selected={isActive("/dashboard/patients/ct")}
          onClick={() => navigate("/dashboard/patients/ct")}
        >
          <ListItemIcon>
            <ScanIcon />
          </ListItemIcon>
          <ListItemText primary="CT List" />
        </ListItemButton>

        <Divider sx={{ my: 1 }} />

        {/* Referrals */}
        <ListItemButton
          selected={isActive("/dashboard/referrals")}
          onClick={() => navigate("/dashboard/referrals")}
        >
          <ListItemIcon>
            <SettlementIcon />
          </ListItemIcon>
          <ListItemText primary="Doctor Referrals" />
        </ListItemButton>

        <ListItemButton
          selected={isActive("/dashboard/doctor-settlement")}
          onClick={() => navigate("/dashboard/doctor-settlement")}
        >
          <ListItemIcon>
            <PaymentIcon />
          </ListItemIcon>
          <ListItemText primary="Doctor Settlement" />
        </ListItemButton>

        <ListItemButton
          selected={isActive("/dashboard/settlement-history")}
          onClick={() => navigate("/dashboard/settlement-history")}
        >
          <ListItemIcon>
            <ReportIcon />
          </ListItemIcon>
          <ListItemText primary="Settlement History" />
        </ListItemButton>

        <Divider sx={{ my: 1 }} />

        {/* Finance */}
        <ListItemButton
          selected={isActive("/dashboard/finance/expenses")}
          onClick={() => navigate("/dashboard/finance/expenses")}
        >
          <ListItemIcon>
            <ExpenseIcon />
          </ListItemIcon>
          <ListItemText primary="Daily Expenses" />
        </ListItemButton>

        <ListItemButton
          selected={isActive("/dashboard/finance/income")}
          onClick={() => navigate("/dashboard/finance/income")}
        >
          <ListItemIcon>
            <IncomeIcon />
          </ListItemIcon>
          <ListItemText primary="Extra Income" />
        </ListItemButton>

        <Divider sx={{ my: 1 }} />

        {/* Reports */}
        <ListItemButton
          selected={isActive("/dashboard/reports/daily")}
          onClick={() => navigate("/dashboard/reports/daily")}
        >
          <ListItemIcon>
            <ReportIcon />
          </ListItemIcon>
          <ListItemText primary="Daily Report" />
        </ListItemButton>

        <Divider sx={{ my: 1 }} />

        {/* Settings */}
        <ListItemButton
          selected={isActive("/dashboard/settings/signature")}
          onClick={() => navigate("/dashboard/settings/signature")}
        >
          <ListItemIcon>
            <SignatureIcon />
          </ListItemIcon>
          <ListItemText primary="Settings" />
        </ListItemButton>

        <Divider sx={{ my: 1 }} />

        {/* Logout */}
        <ListItemButton onClick={handleLogout} sx={{ color: "error.main" }}>
          <ListItemIcon sx={{ color: "error.main" }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItemButton>

      </List>
    </Box>
  );
  const iconStyle = (active) => ({
  backgroundColor: active ? "rgba(255,255,255,0.15)" : "transparent",
  borderRadius: 2,
  px: 1.5,
  transition: "all 0.2s ease",
  "&:hover": {
    transform: "scale(1.1)",
    backgroundColor: "rgba(255,255,255,0.2)",
  },
});

  return (
    <Box sx={{ display: "flex" }}>
      {/* Top Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: '100%',
        }}
      >
        <Toolbar sx={{ display: "flex", justifyContent: "space-between", paddingX: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: "none" } }}
            >
              <MenuIcon />
            </IconButton>

            <Typography
              variant="h6"
              noWrap
              sx={{ fontSize: { xs: "14px", sm: "18px" } }}
            >
              Diagnostic Center Management System
            </Typography>
          </Box>

          <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 1 }}>

          <Tooltip title="Dashboard">
          <IconButton onClick={() => navigate("/dashboard")} sx={iconStyle(location.pathname === "/dashboard") }>
            <DashboardIcon />
          </IconButton>
          </Tooltip>

          <Tooltip title="Add Patient">
          <IconButton onClick={() => navigate("/dashboard/patients/add")} sx={iconStyle(isActive("/dashboard/patients/add"))}>
            <PeopleIcon />
          </IconButton>
          </Tooltip>

          <Tooltip title="Ultrasound">
          <IconButton onClick={() => navigate("/dashboard/patients/ultrasound")} sx={iconStyle(isActive("/dashboard/patients/ultrasound"))}>
            <UltrasoundIcon />
          </IconButton>
          </Tooltip>

          <Tooltip title="CT">
          <IconButton onClick={() => navigate("/dashboard/patients/ct")} sx={iconStyle(isActive("/dashboard/patients/ct"))}>
            <ScanIcon />
          </IconButton>
          </Tooltip>

          <Tooltip title="Doctor Referrals">
          <IconButton onClick={() => navigate("/dashboard/referrals")} sx={iconStyle(isActive("/dashboard/referrals"))}>
            <SettlementIcon />
          </IconButton>
          </Tooltip>

          <Tooltip title="Doctor Settlement">
          <IconButton onClick={() => navigate("/dashboard/doctor-settlement")} sx={iconStyle(isActive("/dashboard/doctor-settlement"))}>
            <PaymentIcon />
          </IconButton>
          </Tooltip>

          <Tooltip title="Expenses">
          <IconButton onClick={() => navigate("/dashboard/finance/expenses")} sx={iconStyle(isActive("/dashboard/finance/expenses"))}>
            <ExpenseIcon />
          </IconButton>
          </Tooltip>

          <Tooltip title="Extra Income">
          <IconButton onClick={() => navigate("/dashboard/finance/income")} sx={iconStyle(isActive("/dashboard/finance/income"))}>
            <IncomeIcon />
          </IconButton>
          </Tooltip>

          <Tooltip title="Reports">
          <IconButton onClick={() => navigate("/dashboard/reports/daily")} sx={iconStyle(isActive("/dashboard/reports/daily"))}>
            <ReportIcon />
          </IconButton>
          </Tooltip>

          <Tooltip title="Settlement History">
          <IconButton onClick={() => navigate("/dashboard/settlement-history")} sx={iconStyle(isActive("/dashboard/settlement-history"))}>
            <HistoryIcon />
          </IconButton>
          </Tooltip>

          <Tooltip title="Settings">
          <IconButton onClick={() => navigate("/dashboard/settings/signature")} sx={iconStyle(isActive("/dashboard/settings"))}>
            <SettingsIcon />
          </IconButton>
          </Tooltip>

          <Tooltip title="Logout">
          <IconButton onClick={handleLogout} sx={iconStyle(false)}>
            <LogoutIcon />
          </IconButton>
          </Tooltip>

          </Box>
        </Toolbar>
      </AppBar>

        {/* Drawer - Mobile Only */}
        <Box component="nav">
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{ keepMounted: true }}
            sx={{
              display: { xs: "block", sm: "none" },
              "& .MuiDrawer-paper": {
                width: drawerWidth,
                boxSizing: "border-box",
              },
            }}
          >
            {/* ✅ Auto close on click */}
            <Box
          onClick={handleDrawerToggle}
          sx={{ height: "100%" }}
        >
              {drawerContent}
            </Box>
          </Drawer>
        </Box>

        {/* Page Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 2, sm: 3 },   // ✅ responsive padding
            width: "100%",
            mt: { xs: 7, sm: 8 },  // ✅ responsive top spacing
            transition: "all 0.2s ease",
          }}
        >
          <DemoStatus />
          <Outlet />
        </Box> 
            </Box>  );
        };

export default DashboardLayout;