import React, { useState, useEffect } from 'react';
import { BancoDeDados } from '../services/database';
import PerfilPublico from './PerfilPublico';
import ChatPrivado from './ChatPrivado';

export default function Comunidade({ usuarioLogado, darkMode }) {
  const [publicacoes, setPublicacoes] = useState([]);
  const [stories, setStories] = useState([]);
  const [perfisReais, setPerfisReais] = useState([]);
  const [notificacoes, setNotificacoes] = useState([]);
  const [pedidosOracao, setPedidosOracao] = useState([]);
  
  const [perfilSelecionado, setPerfilSelecionado] = useState(null);
  const [chatComUsuario, setChatComUsuario] = useState(null);
  const [mostrarNotificacoes, setMostrarNotificacoes] = useState(false);

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
      setPerfisReais(perfis);
      setPublicacoes(pubs);
      setNotificacoes(notifs);
      setStories(BancoDeDados.getStories());
      setPedidosOracao(BancoDeDados.getPedidosOracao());
    }
    carregarDadosIniciais();

    const intervalo = setInterval(async () => {
      const pubs = await BancoDeDados.getPublicacoes();
      const notifs = await BancoDeDados.getNotificacoes(usuarioLogado.username);
      const perfis = await BancoDeDados.getPerfisCadastrados();
      setPublicacoes(pubs);
      setNotificacoes(notifs);
      setPerfisReais(perfis);
    }, 4000);

    return () => clearInterval(intervalo);
  }, [usuarioLogado]);

  const perfilAtualNoBanco = perfisReais.find(p => p.username === usuarioLogado.username) || { amigos: [], pedidos_enviados: [], pedidos_recebidos: [] };

  const abrirNotificacoes = async () => {
    setMostrarNotificacoes(!mostrarNotificacoes);
    if (!mostrarNotificacoes) {
      await BancoDeDados.marcarNotificacoesLidas(usuarioLogado.username);
      const notifs = await BancoDeDados.getNotificacoes(usuarioLogado.username);
      setNotificacoes(notifs);
    }
  };

  const hojeStr = new Date().toISOString().slice(5, 10);
  const aniversariantesHoje = perfisReais.filter(p => p.data_nascimento && p.data_nascimento.slice(5, 10) === hojeStr);

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

  const curtir = async (id, usernameAutorPost) => {
    const atualizados = await BancoDeDados.curtirPublicacao(id, usernameAutorPost);
    setPublicacoes([...atualizados]);
    if (usuarioLogado.username !== usernameAutorPost) {
      await BancoDeDados.adicionarNotificacao(usernameAutorPost, `@${usuarioLogado.username} curtiu sua publicação.`, 'curtida');
    }
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

  const criarPedidoOracao = (e) => {
    e.preventDefault();
    if (!novoPedidoTexto.trim()) return;
    const pedido = {
      id: Date.now(),
      autor: usuarioLogado.nome,
      username: usuarioLogado.username,
      texto: novoPedidoTexto.trim(),
      apoios: 0
    };
    const atualizados = BancoDeDados.salvarPedidoOracao(pedido);
    setPedidosOracao(atualizados);
    setNovoPedidoTexto('');
  };

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

  if (chatComUsuario) {
    return (
      <div className="space-y-4 max-w-3xl mx-auto w-full">
        <button onClick={() => setChatComUsuario(null)} className="text-xs text-blue-500 hover:underline font-semibold flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          Voltar para o Feed
        </button>
        <ChatPrivado 
          destinatario={chatComUsuario} 
          usuarioLogado={usuarioLogado} 
          darkMode={darkMode} 
          onVerPerfil={(perfil) => setPerfilSelecionado(perfil)} 
        />
      </div>
    );
  }

  const naoLidas = notificacoes.filter(n => !n.lida).length;

  const perfisAmigosOuPendentes = perfisReais.filter(p => {
    if (p.username === usuarioLogado.username) return false;
    const ehAmigo = perfilAtualNoBanco.amigos?.includes(p.username);
    const envieiPedido = perfilAtualNoBanco.pedidos_enviados?.includes(p.username);
    const recebiPedido = perfilAtualNoBanco.pedidos_recebidos?.includes(p.username);
    return ehAmigo || envieiPedido || recebiPedido;
  });

  const sugestoesAmizade = perfisReais.filter(p => {
    if (p.username === usuarioLogado.username) return false;
    const ehAmigo = perfilAtualNoBanco.amigos?.includes(p.username);
    const envieiPedido = perfilAtualNoBanco.pedidos_enviados?.includes(p.username);
    const recebiPedido = perfilAtualNoBanco.pedidos_recebidos?.includes(p.username);
    return !ehAmigo && !envieiPedido && !recebiPedido;
  });

  return (
    <div className="space-y-8 max-w-4xl mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-8 relative">
      <div className="space-y-6">
        <div className={`p-6 rounded-2xl border text-center space-y-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
          <img src={usuarioLogado.foto} alt="Perfil" className="w-20 h-20 rounded-full object-cover mx-auto border-2 border-blue-500 shadow-md" />
          <div>
            <h3 className="text-lg font-bold">{usuarioLogado.nome}</h3>
            <p className="text-xs text-blue-400 font-semibold">@{usuarioLogado.username}</p>
            <p className="text-xs opacity-75 mt-1">{usuarioLogado.biografia}</p>
          </div>

          <div className="relative pt-2">
            <button onClick={abrirNotificacoes} className={`w-full py-2 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-between ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-100 border-slate-300 text-slate-800'}`}>
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                Notificações
              </span>
              {naoLidas > 0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">{naoLidas}</span>}
            </button>

            {mostrarNotificacoes && (
              <div className={`absolute left-0 right-0 mt-2 p-3 rounded-2xl border shadow-2xl z-35 max-h-60 overflow-y-auto space-y-2 text-left ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
                <h4 className="text-xs font-bold opacity-60 border-b pb-1">Suas Notificações</h4>
                {notificacoes.length === 0 ? (
                  <p className="text-xs opacity-50 text-center py-4">Nenhuma notificação por enquanto.</p>
                ) : (
                  notificacoes.map((notif, idx) => {
                    const matchUsername = notif.texto.match(/@([a-zA-Z0-9_]+)/);
                    const usernameExtraido = matchUsername ? matchUsername[1] : null;

                    return (
                      <div 
                        key={idx} 
                        onClick={() => {
                          if (usernameExtraido) {
                            if (notif.tipo === 'mensagem' || notif.texto.includes('mensagem')) {
                              setChatComUsuario(usernameExtraido);
                              setMostrarNotificacoes(false);
                            } else {
                              const perfilEncontrado = perfisReais.find(p => p.username === usernameExtraido);
                              if (perfilEncontrado) {
                                setPerfilSelecionado(perfilEncontrado);
                                setMostrarNotificacoes(false);
                              }
                            }
                          }
                        }}
                        className={`p-2.5 rounded-xl text-xs cursor-pointer transition ${!notif.lida ? 'bg-blue-500/15 font-semibold border border-blue-500/30' : 'opacity-75 hover:opacity-100'} ${darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
                      >
                        <p>{notif.texto}</p>
                        <span className="text-[9px] opacity-40 block mt-0.5">{notif.horario}</span>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>

        {aniversariantesHoje.length > 0 && (
          <div className={`p-4 rounded-2xl border space-y-2 text-center ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-amber-50 border-amber-200'}`}>
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500">Aniversariantes de Hoje</h4>
            {aniversariantesHoje.map(aniv => (
              <div key={aniv.username} className="flex items-center justify-center gap-2">
                <img src={aniv.foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'} className="w-8 h-8 rounded-full object-cover" />
                <span className="text-xs font-bold">{aniv.nome}</span>
              </div>
            ))}
          </div>
        )}

        <div className={`p-5 rounded-2xl border space-y-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
          <h4 className="text-xs font-bold uppercase tracking-wider opacity-60 flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            Amigos & Pedidos
          </h4>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {perfisAmigosOuPendentes.length === 0 ? (
              <p className="text-[11px] opacity-50 text-center py-4">Nenhum amigo adicionado ainda.</p>
            ) : (
              perfisAmigosOuPendentes.map((perfil) => {
                const ehAmigo = perfilAtualNoBanco.amigos?.includes(perfil.username);
                const envieiPedido = perfilAtualNoBanco.pedidos_enviados?.includes(perfil.username);
                const recebiPedido = perfilAtualNoBanco.pedidos_recebidos?.includes(perfil.username);

                return (
                  <div key={perfil.username} className={`flex items-center justify-between text-xs p-2.5 rounded-xl border ${darkMode ? 'bg-slate-800/40 border-slate-700/50' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => setPerfilSelecionado(perfil)}>
                      <img src={perfil.foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'} alt="Avatar" className="w-7 h-7 rounded-full object-cover" />
                      <div>
                        <span className="font-bold hover:text-blue-500 truncate block max-w-[80px]">{perfil.nome}</span>
                        <span className="text-[9px] opacity-50">@{perfil.username}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {ehAmigo ? (
                        <button onClick={() => setChatComUsuario(perfil.username)} className="bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white p-2 rounded-xl font-bold flex items-center justify-center transition" title="Abrir Chat">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                        </button>
                      ) : envieiPedido ? (
                        <span className="text-[10px] text-amber-500 italic font-semibold px-2">Pendente</span>
                      ) : recebiPedido ? (
                        <div className="flex gap-1">
                          <button onClick={async () => { await BancoDeDados.aceitarPedidoAmizade(usuarioLogado.username, perfil.username); setPerfisReais(await BancoDeDados.getPerfisCadastrados()); }} className="bg-emerald-500 text-white px-2 py-1 rounded text-[10px] font-bold">Aceitar</button>
                          <button onClick={async () => { await BancoDeDados.rejeitarPedidoAmizade(usuarioLogado.username, perfil.username); setPerfisReais(await BancoDeDados.getPerfisCadastrados()); }} className="bg-red-500 text-white px-1.5 py-1 rounded text-[10px]">✕</button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="md:col-span-2 space-y-6">
        <div className={`p-5 rounded-2xl border space-y-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
          <h3 className="text-xs font-bold uppercase tracking-wider opacity-60 flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            Criar Publicação
          </h3>
          <form onSubmit={publicarPost} className="space-y-3">
            <input type="text" placeholder="Tema da publicação..." value={pubTema} onChange={(e) => setPubTema(e.target.value)} className={`w-full text-sm rounded-xl px-3 py-2 border font-bold ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`} />
            <textarea rows="3" placeholder="Compartilhe algo com a comunidade..." value={pubTexto} onChange={(e) => setPubTexto(e.target.value)} className={`w-full text-sm rounded-xl px-3 py-2 border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`}></textarea>
            {pubImagem && <img src={pubImagem} alt="Preview" className="w-full h-32 object-cover rounded-xl" />}
            <div className="flex justify-between items-center">
              <label className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-3 py-2 rounded-xl cursor-pointer flex items-center gap-1.5 transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                Imagem
                <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files[0]; if(f) { const r = new FileReader(); r.onloadend = () => setPubImagem(r.result); r.readAsDataURL(f); } }} className="hidden" />
              </label>
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition">Publicar</button>
            </div>
          </form>
        </div>

        <div className={`p-5 rounded-2xl border space-y-3 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <h3 className="text-xs font-bold uppercase tracking-wider opacity-60">Pedidos de Oração</h3>
          <form onSubmit={criarPedidoOracao} className="flex gap-2">
            <input type="text" placeholder="Compartilhe um pedido de oração..." value={novoPedidoTexto} onChange={(e) => setNovoPedidoTexto(e.target.value)} className={`w-full text-xs rounded-xl px-3 py-2 border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`} />
            <button type="submit" className="bg-blue-600 text-white text-xs px-4 py-2 rounded-xl font-bold">Pedir Oração</button>
          </form>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {pedidosOracao.map(p => (
              <div key={p.id} className={`p-3 rounded-xl border flex items-center justify-between text-xs ${darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <div>
                  <p className="font-bold">@{p.username}: {p.texto}</p>
                </div>
                <button onClick={() => setPedidosOracao(BancoDeDados.apoiarPedidoOracao(p.id))} className="bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white px-3 py-1 rounded-lg font-bold transition">
                  Apoiar ({p.apoios || 0})
                </button>
              </div>
            ))}
          </div>
        </div>

        {sugestoesAmizade.length > 0 && (
          <div className={`p-5 rounded-2xl border space-y-3 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
            <h3 className="text-xs font-bold uppercase tracking-wider opacity-60">Sugestões de Amizade</h3>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
              {sugestoesAmizade.map(perfil => (
                <div key={perfil.username} className={`flex-shrink-0 w-36 p-3 rounded-xl border flex flex-col items-center text-center space-y-2 ${darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <img src={perfil.foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'} alt="Avatar" className="w-12 h-12 rounded-full object-cover cursor-pointer border border-blue-500" onClick={() => setPerfilSelecionado(perfil)} />
                  <div className="w-full truncate">
                    <span className="font-bold text-xs truncate block cursor-pointer hover:text-blue-500" onClick={() => setPerfilSelecionado(perfil)}>{perfil.nome}</span>
                    <span className="text-[10px] opacity-50 block">@{perfil.username}</span>
                  </div>
                  <button 
                    onClick={async () => { 
                      await BancoDeDados.enviarPedidoAmizade(usuarioLogado.username, perfil.username); 
                      setPerfisReais(await BancoDeDados.getPerfisCadastrados()); 
                    }} 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-[11px] py-1.5 rounded-lg font-bold transition shadow-sm"
                  >
                    Adicionar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-6">
          <h3 className="text-md font-bold opacity-70 flex items-center gap-1.5">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
            Feed da Comunidade
          </h3>
          {publicacoes.map((post) => {
            const souDono = post.username === usuarioLogado.username;
            const estaEditando = postEditandoId === post.id;

            // Busca o perfil atualizado do autor no banco para garantir que a foto e o nome acompanhem o perfil real
            const perfilAutorReal = perfisReais.find(p => p.username === post.username) || {};
            const avatarAtualizado = perfilAutorReal.foto || post.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80';
            const nomeAtualizado = perfilAutorReal.nome || post.autor;

            return (
              <div key={post.id} className={`p-6 rounded-2xl border shadow-xs space-y-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 cursor-pointer group" onClick={() => { const encontrado = perfisReais.find(p => p.username === post.username || p.nome === post.autor); if (encontrado) setPerfilSelecionado(encontrado); }}>
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
                      <button onClick={() => setPostEditandoId(null)} className="px-3 py-1.5 rounded-xl text-xs opacity-70">Cancelar`,</button>
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

                <div className="flex gap-4 pt-2 border-t border-slate-700/50">
                  <button onClick={() => curtir(post.id, post.username)} className="text-xs font-bold text-red-400 flex items-center gap-1.5 hover:opacity-80 transition">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                    {post.curtidas || 0} Curtidas
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
    </div>
  );
}