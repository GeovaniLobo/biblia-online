import React, { useState, useEffect, useRef } from 'react';
import { BancoDeDados } from './services/database';
import AuthModal from './components/AuthModal';
import Comunidade from './components/Comunidade';
import Devocionais from './components/Devocionais';
import PlanosDeEstudo from './components/PlanosDeEstudo';
import PerfilPublico from './components/PerfilPublico';
import EditarPerfil from './components/EditarPerfil';
import { supabase } from './services/supabaseClient';

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
  
  // Estados para o Dropdown de Notificações (Sino)
  const [menuNotificacoesAberto, setMenuNotificacoesAberto] = useState(false);
  const [listaNotificacoes, setListaNotificacoes] = useState([]);
  const [totalNaoLidas, setTotalNaoLidas] = useState(0);
  const [perfisCache, setPerfisCache] = useState([]);
  
  // Estados para o Ícone de Pedidos de Amizade / Sugestões (Boneco)
  const [menuAmigosAberto, setMenuAmigosAberto] = useState(false);
  const [solicitacoesPendentes, setSolicitacoesPendentes] = useState([]);
  const [sugestoesMembros, setSugestoesMembros] = useState([]);

  const dropdownRef = useRef(null);
  const hamburguerRef = useRef(null);
  const notificacoesRef = useRef(null);
  const amigosRef = useRef(null);

  // Valida se o usuário logado ainda existe na base (desloga se foi apagado)
  useEffect(() => {
    async function validarUsuarioExistente() {
      if (usuarioLogado && usuarioLogado.username) {
        const perfis = await BancoDeDados.getPerfisCadastrados();
        const existe = perfis.some(p => p.username === usuarioLogado.username);
        if (!existe) {
          await supabase.auth.signOut();
          BancoDeDados.fazerLogout();
          setUsuarioLogado(null);
          navegarPara('/', 'biblia');
        }
      }
    }
    validarUsuarioExistente();
  }, [usuarioLogado]);

  useEffect(() => {
    async function checarSessao() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.user) {
        const perfis = await BancoDeDados.getPerfisCadastrados();
        const perfilEncontrado = perfis.find(p => p.email === session.user.email || p.username === session.user.user_metadata?.username);
        
        if (perfilEncontrado) {
          setUsuarioLogado(perfilEncontrado);
        } else {
          const novoPerfil = {
            username: session.user.user_metadata?.username || session.user.email.split('@')[0],
            nome: session.user.user_metadata?.name || session.user.user_metadata?.nome || 'Usuário Google',
            foto: session.user.user_metadata?.avatar_url || session.user.user_metadata?.foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
            biografia: 'Praticando a fé e o amor ao próximo.',
            senha: 'google_auth_user'
          };
          await BancoDeDados.salvarNovoPerfilNaRede(novoPerfil);
          setUsuarioLogado(novoPerfil);
        }
      }
    }

    checarSessao();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const perfis = await BancoDeDados.getPerfisCadastrados();
        const perfilEncontrado = perfis.find(p => p.email === session.user.email);
        if (perfilEncontrado) {
          setUsuarioLogado(perfilEncontrado);
          BancoDeDados.fazerLogin(perfilEncontrado);
        }
      } else if (event === 'SIGNED_OUT') {
        setUsuarioLogado(null);
        BancoDeDados.fazerLogout();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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
      if (notificacoesRef.current && !notificacoesRef.current.contains(event.target)) {
        setMenuNotificacoesAberto(false);
      }
      if (amigosRef.current && !amigosRef.current.contains(event.target)) {
        setMenuAmigosAberto(false);
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

  const [favoritos, setFavoritos] = useState(() => {
    const salvos = localStorage.getItem('favoritos_biblia');
    return salvos ? JSON.parse(salvos) : [];
  });
  const [marcacoes, setMarcacoes] = useState(() => {
    const salvos = localStorage.getItem('marcacoes_biblia');
    return salvos ? JSON.parse(salvos) : {};
  });
  const [versiculosSelecionados, setVersiculosSelecionados] = useState([]);

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

  // Atualiza Notificações e Pedidos de Amizade em tempo real via tabela 'amizades'
  useEffect(() => {
    if (!usuarioLogado) return;
    async function carregarDadosCabecalho() {
      const notifs = await BancoDeDados.getNotificacoes(usuarioLogado.username);
      const naoLidas = notifs.filter(n => !n.lida).length;
      setTotalNaoLidas(naoLidas);

      const perfis = await BancoDeDados.getPerfisCadastrados();
      setPerfisCache(perfis);

      const rels = await BancoDeDados.getRelacoesAmizade(usuarioLogado.username);
      
      // Quem enviou pedido para mim (onde eu sou o amigo_id e o status é 'pendente')
      const pedidosPendentesUser = rels
        .filter(r => r.amigo_id === usuarioLogado.username && r.status === 'pendente')
        .map(r => r.usuario_id);
      setSolicitacoesPendentes(pedidosPendentesUser);

      // Meus amigos aceitos
      const amigosAceitos = rels
        .filter(r => r.status === 'aceito')
        .map(r => r.usuario_id === usuarioLogado.username ? r.amigo_id : r.usuario_id);

      // Quem eu já enviei pedido (pendente)
      const meusEnviosPendentes = rels
        .filter(r => r.usuario_id === usuarioLogado.username && r.status === 'pendente')
        .map(r => r.amigo_id);

      const sugestoes = perfis.filter(
        p => p.username !== usuarioLogado.username && 
             !amigosAceitos.includes(p.username) && 
             !pedidosPendentesUser.includes(p.username) &&
             !meusEnviosPendentes.includes(p.username)
      );
      setSugestoesMembros(sugestoes);
    }
    carregarDadosCabecalho();
    const intervalo = setInterval(carregarDadosCabecalho, 4000);
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
    setMenuNotificacoesAberto(false);
    setMenuAmigosAberto(false);
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

  const livroAtualObj = bibliaCompleta[livroIndex] || { name: "Carregando...", chapters: [[]] };
  const totalCapitulosDoLivro = livroAtualObj.chapters ? livroAtualObj.chapters.length : 1;
  const versiculosDoCapitulo = livroAtualObj.chapters && livroAtualObj.chapters[capituloAtual - 1] ? livroAtualObj.chapters[capituloAtual - 1] : [];

  return (
    <div className={`flex flex-col min-h-screen font-sans ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-800'}`}>

      {/* HEADER SUPERIOR */}
      <header className={`border-b px-4 lg:px-8 py-3 flex items-center justify-between gap-3 shadow-sm backdrop-blur-md z-40 sticky top-0 ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
        
        {/* Lado Esquerdo: Botão Hambúrguer (Mobile) + Logo */}
        <div className="flex items-center gap-3">
          
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

            {menuHamburguerAberto && (
              <div className={`absolute left-0 mt-3 w-64 rounded-2xl shadow-2xl border p-3 z-50 space-y-3 backdrop-blur-md ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
                
                {abaPrincipal === 'biblia' && (
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
                )}

                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-wider font-extrabold opacity-60 px-2 mb-1">Navegação</p>
                  
                  <button
                    onClick={() => navegarPara('/', 'biblia')}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2.5 cursor-pointer ${abaPrincipal === 'biblia' ? 'bg-blue-600 text-white shadow-sm' : 'hover:bg-blue-500/10'}`}
                  >
                    Bíblia
                  </button>

                  <button
                    onClick={() => {
                      if (!usuarioLogado) setModalLoginAberto(true);
                      else navegarPara('/devocional', 'devocional');
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2.5 cursor-pointer ${abaPrincipal === 'devocional' ? 'bg-blue-600 text-white shadow-sm' : 'hover:bg-blue-500/10'}`}
                  >
                    Devocional
                  </button>

                  <button
                    onClick={() => {
                      if (!usuarioLogado) setModalLoginAberto(true);
                      else navegarPara('/planos', 'planos');
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2.5 cursor-pointer ${abaPrincipal === 'planos' ? 'bg-blue-600 text-white shadow-sm' : 'hover:bg-blue-500/10'}`}
                  >
                    Planos
                  </button>

                  <button
                    onClick={() => {
                      if (!usuarioLogado) setModalLoginAberto(true);
                      else navegarPara('/comunidade', 'comunidade');
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${abaPrincipal === 'comunidade' ? 'bg-blue-600 text-white shadow-sm' : 'hover:bg-blue-500/10'}`}
                  >
                    Comunidade
                  </button>
                </div>

              </div>
            )}
          </div>

          <span 
            onClick={() => navegarPara('/', 'biblia')}
            className="text-sm sm:text-lg font-black tracking-wider flex items-center gap-2 cursor-pointer"
          >
            LUZ DO MUNDO
          </span>

          {abaPrincipal === 'biblia' && (
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
          )}
        </div>

        {/* Navegação por Ícones para telas grandes (Desktop) */}
        <div className="hidden lg:flex items-center gap-2">
          <button
            onClick={() => navegarPara('/', 'biblia')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${abaPrincipal === 'biblia' ? 'bg-blue-600 text-white shadow-sm' : darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
          >
            Bíblia
          </button>
          <button
            onClick={() => {
              if (!usuarioLogado) setModalLoginAberto(true);
              else navegarPara('/devocional', 'devocional');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${abaPrincipal === 'devocional' ? 'bg-blue-600 text-white shadow-sm' : darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
          >
            Devocional
          </button>
          <button
            onClick={() => {
              if (!usuarioLogado) setModalLoginAberto(true);
              else navegarPara('/planos', 'planos');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${abaPrincipal === 'planos' ? 'bg-blue-600 text-white shadow-sm' : darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
          >
            Planos
          </button>
          <button
            onClick={() => {
              if (!usuarioLogado) setModalLoginAberto(true);
              else navegarPara('/comunidade', 'comunidade');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition relative flex items-center gap-1.5 cursor-pointer ${abaPrincipal === 'comunidade' ? 'bg-blue-600 text-white shadow-sm' : darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
          >
            Comunidade
          </button>
        </div>

        {/* Input de Pesquisa Global */}
        <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl border w-40 lg:w-60 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-300'}`}>
          <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input
            type="text"
            placeholder="Pesquisar..."
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
            className="w-full text-xs bg-transparent focus:outline-none"
          />
        </div>

        {/* Lado Direito: Ações (Tema + ÍCONE BONECO DE AMIZADES + Sino de Notificações + Perfil) */}
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

          {/* ÍCONE DE BONECO (Pedidos de Amizade + Sugestões) */}
          {usuarioLogado && (
            <div className="relative" ref={amigosRef}>
              <button
                onClick={() => setMenuAmigosAberto(!menuAmigosAberto)}
                className={`p-2.5 rounded-xl border transition relative flex items-center justify-center cursor-pointer ${darkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-white' : 'bg-slate-100 border-slate-300 hover:bg-slate-200 text-slate-800'}`}
                title="Pedidos de amizade e sugestões"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {solicitacoesPendentes.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] w-4 h-4 rounded-full font-black flex items-center justify-center shadow-md animate-bounce">
                    {solicitacoesPendentes.length}
                  </span>
                )}
              </button>

              {menuAmigosAberto && (
                <div className={`absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl shadow-2xl border p-4 z-50 space-y-4 backdrop-blur-md max-h-96 overflow-y-auto ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
                  
                  {/* Seção 1: Solicitações de Amizade */}
                  <div>
                    <h4 className="text-xs font-extrabold uppercase tracking-wider mb-2 flex items-center justify-between">
                      <span>Solicitações Pendentes</span>
                      <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full">{solicitacoesPendentes.length}</span>
                    </h4>

                    {solicitacoesPendentes.length === 0 ? (
                      <p className="text-xs opacity-60 py-2">Nenhum pedido de amizade no momento.</p>
                    ) : (
                      <div className="space-y-2">
                        {solicitacoesPendentes.map((remetenteUsername) => {
                          const perfilRemetente = perfisCache.find(p => p.username === remetenteUsername);
                          const nomeRemetente = perfilRemetente?.nome || remetenteUsername;
                          const fotoRemetente = perfilRemetente?.foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80';

                          return (
                            <div 
                              key={remetenteUsername} 
                              className={`flex items-center justify-between p-2.5 rounded-xl border text-xs gap-2 ${
                                darkMode 
                                  ? 'bg-slate-800 border-slate-700 text-white' 
                                  : 'bg-white border-slate-200 text-slate-900 shadow-2xs'
                              }`}
                            >
                              <div 
                                onClick={() => { setMenuAmigosAberto(false); navegarPara(`/${remetenteUsername}`, 'perfilUrl'); }}
                                className="flex items-center gap-2.5 cursor-pointer min-w-0"
                              >
                                <img 
                                  src={fotoRemetente} 
                                  alt={nomeRemetente} 
                                  className="w-9 h-9 rounded-full object-cover border-2 border-blue-500/40 flex-shrink-0" 
                                />
                                <div className="min-w-0">
                                  <p className="font-bold truncate hover:underline">{nomeRemetente}</p>
                                  <p className="text-[10px] text-blue-500 dark:text-blue-400 truncate">@{remetenteUsername}</p>
                                </div>
                              </div>

                              <div className="flex gap-1.5 flex-shrink-0">
                                <button
                                  onClick={async () => {
                                    await BancoDeDados.aceitarPedidoAmizade(usuarioLogado.username, remetenteUsername);
                                    setSolicitacoesPendentes(prev => prev.filter(u => u !== remetenteUsername));
                                  }}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg font-bold cursor-pointer"
                                >
                                  Aceitar
                                </button>
                                <button
                                  onClick={async () => {
                                    await BancoDeDados.removerAmizadeOuPedido(usuarioLogado.username, remetenteUsername);
                                    setSolicitacoesPendentes(prev => prev.filter(u => u !== remetenteUsername));
                                  }}
                                  className="bg-red-500/10 text-red-500 dark:text-red-400 hover:bg-red-500 hover:text-white px-2.5 py-1 rounded-lg font-bold cursor-pointer transition"
                                >
                                  Recusar
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Seção 2: Sugestões de Amigos */}
                  <div className="border-t border-slate-700/50 pt-3">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider mb-2">Sugestões para você</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {sugestoesMembros.length === 0 ? (
                        <p className="text-xs opacity-60">Sem novas sugestões no momento.</p>
                      ) : (
                        sugestoesMembros.map((membro) => (
                          <div key={membro.username} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/50">
                            <div 
                              onClick={() => { setMenuAmigosAberto(false); navegarPara(`/${membro.username}`, 'perfilUrl'); }}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <img src={membro.foto} alt="" className="w-7 h-7 rounded-full object-cover" />
                              <div>
                                <p className="text-xs font-bold">{membro.nome}</p>
                                <p className="text-[10px] opacity-60">@{membro.username}</p>
                              </div>
                            </div>
                            <button
                              onClick={async () => {
                                await BancoDeDados.enviarPedidoAmizade(usuarioLogado.username, membro.username);
                                setSugestoesMembros(prev => prev.filter(u => u.username !== membro.username));
                              }}
                              className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] px-3 py-1 rounded-lg font-bold"
                            >
                              + Seguir
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>
              )}
            </div>
          )}

          {/* BOTÃO DE NOTIFICAÇÕES (Sino) */}
          {usuarioLogado && (
            <div className="relative" ref={notificacoesRef}>
              <button
                onClick={async () => {
                  const novoEstado = !menuNotificacoesAberto;
                  setMenuNotificacoesAberto(novoEstado);
                  if (novoEstado) {
                    const notifs = await BancoDeDados.getNotificacoes(usuarioLogado.username);
                    const perfis = await BancoDeDados.getPerfisCadastrados();
                    
                    const notifsFormatadas = (notifs || []).map(n => {
                      const matchArroba = n.texto?.match(/@([^\s!]+)/);
                      const usernameExtraido = matchArroba ? matchArroba[1] : null;
                      const perfilEncontrado = perfis?.find(p => p.username === usernameExtraido);

                      const timestampDoId = Number(n.id);
                      const dataIso = n.data || n.timestamp || n.criado_em || n.createdAt || (!isNaN(timestampDoId) ? timestampDoId : null);

                      return {
                        ...n,
                        dataReal: dataIso ? new Date(dataIso) : null,
                        avatarRemetente: perfilEncontrado?.foto || n.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
                        nomeRemetente: perfilEncontrado?.nome || usernameExtraido
                      };
                    });

                    setListaNotificacoes(notifsFormatadas);
                    await BancoDeDados.marcarNotificacoesLidas(usuarioLogado.username);
                    setTotalNaoLidas(0);
                  }
                }}
                className={`p-2.5 rounded-xl border transition relative flex items-center justify-center cursor-pointer ${darkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-white' : 'bg-slate-100 border-slate-300 hover:bg-slate-200 text-slate-800'}`}
                title="Notificações"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {totalNaoLidas > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] w-4 h-4 rounded-full font-black flex items-center justify-center shadow-md animate-bounce">
                    {totalNaoLidas}
                  </span>
                )}
              </button>

              {menuNotificacoesAberto && (
                <div className={`absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl shadow-2xl border p-3 z-50 space-y-2 backdrop-blur-md max-h-96 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:transparent [&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-700/50">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                      <span>🔔</span> Notificações
                    </h4>
                    <button 
                      onClick={() => setMenuNotificacoesAberto(false)}
                      className="text-xs font-bold opacity-60 hover:opacity-100 cursor-pointer p-1"
                    >
                      ✕
                    </button>
                  </div>

                  {listaNotificacoes.length === 0 ? (
                    <div className="py-10 text-center space-y-1">
                      <p className="text-xl">✨</p>
                      <p className="text-xs opacity-60">Nenhuma notificação por enquanto.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {listaNotificacoes.map((n, idx) => {
                        const iconeTipo = 
                          n.tipo === 'mensagem' ? '💬' :
                          n.tipo === 'curtida' ? '❤️' :
                          n.tipo === 'reacao' ? '🔥' :
                          n.tipo === 'comentario' ? '💭' :
                          n.tipo === 'mencao' ? '🏷️' :
                          n.tipo === 'amizade' ? '👥' :
                          n.tipo === 'verificado' ? '✔' : '🔔';

                        return (
                          <div 
                            key={n.id || idx} 
                            onClick={() => {
                              if (['reacao', 'comentario', 'mencao', 'curtida'].includes(n.tipo)) {
                                setMenuNotificacoesAberto(false);
                                navegarPara('/comunidade', 'comunidade');
                              }
                            }}
                            className={`p-3 rounded-2xl border transition flex items-start gap-3 cursor-pointer ${darkMode ? 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}
                          >
                            <div className="relative flex-shrink-0">
                              <img 
                                src={n.avatarRemetente} 
                                alt="Avatar" 
                                className="w-10 h-10 rounded-full object-cover border-2 border-blue-500/40 shadow-sm"
                              />
                              <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-blue-600 text-white rounded-full flex items-center justify-center text-[9px] shadow">
                                {iconeTipo}
                              </span>
                            </div>

                            <div className="flex-1 min-w-0 space-y-1">
                              <p className="text-xs leading-relaxed font-medium break-words">
                                {n.texto}
                              </p>
                              <div className="flex items-center justify-between pt-0.5">
                                <span className="text-[10px] opacity-50 font-semibold">
                                  {n.dataReal && !isNaN(n.dataReal.getTime()) 
                                    ? n.dataReal.toLocaleString('pt-BR', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: '2-digit',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })
                                    : (n.horario || 'Data não registrada')}
                                </span>
                                {!n.lida && (
                                  <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
              
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
                  Entrar no Perfil
                </button>

                <button
                  onClick={() => navegarPara('/editarPerfil', 'editarPerfil')}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold hover:bg-blue-600 hover:text-white transition flex items-center gap-2 cursor-pointer"
                >
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
                  Copiar Link de Perfil
                </button>

                <div className="border-t border-slate-700/50 pt-1 mt-1">
                  <button
                    onClick={async () => {
                      await supabase.auth.signOut();
                      BancoDeDados.fazerLogout();
                      setUsuarioLogado(null);
                      setMenuPerfilAberto(false);
                      navegarPara('/', 'biblia');
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-red-400 hover:bg-red-600 hover:text-white transition flex items-center gap-2 cursor-pointer"
                  >
                    Sair
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 flex flex-col relative w-full">
        <section className="flex-1 p-4 sm:p-10 w-full pb-32">
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
                          onClick={() => {
                            const existe = versiculosSelecionados.find(v => v.numero === numeroV);
                            if (existe) {
                              setVersiculosSelecionados(versiculosSelecionados.filter(v => v.numero !== numeroV));
                            } else {
                              setVersiculosSelecionados([...versiculosSelecionados, { numero: numeroV, texto: textoVersiculo }].sort((a, b) => a.numero - b.numero));
                            }
                          }}
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
      </main>

      {/* RODAPÉ GLOBAL PROFISSIONAL */}
      <footer className={`w-full py-8 px-4 sm:px-8 border-t mt-auto transition-colors duration-200 ${
        darkMode ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
      }`}>
        <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          
          <div className="space-y-1">
            <p className="text-xs font-medium">
              Luz do Mundo &copy; {new Date().getFullYear()} — Todos os direitos reservados.
            </p>
            <p className="text-[11px] opacity-75">
              Espalhando a palavra, fé e comunhão por onde for.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="opacity-75">Desenvolvido por</span>
            <a 
              href="https://www.geolobo.dev" 
              target="_blank" 
              rel="noopener noreferrer"
              className="font-bold text-blue-500 hover:text-blue-600 hover:underline transition-all flex items-center gap-1 group"
            >
              Geovani Lobo
            </a>
          </div>

        </div>
      </footer>

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