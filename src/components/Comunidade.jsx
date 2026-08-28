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
    <div className={`space-y-6 max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-6 relative ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
      
      {/* COLUNA ESQUERDA & CENTRO (FEED) */}
      <div className="lg:col-span-2 space-y-6">

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

        {/* MURAL DE PEDIDOS DE ORAÇÃO */}
        <div className={`p-5 rounded-2xl border space-y-3 ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
          <h3 className="text-xs font-bold uppercase tracking-wider opacity-60">Mural de Pedidos de Oração</h3>
          <form onSubmit={criarPedidoOracao} className="flex gap-2">
            <input 
              type="text" 
              placeholder="Compartilhe um pedido de oração..." 
              value={novoPedidoTexto} 
              onChange={(e) => setNovoPedidoTexto(e.target.value)} 
              className={`w-full text-xs rounded-xl px-3 py-2 border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`} 
            />
            <button type="submit" className="bg-blue-600 text-white text-xs px-4 py-2 rounded-xl font-bold transition hover:bg-blue-700">Pedir Oração</button>
          </form>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {pedidosOracao.length === 0 ? (
              <p className="text-[11px] opacity-50 text-center py-4">Nenhum pedido de oração no momento.</p>
            ) : (
              pedidosOracao.map(p => {
                const souDonoDoPedido = p.username === usuarioLogado.username;
                return (
                  <div key={p.id} className={`p-3 rounded-xl border flex items-center justify-between text-xs gap-2 ${darkMode ? 'bg-slate-800/40 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}>
                    <div className="flex-1 min-w-0">
                      <span className="font-bold text-blue-500 mr-1">@{p.username}:</span>
                      <span className="break-words">{p.texto}</span>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={async () => { const atualizados = await BancoDeDados.apoiarPedidoOracao(p.id); setPedidosOracao(atualizados || []); }} className="bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white px-3 py-1.5 rounded-lg font-bold transition">
                        ❤️ Apoiar ({p.apoios || 0})
                      </button>
                      {souDonoDoPedido && (
                        <button onClick={async () => { if (window.confirm('Excluir pedido?')) { const atualizados = await BancoDeDados.excluirPedidoOracao(p.id); setPedidosOracao(atualizados || []); }}} className="text-slate-400 hover:text-red-500 p-1 font-bold transition">✕</button>
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

      {/* COLUNA DIREITA (CHAT LATERAL) */}
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
                  <div key={amigo.username} onClick={() => setChatComUsuario(amigo.username)} className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${darkMode ? 'bg-slate-800/40 border-slate-700 hover:bg-slate-800' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}>
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