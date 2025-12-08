import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";

export default function ResetPassword(){
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token") || "";
    const id = searchParams.get("id") || "";
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState("");
    const navigate = useNavigate();

    useEffect(()=>{
        if(!token || !id){
            setMsg("Token inválido. Asegúrate de usar el enlace recibido por email.");
        }
    },[token,id]);

    const handleReset = async (e)=>{
        e.preventDefault();
        setMsg("");
        if(password.length < 8){ setMsg("La contraseña debe tener al menos 8 caracteres"); return; }
        if(password !== confirm){ setMsg("Las contraseñas no coinciden"); return; }
        setLoading(true);
        try{
            const res = await axios.post("http://localhost:3000/api/auth/reset-password", { token, id, password });
            setMsg(res.data?.message || "Contraseña actualizada");
            // redirect to login after short delay
            setTimeout(()=> navigate('/login'), 1500);
        }catch(err){
            setMsg(err.response?.data?.error || "Error al resetear la contraseña");
        }finally{ setLoading(false); }
    };

    return (
        <div className="min-h-screen flex items-center justify-center app-gradient-bg p-6">
            <div className="w-full max-w-md card p-8">
                <h2 className="text-2xl font-semibold mb-4">Restablecer contraseña</h2>
                <form onSubmit={handleReset} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold muted mb-1">Nueva contraseña</label>
                        <input value={password} onChange={(e)=>setPassword(e.target.value)} type="password" className="w-full px-3 py-2 border rounded" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold muted mb-1">Confirmar contraseña</label>
                        <input value={confirm} onChange={(e)=>setConfirm(e.target.value)} type="password" className="w-full px-3 py-2 border rounded" />
                    </div>
                    {msg && <p className="text-sm text-gray-700">{msg}</p>}
                    <div className="flex gap-2">
                        <button type="submit" disabled={loading} className="btn-primary flex-1">{loading?"Procesando...":"Restablecer"}</button>
                        <button type="button" onClick={()=>navigate('/login')} className="btn-gold">Cancelar</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
