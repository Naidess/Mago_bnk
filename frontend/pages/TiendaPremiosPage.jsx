// pages/TiendaPremiosPage.jsx
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axiosInstance from "../src/api/axiosInstance";
import { motion } from "framer-motion";
import { FaTicketAlt, FaGift, FaHistory, FaShoppingCart, FaArrowLeft } from "react-icons/fa";
import MagoLogo from "../components/MagoLogo";

export default function TiendaPremiosPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [premios, setPremios] = useState([]);
    const [saldoTickets, setSaldoTickets] = useState(0);
    const [canjes, setCanjes] = useState([]);
    const [categoriaFiltro, setCategoriaFiltro] = useState("all");
    const [loading, setLoading] = useState(false);
    const [showCanjes, setShowCanjes] = useState(false);

    // Determinar de dónde viene el usuario
    const origenAnterior = location.state?.from || "/home";

    useEffect(() => {
        cargarDatos();
    }, [categoriaFiltro]);

    const cargarDatos = async () => {
        try {
            const [premiosRes, ticketsRes, canjesRes] = await Promise.all([
                axiosInstance.get(`/premios${categoriaFiltro !== 'all' ? `?categoria=${categoriaFiltro}` : ''}`),
                axiosInstance.get("/juegos/tickets"),
                axiosInstance.get("/premios/canjes")
            ]);

            setPremios(premiosRes.data.premios || []);
            setSaldoTickets(ticketsRes.data.saldo || 0);
            setCanjes(canjesRes.data.canjes || []);
        } catch (error) {
            console.error("Error al cargar datos:", error);
        }
    };

    const canjearPremio = async (premioId, nombrePremio, costoTickets) => {
        if (saldoTickets < costoTickets) {
            alert("No tienes suficientes tickets");
            return;
        }

        if (!confirm(`¿Canjear ${nombrePremio} por ${costoTickets} tickets?`)) {
            return;
        }

        setLoading(true);

        try {
            const res = await axiosInstance.post("/premios/canjear", {
                premioId
            });

            alert(res.data.message);
            setSaldoTickets(res.data.saldo_tickets);
            cargarDatos();
        } catch (error) {
            console.error("Error al canjear:", error);
            alert(error.response?.data?.error || "Error al canjear premio");
        } finally {
            setLoading(false);
        }
    };

    const categorias = [
        { value: "all", label: "Todos", icon: "🎁" },
        { value: "magys", label: "Magys", icon: "💰" },
        { value: "descuento", label: "Descuentos", icon: "🎫" },
        { value: "digital", label: "Digital", icon: "💳" },
        { value: "fisico", label: "Físico", icon: "📦" }
    ];

    const getEstadoBadge = (estado) => {
        const badges = {
            'pendiente': 'bg-yellow-500',
            'procesando': 'bg-blue-500',
            'entregado': 'bg-green-500',
            'cancelado': 'bg-red-500'
        };
        return badges[estado] || 'bg-gray-500';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6 flex justify-end">
                    <button
                        onClick={() => navigate("/home")}
                        className="flex items-center gap-2 hover:opacity-80 transition"
                    >
                        <MagoLogo size={40} variant="light" />
                        <span className="text-xl font-bold">Mago Bank</span>
                    </button>
                </div>
                
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <FaGift className="text-6xl text-yellow-400" />
                        <div>
                            <h1 className="text-4xl font-bold">🎁 Tienda de Premios</h1>
                            <p className="text-gray-300">Canjea tus tickets por premios increíbles</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setShowCanjes(!showCanjes)}
                            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition flex items-center gap-2"
                        >
                            <FaHistory />
                            Mis Canjes
                        </button>
                        <button
                            onClick={() => navigate(origenAnterior)}
                            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition flex items-center gap-2"
                        >
                            <FaArrowLeft />
                            Volver
                        </button>
                    </div>
                </div>

                {/* Saldo de Tickets */}
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-white/10 backdrop-blur-md p-6 rounded-xl border border-white/20 mb-8"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <FaTicketAlt className="text-6xl text-pink-400" />
                            <div>
                                <p className="text-gray-300 text-lg">Tus Tickets Disponibles</p>
                                <p className="text-5xl font-bold">{saldoTickets.toLocaleString()}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate("/juegos-magys")}
                            className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-black rounded-lg font-bold transition"
                        >
                            🎰 Ganar más tickets
                        </button>
                    </div>
                </motion.div>

                {/* Modal de Canjes */}
                {showCanjes && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-gray-900 rounded-2xl p-8 max-w-4xl w-full max-h-[80vh] overflow-y-auto"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-3xl font-bold">📋 Historial de Canjes</h2>
                                <button
                                    onClick={() => setShowCanjes(false)}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg"
                                >
                                    Cerrar
                                </button>
                            </div>

                            {canjes.length === 0 ? (
                                <p className="text-center text-gray-400 py-12">No has canjeado premios aún</p>
                            ) : (
                                <div className="space-y-4">
                                    {canjes.map((canje, idx) => (
                                        <div key={idx} className="bg-white/10 p-4 rounded-xl">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="font-bold text-xl mb-1">{canje.premio}</h3>
                                                    <p className="text-gray-400 text-sm">
                                                        {new Date(canje.fecha_canje).toLocaleDateString('es-ES', {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric'
                                                        })}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${getEstadoBadge(canje.estado)}`}>
                                                        {canje.estado.toUpperCase()}
                                                    </span>
                                                    <p className="text-gray-400 mt-2">-{canje.tickets_gastados} tickets</p>
                                                </div>
                                            </div>
                                            {canje.codigo_seguimiento && (
                                                <p className="mt-2 text-sm text-blue-400">
                                                    Código: {canje.codigo_seguimiento}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}

                {/* Filtros de Categoría */}
                <div className="flex gap-3 mb-8 flex-wrap">
                    {categorias.map((cat) => (
                        <button
                            key={cat.value}
                            onClick={() => setCategoriaFiltro(cat.value)}
                            className={`px-6 py-3 rounded-xl font-semibold transition ${
                                categoriaFiltro === cat.value
                                    ? 'bg-white text-purple-900'
                                    : 'bg-white/20 hover:bg-white/30'
                            }`}
                        >
                            {cat.icon} {cat.label}
                        </button>
                    ))}
                </div>

                {/* Grid de Premios */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {premios.length === 0 ? (
                        <p className="col-span-full text-center text-gray-400 py-12">
                            No hay premios disponibles en esta categoría
                        </p>
                    ) : (
                        premios.map((premio) => {
                            const puedesCanjear = saldoTickets >= premio.costo_tickets;
                            const sinStock = premio.stock !== null && premio.stock <= 0;

                            return (
                                <motion.div
                                    key={premio.id}
                                    whileHover={{ scale: 1.03 }}
                                    className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20"
                                >
                                    {/* Icono del premio */}
                                    <div className="text-6xl mb-4 text-center">
                                        {premio.categoria === 'magys' && '💰'}
                                        {premio.categoria === 'descuento' && '🎫'}
                                        {premio.categoria === 'digital' && '💳'}
                                        {premio.categoria === 'fisico' && '📦'}
                                    </div>

                                    <h3 className="text-xl font-bold mb-2">{premio.nombre}</h3>
                                    <p className="text-gray-300 text-sm mb-4 min-h-[3rem]">
                                        {premio.descripcion}
                                    </p>

                                    {premio.stock !== null && (
                                        <p className="text-sm text-gray-400 mb-2">
                                            Stock: {premio.stock} {sinStock && '(Agotado)'}
                                        </p>
                                    )}

                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <FaTicketAlt className="text-pink-400" />
                                            <span className="text-2xl font-bold">{premio.costo_tickets}</span>
                                        </div>
                                        {premio.valor_real && (
                                            <span className="text-sm text-gray-400">
                                                ({premio.valor_real >= 1000 
                                                    ? `₲${premio.valor_real.toLocaleString('es-PY')}` 
                                                    : `$${premio.valor_real}`})
                                            </span>
                                        )}
                                    </div>

                                    <button
                                        onClick={() => canjearPremio(premio.id, premio.nombre, premio.costo_tickets)}
                                        disabled={!puedesCanjear || sinStock || loading}
                                        className={`w-full py-3 rounded-lg font-bold transition ${
                                            !puedesCanjear || sinStock
                                                ? 'bg-gray-600 cursor-not-allowed text-gray-400'
                                                : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                                        }`}
                                    >
                                        {sinStock ? '😞 Agotado' : puedesCanjear ? '🎁 Canjear' : '🔒 Insuficientes'}
                                    </button>
                                </motion.div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
