import { useState } from "react";
import { useEffect } from "react";
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
          selected={location.pathname === "/"}
          onClick={() => navigate("/")}
        >
          <ListItemIcon>
            <DashboardIcon />
          </ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItemButton>

        <Divider sx={{ my: 1 }} />

        {/* Patients */}
        <ListItemButton
          selected={isActive("/patients/add")}
          onClick={() => navigate("/patients/add")}
        >
          <ListItemIcon>
            <PeopleIcon />
          </ListItemIcon>
          <ListItemText primary="Add Patient" />
        </ListItemButton>

        <ListItemButton
          selected={isActive("/patients/ultrasound")}
          onClick={() => navigate("/patients/ultrasound")}
        >
          <ListItemIcon>
            <ScanIcon />
          </ListItemIcon>
          <ListItemText primary="Ultrasound List" />
        </ListItemButton>

        <ListItemButton
          selected={isActive("/patients/ct")}
          onClick={() => navigate("/patients/ct")}
        >
          <ListItemIcon>
            <ScanIcon />
          </ListItemIcon>
          <ListItemText primary="CT List" />
        </ListItemButton>

        <Divider sx={{ my: 1 }} />

        {/* Referrals */}
        <ListItemButton
          selected={isActive("/referrals")}
          onClick={() => navigate("/referrals")}
        >
          <ListItemIcon>
            <SettlementIcon />
          </ListItemIcon>
          <ListItemText primary="Doctor Referrals" />
        </ListItemButton>

        <ListItemButton
          selected={isActive("/doctor-settlement")}
          onClick={() => navigate("/doctor-settlement")}
        >
          <ListItemIcon>
            <PaymentIcon />
          </ListItemIcon>
          <ListItemText primary="Doctor Settlement" />
        </ListItemButton>

        <ListItemButton
          selected={isActive("/settlement-history")}
          onClick={() => navigate("/settlement-history")}
        >
          <ListItemIcon>
            <ReportIcon />
          </ListItemIcon>
          <ListItemText primary="Settlement History" />
        </ListItemButton>

        <Divider sx={{ my: 1 }} />

        {/* Finance */}
        <ListItemButton
          selected={isActive("/finance/expenses")}
          onClick={() => navigate("/finance/expenses")}
        >
          <ListItemIcon>
            <ExpenseIcon />
          </ListItemIcon>
          <ListItemText primary="Daily Expenses" />
        </ListItemButton>

        <ListItemButton
          selected={isActive("/finance/income")}
          onClick={() => navigate("/finance/income")}
        >
          <ListItemIcon>
            <IncomeIcon />
          </ListItemIcon>
          <ListItemText primary="Extra Income" />
        </ListItemButton>

        <Divider sx={{ my: 1 }} />

        {/* Reports */}
        <ListItemButton
          selected={isActive("/reports/daily")}
          onClick={() => navigate("/reports/daily")}
        >
          <ListItemIcon>
            <ReportIcon />
          </ListItemIcon>
          <ListItemText primary="Daily Report" />
        </ListItemButton>

        <Divider sx={{ my: 1 }} />

        {/* Settings */}
        <ListItemButton
          selected={isActive("/settings/signature")}
          onClick={() => navigate("/settings/signature")}
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
          <IconButton onClick={() => navigate("/")} sx={iconStyle(location.pathname === "/")}>
            <DashboardIcon />
          </IconButton>
          </Tooltip>

          <Tooltip title="Add Patient">
          <IconButton onClick={() => navigate("/patients/add")} sx={iconStyle(isActive("/patients/add"))}>
            <PeopleIcon />
          </IconButton>
          </Tooltip>

          <Tooltip title="Ultrasound">
          <IconButton onClick={() => navigate("/patients/ultrasound")} sx={iconStyle(isActive("/patients/ultrasound"))}>
            <UltrasoundIcon />
          </IconButton>
          </Tooltip>

          <Tooltip title="CT">
          <IconButton onClick={() => navigate("/patients/ct")} sx={iconStyle(isActive("/patients/ct"))}>
            <ScanIcon />
          </IconButton>
          </Tooltip>

          <Tooltip title="Doctor Referrals">
          <IconButton onClick={() => navigate("/referrals")} sx={iconStyle(isActive("/referrals"))}>
            <SettlementIcon />
          </IconButton>
          </Tooltip>

          <Tooltip title="Doctor Settlement">
          <IconButton onClick={() => navigate("/doctor-settlement")} sx={iconStyle(isActive("/doctor-settlement"))}>
            <PaymentIcon />
          </IconButton>
          </Tooltip>

          <Tooltip title="Expenses">
          <IconButton onClick={() => navigate("/finance/expenses")} sx={iconStyle(isActive("/finance/expenses"))}>
            <ExpenseIcon />
          </IconButton>
          </Tooltip>

          <Tooltip title="Extra Income">
          <IconButton onClick={() => navigate("/finance/income")} sx={iconStyle(isActive("/finance/income"))}>
            <IncomeIcon />
          </IconButton>
          </Tooltip>

          <Tooltip title="Reports">
          <IconButton onClick={() => navigate("/reports/daily")} sx={iconStyle(isActive("/reports/daily"))}>
            <ReportIcon />
          </IconButton>
          </Tooltip>

          <Tooltip title="Settlement History">
          <IconButton onClick={() => navigate("/settlement-history")} sx={iconStyle(isActive("/settlement-history"))}>
            <HistoryIcon />
          </IconButton>
          </Tooltip>

          <Tooltip title="Settings">
          <IconButton onClick={() => navigate("/settings/signature")} sx={iconStyle(isActive("/settings"))}>
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
          <Outlet />
        </Box> 
            </Box>  );
        };

export default DashboardLayout;