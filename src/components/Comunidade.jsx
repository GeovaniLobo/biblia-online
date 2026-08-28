import React, { useState, useEffect } from 'react';
import { BancoDeDados } from '../services/database';
import PerfilPublico from './PerfilPublico';
import ChatPrivado from './ChatPrivado';

export default function Comunidade({ usuarioLogado, darkMode }) {
  const [publicacoes, setPublicacoes] = useState([]);
  const [perfisReais, setPerfisReais] = useState([]);
  const [notificacoes, setNotificacoes] = useState([]);
  const [pedidosOracao, setPedidosOracao] = useState([]);
  
  const [carregandoComunidade, setCarregandoComunidade] = useState(true);
  const [perfilSelecionado, setPerfilSelecionado] = useState(null);
  const [chatComUsuario, setChatComUsuario] = useState(null);

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

        setPerfisReais(perfis || []);
        setPublicacoes(pubs || []);
        setNotificacoes(notifs || []);
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

        setPublicacoes(pubs || []);
        setNotificacoes(notifs || []);
        setPerfisReais(perfis || []);
        setPedidosOracao(pedidos || []);
      } catch (e) {}
    }, 5000);

    return () => clearInterval(intervalo);
  }, [usuarioLogado]);

  const perfilAtualNoBanco = perfisReais.find(p => p.username === usuarioLogado.username) || { amigos: [], pedidos_enviados: [], pedidos_recebidos: [] };

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

  return (
    <div className={`w-full px-4 sm:px-6 lg:px-10 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
      
      {/* ================= COLUNA 1: PERFIL DO USUÁRIO (3 colunas de 12) ================= */}
      <div className="lg:col-span-3 space-y-6">
        <div className={`p-6 rounded-3xl border shadow-md space-y-4 text-center ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <img 
            src={usuarioLogado.foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'} 
            alt="Meu Avatar" 
            className="w-20 h-20 rounded-full object-cover mx-auto border-4 border-blue-500 shadow-md" 
          />
          <div>
            <h3 className="font-extrabold text-sm">{usuarioLogado.nome}</h3>
            <p className="text-xs text-blue-500 font-bold mt-0.5">@{usuarioLogado.username}</p>
            <p className="text-xs opacity-75 mt-2">{usuarioLogado.biografia || 'Praticando a fé e o amor ao próximo.'}</p>
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-2 text-center">
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <span className="block font-extrabold text-blue-500 text-sm">{perfilAtualNoBanco.amigos?.length || 0}</span>
              <span className="text-[10px] opacity-60 uppercase font-bold">Amigos</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <span className="block font-extrabold text-indigo-500 text-sm">{publicacoes.filter(p => p.username === usuarioLogado.username).length}</span>
              <span className="text-[10px] opacity-60 uppercase font-bold">Posts</span>
            </div>
          </div>
        </div>
      </div>

      {/* ================= COLUNA 2: FEED E PUBLICAÇÕES (6 colunas de 12) ================= */}
      <div className="lg:col-span-6 space-y-6">

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
              <div key={post.id} className={`p-6 rounded-3xl border shadow-md space-y-4 ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 cursor-pointer group" onClick={() => { const encontrado = perfisReais.find(p => p.username === post.username); if (encontrado) setPerfilSelecionado(encontrado); }}>
                    <img src={avatarAtualizado} alt="Avatar" className="w-11 h-11 rounded-full object-cover border-2 border-blue-500/30 shadow-sm" />
                    <div>
                      <p className="text-sm font-bold group-hover:text-blue-500 transition">{nomeAtualizado}</p>
                      <p className="text-[10px] opacity-50">@{post.username || 'usuario'}</p>
                    </div>
                  </div>

                  {souDono && !estaEditando && (
                    <div className="flex gap-2">
                      <button onClick={() => { setPostEditandoId(post.id); setTextoEditado(post.texto); setTemaEditado(post.tema); }} className="text-xs text-blue-400 hover:underline font-semibold">Editar</button>
                      <button onClick={() => excluirPost(post.id)} className="text-xs text-red-400 hover:underline font-semibold">Excluir</button>
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
                    <h4 className="text-lg font-bold">{post.tema}</h4>
                    {post.imagem && <img src={post.imagem} alt="Post" className="w-full h-80 object-cover rounded-2xl shadow-sm" />}
                    <p className="text-sm leading-relaxed opacity-90">{post.texto}</p>
                  </div>
                )}

                {/* BOTÕES DE REAÇÃO COM CONTRASTE PERFEITO */}
                <div className="flex items-center gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <button 
                    onClick={() => reagir(post.id, 'amem')} 
                    className={`text-xs px-3.5 py-2 rounded-xl font-bold border transition flex items-center gap-1.5 ${
                      meuAmem 
                        ? 'bg-blue-600 text-white border-blue-500 shadow-sm' 
                        : darkMode 
                          ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700' 
                          : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50 shadow-xs'
                    }`}
                  >
                    <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                    <span>Amém ({(reacoes.amem || []).length})</span>
                  </button>

                  <button 
                    onClick={() => reagir(post.id, 'gloria')} 
                    className={`text-xs px-3.5 py-2 rounded-xl font-bold border transition flex items-center gap-1.5 ${
                      meuGloria 
                        ? 'bg-amber-600 text-white border-amber-500 shadow-sm' 
                        : darkMode 
                          ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700' 
                          : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50 shadow-xs'
                    }`}
                  >
                    <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    <span>Glória ({(reacoes.gloria || []).length})</span>
                  </button>

                  <button 
                    onClick={() => reagir(post.id, 'amor')} 
                    className={`text-xs px-3.5 py-2 rounded-xl font-bold border transition flex items-center gap-1.5 ${
                      meuAmor 
                        ? 'bg-pink-600 text-white border-pink-500 shadow-sm' 
                        : darkMode 
                          ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700' 
                          : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50 shadow-xs'
                    }`}
                  >
                    <svg className="w-4 h-4 text-pink-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                    <span>Amor ({(reacoes.amor || []).length})</span>
                  </button>
                </div>
                
                {/* COMENTÁRIOS */}
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
          })}
        </div>
      </div>

      {/* ================= COLUNA 3: CHAT E MENSAGENS LARGO (3 colunas de 12) ================= */}
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
                <p className="text-xs opacity-40 text-center py-8">Nenhum amigo conectado no chat ainda.</p>
              ) : (
                amigosLista.map(amigo => {
                  const naoLidasDoAmigo = notificacoes.filter(
                    n => !n.lida && n.tipo === 'mensagem' && n.texto.includes(`@${amigo.username}`)
                  ).length;

                  return (
                    <div 
                      key={amigo.username} 
                      onClick={() => setChatComUsuario(amigo.username)} 
                      className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition ${darkMode ? 'bg-slate-800/40 border-slate-700 hover:bg-slate-800' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img src={amigo.foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
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
                        <button 
                          title="Abrir chat"
                          className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition shadow-sm flex items-center justify-center"
                        >
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
      </div>

    </div>
  );
}