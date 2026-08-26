import React, { useState, useEffect, useRef } from 'react';
import { BancoDeDados } from '../services/database';

export default function ChatPrivado({ destinatario, usuarioLogado, darkMode }) {
  const [mensagens, setMensagens] = useState(BancoDeDados.getMensagensChat(usuarioLogado.nome, destinatario));
  const [textoInput, setTextoInput] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  const enviarTexto = (e) => {
    e.preventDefault();
    if (!textoInput.trim()) return;
    const atualizadas = BancoDeDados.enviarMensagemChat(usuarioLogado.nome, destinatario, textoInput.trim(), 'texto');
    setMensagens([...atualizadas]);
    setTextoInput('');
  };

  const enviarMidia = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const atualizadas = BancoDeDados.enviarMensagemChat(usuarioLogado.nome, destinatario, reader.result, 'midia');
        setMensagens([...atualizadas]);
      };
      reader.readAsDataURL(file);
    }
  };

  const adicionarEmoji = (emoji) => {
    setTextoInput(prev => prev + emoji);
  };

  return (
    <div className={`flex flex-col h-[75vh] max-w-3xl mx-auto rounded-2xl border shadow-md overflow-hidden ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
      
      {/* CABEÇALHO DO CHAT */}
      <div className={`p-4 border-b flex items-center gap-3 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
        <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center">
          {destinatario[0]}
        </div>
        <div>
          <h3 className="text-sm font-bold">{destinatario}</h3>
          <span className="text-[10px] text-emerald-500 font-semibold">● Online na Comunidade</span>
        </div>
      </div>

      {/* CORPO DAS MENSAGENS */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {mensagens.length === 0 ? (
          <p className="text-center text-xs opacity-50 mt-10">Envie a primeira mensagem para iniciar a conversa com {destinatario}!</p>
        ) : (
          mensagens.map((msg) => {
            const souEu = msg.remetente === usuarioLogado.nome;
            return (
              <div key={msg.id} className={`flex flex-col ${souEu ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-xs md:max-w-md p-3 rounded-2xl text-xs space-y-2 ${souEu ? 'bg-blue-600 text-white rounded-br-none' : darkMode ? 'bg-slate-800 text-slate-200 rounded-bl-none' : 'bg-slate-100 text-slate-800 rounded-bl-none'}`}>
                  {msg.tipo === 'midia' ? (
                    <img src={msg.conteudo} alt="Mídia enviada" className="w-full h-48 object-cover rounded-xl" />
                  ) : (
                    <p className="leading-relaxed">{msg.conteudo}</p>
                  )}
                  <span className={`block text-[9px] text-right opacity-70`}>{msg.horario}</span>
                </div>
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      {/* BARRA DE EMOJIS RÁPIDOS */}
      <div className={`px-4 py-1.5 border-t flex gap-2 text-base ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
        {['😊', '🙏', '❤️', '🔥', '📖', '✨', '🙌', '👍'].map(emoji => (
          <button key={emoji} type="button" onClick={() => adicionarEmoji(emoji)} className="hover:scale-125 transition">
            {emoji}
          </button>
        ))}
      </div>

      {/* INPUT DE ENVIO */}
      <form onSubmit={enviarTexto} className={`p-3 border-t flex items-center gap-2 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <label className="cursor-pointer text-slate-400 hover:text-blue-500 transition px-2">
          📎
          <input type="file" accept="image/*,video/*" onChange={enviarMidia} className="hidden" />
        </label>

        <input
          type="text"
          placeholder="Escreva uma mensagem..."
          value={textoInput}
          onChange={(e) => setTextoInput(e.target.value)}
          className={`flex-1 text-xs rounded-xl px-3 py-2.5 border focus:outline-none ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`}
        />

        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-5 py-2.5 rounded-xl font-bold transition shadow-sm">
          Enviar
        </button>
      </form>

    </div>
  );
}