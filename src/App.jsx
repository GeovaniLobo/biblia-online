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

  // Usuário Logado via Banco de Dados
  const [usuarioLogado, setUsuarioLogado] = useState(BancoDeDados.getUsuarioLogado());
  const [modalLoginAberto, setModalLoginAberto] = useState(false);
  const [abaPrincipal, setAbaPrincipal] = useState('biblia'); // 'biblia', 'devocional', 'comunidade', 'perfilUrl', 'editarPerfil'
  const [perfilUrlAlvo, setPerfilUrlAlvo] = useState(null);

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
    const tratarRotaUrl = async () => {
      const hash = window.location.hash.replace('#/', '').replace('#', '');
      if (hash && hash !== 'biblia' && hash !== 'devocional' && hash !== 'comunidade' && hash !== 'editarPerfil') {
        const perfis = await BancoDeDados.getPerfisCadastrados();
        const encontrado = perfis.find(p => p.username === hash);
        if (encontrado) {
          setPerfilUrlAlvo(encontrado);
          setAbaPrincipal('perfilUrl');
        }
      } else if (!hash || hash === 'biblia') {
        setPerfilUrlAlvo(null);
      }
    };

    tratarRotaUrl();
    window.addEventListener('hashchange', tratarRotaUrl);
    return () => window.removeEventListener('hashchange', tratarRotaUrl);
  }, []);

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
  }, [favoritos, marcacoes]);

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

  const destacarVersiculo = (livroNome, capitulo, numero, corClasse, textoVersiculo) => {
    if (!usuarioLogado) {
      setModalLoginAberto(true);
      return;
    }
    const chave = `${livroNome}_${capitulo}_${numero}`;
    const novasMarcacoes = { ...marcacoes };
    
    if (novasMarcacoes[chave] === corClasse) {
      delete novasMarcacoes[chave];
    } else {
      novasMarcacoes[chave] = corClasse;
      
      BancoDeDados.salvarPublicacao({
        id: Date.now(),
        autor: usuarioLogado.nome,
        username: usuarioLogado.username,
        avatar: usuarioLogado.foto,
        tema: `📖 ${livroNome} ${capitulo}:${numero}`,
        texto: `"${textoVersiculo}"`,
        imagem: '',
        curtidas: 0,
        comentarios: []
      });
    }
    setMarcacoes(novasMarcacoes);
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
      
      {/* BARRA LATERAL (RESPONSIVA) */}
      <aside className={`fixed md:relative inset-y-0 left-0 z-50 flex flex-col border-r transition-all duration-300 ${menuAberto ? 'w-72 sm:w-80 translate-x-0' : '-translate-x-full md:w-0 md:translate-x-0 md:overflow-hidden'} bg-slate-900 border-slate-800 text-slate-300 shadow-2xl md:shadow-none`}>
        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
          <h1 className="text-white font-bold text-base tracking-wider">BÍBLIA ONLINE 📖</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs transition"
            >
              {darkMode ? '☀️' : '🌙'}
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
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => { window.location.hash = `#/${usuarioLogado.username}`; setMenuAberto(false); }}>
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
                    window.location.hash = '';
                    setAbaPrincipal('biblia');
                  }}
                  className="text-[10px] text-red-400 bg-red-500/10 px-2 py-1 rounded"
                >
                  Sair
                </button>
              </div>

              <button
                onClick={() => { setAbaPrincipal('editarPerfil'); setMenuAberto(false); }}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white text-[10px] font-bold py-1.5 rounded-lg transition"
              >
                ✏️ Editar Perfil
              </button>

              <button
                onClick={() => {
                  const link = `${window.location.origin}/#/${usuarioLogado.username}`;
                  navigator.clipboard.writeText(link);
                  alert(`Link copiado: ${link}`);
                }}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white text-[10px] font-bold py-1.5 rounded-lg"
              >
                🔗 Copiar Meu Link de Perfil
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setModalLoginAberto(true); setMenuAberto(false); }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 rounded-lg shadow-md"
            >
              Entrar na Comunidade 🚀
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
              onClick={() => { window.location.hash = ''; setAbaPrincipal('biblia'); setPerfilUrlAlvo(null); setMenuAberto(false); }}
              className={`text-[11px] py-1 rounded font-medium ${abaPrincipal === 'biblia' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
            >
              Bíblia
            </button>
            <button
              onClick={() => {
                if (!usuarioLogado) setModalLoginAberto(true);
                else { window.location.hash = 'devocional'; setAbaPrincipal('devocional'); setPerfilUrlAlvo(null); setMenuAberto(false); }
              }}
              className={`text-[11px] py-1 rounded font-medium ${abaPrincipal === 'devocional' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
            >
              Devocionais
            </button>
            <button
              onClick={() => {
                if (!usuarioLogado) setModalLoginAberto(true);
                else { window.location.hash = 'comunidade'; setAbaPrincipal('comunidade'); setPerfilUrlAlvo(null); setMenuAberto(false); }
              }}
              className={`text-[11px] py-1 rounded font-medium ${abaPrincipal === 'comunidade' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
            >
              Comunidade
            </button>
          </div>
        </div>

        {/* LISTA DE LIVROS */}
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

      {menuAberto && (
        <div 
          onClick={() => setMenuAberto(false)} 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-xs"
        />
      )}

      {/* ÁREA CENTRAL */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative w-full">
        
        <header className={`border-b px-4 sm:px-6 py-3 flex flex-col sm:flex-row justify-between items-center gap-3 shadow-xs ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <button
              onClick={() => setMenuAberto(!menuAberto)}
              className={`p-2 rounded-lg text-xs font-semibold transition ${darkMode ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-700'}`}
            >
              ☰ Menu / Livros
            </button>

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

        {/* CONTEÚDO */}
        <section className="flex-1 overflow-y-auto p-4 sm:p-6 lg:px-16 max-w-4xl mx-auto w-full pb-32">
          
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
              <div className="space-y-2.5 text-base sm:text-lg leading-relaxed">
                {versiculosDoCapitulo.map((textoVersiculo, index) => {
                  const numeroV = index + 1;
                  const chaveMarcacao = `${livroAtualObj.name}_${capituloAtual}_${numeroV}`;
                  const corDestaqueAtual = marcacoes[chaveMarcacao];
                  const isFavorito = favoritos.some(
                    (f) => f.livro === livroAtualObj.name && f.capitulo === capituloAtual && f.numero === numeroV
                  );
                  const isSelecionado = versiculosSelecionados.some(v => v.numero === numeroV);

                  return (
                    <div 
                      key={index} 
                      className={`group flex flex-col sm:flex-row sm:items-start justify-between gap-2 py-2 px-3 rounded-lg transition border ${
                        isSelecionado 
                          ? 'bg-blue-600/15 border-blue-500/50' 
                          : corDestaqueAtual 
                          ? `${corDestaqueAtual} border-opacity-40` 
                          : 'border-transparent hover:bg-blue-500/5'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 flex-1">
                        <input
                          type="checkbox"
                          checked={isSelecionado}
                          onChange={() => toggleSelecaoVersiculo(numeroV, textoVersiculo)}
                          className="mt-1.5 h-4 w-4 rounded border-slate-400 text-blue-600 focus:ring-blue-500 cursor-pointer flex-shrink-0"
                        />
                        <p className="flex-1">
                          <span className="text-xs font-bold text-blue-500 mr-2 align-super">{numeroV}</span>
                          {textoVersiculo}
                        </p>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 sm:pt-0 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition">
                        <div className="flex gap-1.5 bg-slate-800/80 p-1 rounded-lg">
                          <button onClick={() => destacarVersiculo(livroAtualObj.name, capituloAtual, numeroV, 'bg-amber-400/15 text-amber-200 border-amber-500/30', textoVersiculo)} className="w-4 h-4 rounded-full bg-amber-400" title="Amarelo"></button>
                          <button onClick={() => destacarVersiculo(livroAtualObj.name, capituloAtual, numeroV, 'bg-emerald-500/15 text-emerald-200 border-emerald-500/30', textoVersiculo)} className="w-4 h-4 rounded-full bg-emerald-500" title="Verde"></button>
                          <button onClick={() => destacarVersiculo(livroAtualObj.name, capituloAtual, numeroV, 'bg-blue-500/15 text-blue-200 border-blue-500/30', textoVersiculo)} className="w-4 h-4 rounded-full bg-blue-500" title="Azul"></button>
                          <button onClick={() => destacarVersiculo(livroAtualObj.name, capituloAtual, numeroV, 'bg-pink-500/15 text-pink-200 border-pink-500/30', textoVersiculo)} className="w-4 h-4 rounded-full bg-pink-500" title="Rosa"></button>
                        </div>

                        <button
                          onClick={() => toggleFavorito(livroAtualObj.name, capituloAtual, numeroV, textoVersiculo)}
                          className={`text-sm px-1.5 py-0.5 rounded ${isFavorito ? 'text-red-500' : 'text-slate-400'}`}
                        >
                          {isFavorito ? '❤️' : '🤍'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {abaPrincipal === 'devocional' && usuarioLogado && (
            <Devocionais usuarioLogado={usuarioLogado} darkMode={darkMode} />
          )}

          {abaPrincipal === 'comunidade' && usuarioLogado && (
            <Comunidade usuarioLogado={usuarioLogado} darkMode={darkMode} />
          )}

          {abaPrincipal === 'perfilUrl' && perfilUrlAlvo && usuarioLogado && (
            <PerfilPublico
              perfilAlvo={perfilUrlAlvo}
              usuarioLogado={usuarioLogado}
              onVoltar={() => { window.location.hash = 'comunidade'; setAbaPrincipal('comunidade'); }}
              darkMode={darkMode}
              onToggleDarkMode={() => setDarkMode(!darkMode)}
            />
          )}

          {abaPrincipal === 'editarPerfil' && usuarioLogado && (
            <EditarPerfil
              usuarioLogado={usuarioLogado}
              onSalvo={(usuarioAtualizado) => {
                setUsuarioLogado(usuarioAtualizado);
                setAbaPrincipal('comunidade');
              }}
              onVoltar={() => setAbaPrincipal('comunidade')}
              darkMode={darkMode}
            />
          )}

        </section>

        {/* BARRA FLUTUANTE DE AÇÕES MÚLTIPLAS */}
        {abaPrincipal === 'biblia' && versiculosSelecionados.length > 0 && (
          <div className="absolute bottom-4 left-4 right-4 sm:left-1/2 sm:transform sm:-translate-x-1/2 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex flex-wrap items-center justify-between sm:justify-center gap-3 border border-slate-700 z-50">
            <span className="text-xs font-semibold bg-blue-600 px-2 py-1 rounded-lg">
              {versiculosSelecionados.length} sel.
            </span>

            <div className="flex items-center gap-2">
              <span className="text-[10px] opacity-75">Cor:</span>
              <button onClick={() => destacarVersiculosSelecionados('bg-amber-400/15 text-amber-200 border-amber-500/30')} className="w-4 h-4 rounded-full bg-amber-400"></button>
              <button onClick={() => destacarVersiculosSelecionados('bg-emerald-500/15 text-emerald-200 border-emerald-500/30')} className="w-4 h-4 rounded-full bg-emerald-500"></button>
              <button onClick={() => destacarVersiculosSelecionados('bg-blue-500/15 text-blue-200 border-blue-500/30')} className="w-4 h-4 rounded-full bg-blue-500"></button>
              <button onClick={() => destacarVersiculosSelecionados('bg-pink-500/15 text-pink-200 border-pink-500/30')} className="w-4 h-4 rounded-full bg-pink-500"></button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={copiarVersiculosSelecionados}
                className="bg-slate-800 text-xs px-3 py-1.5 rounded-lg font-medium"
              >
                📋 {copiadoFeedback ? 'Copiado!' : 'Copiar'}
              </button>
              <button
                onClick={() => setVersiculosSelecionados([])}
                className="text-xs text-slate-400"
              >
                X
              </button>
            </div>
          </div>
        )}

      </main>

      {/* MODAL DE AUTENTICAÇÃO */}
      <AuthModal
        isOpen={modalLoginAberto}
        onClose={() => setModalLoginAberto(false)}
        onLoginSucesso={(perfil) => {
          setUsuarioLogado(perfil);
          setModalLoginAberto(false);
          window.location.hash = 'comunidade';
          setAbaPrincipal('comunidade');
        }}
        darkMode={darkMode}
      />

    </div>
  );
}