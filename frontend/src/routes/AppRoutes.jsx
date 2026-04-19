import Home from "../pages/Home";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import Login from "../pages/Login";
import DashboardLayout from "../layouts/DashboardLayout";
import Dashboard from "../pages/Dashboard";

// Patients
import AddPatient from "../pages/patients/AddPatient";
import CTList from "../pages/patients/CTList";
import UltrasoundList from "../pages/patients/UltrasoundList";

// Referrals
import DoctorReferrals from "../pages/referrals/DoctorReferrals";
import DoctorSettlement from "../pages/referrals/DoctorSettlement";

// Settlement History
import SettlementHistory from "../pages/SettlementHistory";

// Finance
import DailyExpense from "../pages/finance/DailyExpense";
import ExtraIncome from "../pages/finance/ExtraIncome";

// Reports
import DailyReport from "../pages/reports/DailyReport";

// Settings
import UploadSignature from "../pages/settings/UploadSignature";
import SoundSettings from "../pages/settings/SoundSettings";

const AppRoutes = () => {

  const { user } = useAuth();

  return (
    <Routes>
      {/* Landing Page */}
      <Route path="/" element={!user ? <Home /> : <Navigate to="/dashboard" />} />
      {/* Login */}
      <Route
        path="/login"
        element={!user ? <Login /> : <Navigate to="/dashboard" />}
      />

      {/* Protected Routes */}
      {user && (
        <Route path="/dashboard" element={<DashboardLayout />}>

          {/* Dashboard */}
          <Route index element={<Dashboard />} />

          {/* Patients */}
          <Route path="patients/add" element={<AddPatient />} />
          <Route path="patients/ct" element={<CTList />} />
          <Route path="patients/ultrasound" element={<UltrasoundList />} />

          {/* Doctor */}
          <Route path="referrals" element={<DoctorReferrals />} />
          <Route path="doctor-settlement" element={<DoctorSettlement />} />
          <Route path="settlement-history" element={<SettlementHistory />} />

          {/* Finance */}
          <Route path="finance/expenses" element={<DailyExpense />} />
          <Route path="finance/income" element={<ExtraIncome />} />

          {/* Reports */}
          <Route path="reports/daily" element={<DailyReport />} />

          {/* Settings */}
          <Route path="settings/signature" element={<UploadSignature />} />
          <Route path="settings/sounds" element={<SoundSettings />} />

        </Route>
      )}

      {/* Redirect Unknown Routes */}
      <Route
        path="*"
        element={<Navigate to={user ? "/dashboard" : "/login"} />}
      />

    </Routes>
  );
};

export default AppRoutes;