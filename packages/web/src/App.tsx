import { Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import StudentReport from "./pages/StudentReport";
import PIDashboard from "./pages/PIDashboard";
import AdminLeads from "./pages/AdminLeads";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/report" element={<StudentReport />} />
      <Route path="/dashboard" element={<PIDashboard />} />
      <Route path="/admin" element={<AdminLeads />} />
    </Routes>
  );
}

export default App;
