import React, { useState, useEffect, useRef } from 'react';
import { BancoDeDados } from '../services/database';

export default function Comunidade({ usuarioLogado, darkMode, onVerPerfil }) {
  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [perfis, setPerfis] = useState([]);
  const [notificacoes, setNotificacoes] = useState([]);
  const [pedidosOracao, setPedidosOracao] = useState([]);
  
  // Estados de modais e abas
  const [modalPublicarAberto, setModalPublicarAberto] = useState(false);
  const [modalStoryAberto, setModalStoryAberto] = useState(false);
  const [modalOracaoAberto, setModalOracaoAberto] = useState(false);
  const [modalNotifAberto, setModalNotifAberto] = useState(false);
  const [abaSolicitacoesAberta, setAbaSolicitacoesAberta] = useState(false);
  
  // Visualização de Story / Chat
  const [storyVisualizando, setStoryVisualizando] = useState(null);
  const [chatAbertoCom, setChatAbertoCom] = useState(null);
  const [mensagensChat, setMensagensChat] = useState([]);
  const [textoChat, setTextoChat] = useState('');
  
  // Criar publicação / Story
  const [textoPublicacao, setTextoPublicacao] = useState('');
  const [temaPublicacao, setTemaPublicacao] = useState('Reflexão');
  const [arquivoStory, setArquivoStory] = useState(null);
  const [textoOracao, setTextoOracao] = useState('');
  const [comentariosInputs, setComentariosInputs] = useState({});
  const [toastMensagem, setToastMensagem] = useState(null);

  const chatFimRef = useRef(null);

  // Lista de reações atualizadas
  const listaReacoesOpcoes = [
    { tipo: 'amei', emoji: '❤️', label: 'Amei' },
    { tipo: 'amem', emoji: '🙏', label: 'Amém' },
    { tipo: 'gloria', emoji: '🙌', label: 'Glória' },
    { tipo: 'parabens', emoji: '👏', label: 'Parabéns' },
    { tipo: 'felicidades', emoji: '✨', label: 'Felicidades' },
  ];

  const mostrarToast = (msg) => {
    setToastMensagem(msg);
    setTimeout(() => setToastMensagem(null), 3000);
  };

  const carregarDados = async () => {
    const [p, s, pe, n, po] = await Promise.all([
      BancoDeDados.getPublicacoes(),
      BancoDeDados.getStories(),
      BancoDeDados.getPerfisCadastrados(),
      usuarioLogado ? BancoDeDados.getNotificacoes(usuarioLogado.username) : Promise.resolve([]),
      BancoDeDados.getPedidosOracao()
    ]);
    setPosts(p || []);
    setStories(s || []);
    setPerfis(pe || []);
    setNotificacoes(n || []);
    setPedidosOracao(po || []);
  };

  useEffect(() => {
    carregarDados();
    const intervalo = setInterval(carregarDados, 5000);
    return () => clearInterval(intervalo);
  }, [usuarioLogado]);

  useEffect(() => {
    if (chatAbertoCom) {
      const carregarChat = async () => {
        const msgs = await BancoDeDados.getMensagensChat(usuarioLogado.username, chatAbertoCom.username);
        setMensagensChat(msgs);
        chatFimRef.current?.scrollIntoView({ behavior: 'smooth' });
      };
      carregarChat();
      const intervaloChat = setInterval(carregarChat, 3000);
      return () => clearInterval(intervaloChat);
    }
  }, [chatAbertoCom, usuarioLogado]);

  // Publicar post
  const handleCriarPublicacao = async (e) => {
    e.preventDefault();
    if (!textoPublicacao.trim()) return;

    const novaPub = {
      id: Date.now(),
      username: usuarioLogado.username,
      autor: usuarioLogado.nome,
      avatar: usuarioLogado.foto,
      tema: temaPublicacao,
      texto: textoPublicacao,
      curtidas: 0,
      reacoes: { amei: [], amem: [], gloria: [], parabens: [], felicidades: [] },
      comentarios: []
    };

    const atualizados = await BancoDeDados.salvarPublicacao(novaPub);
    setPosts(atualizados);
    setTextoPublicacao('');
    setModalPublicarAberto(false);
    mostrarToast('Publicação compartilhada com sucesso!');
  };

  const reagir = async (postId, tipoReacao) => {
    const atualizados = await BancoDeDados.reagirPublicacao(postId, tipoReacao, usuarioLogado.username);
    setPosts(atualizados);
  };

  const comentar = async (postId) => {
    const texto = comentariosInputs[postId];
    if (!texto || !texto.trim()) return;

    const novoComentario = {
      id: Date.now(),
      username: usuarioLogado.username,
      autor: usuarioLogado.nome,
      avatar: usuarioLogado.foto,
      texto,
      reacoes: { amei: [], amem: [], gloria: [], parabens: [], felicidades: [] }
    };

    const atualizados = await BancoDeDados.adicionarComentarioPub(postId, novoComentario);
    setPosts(atualizados);
    setComentariosInputs({ ...comentariosInputs, [postId]: '' });
  };

  // Enviar Story
  const handleEnviarStory = async (e) => {
    e.preventDefault();
    if (!arquivoStory) return;

    const urlMidia = await BancoDeDados.uploadMidiaStory(arquivoStory);
    if (!urlMidia) {
      mostrarToast('Erro ao enviar mídia do story.');
      return;
    }

    const novoStory = {
      id: Date.now(),
      username: usuarioLogado.username,
      autor: usuarioLogado.nome,
      avatar: usuarioLogado.foto,
      midia: urlMidia,
      tipo_midia: arquivoStory.type.startsWith('video') ? 'video' : 'imagem'
    };

    const atualizados = await BancoDeDados.salvarStory(novoStory);
    setStories(atualizados);
    setArquivoStory(null);
    setModalStoryAberto(false);
    mostrarToast('Story publicado!');
  };

  // Enviar Mensagem de Chat
  const enviarMensagem = async (e) => {
    e.preventDefault();
    if (!textoChat.trim() || !chatAbertoCom) return;

    const novaMsg = {
      id: Date.now(),
      remetente: usuarioLogado.username,
      destinatario: chatAbertoCom.username,
      texto: textoChat,
      horario: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    await BancoDeDados.enviarMensagemChat(novaMsg);
    setTextoChat('');
    const msgs = await BancoDeDados.getMensagensChat(usuarioLogado.username, chatAbertoCom.username);
    setMensagensChat(msgs);
  };

  const meuPerfilBanco = perfis.find(p => p.username === usuarioLogado?.username) || usuarioLogado;
  const pedidosRecebidos = meuPerfilBanco?.pedidos_recebidos || [];

  return (
    <div className={`w-screen relative left-1/2 -translate-x-1/2 px-4 sm:px-8 lg:px-12 py-6 space-y-6 overflow-x-hidden box-border ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
      
      {/* Toast de Notificação flutuante */}
      {toastMensagem && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="bg-slate-900 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-2.5 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{toastMensagem}</span>
          </div>
        </div>
      )}

      {/* CABEÇALHO DA COMUNIDADE LIMPO (Sem duplicações) */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 relative">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
            Luz do Mundo <span className="text-blue-500">✨</span>
          </h2>
        </div>

        <div className="flex items-center gap-3">
          {pedidosRecebidos.length > 0 && (
            <button 
              onClick={() => setAbaSolicitacoesAberta(true)}
              className="px-3 py-1.5 rounded-xl bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm animate-bounce cursor-pointer"
            >
              👥 Solicitações ({pedidosRecebidos.length})
            </button>
          )}

          <button
            onClick={() => setModalPublicarAberto(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md transition cursor-pointer flex items-center gap-2"
          >
            <span>✏️</span> Escrever Publicação
          </button>
        </div>
      </div>

      {/* STORIES */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
        {/* Criar Story */}
        <div 
          onClick={() => setModalStoryAberto(true)}
          className={`flex-shrink-0 w-20 h-32 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:scale-105 transition ${darkMode ? 'border-slate-700 bg-slate-900/40 text-slate-400' : 'border-slate-300 bg-white text-slate-600'}`}
        >
          <span className="text-2xl mb-1">➕</span>
          <span className="text-[10px] font-bold">Meu Story</span>
        </div>

        {stories.map((s) => (
          <div 
            key={s.id}
            onClick={() => setStoryVisualizando(s)}
            className={`flex-shrink-0 w-20 h-32 rounded-2xl relative overflow-hidden cursor-pointer border-2 border-blue-500 shadow-md hover:scale-105 transition`}
          >
            {s.tipo_midia === 'video' ? (
              <video src={s.midia} className="w-full h-full object-cover" />
            ) : (
              <img src={s.midia} alt="Story" className="w-full h-full object-cover" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-2">
              <p className="text-[10px] text-white font-bold truncate">@{s.username}</p>
            </div>
          </div>
        ))}
      </div>

      {/* GRID PRINCIPAL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUNA ESQUERDA/CENTRAL: PUBLICAÇÕES */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wider opacity-60">Feed da Comunidade</h3>
          
          {posts.length === 0 ? (
            <div className={`p-8 text-center rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'}`}>
              <p className="text-sm">Nenhuma publicação por enquanto. Seja o primeiro a compartilhar!</p>
            </div>
          ) : (
            posts.map((post) => {
              const reacoesPost = post.reacoes || {};
              const totalReacoesGeral = Object.values(reacoesPost).reduce((acc, lista) => acc + (lista ? lista.length : 0), 0);

              return (
                <div key={post.id} className={`p-5 rounded-3xl border shadow-xs space-y-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                  
                  {/* Cabeçalho do Post */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => onVerPerfil(post.username)}>
                      <img src={post.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'} alt="Avatar" className="w-10 h-10 rounded-full object-cover border border-blue-500" />
                      <div>
                        <h4 className="text-xs font-bold">{post.autor}</h4>
                        <p className="text-[10px] text-blue-400">@{post.username} • <span className="opacity-75">{post.tema}</span></p>
                      </div>
                    </div>
                  </div>

                  {/* Conteúdo */}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.texto}</p>

                  {/* Contador de Reações */}
                  {totalReacoesGeral > 0 && (
                    <div className="flex items-center gap-1 text-xs opacity-75 pt-1">
                      <span>❤️ 🙏 🙌</span>
                      <span className="font-bold">{totalReacoesGeral} reações</span>
                    </div>
                  )}

                  {/* Ações / Reações Estilo Facebook com Ponte de Hover Corrigida */}
                  <div className="flex items-center gap-4 pt-2 border-t border-slate-700/30">
                    
                    <div className="relative group/reacoes inline-block py-2 -my-2">
                      {(() => {
                        let minhaReacaoTipo = null;
                        for (const tipo of Object.keys(reacoesPost)) {
                          if ((reacoesPost[tipo] || []).includes(usuarioLogado.username)) {
                            minhaReacaoTipo = tipo;
                            break;
                          }
                        }
                        const dadosReacaoAtual = listaReacoesOpcoes.find(r => r.tipo === minhaReacaoTipo);

                        return (
                          <div className="relative">
                            <button 
                              onClick={() => reagir(post.id, minhaReacaoTipo ? minhaReacaoTipo : 'amei')}
                              className={`text-xs px-3.5 py-2 rounded-xl font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                                minhaReacaoTipo 
                                  ? 'bg-blue-600 text-white border-blue-500 shadow-sm' 
                                  : darkMode ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700' : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50 shadow-xs'
                              }`}
                            >
                              <span className="text-sm">{dadosReacaoAtual ? dadosReacaoAtual.emoji : '❤️'}</span>
                              <span>{dadosReacaoAtual ? dadosReacaoAtual.label : 'Amei'}</span>
                            </button>

                            {/* Menu Flutuante com Padding de aproximação para não sumir */}
                            <div className="absolute bottom-full left-0 pb-2 hidden group-hover/reacoes:flex z-50">
                              <div className="flex items-center gap-2 bg-slate-900/95 border border-slate-700 px-3 py-2 rounded-full shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
                                {listaReacoesOpcoes.map((r) => (
                                  <button
                                    key={r.tipo}
                                    onClick={() => reagir(post.id, r.tipo)}
                                    className="w-9 h-9 rounded-full flex items-center justify-center text-xl hover:scale-125 transition-transform duration-200 cursor-pointer"
                                    title={r.label}
                                  >
                                    {r.emoji}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                  </div>

                  {/* Seção de Comentários */}
                  <div className="space-y-3 pt-2">
                    {(post.comentarios || []).map((com) => (
                      <div key={com.id} className={`p-3 rounded-2xl text-xs space-y-1 ${darkMode ? 'bg-slate-800/60' : 'bg-slate-100'}`}>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-blue-400">@{com.username}</span>
                        </div>
                        <p className="leading-relaxed">{com.texto}</p>
                      </div>
                    ))}

                    <div className="flex gap-2 pt-1">
                      <input 
                        type="text" 
                        placeholder="Escreva um comentário edificante..." 
                        value={comentariosInputs[post.id] || ''}
                        onChange={(e) => setComentariosInputs({ ...comentariosInputs, [post.id]: e.target.value })}
                        className={`flex-1 text-xs px-3 py-2 rounded-xl border focus:outline-none ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`}
                      />
                      <button 
                        onClick={() => comentar(post.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2 rounded-xl font-bold transition cursor-pointer"
                      >
                        Enviar
                      </button>
                    </div>
                  </div>

                </div>
              );
            })
          )}
        </div>

        {/* COLUNA DIREITA: MEMBROS / AMIGOS / PEDIDOS DE ORAÇÃO */}
        <div className="space-y-6">
          
          {/* Pedidos de Oração */}
          <div className={`p-5 rounded-3xl border shadow-xs space-y-3 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-500">🙏 Mural de Orações</h3>
              <button onClick={() => setModalOracaoAberto(true)} className="text-xs text-blue-400 hover:underline cursor-pointer font-bold">+ Pedir Oração</button>
            </div>
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {pedidosOracao.map((po) => (
                <div key={po.id} className={`p-3 rounded-2xl text-xs space-y-1 ${darkMode ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                  <p className="font-bold text-blue-400">@{(po.username || po.autor)}</p>
                  <p className="italic">"{po.texto}"</p>
                </div>
              ))}
            </div>
          </div>

          {/* Membros Cadastrados / Chat */}
          <div className={`p-5 rounded-3xl border shadow-xs space-y-3 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <h3 className="text-xs font-extrabold uppercase tracking-wider opacity-60">Irmãos na Fé</h3>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {perfis.filter(p => p.username !== usuarioLogado.username).map((p) => (
                <div key={p.id || p.username} className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onVerPerfil(p.username)}>
                    <img src={p.foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'} alt="Avatar" className="w-8 h-8 rounded-full object-cover" />
                    <div>
                      <p className="text-xs font-bold">{p.nome}</p>
                      <p className="text-[10px] text-blue-400">@{p.username}</p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => setChatAbertoCom(p)}
                    className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-xl font-bold transition cursor-pointer"
                  >
                    💬 Chat
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* MODAL CRIAR PUBLICAÇÃO */}
      {modalPublicarAberto && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className={`w-full max-w-lg p-6 rounded-3xl border shadow-2xl space-y-4 ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <h3 className="text-sm font-black uppercase tracking-wider">Escrever Publicação</h3>
            
            <form onSubmit={handleCriarPublicacao} className="space-y-4">
              <select 
                value={temaPublicacao} 
                onChange={(e) => setTemaPublicacao(e.target.value)}
                className={`w-full text-xs font-bold px-3 py-2.5 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-100 border-slate-300'}`}
              >
                <option value="Reflexão">Reflexão</option>
                <option value="Testemunho">Testemunho</option>
                <option value="Louvor">Louvor</option>
                <option value="Versículo">Versículo</option>
              </select>

              <textarea 
                rows="4" 
                placeholder="Compartilhe o que Deus falou ao seu coração..." 
                value={textoPublicacao} 
                onChange={(e) => setTextoPublicacao(e.target.value)}
                className={`w-full text-xs p-3 rounded-xl border focus:outline-none ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-100 border-slate-300'}`}
              />

              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setModalPublicarAberto(false)} className="text-xs px-4 py-2 opacity-70 cursor-pointer">Cancelar</button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-5 py-2 rounded-xl font-bold cursor-pointer">Publicar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CRIAR STORY */}
      {modalStoryAberto && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className={`w-full max-w-sm p-6 rounded-3xl border shadow-2xl space-y-4 ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <h3 className="text-sm font-black uppercase tracking-wider">Publicar Story</h3>
            
            <form onSubmit={handleEnviarStory} className="space-y-4">
              <input 
                type="file" 
                accept="image/*,video/*"
                onChange={(e) => setArquivoStory(e.target.files[0])}
                className={`w-full text-xs p-2 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-100 border-slate-300'}`}
              />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setModalStoryAberto(false)} className="text-xs px-4 py-2 opacity-70 cursor-pointer">Cancelar</button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-5 py-2 rounded-xl font-bold cursor-pointer">Enviar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CHAT */}
      {chatAbertoCom && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className={`w-full max-w-md h-[500px] flex flex-col rounded-3xl border shadow-2xl overflow-hidden ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            
            <div className="p-4 border-b border-slate-700/50 flex items-center justify-between bg-slate-800/50">
              <div className="flex items-center gap-2">
                <img src={chatAbertoCom.foto} alt="Avatar" className="w-8 h-8 rounded-full object-cover" />
                <span className="text-xs font-bold">{chatAbertoCom.nome}</span>
              </div>
              <button onClick={() => setChatAbertoCom(null)} className="text-xs font-bold px-2 py-1 cursor-pointer">✕</button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {mensagensChat.map((m) => {
                const meu = m.remetente === usuarioLogado.username;
                return (
                  <div key={m.id} className={`flex flex-col ${meu ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[75%] p-3 rounded-2xl text-xs ${meu ? 'bg-blue-600 text-white' : darkMode ? 'bg-slate-800 text-slate-100' : 'bg-slate-200 text-slate-900'}`}>
                      <p>{m.texto}</p>
                      <span className="text-[9px] opacity-75 mt-1 block text-right">{m.horario}</span>
                    </div>
                  </div>
                );
              })}
              <div ref={chatFimRef} />
            </div>

            <form onSubmit={enviarMensagem} className="p-3 border-t border-slate-700/50 flex gap-2 bg-slate-800/30">
              <input 
                type="text" 
                placeholder="Escreva sua mensagem..." 
                value={textoChat}
                onChange={(e) => setTextoChat(e.target.value)}
                className={`flex-1 text-xs px-3 py-2 rounded-xl border focus:outline-none ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300'}`}
              />
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2 rounded-xl font-bold cursor-pointer">Enviar</button>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}