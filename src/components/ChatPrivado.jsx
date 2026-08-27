import React, { useState, useEffect } from 'react';
import { BancoDeDados } from '../services/database';

export default function ChatPrivado({ destinatario, usuarioLogado, darkMode, onVerPerfil }) {
  const [mensagens, setMensagens] = useState([]);
  const [textoMensagem, setTextoMensagem] = useState('');
  const [perfilAlvoObj, setPerfilAlvoObj] = useState(null);

  useEffect(() => {
    async function carregar() {
      const perfis = await BancoDeDados.getPerfisCadastrados();
      const alvo = perfis.find(p => p.username === destinatario);
      setPerfilAlvoObj(alvo);

      const msgs = await BancoDeDados.getMensagensChat(usuarioLogado.username, destinatario);
      setMensagens(msgs);
    }
    carregar();

    const intervalo = setInterval(async () => {
      const msgs = await BancoDeDados.getMensagensChat(usuarioLogado.username, destinatario);
      setMensagens(msgs);
    }, 3000);

    return () => clearInterval(intervalo);
  }, [destinatario, usuarioLogado]);

  const enviar = async (e) => {
    e.preventDefault();
    if (!textoMensagem.trim()) return;

    const nova = {
      id: Date.now(),
      remetente: usuarioLogado.username,
      destinatario: destinatario,
      texto: textoMensagem.trim(),
      horario: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    await BancoDeDados.enviarMensagemChat(nova);
    setTextoMensagem('');
    const msgs = await BancoDeDados.getMensagensChat(usuarioLogado.username, destinatario);
    setMensagens(msgs);
  };

  const fotoPerfilAlvo = perfilAlvoObj?.foto || perfilAlvoObj?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80';

  const handleAbrirPerfil = () => {
    if (perfilAlvoObj && onVerPerfil) {
      onVerPerfil(perfilAlvoObj);
    }
  };

  return (
    <div className={`p-6 rounded-2xl border shadow-md space-y-4 max-w-2xl mx-auto w-full ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
      
      {/* Cabeçalho Clicável para abrir o Perfil */}
      <div 
        onClick={handleAbrirPerfil}
        className="flex items-center gap-3 border-b pb-4 border-slate-700/50 cursor-pointer group transition hover:opacity-80"
        title="Ver perfil completo"
      >
        <img 
          src={fotoPerfilAlvo} 
          alt="Perfil" 
          className="w-10 h-10 rounded-full object-cover border-2 border-blue-500 shadow-xs" 
        />
        <div>
          <h3 className="font-bold text-sm group-hover:text-blue-500 transition">{perfilAlvoObj?.nome || destinatario}</h3>
          <p className="text-[10px] text-blue-400 font-semibold">@{destinatario}</p>
        </div>
      </div>

      <div className="h-80 overflow-y-auto space-y-3 p-3 rounded-xl bg-slate-800/10 border border-slate-700/20">
        {mensagens.length === 0 ? (
          <p className="text-xs opacity-50 text-center py-20">Inicie uma conversa em tempo real com @{destinatario}!</p>
        ) : (
          mensagens.map((msg, idx) => {
            const minhaMsg = msg.remetente === usuarioLogado.username;
            return (
              <div key={idx} className={`flex flex-col ${minhaMsg ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-xs p-3 rounded-2xl text-xs shadow-sm ${minhaMsg ? 'bg-blue-600 text-white rounded-br-none' : 'bg-slate-800 text-slate-200 rounded-bl-none'}`}>
                  <p>{msg.texto}</p>
                  <span className="text-[9px] opacity-60 block text-right mt-1">{msg.horario}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={enviar} className="flex gap-2">
        <input 
          type="text" 
          placeholder="Digite sua mensagem..." 
          value={textoMensagem} 
          onChange={(e) => setTextoMensagem(e.target.value)} 
          className={`w-full text-xs rounded-xl px-4 py-3 border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`} 
        />
        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md">
          Enviar
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
        </button>
      </form>
    </div>
  );
}