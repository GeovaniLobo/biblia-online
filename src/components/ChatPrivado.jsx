import React, { useState, useEffect } from 'react';

export default function ChatPrivado({ destinatario, usuarioLogado, darkMode }) {
  const [mensagens, setMensagens] = useState([]);
  const [texto, setTexto] = useState('');

  // Chave única para salvar as mensagens entre estes dois usuários no localStorage
  const obterChaveChat = () => {
    const usuarios = [usuarioLogado.username, destinatario].sort();
    return `chat_${usuarios[0]}_${usuarios[1]}`;
  };

  useEffect(() => {
    const carregarMensagens = () => {
      const salvo = localStorage.getItem(obterChaveChat());
      if (salvo) {
        setMensagens(JSON.parse(salvo));
      } else {
        setMensagens([]);
      }
    };

    carregarMensagens();

    // Atualiza periodicamente para simular tempo real
    const intervalo = setInterval(carregarMensagens, 1500);
    return () => clearInterval(intervalo);
  }, [destinatario, usuarioLogado.username]);

  const enviarMensagem = (e) => {
    e.preventDefault();
    if (!texto.trim()) return;

    const novaMensagem = {
      id: Date.now(),
      remetente: usuarioLogado.username,
      texto: texto.trim(),
      horario: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const atualizadas = [...mensagens, novaMensagem];
    setMensagens(atualizadas);
    localStorage.setItem(obterChaveChat(), JSON.stringify(atualizadas));
    setTexto('');
  };

  return (
    <div className={`flex flex-col h-[75vh] rounded-2xl border shadow-md overflow-hidden ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
      
      {/* Cabeçalho do Chat */}
      <div className={`p-4 border-b flex items-center gap-3 ${darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white text-sm">
          {destinatario.charAt(0).toUpperCase()}
        </div>
        <div>
          <h3 className="text-sm font-bold">@{destinatario}</h3>
          <p className="text-[10px] text-emerald-500 font-semibold">● Online na Comunidade</p>
        </div>
      </div>

      {/* Lista de Mensagens */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {mensagens.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-50 space-y-1">
            <p className="text-xs">Nenhuma mensagem ainda.</p>
            <p className="text-[10px]">Envie uma saudação para iniciar a conversa!</p>
          </div>
        ) : (
          mensagens.map((msg) => {
            const souEu = msg.remetente === usuarioLogado.username;
            return (
              <div key={msg.id} className={`flex ${souEu ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] p-3 rounded-2xl text-xs space-y-1 shadow-sm ${souEu ? 'bg-blue-600 text-white rounded-br-xs' : darkMode ? 'bg-slate-800 text-slate-200 rounded-bl-xs' : 'bg-slate-100 text-slate-800 rounded-bl-xs'}`}>
                  <p className="leading-relaxed break-words">{msg.texto}</p>
                  <span className={`block text-[9px] text-right ${souEu ? 'text-blue-200' : 'opacity-40'}`}>{msg.horario}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Formulário de Envio */}
      <form onSubmit={enviarMensagem} className={`p-3 border-t flex gap-2 ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
        <input
          type="text"
          placeholder="Digite sua mensagem..."
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          className={`flex-1 text-xs rounded-xl px-4 py-3 border focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300'}`}
        />
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-3 rounded-xl text-xs transition shadow-md"
        >
          Enviar 🚀
        </button>
      </form>

    </div>
  );
}