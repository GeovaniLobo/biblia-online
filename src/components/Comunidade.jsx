import React, { useState, useEffect } from 'react';
import { BancoDeDados } from '../services/database';
import PerfilPublico from './PerfilPublico';
import ChatPrivado from './ChatPrivado';

export default function Comunidade({ usuarioLogado, darkMode }) {
  const [publicacoes, setPublicacoes] = useState([]);
  const [stories, setStories] = useState([]);
  const [perfisReais, setPerfisReais] = useState([]);
  const [notificacoes, setNotificacoes] = useState([]);
  
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

  const [modalStoryAberto, setModalStoryAberto] = useState(false);
  const [storyTexto, setStoryTexto] = useState('');
  const [storyImagem, setStoryImagem] = useState('');

  const [autorStoryAtivo, setAutorStoryAtivo] = useState(null);
  const [indiceStoryAtual, setIndiceStoryAtual] = useState(0);

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
      setPerfisReais(perfis);
      setPublicacoes(pubs);
      setStories(BancoDeDados.getStories());
      setNotificacoes(BancoDeDados.getNotificacoes(usuarioLogado.username));
    }
    carregarDadosIniciais();
  }, [usuarioLogado]);

  const perfilAtualNoBanco = perfisReais.find(p => p.username === usuarioLogado.username) || { amigos: [], pedidos_enviados: [], pedidos_recebidos: [] };

  const abrirNotificacoes = () => {
    setMostrarNotificacoes(!mostrarNotificacoes);
    if (!mostrarNotificacoes) {
      BancoDeDados.marcarNotificacoesLidas(usuarioLogado.username);
      setNotificacoes(BancoDeDados.getNotificacoes(usuarioLogado.username));
    }
  };

  const storiesAgrupados = stories.reduce((acc, story) => {
    const key = story.username || story.autor;
    if (!acc[key]) {
      acc[key] = { username: story.username, autor: story.autor, avatar: story.avatar, itens: [] };
    }
    acc[key].itens.push(story);
    return acc;
  }, {});
  const listaAutoresStories = Object.values(storiesAgrupados);

  const abrirGrupoStories = (grupo) => {
    setAutorStoryAtivo(grupo);
    setIndiceStoryAtual(0);
    grupo.itens.forEach(item => {
      BancoDeDados.registrarVisualizacaoStory(item.id, usuarioLogado.username);
    });
    setStories(BancoDeDados.getStories());
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

  const publicarStory = (e) => {
    e.preventDefault();
    if (!storyTexto.trim() && !storyImagem) return;
    const story = {
      id: Date.now(),
      autor: usuarioLogado.nome,
      username: usuarioLogado.username,
      avatar: usuarioLogado.foto,
      texto: storyTexto.trim(),
      imagem: storyImagem,
      visualizadores: []
    };
    const atualizados = BancoDeDados.salvarStory(story);
    setStories(atualizados);
    setStoryTexto('');
    setStoryImagem('');
    setModalStoryAberto(false);
  };

  const curtir = async (id, usernameAutorPost) => {
    const atualizados = await BancoDeDados.curtirPublicacao(id, usernameAutorPost);
    setPublicacoes([...atualizados]);
    if (usuarioLogado.username !== usernameAutorPost) {
      BancoDeDados.adicionarNotificacao(usernameAutorPost, `@${usuarioLogado.username} curtiu sua publicação.`, 'curtida');
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
      BancoDeDados.adicionarNotificacao(usernameAutorPost, `@${usuarioLogado.username} comentou na sua publicação.`, 'comentario');
    }
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
        <button onClick={() => setChatComUsuario(null)} className="text-xs text-blue-500 hover:underline font-semibold">← Voltar para o Feed</button>
        <ChatPrivado destinatario={chatComUsuario} usuarioLogado={usuarioLogado} darkMode={darkMode} />
      </div>
    );
  }

  const naoLidas = notificacoes.filter(n => !n.lida).length;

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

          <button onClick={() => setModalStoryAberto(true)} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-xl text-xs font-bold transition shadow-md">
            ➕ Adicionar Story
          </button>

          <div className="relative pt-2">
            <button onClick={abrirNotificacoes} className={`w-full py-2 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-between ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-100 border-slate-300 text-slate-800'}`}>
              <span>🔔 Notificações</span>
              {naoLidas > 0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">{naoLidas}</span>}
            </button>

            {mostrarNotificacoes && (
              <div className={`absolute left-0 right-0 mt-2 p-3 rounded-2xl border shadow-2xl z-30 max-h-60 overflow-y-auto space-y-2 text-left ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
                <h4 className="text-xs font-bold opacity-60 border-b pb-1">Suas Notificações</h4>
                {notificacoes.length === 0 ? (
                  <p className="text-xs opacity-50 text-center py-4">Nenhuma notificação por enquanto.</p>
                ) : (
                  notificacoes.map((notif, idx) => (
                    <div key={idx} className={`p-2 rounded-xl text-xs ${!notif.lida ? 'bg-blue-500/10 font-semibold' : 'opacity-75'}`}>
                      <p>{notif.texto}</p>
                      <span className="text-[9px] opacity-40">{notif.horario}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        <div className={`p-5 rounded-2xl border space-y-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
          <h4 className="text-xs font-bold uppercase tracking-wider opacity-60">Membros & Amizades 👥</h4>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {perfisReais.filter(p => p.username !== usuarioLogado.username).map((perfil) => (
              <div key={perfil.username} className={`flex items-center justify-between text-xs p-2.5 rounded-xl border ${darkMode ? 'bg-slate-800/40 border-slate-700/50' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => setPerfilSelecionado(perfil)}>
                  <img src={perfil.foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'} alt="Avatar" className="w-7 h-7 rounded-full object-cover" />
                  <div>
                    <span className="font-bold hover:text-blue-500 truncate block max-w-[90px]">{perfil.nome}</span>
                    <span className="text-[9px] opacity-50">@{perfil.username}</span>
                  </div>
                </div>
                <button onClick={() => setChatComUsuario(perfil.username)} className="bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white px-2 py-1 rounded-lg font-bold">💬 Chat</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="md:col-span-2 space-y-6">
        <div className={`p-5 rounded-2xl border space-y-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
          <h3 className="text-xs font-bold uppercase tracking-wider opacity-60">Criar Publicação 📝</h3>
          <form onSubmit={publicarPost} className="space-y-3">
            <input type="text" placeholder="Tema..." value={pubTema} onChange={(e) => setPubTema(e.target.value)} className={`w-full text-sm rounded-xl px-3 py-2 border font-bold ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`} />
            <textarea rows="3" placeholder="Compartilhe algo..." value={pubTexto} onChange={(e) => setPubTexto(e.target.value)} className={`w-full text-sm rounded-xl px-3 py-2 border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`}></textarea>
            {pubImagem && <img src={pubImagem} alt="Preview" className="w-full h-32 object-cover rounded-xl" />}
            <div className="flex justify-between items-center">
              <label className="bg-slate-800 text-slate-300 text-xs px-3 py-2 rounded-xl cursor-pointer">
                📷 Imagem <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files[0]; if(f) { const r = new FileReader(); r.onloadend = () => setPubImagem(r.result); r.readAsDataURL(f); } }} className="hidden" />
              </label>
              <button type="submit" className="bg-blue-600 text-white px-5 py-2 rounded-xl text-xs font-bold">Publicar</button>
            </div>
          </form>
        </div>

        <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {listaAutoresStories.map((grupo) => (
              <div key={grupo.username || grupo.autor} onClick={() => abrirGrupoStories(grupo)} className="flex flex-col items-center flex-shrink-0 w-20 text-center cursor-pointer group">
                <div className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-amber-500 to-pink-500">
                  <img src={grupo.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                </div>
                <span className="text-[11px] mt-1 truncate w-full font-semibold">{grupo.autor}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-md font-bold opacity-70">Feed da Comunidade 📖</h3>
          {publicacoes.map((post) => {
            const souDono = post.username === usuarioLogado.username;
            const estaEditando = postEditandoId === post.id;

            return (
              <div key={post.id} className={`p-6 rounded-2xl border shadow-xs space-y-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <div 
                    className="flex items-center gap-3 cursor-pointer group" 
                    onClick={() => { 
                      const encontrado = perfisReais.find(p => p.username === post.username || p.nome === post.autor); 
                      if (encontrado) setPerfilSelecionado(encontrado);
                    }}
                  >
                    <img src={post.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'} alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
                    <div>
                      <p className="text-sm font-bold group-hover:text-blue-500 transition">{post.autor}</p>
                      <p className="text-[10px] opacity-50">@{post.username || 'usuario'}</p>
                    </div>
                  </div>

                  {souDono && !estaEditando && (
                    <div className="flex gap-2">
                      <button onClick={() => { setPostEditandoId(post.id); setTextoEditado(post.texto); setTemaEditado(post.tema); }} className="text-xs text-blue-400 hover:underline font-semibold">✏️ Editar</button>
                      <button onClick={() => excluirPost(post.id)} className="text-xs text-red-400 hover:underline font-semibold">🗑️ Excluir</button>
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

                <div className="flex gap-4 pt-2 border-t border-slate-700/50">
                  <button onClick={() => curtir(post.id, post.username)} className="text-xs font-bold text-red-400">❤️ {post.curtidas || 0} Curtidas</button>
                </div>
                
                <form onSubmit={(e) => comentar(post.id, post.username, e)} className="flex gap-2">
                  <input type="text" placeholder="Comentar..." value={novoComentario[post.id] || ''} onChange={(e) => setNovoComentario({ ...novoComentario, [post.id]: e.target.value })} className={`w-full text-xs rounded-lg px-3 py-2 border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`} />
                  <button type="submit" className="bg-blue-600 text-white text-xs px-4 py-2 rounded-lg">Enviar</button>
                </form>
              </div>
            );
          })}
        </div>
      </div>

      {modalStoryAberto && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-md p-6 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <h3 className="text-lg font-bold mb-4">Adicionar Story</h3>
            <form onSubmit={publicarStory} className="space-y-4">
              <textarea rows="3" placeholder="Texto..." value={storyTexto} onChange={(e) => setStoryTexto(e.target.value)} className={`w-full text-sm rounded-xl px-3 py-2 border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`}></textarea>
              <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files[0]; if(f) { const r = new FileReader(); r.onloadend = () => setStoryImagem(r.result); r.readAsDataURL(f); } }} className="text-xs" />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setModalStoryAberto(false)} className="text-xs">Cancelar</button>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 text-xs rounded-xl">Publicar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {autorStoryAtivo !== null && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="relative w-full max-w-sm h-[80vh] bg-slate-900 rounded-3xl overflow-hidden border border-slate-700 flex flex-col justify-between p-6 text-white">
            <button onClick={() => setAutorStoryAtivo(null)} className="absolute top-4 right-4 text-lg font-bold">✕</button>
            <div className="flex-1 flex items-center justify-center text-center">
              <p className="text-xl">"{autorStoryAtivo.itens[indiceStoryAtual].texto}"</p>
            </div>
            <div className="bg-black/80 p-3 rounded-xl text-center text-xs">
              <p className="font-bold mb-1">👁️ Visto por ({autorStoryAtivo.itens[indiceStoryAtual].visualizadores?.length || 0}):</p>
              {autorStoryAtivo.itens[indiceStoryAtual].visualizadores?.join(', ') || 'Ninguém ainda'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}