import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage"; // lo generaremos después
import ResetPassword from "./pages/ResetPassword";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<LoginPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/home" element={<HomePage />} />
                <Route path="/reset" element={<ResetPassword />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;