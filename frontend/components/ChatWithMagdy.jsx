import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaCommentDots } from "react-icons/fa";
import axios from "axios";

export default function ChatWithMagdy() {
    const [openChat, setOpenChat] = useState(false);
    const [messages, setMessages] = useState([
        { from: "bot", text: "¡Hola! Soy Magdy, tu asistente virtual ✨ ¿En qué puedo ayudarte hoy?" }
    ]);
    const [input, setInput] = useState("");
    const [isBotTyping, setIsBotTyping] = useState(false);

    const chatRef = useRef(null);

    const scrollToBottom = () => {
        setTimeout(() => {
            if (chatRef.current) {
                chatRef.current.scrollTop = chatRef.current.scrollHeight;
            }
        }, 100);
    };

    useEffect(scrollToBottom, [messages, openChat]);

    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMsg = { from: "user", text: input };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        scrollToBottom();

        setIsBotTyping(true);

        try {
            const token = localStorage.getItem("access_token");
            const res = await axios.post(
                "http://localhost:3000/api/chat/message",
                { message: userMsg.text },
                { 
                    headers: { Authorization: `Bearer ${token}` },
                    withCredentials: true 
                }
            );

            const reply = res.data?.reply || "Lo siento, no pude procesar tu mensaje.";
            const botMsg = { from: "bot", text: reply };
            setMessages((prev) => [...prev, botMsg]);
        } catch (err) {
            console.error("Error al enviar mensaje", err);
            const errorMsg = { from: "bot", text: "Lo siento, ocurrió un error al procesar tu mensaje." };
            setMessages((prev) => [...prev, errorMsg]);
        } finally {
            setIsBotTyping(false);
            scrollToBottom();
        }
    };

    return (
        <>
            {/* Botón flotante */}
            <button
                onClick={() => setOpenChat(!openChat)}
                className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white 
                           w-14 h-14 rounded-full shadow-xl flex items-center justify-center 
                           text-3xl transition-all z-50 cursor-pointer"
            >
                <FaCommentDots />
            </button>

            {/* Ventana de chat */}
            <AnimatePresence>
                {openChat && (
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 40 }}
                        transition={{ duration: 0.25 }}
                        className="fixed bottom-24 right-6 w-80 h-96 bg-white rounded-xl shadow-xl 
                                   flex flex-col border border-gray-200 z-50"
                    >
                        <div className="bg-blue-600 text-white px-4 py-3 font-semibold rounded-t-xl">
                            Chat con Magdy ✨
                        </div>

                        {/* Mensajes */}
                        <div 
                            ref={chatRef}
                            className="flex-1 p-3 overflow-y-auto space-y-3 bg-gray-50"
                        >
                            {messages.map((msg, i) => (
                                <div 
                                    key={i}
                                    className={`max-w-[85%] p-2 rounded-lg text-sm shadow-sm ${
                                        msg.from === "user"
                                        ? "bg-blue-500 text-white ml-auto"
                                        : "bg-white text-gray-800 border"
                                    }`}
                                >
                                    {msg.text}
                                </div>
                            ))}

                            {isBotTyping && (
                                <div className="text-xs text-gray-500">
                                    Magdy está escribiendo...
                                </div>
                            )}
                        </div>

                        {/* Input */}
                        <div className="p-3 border-t flex gap-2 bg-white rounded-b-xl">
                            <input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                                className="flex-1 border rounded-lg px-3 py-2 outline-none text-gray-900"
                                placeholder="Escribe tu mensaje..."
                            />
                            <button
                                onClick={sendMessage}
                                className="bg-blue-600 text-white px-4 rounded-lg hover:bg-blue-700 transition cursor-pointer"
                            >
                                Enviar
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
