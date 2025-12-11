// pages/SettingsPage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../src/api/axiosInstance";
import { motion } from "framer-motion";
import { FaCog, FaKey, FaUser, FaArrowLeft, FaEnvelope, FaCheck, FaExclamationTriangle } from "react-icons/fa";
import MagoLogo from "../components/MagoLogo";
import ChatWithMagdy from "../components/ChatWithMagdy";

export default function SettingsPage() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Estados para cambio de contraseña
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            const res = await axiosInstance.get("/user/dashboard");
            setUser(res.data.user);
        } catch (error) {
            console.error("Error al cargar datos:", error);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        
        // Validaciones
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setMessage({ type: 'error', text: 'Las contraseñas nuevas no coinciden' });
            return;
        }

        if (passwordData.newPassword.length < 6) {
            setMessage({ type: 'error', text: 'La nueva contraseña debe tener al menos 6 caracteres' });
            return;
        }

        if (passwordData.currentPassword === passwordData.newPassword) {
            setMessage({ type: 'error', text: 'La nueva contraseña debe ser diferente a la actual' });
            return;
        }

        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const res = await axiosInstance.post("/auth/change-password", {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });

            setMessage({ type: 'success', text: res.data.message || 'Contraseña actualizada correctamente. Redirigiendo...' });
            
            // Esperar 2 segundos para que el usuario vea el mensaje
            setTimeout(() => {
                // Limpiar tokens y redirigir al login
                localStorage.removeItem("access_token");
                localStorage.removeItem("refresh_token");
                window.location.href = "/login";
            }, 2000);
        } catch (error) {
            setMessage({ 
                type: 'error', 
                text: error.response?.data?.error || 'Error al cambiar la contraseña' 
            });
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <button
                        onClick={() => navigate("/home")}
                        className="flex items-center gap-2 text-white/80 hover:text-white transition"
                    >
                        <FaArrowLeft />
                        <span>Volver al Dashboard</span>
                    </button>

                    <button
                        onClick={() => navigate("/home")}
                        className="flex items-center gap-2 hover:opacity-80 transition"
                    >
                        <MagoLogo size={40} variant="light" />
                        <span className="text-xl font-bold">Mago Bank</span>
                    </button>
                </div>

                {/* Título */}
                <div className="flex items-center gap-4 mb-8">
                    <FaCog className="text-5xl text-blue-400" />
                    <div>
                        <h1 className="text-4xl font-bold">Configuración</h1>
                        <p className="text-gray-300">Administra tu cuenta y preferencias</p>
                    </div>
                </div>

                {/* Información del Usuario */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-6 border border-white/20"
                >
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                        <FaUser className="text-blue-400" />
                        Información de la Cuenta
                    </h2>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <FaUser className="text-gray-400" />
                            <div>
                                <p className="text-sm text-gray-400">Nombre de Usuario</p>
                                <p className="text-lg font-semibold">{user?.username}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <FaEnvelope className="text-gray-400" />
                            <div>
                                <p className="text-sm text-gray-400">Email</p>
                                <p className="text-lg font-semibold">{user?.email}</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Cambiar Contraseña */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20"
                >
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                        <FaKey className="text-yellow-400" />
                        Cambiar Contraseña
                    </h2>

                    {/* Mensaje de feedback */}
                    {message.text && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={`mb-4 p-4 rounded-lg flex items-center gap-3 ${
                                message.type === 'success' 
                                    ? 'bg-green-500/20 border border-green-400 text-green-100' 
                                    : 'bg-red-500/20 border border-red-400 text-red-100'
                            }`}
                        >
                            {message.type === 'success' ? (
                                <FaCheck className="text-green-400" />
                            ) : (
                                <FaExclamationTriangle className="text-red-400" />
                            )}
                            <span>{message.text}</span>
                        </motion.div>
                    )}

                    <form onSubmit={handlePasswordChange} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Contraseña Actual
                            </label>
                            <input
                                type="password"
                                value={passwordData.currentPassword}
                                onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-blue-400 transition"
                                placeholder="Ingresa tu contraseña actual"
                                required
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Nueva Contraseña
                            </label>
                            <input
                                type="password"
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-blue-400 transition"
                                placeholder="Mínimo 6 caracteres"
                                required
                                disabled={loading}
                                minLength={6}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Confirmar Nueva Contraseña
                            </label>
                            <input
                                type="password"
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-blue-400 transition"
                                placeholder="Repite la nueva contraseña"
                                required
                                disabled={loading}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-3 rounded-lg font-bold transition ${
                                loading
                                    ? 'bg-gray-500 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                            }`}
                        >
                            {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
                        </button>
                    </form>
                </motion.div>

                {/* Información adicional */}
                <div className="mt-6 p-4 bg-blue-500/20 border border-blue-400/30 rounded-lg">
                    <h3 className="font-bold mb-2 flex items-center gap-2">
                        <FaExclamationTriangle className="text-yellow-400" />
                        Consejos de Seguridad
                    </h3>
                    <ul className="text-sm text-gray-300 space-y-1 ml-6">
                        <li>• Usa una contraseña única que no uses en otros sitios</li>
                        <li>• Combina letras mayúsculas, minúsculas, números y símbolos</li>
                        <li>• No compartas tu contraseña con nadie</li>
                        <li>• Cambia tu contraseña periódicamente</li>
                    </ul>
                </div>
            </div>
            <ChatWithMagdy />
        </div>
    );
}
