// src/pages/SolicitarProductos.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../src/api/axiosInstance";
import { motion } from "framer-motion";
import { 
    FaWallet, FaCreditCard, FaMoneyCheckAlt, 
    FaArrowLeft, FaCheckCircle, FaSpinner 
} from "react-icons/fa";
import MagoLogo from "../components/MagoLogo";
import ChatWithMagdy from "../components/ChatWithMagdy";
import MagysIcon from "../components/MagysIcon";

// Catálogo de productos disponibles (escalable)
const PRODUCTOS_DISPONIBLES = [
    {
        id: "cuenta_corriente",
        nombre: "Cuenta Corriente",
        descripcion: "Administrá tu dinero diariamente con nuestra cuenta corriente sin costos de mantenimiento.",
        beneficios: [
            "Sin costos de apertura",
            "Transferencias ilimitadas",
            "Tarjeta de débito incluida",
            "Chequera disponible"
        ],
        magys: 500,
        icono: FaWallet,
        color: "from-teal-500 to-teal-700",
        disponible: true,
        endpoint: "/cuenta-corriente/solicitar"
    },
    {
        id: "tarjeta_credito",
        nombre: "Tarjeta de Crédito",
        descripcion: "Financiá tus compras con nuestra tarjeta de crédito con beneficios exclusivos.",
        beneficios: [
            "Hasta 50 días sin interés",
            "Cashback en compras",
            "Programa de puntos",
            "Seguro de compra incluido"
        ],
        magys: 1000,
        icono: FaCreditCard,
        color: "from-indigo-500 to-indigo-700",
        disponible: false, // Próximamente
        endpoint: "/tarjeta-credito/solicitar"
    },
    {
        id: "prestamo",
        nombre: "Préstamo Personal",
        descripcion: "Conseguí el dinero que necesitás con tasas preferenciales y plazos flexibles.",
        beneficios: [
            "Hasta Gs. 5.000.000",
            "Plazos de 12 a 60 meses",
            "Pre-aprobación inmediata",
            "Acreditación en 24hs"
        ],
        magys: 750,
        icono: FaMoneyCheckAlt,
        color: "from-amber-500 to-amber-700",
        disponible: false, // Próximamente
        endpoint: "/prestamo/solicitar"
    }
];

export default function SolicitarProductos() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [success, setSuccess] = useState(null);
    const [error, setError] = useState(null);

    const handleSolicitarProducto = async (producto) => {
        if (!producto.disponible) return;

        setLoading(true);
        setError(null);
        setSelectedProduct(producto.id);

        try {
            const res = await axiosInstance.post(producto.endpoint);
            
            setSuccess({
                producto: producto.nombre,
                magys: res.data.magysOtorgados || 0,
                data: res.data,
                pendiente: res.data.estado === 'pendiente'
            });

            // Redirigir al home después de 4 segundos
            setTimeout(() => {
                navigate("/home");
            }, 4000);

        } catch (err) {
            console.error("Error al solicitar producto:", err);
            setError(
                err.response?.data?.error || 
                "Error al procesar la solicitud. Por favor, intentá nuevamente."
            );
        } finally {
            setLoading(false);
            setSelectedProduct(null);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0B1D39] via-[#0F223F] to-[#0B1D39] text-white">
            
            {/* Header */}
            <header className="bg-[#0F223F] border-b border-white/10 p-6">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => navigate("/home")}
                            className="flex items-center gap-2 text-gray-300 hover:text-white transition cursor-pointer"
                        >
                            <FaArrowLeft />
                            <span>Volver</span>
                        </button>
                        <div className="h-8 w-px bg-white/20"></div>
                        <MagoLogo size={40} variant="light" />
                        <h1 className="text-2xl font-bold">Solicitar Productos</h1>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto p-8">
                
                {/* Introducción */}
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <h2 className="text-4xl font-bold mb-4">
                        Elegí el producto que mejor se adapte a vos
                    </h2>
                    <p className="text-gray-300 text-lg">
                        Cada producto que contratás suma <strong>Magys</strong> a tu cuenta
                    </p>
                </motion.div>

                {/* Mensajes de éxito/error */}
                {success && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mb-8 bg-green-500/20 border-2 border-green-500 rounded-xl p-6 text-center"
                    >
                        <FaCheckCircle className="text-green-400 text-5xl mx-auto mb-4" />
                        <h3 className="text-2xl font-bold text-green-300 mb-2">
                            {success.pendiente 
                                ? `¡Solicitud de ${success.producto} enviada!`
                                : `¡${success.producto} aprobada con éxito!`
                            }
                        </h3>
                        {success.pendiente ? (
                            <>
                                <p className="text-gray-200 mb-3">
                                    Tu solicitud está <strong className="text-yellow-300">en evaluación</strong>
                                </p>
                                <p className="text-sm text-gray-400">
                                    Te notificaremos cuando sea aprobada y recibirás tus Magys.
                                </p>
                            </>
                        ) : (
                            <>
                                <p className="text-gray-200 mb-3">
                                    Ganaste <strong className="text-green-300">{success.magys} Magys</strong>
                                </p>
                                <p className="text-sm text-gray-400">
                                    Redirigiendo al inicio...
                                </p>
                            </>
                        )}
                    </motion.div>
                )}

                {error && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mb-8 bg-red-500/20 border-2 border-red-500 rounded-xl p-4 text-center"
                    >
                        <p className="text-red-300">{error}</p>
                    </motion.div>
                )}

                {/* Grid de Productos */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {PRODUCTOS_DISPONIBLES.map((producto, index) => (
                        <ProductoCard
                            key={producto.id}
                            producto={producto}
                            index={index}
                            loading={loading && selectedProduct === producto.id}
                            onSolicitar={handleSolicitarProducto}
                        />
                    ))}
                </div>

                {/* Nota informativa */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-12 bg-white/5 border border-white/10 rounded-xl p-6"
                >
                    <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                        <MagysIcon size={28} variant="light" />
                        ¿Qué son los Magys?
                    </h3>
                    <p className="text-gray-300 leading-relaxed">
                        Los <strong>Magys</strong> son puntos de recompensa que ganás por usar nuestros productos 
                        y servicios. Acumulá Magys y canjeálos por beneficios exclusivos, descuentos y premios.
                    </p>
                </motion.div>

            </main>
            <ChatWithMagdy />
        </div>
    );
}

/* ==================== COMPONENTES ==================== */

function ProductoCard({ producto, index, loading, onSolicitar }) {
    const Icon = producto.icono;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: producto.disponible ? 1.02 : 1 }}
            className={`
                relative bg-white/5 backdrop-blur-sm border border-white/10 
                rounded-2xl overflow-hidden
                ${!producto.disponible ? 'opacity-60' : ''}
            `}
        >
            {/* Badge de no disponible */}
            {!producto.disponible && (
                <div className="absolute top-4 right-4 bg-amber-500/90 text-white text-xs font-bold px-3 py-1 rounded-full z-10">
                    Próximamente
                </div>
            )}

            {/* Header con degradado */}
            <div className={`bg-gradient-to-r ${producto.color} p-6 text-center`}>
                <Icon className="text-white text-5xl mx-auto mb-3" />
                <h3 className="text-2xl font-bold text-white">{producto.nombre}</h3>
            </div>

            {/* Contenido */}
            <div className="p-6">
                <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                    {producto.descripcion}
                </p>

                {/* Beneficios */}
                <div className="mb-6">
                    <h4 className="text-white font-semibold mb-3 text-sm uppercase tracking-wide">
                        Beneficios
                    </h4>
                    <ul className="space-y-2">
                        {producto.beneficios.map((beneficio, i) => (
                            <li key={i} className="flex items-start gap-2 text-gray-300 text-sm">
                                <span className="text-green-400 mt-1">✓</span>
                                <span>{beneficio}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Magys */}
                <div className="bg-white/5 border border-white/10 rounded-lg p-3 mb-6 flex items-center justify-between">
                    <span className="text-gray-300 text-sm">Ganás al contratar:</span>
                    <div className="flex items-center gap-2">
                        <MagysIcon size={24} variant="light" />
                        <span className="text-xl font-bold text-green-400">+{producto.magys}</span>
                    </div>
                </div>

                {/* Botón */}
                <button
                    onClick={() => onSolicitar(producto)}
                    disabled={!producto.disponible || loading}
                    className={`
                        w-full py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2
                        ${producto.disponible 
                            ? 'bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white' 
                            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        }
                    `}
                >
                    {loading ? (
                        <>
                            <FaSpinner className="animate-spin" />
                            <span>Procesando...</span>
                        </>
                    ) : producto.disponible ? (
                        <span>Solicitar Ahora</span>
                    ) : (
                        <span>No Disponible</span>
                    )}
                </button>
            </div>
        </motion.div>
    );
}
