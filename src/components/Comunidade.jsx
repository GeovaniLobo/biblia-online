import React, { useState, useEffect, useRef } from 'react';
import { BancoDeDados } from '../services/database';
import PerfilPublico from './PerfilPublico';
import ChatPrivado from './ChatPrivado';

export default function Comunidade({ usuarioLogado, darkMode, onVerPerfil }) {
  const [publicacoes, setPublicacoes] = useState([]);
  const [perfisReais, setPerfisReais] = useState([]);
  const [notificacoes, setNotificacoes] = useState([]);
  const [pedidosOracao, setPedidosOracao] = useState([]);
  const [stories, setStories] = useState([]);
  
  const [carregandoComunidade, setCarregandoComunidade] = useState(true);
  const [perfilSelecionado, setPerfilSelecionado] = useState(null);
  const [chatComUsuario, setChatComUsuario] = useState(null);
  
  // Estados do Visualizador de Story com Timer
  const [storyVisualizando, setStoryVisualizando] = useState(null);
  const [progressoStory, setProgressoStory] = useState(0);
  const timerRef = useRef(null);

  // Estados do Modal de Criar Story
  const [modalCriarStoryAberto, setModalCriarStoryAberto] = useState(false);
  const [tipoStoryCriacao, setTipoStoryCriacao] = useState('texto'); // 'texto', 'midia'
  const [textoStory, setTextoStory] = useState('');
  const [corFundoStory, setCorFundoStory] = useState('#2563eb');
  const [midiaStoryUrl, setMidiaStoryUrl] = useState('');
  const [tipoMidia, setTipoMidia] = useState('imagem'); // 'imagem', 'video'

  // Estados de Busca e Criação de Posts
  const [termoBuscaComunidade, setTermoBuscaComunidade] = useState('');
  const [novoComentario, setNovoComentario] = useState({});
  const [pubTexto, setPubTexto] = useState('');
  const [pubImagem, setPubImagem] = useState('');
  const [pubTema, setPubTema] = useState('');

  const [postEditandoId, setPostEditandoId] = useState(null);
  const [textoEditado, setTextoEditado] = useState('');
  const [temaEditado, setTemaEditado] = useState('');
  const [novoPedidoTexto, setNovoPedidoTexto] = useState('');

  useEffect(() => {
    async function carregarDadosIniciais() {
      try {
        await BancoDeDados.salvarNovoPerfilNaRede({
          username: usuarioLogado.username,
          senha: usuarioLogado.senha,
          nome: usuarioLogado.nome,
          biografia: usuarioLogado.biografia || '',
          foto: usuarioLogado.foto || '',
          data_nascimento: usuarioLogado.dataNascimento || ''
        });

        const perfis = await BancoDeDados.getPerfisCadastrados();
        const pubs = await BancoDeDados.getPublicacoes();
        const notifs = await BancoDeDados.getNotificacoes(usuarioLogado.username);
        const pedidos = await BancoDeDados.getPedidosOracao();
        const strs = await BancoDeDados.getStories();

        setPerfisReais(perfis || []);
        setPublicacoes(pubs || []);
        setNotificacoes(notifs || []);
        setPedidosOracao(pedidos || []);
        setStories(strs || []);
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
      } finally {
        setCarregandoComunidade(false);
      }
    }

    carregarDadosIniciais();

    const intervalo = setInterval(async () => {
      try {
        const pubs = await BancoDeDados.getPublicacoes();
        const notifs = await BancoDeDados.getNotificacoes(usuarioLogado.username);
        const perfis = await BancoDeDados.getPerfisCadastrados();
        const pedidos = await BancoDeDados.getPedidosOracao();
        const strs = await BancoDeDados.getStories();

        setPublicacoes(pubs || []);
        setNotificacoes(notifs || []);
        setPerfisReais(perfis || []);
        setPedidosOracao(pedidos || []);
        setStories(strs || []);
      } catch (e) {}
    }, 4000);

    return () => clearInterval(intervalo);
  }, [usuarioLogado]);

  // Gerenciamento do Timer e Barra de Progresso do Story em Exibição
  useEffect(() => {
    if (!storyVisualizando) {
      setProgressoStory(0);
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    setProgressoStory(0);
    // Story de vídeo dura 60s (1min), imagem/texto dura 20s
    const duracaoTotalMs = storyVisualizando.tipo === 'video' ? 60000 : 20000;
    const intervaloMs = 100;
    const incrementoPorPasso = (100 / (duracaoTotalMs / intervaloMs));

    timerRef.current = setInterval(() => {
      setProgressoStory((prev) => {
        if (prev >= 100) {
          clearInterval(timerRef.current);
          setStoryVisualizando(null);
          return 100;
        }
        return prev + incrementoPorPasso;
      });
    }, intervaloMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [storyVisualizando]);

  const perfilAtualNoBanco = perfisReais.find(p => p.username === usuarioLogado.username) || { amigos: [], pedidos_enviados: [], pedidos_recebidos: [] };

  const abrirChatComAmigo = async (usernameAmigo) => {
    setChatComUsuario(usernameAmigo);
    await BancoDeDados.marcarNotificacoesLidas(usuarioLogado.username);
    const notifsAtualizadas = await BancoDeDados.getNotificacoes(usuarioLogado.username);
    setNotificacoes(notifsAtualizadas || []);
  };

  const salvarStoryBanco = async (tipo, conteudo, corFundo = '#2563eb') => {
    const novoStory = {
      id: Date.now(),
      username: usuarioLogado.username,
      autor: usuarioLogado.nome,
      avatar: usuarioLogado.foto,
      tipo, // 'texto', 'imagem', 'video'
      conteudo,
      cor_fundo: corFundo
    };
    const atualizados = await BancoDeDados.salvarStory(novoStory);
    setStories(atualizados || []);
    setModalCriarStoryAberto(false);
    setTextoStory('');
    setMidiaStoryUrl('');
  };

  const compartilharPostNoStory = (post) => {
    const conteudoStory = post.imagem || post.texto;
    const tipo = post.imagem ? 'imagem' : 'texto';
    salvarStoryBanco(tipo, conteudoStory, '#1e293b');
    alert('Publicação compartilhada com sucesso nos seus Stories! 🚀');
  };

  const publicarPost = async (e) => {
    e.preventDefault();
    if (!pubTexto.trim() && !pubImagem) return;
    const novoPost = {
      id: Date.now(),
      autor: usuarioLogado.nome,
      username: usuarioLogado.username,
      avatar: usuarioLogado.foto,
      tema: pubTema.trim() || 'Publicação',
      texto: pubTexto.trim(),
      imagem: pubImagem,
      curtidas: 0,
      reacoes: { amem: [], gloria: [], amor: [] },
      comentarios: []
    };
    const atualizados = await BancoDeDados.salvarPublicacao(novoPost);
    setPublicacoes([...atualizados]);
    setPubTexto('');
    setPubImagem('');
    setPubTema('');
  };

  const excluirPost = async (id) => {
    if (window.confirm('Deseja realmente excluir esta publicação?')) {
      const atualizados = await BancoDeDados.excluirPublicacao(id);
      setPublicacoes([...atualizados]);
    }
  };

  const salvarEdicaoPost = async (id) => {
    const atualizados = await BancoDeDados.atualizarPublicacao(id, textoEditado, temaEditado);
    setPublicacoes([...atualizados]);
    setPostEditandoId(null);
  };

  const reagir = async (id, tipoReacao) => {
    const atualizados = await BancoDeDados.reagirPublicacao(id, tipoReacao, usuarioLogado.username);
    setPublicacoes([...atualizados]);
  };

  const comentar = async (id, usernameAutorPost, e) => {
    e.preventDefault();
    const texto = novoComentario[id];
    if (!texto || !texto.trim()) return;
    const comentarioObj = { autor: usuarioLogado.nome, username: usuarioLogado.username, texto: texto.trim() };
    const atualizados = await BancoDeDados.adicionarComentarioPub(id, comentarioObj, usernameAutorPost);
    setPublicacoes([...atualizados]);
    setNovoComentario({ ...novoComentario, [id]: '' });
    if (usuarioLogado.username !== usernameAutorPost) {
      await BancoDeDados.adicionarNotificacao(usernameAutorPost, `@${usuarioLogado.username} comentou na sua publicação.`, 'comentario');
    }
  };

  const criarPedidoOracao = async (e) => {
    e.preventDefault();
    if (!novoPedidoTexto.trim()) return;
    const pedido = {
      id: Date.now(),
      autor: usuarioLogado.nome,
      username: usuarioLogado.username,
      texto: novoPedidoTexto.trim(),
      apoios: 0
    };
    const atualizados = await BancoDeDados.salvarPedidoOracao(pedido);
    setPedidosOracao(atualizados || []);
    setNovoPedidoTexto('');
  };

  if (carregandoComunidade) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-xs opacity-60 animate-pulse">Carregando comunidade...</p>
      </div>
    );
  }

  if (perfilSelecionado) {
    return (
      <PerfilPublico
        perfilAlvo={perfilSelecionado}
        usuarioLogado={usuarioLogado}
        onVoltar={() => setPerfilSelecionado(null)}
        darkMode={darkMode}
      />
    );
  }

  const amigosLista = perfisReais.filter(p => (perfilAtualNoBanco.amigos || []).includes(p.username));
  const outrosUsuarios = perfisReais.filter(p => p.username !== usuarioLogado.username && !(perfilAtualNoBanco.amigos || []).includes(p.username));

  const publicacoesFiltradas = publicacoes.filter(post => {
    if (!termoBuscaComunidade.trim()) return true;
    const termo = termoBuscaComunidade.toLowerCase();
    return (post.tema || '').toLowerCase().includes(termo) || (post.texto || '').toLowerCase().includes(termo) || (post.autor || '').toLowerCase().includes(termo);
  });

  const membrosFiltrados = outrosUsuarios.filter(membro => {
    if (!termoBuscaComunidade.trim()) return true;
    const termo = termoBuscaComunidade.toLowerCase();
    return membro.nome.toLowerCase().includes(termo) || membro.username.toLowerCase().includes(termo);
  });

  // Stories do usuário logado e mapa de stories únicos por autor
  const meusStories = stories.filter(s => s.username === usuarioLogado.username);
  const temStoryAtivo = meusStories.length > 0;

  const usuariosComStoriesMap = {};
  stories.forEach(st => {
    if (!usuariosComStoriesMap[st.username]) {
      usuariosComStoriesMap[st.username] = st;
    }
  });
  const listaStoriesUnicos = Object.values(usuariosComStoriesMap);

  return (
    <div className={`w-full px-4 sm:px-6 lg:px-10 py-6 space-y-6 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
      
      {/* ================= MODAL DE CRIAÇÃO DE STORY ================= */}
      {modalCriarStoryAberto && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className={`max-w-md w-full p-6 rounded-3xl shadow-2xl border space-y-4 ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-base">✨ Criar Novo Story</h3>
              <button onClick={() => setModalCriarStoryAberto(false)} className="text-sm font-bold opacity-70 hover:opacity-100">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-slate-800 p-1 rounded-xl">
              <button onClick={() => setTipoStoryCriacao('texto')} className={`py-2 text-xs font-bold rounded-lg transition ${tipoStoryCriacao === 'texto' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>Story de Texto</button>
              <button onClick={() => setTipoStoryCriacao('midia')} className={`py-2 text-xs font-bold rounded-lg transition ${tipoStoryCriacao === 'midia' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>Foto / Vídeo / Câmera</button>
            </div>

            {tipoStoryCriacao === 'texto' ? (
              <div className="space-y-4">
                <div 
                  className="w-full h-64 rounded-2xl p-6 flex items-center justify-center text-center shadow-inner transition"
                  style={{ backgroundColor: corFundoStory }}
                >
                  <textarea 
                    rows="4"
                    placeholder="Digite sua mensagem para o story..."
                    value={textoStory}
                    onChange={(e) => setTextoStory(e.target.value)}
                    className="w-full bg-transparent text-white placeholder-white/70 text-lg font-bold text-center focus:outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold opacity-70 block mb-2">Escolha a cor de fundo:</label>
                  <div className="flex gap-2">
                    {['#2563eb', '#7c3aed', '#db2777', '#059669', '#d97706', '#1e293b'].map(cor => (
                      <button 
                        key={cor} 
                        onClick={() => setCorFundoStory(cor)}
                        className={`w-8 h-8 rounded-full border-2 transition ${corFundoStory === cor ? 'border-white scale-110 shadow-md' : 'border-transparent'}`}
                        style={{ backgroundColor: cor }}
                      />
                    ))}
                  </div>
                </div>

                <button 
                  onClick={() => { if(textoStory.trim()) salvarStoryBanco('texto', textoStory, corFundoStory); }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-3 rounded-xl shadow-md transition"
                >
                  Publicar Story de Texto 🚀
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-slate-700 rounded-2xl p-6 text-center space-y-3">
                  {midiaStoryUrl ? (
                    tipoMidia === 'video' ? (
                      <video src={midiaStoryUrl} controls className="w-full h-48 object-cover rounded-xl" />
                    ) : (
                      <img src={midiaStoryUrl} alt="Preview" className="w-full h-48 object-cover rounded-xl" />
                    )
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs opacity-60">Selecione um arquivo ou grave direto da câmera:</p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        <label className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer shadow-sm">
                          📁 Enviar Arquivo (Foto/Vídeo)
                          <input 
                            type="file" 
                            accept="image/*,video/*" 
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                setTipoMidia(file.type.startsWith('video') ? 'video' : 'imagem');
                                const reader = new FileReader();
                                reader.onloadend = () => setMidiaStoryUrl(reader.result);
                                reader.readAsDataURL(file);
                              }
                            }} 
                            className="hidden" 
                          />
                        </label>

                        <label className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer shadow-sm">
                          📹 Gravar da Câmera
                          <input 
                            type="file" 
                            accept="video/*" 
                            capture="environment" 
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                setTipoMidia('video');
                                const reader = new FileReader();
                                reader.onloadend = () => setMidiaStoryUrl(reader.result);
                                reader.readAsDataURL(file);
                              }
                            }} 
                            className="hidden" 
                          />
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                {midiaStoryUrl && (
                  <button 
                    onClick={() => salvarStoryBanco(tipoMidia, midiaStoryUrl)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-3 rounded-xl shadow-md transition"
                  >
                    Publicar Mídia nos Stories 🚀
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= VISUALIZADOR DE STORY EM TELA CHEIA ================= */}
      {storyVisualizando && (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4">
          <div className="relative max-w-md w-full h-[82vh] bg-slate-900 rounded-3xl overflow-hidden flex flex-col shadow-2xl border border-slate-800">
            
            {/* BARRA DE PROGRESSO NO TOPO */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-700 z-20">
              <div 
                className="h-full bg-blue-500 transition-all duration-100 ease-linear"
                style={{ width: `${progressoStory}%` }}
              ></div>
            </div>

            <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <img src={storyVisualizando.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'} className="w-9 h-9 rounded-full object-cover border-2 border-blue-500 shadow-md" />
                <span className="text-white text-xs font-bold drop-shadow-md">{storyVisualizando.autor}</span>
              </div>
              <button onClick={() => setStoryVisualizando(null)} className="bg-black/50 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm hover:bg-black">✕</button>
            </div>

            {/* CONTEÚDO DO STORY */}
            <div className="flex-1 flex items-center justify-center w-full h-full relative">
              {storyVisualizando.tipo === 'texto' ? (
                <div 
                  className="w-full h-full flex items-center justify-center p-8 text-center"
                  style={{ backgroundColor: storyVisualizando.cor_fundo || '#2563eb' }}
                >
                  <p className="text-white text-xl sm:text-2xl font-extrabold leading-relaxed drop-shadow-md">{storyVisualizando.conteudo}</p>
                </div>
              ) : storyVisualizando.tipo === 'video' ? (
                <video src={storyVisualizando.conteudo} autoPlay controls className="w-full h-full object-cover" />
              ) : (
                <img src={storyVisualizando.conteudo} alt="Story" className="w-full h-full object-cover" />
              )}
            </div>

            {storyVisualizando.username === usuarioLogado.username && (
              <div className="absolute bottom-4 left-4 right-4 flex justify-center z-10">
                <button onClick={async () => { await BancoDeDados.excluirStory(storyVisualizando.id); setStories(await BancoDeDados.getStories()); setStoryVisualizando(null); }} className="bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg hover:bg-red-700">Excluir Story</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* BARRA DE BUSCA GERAL */}
      <div className={`max-w-4xl mx-auto p-4 rounded-2xl border shadow-sm flex items-center gap-3 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <svg className="w-5 h-5 opacity-50 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input 
          type="text" 
          placeholder="Buscar publicações, versículos ou pessoas na comunidade..." 
          value={termoBuscaComunidade}
          onChange={(e) => setTermoBuscaComunidade(e.target.value)}
          className={`w-full text-xs sm:text-sm bg-transparent focus:outline-none ${darkMode ? 'text-white placeholder-slate-400' : 'text-slate-900 placeholder-slate-500'}`}
        />
        {termoBuscaComunidade && (
          <button onClick={() => setTermoBuscaComunidade('')} className="text-xs opacity-60 hover:opacity-100 font-bold px-2">Limpar</button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* COLUNA 1: PERFIL COM ANEL DE FOGO QUANDO HOUVER STORY */}
        <div className="lg:col-span-3 space-y-6">
          <div className={`p-6 rounded-3xl border shadow-md space-y-4 text-center ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div 
              onClick={() => {
                if (temStoryAtivo) {
                  setStoryVisualizando(meusStories[0]);
                } else {
                  onVerPerfil ? onVerPerfil(usuarioLogado.username) : setPerfilSelecionado(usuarioLogado);
                }
              }} 
              className="cursor-pointer group inline-block relative"
            >
              {/* ANEL COM CORES DE FOGO (GRADIENTE LARANJA/VERMELHO/AMARELO) */}
              <div className={`w-24 h-24 rounded-full p-1 mx-auto flex items-center justify-center transition ${temStoryAtivo ? 'bg-gradient-to-tr from-amber-500 via-rose-600 to-yellow-400 animate-pulse shadow-xl' : ''}`}>
                <img src={usuarioLogado.foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'} alt="Avatar" className="w-full h-full rounded-full object-cover border-2 border-white dark:border-slate-900 shadow-md group-hover:opacity-90 transition" />
              </div>
              {temStoryAtivo && (
                <span className="absolute bottom-0 right-1 bg-gradient-to-r from-rose-600 to-amber-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full shadow-md">Story</span>
              )}
            </div>

            <div>
              <h3 onClick={() => onVerPerfil ? onVerPerfil(usuarioLogado.username) : setPerfilSelecionado(usuarioLogado)} className="font-extrabold text-sm cursor-pointer hover:text-blue-500 transition">{usuarioLogado.nome}</h3>
              <p onClick={() => onVerPerfil ? onVerPerfil(usuarioLogado.username) : setPerfilSelecionado(usuarioLogado)} className="text-xs text-blue-500 font-bold mt-0.5 cursor-pointer hover:underline">@{usuarioLogado.username}</p>
              <p className="text-xs opacity-75 mt-2">{usuarioLogado.biografia || 'Praticando a fé e o amor ao próximo.'}</p>
            </div>
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-2 text-center">
              <div className={`p-3 rounded-2xl border shadow-xs ${darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-slate-200'}`}>
                <span className="block font-extrabold text-blue-500 text-sm">{perfilAtualNoBanco.amigos?.length || 0}</span>
                <span className="text-[10px] opacity-60 uppercase font-bold tracking-wider">Amigos</span>
              </div>
              <div className={`p-3 rounded-2xl border shadow-xs ${darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-slate-200'}`}>
                <span className="block font-extrabold text-indigo-500 text-sm">{publicacoes.filter(p => p.username === usuarioLogado.username).length}</span>
                <span className="text-[10px] opacity-60 uppercase font-bold tracking-wider">Posts</span>
              </div>
            </div>
          </div>
        </div>

        {/* COLUNA 2: CARROSSEL DE STORIES + FEED */}
        <div className="lg:col-span-6 space-y-6">

          {/* CARROSSEL DE STORIES */}
          <div className={`p-4 rounded-3xl border shadow-md flex gap-3 overflow-x-auto ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            {/* Adicionar Story */}
            <div 
              onClick={() => setModalCriarStoryAberto(true)}
              className={`relative flex-shrink-0 w-28 h-44 rounded-2xl border flex flex-col justify-end items-center pb-3 cursor-pointer overflow-hidden transition hover:scale-105 shadow-sm ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-300'}`}
            >
              <div className="absolute inset-0 bg-cover bg-center opacity-40" style={{ backgroundImage: `url(${usuarioLogado.foto})` }}></div>
              <div className="absolute top-3 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">+</div>
              <span className="relative z-10 text-[11px] font-bold text-center px-1">Adicionar story</span>
            </div>

            {/* Lista de Stories de todos os usuários com Anel de Fogo */}
            {listaStoriesUnicos.map((st) => {
              const perfilAutor = perfisReais.find(p => p.username === st.username) || {};
              const avatarStory = perfilAutor.foto || st.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80';
              const nomeStory = perfilAutor.nome || st.autor;

              return (
                <div 
                  key={st.id} 
                  onClick={() => setStoryVisualizando(st)}
                  className="relative flex-shrink-0 w-28 h-44 rounded-2xl overflow-hidden cursor-pointer shadow-md transition hover:scale-105 border-2 border-amber-500 bg-slate-900 flex flex-col justify-between p-2"
                >
                  {st.tipo === 'texto' ? (
                    <div className="absolute inset-0 p-3 flex items-center justify-center text-center" style={{ backgroundColor: st.cor_fundo || '#2563eb' }}>
                      <p className="text-white text-[11px] font-bold line-clamp-4">{st.conteudo}</p>
                    </div>
                  ) : st.tipo === 'video' ? (
                    <video src={st.conteudo} className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <img src={st.conteudo} alt="Story" className="absolute inset-0 w-full h-full object-cover" />
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                  
                  {/* Avatar com Anel de Fogo no Carrossel */}
                  <div className="relative z-10 w-8 h-8 rounded-full p-0.5 bg-gradient-to-tr from-amber-500 via-rose-600 to-yellow-400 shadow-md">
                    <img src={avatarStory} className="w-full h-full rounded-full object-cover border border-white" />
                  </div>

                  <span className="relative z-10 text-white text-[11px] font-bold truncate">{nomeStory}</span>
                </div>
              );
            })}
          </div>

          {/* CRIAR PUBLICAÇÃO */}
          <div className={`p-6 rounded-3xl border shadow-md space-y-4 ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <h3 className="text-xs font-bold uppercase tracking-wider opacity-60">Criar Publicação</h3>
            <form onSubmit={publicarPost} className="space-y-3">
              <input type="text" placeholder="Tema da publicação..." value={pubTema} onChange={(e) => setPubTema(e.target.value)} className={`w-full text-sm rounded-xl px-4 py-2.5 border font-bold ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`} />
              <textarea rows="3" placeholder="Compartilhe algo com a comunidade..." value={pubTexto} onChange={(e) => setPubTexto(e.target.value)} className={`w-full text-sm rounded-xl px-4 py-2.5 border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`}></textarea>
              {pubImagem && <img src={pubImagem} alt="Preview" className="w-full h-48 object-cover rounded-2xl shadow-sm" />}
              <div className="flex justify-between items-center">
                <label className={`text-xs px-4 py-2 rounded-xl cursor-pointer flex items-center gap-1.5 transition font-semibold ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}>
                  📷 Imagem
                  <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files[0]; if(f) { const r = new FileReader(); r.onloadend = () => setPubImagem(r.result); r.readAsDataURL(f); } }} className="hidden" />
                </label>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold transition shadow-md">Publicar</button>
              </div>
            </form>
          </div>

          {/* MURAL DE PEDIDOS DE ORAÇÃO */}
          <div className={`p-6 rounded-3xl border shadow-md space-y-3 ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <h3 className="text-xs font-bold uppercase tracking-wider opacity-60">Mural de Pedidos de Oração 🙏</h3>
            <form onSubmit={criarPedidoOracao} className="flex gap-2">
              <input 
                type="text" 
                placeholder="Compartilhe um pedido de oração..." 
                value={novoPedidoTexto} 
                onChange={(e) => setNovoPedidoTexto(e.target.value)} 
                className={`w-full text-xs rounded-xl px-4 py-2.5 border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`} 
              />
              <button type="submit" className="bg-blue-600 text-white text-xs px-5 py-2.5 rounded-xl font-bold transition hover:bg-blue-700 shadow-sm flex-shrink-0">Pedir Oração</button>
            </form>

            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {pedidosOracao.length === 0 ? (
                <p className="text-[11px] opacity-50 text-center py-4">Nenhum pedido de oração no momento.</p>
              ) : (
                pedidosOracao.map(p => {
                  const souDonoDoPedido = p.username === usuarioLogado.username;
                  return (
                    <div key={p.id} className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs gap-2 ${darkMode ? 'bg-slate-800/40 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}>
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-blue-500 mr-1">@{p.username}:</span>
                        <span className="break-words">{p.texto}</span>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={async () => { const atualizados = await BancoDeDados.apoiarPedidoOracao(p.id); setPedidosOracao(atualizados || []); }} className="bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white px-3.5 py-1.5 rounded-xl font-bold transition">
                          ❤️ Apoiar ({p.apoios || 0})
                        </button>
                        {souDonoDoPedido && (
                          <button onClick={async () => { if (window.confirm('Excluir pedido?')) { const atualizados = await BancoDeDados.excluirPedidoOracao(p.id); setPedidosOracao(atualizados || []); }}} className="text-slate-400 hover:text-red-500 p-1.5 font-bold transition">✕</button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* FEED */}
          <div className="space-y-6">
            <h3 className="text-md font-bold opacity-75">Feed da Comunidade</h3>
            {publicacoesFiltradas.length === 0 ? (
              <div className={`p-8 text-center rounded-3xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <p className="text-xs opacity-60">Nenhuma publicação encontrada.</p>
              </div>
            ) : (
              publicacoesFiltradas.map((post) => {
                const souDono = post.username === usuarioLogado.username;
                const estaEditando = postEditandoId === post.id;
                const perfilAutorReal = perfisReais.find(p => p.username === post.username) || {};
                const avatarAtualizado = perfilAutorReal.foto || post.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80';
                const nomeAtualizado = perfilAutorReal.nome || post.autor;
                
                // Verifica se o autor do post tem story ativo para exibir o anel de fogo no feed
                const autorTemStory = stories.some(s => s.username === post.username);

                const reacoes = post.reacoes || { amem: [], gloria: [], amor: [] };
                const meuAmem = (reacoes.amem || []).includes(usuarioLogado.username);
                const meuGloria = (reacoes.gloria || []).includes(usuarioLogado.username);
                const meuAmor = (reacoes.amor || []).includes(usuarioLogado.username);

                return (
                  <div key={post.id} className={`p-6 rounded-3xl border shadow-md space-y-4 ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
                    <div className="flex items-center justify-between">
                      <div 
                        className="flex items-center gap-3 cursor-pointer group" 
                        onClick={() => { 
                          if (autorTemStory) {
                            const stEncontrado = stories.find(s => s.username === post.username);
                            setStoryVisualizando(stEncontrado);
                          } else {
                            const encontrado = perfisReais.find(p => p.username === post.username);
                            if (encontrado) setPerfilSelecionado(encontrado);
                          }
                        }}
                      >
                        {/* Avatar com Anel de Fogo no Feed se tiver story */}
                        <div className={`w-12 h-12 rounded-full p-0.5 flex items-center justify-center transition ${autorTemStory ? 'bg-gradient-to-tr from-amber-500 via-rose-600 to-yellow-400 shadow-md animate-pulse' : 'border-2 border-blue-500/30'}`}>
                          <img src={avatarAtualizado} alt="Avatar" className="w-full h-full rounded-full object-cover border border-white dark:border-slate-900" />
                        </div>
                        <div>
                          <p className="text-sm font-bold group-hover:text-blue-500 transition">{nomeAtualizado}</p>
                          <p className="text-[10px] opacity-50">@{post.username || 'usuario'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* BOTÃO COMPARTILHAR NO STORY */}
                        <button 
                          onClick={() => compartilharPostNoStory(post)}
                          className="text-xs bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white px-3 py-1.5 rounded-xl font-bold transition shadow-xs"
                          title="Compartilhar no Story"
                        >
                          ✨ Compartilhar no Story
                        </button>

                        {souDono && !estaEditando && (
                          <div className="flex gap-2">
                            <button onClick={() => { setPostEditandoId(post.id); setTextoEditado(post.texto); setTemaEditado(post.tema); }} className="text-xs text-blue-400 hover:underline font-semibold">Editar</button>
                            <button onClick={() => excluirPost(post.id)} className="text-xs text-red-400 hover:underline font-semibold">Excluir</button>
                          </div>
                        )}
                      </div>
                    </div>

                    {estaEditando ? (
                      <div className="space-y-3 pt-2">
                        <input type="text" value={temaEditado} onChange={(e) => setTemaEditado(e.target.value)} className={`w-full text-sm rounded-xl px-3 py-2 border font-bold ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`} />
                        <textarea rows="3" value={textoEditado} onChange={(e) => setTextoEditado(e.target.value)} className={`w-full text-sm rounded-xl px-3 py-2 border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`}></textarea>
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setPostEditandoId(null)} className="px-3 py-1.5 rounded-xl text-xs opacity-70">Cancelar</button>
                          <button onClick={() => salvarEdicaoPost(post.id)} className="bg-blue-600 text-white px-4 py-1.5 rounded-xl text-xs font-bold">Salvar</button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <h4 className="text-lg font-bold">{post.tema}</h4>
                        {post.imagem && <img src={post.imagem} alt="Post" className="w-full h-80 object-cover rounded-2xl shadow-sm" />}
                        <p className="text-sm leading-relaxed opacity-90">{post.texto}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                      <button onClick={() => reagir(post.id, 'amem')} className={`text-xs px-3.5 py-2 rounded-xl font-bold border transition flex items-center gap-1.5 ${meuAmem ? 'bg-blue-600 text-white border-blue-500 shadow-sm' : darkMode ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700' : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50 shadow-xs'}`}>
                        <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                        <span>Amém ({(reacoes.amem || []).length})</span>
                      </button>
                      <button onClick={() => reagir(post.id, 'gloria')} className={`text-xs px-3.5 py-2 rounded-xl font-bold border transition flex items-center gap-1.5 ${meuGloria ? 'bg-amber-600 text-white border-amber-500 shadow-sm' : darkMode ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700' : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50 shadow-xs'}`}>
                        <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                        <span>Glória ({(reacoes.gloria || []).length})</span>
                      </button>
                      <button onClick={() => reagir(post.id, 'amor')} className={`text-xs px-3.5 py-2 rounded-xl font-bold border transition flex items-center gap-1.5 ${meuAmor ? 'bg-pink-600 text-white border-pink-500 shadow-sm' : darkMode ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700' : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50 shadow-xs'}`}>
                        <svg className="w-4 h-4 text-pink-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                        <span>Amor ({(reacoes.amor || []).length})</span>
                      </button>
                    </div>
                    
                    <div className="space-y-3 pt-2">
                      {post.comentarios && post.comentarios.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                          {post.comentarios.map((c, cIdx) => (
                            <div key={cIdx} className={`p-2.5 rounded-xl text-xs ${darkMode ? 'bg-slate-800/50 text-slate-200' : 'bg-slate-50 text-slate-800'}`}>
                              <span className="font-bold text-blue-500 mr-1.5">@{c.username}:</span>
                              <span className="opacity-90">{c.texto}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <form onSubmit={(e) => comentar(post.id, post.username, e)} className="flex gap-2">
                        <input type="text" placeholder="Comentar..." value={novoComentario[post.id] || ''} onChange={(e) => setNovoComentario({ ...novoComentario, [post.id]: e.target.value })} className={`w-full text-xs rounded-xl px-3.5 py-2.5 border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`} />
                        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2.5 rounded-xl font-bold transition shadow-sm">Enviar</button>
                      </form>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* COLUNA 3: CHAT COM ANEL DE FOGO + SUGESTÕES DE AMIGOS */}
        <div className="lg:col-span-3 space-y-6">
          <div className={`p-6 rounded-3xl border shadow-md space-y-4 ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <h4 className="text-xs font-bold uppercase tracking-wider opacity-60">💬 Chat & Mensagens</h4>

            {chatComUsuario ? (
              <div className="space-y-3">
                <button onClick={() => setChatComUsuario(null)} className="text-xs text-blue-500 hover:underline font-semibold">← Fechar Chat</button>
                <ChatPrivado destinatario={chatComUsuario} usuarioLogado={usuarioLogado} darkMode={darkMode} onVerPerfil={(p) => setPerfilSelecionado(p)} />
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs opacity-60">Selecione um amigo para conversar:</p>
                {amigosLista.length === 0 ? (
                  <p className="text-xs opacity-40 text-center py-6">Nenhum amigo conectado no chat ainda.</p>
                ) : (
                  amigosLista.map(amigo => {
                    const naoLidasDoAmigo = notificacoes.filter(
                      n => !n.lida && n.tipo === 'mensagem' && n.texto.includes(`@${amigo.username}`)
                    ).length;

                    // Verifica se o amigo tem story ativo para colocar o anel de fogo no chat
                    const amigoTemStory = stories.some(s => s.username === amigo.username);

                    return (
                      <div 
                        key={amigo.username} 
                        onClick={() => abrirChatComAmigo(amigo.username)} 
                        className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition ${darkMode ? 'bg-slate-800/40 border-slate-700 hover:bg-slate-800' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Avatar com Anel de Fogo no Chat se tiver story */}
                          <div 
                            onClick={(e) => {
                              if (amigoTemStory) {
                                e.stopPropagation();
                                const stEncontrado = stories.find(s => s.username === amigo.username);
                                setStoryVisualizando(stEncontrado);
                              }
                            }}
                            className={`w-10 h-10 rounded-full p-0.5 flex items-center justify-center flex-shrink-0 transition ${amigoTemStory ? 'bg-gradient-to-tr from-amber-500 via-rose-600 to-yellow-400 shadow-md animate-pulse cursor-pointer' : ''}`}
                          >
                            <img src={amigo.foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'} className="w-full h-full rounded-full object-cover border border-white dark:border-slate-900" />
                          </div>

                          <div className="min-w-0">
                            <p className="text-xs font-bold truncate">{amigo.nome}</p>
                            <p className="text-[10px] opacity-50 truncate">@{amigo.username}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {naoLidasDoAmigo > 0 && (
                            <span className="bg-red-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-xs animate-bounce">
                              {naoLidasDoAmigo}
                            </span>
                          )}
                          <button title="Abrir chat" className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition shadow-sm flex items-center justify-center">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* SUGESTÕES DE AMIGOS */}
          <div className={`p-6 rounded-3xl border shadow-md space-y-4 ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <h4 className="text-xs font-bold uppercase tracking-wider opacity-60">👥 Membros da Comunidade</h4>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {membrosFiltrados.length === 0 ? (
                <p className="text-xs opacity-40 text-center py-4">Nenhum membro encontrado.</p>
              ) : (
                membrosFiltrados.map(membro => {
                  const enviei = perfilAtualNoBanco.pedidos_enviados?.includes(membro.username);
                  const membroTemStory = stories.some(s => s.username === membro.username);

                  return (
                    <div key={membro.username} className={`p-3 rounded-2xl border flex items-center justify-between text-xs gap-2 ${darkMode ? 'bg-slate-800/30 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                      <div 
                        className="flex items-center gap-2.5 min-w-0 cursor-pointer" 
                        onClick={() => {
                          if (membroTemStory) {
                            const stEncontrado = stories.find(s => s.username === membro.username);
                            setStoryVisualizando(stEncontrado);
                          } else {
                            setPerfilSelecionado(membro);
                          }
                        }}
                      >
                        <div className={`w-8 h-8 rounded-full p-0.5 flex items-center justify-center flex-shrink-0 transition ${membroTemStory ? 'bg-gradient-to-tr from-amber-500 via-rose-600 to-yellow-400 shadow-sm animate-pulse' : ''}`}>
                          <img src={membro.foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'} className="w-full h-full rounded-full object-cover border border-white" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold truncate">{membro.nome}</p>
                          <p className="text-[10px] opacity-50 truncate">@{membro.username}</p>
                        </div>
                      </div>

                      <button 
                        disabled={enviei}
                        onClick={async () => {
                          await BancoDeDados.enviarPedidoAmizade(usuarioLogado.username, membro.username);
                          alert(`Pedido de amizade enviado para @${membro.username}!`);
                          window.location.reload();
                        }}
                        className={`px-3 py-1.5 rounded-xl font-bold text-[10px] transition flex-shrink-0 ${enviei ? 'bg-amber-500/10 text-amber-400 border border-amber-500/35 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'}`}
                      >
                        {enviei ? 'Pendente' : '+ Seguir'}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}