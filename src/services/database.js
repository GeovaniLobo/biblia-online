const SUPABASE_URL = 'https://apodufxahgxlghmlzagq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_vDRu0b_QIKsCCqt7ZgPwdg_G0QTJ8Eo';

const headers = {
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};

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
      const response = await fetch(`${SUPABASE_URL}/rest/v1/perfis?select=*`, {
        method: 'GET',
        headers: headers
      });
      
      if (!response.ok) return [];
      const data = await response.json();
      return data || [];
    } catch (err) {
      console.error('Erro ao buscar perfis:', err);
      return [];
    }
  },

  cadastrarPerfil: async (novoPerfil) => {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/perfis`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(novoPerfil)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Erro ao cadastrar perfil.');
    }

    return await response.json();
  },

  atualizarPerfil: async (username, novosDados) => {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/perfis?username=eq.${username}`, {
      method: 'PATCH',
      headers: headers,
      body: JSON.stringify(novosDados)
    });

    if (!response.ok) throw new Error('Erro ao atualizar perfil.');
    return await response.json();
  },

  getPublicacoes: async () => {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/publicacoes?select=*&order=id.desc`, {
        method: 'GET',
        headers: headers
      });

      if (!response.ok) return [];
      return await response.json();
    } catch (err) {
      return [];
    }
  },

  salvarPublicacao: async (pub) => {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/publicacoes`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(pub)
    });

    if (!response.ok) throw new Error('Erro ao salvar publicação.');
    return await response.json();
  }
};