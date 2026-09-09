import React, { useState, useEffect, useRef } from 'react';
import { BancoDeDados } from './services/database';
import AuthModal from './components/AuthModal';
import Comunidade from './components/Comunidade';
import Devocionais from './components/Devocionais';
import PlanosDeEstudo from './components/PlanosDeEstudo';
import PerfilPublico from './components/PerfilPublico';
import EditarPerfil from './components/EditarPerfil';

export default function App() {
  const [versaoSelecionada, setVersaoSelecionada] = useState('acf');
  const [bibliaCompleta, setBibliaCompleta] = useState([]);
  const [livroIndex, setLivroIndex] = useState(0);
  const [capituloAtual, setCapituloAtual] = useState(1);
  const [carregando, setCarregando] = useState(true);

  const [usuarioLogado, setUsuarioLogado] = useState(BancoDeDados.getUsuarioLogado());
  const [darkMode, setDarkMode] = useState(false);

  const [modalLoginAberto, setModalLoginAberto] = useState(false);
  const [menuPerfilAberto, setMenuPerfilAberto] = useState(false);
  const [menuHamburguerAberto, setMenuHamburguerAberto] = useState(false);
  const dropdownRef = useRef(null);
  const hamburguerRef = useRef(null);

  useEffect(() => {
    async function carregarTemaDoBanco() {
      if (usuarioLogado && usuarioLogado.username) {
        try {
          const perfis = await BancoDeDados.getPerfisCadastrados();
          const meuPerfilBanco = perfis?.find(p => p.username === usuarioLogado.username);
          if (meuPerfilBanco && typeof meuPerfilBanco.dark_mode === 'boolean') {
            setDarkMode(meuPerfilBanco.dark_mode);
          }
        } catch (e) {
          console.error("Erro ao carregar tema do banco:", e);
        }
      }
    }
    carregarTemaDoBanco();
  }, [usuarioLogado]);

  const alternarTemaBanco = async () => {
    const novoTema = !darkMode;
    setDarkMode(novoTema);

    if (usuarioLogado && usuarioLogado.username) {
      try {
        if (typeof BancoDeDados.atualizarTemaUsuario === 'function') {
          await BancoDeDados.atualizarTemaUsuario(usuarioLogado.username, novoTema);
        }
      } catch (e) {
        console.error("Erro ao salvar tema no banco de dados:", e);
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setMenuPerfilAberto(false);
      }
      if (hamburguerRef.current && !hamburguerRef.current.contains(event.target)) {
        setMenuHamburguerAberto(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initialPath = decodeURIComponent(window.location.pathname.replace('/', '').trim());
  const isSystemRoute = ['', 'biblia', 'comunidade', 'devocional', 'planos', 'editarPerfil'].includes(initialPath);

  const [abaPrincipal, setAbaPrincipal] = useState(isSystemRoute ? (initialPath || 'biblia') : 'perfilUrl'); 
  const [perfilUrlAlvo, setPerfilUrlAlvo] = useState(() => {
    if (isSystemRoute) return null;
    return { 
      username: initialPath, 
      nome: initialPath, 
      foto: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80', 
      biografia: 'Carregando perfil...',
      amigos: [],
      verificado: false
    };
  });

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

  const [termoBusca, setTermoBusca] = useState('');
  const [resultadosBusca, setResultadosBusca] = useState([]);
  const [tamanhoFonte, setTamanhoFonte] = useState('text-base sm:text-lg');
  const [notaVersiculoAtiva, setNotaVersiculoAtiva] = useState(null);
  const [textoNota, setTextoNota] = useState('');
  const [notasPessoais, setNotasPessoais] = useState(() => {
    const s = localStorage.getItem('notas_versiculos_biblia');
    return s ? JSON.parse(s) : {};
  });

  const versiculosDoDia = [
    { texto: "Lâmpada para os meus pés é a tua palavra, e luz para o meu caminho.", referencia: "Salmos 119:105" },
    { texto: "O Senhor é o meu pastor; de nada faltará.", referencia: "Salmos 23:1" },
    { texto: "Confia no Senhor de todo o teu coração e não te estribes no teu próprio entendimento.", referencia: "Provérbios 3:5" },
    { texto: "Tudo posso naquele que me fortalece.", referencia: "Filipenses 4:13" },
    { texto: "O Senhor é a minha luz e a minha salvação; a quem temerei?", referencia: "Salmos 27:1" },
    { texto: "Entrega o teu caminho ao Senhor; confia nele, e ele o fará.", referencia: "Salmos 37:5" },
    { texto: "Porque sou eu que conheço os planos que tenho para vocês, diz o Senhor, planos de fazê-los prosperar e não de causar dano.", referencia: "Jeremias 29:11" },
    { texto: "Busquem, primeiro, o Reino de Deus e a sua justiça, e todas essas coisas lhes serão acrescentadas.", referencia: "Mateus 6:33" }
  ];

  const getVersiculoDoDiaAutomatico = () => {
    const agora = new Date();
    const inicioAno = new Date(agora.getFullYear(), 0, 0);
    const diff = agora - inicioAno;
    const umDia = 1000 * 60 * 60 * 24;
    const diaDoAno = Math.floor(diff / umDia);
    const indice = diaDoAno % versiculosDoDia.length;
    return versiculosDoDia[indice];
  };

  const palavraAtual = getVersiculoDoDiaAutomatico();

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
      const rawPath = window.location.pathname.replace('/', '').trim();
      const path = decodeURIComponent(rawPath);
      
      if (!path || path === 'biblia') {
        setAbaPrincipal('biblia');
        setPerfilUrlAlvo(null);
      } else if (path === 'comunidade') {
        setAbaPrincipal('comunidade');
        setPerfilUrlAlvo(null);
      } else if (path === 'devocional') {
        setAbaPrincipal('devocional');
        setPerfilUrlAlvo(null);
      } else if (path === 'planos') {
        setAbaPrincipal('planos');
        setPerfilUrlAlvo(null);
      } else if (path === 'editarPerfil') {
        setAbaPrincipal('editarPerfil');
        setPerfilUrlAlvo(null);
      } else {
        setAbaPrincipal('perfilUrl');
        let perfis = [];
        try {
          perfis = await BancoDeDados.getPerfisCadastrados();
        } catch (e) {}

        const encontrado = perfis?.find(p => p.username?.toLowerCase() === path.toLowerCase());
        
        if (encontrado) {
          setPerfilUrlAlvo(encontrado);
        } else {
          setPerfilUrlAlvo({
            username: path,
            nome: path,
            foto: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
            biografia: 'Praticando a fé e o amor ao próximo.',
            amigos: [],
            verificado: false
          });
        }
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
    setMenuPerfilAberto(false);
    setMenuHamburguerAberto(false);
  };

  useEffect(() => {
    setCarregando(true);
    fetch(`https://raw.githubusercontent.com/thiagobodruk/biblia/master/json/${versaoSelecionada}.json`)
      .then((resposta) => resposta.json())
      .then((dados) => {
        setBibliaCompleta(dados);
        setCarregando(false);
      })
      .catch(() => setCarregando(false));
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
        tema: `Versículo Favoritado: ${livroNome} ${capitulo}:${numeroVersiculo}`,
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
    const reference = versiculosSelecionados.length > 1 
      ? `${livroAtualObj.name} ${capituloAtual}:${primeiroNum}-${ultimoNum}`
      : `${livroAtualObj.name} ${capituloAtual}:${primeiroNum}`;

    BancoDeDados.salvarPublicacao({
      id: Date.now(),
      autor: usuarioLogado.nome,
      username: usuarioLogado.username,
      avatar: usuarioLogado.foto,
      tema: `${reference}`,
      texto: textosFormatados.join(' '),
      imagem: '',
      curtidas: 0,
      comentarios: []
    });

    setVersiculosSelecionados([]);
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
    <div className={`flex flex-col h-screen font-sans overflow-hidden ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-800'}`}>

      {/* HEADER SUPERIOR COM MENU HAMBÚRGUER MOBILE */}
      <header className={`border-b px-4 lg:px-8 py-3 flex items-center justify-between gap-3 shadow-sm backdrop-blur-md z-40 ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
        
        {/* Lado Esquerdo: Botão Hambúrguer (Mobile) + Logo */}
        <div className="flex items-center gap-3">
          
          {/* Botão Hambúrguer visível apenas em telas menores (Mobile/Tablet) */}
          <div className="relative lg:hidden" ref={hamburguerRef}>
            <button
              onClick={() => setMenuHamburguerAberto(!menuHamburguerAberto)}
              className={`p-2 rounded-xl border transition flex items-center justify-center cursor-pointer ${darkMode ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700' : 'bg-slate-100 border-slate-300 text-slate-900 hover:bg-slate-200'}`}
              title="Menu Principal"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Gaveta do Menu Hambúrguer (Mobile) */}
            {menuHamburguerAberto && (
              <div className={`absolute left-0 mt-3 w-64 rounded-2xl shadow-2xl border p-3 z-50 space-y-3 backdrop-blur-md ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
                
                <div className="pb-2 border-b border-slate-700/50">
                  <p className="text-[10px] uppercase tracking-wider font-extrabold opacity-60 mb-1">Versão da Bíblia</p>
                  <select
                    value={versaoSelecionada}
                    onChange={(e) => {
                      setVersaoSelecionada(e.target.value);
                      setCapituloAtual(1);
                    }}
                    className={`w-full text-xs rounded-xl px-3 py-2 border font-bold cursor-pointer focus:outline-none ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-100 border-slate-300 text-slate-800'}`}
                  >
                    {traducoesDisponiveis.map((t) => (
                      <option key={t.id} value={t.id}>{t.nome}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-wider font-extrabold opacity-60 px-2 mb-1">Navegação</p>
                  
                  <button
                    onClick={() => navegarPara('/', 'biblia')}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2.5 cursor-pointer ${abaPrincipal === 'biblia' ? 'bg-blue-600 text-white shadow-sm' : 'hover:bg-blue-500/10'}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                    Bíblia
                  </button>

                  <button
                    onClick={() => {
                      if (!usuarioLogado) setModalLoginAberto(true);
                      else navegarPara('/devocional', 'devocional');
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2.5 cursor-pointer ${abaPrincipal === 'devocional' ? 'bg-blue-600 text-white shadow-sm' : 'hover:bg-blue-500/10'}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                    Devocional
                  </button>

                  <button
                    onClick={() => {
                      if (!usuarioLogado) setModalLoginAberto(true);
                      else navegarPara('/planos', 'planos');
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2.5 cursor-pointer ${abaPrincipal === 'planos' ? 'bg-blue-600 text-white shadow-sm' : 'hover:bg-blue-500/10'}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    Planos
                  </button>

                  <button
                    onClick={() => {
                      if (!usuarioLogado) setModalLoginAberto(true);
                      else navegarPara('/comunidade', 'comunidade');
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${abaPrincipal === 'comunidade' ? 'bg-blue-600 text-white shadow-sm' : 'hover:bg-blue-500/10'}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                      Comunidade
                    </div>
                    {totalNaoLidas > 0 && (
                      <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                        {totalNaoLidas}
                      </span>
                    )}
                  </button>
                </div>

              </div>
            )}
          </div>

          <span 
            onClick={() => navegarPara('/', 'biblia')}
            className="text-sm sm:text-lg font-black tracking-wider flex items-center gap-2 cursor-pointer"
          >
            <svg className="w-5 h-5 text-blue-500 hidden sm:block" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            BÍBLIA ONLINE
          </span>

          <select
            value={versaoSelecionada}
            onChange={(e) => {
              setVersaoSelecionada(e.target.value);
              setCapituloAtual(1);
            }}
            className="hidden sm:block bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-2 py-1.5 focus:outline-none cursor-pointer"
          >
            {traducoesDisponiveis.map((t) => (
              <option key={t.id} value={t.id}>{t.nome}</option>
            ))}
          </select>
        </div>

        {/* Navegação por Ícones para telas grandes (Desktop) */}
        <div className="hidden lg:flex items-center gap-2">
          <button
            onClick={() => navegarPara('/', 'biblia')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${abaPrincipal === 'biblia' ? 'bg-blue-600 text-white shadow-sm' : darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            Bíblia
          </button>
          <button
            onClick={() => {
              if (!usuarioLogado) setModalLoginAberto(true);
              else navegarPara('/devocional', 'devocional');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${abaPrincipal === 'devocional' ? 'bg-blue-600 text-white shadow-sm' : darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            Devocional
          </button>
          <button
            onClick={() => {
              if (!usuarioLogado) setModalLoginAberto(true);
              else navegarPara('/planos', 'planos');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${abaPrincipal === 'planos' ? 'bg-blue-600 text-white shadow-sm' : darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            Planos
          </button>
          <button
            onClick={() => {
              if (!usuarioLogado) setModalLoginAberto(true);
              else navegarPara('/comunidade', 'comunidade');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition relative flex items-center gap-1.5 cursor-pointer ${abaPrincipal === 'comunidade' ? 'bg-blue-600 text-white shadow-sm' : darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            Comunidade
            {totalNaoLidas > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold shadow-md animate-bounce">
                {totalNaoLidas}
              </span>
            )}
          </button>
        </div>

        {/* Input de Pesquisa Global */}
        <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl border w-40 lg:w-60 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-300'}`}>
          <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input
            type="text"
            placeholder="Pesquisar..."
            value={termoBusca}
            onChange={handleBuscar}
            className="w-full text-xs bg-transparent focus:outline-none"
          />
        </div>

        {/* Lado Direito: Ações */}
        <div className="flex items-center gap-3">
          
          <button
            onClick={alternarTemaBanco}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs transition flex items-center justify-center cursor-pointer shadow-sm"
            title="Alternar Tema"
          >
            {darkMode ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            )}
          </button>

          {/* Balão de Perfil */}
          <div className="relative" ref={dropdownRef}>
            <div
              onClick={() => {
                if (!usuarioLogado) setModalLoginAberto(true);
                else setMenuPerfilAberto(!menuPerfilAberto);
              }}
              className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full p-0.5 border-2 border-blue-500 cursor-pointer hover:scale-105 transition shadow-sm overflow-hidden flex-shrink-0"
            >
              <img 
                src={usuarioLogado?.foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'} 
                alt="Perfil" 
                className="w-full h-full rounded-full object-cover" 
              />
            </div>

            {menuPerfilAberto && usuarioLogado && (
              <div className={`absolute right-0 mt-3 w-56 rounded-2xl shadow-2xl border p-2 z-50 space-y-1 backdrop-blur-md ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
                <div className="px-3 py-2 border-b border-slate-700/50 mb-1">
                  <p className="text-xs font-extrabold truncate">{usuarioLogado.nome}</p>
                  <p className="text-[10px] text-blue-400 font-bold truncate">@{usuarioLogado.username}</p>
                </div>

                <button
                  onClick={() => navegarPara(`/${usuarioLogado.username}`, 'perfilUrl')}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold hover:bg-blue-600 hover:text-white transition flex items-center gap-2 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  Entrar no Perfil
                </button>

                <button
                  onClick={() => navegarPara('/editarPerfil', 'editarPerfil')}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold hover:bg-blue-600 hover:text-white transition flex items-center gap-2 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  Editar Perfil
                </button>

                <button
                  onClick={() => {
                    const link = `${window.location.origin}/${usuarioLogado.username}`;
                    navigator.clipboard.writeText(link);
                    alert(`Link copiado: ${link}`);
                    setMenuPerfilAberto(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold hover:bg-blue-600 hover:text-white transition flex items-center gap-2 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                  Copiar Link de Perfil
                </button>

                <div className="border-t border-slate-700/50 pt-1 mt-1">
                  <button
                    onClick={() => {
                      BancoDeDados.fazerLogout();
                      setUsuarioLogado(null);
                      setMenuPerfilAberto(false);
                      navegarPara('/', 'biblia');
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-red-400 hover:bg-red-600 hover:text-white transition flex items-center gap-2 cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    Sair
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </header>

      <main className="flex-1 flex flex-col h-full overflow-hidden relative w-full">
        <section className="flex-1 overflow-y-auto p-4 sm:p-10 w-full pb-32">
          <div className="max-w-4xl mx-auto w-full">

            {abaPrincipal === 'biblia' && (
              carregando ? (
                <p className="text-slate-400 text-center mt-10 text-sm">Carregando conteúdo...</p>
              ) : termoBusca.trim().length >= 3 ? (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold opacity-70 mb-3">Resultados para: "{termoBusca}" ({resultadosBusca.length})</h3>
                  {resultadosBusca.map((res, i) => (
                    <div key={i} className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
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
                          className="text-[11px] text-blue-400 hover:underline cursor-pointer"
                        >
                          Ir para o capítulo →
                        </button>
                      </div>
                      <p className="text-sm leading-relaxed">{res.texto}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className={`p-5 rounded-3xl border shadow-xs ${darkMode ? 'bg-slate-900/80 border-slate-800 text-blue-200' : 'bg-blue-50/70 border-blue-100 text-blue-900'}`}>
                    <h4 className="text-[11px] font-extrabold uppercase tracking-widest mb-1.5 flex items-center gap-2">
                      <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                      Palavra do Dia
                    </h4>
                    <p className="text-sm italic leading-relaxed">"{palavraAtual.texto}" — <span className="font-semibold">{palavraAtual.referencia}</span></p>
                  </div>

                  <div className={`flex flex-wrap gap-3 items-center justify-between p-4 rounded-2xl border ${darkMode ? 'bg-slate-900/50 border-slate-800/80' : 'bg-white border-slate-200 shadow-2xs'}`}>
                    <select
                      value={livroIndex}
                      onChange={(e) => {
                        setLivroIndex(Number(e.target.value));
                        setCapituloAtual(1);
                        setVersiculosSelecionados([]);
                      }}
                      className={`text-xs font-bold rounded-xl px-4 py-2.5 border cursor-pointer focus:outline-none ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-800'}`}
                    >
                      {bibliaCompleta.map((l, idx) => (
                        <option key={l.abbrev} value={idx}>{l.name}</option>
                      ))}
                    </select>

                    <select
                      value={capituloAtual}
                      onChange={(e) => {
                        setCapituloAtual(Number(e.target.value));
                        setVersiculosSelecionados([]);
                      }}
                      className={`text-xs font-bold rounded-xl px-4 py-2.5 border cursor-pointer focus:outline-none ${darkMode ? 'bg-slate-800 border-slate-700 text-blue-400' : 'bg-slate-50 border-slate-300 text-blue-600'}`}
                    >
                      {Array.from({ length: totalCapitulosDoLivro }, (_, i) => i + 1).map((numCap) => (
                        <option key={numCap} value={numCap}>Capítulo {numCap}</option>
                      ))}
                    </select>
                  </div>

                  <div className={`space-y-4 ${tamanhoFonte} leading-loose`}>
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
                          className={`group flex flex-col gap-2 py-2.5 px-4 rounded-2xl transition border cursor-pointer select-none ${
                            isSelecionado 
                              ? 'bg-blue-600/20 border-blue-500/60 shadow-sm' 
                              : 'border-transparent hover:bg-blue-500/5'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <p className="flex-1 leading-relaxed">
                              <span className="text-xs font-extrabold text-blue-500 mr-3 align-super bg-blue-500/10 px-2 py-0.5 rounded-md">{numeroV}</span>
                              <span className={corDestaqueAtual ? `${corDestaqueAtual} text-slate-900 font-semibold px-1 rounded` : (darkMode ? 'text-slate-100' : 'text-slate-900')}>
                                {textoVersiculo}
                              </span>
                            </p>

                            <div className="flex items-center justify-end gap-2 pt-1 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition" onClick={(e) => e.stopPropagation()}>
                              <button onClick={() => setNotaVersiculoAtiva(chaveMarcacao)} className="text-xs bg-slate-700/20 hover:bg-slate-700/40 p-1.5 rounded-lg cursor-pointer" title="Adicionar Nota">📝</button>

                              <button
                                onClick={() => toggleFavorito(livroAtualObj.name, capituloAtual, numeroV, textoVersiculo)}
                                className={`text-sm p-1 rounded-lg cursor-pointer ${isFavorito ? 'text-red-500' : 'text-slate-400 hover:text-red-400'}`}
                                title="Favoritar"
                              >
                                {isFavorito ? '❤️' : '🤍'}
                              </button>
                            </div>
                          </div>

                          {notaPessoal && (
                            <div className="bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-xl text-xs text-amber-600 dark:text-amber-300 italic" onClick={(e) => e.stopPropagation()}>
                              <b>Nota Pessoal:</b> {notaPessoal}
                            </div>
                          )}

                          {notaVersiculoAtiva === chaveMarcacao && (
                            <div className="p-3.5 bg-slate-800 rounded-2xl space-y-2.5 mt-2 shadow-lg" onClick={(e) => e.stopPropagation()}>
                              <input 
                                type="text" 
                                placeholder="Escreva sua anotação pessoal..." 
                                value={textoNota} 
                                onChange={(e) => setTextoNota(e.target.value)} 
                                className="w-full text-xs p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none"
                              />
                              <div className="flex justify-end gap-2">
                                <button onClick={() => setNotaVersiculoAtiva(null)} className="text-xs px-3 py-1.5 opacity-70 cursor-pointer">Cancelar</button>
                                <button onClick={() => salvarNotaVersiculo(chaveMarcacao)} className="bg-blue-600 text-white text-xs px-4 py-1.5 rounded-xl font-bold cursor-pointer">Salvar Nota</button>
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

            {abaPrincipal === 'planos' && usuarioLogado && (
              <PlanosDeEstudo usuarioLogado={usuarioLogado} darkMode={darkMode} />
            )}

            {abaPrincipal === 'comunidade' && usuarioLogado && (
              <Comunidade 
                usuarioLogado={usuarioLogado} 
                darkMode={darkMode} 
                onVerPerfil={(username) => navegarPara(`/${username}`, 'perfilUrl')}
                abaAtual={abaPrincipal}
                setAbaAtual={(novaAba) => navegarPara(novaAba === 'biblia' ? '/' : `/${novaAba}`, novaAba)}
              />
            )}

            {abaPrincipal === 'perfilUrl' && (
              <PerfilPublico
                perfilAlvo={perfilUrlAlvo || { username: initialPath, nome: initialPath, amigos: [] }}
                usuarioLogado={usuarioLogado}
                onVoltar={() => navegarPara(usuarioLogado ? '/comunidade' : '/', usuarioLogado ? 'comunidade' : 'biblia')}
                darkMode={darkMode}
                onToggleDarkMode={alternarTemaBanco}
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

          </div>
        </section>

        {abaPrincipal === 'biblia' && versiculosSelecionados.length > 0 && (
          <div className="absolute bottom-6 left-4 right-4 sm:left-1/2 sm:transform sm:-translate-x-1/2 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex flex-wrap items-center justify-between sm:justify-center gap-3 border border-slate-700 z-50">
            <span className="text-xs font-semibold bg-blue-600 px-2 py-1 rounded-lg">
              {versiculosSelecionados.length} sel.
            </span>

            <div className="flex items-center gap-2">
              <span className="text-[10px] opacity-75">Destacar:</span>
              <button onClick={() => destacarVersiculosSelecionados('bg-amber-300 px-1.5 py-0.5 rounded')} className="w-5 h-5 rounded-full bg-amber-400 shadow cursor-pointer" title="Amarelo"></button>
              <button onClick={() => destacarVersiculosSelecionados('bg-emerald-300 px-1.5 py-0.5 rounded')} className="w-5 h-5 rounded-full bg-emerald-500 shadow cursor-pointer" title="Verde"></button>
              <button onClick={() => destacarVersiculosSelecionados('bg-blue-300 px-1.5 py-0.5 rounded')} className="w-5 h-5 rounded-full bg-blue-500 shadow cursor-pointer" title="Azul"></button>
              <button onClick={() => destacarVersiculosSelecionados('bg-pink-300 px-1.5 py-0.5 rounded')} className="w-5 h-5 rounded-full bg-pink-500 shadow cursor-pointer" title="Rosa"></button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={copiarVersiculosSelecionados}
                className="bg-slate-800 text-xs px-3 py-1.5 rounded-lg font-medium hover:bg-slate-700 transition cursor-pointer"
              >
                Copiar
              </button>
              <button
                onClick={() => setVersiculosSelecionados([])}
                className="text-xs text-slate-400 px-2 py-1 cursor-pointer"
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
