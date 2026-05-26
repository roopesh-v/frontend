import { BrowserRouter, Routes, Route } from "react-router-dom";

import Employees from "../pages/Employees";
import Dashboard from "../pages/Dashboard";
import Navbar from "../components/Navbar/Navbar";

function AppRoutes() {
  return (
    <BrowserRouter>
      <div className="appShell">
        <Navbar />
        <main className="appMain">
          <Routes>
            <Route path="/" element={<Employees />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default AppRoutes;