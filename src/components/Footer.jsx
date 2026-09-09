import React from 'react';

export default function Footer({ darkMode }) {
  return (
    <footer className={`w-full py-8 px-4 sm:px-8 border-t mt-auto transition-colors duration-200 ${
      darkMode 
        ? 'bg-slate-950 border-slate-800 text-slate-400' 
        : 'bg-slate-50 border-slate-200 text-slate-600'
    }`}>
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        
        {/* Direitos / Marca */}
        <div className="space-y-1">
          <p className="text-xs font-medium">
            Luz do Mundo &copy; {new Date().getFullYear()} — Todos os direitos reservados.
          </p>
          <p className="text-[11px] opacity-75">
            Espalhando a palavra, fé e comunhão por onde for.
          </p>
        </div>

        {/* Créditos do Desenvolvedor */}
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
  );
}