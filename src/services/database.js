import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dttuprbwfvehrrlmsbsq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_L924KJoUXUBko-Av9UJgCg_53qbu4u_';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const BancoDeDados = {
  getUsuarioLogado: () => {
    const salvo = localStorage.getItem('usuario_logado_supa');
    return salvo ? JSON.parse(salvo) : null;
  },

  fazerLogin: (usuario) => {
    localStorage.setItem('usuario_logado_supa', JSON.stringify(usuario));
  },

  fazerLogout: () => {
    localStorage.removeItem('usuario_logado_supa');
  },

  getPerfisCadastrados: async () => {
    const { data, error } = await supabase.from('perfis').select('*');
    if (error) {
      console.error('Erro ao buscar perfis:', error);
      return [];
    }
    return data || [];
  },

  cadastrarPerfil: async (novoPerfil) => {
    const { data, error } = await supabase.from('perfis').insert([novoPerfil]);
    if (error) throw error;
    return data;
  },

  atualizarPerfil: async (username, novosDados) => {
    const { data, error } = await supabase
      .from('perfis')
      .update(novosDados)
      .eq('username', username);
    if (error) throw error;
    return data;
  },

  getPublicacoes: async () => {
    const { data, error } = await supabase
      .from('publicacoes')
      .select('*')
      .order('id', { ascending: false });
    if (error) {
      console.error('Erro ao buscar publicações:', error);
      return [];
    }
    return data || [];
  },

  salvarPublicacao: async (pub) => {
    const { data, error } = await supabase.from('publicacoes').insert([pub]);
    if (error) throw error;
    return data;
  }
};