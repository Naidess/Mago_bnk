// src/pages/HomePage.jsx
import { useEffect, useState } from "react";
import axiosInstance from "../src/api/axiosInstance";
import { motion } from "framer-motion";
import { 
    FaCreditCard, FaWallet, FaMoneyCheckAlt, FaCoins, FaCog, 
    FaCommentDots, FaHome, FaSignOutAlt, FaPlus, FaShoppingCart,
    FaDice, FaGift
} from "react-icons/fa";
import ChatWithMagdy from "../components/ChatWithMagdy";
import MagoLogo from "../components/MagoLogo";
import MagysIcon from "../components/MagysIcon";

export default function HomePage() {
    const [user, setUser] = useState(null);
    const [magys, setMagys] = useState(0);
    const [accounts, setAccounts] = useState([]);
    const [products, setProducts] = useState([]);
    const [solicitudesPendientes, setSolicitudesPendientes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
        try {
            const res = await axiosInstance.get("/user/dashboard");

            console.log("Dashboard response:", res.data);
            console.log("Accounts:", res.data.accounts);
            console.log("Solicitudes pendientes:", res.data.solicitudesPendientes);

            setUser(res.data.user);
            setMagys(res.data.magys);
            setAccounts(res.data.accounts);
            setProducts(res.data.products);
            setSolicitudesPendientes(res.data.solicitudesPendientes || []);
        } catch (error) {
            console.error("Error al cargar dashboard", error);
        } finally {
            setLoading(false);
        }
        };

        fetchData();
    }, []);

    if (loading)
        return <p className="text-center mt-20 text-gray-200 text-lg">Cargando...</p>;

    const handleLogout = async () => {
        try {
            await axiosInstance.post("/auth/logout");
            localStorage.removeItem("access_token");
            window.location.href = "/login";
        } catch (err) {
            console.error("Error al cerrar sesión", err);
            localStorage.removeItem("access_token");
            window.location.href = "/login";
        }
    };

    const iconMap = {
        "Tarjeta de Crédito": <FaCreditCard className="text-indigo-600 w-6 h-6" />,
        "Caja de Ahorro": <FaWallet className="text-teal-500 w-6 h-6" />,
        "Préstamo": <FaMoneyCheckAlt className="text-red-400 w-6 h-6" />,
        "Magys": <FaCoins className="text-yellow-500 w-6 h-6" />,
    };

    return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#0B1D39] text-white">

        {/* Mobile Navbar */}
        <nav className="lg:hidden bg-[#0F223F] border-b border-white/10 p-4 flex items-center justify-between">
            <a href="/home" className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition">
                <MagoLogo size={50} variant="light" />
                <h1 className="text-xl font-bold text-white">Mago Bank</h1>
            </a>
        </nav>

        {/* Sidebar */}
        <aside className="w-64 hidden lg:flex flex-col p-8 border-r border-white/10 bg-[#0F223F]">
        <a href="/home" className="flex items-center gap-3 mb-10 cursor-default">
            <MagoLogo size={55} variant="light" />
            <h1 className="text-2xl font-bold text-white tracking-wide">
                Mago Bank
            </h1>
        </a>

        <nav className="flex flex-col gap-4 text-gray-300">
            <SidebarItem href="/home" icon={<FaHome />} label="Dashboard" />
            <SidebarItem href="/solicitar-productos" icon={<FaShoppingCart />} label="Solicitar Productos" />
            <SidebarItem href="/juegos-magys" icon={<FaDice />} label="Juegos Magys" />
            <SidebarItem href="/tienda-premios" icon={<FaGift />} label="Tienda de Premios" />
            <SidebarItem href="/settings" icon={<FaCog />} label="Configuración" />
        </nav>
        </aside>

        {/* Main */}
        <main className="flex-1 p-8 space-y-12 overflow-y-auto bg-[#F3F6FA] text-gray-900">

        {/* Header */}
        <header className="flex items-center justify-between">
            <div>
            <h2 className="text-3xl font-semibold text-gray-900">
                Hola, {user?.name}
            </h2>
            <p className="text-gray-600 mt-1">
                Gestioná tus cuentas y productos financieros.
            </p>
            </div>

            <div className="flex items-center gap-4">
                <div className="bg-white px-5 py-3 rounded-xl flex items-center gap-3 shadow-lg border border-gray-200">
                <MagysIcon size= {56} variant="dark" />
                <div className="text-right">
                    <span className="text-sm text-gray-500">Tus Magys</span>
                    <p className="text-xl font-bold text-gray-800">{magys}</p>
                </div>
                </div>
                <button onClick={handleLogout} className="btn-gold flex items-center gap-2">
                    <FaSignOutAlt />
                    Cerrar sesión
                </button>
            </div>
        </header>

        {/* Solicitudes Pendientes - Solo mostrar si hay solicitudes */}
        {solicitudesPendientes.length > 0 && (
            <section>
                <SectionTitle title="Solicitudes Pendientes" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {solicitudesPendientes.map((solicitud) => (
                    <motion.div
                    key={solicitud.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-amber-50 border-2 border-amber-300 p-6 rounded-xl shadow-md"
                    >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="bg-amber-500 p-2 rounded-lg">
                            <FaWallet className="text-white text-xl" />
                        </div>
                        <div>
                            <p className="text-lg font-semibold text-gray-900">{solicitud.nombreProducto}</p>
                            <p className="text-sm text-amber-700">En evaluación</p>
                        </div>
                    </div>

                    <div className="bg-white/50 rounded-lg p-3 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Número de cuenta:</span>
                            <span className="font-semibold text-gray-900">{solicitud.numeroCuenta}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Fecha de solicitud:</span>
                            <span className="font-semibold text-gray-900">
                                {new Date(solicitud.fechaSolicitud).toLocaleDateString('es-ES')}
                            </span>
                        </div>
                    </div>

                    <div className="mt-4 bg-amber-100 border border-amber-300 rounded-lg p-3 flex items-center gap-2">
                        <span className="text-2xl">⏳</span>
                        <div>
                            <p className="text-xs font-semibold text-amber-900">Estado: En proceso</p>
                            <p className="text-xs text-amber-700">Te notificaremos cuando sea aprobada</p>
                        </div>
                    </div>
                    </motion.div>
                ))}
                </div>
            </section>
        )}

        {/* Cuentas */}
        <section>
            <SectionTitle title="Cuentas" />

            {accounts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {accounts.map((acc) => (
                    <motion.div
                    key={acc.id}
                    whileHover={{ scale: 1.02 }}
                    className="bg-white p-6 rounded-xl shadow-md border border-gray-200"
                    >
                    <p className="text-gray-600 text-sm">Número de cuenta</p>
                    <p className="text-gray-900 font-semibold text-lg">{acc.number}</p>

                    <p className="text-gray-600 text-sm mt-3">Saldo disponible</p>
                    <p className="text-3xl font-bold text-teal-600 mt-1">
                        ${acc.balance.toFixed(2)}
                    </p>
                    </motion.div>
                ))}
                </div>
            ) : (
                <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
                    <p className="text-gray-600">No tienes cuentas activas aún.</p>
                    <a href="/solicitar-productos" className="text-teal-600 hover:text-teal-700 font-semibold mt-2 inline-block">
                        Solicitar una cuenta →
                    </a>
                </div>
            )}
        </section>

        {/* Productos */}
        {products.length > 0 && (
            <section>
                <SectionTitle title="Otros Productos" />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {products.map((prod) => (
                    <motion.div
                    key={prod.id}
                    whileHover={{ scale: 1.02 }}
                    className="bg-white p-5 rounded-xl shadow-md border border-gray-200"
                    >
                    <div className="flex items-center gap-3">
                        {iconMap[prod.name] || <FaWallet className="text-gray-400" />}
                        <p className="text-lg font-semibold text-gray-900">{prod.name}</p>
                    </div>

                    <p className="text-gray-600 text-sm mt-2">{prod.status}</p>

                    {prod.balance !== undefined && (
                        <p className="text-xl font-bold text-teal-600 mt-3">
                        ${prod.balance.toFixed(2)}
                        </p>
                    )}
                    </motion.div>
                ))}
                </div>
            </section>
        )}

        </main>

        {/* Chat flotante con Magdy */}
        <ChatWithMagdy />
    </div>
    );
}

/* --------------------------- COMPONENTS --------------------------- */

function SidebarItem({ href, icon, label }) {
    return (
        <a
        href={href}
        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition"
        >
        <span className="text-gray-300 text-lg">{icon}</span>
        <span className="text-gray-200">{label}</span>
        </a>
    );
}

function SectionTitle({ title }) {
    return (
        <h3 className="text-xl font-semibold text-gray-700 mb-4 tracking-wide">
        {title}
        </h3>
    );
}