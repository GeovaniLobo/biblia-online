import React, { useState, useEffect, useRef } from 'react';
import { BancoDeDados } from '../services/database';
import PerfilPublico from './PerfilPublico';
import ChatPrivado from './ChatPrivado';

export default function Comunidade({ usuarioLogado, darkMode }) {
  const [publicacoes, setPublicacoes] = useState([]);
  const [stories, setStories] = useState([]);
  const [perfisReais, setPerfisReais] = useState([]);
  const [notificacoes, setNotificacoes] = useState([]);
  const [pedidosOracao, setPedidosOracao] = useState([]);
  
  const [carregandoComunidade, setCarregandoComunidade] = useState(true);
  const [perfilSelecionado, setPerfilSelecionado] = useState(null);
  const [chatComUsuario, setChatComUsuario] = useState(null);
  const [mostrarNotificacoes, setMostrarNotificacoes] = useState(false);

  // Estados dos Stories
  const [storyAberto, setStoryAberto] = useState(null);
  const [menuPerfilAberto, setMenuPerfilAberto] = useState(false);
  const [modalCriarStoryTexto, setModalCriarStoryTexto] = useState(false); // Modal para o Story de Texto
  const [textoStoryDireto, setTextoStoryDireto] = useState('');
  
  const [compartilhandoPubNoStory, setCompartilhandoPubNoStory] = useState(null);
  const [novoComentarioStory, setNovoComentarioStory] = useState('');
  const fileInputRef = useRef(null);
  const fileUploadStoryRef = useRef(null);

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
        const st = await BancoDeDados.getStories();
        const pedidos = await BancoDeDados.getPedidosOracao();

        setPerfisReais(perfis || []);
        setPublicacoes(pubs || []);
        setNotificacoes(notifs || []);
        setStories(st || []);
        setPedidosOracao(pedidos || []);
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
        const st = await BancoDeDados.getStories();

        setPublicacoes(pubs || []);
        setNotificacoes(notifs || []);
        setPerfisReais(perfis || []);
        setPedidosOracao(pedidos || []);
        setStories(st || []);
      } catch (e) {}
    }, 4000);

    return () => clearInterval(intervalo);
  }, [usuarioLogado]);

  const perfilAtualNoBanco = perfisReais.find(p => p.username === usuarioLogado.username) || { amigos: [], pedidos_enviados: [], pedidos_recebidos: [] };

  const handleSalvarStoryMidia = async (e, tipoMidia = 'imagem') => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const midiaBase64 = reader.result;
      const novoStory = {
        id: Date.now(),
        autor: usuarioLogado.nome,
        username: usuarioLogado.username,
        avatar: usuarioLogado.foto,
        midia: midiaBase64,
        tipo: tipoMidia,
        reacoes: { amem: [], gloria: [], amor: [] },
        comentarios: []
      };
      const atualizados = await BancoDeDados.salvarStory(novoStory);
      setStories(atualizados || []);
      setMenuPerfilAberto(false);
      alert('Story publicado com sucesso! 🚀');
    };
    reader.readAsDataURL(file);
  };

  const publicarStoryTextoDireto = async (e) => {
    e.preventDefault();
    if (!textoStoryDireto.trim()) return;
    const novoStory = {
      id: Date.now(),
      autor: usuarioLogado.nome,
      username: usuarioLogado.username,
      avatar: usuarioLogado.foto,
      textoCompartilhado: textoStoryDireto.trim(),
      temaCompartilhado: 'Pensamento do Dia',
      tipo: 'texto',
      reacoes: { amem: [], gloria: [], amor: [] },
      comentarios: []
    };
    const atualizados = await BancoDeDados.salvarStory(novoStory);
    setStories(atualizados || []);
    setTextoStoryDireto('');
    setModalCriarStoryTexto(false);
    setMenuPerfilAberto(false);
    alert('Story em texto publicado com sucesso! 📝');
  };

  const compartilharPubComoStory = async (post, tipoMidia = 'texto', arquivoMidia = '') => {
    const novoStory = {
      id: Date.now(),
      autor: usuarioLogado.nome,
      username: usuarioLogado.username,
      avatar: usuarioLogado.foto,
      textoCompartilhado: post.texto,
      temaCompartilhado: post.tema,
      midia: arquivoMidia || post.imagem || '',
      tipo: tipoMidia,
      reacoes: { amem: [], gloria: [], amor: [] },
      comentarios: []
    };
    const atualizados = await BancoDeDados.salvarStory(novoStory);
    setStories(atualizados || []);
    setCompartilhandoPubNoStory(null);
    alert('Publicação compartilhada no Story com sucesso! ✨');
  };

  const reagirStory = async (storyId, tipoReacao) => {
    const stList = await BancoDeDados.getStories();
    const st = stList.find(s => s.id === storyId);
    if (st) {
      let reacoes = st.reacoes || { amem: [], gloria: [], amor: [] };
      Object.keys(reacoes).forEach(t => {
        reacoes[t] = (reacoes[t] || []).filter(u => u !== usuarioLogado.username);
      });
      reacoes[tipoReacao].push(usuarioLogado.username);

      await fetch(`https://apodufxahgxlghmlzagq.supabase.co/rest/v1/stories?id=eq.${storyId}`, {
        method: 'PATCH',
        headers: { 'apikey': 'sb_publishable_vDRu0b_QIKsCCqt7ZgPwdg_G0QTJ8Eo', 'Authorization': `Bearer sb_publishable_vDRu0b_QIKsCCqt7ZgPwdg_G0QTJ8Eo`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reacoes })
      });
      const novaLista = await BancoDeDados.getStories();
      setStories(novaLista);
      setStoryAberto(novaLista.find(s => s.id === storyId));
    }
  };

  const comentarStory = async (storyId, e) => {
    e.preventDefault();
    if (!novoComentarioStory.trim()) return;
    const stList = await BancoDeDados.getStories();
    const st = stList.find(s => s.id === storyId);
    if (st) {
      const comentarios = st.comentarios || [];
      comentarios.push({ autor: usuarioLogado.nome, username: usuarioLogado.username, texto: novoComentarioStory.trim() });

      await fetch(`https://apodufxahgxlghmlzagq.supabase.co/rest/v1/stories?id=eq.${storyId}`, {
        method: 'PATCH',
        headers: { 'apikey': 'sb_publishable_vDRu0b_QIKsCCqt7ZgPwdg_G0QTJ8Eo', 'Authorization': `Bearer sb_publishable_vDRu0b_QIKsCCqt7ZgPwdg_G0QTJ8Eo`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ comentarios })
      });
      setNovoComentarioStory('');
      const novaLista = await BancoDeDados.getStories();
      setStories(novaLista);
      setStoryAberto(novaLista.find(s => s.id === storyId));
    }
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
  const storiesPorUsuario = stories.reduce((acc, st) => {
    if (!acc[st.username]) acc[st.username] = [];
    acc[st.username].push(st);
    return acc;
  }, {});

  return (
    <div className={`space-y-6 max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-6 relative ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
      
      {/* INPUTS DE MÍDIA */}
      <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={(e) => handleSalvarStoryMidia(e, 'imagem')} className="hidden" />
      <input type="file" accept="image/*,video/*" ref={fileUploadStoryRef} onChange={(e) => handleSalvarStoryMidia(e, e.target.files[0]?.type.includes('video') ? 'video' : 'imagem')} className="hidden" />

      {/* MODAL PARA CRIAR STORY DE TEXTO ESTILO WHATSAPP */}
      {modalCriarStoryTexto && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <form onSubmit={publicarStoryTextoDireto} className={`p-6 rounded-2xl max-w-md w-full space-y-4 border shadow-2xl ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <h3 className="text-sm font-bold uppercase tracking-wider">Criar Story em Texto</h3>
            <textarea 
              rows="4" 
              placeholder="Digite seu pensamento ou versículo para o story..." 
              value={textoStoryDireto} 
              onChange={(e) => setTextoStoryDireto(e.target.value)}
              className={`w-full text-sm rounded-xl p-3 border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`}
            ></textarea>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 rounded-xl transition">Publicar Story</button>
              <button type="button" onClick={() => setModalCriarStoryTexto(false)} className="px-4 text-xs text-red-400">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL DE COMPARTILHAR PUBLICAÇÃO NO STORY */}
      {compartilhandoPubNoStory && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className={`p-6 rounded-2xl max-w-md w-full space-y-4 border ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <h3 className="text-sm font-bold uppercase tracking-wider">Compartilhar no Story</h3>
            <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700 space-y-1">
              <span className="text-xs font-bold text-blue-400">{compartilhandoPubNoStory.tema}</span>
              <p className="text-xs opacity-80">{compartilhandoPubNoStory.texto}</p>
            </div>
            <div className="space-y-2">
              <button onClick={() => compartilharPubComoStory(compartilhandoPubNoStory, 'texto')} className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 rounded-xl transition">
                📝 Compartilhar como Texto
              </button>
              <button onClick={() => fileUploadStoryRef.current.click()} className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold py-2.5 rounded-xl transition">
                📷 Enviar com Foto/Vídeo do Aparelho
              </button>
              <button onClick={() => setCompartilhandoPubNoStory(null)} className="w-full text-xs text-red-400 py-1.5">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* TELA CHEIA DO STORY COM REAÇÕES E COMENTÁRIOS */}
      {storyAberto && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-md w-full h-[85vh] bg-slate-900 rounded-2xl overflow-hidden flex flex-col justify-between p-4 border border-slate-700 shadow-2xl">
            <div className="flex justify-between items-center z-10">
              <div className="flex items-center gap-2">
                <img src={storyAberto.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'} className="w-8 h-8 rounded-full object-cover border border-white" />
                <span className="text-white text-xs font-bold">{storyAberto.autor}</span>
              </div>
              <button onClick={() => setStoryAberto(null)} className="text-white font-bold text-lg bg-black/50 w-8 h-8 rounded-full flex items-center justify-center">✕</button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center my-2 overflow-y-auto space-y-3">
              {storyAberto.midia && storyAberto.tipo === 'video' ? (
                <video src={storyAberto.midia} controls className="max-h-64 max-w-full rounded-xl" />
              ) : storyAberto.midia ? (
                <img src={storyAberto.midia} className="max-h-64 max-w-full object-contain rounded-xl" />
              ) : null}

              {storyAberto.textoCompartilhado && (
                <div className="p-4 bg-slate-800/90 rounded-xl border border-slate-700 text-center space-y-1 w-full">
                  <span className="text-xs font-bold text-blue-400">{storyAberto.temaCompartilhado || 'Pensamento'}</span>
                  <p className="text-xs text-white opacity-90">{storyAberto.textoCompartilhado}</p>
                </div>
              )}
            </div>

            <div className="space-y-3 pt-2 border-t border-slate-800">
              <div className="flex justify-center gap-2">
                <button onClick={() => reagirStory(storyAberto.id, 'amem')} className="bg-slate-800 hover:bg-blue-600 text-white text-xs px-3 py-1 rounded-lg font-bold transition">
                  ❤️ Amém ({(storyAberto.reacoes?.amem || []).length})
                </button>
                <button onClick={() => reagirStory(storyAberto.id, 'gloria')} className="bg-slate-800 hover:bg-amber-600 text-white text-xs px-3 py-1 rounded-lg font-bold transition">
                  🙌 Glória ({(storyAberto.reacoes?.gloria || []).length})
                </button>
                <button onClick={() => reagirStory(storyAberto.id, 'amor')} className="bg-slate-800 hover:bg-pink-600 text-white text-xs px-3 py-1 rounded-lg font-bold transition">
                  ✨ Amor ({(storyAberto.reacoes?.amor || []).length})
                </button>
              </div>

              <form onSubmit={(e) => comentarStory(storyAberto.id, e)} className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Responder ao story..." 
                  value={novoComentarioStory} 
                  onChange={(e) => setNovoComentarioStory(e.target.value)} 
                  className="w-full text-xs rounded-xl px-3 py-2 bg-slate-800 border border-slate-700 text-white" 
                />
                <button type="submit" className="bg-blue-600 text-white text-xs px-4 py-2 rounded-xl font-bold">Enviar</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MENU AO CLICAR NA FOTO DE PERFIL */}
      {menuPerfilAberto && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className={`p-6 rounded-2xl max-w-xs w-full space-y-4 text-center shadow-2xl border ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <img src={usuarioLogado.foto} className="w-16 h-16 rounded-full object-cover mx-auto border-2 border-blue-500 shadow-md" />
            <h4 className="text-sm font-bold">O que você deseja fazer?</h4>

            <div className="space-y-2 pt-2">
              <button onClick={() => { setMenuPerfilAberto(false); setModalCriarStoryTexto(true); }} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 rounded-xl transition shadow-sm">
                📝 Criar Story em Texto
              </button>
              <button onClick={() => { setMenuPerfilAberto(false); fileInputRef.current.click(); }} className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 rounded-xl transition shadow-sm">
                📸 Tirar Foto com a Câmera
              </button>
              <button onClick={() => { setMenuPerfilAberto(false); fileUploadStoryRef.current.click(); }} className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold py-2.5 rounded-xl transition shadow-sm">
                📁 Enviar Mídia da Galeria
              </button>
              <button onClick={() => { setMenuPerfilAberto(false); setPerfilSelecionado({ username: usuarioLogado.username, nome: usuarioLogado.nome, biografia: usuarioLogado.biografia, foto: usuarioLogado.foto }); }} className={`w-full text-xs font-bold py-2.5 rounded-xl border transition ${darkMode ? 'bg-slate-850 border-slate-700 text-white' : 'bg-slate-100 border-slate-300 text-slate-800'}`}>
                👤 Entrar no Meu Perfil
              </button>
              <button onClick={() => setMenuPerfilAberto(false)} className="w-full text-xs text-red-400 font-semibold py-1.5">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* COLUNA ESQUERDA & CENTRO (FEED E STORIES) */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* CARROSSEL DE STORIES */}
        <div className={`p-4 rounded-2xl border flex items-center gap-4 overflow-x-auto ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          
          {/* SEU STORY (EXIBE SEU CÍRCULO E ABRE O MENU AO CLICAR) */}
          <div className="flex flex-col items-center flex-shrink-0 cursor-pointer" onClick={() => setMenuPerfilAberto(true)}>
            <div className={`w-14 h-14 rounded-full p-0.5 flex items-center justify-center relative ${storiesPorUsuario[usuarioLogado.username]?.length > 0 ? 'border-2 border-purple-500 bg-purple-500/10' : 'border-2 border-blue-500 bg-blue-500/10'}`}>
              <img src={usuarioLogado.foto} className="w-full h-full rounded-full object-cover" />
              <span className="absolute bottom-0 right-0 bg-blue-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold shadow-md">+</span>
            </div>
            <span className="text-[10px] font-bold mt-1">Seu Story</span>
          </div>

          {/* SEU PRÓPRIO STORY PUBLICADO NO CARROSSEL */}
          {storiesPorUsuario[usuarioLogado.username]?.map(st => (
            <div key={st.id} onClick={() => setStoryAberto(st)} className="flex flex-col items-center flex-shrink-0 cursor-pointer group">
              <div className="w-14 h-14 rounded-full border-2 border-blue-500 p-0.5 flex items-center justify-center bg-blue-500/10 transition group-hover:scale-105">
                <img src={st.midia || usuarioLogado.foto} className="w-full h-full rounded-full object-cover" />
              </div>
              <span className="text-[10px] font-bold mt-1">Meu Story</span>
            </div>
          ))}

          {/* STORIES DOS OUTROS AMIGOS */}
          {Object.keys(storiesPorUsuario).map(username => {
            if (username === usuarioLogado.username) return null;
            const userStories = storiesPorUsuario[username];
            const ultimoStory = userStories[userStories.length - 1];

            return (
              <div key={username} onClick={() => setStoryAberto(ultimoStory)} className="flex flex-col items-center flex-shrink-0 cursor-pointer group">
                <div className="w-14 h-14 rounded-full border-2 border-purple-500 p-0.5 flex items-center justify-center bg-purple-500/10 transition group-hover:scale-105">
                  <img src={ultimoStory.midia || ultimoStory.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'} className="w-full h-full rounded-full object-cover" />
                </div>
                <span className="text-[10px] font-bold mt-1 truncate max-w-[60px]">{ultimoStory.autor}</span>
              </div>
            );
          })}
        </div>

        {/* CRIAR PUBLICAÇÃO */}
        <div className={`p-5 rounded-2xl border space-y-4 ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-xs'}`}>
          <h3 className="text-xs font-bold uppercase tracking-wider opacity-60">Criar Publicação</h3>
          <form onSubmit={publicarPost} className="space-y-3">
            <input type="text" placeholder="Tema da publicação..." value={pubTema} onChange={(e) => setPubTema(e.target.value)} className={`w-full text-sm rounded-xl px-3 py-2 border font-bold ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`} />
            <textarea rows="3" placeholder="Compartilhe algo com a comunidade..." value={pubTexto} onChange={(e) => setPubTexto(e.target.value)} className={`w-full text-sm rounded-xl px-3 py-2 border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`}></textarea>
            {pubImagem && <img src={pubImagem} alt="Preview" className="w-full h-32 object-cover rounded-xl" />}
            <div className="flex justify-between items-center">
              <label className={`text-xs px-3 py-2 rounded-xl cursor-pointer flex items-center gap-1.5 transition ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}>
                Imagem
                <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files[0]; if(f) { const r = new FileReader(); r.onloadend = () => setPubImagem(r.result); r.readAsDataURL(f); } }} className="hidden" />
              </label>
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition">Publicar</button>
            </div>
          </form>
        </div>

        {/* FEED */}
        <div className="space-y-6">
          <h3 className="text-md font-bold opacity-70">Feed da Comunidade</h3>
          {publicacoes.map((post) => {
            const souDono = post.username === usuarioLogado.username;
            const estaEditando = postEditandoId === post.id;
            const perfilAutorReal = perfisReais.find(p => p.username === post.username) || {};
            const avatarAtualizado = perfilAutorReal.foto || post.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80';
            const nomeAtualizado = perfilAutorReal.nome || post.autor;

            const reacoes = post.reacoes || { amem: [], gloria: [], amor: [] };
            const meuAmem = (reacoes.amem || []).includes(usuarioLogado.username);
            const meuGloria = (reacoes.gloria || []).includes(usuarioLogado.username);
            const meuAmor = (reacoes.amor || []).includes(usuarioLogado.username);

            return (
              <div key={post.id} className={`p-6 rounded-2xl border shadow-xs space-y-4 ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 cursor-pointer group" onClick={() => { const encontrado = perfisReais.find(p => p.username === post.username); if (encontrado) setPerfilSelecionado(encontrado); }}>
                    <img src={avatarAtualizado} alt="Avatar" className="w-10 h-10 rounded-full object-cover border border-blue-500/30" />
                    <div>
                      <p className="text-sm font-bold group-hover:text-blue-500 transition">{nomeAtualizado}</p>
                      <p className="text-[10px] opacity-50">@{post.username || 'usuario'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button onClick={() => setCompartilhandoPubNoStory(post)} className="text-[11px] bg-purple-600/20 text-purple-400 hover:bg-purple-600 hover:text-white px-2.5 py-1 rounded-lg font-bold transition">
                      🔄 Compartilhar no Story
                    </button>
                    {souDono && !estaEditando && (
                      <>
                        <button onClick={() => { setPostEditandoId(post.id); setTextoEditado(post.texto); setTemaEditado(post.tema); }} className="text-xs text-blue-400 hover:underline font-semibold">Editar</button>
                        <button onClick={() => excluirPost(post.id)} className="text-xs text-red-400 hover:underline font-semibold">Excluir</button>
                      </>
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
                    {post.imagem && <img src={post.imagem} alt="Post" className="w-full h-64 object-cover rounded-xl" />}
                    <p className="text-sm leading-relaxed opacity-90">{post.texto}</p>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2 border-t border-slate-700/50">
                  <button onClick={() => reagir(post.id, 'amem')} className={`text-xs px-3 py-1.5 rounded-lg font-bold border transition flex items-center gap-1.5 ${meuAmem ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-800/40 text-slate-300 border-slate-700'}`}>
                    ❤️ Amém ({(reacoes.amem || []).length})
                  </button>
                  <button onClick={() => reagir(post.id, 'gloria')} className={`text-xs px-3 py-1.5 rounded-lg font-bold border transition flex items-center gap-1.5 ${meuGloria ? 'bg-amber-600 text-white border-amber-500' : 'bg-slate-800/40 text-slate-300 border-slate-700'}`}>
                    🙌 Glória ({(reacoes.gloria || []).length})
                  </button>
                  <button onClick={() => reagir(post.id, 'amor')} className={`text-xs px-3 py-1.5 rounded-lg font-bold border transition flex items-center gap-1.5 ${meuAmor ? 'bg-pink-600 text-white border-pink-500' : 'bg-slate-800/40 text-slate-300 border-slate-700'}`}>
                    ✨ Amor ({(reacoes.amor || []).length})
                  </button>
                </div>
                
                <form onSubmit={(e) => comentar(post.id, post.username, e)} className="flex gap-2">
                  <input type="text" placeholder="Comentar..." value={novoComentario[post.id] || ''} onChange={(e) => setNovoComentario({ ...novoComentario, [post.id]: e.target.value })} className={`w-full text-xs rounded-lg px-3 py-2 border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`} />
                  <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2 rounded-lg font-bold transition">Enviar</button>
                </form>
              </div>
            );
          })}
        </div>
      </div>

      {/* COLUNA DIREITA (CHAT) */}
      <div className="space-y-6">
        <div className={`p-5 rounded-2xl border space-y-4 ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-xs'}`}>
          <h4 className="text-xs font-bold uppercase tracking-wider opacity-60">💬 Chat & Mensagens</h4>

          {chatComUsuario ? (
            <div className="space-y-3">
              <button onClick={() => setChatComUsuario(null)} className="text-xs text-blue-500 hover:underline font-semibold">← Fechar Chat</button>
              <ChatPrivado destinatario={chatComUsuario} usuarioLogado={usuarioLogado} darkMode={darkMode} onVerPerfil={(p) => setPerfilSelecionado(p)} />
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs opacity-60">Selecione um amigo abaixo para conversar:</p>
              {amigosLista.length === 0 ? (
                <p className="text-xs opacity-40 text-center py-6">Nenhum amigo conectado no chat ainda.</p>
              ) : (
                amigosLista.map(amigo => (
                  <div key={amigo.username} onClick={() => setChatComUsuario(amigo.username)} className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${darkMode ? 'bg-slate-850 border-slate-700 hover:bg-slate-800' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}>
                    <div className="flex items-center gap-2">
                      <img src={amigo.foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'} className="w-8 h-8 rounded-full object-cover" />
                      <div>
                        <p className="text-xs font-bold">{amigo.nome}</p>
                        <p className="text-[10px] opacity-50">@{amigo.username}</p>
                      </div>
                    </div>
                    <span className="text-xs bg-blue-600 text-white px-2.5 py-1 rounded-lg font-bold">Abrir Chat</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}