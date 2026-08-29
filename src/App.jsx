import React, { useState, useEffect } from 'react';
import { BancoDeDados } from './services/database';
import AuthModal from './components/AuthModal';
import Comunidade from './components/Comunidade';
import Devocionais from './components/Devocionais';
import PerfilPublico from './components/PerfilPublico';
import EditarPerfil from './components/EditarPerfil';

export default function App() {
  const [versaoSelecionada, setVersaoSelecionada] = useState('acf');
  const [bibliaCompleta, setBibliaCompleta] = useState([]);
  const [livroIndex, setLivroIndex] = useState(0);
  const [capituloAtual, setCapituloAtual] = useState(1);
  const [carregando, setCarregando] = useState(true);

  const [darkMode, setDarkMode] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);
  const [termoBusca, setTermoBusca] = useState('');
  const [resultadosBusca, setResultadosBusca] = useState([]);

  const [modoFoco, setModoFoco] = useState(false);
  const [tamanhoFonte, setTamanhoFonte] = useState('text-base sm:text-lg');
  const [notaVersiculoAtiva, setNotaVersiculoAtiva] = useState(null);
  const [textoNota, setTextoNota] = useState('');
  const [notasPessoais, setNotasPessoais] = useState(() => {
    const s = localStorage.getItem('notas_versiculos_biblia');
    return s ? JSON.parse(s) : {};
  });

  const [usuarioLogado, setUsuarioLogado] = useState(BancoDeDados.getUsuarioLogado());
  const [modalLoginAberto, setModalLoginAberto] = useState(false);
  const [abaPrincipal, setAbaPrincipal] = useState('biblia'); 
  const [perfilUrlAlvo, setPerfilUrlAlvo] = useState(null);
  const [totalNaoLidas, setTotalNaoLidas] = useState(0);

  const [favoritos, setFavoritos] = useState(() => {
    const salvos = localStorage.getItem('favoritos_biblia');
    return salvos ? JSON.parse(salvos) : [];
  });
  const [marcacoes, setMarcacoes] = useState(() => {
    const salvos = localStorage.getItem('marcacoes_biblia');
    return salvos ? JSON.parse(salvos) : {};
  });
  const [versiculosSelecionados, setVersiculosSelecionados] = useState([]);
  const [copiadoFeedback, setCopiadoFeedback] = useState(false);

  const traducoesDisponiveis = [
    { id: 'acf', nome: 'Almeida Corrigida Fiel (ACF)' },
    { id: 'nvi', nome: 'Nova Versão Internacional (NVI)' },
    { id: 'ra', nome: 'Almeida Revista e Atualizada (RA)' },
    { id: 'ntlh', nome: 'Nova Tradução na Linguagem de Hoje (NTLH)' }
  ];

  useEffect(() => {
    if (!usuarioLogado) return;
    async function checarNotificacoes() {
      const notifs = await BancoDeDados.getNotificacoes(usuarioLogado.username);
      const naoLidas = notifs.filter(n => !n.lida).length;
      setTotalNaoLidas(naoLidas);
    }
    checarNotificacoes();
    const intervalo = setInterval(checarNotificacoes, 4000);
    return () => clearInterval(intervalo);
  }, [usuarioLogado]);

  useEffect(() => {
    const tratarRotaUrl = async () => {
      const path = window.location.pathname.replace('/', '').trim();
      if (path && !['biblia', 'devocional', 'comunidade', 'editarPerfil'].includes(path)) {
        setCarregando(true);
        const perfis = await BancoDeDados.getPerfisCadastrados();
        const encontrado = perfis.find(p => p.username.toLowerCase() === path.toLowerCase());
        if (encontrado) {
          setPerfilUrlAlvo(encontrado);
          setAbaPrincipal('perfilUrl');
        } else {
          setAbaPrincipal('biblia');
          setPerfilUrlAlvo(null);
        }
        setCarregando(false);
      } else if (path === 'comunidade') {
        setAbaPrincipal('comunidade');
        setPerfilUrlAlvo(null);
      } else if (path === 'devocional') {
        setAbaPrincipal('devocional');
        setPerfilUrlAlvo(null);
      } else if (path === 'editarPerfil') {
        setAbaPrincipal('editarPerfil');
        setPerfilUrlAlvo(null);
      } else {
        setAbaPrincipal('biblia');
        setPerfilUrlAlvo(null);
      }
    };
    tratarRotaUrl();
    window.addEventListener('popstate', tratarRotaUrl);
    return () => window.removeEventListener('popstate', tratarRotaUrl);
  }, []);

  const navegarPara = (rota, aba) => {
    window.history.pushState({}, '', rota);
    setAbaPrincipal(aba);
    if (aba !== 'perfilUrl') setPerfilUrlAlvo(null);
    setMenuAberto(false);
  };

  useEffect(() => {
    setCarregando(true);
    fetch(`https://raw.githubusercontent.com/thiagobodruk/biblia/master/json/${versaoSelecionada}.json`)
      .then((resposta) => resposta.json())
      .then((dados) => {
        setBibliaCompleta(dados);
        setCarregando(false);
      })
      .catch((erro) => {
        console.error("Erro ao carregar a Bíblia:", erro);
        setCarregando(false);
      });
  }, [versaoSelecionada]);

  useEffect(() => {
    localStorage.setItem('favoritos_biblia', JSON.stringify(favoritos));
    localStorage.setItem('marcacoes_biblia', JSON.stringify(marcacoes));
    localStorage.setItem('notas_versiculos_biblia', JSON.stringify(notasPessoais));
  }, [favoritos, marcacoes, notasPessoais]);

  const salvarNotaVersiculo = (chave) => {
    setNotasPessoais({ ...notasPessoais, [chave]: textoNota });
    setNotaVersiculoAtiva(null);
    setTextoNota('');
  };

  const toggleFavorito = (livroNome, capitulo, numeroVersiculo, texto) => {
    if (!usuarioLogado) {
      setModalLoginAberto(true);
      return;
    }
    const versiculoObj = { livro: livroNome, capitulo, numero: numeroVersiculo, texto };
    const existe = favoritos.some(
      (f) => f.livro === livroNome && f.capitulo === capitulo && f.numero === numeroVersiculo
    );
    if (existe) {
      setFavoritos(favoritos.filter(f => !(f.livro === livroNome && f.capitulo === capitulo && f.numero === numeroVersiculo)));
    } else {
      setFavoritos([...favoritos, versiculoObj]);
      BancoDeDados.salvarPublicacao({
        id: Date.now(),
        autor: usuarioLogado.nome,
        username: usuarioLogado.username,
        avatar: usuarioLogado.foto,
        tema: `❤️ Versículo Favoritado: ${livroNome} ${capitulo}:${numeroVersiculo}`,
        texto: `"${texto}"`,
        imagem: '',
        curtidas: 0,
        comentarios: []
      });
    }
  };

  const destacarVersiculosSelecionados = (corClasse) => {
    if (!usuarioLogado) {
      setModalLoginAberto(true);
      return;
    }
    if (versiculosSelecionados.length === 0) return;

    const novasMarcacoes = { ...marcacoes };
    const textosFormatados = [];

    versiculosSelecionados.forEach(v => {
      const chave = `${livroAtualObj.name}_${capituloAtual}_${v.numero}`;
      novasMarcacoes[chave] = corClasse;
      textosFormatados.push(`[${v.numero}] ${v.texto}`);
    });

    setMarcacoes(novasMarcacoes);

    const primeiroNum = versiculosSelecionados[0].numero;
    const ultimoNum = versiculosSelecionados[versiculosSelecionados.length - 1].numero;
    const referencia = versiculosSelecionados.length > 1 
      ? `${livroAtualObj.name} ${capituloAtual}:${primeiroNum}-${ultimoNum}`
      : `${livroAtualObj.name} ${capituloAtual}:${primeiroNum}`;

    BancoDeDados.salvarPublicacao({
      id: Date.now(),
      autor: usuarioLogado.nome,
      username: usuarioLogado.username,
      avatar: usuarioLogado.foto,
      tema: `📖 ${referencia}`,
      texto: textosFormatados.join(' '),
      imagem: '',
      curtidas: 0,
      comentarios: []
    });

    setVersiculosSelecionados([]);
    alert('Versículos destacados e compartilhados juntos no Feed! 🚀');
  };

  const toggleSelecaoVersiculo = (numero, texto) => {
    const existe = versiculosSelecionados.find(v => v.numero === numero);
    if (existe) {
      setVersiculosSelecionados(versiculosSelecionados.filter(v => v.numero !== numero));
    } else {
      setVersiculosSelecionados([...versiculosSelecionados, { numero, texto }].sort((a, b) => a.numero - b.numero));
    }
  };

  const copiarVersiculosSelecionados = () => {
    const livroAtualObj = bibliaCompleta[livroIndex];
    const textoFormatado = versiculosSelecionados
      .map(v => `${v.numero}. ${v.texto}`)
      .join('\n') + `\n\n(${livroAtualObj.name} ${capituloAtual} - ${versaoSelecionada.toUpperCase()})`;

    navigator.clipboard.writeText(textoFormatado);
    setCopiadoFeedback(true);
    setTimeout(() => setCopiadoFeedback(false), 2500);
  };

  const handleBuscar = (e) => {
    const termo = e.target.value;
    setTermoBusca(termo);
    if (termo.trim().length < 3) {
      setResultadosBusca([]);
      return;
    }
    const resultados = [];
    bibliaCompleta.forEach((livro, lIndex) => {
      livro.chapters.forEach((capitulo, cIndex) => {
        capitulo.forEach((texto, vIndex) => {
          if (texto.toLowerCase().includes(termo.toLowerCase())) {
            resultados.push({
              livroNome: livro.name,
              livroIndex: lIndex,
              capitulo: cIndex + 1,
              numero: vIndex + 1,
              texto
            });
          }
        });
      });
    });
    setResultadosBusca(resultados.slice(0, 50));
  };

  const livroAtualObj = bibliaCompleta[livroIndex] || { name: "Carregando...", chapters: [[]] };
  const totalCapitulosDoLivro = livroAtualObj.chapters ? livroAtualObj.chapters.length : 1;
  const versiculosDoCapitulo = livroAtualObj.chapters && livroAtualObj.chapters[capituloAtual - 1] ? livroAtualObj.chapters[capituloAtual - 1] : [];

  return (
    <div className={`flex h-screen font-sans overflow-hidden ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-800'}`}>

      {!modoFoco && (
        <aside className={`fixed md:relative inset-y-0 left-0 z-50 flex flex-col border-r transition-all duration-300 ${menuAberto ? 'w-72 sm:w-80 translate-x-0' : '-translate-x-full md:w-0 md:translate-x-0 md:overflow-hidden'} bg-slate-900 border-slate-800 text-slate-300 shadow-2xl md:shadow-none`}>
          <div className="p-4 border-b border-slate-800 flex justify-between items-center">
            <h1 className="text-white font-bold text-base tracking-wider flex items-center gap-2">
              BÍBLIA ONLINE
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            </h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs transition flex items-center justify-center"
                title="Alternar Tema"
              >
                {darkMode ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                )}
              </button>
              <button
                onClick={() => setMenuAberto(false)}
                className="md:hidden p-1.5 rounded-lg bg-slate-800 text-white text-xs"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="p-3 border-b border-slate-800">
            {usuarioLogado ? (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 cursor-pointer" onClick={() => navegarPara(`/${usuarioLogado.username}`, 'perfilUrl')}>
                    <img src={usuarioLogado.foto} alt="Avatar" className="w-7 h-7 rounded-full object-cover" />
                    <div>
                      <p className="text-[10px] text-slate-400">Meu Link:</p>
                      <p className="text-xs font-bold text-blue-400">@{usuarioLogado.username}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      BancoDeDados.fazerLogout();
                      setUsuarioLogado(null);
                      navegarPara('/', 'biblia');
                    }}
                    className="text-[10px] text-red-400 bg-red-500/10 px-2 py-1 rounded"
                  >
                    Sair
                  </button>
                </div>

                <button
                  onClick={() => navegarPara('/editarPerfil', 'editarPerfil')}
                  className="w-full bg-slate-700 hover:bg-slate-600 text-white text-[10px] font-bold py-1.5 rounded-lg transition"
                >
                  Editar Perfil
                </button>

                <button
                  onClick={() => {
                    const link = `${window.location.origin}/${usuarioLogado.username}`;
                    navigator.clipboard.writeText(link);
                    alert(`Link copiado: ${link}`);
                  }}
                  className="w-full bg-slate-700 hover:bg-slate-600 text-white text-[10px] font-bold py-1.5 rounded-lg"
                >
                  Copiar Meu Link de Perfil
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setModalLoginAberto(true); setMenuAberto(false); }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 rounded-lg shadow-md flex items-center justify-center gap-1.5"
              >
                Entrar na Comunidade
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
              </button>
            )}

            <div className="mt-3">
              <select
                value={versaoSelecionada}
                onChange={(e) => {
                  setVersaoSelecionada(e.target.value);
                  setCapituloAtual(1);
                }}
                className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded px-2 py-1.5 focus:outline-none"
              >
                {traducoesDisponiveis.map((t) => (
                  <option key={t.id} value={t.id}>{t.nome}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-1 mt-2 bg-slate-800 p-1 rounded-lg text-center">
              <button
                onClick={() => navegarPara('/', 'biblia')}
                className={`text-[11px] py-1 rounded font-medium ${abaPrincipal === 'biblia' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
              >
                Bíblia
              </button>
              <button
                onClick={() => {
                  if (!usuarioLogado) setModalLoginAberto(true);
                  else navegarPara('/devocional', 'devocional');
                }}
                className={`text-[11px] py-1 rounded font-medium ${abaPrincipal === 'devocional' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
              >
                Devocionais
              </button>

              <button
                onClick={() => {
                  if (!usuarioLogado) setModalLoginAberto(true);
                  else navegarPara('/comunidade', 'comunidade');
                }}
                className={`text-[11px] py-1 rounded font-medium relative flex items-center justify-center gap-1 ${abaPrincipal === 'comunidade' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
              >
                Comunidade
                {totalNaoLidas > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold shadow-md">
                    {totalNaoLidas}
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {abaPrincipal === 'biblia' && (
              <>
                <div className="text-[10px] font-bold text-slate-500 px-3 py-1">TODOS OS LIVROS</div>
                {bibliaCompleta.map((livro, index) => (
                  <button
                    key={livro.abbrev}
                    onClick={() => {
                      setLivroIndex(index);
                      setCapituloAtual(1);
                      setMenuAberto(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex justify-between items-center ${
                      livroIndex === index ? "bg-blue-600 text-white shadow-md" : "hover:bg-slate-800 text-slate-300"
                    }`}
                  >
                    <span>{livro.name}</span>
                    <span className="text-[10px] opacity-50">{livro.chapters?.length} cap.</span>
                  </button>
                ))}
              </>
            )}
          </div>
        </aside>
      )}

      {menuAberto && (
        <div 
          onClick={() => setMenuAberto(false)} 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-xs"
        />
      )}

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative w-full">

        <header className={`border-b px-4 sm:px-6 py-3 flex flex-col sm:flex-row justify-between items-center gap-3 shadow-xs ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            {!modoFoco && (
              <button
                onClick={() => setMenuAberto(!menuAberto)}
                className={`p-2 rounded-lg text-xs font-semibold transition ${darkMode ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-700'}`}
              >
                ☰ Menu / Livros
              </button>
            )}

            <div className="flex items-center gap-2 overflow-hidden">
              <h2 className="text-base sm:text-lg font-bold truncate max-w-[140px] sm:max-w-xs">
                {abaPrincipal === 'biblia' && `${livroAtualObj.name}`}
                {abaPrincipal === 'devocional' && 'Devocionais'}
                {abaPrincipal === 'comunidade' && 'Comunidade 🌐'}
                {abaPrincipal === 'perfilUrl' && 'Perfil'}
                {abaPrincipal === 'editarPerfil' && 'Editar Perfil'}
              </h2>

              {abaPrincipal === 'biblia' && (
                <select
                  value={capituloAtual}
                  onChange={(e) => {
                    setCapituloAtual(Number(e.target.value));
                    setVersiculosSelecionados([]);
                  }}
                  className={`text-xs font-bold rounded-lg px-2 py-1.5 border ${darkMode ? 'bg-slate-800 border-slate-700 text-blue-400' : 'bg-slate-100 border-slate-300 text-blue-600'}`}
                >
                  {Array.from({ length: totalCapitulosDoLivro }, (_, i) => i + 1).map((numCap) => (
                    <option key={numCap} value={numCap}>
                      Cap. {numCap}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {abaPrincipal === 'biblia' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setModoFoco(!modoFoco)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition ${modoFoco ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-700/20 border-slate-600'}`}
                title="Modo Leitura Imersiva / Foco"
              >
                {modoFoco ? '📖 Sair do Modo Foco' : '✨ Modo Foco'}
              </button>

              <select
                value={tamanhoFonte}
                onChange={(e) => setTamanhoFonte(e.target.value)}
                className={`text-xs rounded-lg px-2 py-1 border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-100 border-slate-300'}`}
              >
                <option value="text-sm">Fonte Pequena</option>
                <option value="text-base sm:text-lg">Fonte Normal</option>
                <option value="text-xl sm:text-2xl">Fonte Grande</option>
              </select>
            </div>
          )}

          {abaPrincipal === 'biblia' && !modoFoco && (
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between">
              <input
                type="text"
                placeholder="Buscar..."
                value={termoBusca}
                onChange={handleBuscar}
                className={`text-xs rounded-lg px-3 py-1.5 border w-32 sm:w-48 ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`}
              />

              <div className="flex gap-1">
                <button 
                  onClick={() => { setCapituloAtual((prev) => Math.max(prev - 1, 1)); setVersiculosSelecionados([]); }}
                  disabled={capituloAtual === 1}
                  className={`px-2.5 py-1 text-xs rounded font-medium disabled:opacity-40 ${darkMode ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-700'}`}
                >
                  ←
                </button>
                <button 
                  onClick={() => { setCapituloAtual((prev) => Math.min(prev + 1, totalCapitulosDoLivro)); setVersiculosSelecionados([]); }}
                  disabled={capituloAtual === totalCapitulosDoLivro}
                  className="px-2.5 py-1 bg-blue-600 disabled:opacity-40 text-xs rounded font-medium text-white"
                >
                  →
                </button>
              </div>
            </div>
          )}
        </header>

        <section className={`flex-1 overflow-y-auto p-4 sm:p-6 w-full pb-32 ${abaPrincipal === 'comunidade' ? 'max-w-full px-4 sm:px-8' : 'max-w-4xl mx-auto lg:px-16'}`}>

          {abaPrincipal === 'biblia' && (
            carregando ? (
              <p className="text-slate-400 text-center mt-10 text-sm">Carregando conteúdo...</p>
            ) : termoBusca.trim().length >= 3 ? (
              <div className="space-y-3">
                <h3 className="text-xs font-bold opacity-70 mb-3">Resultados para: "{termoBusca}" ({resultadosBusca.length})</h3>
                {resultadosBusca.map((res, i) => (
                  <div key={i} className={`p-3 rounded-lg border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[11px] font-bold text-blue-500">{res.livroNome} {res.capitulo}:{res.numero}</span>
                      <button
                        onClick={() => {
                          const idx = bibliaCompleta.findIndex(l => l.name === res.livroNome);
                          if (idx !== -1) {
                            setLivroIndex(idx);
                            setCapituloAtual(res.capitulo);
                            setTermoBusca('');
                          }
                        }}
                        className="text-[11px] text-blue-400 hover:underline"
                      >
                        Ir para o capítulo →
                      </button>
                    </div>
                    <p className="text-sm leading-relaxed">{res.texto}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className={`p-4 rounded-2xl border shadow-sm ${darkMode ? 'bg-blue-950/30 border-blue-800/40 text-blue-200' : 'bg-blue-50 border-blue-200 text-blue-900'}`}>
                  <h4 className="text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">🌟 Mensagem do Dia</h4>
                  <p className="text-sm italic">"Lâmpada para os meus pés é a tua palavra, e luz para o meu caminho." — Salmos 119:105</p>
                </div>

                <div className={`space-y-2.5 ${tamanhoFonte} leading-relaxed`}>
                  {versiculosDoCapitulo.map((textoVersiculo, index) => {
                    const numeroV = index + 1;
                    const chaveMarcacao = `${livroAtualObj.name}_${capituloAtual}_${numeroV}`;
                    const corDestaqueAtual = marcacoes[chaveMarcacao];
                    const isFavorito = favoritos.some(
                      (f) => f.livro === livroAtualObj.name && f.capitulo === capituloAtual && f.numero === numeroV
                    );
                    const isSelecionado = versiculosSelecionados.some(v => v.numero === numeroV);
                    const notaPessoal = notasPessoais[chaveMarcacao];

                    return (
                      <div 
                        key={index} 
                        onClick={() => toggleSelecaoVersiculo(numeroV, textoVersiculo)}
                        className={`group flex flex-col gap-2 py-2 px-3 rounded-xl transition border cursor-pointer select-none ${
                          isSelecionado 
                            ? 'bg-blue-600/20 border-blue-500/60 shadow-sm' 
                            : 'border-transparent hover:bg-blue-500/5'
                        }`}
                        title="Clique para selecionar o versículo"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="flex-1 leading-relaxed">
                            <span className="text-xs font-extrabold text-blue-500 mr-2.5 align-super bg-blue-500/10 px-1.5 py-0.5 rounded-md">{numeroV}</span>
                            <span className={corDestaqueAtual ? `${corDestaqueAtual} text-slate-900 font-semibold` : (darkMode ? 'text-slate-100' : 'text-slate-900')}>
                              {textoVersiculo}
                            </span>
                          </p>

                          <div className="flex items-center justify-end gap-2 pt-2 sm:pt-0 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => setNotaVersiculoAtiva(chaveMarcacao)} className="text-xs bg-slate-700/20 hover:bg-slate-700/40 px-2 py-1 rounded" title="Adicionar Nota">📝</button>

                            <button
                              onClick={() => toggleFavorito(livroAtualObj.name, capituloAtual, numeroV, textoVersiculo)}
                              className={`text-sm px-1.5 py-0.5 rounded ${isFavorito ? 'text-red-500' : 'text-slate-400 hover:text-red-400'}`}
                              title="Favoritar"
                            >
                              {isFavorito ? '❤️' : '🤍'}
                            </button>
                          </div>
                        </div>

                        {notaPessoal && (
                          <div className="bg-amber-500/10 border border-amber-500/30 p-2 rounded-lg text-xs text-amber-600 dark:text-amber-300 italic" onClick={(e) => e.stopPropagation()}>
                            <b>Nota Pessoal:</b> {notaPessoal}
                          </div>
                        )}

                        {notaVersiculoAtiva === chaveMarcacao && (
                          <div className="p-3 bg-slate-800 rounded-xl space-y-2 mt-2" onClick={(e) => e.stopPropagation()}>
                            <input 
                              type="text" 
                              placeholder="Escreva sua anotação pessoal..." 
                              value={textoNota} 
                              onChange={(e) => setTextoNota(e.target.value)} 
                              className="w-full text-xs p-2 rounded bg-slate-900 border border-slate-700 text-white"
                            />
                            <div className="flex justify-end gap-2">
                              <button onClick={() => setNotaVersiculoAtiva(null)} className="text-xs px-2 py-1 opacity-70">Cancelar</button>
                              <button onClick={() => salvarNotaVersiculo(chaveMarcacao)} className="bg-blue-600 text-white text-xs px-3 py-1 rounded font-bold">Salvar Nota</button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )
          )}

          {abaPrincipal === 'devocional' && usuarioLogado && (
            <Devocionais usuarioLogado={usuarioLogado} darkMode={darkMode} />
          )}

          {abaPrincipal === 'comunidade' && usuarioLogado && (
            <Comunidade 
              usuarioLogado={usuarioLogado} 
              darkMode={darkMode} 
              onVerPerfil={(username) => navegarPara(`/${username}`, 'perfilUrl')}
            />
          )}

          {abaPrincipal === 'perfilUrl' && perfilUrlAlvo && usuarioLogado && (
            <PerfilPublico
              perfilAlvo={perfilUrlAlvo}
              usuarioLogado={usuarioLogado}
              onVoltar={() => navegarPara('/comunidade', 'comunidade')}
              darkMode={darkMode}
              onToggleDarkMode={() => setDarkMode(!darkMode)}
            />
          )}

          {abaPrincipal === 'editarPerfil' && usuarioLogado && (
            <EditarPerfil
              usuarioLogado={usuarioLogado}
              onSalvo={(usuarioAtualizado) => {
                setUsuarioLogado(usuarioAtualizado);
                navegarPara('/comunidade', 'comunidade');
              }}
              onVoltar={() => navegarPara('/comunidade', 'comunidade')}
              darkMode={darkMode}
            />
          )}

        </section>

        {abaPrincipal === 'biblia' && versiculosSelecionados.length > 0 && (
          <div className="absolute bottom-4 left-4 right-4 sm:left-1/2 sm:transform sm:-translate-x-1/2 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex flex-wrap items-center justify-between sm:justify-center gap-3 border border-slate-700 z-50">
            <span className="text-xs font-semibold bg-blue-600 px-2 py-1 rounded-lg">
              {versiculosSelecionados.length} sel.
            </span>

            <div className="flex items-center gap-2">
              <span className="text-[10px] opacity-75">Destacar:</span>
              <button onClick={() => destacarVersiculosSelecionados('bg-amber-300 px-1.5 py-0.5 rounded')} className="w-5 h-5 rounded-full bg-amber-400 shadow" title="Amarelo"></button>
              <button onClick={() => destacarVersiculosSelecionados('bg-emerald-300 px-1.5 py-0.5 rounded')} className="w-5 h-5 rounded-full bg-emerald-500 shadow" title="Verde"></button>
              <button onClick={() => destacarVersiculosSelecionados('bg-blue-300 px-1.5 py-0.5 rounded')} className="w-5 h-5 rounded-full bg-blue-500 shadow" title="Azul"></button>
              <button onClick={() => destacarVersiculosSelecionados('bg-pink-300 px-1.5 py-0.5 rounded')} className="w-5 h-5 rounded-full bg-pink-500 shadow" title="Rosa"></button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={copiarVersiculosSelecionados}
                className="bg-slate-800 text-xs px-3 py-1.5 rounded-lg font-medium hover:bg-slate-700 transition"
              >
                📋 {copiadoFeedback ? 'Copiado!' : 'Copiar'}
              </button>
              <button
                onClick={() => setVersiculosSelecionados([])}
                className="text-xs text-slate-400 px-2 py-1"
              >
                ✕
              </button>
            </div>
          </div>
        )}

      </main>

      <AuthModal
        isOpen={modalLoginAberto}
        onClose={() => setModalLoginAberto(false)}
        onLoginSucesso={(perfil) => {
          setUsuarioLogado(perfil);
          setModalLoginAberto(false);
          navegarPara('/comunidade', 'comunidade');
        }}
        darkMode={darkMode}
      />

    </div>
  );
}