import React, { useState, useEffect } from 'react';
import Comunidade from './components/Comunidade';
import Devocionais from './components/Devocionais';
import PlanosDeEstudo from './components/PlanosDeEstudo';
// Importe aqui o seu componente da Bíblia, se estiver em outro arquivo (ex: import Biblia from './components/Biblia';)

export default function App() {
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [darkMode, setDarkMode] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState('comunidade');

  useEffect(() => {
    // Exemplo de recuperação ou definição do usuário logado na sessão
    const usuarioSalvo = localStorage.getItem('usuario_logado');
    if (usuarioSalvo) {
      setUsuarioLogado(JSON.parse(usuarioSalvo));
    } else {
      // Usuário padrão para testes caso não esteja logado
      const usuarioPadrao = {
        username: 'geovanilobo',
        nome: 'Geovani Lobo',
        foto: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
        verificado: true
      };
      setUsuarioLogado(usuarioPadrao);
    }
  }, []);

  if (!usuarioLogado) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-950 text-white">
        <p className="text-xs opacity-60 animate-pulse">Carregando aplicação...</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'}`}>
      
      {/* Barra Superior / Menu de Navegação Global */}
      <header className={`sticky top-0 z-40 border-b backdrop-blur-md px-4 py-3 shadow-sm ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200'}`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
          
          <div className="flex items-center gap-2">
            <h1 className="text-base font-black tracking-tight bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
              Jornada Espiritual ✝️
            </h1>
          </div>

          {/* Abas de Navegação Principal */}
          <nav className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
            <button 
              onClick={() => setAbaAtiva('comunidade')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${abaAtiva === 'comunidade' ? 'bg-blue-600 text-white shadow-md' : 'opacity-70 hover:opacity-100 hover:bg-slate-500/10'}`}
            >
              🌐 Comunidade
            </button>

            <button 
              onClick={() => setAbaAtiva('devocionais')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${abaAtiva === 'devocionais' ? 'bg-blue-600 text-white shadow-md' : 'opacity-70 hover:opacity-100 hover:bg-slate-500/10'}`}
            >
              📖 Devocionais
            </button>

            <button 
              onClick={() => setAbaAtiva('planos')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${abaAtiva === 'planos' ? 'bg-blue-600 text-white shadow-md' : 'opacity-70 hover:opacity-100 hover:bg-slate-500/10'}`}
            >
              📅 Planos de Estudo
            </button>

            <button 
              onClick={() => setAbaAtiva('biblia')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${abaAtiva === 'biblia' ? 'bg-blue-600 text-white shadow-md' : 'opacity-70 hover:opacity-100 hover:bg-slate-500/10'}`}
            >
              📜 Bíblia
            </button>
          </nav>

          {/* Controles de Configuração / Tema */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2.5 rounded-xl border text-xs font-bold transition ${darkMode ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700' : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'}`}
              title="Alternar Tema"
            >
              {darkMode ? '☀️ Claro' : '🌙 Escuro'}
            </button>
          </div>

        </div>
      </header>

      {/* Renderização das Telas conforme a Aba Ativa */}
      <main className="pb-16">
        {abaAtiva === 'comunidade' && (
          <Comunidade usuarioLogado={usuarioLogado} darkMode={darkMode} />
        )}

        {abaAtiva === 'devocionais' && (
          <Devocionais usuarioLogado={usuarioLogado} darkMode={darkMode} />
        )}

        {abaAtiva === 'planos' && (
          <PlanosDeEstudo usuarioLogado={usuarioLogado} darkMode={darkMode} />
        )}

        {abaAtiva === 'biblia' && (
          <div className="max-w-4xl mx-auto px-4 py-12 text-center space-y-4">
            <h2 className="text-2xl font-black">Área da Bíblia Sagrada 📜</h2>
            <p className="text-xs opacity-70">Aqui você pode consultar leituras diárias e versículos.</p>
          </div>
        )}
      </main>

    </div>
  );
}