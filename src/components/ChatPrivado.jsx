import React, { useState, useEffect, useRef } from 'react';
import { BancoDeDados } from '../services/database';

export default function ChatPrivado({ destinatario, usuarioLogado, darkMode, onVerPerfil }) {
  const [mensagens, setMensagens] = useState([]);
  const [textoMensagem, setTextoMensagem] = useState('');
  const [perfilAlvoObj, setPerfilAlvoObj] = useState(null);
  const [perfilLogadoObj, setPerfilLogadoObj] = useState(null);
  const [mostrarEmojis, setMostrarEmojis] = useState(false);
  const [visualizacaoUnica, setVisualizacaoUnica] = useState(false);
  const [enviandoMidia, setEnviandoMidia] = useState(false);
  const [mensagensVisualizadas, setMensagensVisualizadas] = useState({});
  const chatFimRef = useRef(null);

  const emojisLista = [
    '😊', '😂', '❤️', '🔥', '✨', '👏', '🙏', '😍', '🎉', '💡',
    '👍', '😎', '😢', 'ó', '⭐', '🙌', '💪', '🥳', '👇', '🚀',
    '💡', '📖', '🕊️', '✨', '👑', '🔥', '💧', '🌿', '💡', '💬'
  ];

  useEffect(() => {
    async function carregar() {
      const perfis = await BancoDeDados.getPerfisCadastrados();
      const alvo = perfis.find(p => p.username === destinatario);
      const logado = perfis.find(p => p.username === usuarioLogado.username);
      setPerfilAlvoObj(alvo);
      setPerfilLogadoObj(logado);

      const msgs = await BancoDeDados.getMensagensChat(usuarioLogado.username, destinatario);
      setMensagens(msgs || []);
    }
    carregar();

    const intervalo = setInterval(async () => {
      const msgs = await BancoDeDados.getMensagensChat(usuarioLogado.username, destinatario);
      setMensagens(msgs || []);
    }, 3000);

    return () => clearInterval(intervalo);
  }, [destinatario, usuarioLogado]);

  useEffect(() => {
    if (chatFimRef.current) {
      chatFimRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [mensagens]);

  const processarArquivoParaUrl = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(URL.createObjectURL(file));
      reader.readAsDataURL(file);
    });
  };

  const enviar = async (e, arquivoMidia = null, tipoMidia = null) => {
    if (e) e.preventDefault();
    if (!textoMensagem.trim() && !arquivoMidia) return;

    let urlMidia = arquivoMidia;
    if (arquivoMidia && typeof arquivoMidia !== 'string') {
      setEnviandoMidia(true);
      try {
        if (typeof BancoDeDados.uploadMidiaStory === 'function') {
          urlMidia = await BancoDeDados.uploadMidiaStory(arquivoMidia);
        }
      } catch (err) {}
      if (!urlMidia) {
        urlMidia = await processarArquivoParaUrl(arquivoMidia);
      }
      setEnviandoMidia(false);
    }

    const nova = {
      id: Date.now(),
      remetente: usuarioLogado.username,
      destinatario: destinatario,
      texto: textoMensagem.trim() || (tipoMidia === 'video' ? '[Vídeo]' : '[Imagem]'),
      midia: urlMidia || null,
      tipoMidia: tipoMidia || null,
      visualizacaoUnica: visualizacaoUnica,
      horario: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    if (typeof BancoDeDados.enviarMensagemChat === 'function') {
      await BancoDeDados.enviarMensagemChat(nova);
      const msgs = await BancoDeDados.getMensagensChat(usuarioLogado.username, destinatario);
      setMensagens(msgs || []);
    } else {
      setMensagens(prev => [...prev, nova]);
    }

    setTextoMensagem('');
    setVisualizacaoUnica(false);
    setMostrarEmojis(false);
  };

  const lidarComEnvioMidia = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const tipo = file.type.startsWith('video') ? 'video' : 'imagem';
    await enviar(null, file, tipo);
  };

  const apagarMensagemParaTodos = async (msgId) => {
    if (window.confirm('Deseja apagar esta mensagem para todos?')) {
      const novasMensagens = mensagens.filter(m => m.id !== msgId);
      setMensagens(novasMensagens);
    }
  };

  const limparConversa = async () => {
    if (window.confirm('Deseja limpar todo o histórico desta conversa?')) {
      setMensagens([]);
    }
  };

  const fotoPerfilAlvo = perfilAlvoObj?.foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80';
  const fotoPerfilLogado = perfilLogadoObj?.foto || usuarioLogado.foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80';

  const handleAbrirPerfil = () => {
    if (perfilAlvoObj && onVerPerfil) {
      onVerPerfil(perfilAlvoObj);
    }
  };

  return (
    <div className={`p-4 sm:p-6 rounded-3xl border shadow-xl space-y-4 max-w-2xl mx-auto w-full relative ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
      
      {/* Cabeçalho */}
      <div className="flex items-center justify-between border-b pb-3 border-slate-700/30">
        <div 
          onClick={handleAbrirPerfil}
          className="flex items-center gap-3 cursor-pointer group transition hover:opacity-80 min-w-0"
          title="Ver perfil completo"
        >
          <img 
            src={fotoPerfilAlvo} 
            alt="Perfil" 
            className="w-10 h-10 rounded-full object-cover border-2 border-blue-500 shadow-sm flex-shrink-0" 
          />
          <div className="min-w-0">
            <h3 className="font-bold text-sm group-hover:text-blue-500 transition truncate">{perfilAlvoObj?.nome || destinatario}</h3>
            <p className="text-[10px] text-blue-400 font-semibold truncate">@{destinatario}</p>
          </div>
        </div>

        <button 
          onClick={limparConversa}
          className="text-xs font-bold text-red-400 hover:text-red-500 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-xl transition"
          title="Limpar Conversa"
        >
          🗑️ Limpar Conversa
        </button>
      </div>

      {/* Histórico de Mensagens */}
      <div className="h-80 overflow-y-auto space-y-3 p-3 rounded-2xl bg-slate-800/10 border border-slate-700/20 flex flex-col">
        {mensagens.length === 0 ? (
          <p className="text-xs opacity-50 text-center my-auto">Inicie uma conversa em tempo real com @{destinatario}!</p>
        ) : (
          mensagens.map((msg, idx) => {
            const minhaMsg = msg.remetente === usuarioLogado.username;
            const fotoAvatar = minhaMsg ? fotoPerfilLogado : fotoPerfilAlvo;
            const jaViu = mensagensVisualizadas[msg.id];

            return (
              <div key={msg.id || idx} className={`flex items-end gap-2.5 ${minhaMsg ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
                <img src={fotoAvatar} className="w-7 h-7 rounded-full object-cover border border-slate-600 flex-shrink-0 mb-1 shadow-sm" alt="Avatar" />
                
                <div className={`max-w-xs p-3 rounded-2xl text-xs shadow-md space-y-1 relative group ${minhaMsg ? 'bg-blue-600 text-white rounded-br-none' : 'bg-slate-800 text-slate-200 rounded-bl-none'}`}>
                  
                  {/* Tratamento para Visualização Única */}
                  {msg.visualizacaoUnica && !minhaMsg && !jaViu ? (
                    <div 
                      onClick={() => setMensagensVisualizadas(prev => ({ ...prev, [msg.id]: true }))}
                      className="cursor-pointer bg-blue-500/20 border border-blue-400/40 p-2.5 rounded-xl text-center space-y-1 hover:bg-blue-500/30 transition"
                    >
                      <span className="text-sm">👁️ Mídia de Visualização Única</span>
                      <p className="text-[10px] underline font-bold text-blue-300">Clique para ver</p>
                    </div>
                  ) : (
                    <>
                      {msg.midia && (!msg.visualizacaoUnica || minhaMsg || jaViu) ? (
                        msg.tipoMidia === 'video' ? (
                          <video src={msg.midia} controls className="w-48 h-36 object-cover rounded-xl mb-1" />
                        ) : (
                          <img src={msg.midia} alt="Mídia" className="w-48 h-36 object-cover rounded-xl mb-1 shadow-sm" />
                        )
                      ) : null}

                      {(!msg.visualizacaoUnica || minhaMsg || jaViu) && <p className="break-words leading-relaxed">{msg.texto}</p>}
                    </>
                  )}

                  <div className="flex items-center justify-between gap-2 pt-1">
                    {minhaMsg && (
                      <button 
                        onClick={() => apagarMensagemParaTodos(msg.id)}
                        className="text-[9px] opacity-70 hover:opacity-100 text-red-200 hover:underline"
                        title="Apagar para todos"
                      >
                        Apagar
                      </button>
                    )}
                    <span className="text-[9px] opacity-60 ml-auto">{msg.horario}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={chatFimRef} />
      </div>

      {/* Seletor de Emojis Completo */}
      {mostrarEmojis && (
        <div className={`p-3 rounded-2xl border shadow-xl grid grid-cols-10 gap-2 max-h-36 overflow-y-auto ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-300'}`}>
          {emojisLista.map((emoji, i) => (
            <button 
              key={i} 
              type="button" 
              onClick={() => setTextoMensagem(prev => prev + emoji)}
              className="text-xl hover:scale-125 transition text-center p-1"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Caixa de Entrada e Controles */}
      <form onSubmit={(e) => enviar(e)} className="space-y-2">
        <div className="flex items-center gap-2">
          
          {/* Botão de Emojis (Ícone) */}
          <button 
            type="button" 
            onClick={() => setMostrarEmojis(!mostrarEmojis)}
            className={`p-2.5 rounded-xl border transition flex items-center justify-center ${darkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 border-slate-300 hover:bg-slate-200 text-slate-700'}`}
            title="Abrir Emojis"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>

          {/* Botão Único de Mídia (Imagem ou Vídeo) */}
          <label 
            className={`p-2.5 rounded-xl border cursor-pointer transition flex items-center justify-center ${darkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 border-slate-300 hover:bg-slate-200 text-slate-700'}`}
            title="Enviar Imagem ou Vídeo"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <input type="file" accept="image/*,video/*" onChange={lidarComEnvioMidia} className="hidden" />
          </label>

          {/* Input de Texto */}
          <input 
            type="text" 
            placeholder={enviandoMidia ? "Enviando mídia..." : "Digite sua mensagem..."} 
            disabled={enviandoMidia}
            value={textoMensagem} 
            onChange={(e) => setTextoMensagem(e.target.value)} 
            className={`w-full text-xs rounded-xl px-4 py-3 border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`} 
          />

          {/* Botão Enviar */}
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md flex-shrink-0">
            <span>Enviar</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>

        {/* Checkbox de Visualização Única */}
        <div className="flex items-center gap-2 pl-1">
          <input 
            type="checkbox" 
            id="visualizacaoUnicaCheck"
            checked={visualizacaoUnica} 
            onChange={(e) => setVisualizacaoUnica(e.target.checked)} 
            className="w-3.5 h-3.5 rounded border-slate-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
          <label htmlFor="visualizacaoUnicaCheck" className="text-[11px] font-semibold opacity-80 cursor-pointer select-none flex items-center gap-1">
            👁️ Enviar mensagem com visualização única
          </label>
        </div>
      </form>
    </div>
  );
}