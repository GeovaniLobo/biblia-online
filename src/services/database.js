import React, { useState, useEffect, useRef } from 'react';
import { BancoDeDados } from '../services/database';
import PerfilPublico from './PerfilPublico';

export default function Comunidade({ usuarioLogado, darkMode, onVerPerfil }) {
  if (!usuarioLogado) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-xs opacity-60">Carregando dados do usuário...</p>
      </div>
    );
  }

  const [publicacoes, setPublicacoes] = useState([]);
  const [perfisReais, setPerfisReais] = useState([]);
  const [notificacoes, setNotificacoes] = useState([]);
  const [pedidosOracao, setPedidosOracao] = useState([]);
  const [stories, setStories] = useState([]);
  
  const [carregandoComunidade, setCarregandoComunidade] = useState(true);
  const [perfilSelecionado, setPerfilSelecionado] = useState(null);
  const [chatComUsuario, setChatComUsuario] = useState(null);
  const [mensagensChat, setMensagensChat] = useState([]);
  const [textoMensagemChat, setTextoMensagemChat] = useState('');
  const [enviandoMidia, setEnviandoMidia] = useState(false);
  const [mostrarEmojisChat, setMostrarEmojisChat] = useState(false);

  const [abaNotificacoesAberta, setAbaNotificacoesAberta] = useState(false);
  const [abaSolicitacoesAberta, setAbaSolicitacoesAberta] = useState(false);

  const [postDetalheId, setPostDetalheId] = useState(null);
  const [menuOpcoesPostAberto, setMenuOpcoesPostAberto] = useState(null);
  const [menuCompartilharAberto, setMenuCompartilharAberto] = useState(null);

  const [usuarioStoryVisualizando, setUsuarioStoryVisualizando] = useState(null);
  const [indiceStoryAtual, setIndiceStoryAtual] = useState(0);
  const [progressoStory, setProgressoStory] = useState(0);
  const [modalVisualizadoresAberto, setModalVisualizadoresAberto] = useState(false);
  const timerRef = useRef(null);
  const chatFimRef = useRef(null);

  const [modalCriarStoryAberto, setModalCriarStoryAberto] = useState(false);
  const [tipoStoryCriacao, setTipoStoryCriacao] = useState('texto');
  const [textoStory, setTextoStory] = useState('');
  const [corFundoStory, setCorFundoStory] = useState('#2563eb');
  const [mencaoStory, setMencaoStory] = useState('');
  const [midiaStoryUrl, setMidiaStoryUrl] = useState('');
  const [tipoMidia, setTipoMidia] = useState('imagem');

  const [termoBuscaMencao, setTermoBuscaMencao] = useState('');
  const [menuSugestoesMencaoAberto, setMenuSugestoesMencaoAberto] = useState(false);

  const [novoComentario, setNovoComentario] = useState({});
  const [respondendoComentarioId, setRespondendoComentarioId] = useState({});
  const [menuMencaoComentarioAberto, setMenuMencaoComentarioAberto] = useState(null);
  const [termoBuscaMencaoComentario, setTermoBuscaMencaoComentario] = useState('');

  const [termoBuscaComunidade, setTermoBuscaComunidade] = useState('');
  const [pubTexto, setPubTexto] = useState('');
  const [pubImagem, setPubImagem] = useState('');
  const [pubTema, setPubTema] = useState('');

  const [postEditandoId, setPostEditandoId] = useState(null);
  const [textoEditado, setTextoEditado] = useState('');
  const [temaEditado, setTemaEditado] = useState('');
  const [novoPedidoTexto, setNovoPedidoTexto] = useState('');

  const [toastMensagem, setToastMensagem] = useState(null);

  const mostrarToast = (mensagem) => {
    setToastMensagem(mensagem);
    setTimeout(() => {
      setToastMensagem(null);
    }, 3000);
  };

  const processarArquivoParaUrl = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(URL.createObjectURL(file));
      reader.readAsDataURL(file);
    });
  };

  useEffect(() => {
    let montado = true;
    async function carregarDadosIniciais() {
      try {
        await BancoDeDados.salvarNovoPerfilNaRede({
          username: usuarioLogado.username,
          senha: usuarioLogado.senha || '',
          nome: usuarioLogado.nome || 'Usuário',
          biografia: usuarioLogado.biografia || '',
          foto: usuarioLogado.foto || '',
          data_nascimento: usuarioLogado.dataNascimento || ''
        });

        const perfis = await BancoDeDados.getPerfisCadastrados();
        const pubs = await BancoDeDados.getPublicacoes();
        const notifs = await BancoDeDados.getNotificacoes(usuarioLogado.username);
        const pedidos = await BancoDeDados.getPedidosOracao();
        const strs = await BancoDeDados.getStories();

        if (montado) {
          setPerfisReais(perfis || []);
          setPublicacoes(pubs || []);
          setNotificacoes(notifs || []);
          setPedidosOracao(pedidos || []);
          setStories(strs || []);

          const searchParams = new URLSearchParams(window.location.search);
          const postIdParam = searchParams.get('post') || searchParams.get('id');
          if (postIdParam) {
            setPostDetalheId(Number(postIdParam));
          }
        }
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
      } finally {
        if (montado) setCarregandoComunidade(false);
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

        if (montado) {
          setPublicacoes(pubs || []);
          setNotificacoes(notifs || []);
          setPerfisReais(perfis || []);
          setPedidosOracao(pedidos || []);
          setStories(strs || []);
        }
      } catch (e) {}
    }, 5000);

    return () => {
      montado = false;
      clearInterval(intervalo);
    };
  }, [usuarioLogado]);

  useEffect(() => {
    async function carregarMensagens() {
      if (chatComUsuario) {
        const msgs = typeof BancoDeDados.getMensagensChat === 'function' ? await BancoDeDados.getMensagensChat(usuarioLogado.username, chatComUsuario) : [];
        setMensagensChat(msgs || []);
      }
    }
    carregarMensagens();
    const intervaloChat = setInterval(carregarMensagens, 3000);
    return () => clearInterval(intervaloChat);
  }, [chatComUsuario, usuarioLogado.username]);

  useEffect(() => {
    if (chatFimRef.current) {
      chatFimRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [mensagensChat]);

  const meuPerfilBanco = perfisReais.find(p => p.username === usuarioLogado.username) || {};
  const fotoPerfilOficial = meuPerfilBanco.foto || usuarioLogado.foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80';
  const nomePerfilOficial = meuPerfilBanco.nome || usuarioLogado.nome || 'Usuário';

  const meusAmigos = meuPerfilBanco.amigos || [];
  const pedidosRecebidos = meuPerfilBanco.pedidos_recebidos || [];

  const amigosMaisLogado = [usuarioLogado.username, ...meusAmigos];
  
  const agoraTimestamp = Date.now();
  const limite24h = 24 * 60 * 60 * 1000;
  
  const storiesValidos = stories.filter(s => {
    if (!s.id) return false;
    if (s.username === usuarioLogado.username) return true;
    return (agoraTimestamp - Number(s.id)) <= limite24h;
  });

  const storiesFiltradosAmigos = storiesValidos.filter(s => amigosMaisLogado.includes(s.username));

  const meusStories = storiesValidos.filter(s => s.username === usuarioLogado.username);
  const temStoryAtivo = meusStories.length > 0;
  const meusStoriesVistos = temStoryAtivo && meusStories.every(st => {
    const vistas = st.visualizacoes || [];
    return vistas.some(v => v.username === usuarioLogado.username);
  });

  const autoresComStoriesMap = {};
  const storiesOrdenados = [...storiesFiltradosAmigos].sort((a, b) => a.id - b.id);

  storiesOrdenados.forEach(st => {
    if (!autoresComStoriesMap[st.username]) {
      const perfilAutor = perfisReais.find(p => p.username === st.username) || {};
      autoresComStoriesMap[st.username] = {
        username: st.username,
        autor: perfilAutor.nome || st.autor,
        avatar: perfilAutor.foto || st.avatar,
        lista: []
      };
    }
    autoresComStoriesMap[st.username].lista.push(st);
  });

  const listaAutoresStories = Object.values(autoresComStoriesMap).map(autorObj => {
    const todosVistos = autorObj.lista.every(st => {
      const visualizacoesDoStory = st.visualizacoes || [];
      return visualizacoesDoStory.some(v => v.username === usuarioLogado.username);
    });
    return { ...autorObj, todosVistos, primeiroStory: autorObj.lista[0] };
  });

  listaAutoresStories.sort((a, b) => {
    if (a.username === usuarioLogado.username) return -1;
    if (a.todosVistos === b.todosVistos) return 0;
    return a.todosVistos ? 1 : -1;
  });

  const listaStoriesDoAutorAtual = usuarioStoryVisualizando 
    ? (autoresComStoriesMap[usuarioStoryVisualizando]?.lista || []) 
    : [];
  const storyAtivoObj = listaStoriesDoAutorAtual[indiceStoryAtual];

  useEffect(() => {
    async function computarVisualizacao() {
      if (usuarioStoryVisualizando && storyAtivoObj) {
        const storyId = storyAtivoObj.id;
        const vistasAtuais = storyAtivoObj.visualizacoes || [];
        const jaViu = vistasAtuais.some(v => v.username === usuarioLogado.username);

        if (!jaViu && storyAtivoObj.username !== usuarioLogado.username) {
          const novaVisualizacao = {
            username: usuarioLogado.username,
            nome: nomePerfilOficial,
            foto: fotoPerfilOficial,
            horario: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          
          const storiesAtualizados = await BancoDeDados.registrarVisualizacaoStory(storyId, novaVisualizacao);
          setStories(storiesAtualizados || []);
        }
      }
    }
    computarVisualizacao();
  }, [usuarioStoryVisualizando, indiceStoryAtual, storyAtivoObj]);

  const avancarStory = () => {
    if (indiceStoryAtual < listaStoriesDoAutorAtual.length - 1) {
      setIndiceStoryAtual(prev => prev + 1);
    } else {
      const currentIndex = listaAutoresStories.findIndex(a => a.username === usuarioStoryVisualizando);
      if (currentIndex !== -1 && currentIndex < listaAutoresStories.length - 1) {
        const proximoAutor = listaAutoresStories[currentIndex + 1];
        setUsuarioStoryVisualizando(proximoAutor.username);
        setIndiceStoryAtual(0);
      } else {
        setUsuarioStoryVisualizando(null);
        setIndiceStoryAtual(0);
      }
    }
  };

  const voltarStory = () => {
    if (indiceStoryAtual > 0) {
      setIndiceStoryAtual(prev => prev - 1);
    } else {
      const currentIndex = listaAutoresStories.findIndex(a => a.username === usuarioStoryVisualizando);
      if (currentIndex > 0) {
        const autorAnterior = listaAutoresStories[currentIndex - 1];
        setUsuarioStoryVisualizando(autorAnterior.username);
        setIndiceStoryAtual(autorAnterior.lista.length - 1);
      }
    }
  };

  useEffect(() => {
    if (!usuarioStoryVisualizando || !storyAtivoObj) {
      setProgressoStory(0);
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    setProgressoStory(0);
    if (timerRef.current) clearInterval(timerRef.current);

    const duracaoTotalMs = storyAtivoObj.tipo === 'video' ? 60000 : 20000;
    const intervaloMs = 100;
    const incrementoPorPasso = (100 / (duracaoTotalMs / intervaloMs));

    timerRef.current = setInterval(() => {
      setProgressoStory((prev) => {
        if (prev >= 100) {
          clearInterval(timerRef.current);
          avancarStory();
          return 100;
        }
        return prev + incrementoPorPasso;
      });
    }, intervaloMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [usuarioStoryVisualizando, indiceStoryAtual]);

  // Função robusta para navegar para o perfil de qualquer usuário
  const abrirPerfilPorUsername = (usernameAlvo) => {
    if (!usernameAlvo) return;
    const perfilEncontrado = perfisReais.find(p => p.username === usernameAlvo);
    if (perfilEncontrado) {
      if (onVerPerfil) onVerPerfil(perfilEncontrado.username);
      else setPerfilSelecionado(perfilEncontrado);
    } else {
      // Se não estiver na lista cadastrada, cria um objeto básico para abrir a rota
      const perfilTemporario = { username: usernameAlvo, nome: usernameAlvo, foto: fotoPerfilOficial };
      if (onVerPerfil) onVerPerfil(usernameAlvo);
      else setPerfilSelecionado(perfilTemporario);
    }
  };

  const clicarPerfilOuStory = (usernameAlvo) => {
    if (!usernameAlvo) return;
    const autorTemStory = storiesFiltradosAmigos.some(s => s.username === usernameAlvo);
    if (autorTemStory) {
      setIndiceStoryAtual(0);
      setUsuarioStoryVisualizando(usernameAlvo);
    } else {
      abrirPerfilPorUsername(usernameAlvo);
    }
  };

  const abrirChatComAmigo = async (usernameAmigo) => {
    setChatComUsuario(usernameAmigo);
    await BancoDeDados.marcarNotificacoesLidas(usuarioLogado.username);
    const notifsAtualizadas = await BancoDeDados.getNotificacoes(usuarioLogado.username);
    setNotificacoes(notifsAtualizadas || []);
  };

  const enviarMensagemChat = async (e) => {
    e.preventDefault();
    if (!textoMensagemChat.trim() || !chatComUsuario) return;
    
    const novaMsg = {
      id: Date.now(),
      remetente: usuarioLogado.username,
      destinatario: chatComUsuario,
      texto: textoMensagemChat.trim(),
      horario: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    if (typeof BancoDeDados.enviarMensagemChat === 'function') {
      await BancoDeDados.enviarMensagemChat(novaMsg);
      const msgsAtualizadas = await BancoDeDados.getMensagensChat(usuarioLogado.username, chatComUsuario);
      setMensagensChat(msgsAtualizadas || []);
    } else {
      setMensagensChat(prev => [...prev, novaMsg]);
    }
    setTextoMensagemChat('');
    setMostrarEmojisChat(false);
  };

  const enviarMidiaChat = async (e, tipo) => {
    const file = e.target.files[0];
    if (!file || !chatComUsuario) return;
    setEnviandoMidia(true);
    
    let urlMidia = '';
    try {
      if (typeof BancoDeDados.uploadMidiaStory === 'function') {
        urlMidia = await BancoDeDados.uploadMidiaStory(file);
      }
    } catch (err) {}
    if (!urlMidia) {
      urlMidia = await processarArquivoParaUrl(file);
    }
    setEnviandoMidia(false);

    const novaMsg = {
      id: Date.now(),
      remetente: usuarioLogado.username,
      destinatario: chatComUsuario,
      texto: tipo === 'video' ? '[Vídeo]' : '[Imagem]',
      midia: urlMidia,
      tipoMidia: tipo,
      horario: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    if (typeof BancoDeDados.enviarMensagemChat === 'function') {
      await BancoDeDados.enviarMensagemChat(novaMsg);
      const msgsAtualizadas = await BancoDeDados.getMensagensChat(usuarioLogado.username, chatComUsuario);
      setMensagensChat(msgsAtualizadas || []);
    } else {
      setMensagensChat(prev => [...prev, novaMsg]);
    }
  };

  const salvarStoryBanco = async (tipo, conteudo, corFundo = '#1e293b', mencao = '') => {
    let mencaoDetectada = mencao;
    if (!mencaoDetectada && tipo === 'texto') {
      const match = conteudo.match(/@([a-zA-Z0-9_]+)/);
      if (match) mencaoDetectada = match[1];
    }

    const novoStory = {
      id: Date.now(),
      username: usuarioLogado.username,
      autor: nomePerfilOficial,
      avatar: fotoPerfilOficial,
      tipo,
      conteudo,
      cor_fundo: corFundo,
      mencao: mencaoDetectada || null,
      curtidas: [],
      visualizacoes: []
    };

    try {
      const atualizados = await BancoDeDados.salvarStory(novoStory);
      if (atualizados) {
        setStories(atualizados);
      } else {
        setStories(prev => [novoStory, ...prev]);
      }
    } catch (err) {
      setStories(prev => [novoStory, ...prev]);
    }

    setModalCriarStoryAberto(false);
    setTextoStory('');
    setMidiaStoryUrl('');
    setMencaoStory('');
    setMenuSugestoesMencaoAberto(false);
    mostrarToast('Story publicado com sucesso! 🚀');

    if (mencaoDetectada) {
      try {
        await BancoDeDados.adicionarNotificacao(
          mencaoDetectada, 
          `@${usuarioLogado.username} mencionou você em um story!`, 
          'mencao'
        );
      } catch (e) {}
    }
  };

  const curtirStoryAtual = async () => {
    if (!storyAtivoObj) return;
    const atualizados = typeof BancoDeDados.curtirStory === 'function' ? await BancoDeDados.curtirStory(storyAtivoObj.id, usuarioLogado.username) : [];
    setStories(atualizados || []);
  };

  const repostarStory = (st) => {
    salvarStoryBanco(st.tipo, st.conteudo, st.cor_fundo || '#1e293b', st.mencao || '');
    setUsuarioStoryVisualizando(null);
    mostrarToast('Story repostado com sucesso no seu perfil! 🚀');
  };

  const compartilharPostNoStory = (post) => {
    const textoFormatado = `📌 ${post.tema}\n\n"${post.texto}"\n\n- por @${post.username}`;
    salvarStoryBanco('texto', textoFormatado, '#1e293b');
    setMenuCompartilharAberto(null);
    mostrarToast('Publicação compartilhada com sucesso nos seus Stories! 🚀');
  };

  const copiarLinkPost = (postId) => {
    const linkUrl = `${window.location.origin}${window.location.pathname}#/comunidade?post=${postId}`;
    navigator.clipboard.writeText(linkUrl);
    setMenuCompartilharAberto(null);
    mostrarToast('Link da publicação copiado para a área de transferência! 🔗');
  };

  const compartilharRedesSociais = (rede, post) => {
    const linkUrl = encodeURIComponent(`${window.location.origin}${window.location.pathname}#/comunidade?post=${post.id}`);
    const textoUrl = encodeURIComponent(`Veja esta publicação de @${post.username}: "${post.tema}" - ${post.texto}`);
    
    if (rede === 'whatsapp') {
      window.open(`https://api.whatsapp.com/send?text=${textoUrl}%20-%20${linkUrl}`, '_blank');
    } else if (rede === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${linkUrl}`, '_blank');
    }
    setMenuCompartilharAberto(null);
  };

  const publicarPost = async (e) => {
    e.preventDefault();
    if (!pubTexto.trim() && !pubImagem) return;
    const novoPost = {
      id: Date.now(),
      autor: nomePerfilOficial,
      username: usuarioLogado.username,
      avatar: fotoPerfilOficial,
      tema: pubTema.trim() || 'Publicação',
      texto: pubTexto.trim(),
      imagem: pubImagem,
      curtidas: 0,
      reacoes: { amem: [], aleluia: [], amor: [] },
      comentarios: []
    };
    const atualizados = await BancoDeDados.salvarPublicacao(novoPost);
    setPublicacoes([...atualizados]);
    setPubTexto('');
    setPubImagem('');
    setPubTema('');
    mostrarToast('Publicação enviada com sucesso! ✨');
  };

  const criarPedidoOracaoHandler = async (e) => {
    e.preventDefault();
    if (!novoPedidoTexto.trim()) return;
    const novoPedido = {
      id: Date.now(),
      username: usuarioLogado.username,
      texto: novoPedidoTexto.trim(),
      apoios: 0,
      apoiadores: []
    };
    const atualizados = await BancoDeDados.salvarPedidoOracao(novoPedido);
    setPedidosOracao(atualizados || []);
    setNovoPedidoTexto('');
    mostrarToast('Pedido de oração adicionado ao mural! 🙏');
  };

  const excluirPost = async (id) => {
    if (window.confirm('Deseja realmente excluir esta publicação?')) {
      const atualizados = await BancoDeDados.excluirPublicacao(id);
      setPublicacoes([...atualizados]);
      setMenuOpcoesPostAberto(null);
      if (postDetalheId === id) setPostDetalheId(null);
      mostrarToast('Publicação excluída com sucesso.');
    }
  };

  const salvarEdicaoPost = async (id) => {
    const atualizados = await BancoDeDados.atualizarPublicacao(id, textoEditado, temaEditado);
    setPublicacoes([...atualizados]);
    setPostEditandoId(null);
    setMenuOpcoesPostAberto(null);
    mostrarToast('Publicação atualizada!');
  };

  const reagir = async (id, tipoReacao) => {
    const atualizados = await BancoDeDados.reagirPublicacao(id, tipoReacao, usuarioLogado.username);
    setPublicacoes([...atualizados]);
  };

  const comentar = async (publicacaoId, usernameAutorPost, e) => {
    e.preventDefault();
    const texto = novoComentario[publicacaoId];
    if (!texto || !texto.trim()) return;

    const respostaPaiId = respondendoComentarioId[publicacaoId] || null;

    const comentarioObj = {
      id: Date.now(),
      autor: nomePerfilOficial,
      username: usuarioLogado.username,
      texto: texto.trim(),
      resposta_a_id: respostaPaiId,
      reacoes: { amem: [], aleluia: [], amor: [] }
    };

    const atualizados = await BancoDeDados.adicionarComentarioPub(publicacaoId, comentarioObj);
    setPublicacoes([...atualizados]);
    setNovoComentario({ ...novoComentario, [publicacaoId]: '' });
    setRespondendoComentarioId({ ...respondendoComentarioId, [publicacaoId]: null });
    setMenuMencaoComentarioAberto(null);

    const matches = texto.match(/@([a-zA-Z0-9_]+)/g);
    if (matches) {
      matches.forEach(async (m) => {
        const userMencionado = m.replace('@', '');
        if (userMencionado !== usuarioLogado.username) {
          await BancoDeDados.adicionarNotificacao(userMencionado, `@${usuarioLogado.username} mencionou você em um comentário.`, 'mencao');
        }
      });
    }

    if (usuarioLogado.username !== usernameAutorPost) {
      await BancoDeDados.adicionarNotificacao(usernameAutorPost, `@${usuarioLogado.username} comentou na sua publicação.`, 'comentario');
    }
  };

  const reagirComentarioPub = async (publicacaoId, comentarioId, tipoReacao) => {
    const atualizados = await BancoDeDados.reagirComentarioPub(publicacaoId, comentarioId, tipoReacao, usuarioLogado.username);
    setPublicacoes([...atualizados]);
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

  if (postDetalheId) {
    const postUnico = publicacoes.find(p => p.id === postDetalheId);
    return (
      <div className={`w-full max-w-2xl mx-auto px-3 sm:px-6 py-6 space-y-6 overflow-x-hidden box-border ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
        <button 
          onClick={() => setPostDetalheId(null)}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm flex items-center gap-2"
        >
          ← Voltar para o Feed da Comunidade
        </button>

        {!postUnico ? (
          <div className={`p-8 text-center rounded-3xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <p className="text-xs opacity-60">Esta publicação não foi encontrada ou foi removida.</p>
          </div>
        ) : (
          renderizarCardPublicacao(postUnico, true)
        )}
      </div>
    );
  }

  const amigosLista = perfisReais.filter(p => meusAmigos.includes(p.username));
  const outrosUsuarios = perfisReais.filter(p => p.username !== usuarioLogado.username && !meusAmigos.includes(p.username));

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

  const perfisSugeridosMencao = perfisReais.filter(p => {
    if (!termoBuscaMencao) return true;
    const t = termoBuscaMencao.toLowerCase();
    return p.username.toLowerCase().includes(t) || p.nome.toLowerCase().includes(t);
  });

  const perfisSugeridosMencaoComentario = perfisReais.filter(p => {
    if (!termoBuscaMencaoComentario) return true;
    const t = termoBuscaMencaoComentario.toLowerCase();
    return p.username.toLowerCase().includes(t) || p.nome.toLowerCase().includes(t);
  });

  const notificacoesNaoLidasCount = notificacoes.filter(n => !n.lida).length;

  function renderizarCardPublicacao(post, isolado = false) {
    const souDono = post.username === usuarioLogado.username;
    const estaEditando = postEditandoId === post.id;
    const perfilAutorReal = perfisReais.find(p => p.username === post.username) || {};
    const avatarAtualizado = perfilAutorReal.foto || post.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80';
    const nomeAtualizado = perfilAutorReal.nome || post.autor;
    const autorTemStory = storiesFiltradosAmigos.some(s => s.username === post.username);

    const reacoes = post.reacoes || { amem: [], aleluia: [], amor: [] };
    const meuAmem = (reacoes.amem || []).includes(usuarioLogado.username);
    const meuAleluia = (reacoes.aleluia || []).includes(usuarioLogado.username);
    const meuAmor = (reacoes.amor || []).includes(usuarioLogado.username);

    return (
      <div key={post.id} className={`p-4 sm:p-6 rounded-3xl border shadow-md space-y-4 relative w-full overflow-hidden box-border ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
        
        <div className="flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer group min-w-0 pr-2" 
            onClick={() => clicarPerfilOuStory(post.username)}
          >
            <div className={`w-12 h-12 rounded-full p-0.5 flex items-center justify-center flex-shrink-0 transition ${autorTemStory ? 'bg-gradient-to-tr from-amber-500 via-rose-600 to-yellow-400 shadow-md animate-pulse' : 'border-2 border-blue-500/30'}`}>
              <img src={avatarAtualizado} alt="Avatar" className="w-full h-full rounded-full object-cover border border-white dark:border-slate-900" />
            </div>
            <div className="min-w-0">
              {/* Ao clicar no nome da pessoa, abre o perfil dela (.com/username) */}
              <p 
                onClick={(e) => {
                  e.stopPropagation();
                  abrirPerfilPorUsername(post.username);
                }} 
                className="text-sm font-bold group-hover:text-blue-500 hover:underline transition truncate"
              >
                {nomeAtualizado}
              </p>
              <p className="text-[10px] opacity-50 truncate">@{post.username || 'usuario'}</p>
            </div>
          </div>

          {souDono && !estaEditando && (
            <div className="relative flex-shrink-0">
              <button 
                onClick={() => setMenuOpcoesPostAberto(menuOpcoesPostAberto === post.id ? null : post.id)}
                className="p-2 rounded-xl opacity-60 hover:opacity-100 hover:bg-slate-500/10 transition font-extrabold text-base tracking-widest"
                title="Opções da publicação"
              >
                ⋮
              </button>

              {menuOpcoesPostAberto === post.id && (
                <div className={`absolute right-0 mt-1 w-36 rounded-2xl border shadow-xl py-1 z-30 ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
                  <button 
                    onClick={() => {
                      setPostEditandoId(post.id);
                      setTextoEditado(post.texto);
                      setTemaEditado(post.tema);
                      setMenuOpcoesPostAberto(null);
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-bold hover:bg-blue-600 hover:text-white transition flex items-center gap-2"
                  >
                    ✏️ Editar
                  </button>
                  <button 
                    onClick={() => excluirPost(post.id)}
                    className="w-full text-left px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-600 hover:text-white transition flex items-center gap-2"
                  >
                    🗑️ Excluir
                  </button>
                </div>
              )}
            </div>
          )}
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
            <h4 className="text-lg font-bold break-words">{post.tema}</h4>
            {post.imagem && <img src={post.imagem} alt="Post" className="w-full h-64 sm:h-80 object-cover rounded-2xl shadow-sm" />}
            <p className="text-sm leading-relaxed opacity-90 whitespace-pre-line break-words">{post.texto}</p>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <button onClick={() => reagir(post.id, 'amem')} className={`text-[11px] sm:text-xs px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl font-bold border transition flex items-center gap-1 ${meuAmem ? 'bg-blue-600 text-white border-blue-500 shadow-sm' : darkMode ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700' : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50 shadow-xs'}`}>
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
              <span>Amém ({(reacoes.amem || []).length})</span>
            </button>
            <button onClick={() => reagir(post.id, 'aleluia')} className={`text-[11px] sm:text-xs px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl font-bold border transition flex items-center gap-1 ${meuAleluia ? 'bg-amber-600 text-white border-amber-500 shadow-sm' : darkMode ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700' : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50 shadow-xs'}`}>
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
              <span>Aleluia ({(reacoes.aleluia || []).length})</span>
            </button>
            <button onClick={() => reagir(post.id, 'amor')} className={`text-[11px] sm:text-xs px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl font-bold border transition flex items-center gap-1 ${meuAmor ? 'bg-pink-600 text-white border-pink-500 shadow-sm' : darkMode ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700' : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50 shadow-xs'}`}>
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pink-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
              <span>Amor ({(reacoes.amor || []).length})</span>
            </button>
          </div>

          <div className="relative">
            <button 
              onClick={() => setMenuCompartilharAberto(menuCompartilharAberto === post.id ? null : post.id)}
              className={`text-xs px-3.5 py-2 rounded-xl font-bold border transition flex items-center gap-1.5 ${darkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200' : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span>Compartilhar</span>
            </button>

            {menuCompartilharAberto === post.id && (
              <div className={`absolute right-0 top-full mt-2 sm:bottom-full sm:mb-2 sm:top-auto w-56 rounded-2xl border shadow-2xl p-2 z-50 space-y-1 ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
                <p className="text-[10px] font-bold uppercase tracking-wider opacity-50 px-2 py-1">Opções de Partilha</p>
                
                <button 
                  onClick={() => compartilharPostNoStory(post)}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold hover:bg-blue-600 hover:text-white transition flex items-center gap-2.5"
                >
                  ✨ Adicionar ao meu Story
                </button>

                <button 
                  onClick={() => {
                    setPostDetalheId(post.id);
                    setMenuCompartilharAberto(null);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold hover:bg-blue-600 hover:text-white transition flex items-center gap-2.5"
                >
                  🔗 Abrir Link Direto do Post
                </button>

                <button 
                  onClick={() => copiarLinkPost(post.id)}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold hover:bg-blue-600 hover:text-white transition flex items-center gap-2.5"
                >
                  📋 Copiar Link Próprio
                </button>

                <button 
                  onClick={() => compartilharRedesSociais('whatsapp', post)}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold hover:bg-emerald-600 hover:text-white transition flex items-center gap-2.5 text-emerald-500 hover:text-white"
                >
                  <svg className="w-4 h-4 fill-current flex-shrink-0" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                  </svg>
                  <span>WhatsApp</span>
                </button>

                <button 
                  onClick={() => compartilharRedesSociais('facebook', post)}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold hover:bg-blue-600 hover:text-white transition flex items-center gap-2.5 text-blue-500 hover:text-white"
                >
                  <svg className="w-4 h-4 fill-current flex-shrink-0" viewBox="0 0 24 24">
                    <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.378 14.5 5 15.5 5H18V0h-3.808C10.592 0 9 1.589 9 4.75V8z"/>
                  </svg>
                  <span>Facebook</span>
                </button>
              </div>
            )}
          </div>

        </div>
        
        <div className="space-y-3 pt-2">
          {post.comentarios && post.comentarios.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              {post.comentarios.map((c) => {
                const perfilAutorComentario = perfisReais.find(p => p.username === c.username) || {};
                const fotoComentario = perfilAutorComentario.foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80';
                const autorComentarioTemStory = storiesFiltradosAmigos.some(s => s.username === c.username);

                const reacoesComentario = c.reacoes || { amem: [], aleluia: [], amor: [] };
                const meuAmemCom = (reacoesComentario.amem || []).includes(usuarioLogado.username);
                const meuAleluiaCom = (reacoesComentario.aleluia || []).includes(usuarioLogado.username);
                const meuAmorCom = (reacoesComentario.amor || []).includes(usuarioLogado.username);

                const ehResposta = Boolean(c.resposta_a_id);
                const comentarioPai = ehResposta ? post.comentarios.find(cp => cp.id === c.resposta_a_id) : null;

                return (
                  <div 
                    key={c.id || Math.random()} 
                    className={`p-3 rounded-2xl text-xs space-y-2 transition ${
                      ehResposta 
                        ? 'ml-4 sm:ml-8 pl-3 sm:pl-4 border-l-2 border-blue-500 bg-blue-500/5' 
                        : darkMode ? 'bg-slate-800/40 text-slate-200' : 'bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div 
                        onClick={() => clicarPerfilOuStory(c.username)}
                        className={`w-7 h-7 rounded-full p-0.5 flex items-center justify-center flex-shrink-0 cursor-pointer transition ${autorComentarioTemStory ? 'bg-gradient-to-tr from-amber-500 via-rose-600 to-yellow-400 animate-pulse shadow-sm' : ''}`}
                      >
                        <img src={fotoComentario} className="w-full h-full rounded-full object-cover border border-white dark:border-slate-900" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between">
                          <span 
                            onClick={() => abrirPerfilPorUsername(c.username)} 
                            className="font-bold text-blue-500 cursor-pointer hover:underline truncate"
                          >
                            @{c.username}
                          </span>
                          <button 
                            onClick={() => setRespondendoComentarioId({ ...respondendoComentarioId, [post.id]: c.id })}
                            className="text-[10px] font-semibold opacity-60 hover:opacity-100 text-blue-400 flex-shrink-0"
                          >
                            Responder
                          </button>
                        </div>

                        {comentarioPai && (
                          <p className="text-[10px] opacity-60 italic bg-blue-500/10 px-2 py-0.5 rounded w-fit">
                            em resposta a @{comentarioPai.username}
                          </p>
                        )}

                        <p className="opacity-95 break-words leading-relaxed">{c.texto}</p>

                        <div className="flex flex-wrap items-center gap-3 pt-1">
                          <button onClick={() => reagirComentarioPub(post.id, c.id, 'amem')} className={`text-[10px] font-bold flex items-center gap-1 ${meuAmemCom ? 'text-red-500' : 'opacity-60 hover:opacity-100'}`}>
                            ❤️ Amém ({(reacoesComentario.amem || []).length})
                          </button>
                          <button onClick={() => reagirComentarioPub(post.id, c.id, 'aleluia')} className={`text-[10px] font-bold flex items-center gap-1 ${meuAleluiaCom ? 'text-amber-500' : 'opacity-60 hover:opacity-100'}`}>
                            ⭐ Aleluia ({(reacoesComentario.aleluia || []).length})
                          </button>
                          <button onClick={() => reagirComentarioPub(post.id, c.id, 'amor')} className={`text-[10px] font-bold flex items-center gap-1 ${meuAmorCom ? 'text-pink-500' : 'opacity-60 hover:opacity-100'}`}>
                            ✨ Amor ({(reacoesComentario.amor || []).length})
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {respondendoComentarioId[post.id] && (
            <div className="flex items-center justify-between bg-blue-500/10 px-3 py-1.5 rounded-xl text-xs border border-blue-500/30">
              <span className="font-semibold text-blue-400">Respondendo a um comentário...</span>
              <button onClick={() => setRespondendoComentarioId({ ...respondendoComentarioId, [post.id]: null })} className="font-bold text-red-400 hover:underline">✕ Cancelar</button>
            </div>
          )}

          <form onSubmit={(e) => comentar(post.id, post.username, e)} className="flex gap-2 relative">
            <input 
              type="text" 
              placeholder="Escreva um comentário. Use @..." 
              value={novoComentario[post.id] || ''} 
              onChange={(e) => {
                const val = e.target.value;
                setNovoComentario({ ...novoComentario, [post.id]: val });
                const ultimoIndiceArroba = val.lastIndexOf('@');
                if (ultimoIndiceArroba !== -1 && (ultimoIndiceArroba === 0 || val[ultimoIndiceArroba - 1] === ' ')) {
                  const termo = val.substring(ultimoIndiceArroba + 1);
                  if (!termo.includes(' ')) {
                    setTermoBuscaMencaoComentario(termo);
                    setMenuMencaoComentarioAberto(post.id);
                  } else {
                    setMenuMencaoComentarioAberto(null);
                  }
                } else {
                  setMenuMencaoComentarioAberto(null);
                }
              }}
              className={`w-full text-xs rounded-xl px-3.5 py-2.5 border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`} 
            />

            {menuMencaoComentarioAberto === post.id && (
              <div className="absolute bottom-full left-0 right-16 mb-2 max-h-36 overflow-y-auto bg-slate-900/95 border border-slate-700 rounded-2xl p-2 shadow-2xl z-20 space-y-1 text-left backdrop-blur-md">
                <p className="text-[10px] uppercase font-bold text-slate-400 px-2">Sugestões de Menção:</p>
                {perfisSugeridosMencaoComentario.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-2">Nenhum perfil encontrado.</p>
                ) : (
                  perfisSugeridosMencaoComentario.map(p => (
                    <div 
                      key={p.username}
                      onClick={() => {
                        const textoAtual = novoComentario[post.id] || '';
                        const ultimoIndiceArroba = textoAtual.lastIndexOf('@');
                        const textoBase = textoAtual.substring(0, ultimoIndiceArroba);
                        setNovoComentario({ ...novoComentario, [post.id]: `${textoBase}@${p.username} ` });
                        setMenuMencaoComentarioAberto(null);
                      }}
                      className="flex items-center gap-2.5 p-2 rounded-xl cursor-pointer hover:bg-slate-800 transition"
                    >
                      <img src={p.foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'} className="w-7 h-7 rounded-full object-cover border border-blue-500 shadow-sm" />
                      <div>
                        <p className="text-xs font-bold text-white leading-tight">{p.nome}</p>
                        <p className="text-[10px] text-blue-400">@{p.username}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2.5 rounded-xl font-bold transition shadow-sm flex-shrink-0">Enviar</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-10 py-6 space-y-6 overflow-x-hidden box-border ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
      
      {/* Toast Flutuante */}
      {toastMensagem && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="bg-slate-900 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-2.5 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{toastMensagem}</span>
          </div>
        </div>
      )}

      {/* HEADER SUPERIOR: Menu/Livros, Comunidade, Ícone de Notificações e Ícone de Perfil */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 relative">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
            Comunidade <span className="text-blue-500">🌐</span>
          </h2>
        </div>

        <div className="flex items-center gap-3">
          {pedidosRecebidos.length > 0 && (
            <button 
              onClick={() => setAbaSolicitacoesAberta(true)}
              className="px-3 py-1.5 rounded-xl bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm animate-bounce"
            >
              👥 ({pedidosRecebidos.length})
            </button>
          )}

          {/* Ícone de Notificações no Header (Sem palavras, sem emojis, apenas ícone com contador) */}
          <div className="relative">
            <button 
              onClick={async () => {
                setAbaNotificacoesAberta(!abaNotificacoesAberta);
                if (!abaNotificacoesAberta) {
                  await BancoDeDados.marcarNotificacoesLidas(usuarioLogado.username);
                  setNotificacoes(await BancoDeDados.getNotificacoes(usuarioLogado.username));
                }
              }}
              className={`p-2.5 rounded-2xl border transition relative flex items-center justify-center ${darkMode ? 'bg-slate-900 border-slate-700 hover:bg-slate-800 text-white' : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-800'}`}
              title="Notificações"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {notificacoesNaoLidasCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] w-4 h-4 rounded-full font-black flex items-center justify-center shadow-md animate-bounce">
                  {notificacoesNaoLidasCount}
                </span>
              )}
            </button>

            {abaNotificacoesAberta && (
              <div className={`absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-3xl border shadow-2xl p-4 z-40 space-y-3 ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
                <div className="flex justify-between items-center border-b pb-2 border-slate-700">
                  <h4 className="font-extrabold text-xs uppercase tracking-wider">Notificações</h4>
                  <button onClick={() => setAbaNotificacoesAberta(false)} className="text-xs font-bold opacity-60">✕</button>
                </div>

                {notificacoes.length === 0 ? (
                  <p className="text-xs opacity-50 text-center py-6">Nenhuma notificação no momento.</p>
                ) : (
                  notificacoes.map((n, idx) => {
                    const matchUser = n.texto.match(/@([a-zA-Z0-9_]+)/);
                    const usernameNotif = matchUser ? matchUser[1] : null;
                    const perfilNotif = perfisReais.find(p => p.username === usernameNotif) || {};
                    const fotoNotif = perfilNotif.foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80';
                    const temStoryNotif = storiesFiltradosAmigos.some(s => s.username === usernameNotif);

                    return (
                      <div key={idx} className={`p-3 rounded-2xl border text-xs flex items-center gap-3 ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                        {usernameNotif ? (
                          <div 
                            onClick={() => clicarPerfilOuStory(usernameNotif)}
                            className={`w-9 h-9 rounded-full p-0.5 flex items-center justify-center flex-shrink-0 cursor-pointer transition ${temStoryNotif ? 'bg-gradient-to-tr from-amber-500 via-rose-600 to-yellow-400 animate-pulse shadow-md' : ''}`}
                          >
                            <img src={fotoNotif} className="w-full h-full rounded-full object-cover border border-white dark:border-slate-900" />
                          </div>
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-blue-600/20 text-blue-500 flex items-center justify-center font-bold flex-shrink-0">🔔</div>
                        )}

                        <div className="flex-1 min-w-0">
                          <p className="font-bold leading-snug">{n.texto}</p>
                          <span className="text-[10px] opacity-50 block mt-0.5">{n.horario}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Ícone / Foto de Perfil Direta no Header para acessar o próprio perfil */}
          <div 
            onClick={() => abrirPerfilPorUsername(usuarioLogado.username)}
            className="w-10 h-10 rounded-full p-0.5 border-2 border-blue-500 cursor-pointer hover:scale-105 transition shadow-sm overflow-hidden flex-shrink-0"
            title="Meu Perfil"
          >
            <img src={fotoPerfilOficial} alt="Meu Perfil" className="w-full h-full rounded-full object-cover" />
          </div>
        </div>
      </div>

      {abaSolicitacoesAberta && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className={`max-w-md w-full p-6 rounded-3xl shadow-2xl border space-y-4 ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <div className="flex justify-between items-center border-b pb-3 border-slate-700">
              <h3 className="font-extrabold text-sm">👥 Solicitações de Amizade Pendentes</h3>
              <button onClick={() => setAbaSolicitacoesAberta(false)} className="text-sm font-bold">✕</button>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto">
              {pedidosRecebidos.length === 0 ? (
                <p className="text-xs opacity-50 text-center py-6">Nenhuma solicitação pendente.</p>
              ) : (
                pedidosRecebidos.map(remetenteusername => {
                  const perfilRemetente = perfisReais.find(p => p.username === remetenteusername) || { nome: remetenteusername, username: remetenteusername };
                  return (
                    <div key={remetenteusername} className={`p-3 rounded-2xl border flex items-center justify-between text-xs ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="flex items-center gap-2.5">
                        <img src={perfilRemetente.foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'} className="w-8 h-8 rounded-full object-cover" />
                        <div>
                          <p className="font-bold">{perfilRemetente.nome}</p>
                          <p className="text-[10px] opacity-60">@{perfilRemetente.username}</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button 
                          onClick={async () => {
                            const perfisAtualizados = await BancoDeDados.aceitarPedidoAmizade(usuarioLogado.username, remetenteusername);
                            setPerfisReais(perfisAtualizados);
                            mostrarToast(`Amizade com @${remetenteusername} aceita! 🎉`);
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl font-bold"
                        >
                          Aceitar
                        </button>
                        <button 
                          onClick={async () => {
                            const perfisAtualizados = await BancoDeDados.recusarPedidoAmizade(usuarioLogado.username, remetenteusername);
                            setPerfisReais(perfisAtualizados);
                            mostrarToast('Solicitação recusada.');
                          }}
                          className="bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white px-3 py-1.5 rounded-xl font-bold"
                        >
                          Recusar
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

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
                  className="w-full h-56 rounded-2xl p-6 flex flex-col justify-center items-center text-center shadow-inner transition relative"
                  style={{ backgroundColor: corFundoStory }}
                >
                  <textarea 
                    rows="4"
                    placeholder="Digite sua mensagem. Digite @ para mencionar..."
                    value={textoStory}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTextoStory(val);
                      const ultimoIndiceArroba = val.lastIndexOf('@');
                      if (ultimoIndiceArroba !== -1 && (ultimoIndiceArroba === 0 || val[ultimoIndiceArroba - 1] === ' ')) {
                        const termo = val.substring(ultimoIndiceArroba + 1);
                        if (!termo.includes(' ')) {
                          setTermoBuscaMencao(termo);
                          setMenuSugestoesMencaoAberto(true);
                        } else {
                          setMenuSugestoesMencaoAberto(false);
                        }
                      } else {
                        setMenuSugestoesMencaoAberto(false);
                      }
                    }}
                    className="w-full bg-transparent text-white placeholder-white/70 text-lg font-bold text-center focus:outline-none resize-none"
                  />

                  {menuSugestoesMencaoAberto && (
                    <div className="absolute bottom-2 left-4 right-4 max-h-36 overflow-y-auto bg-slate-900/95 border border-slate-700 rounded-2xl p-2 shadow-2xl z-20 space-y-1 text-left backdrop-blur-md">
                      <p className="text-[10px] uppercase font-bold text-slate-400 px-2">Sugestões de Menção:</p>
                      {perfisSugeridosMencao.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-2">Nenhum perfil encontrado.</p>
                      ) : (
                        perfisSugeridosMencao.map(p => (
                          <div 
                            key={p.username}
                            onClick={() => {
                              const ultimoIndiceArroba = textoStory.lastIndexOf('@');
                              const textoBase = textoStory.substring(0, ultimoIndiceArroba);
                              setTextoStory(`${textoBase}@${p.username} `);
                              setMencaoStory(p.username);
                              setMenuSugestoesMencaoAberto(false);
                            }}
                            className="flex items-center gap-2.5 p-2 rounded-xl cursor-pointer hover:bg-slate-800 transition"
                          >
                            <img src={p.foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'} className="w-8 h-8 rounded-full object-cover border border-blue-500 shadow-sm" />
                            <div>
                              <p className="text-xs font-bold text-white leading-tight">{p.nome}</p>
                              <p className="text-[10px] text-blue-400">@{p.username}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
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
                  onClick={() => { if(textoStory.trim()) salvarStoryBanco('texto', textoStory, corFundoStory, mencaoStory); }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-3 rounded-xl shadow-md transition"
                >
                  Publicar Story de Texto 🚀
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-slate-700 rounded-2xl p-6 text-center space-y-3">
                  {enviandoMidia ? (
                    <p className="text-xs font-bold text-blue-500 animate-pulse py-8">Processando arquivo...</p>
                  ) : midiaStoryUrl ? (
                    tipoMidia === 'video' ? (
                      <video src={midiaStoryUrl} controls className="w-full h-44 object-cover rounded-xl" />
                    ) : (
                      <img src={midiaStoryUrl} alt="Preview" className="w-full h-44 object-cover rounded-xl" />
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
                            onChange={async (e) => {
                              const file = e.target.files[0];
                              if (file) {
                                setEnviandoMidia(true);
                                let urlPublica = '';
                                try {
                                  if (typeof BancoDeDados.uploadMidiaStory === 'function') {
                                    urlPublica = await BancoDeDados.uploadMidiaStory(file);
                                  }
                                } catch (err) {}
                                if (!urlPublica) {
                                  urlPublica = await processarArquivoParaUrl(file);
                                }
                                setEnviandoMidia(false);
                                if (urlPublica) {
                                  setTipoMidia(file.type.startsWith('video') ? 'video' : 'imagem');
                                  setMidiaStoryUrl(urlPublica);
                                }
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
                            onChange={async (e) => {
                              const file = e.target.files[0];
                              if (file) {
                                setEnviandoMidia(true);
                                let urlPublica = '';
                                try {
                                  if (typeof BancoDeDados.uploadMidiaStory === 'function') {
                                    urlPublica = await BancoDeDados.uploadMidiaStory(file);
                                  }
                                } catch (err) {}
                                if (!urlPublica) {
                                  urlPublica = await processarArquivoParaUrl(file);
                                }
                                setEnviandoMidia(false);
                                if (urlPublica) {
                                  setTipoMidia('video');
                                  setMidiaStoryUrl(urlPublica);
                                }
                              }
                            }} 
                            className="hidden" 
                          />
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1 relative">
                  <label className="text-xs font-bold opacity-70 block">Mencionar amigo (@username):</label>
                  <input 
                    type="text" 
                    placeholder="Ex: joaosilva" 
                    value={mencaoStory}
                    onChange={(e) => {
                      const val = e.target.value;
                      setMencaoStory(val);
                      setTermoBuscaMencao(val);
                      setMenuSugestoesMencaoAberto(val.length > 0);
                    }}
                    className={`w-full text-xs rounded-xl px-3 py-2 border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`}
                  />
                  
                  {menuSugestoesMencaoAberto && (
                    <div className={`absolute left-0 right-0 bottom-full mb-1 max-h-36 overflow-y-auto rounded-2xl border p-2 space-y-1 shadow-2xl z-20 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-300'}`}>
                      {perfisSugeridosMencao.map(p => (
                        <div 
                          key={p.username}
                          onClick={() => {
                            setMencaoStory(p.username);
                            setMenuSugestoesMencaoAberto(false);
                          }}
                          className={`flex items-center gap-2.5 p-2 rounded-xl cursor-pointer transition ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}
                        >
                          <img src={p.foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'} className="w-7 h-7 rounded-full object-cover" />
                          <div>
                            <p className="text-xs font-bold leading-tight">{p.nome}</p>
                            <p className="text-[10px] opacity-60">@{p.username}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {midiaStoryUrl && (
                  <button 
                    onClick={() => salvarStoryBanco(tipoMidia, midiaStoryUrl, '#1e293b', mencaoStory)}
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

      {usuarioStoryVisualizando && storyAtivoObj && (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4">
          <div className="relative max-w-md w-full h-[85vh] bg-slate-900 rounded-3xl overflow-hidden flex flex-col shadow-2xl border border-slate-800">
            
            <div className="absolute top-0 left-0 right-0 p-2 z-30 flex gap-1 bg-gradient-to-b from-black/80 to-transparent">
              {listaStoriesDoAutorAtual.map((st, idx) => (
                <div key={st.id} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white transition-all duration-100 ease-linear"
                    style={{
                      width: idx < indiceStoryAtual ? '100%' : idx === indiceStoryAtual ? `${progressoStory}%` : '0%'
                    }}
                  ></div>
                </div>
              ))}
            </div>

            <div className="absolute top-5 left-4 right-4 z-20 flex items-center justify-between">
              <div 
                onClick={() => { setUsuarioStoryVisualizando(null); abrirPerfilPorUsername(storyAtivoObj.username); }}
                className="flex items-center gap-2 cursor-pointer group"
              >
                <img src={storyAtivoObj.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'} className="w-9 h-9 rounded-full object-cover border-2 border-amber-500 shadow-md group-hover:scale-105 transition" />
                <div>
                  <span className="text-white text-xs font-bold drop-shadow-md block group-hover:underline">{storyAtivoObj.autor}</span>
                  <span className="text-white/70 text-[10px]">
                    {(() => {
                      const agora = Date.now();
                      const diffMs = agora - storyAtivoObj.id;
                      const diffMins = Math.floor(diffMs / (1000 * 60));
                      const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
                      const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

                      if (diffMins < 1) return 'Agora mesmo';
                      if (diffMins < 60) return `há ${diffMins}m atrás`;
                      if (diffHoras < 24) return `há ${diffHoras}h atrás`;
                      return `há ${diffDias}d atrás`;
                    })()}
                  </span>
                </div>
              </div>
              <button onClick={() => setUsuarioStoryVisualizando(null)} className="bg-black/50 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm hover:bg-black">✕</button>
            </div>

            <div onClick={voltarStory} className="absolute left-0 top-16 bottom-20 w-1/2 z-20 cursor-pointer" title="Anterior"></div>
            <div onClick={avancarStory} className="absolute right-0 top-16 bottom-20 w-1/2 z-20 cursor-pointer" title="Próximo"></div>

            <div className="flex-1 flex items-center justify-center w-full h-full relative bg-black">
              {storyAtivoObj.tipo === 'texto' ? (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center whitespace-pre-line" style={{ backgroundColor: storyAtivoObj.cor_fundo || '#1e293b' }}>
                  <p className="text-white text-lg sm:text-xl font-extrabold leading-relaxed drop-shadow-md">{storyAtivoObj.conteudo}</p>
                  {storyAtivoObj.mencao && (
                    <span 
                      onClick={() => { setUsuarioStoryVisualizando(null); abrirPerfilPorUsername(storyAtivoObj.mencao); }}
                      className="mt-4 bg-black/40 hover:bg-black/60 text-white text-xs font-bold px-4 py-1.5 rounded-full cursor-pointer transition shadow-md"
                    >
                      Mencionou @{storyAtivoObj.mencao}
                    </span>
                  )}
                </div>
              ) : storyAtivoObj.tipo === 'video' ? (
                <video src={storyAtivoObj.conteudo} autoPlay controls className="w-full h-full object-cover" />
              ) : (
                <img src={storyAtivoObj.conteudo} alt="Story" className="w-full h-full object-cover" />
              )}
            </div>

            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center z-30 gap-2">
              {storyAtivoObj.username === usuarioLogado.username ? (
                <div className="flex items-center justify-between w-full gap-2">
                  <button 
                    onClick={() => setModalVisualizadoresAberto(true)}
                    className="bg-black/60 hover:bg-black/80 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 border border-white/20 backdrop-blur-sm"
                  >
                    👁️ {(storyAtivoObj.visualizacoes || []).length} Visualizações
                  </button>
                  <button onClick={async () => { await BancoDeDados.excluirStory(storyAtivoObj.id); setStories(await BancoDeDados.getStories()); setUsuarioStoryVisualizando(null); mostrarToast('Story excluído.'); }} className="bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg hover:bg-red-700">Excluir</button>
                </div>
              ) : (
                <div className="flex items-center gap-2 w-full">
                  <button onClick={() => repostarStory(storyAtivoObj)} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg flex-1 transition">
                    ✨ Repostar
                  </button>
                  <button onClick={curtirStoryAtual} className={`px-4 py-2 rounded-xl text-xs font-bold shadow-lg flex items-center gap-1 transition ${(storyAtivoObj.curtidas || []).includes(usuarioLogado.username) ? 'bg-red-600 text-white' : 'bg-black/60 text-white hover:bg-black'}`}>
                    ❤️ ({(storyAtivoObj.curtidas || []).length})
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {modalVisualizadoresAberto && storyAtivoObj && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="max-w-sm w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-white space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm flex items-center gap-2">👁️ Quem visualizou este story</h3>
              <button onClick={() => setModalVisualizadoresAberto(false)} className="text-xs opacity-70 font-bold hover:opacity-100">✕</button>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2.5 pr-1">
              {(!storyAtivoObj.visualizacoes || storyAtivoObj.visualizacoes.length === 0) ? (
                <p className="text-xs text-slate-400 text-center py-6">Nenhuma visualização registrada ainda.</p>
              ) : (
                storyAtivoObj.visualizacoes.map((vis, i) => (
                  <div key={i} className="flex items-center justify-between bg-slate-800/60 p-2.5 rounded-2xl border border-slate-700/50">
                    <div 
                      className="flex items-center gap-2.5 min-w-0 cursor-pointer"
                      onClick={() => {
                        setModalVisualizadoresAberto(false);
                        setUsuarioStoryVisualizando(null);
                        abrirPerfilPorUsername(vis.username);
                      }}
                    >
                      <img src={vis.foto} className="w-8 h-8 rounded-full object-cover border border-blue-500" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate text-white hover:underline">{vis.nome}</p>
                        <p className="text-[10px] text-blue-400 truncate">@{vis.username}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-semibold flex-shrink-0">{vis.horario}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <div className={`max-w-4xl mx-auto p-4 rounded-2xl border shadow-sm flex items-center gap-3 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <svg className="w-5 h-5 opacity-50 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input 
          type="text" 
          placeholder="Buscar publicações, versículos ou pessoas..." 
          value={termoBuscaComunidade}
          onChange={(e) => setTermoBuscaComunidade(e.target.value)}
          className={`w-full text-xs sm:text-sm bg-transparent focus:outline-none ${darkMode ? 'text-white placeholder-slate-400' : 'text-slate-900 placeholder-slate-500'}`}
        />
        {termoBuscaComunidade && (
          <button onClick={() => setTermoBuscaComunidade('')} className="text-xs opacity-60 hover:opacity-100 font-bold px-2">Limpar</button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <div className="lg:col-span-3 space-y-6">
          <div className={`p-6 rounded-3xl border shadow-md space-y-4 text-center ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div 
              onClick={() => abrirPerfilPorUsername(usuarioLogado.username)} 
              className="cursor-pointer group inline-block relative"
            >
              <div className={`w-24 h-24 rounded-full p-1 mx-auto flex items-center justify-center transition ${temStoryAtivo ? (meusStoriesVistos ? 'border-2 border-slate-500/40 opacity-75' : 'bg-gradient-to-tr from-amber-500 via-rose-600 to-yellow-400 animate-pulse shadow-xl') : ''}`}>
                <img src={fotoPerfilOficial} alt="Avatar" className="w-full h-full rounded-full object-cover border-2 border-white dark:border-slate-900 shadow-md group-hover:opacity-90 transition" />
              </div>
              {temStoryAtivo && (
                <span className={`absolute bottom-0 right-1 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full shadow-md ${meusStoriesVistos ? 'bg-slate-600 text-slate-300' : 'bg-gradient-to-r from-rose-600 to-amber-500 text-white'}`}>Story</span>
              )}
            </div>

            <div>
              <h3 onClick={() => abrirPerfilPorUsername(usuarioLogado.username)} className="font-extrabold text-sm cursor-pointer hover:text-blue-500 hover:underline transition">{nomePerfilOficial}</h3>
              <p onClick={() => abrirPerfilPorUsername(usuarioLogado.username)} className="text-xs text-blue-500 font-bold mt-0.5 cursor-pointer hover:underline">@{usuarioLogado.username}</p>
              <p className="text-xs opacity-75 mt-2">{meuPerfilBanco.biografia || usuarioLogado.biografia || 'Praticando a fé e o amor ao próximo.'}</p>
            </div>
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-2 text-center">
              <div className={`p-3 rounded-2xl border shadow-xs ${darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-slate-200'}`}>
                <span className="block font-extrabold text-blue-500 text-sm">{meusAmigos.length}</span>
                <span className="text-[10px] opacity-60 uppercase font-bold tracking-wider">Amigos</span>
              </div>
              <div className={`p-3 rounded-2xl border shadow-xs ${darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-slate-200'}`}>
                <span className="block font-extrabold text-indigo-500 text-sm">{publicacoes.filter(p => p.username === usuarioLogado.username).length}</span>
                <span className="text-[10px] opacity-60 uppercase font-bold tracking-wider">Posts</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 space-y-6">

          <div className={`p-4 rounded-3xl border shadow-md flex gap-3 overflow-x-auto ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div 
              onClick={() => setModalCriarStoryAberto(true)}
              className={`relative flex-shrink-0 w-28 h-44 rounded-2xl border flex flex-col justify-end items-center pb-3 cursor-pointer overflow-hidden transition hover:scale-105 shadow-sm ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-300'}`}
            >
              <div className="absolute inset-0 bg-cover bg-center opacity-40" style={{ backgroundImage: `url(${fotoPerfilOficial})` }}></div>
              <div className="absolute top-3 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">+</div>
              <span className="relative z-10 text-[11px] font-bold text-center px-1">Adicionar story</span>
            </div>

            {listaAutoresStories.map((autorItem) => {
              const st = autorItem.primeiroStory;
              const todosVistos = autorItem.todosVistos;

              return (
                <div 
                  key={autorItem.username} 
                  onClick={() => clicarPerfilOuStory(autorItem.username)}
                  className={`relative flex-shrink-0 w-28 h-44 rounded-2xl overflow-hidden cursor-pointer shadow-md transition hover:scale-105 border-2 bg-slate-900 flex flex-col justify-between p-2 ${todosVistos ? 'border-slate-500/40 opacity-70' : 'border-amber-500'}`}
                >
                  {st.tipo === 'texto' ? (
                    <div className="absolute inset-0 p-3 flex items-center justify-center text-center" style={{ backgroundColor: st.cor_fundo || '#1e293b' }}>
                      <p className="text-white text-[11px] font-bold line-clamp-4">{st.conteudo}</p>
                    </div>
                  ) : st.tipo === 'video' ? (
                    <video src={st.conteudo} className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <img src={st.conteudo} alt="Story" className="absolute inset-0 w-full h-full object-cover" />
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                  
                  <div className={`relative z-10 w-8 h-8 rounded-full p-0.5 shadow-md ${todosVistos ? 'border border-slate-400 bg-slate-600' : 'bg-gradient-to-tr from-amber-500 via-rose-600 to-yellow-400'}`}>
                    <img src={autorItem.avatar} className="w-full h-full rounded-full object-cover border border-white" />
                  </div>

                  <span 
                    onClick={(e) => {
                      e.stopPropagation();
                      abrirPerfilPorUsername(autorItem.username);
                    }} 
                    className="relative z-10 text-white text-[11px] font-bold truncate hover:underline"
                  >
                    {autorItem.autor}
                  </span>
                </div>
              );
            })}
          </div>

          <div className={`p-6 rounded-3xl border shadow-md space-y-4 ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <h3 className="text-xs font-bold uppercase tracking-wider opacity-60">Criar Publicação</h3>
            <form onSubmit={publicarPost} className="space-y-3">
              <input type="text" placeholder="Tema da publicação..." value={pubTema} onChange={(e) => setPubTema(e.target.value)} className={`w-full text-sm rounded-xl px-4 py-2.5 border font-bold ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`} />
              <textarea rows="3" placeholder="Compartilhe algo com a comunidade..." value={pubTexto} onChange={(e) => setPubTexto(e.target.value)} className={`w-full text-sm rounded-xl px-4 py-2.5 border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`}></textarea>
              {pubImagem && <img src={pubImagem} alt="Preview" className="w-full h-48 object-cover rounded-2xl shadow-sm" />}
              <div className="flex justify-between items-center">
                <label className={`text-xs px-4 py-2 rounded-xl cursor-pointer flex items-center gap-1.5 transition font-semibold ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}>
                  📷 Imagem
                  <input type="file" accept="image/*" onChange={async (e) => { const f = e.target.files[0]; if(f) { const url = await processarArquivoParaUrl(f); setPubImagem(url); } }} className="hidden" />
                </label>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold transition shadow-md">Publicar</button>
              </div>
            </form>
          </div>

          <div className={`p-6 rounded-3xl border shadow-md space-y-3 ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <h3 className="text-xs font-bold uppercase tracking-wider opacity-60">Mural de Pedidos de Oração 🙏</h3>
            <form onSubmit={criarPedidoOracaoHandler} className="flex gap-2">
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
                  const apoiadores = p.apoiadores || [];
                  const jaApoiou = apoiadores.includes(usuarioLogado.username);
                  return (
                    <div key={p.id} className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs gap-2 ${darkMode ? 'bg-slate-800/40 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}>
                      <div className="flex-1 min-w-0 flex items-center gap-2">
                        <span 
                          onClick={() => abrirPerfilPorUsername(p.username)} 
                          className="cursor-pointer font-bold text-blue-500 hover:underline"
                        >
                          @{p.username}:
                        </span>
                        <span className="break-words">{p.texto}</span>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button 
                          onClick={async () => { 
                            const atualizados = typeof BancoDeDados.apoiarPedidoOracao === 'function' ? await BancoDeDados.apoiarPedidoOracao(p.id, usuarioLogado.username) : []; 
                            setPedidosOracao(atualizados || []); 
                          }} 
                          className={`px-3.5 py-1.5 rounded-xl font-bold transition ${jaApoiou ? 'bg-red-600 text-white' : 'bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white'}`}
                        >
                          ❤️ Apoiar ({p.apoios || 0})
                        </button>
                        {souDonoDoPedido && (
                          <button onClick={async () => { if (window.confirm('Excluir pedido?')) { const atualizados = await BancoDeDados.excluirPedidoOracao(p.id); setPedidosOracao(atualizados || []); mostrarToast('Pedido excluído.'); }}} className="text-slate-400 hover:text-red-500 p-1.5 font-bold transition">✕</button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-md font-bold opacity-75">Feed da Comunidade</h3>
            {publicacoesFiltradas.length === 0 ? (
              <div className={`p-8 text-center rounded-3xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <p className="text-xs opacity-60">Nenhuma publicação encontrada.</p>
              </div>
            ) : (
              publicacoesFiltradas.map((post) => renderizarCardPublicacao(post, false))
            )}
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div className={`p-6 rounded-3xl border shadow-md space-y-4 ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <h4 className="text-xs font-bold uppercase tracking-wider opacity-60">💬 Chat & Mensagens</h4>

            <div className="space-y-3">
              <p className="text-xs opacity-60">Selecione um amigo para conversar:</p>
              {amigosLista.length === 0 ? (
                <p className="text-xs opacity-40 text-center py-6">Nenhum amigo conectado no chat ainda.</p>
              ) : (
                amigosLista.map(amigo => {
                  const naoLidasDoAmigo = notificacoes.filter(
                    n => !n.lida && n.tipo === 'mensagem' && n.texto.includes(`@${amigo.username}`)
                  ).length;
                  const amigoTemStory = storiesFiltradosAmigos.some(s => s.username === amigo.username);

                  return (
                    <div 
                      key={amigo.username} 
                      onClick={() => abrirChatComAmigo(amigo.username)} 
                      className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition ${darkMode ? 'bg-slate-800/40 border-slate-700 hover:bg-slate-800' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            clicarPerfilOuStory(amigo.username);
                          }}
                          className={`w-10 h-10 rounded-full p-0.5 flex items-center justify-center flex-shrink-0 transition ${amigoTemStory ? 'bg-gradient-to-tr from-amber-500 via-rose-600 to-yellow-400 shadow-md animate-pulse cursor-pointer' : ''}`}
                        >
                          <img src={amigo.foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'} className="w-full h-full rounded-full object-cover border border-white dark:border-slate-900" />
                        </div>

                        <div className="min-w-0">
                          <p onClick={(e) => { e.stopPropagation(); abrirPerfilPorUsername(amigo.username); }} className="text-xs font-bold truncate hover:underline">{amigo.nome}</p>
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
          </div>

          <div className={`p-6 rounded-3xl border shadow-md space-y-4 ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <h4 className="text-xs font-bold uppercase tracking-wider opacity-60">👥 Membros da Comunidade</h4>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {membrosFiltrados.length === 0 ? (
                <p className="text-xs opacity-40 text-center py-4">Nenhum membro encontrado.</p>
              ) : (
                membrosFiltrados.map(membro => {
                  const enviei = meuPerfilBanco.pedidos_enviados?.includes(membro.username);
                  const membroTemStory = storiesFiltradosAmigos.some(s => s.username === membro.username);

                  return (
                    <div key={membro.username} className={`p-3 rounded-2xl border flex items-center justify-between text-xs gap-2 ${darkMode ? 'bg-slate-800/30 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                      <div 
                        className="flex items-center gap-2.5 min-w-0 cursor-pointer" 
                        onClick={() => clicarPerfilOuStory(membro.username)}
                      >
                        <div className={`w-8 h-8 rounded-full p-0.5 flex items-center justify-center flex-shrink-0 transition ${membroTemStory ? 'bg-gradient-to-tr from-amber-500 via-rose-600 to-yellow-400 shadow-sm animate-pulse' : ''}`}>
                          <img src={membro.foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'} className="w-full h-full rounded-full object-cover border border-white" />
                        </div>
                        <div className="min-w-0">
                          <p onClick={(e) => { e.stopPropagation(); abrirPerfilPorUsername(membro.username); }} className="font-bold truncate hover:underline">{membro.nome}</p>
                          <p className="text-[10px] opacity-50 truncate">@{membro.username}</p>
                        </div>
                      </div>

                      <button 
                        disabled={enviei}
                        title={enviei ? 'Solicitação Pendente' : 'Seguir / Adicionar'}
                        onClick={async () => {
                          await BancoDeDados.enviarPedidoAmizade(usuarioLogado.username, membro.username);
                          mostrarToast(`Pedido de amizade enviado para @${membro.username}!`);
                        }}
                        className={`p-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center flex-shrink-0 ${
                          enviei 
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/35 cursor-not-allowed' 
                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                        }`}
                      >
                        {enviei ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

      </div>

      {chatComUsuario ? (
        <div className="fixed bottom-4 right-4 z-50 w-[360px] sm:w-[380px] h-[500px] max-h-[85vh] rounded-3xl shadow-2xl border flex flex-col overflow-hidden backdrop-blur-md bg-slate-900 border-slate-700 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0"></span>
              <span className="text-[11px] font-extrabold text-white uppercase tracking-wider truncate">Chat com @{chatComUsuario}</span>
            </div>
            <button 
              onClick={() => setChatComUsuario(null)} 
              className="text-[11px] font-bold text-slate-400 hover:text-white px-2 py-1 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition flex-shrink-0"
            >
              ✕ Minimizar
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-950/60 flex flex-col">
            {mensagensChat.length === 0 ? (
              <div className="text-center my-auto opacity-50 text-xs text-slate-400">
                Inicie uma conversa em tempo real com @{chatComUsuario}!
              </div>
            ) : (
              mensagensChat.map((m, idx) => {
                const souEu = m.remetente === usuarioLogado.username;
                return (
                  <div key={idx} className={`flex flex-col max-w-[80%] ${souEu ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                    <div className={`p-3 rounded-2xl text-xs shadow-sm ${souEu ? 'bg-blue-600 text-white rounded-br-none' : 'bg-slate-800 text-slate-200 rounded-bl-none'}`}>
                      {m.midia ? (
                        m.tipoMidia === 'video' ? (
                          <video src={m.midia} controls className="w-48 h-36 object-cover rounded-xl mb-1" />
                        ) : (
                          <img src={m.midia} alt="Mídia" className="w-48 h-36 object-cover rounded-xl mb-1" />
                        )
                      ) : null}
                      <p className="break-words">{m.texto}</p>
                    </div>
                    <span className="text-[9px] opacity-50 mt-1">{m.horario}</span>
                  </div>
                );
              })
            )}
            <div ref={chatFimRef} />
          </div>

          {mostrarEmojisChat && (
            <div className="bg-slate-800 p-2 border-t border-slate-700 flex gap-2 flex-wrap justify-around">
              {['😊', '❤️', '🙏', '🔥', '✨', '👏', '😂', '👍', '🎉', '💡'].map(emoji => (
                <button 
                  key={emoji} 
                  type="button" 
                  onClick={() => setTextoMensagemChat(prev => prev + emoji)}
                  className="text-lg hover:scale-125 transition"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={enviarMensagemChat} className="p-3 bg-slate-900 border-t border-slate-700 flex items-center gap-2">
            <button 
              type="button" 
              onClick={() => setMostrarEmojisChat(!mostrarEmojisChat)}
              className="text-slate-400 hover:text-white p-1.5 transition text-base"
              title="Emojis"
            >
              😊
            </button>

            <label className="text-slate-400 hover:text-white p-1.5 cursor-pointer transition text-base" title="Enviar Imagem">
              📷
              <input type="file" accept="image/*" onChange={(e) => enviarMidiaChat(e, 'imagem')} className="hidden" />
            </label>

            <label className="text-slate-400 hover:text-white p-1.5 cursor-pointer transition text-base" title="Enviar Vídeo">
              📹
              <input type="file" accept="video/*" onChange={(e) => enviarMidiaChat(e, 'video')} className="hidden" />
            </label>

            <input 
              type="text" 
              placeholder={enviandoMidia ? "Processando..." : "Digite sua mensagem..."}
              disabled={enviandoMidia}
              value={textoMensagemChat}
              onChange={(e) => setTextoMensagemChat(e.target.value)}
              className="flex-1 bg-slate-800 text-xs text-white rounded-xl px-3 py-2 border border-slate-700 focus:outline-none focus:border-blue-500"
            />

            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-2 rounded-xl font-bold transition shadow-sm">
              Enviar
            </button>
          </form>
        </div>
      ) : (
        <div className="fixed bottom-6 right-6 z-50">
          <button 
            onClick={() => {
              if (amigosLista.length > 0) {
                setChatComUsuario(amigosLista[0].username);
              } else {
                mostrarToast('Você precisa ter amigos adicionados na comunidade para iniciar um chat rápido!');
              }
            }}
            className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl flex items-center justify-center transition hover:scale-110 relative group border-2 border-white/20"
            title="Abrir Chat"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {notificacoes.some(n => !n.lida && n.tipo === 'mensagem') && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center shadow-md animate-bounce">
                !
              </span>
            )}
            <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-1 rounded-xl bg-slate-900 text-white text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition shadow-xl pointer-events-none border border-slate-700">
              Abrir Chat 
            </span>
          </button>
        </div>
      )}
  
    </div>
  );
}