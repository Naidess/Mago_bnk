// src/pages/HomePage.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { FaCreditCard, FaWallet, FaMoneyCheckAlt, FaCoins, FaCog, FaCommentDots, FaHome, FaSignOutAlt } from "react-icons/fa";

export default function HomePage() {
    const [user, setUser] = useState(null);
    const [magys, setMagys] = useState(0);
    const [accounts, setAccounts] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
        try {
            const token = localStorage.getItem("access_token");
            const res = await axios.get("http://localhost:3000/api/user/dashboard", {
            headers: { Authorization: `Bearer ${token}` },
            });

            setUser(res.data.user);
            setMagys(res.data.magys);
            setAccounts(res.data.accounts);
            setProducts(res.data.products);
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
            await axios.post("http://localhost:3000/api/auth/logout", {}, { withCredentials: true });
            localStorage.removeItem("access_token");
            window.location.href = "/login";
        } catch (err) {
            console.error("Error al cerrar sesión", err);
            // aún así limpia el token y redirige
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
    <div className="min-h-screen flex bg-[#0B1D39] text-white">

        {/* Sidebar */}
        <aside className="w-64 hidden lg:flex flex-col p-8 border-r border-white/10 bg-[#0F223F]">
        <h1 className="text-2xl font-bold text-white tracking-wide mb-10">
            Mago Bank
        </h1>

        <nav className="flex flex-col gap-4 text-gray-300">
            <SidebarItem href="/home" icon={<FaHome />} label="Dashboard" />
            <SidebarItem href="/magys" icon={<FaCoins />} label="Operaciones Magys" />
            <SidebarItem href="/chat" icon={<FaCommentDots />} label="Chat con Magdy" />
            <SidebarItem href="/settings" icon={<FaCog />} label="Configuración" />
        </nav>
        </aside>

        {/* Main: nuevo color */}
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
                <FaCoins className="text-yellow-500 text-3xl" />
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

        {/* Cuentas */}
        <section>
            <SectionTitle title="Cuentas" />

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
        </section>

        {/* Productos */}
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

        </main>
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