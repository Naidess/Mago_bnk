import { useState } from "react";
import axiosInstance from "../src/api/axiosInstance";
import MagoLogo from "./MagoLogo";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [showForgot, setShowForgot] = useState(false);
    const [forgotEmail, setForgotEmail] = useState("");
    const [forgotLoading, setForgotLoading] = useState(false);
    const [forgotMsg, setForgotMsg] = useState("");
    const [forgotLink, setForgotLink] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg("");
        setLoading(true);

        try {
            const res = await axiosInstance.post(
                "/auth/login",
                { email, password }
            );

            // Guardamos access token (refresh token se envía en cookie HttpOnly)
            if (res.data?.accessToken) {
                localStorage.setItem("access_token", res.data.accessToken);
            }

            // Redirigir al home
            window.location.href = "/home";
        } catch (error) {
            // Default message
            let msg = "Credenciales inválidas. Intente de nuevo.";
            const resp = error.response;
            if (resp) {
                // If account is locked, backend returns 423 with a message like:
                // { error: "Cuenta bloqueada hasta 2025-12-07T12:34:56.000Z" }
                if (resp.status === 423) {
                    const serverMsg = resp.data?.error || resp.data?.message || "Cuenta bloqueada";
                    // Try to extract a timestamp from the server message
                    const re = /Cuenta bloqueada hasta\s*(.+)/i;
                    const m = serverMsg.match(re);
                    if (m && m[1]) {
                        const untilStr = m[1].trim();
                        const until = new Date(untilStr);
                        if (!isNaN(until)) {
                            const minutesLeft = Math.ceil((until - new Date()) / 60000);
                            msg = `Cuenta bloqueada hasta ${until.toLocaleString()}` + (minutesLeft > 0 ? ` (aprox. ${minutesLeft} minutos)` : "");
                        } else {
                            msg = serverMsg;
                        }
                    } else {
                        msg = serverMsg;
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

    const handleForgotSubmit = async (e) => {
        e.preventDefault();
        setForgotMsg("");
        setForgotLink(null);
        setForgotLoading(true);
        try {
            const res = await axiosInstance.post("/auth/forgot-password", { email: forgotEmail });
            setForgotMsg(res.data?.message || "Si el email existe, recibirás instrucciones.");
            if (res.data?.resetUrl) setForgotLink(res.data.resetUrl);
        } catch (err) {
            setForgotMsg(err.response?.data?.error || "Error al solicitar recuperación");
        } finally {
            setForgotLoading(false);
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
                <h1 className="text-3xl font-bold text-gray-900">Mago Bank</h1>
                <p className="muted mt-1">Accedé a tu banca digital</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Correo electrónico
                    </label>
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 border rounded-lg focus:outline-none"
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
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none"
                    placeholder="••••••••"
                />
            </div>

            {errorMsg && (
                <p className="text-red-600 text-sm text-center">{errorMsg}</p>
            )}

            <div className="mt-2">
              <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary"
              >
                  {loading ? "Ingresando..." : "Ingresar"}
              </button>
            </div>
            </form>

            <div className="mt-6 text-center">
                <button
                    type="button"
                    onClick={() => { setShowForgot(true); setForgotMsg(""); setForgotLink(null); }}
                    className="text-sm text-indigo-600 hover:text-indigo-800 cursor-pointer"
                >
                    ¿Olvidaste tu contraseña?
                </button>
            </div>
            {showForgot && (
                <div className="fixed inset-0 flex items-center justify-center z-50">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setShowForgot(false)} />
                    <div className="bg-white rounded-lg p-6 z-10 w-full max-w-sm">
                        <h3 className="text-lg font-semibold mb-2">Recuperar contraseña</h3>
                        <p className="text-sm muted mb-4">Ingresá tu correo y recibirás instrucciones para restaurar tu contraseña.</p>
                        <form onSubmit={handleForgotSubmit} className="space-y-3">
                            <input type="email" required value={forgotEmail} onChange={(e)=>setForgotEmail(e.target.value)} placeholder="tu@email.com" className="w-full px-3 py-2 border rounded" />
                            <div className="flex gap-2">
                                <button type="submit" disabled={forgotLoading} className="btn-primary flex-1">{forgotLoading?"Enviando...":"Enviar"}</button>
                                <button type="button" onClick={()=>setShowForgot(false)} className="btn-gold">Cerrar</button>
                            </div>
                        </form>
                        {forgotMsg && <p className="mt-3 text-sm text-gray-700">{forgotMsg}</p>}
                        {forgotLink && (
                            <div className="mt-3 text-sm">
                                <div className="muted">En desarrollo: enlace de reseteo</div>
                                <a className="text-indigo-600 break-all" href={forgotLink}>{forgotLink}</a>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    </div>
);
}