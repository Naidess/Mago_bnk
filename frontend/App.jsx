import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import HomePage from "./pages/HomePage";
import ResetPassword from "./pages/ResetPassword";
import SolicitarProductos from "./pages/SolicitarProductos";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<LoginPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/home" element={<HomePage />} />
                <Route path="/reset" element={<ResetPassword />} />
                <Route path="/solicitar-productos" element={<SolicitarProductos />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;