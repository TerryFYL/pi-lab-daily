import { Routes, Route } from "react-router-dom";
import StudentReport from "./pages/StudentReport";
import PIDashboard from "./pages/PIDashboard";

function App() {
  return (
    <Routes>
      <Route path="/" element={<StudentReport />} />
      <Route path="/dashboard" element={<PIDashboard />} />
    </Routes>
  );
}

export default App;
