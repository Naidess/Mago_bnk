// pages/JuegosMagysPage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../src/api/axiosInstance";
import { motion } from "framer-motion";
import { FaDice, FaCoins, FaTicketAlt, FaArrowLeft, FaLock } from "react-icons/fa";
import MagoLogo from "../components/MagoLogo";

export default function JuegosMagysPage() {
    const navigate = useNavigate();
    const [juegos, setJuegos] = useState([]);
    const [saldos, setSaldos] = useState({ magys: 0, tickets: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            const [juegosRes, saldosRes] = await Promise.all([
                axiosInstance.get("/juegos"),
                axiosInstance.get("/user/dashboard")
            ]);

            setJuegos(juegosRes.data.juegos || []);
            setSaldos({
                magys: saldosRes.data.magys || 0,
                tickets: saldosRes.data.tickets?.saldo || 0
            });
        } catch (error) {
            console.error("Error al cargar datos:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleJuegoClick = (juego) => {
        console.log("handleJuegoClick llamado", juego);
        if (!juego.activo) {
            console.log("Juego no activo");
            return;
        }
        
        console.log("Tipo de juego:", juego.tipo);
        if (juego.tipo === "slots" || juego.tipo === "slot") {
            console.log("Navegando a /tragamonedas");
            navigate("/tragamonedas");
        }
        // Aquí puedes agregar más juegos en el futuro
        // else if (juego.tipo === "ruleta") navigate("/ruleta");
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex items-center justify-center">
                <p className="text-white text-xl">Cargando juegos...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 p-6">
            {/* Header */}
            <div className="max-w-6xl mx-auto mb-8">
                <button
                    onClick={() => navigate("/home")}
                    className="flex items-center gap-2 text-white/80 hover:text-white transition mb-6"
                >
                    <FaArrowLeft />
                    <span>Volver al Dashboard</span>
                </button>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <MagoLogo size={60} variant="light" />
                        <div>
                            <h1 className="text-4xl font-bold text-white mb-2">Juegos Magys</h1>
                            <p className="text-purple-200">¡Diviértete y gana tickets!</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="bg-white/10 backdrop-blur-md rounded-xl px-6 py-3 border border-white/20">
                            <div className="flex items-center gap-2 text-yellow-400">
                                <FaCoins />
                                <span className="font-bold text-2xl">{saldos.magys}</span>
                            </div>
                            <p className="text-xs text-white/60">Magys</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-xl px-6 py-3 border border-white/20">
                            <div className="flex items-center gap-2 text-green-400">
                                <FaTicketAlt />
                                <span className="font-bold text-2xl">{saldos.tickets}</span>
                            </div>
                            <p className="text-xs text-white/60">Tickets</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Lista de Juegos */}
            <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {juegos.map((juego) => (
                        <motion.div
                            key={juego.id}
                            whileHover={{ scale: juego.activo ? 1.05 : 1 }}
                            onClick={() => handleJuegoClick(juego)}
                            className={`relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-2xl p-6 border-2 transition-all ${
                                juego.activo
                                    ? "border-yellow-400 cursor-pointer hover:border-yellow-300 hover:shadow-2xl hover:shadow-yellow-500/30"
                                    : "border-gray-600 opacity-50 cursor-not-allowed"
                            }`}
                        >
                            {!juego.activo && (
                                <div className="absolute top-4 right-4 bg-red-500 rounded-full p-2">
                                    <FaLock className="text-white" />
                                </div>
                            )}

                            <div className="flex items-center gap-3 mb-4">
                                <div className={`p-4 rounded-xl ${
                                    juego.tipo === "slot" ? "bg-red-500/20" : "bg-blue-500/20"
                                }`}>
                                    <FaDice className="text-4xl text-white" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-white">{juego.nombre}</h3>
                                    <p className="text-sm text-purple-200">{juego.tipo.toUpperCase()}</p>
                                </div>
                            </div>

                            <p className="text-white/80 mb-4 min-h-[60px]">
                                {juego.descripcion}
                            </p>

                            <div className="border-t border-white/20 pt-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-white/60">Apuesta Mínima:</span>
                                    <span className="text-yellow-400 font-bold">{juego.costo_minimo} Magys</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-white/60">Apuesta Máxima:</span>
                                    <span className="text-yellow-400 font-bold">{juego.costo_maximo} Magys</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-white/60">RTP:</span>
                                    <span className="text-green-400 font-bold">{parseFloat(juego.rtp).toFixed(1)}%</span>
                                </div>
                            </div>

                            {juego.activo && (
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleJuegoClick(juego);
                                    }}
                                    className="w-full mt-4 bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-black font-bold py-3 rounded-xl transition shadow-lg"
                                >
                                    ¡Jugar Ahora!
                                </button>
                            )}
                        </motion.div>
                    ))}
                </div>

                {juegos.length === 0 && (
                    <div className="text-center py-20">
                        <FaDice className="text-6xl text-white/20 mx-auto mb-4" />
                        <p className="text-white/60 text-xl">No hay juegos disponibles por el momento</p>
                    </div>
                )}
            </div>
        </div>
    );
}
