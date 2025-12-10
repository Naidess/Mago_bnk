import { useState } from "react";
import axiosInstance from "../src/api/axiosInstance";
import MagoLogo from "./MagoLogo";

export default function Register() {
    const [nombre, setNombre] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg("");
        setSuccessMsg("");

        // Validaciones del cliente
        if (!nombre.trim()) {
            setErrorMsg("El nombre es requerido");
            return;
        }

        if (password.length < 8) {
            setErrorMsg("La contraseña debe tener al menos 8 caracteres");
            return;
        }

        if (password !== confirmPassword) {
            setErrorMsg("Las contraseñas no coinciden");
            return;
        }

        setLoading(true);

        try {
            const res = await axiosInstance.post("/auth/register", {
                nombre: nombre.trim(),
                email: email.toLowerCase().trim(),
                password
            });

            setSuccessMsg(res.data?.message || "Registro exitoso. Redirigiendo al login...");
            
            // Redirigir al login después de 2 segundos
            setTimeout(() => {
                window.location.href = "/login";
            }, 2000);

        } catch (error) {
            let msg = "Error al registrar usuario. Intente de nuevo.";
            const resp = error.response;
            
            if (resp) {
                if (resp.status === 400) {
                    // Email duplicado o errores de validación
                    msg = resp.data?.error || "Email ya registrado";
                    
                    // Si hay errores de validación
                    if (resp.data?.errors && Array.isArray(resp.data.errors)) {
                        msg = resp.data.errors.map(e => e.msg).join(", ");
                    }
                } else {
                    msg = resp.data?.error || resp.data?.message || msg;
                }
            }
            
            setErrorMsg(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center app-gradient-bg p-6">
            <div className="w-full max-w-md card p-8">
                
                {/* Header */}
                <div className="text-center mb-6">
                    <div className="flex justify-center mb-4">
                        <MagoLogo size={100} variant="dark" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">Crear Cuenta</h1>
                    <p className="muted mt-1">Registrate en Mago Bank</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Nombre completo
                        </label>
                        <input
                            type="text"
                            required
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                            placeholder="Juan Pérez"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Correo electrónico
                        </label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                            placeholder="tu@email.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Contraseña
                        </label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                            placeholder="Mínimo 8 caracteres"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Confirmar contraseña
                        </label>
                        <input
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                            placeholder="Repite tu contraseña"
                        />
                    </div>

                    {errorMsg && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                            {errorMsg}
                        </div>
                    )}

                    {successMsg && (
                        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                            {successMsg}
                        </div>
                    )}

                    <div className="mt-6">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-primary"
                        >
                            {loading ? "Registrando..." : "Crear Cuenta"}
                        </button>
                    </div>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                        ¿Ya tienes cuenta?{" "}
                        <a
                            href="/login"
                            className="text-teal-600 hover:text-teal-700 font-semibold"
                        >
                            Inicia sesión
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
