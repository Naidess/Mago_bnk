// src/services/magdyService.js
import axios from "axios";

const API_URL = "http://localhost:4000/api/magdy"; 
// microservicio separado

export async function askMagdy(message) {
    try {
        const res = await axios.post(API_URL, { message });
        return res.data.reply;
    } catch (err) {
        console.error("Error con Magdy:", err);
        return "Perdón, hubo un problema procesando tu mensaje.";
    }
}
