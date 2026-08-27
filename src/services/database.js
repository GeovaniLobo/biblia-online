import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dttuprbwfvehrrlmsbsq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_L924KJoUXUBko-Av9UJgCg_53qbu4u_';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

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
    try {
      const { data, error } = await supabase.from('perfis').select('*');
      if (error) {
        console.error('Erro Supabase (getPerfis):', error.message || error);
        return [];
      }
      return data || [];
    } catch (err) {
      console.error('Erro de rede/conexão:', err);
      return [];
    }
  },

  cadastrarPerfil: async (novoPerfil) => {
    const { data, error } = await supabase.from('perfis').insert([novoPerfil]).select();
    if (error) {
      console.error('Erro Supabase ao cadastrar:', error);
      throw error;
    }
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