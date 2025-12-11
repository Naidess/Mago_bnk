// pages/TragamonedasPage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../src/api/axiosInstance";
import { motion, AnimatePresence } from "framer-motion";
import { FaCoins, FaTicketAlt, FaHistory, FaTrophy, FaDice, FaArrowLeft } from "react-icons/fa";
import MagoLogo from "../components/MagoLogo";

export default function TragamonedasPage() {
    const navigate = useNavigate();
    const [saldos, setSaldos] = useState({ magys: 0, tickets: 0 });
    const [apuesta, setApuesta] = useState(50);
    const [carretes, setCarretes] = useState(["❓", "❓", "❓"]);
    const [girando, setGirando] = useState(false);
    const [resultado, setResultado] = useState(null);
    const [simbolos, setSimbolos] = useState([]);
    const [historial, setHistorial] = useState([]);
    const [showHistorial, setShowHistorial] = useState(false);

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            const [saldosRes, simbolosRes, historialRes] = await Promise.all([
                axiosInstance.get("/user/dashboard"),
                axiosInstance.get("/juegos/1/simbolos"),
                axiosInstance.get("/juegos/historial?limite=10")
            ]);

            setSaldos({
                magys: saldosRes.data.magys || 0,
                tickets: saldosRes.data.tickets?.saldo || 0
            });
            setSimbolos(simbolosRes.data.simbolos || []);
            setHistorial(historialRes.data.historial || []);
        } catch (error) {
            console.error("Error al cargar datos:", error);
        }
    };

    const jugar = async () => {
        if (girando) return;
        if (saldos.magys < apuesta) {
            setResultado({
                gano: false,
                mensajeGanancia: `⚠️ Saldo insuficiente. Necesitas ${apuesta} Magys pero solo tienes ${saldos.magys}`,
                ticketsGanados: 0
            });
            return;
        }

        setGirando(true);
        setResultado(null);

        // Animación de giro
        const intervalId = setInterval(() => {
            setCarretes([
                getRandomSimbolo(),
                getRandomSimbolo(),
                getRandomSimbolo()
            ]);
        }, 100);

        try {
            const res = await axiosInstance.post("/juegos/slots/jugar", {
                apuesta,
                juegoId: 1
            });

            // Detener animación después de 2 segundos
            setTimeout(() => {
                clearInterval(intervalId);
                setCarretes(res.data.resultado.carretes);
                setResultado(res.data.resultado);
                setSaldos(res.data.saldos);
                setGirando(false);

                // Actualizar historial
                cargarDatos();
            }, 2000);

        } catch (error) {
            clearInterval(intervalId);
            setGirando(false);
            console.error("Error al jugar:", error);
            alert(error.response?.data?.error || "Error al jugar");
        }
    };

    const getRandomSimbolo = () => {
        if (simbolos.length === 0) return "❓";
        return simbolos[Math.floor(Math.random() * simbolos.length)].simbolo;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 text-white p-6">
            {/* Header */}
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => navigate("/juegos-magys")}
                        className="flex items-center gap-2 text-white/80 hover:text-white transition"
                    >
                        <FaArrowLeft />
                        <span>Volver a Juegos</span>
                    </button>
                    
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
                        <FaDice className="text-6xl text-yellow-400" />
                        <div>
                            <h1 className="text-4xl font-bold">🎰 Tragamonedas</h1>
                            <p className="text-gray-300">¡Gira y gana tickets!</p>
                        </div>
                    </div>
                </div>

                {/* Saldos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="bg-white/10 backdrop-blur-md p-6 rounded-xl border border-white/20"
                    >
                        <div className="flex items-center gap-3">
                            <FaCoins className="text-4xl text-yellow-400" />
                            <div>
                                <p className="text-gray-300 text-sm">Saldo Magys</p>
                                <p className="text-3xl font-bold">{saldos.magys.toLocaleString()}</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="bg-white/10 backdrop-blur-md p-6 rounded-xl border border-white/20"
                    >
                        <div className="flex items-center gap-3">
                            <FaTicketAlt className="text-4xl text-pink-400" />
                            <div>
                                <p className="text-gray-300 text-sm">Tickets</p>
                                <p className="text-3xl font-bold">{saldos.tickets.toLocaleString()}</p>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Máquina Tragamonedas */}
                <div className="max-w-2xl mx-auto bg-gradient-to-b from-red-600 to-red-800 rounded-3xl p-6 mb-8 shadow-2xl border-4 border-yellow-500">
                    {/* Carretes */}
                    <div className="bg-black/40 rounded-2xl p-6 mb-4">
                        <div className="grid grid-cols-3 gap-3">
                            {carretes.map((simbolo, idx) => (
                                <motion.div
                                    key={idx}
                                    animate={{ 
                                        rotateX: girando ? [0, 360] : 0,
                                        scale: girando ? [1, 1.05, 1] : 1
                                    }}
                                    transition={{ 
                                        duration: 0.1, 
                                        repeat: girando ? Infinity : 0 
                                    }}
                                    className="bg-white rounded-lg aspect-square flex items-center justify-center text-6xl shadow-lg"
                                >
                                    {simbolo}
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Resultado */}
                    <AnimatePresence>
                        {resultado && (
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className={`p-4 rounded-xl mb-4 text-center ${
                                    resultado.gano 
                                        ? 'bg-green-500/20 border-2 border-green-400' 
                                        : 'bg-gray-500/20 border-2 border-gray-400'
                                }`}
                            >
                                <p className="text-xl font-bold mb-1">
                                    {resultado.mensajeGanancia}
                                </p>
                                {resultado.gano && (
                                    <div className="flex items-center justify-center gap-2 text-lg">
                                        <FaTrophy className="text-yellow-400" />
                                        <span>+{resultado.ticketsGanados} tickets</span>
                                        <FaTrophy className="text-yellow-400" />
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Controles */}
                    <div className="space-y-3">
                        <div>
                            <label className="block text-center mb-2 text-lg font-semibold">
                                Apuesta: {apuesta} Magys
                            </label>
                            <input
                                type="range"
                                min="10"
                                max="500"
                                step="10"
                                value={apuesta}
                                onChange={(e) => setApuesta(parseInt(e.target.value))}
                                disabled={girando}
                                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                            />
                            <div className="flex justify-between text-sm text-gray-300 mt-1">
                                <span>10</span>
                                <span>500</span>
                            </div>
                        </div>

                        <button
                            onClick={jugar}
                            disabled={girando || saldos.magys < apuesta}
                            className={`w-full py-3 rounded-xl text-xl font-bold transition ${
                                girando
                                    ? 'bg-gray-500 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-black shadow-lg'
                            }`}
                        >
                            {girando ? '🎰 GIRANDO...' : '🎰 GIRAR'}
                        </button>
                    </div>
                </div>

                {/* Tabla de Pagos y Historial */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Tabla de Pagos */}
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                        <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                            <FaTrophy className="text-yellow-400" />
                            Tabla de Pagos
                        </h3>
                        <div className="space-y-2">
                            {simbolos.map((s, idx) => (
                                <div key={idx} className="flex items-center justify-between bg-black/30 p-3 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <span className="text-4xl">{s.simbolo}</span>
                                        <span>{s.nombre}</span>
                                    </div>
                                    <span className="text-yellow-400 font-bold">x{s.multiplicador}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Historial */}
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                        <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                            <FaHistory className="text-blue-400" />
                            Últimas Jugadas
                        </h3>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {historial.length === 0 ? (
                                <p className="text-gray-400 text-center py-8">No hay jugadas aún</p>
                            ) : (
                                historial.map((h, idx) => (
                                    <div key={idx} className="bg-black/30 p-3 rounded-lg flex justify-between items-center">
                                        <div>
                                            <div className="flex gap-2 text-2xl mb-1">
                                                {h.resultado.carretes?.map((c, i) => (
                                                    <span key={i}>{c.simbolo}</span>
                                                ))}
                                            </div>
                                            <p className="text-sm text-gray-400">
                                                Apuesta: {h.apuesta} Magys
                                            </p>
                                        </div>
                                        <div className={`font-bold ${h.ganancia > 0 ? 'text-green-400' : 'text-gray-400'}`}>
                                            {h.ganancia > 0 ? `+${h.ganancia}` : '0'} 🎫
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Botón a Tienda de Premios */}
                <div className="mt-8 text-center">
                    <button
                        onClick={() => navigate("/tienda-premios", { state: { from: "/tragamonedas" } })}
                        className="inline-block px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 rounded-xl text-xl font-bold shadow-lg transition"
                    >
                        🎁 Ir a Tienda de Premios
                    </button>
                </div>
            </div>
        </div>
    );
}
