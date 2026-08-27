const SUPABASE_URL = 'https://dttuprbwfvehrrlmsbsq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_L924KJoUXUBko-Av9UJgCg_53qbu4u_';

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
      
      if (!response.ok) {
        console.error('Erro HTTP ao buscar perfis:', response.statusText);
        return [];
      }
      
      const data = await response.json();
      return data || [];
    } catch (err) {
      console.error('Erro de conexão ao buscar perfis:', err);
      return [];
    }
  },

  cadastrarPerfil: async (novoPerfil) => {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/perfis`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(novoPerfil)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erro do servidor ao cadastrar:', errorText);
        throw new Error(errorText || 'Erro ao cadastrar perfil no servidor.');
      }

      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Erro na requisição de cadastro:', err);
      throw err;
    }
  },

  atualizarPerfil: async (username, novosDados) => {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/perfis?username=eq.${username}`, {
        method: 'PATCH',
        headers: headers,
        body: JSON.stringify(novosDados)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Erro ao atualizar perfil.');
      }

      return await response.json();
    } catch (err) {
      console.error('Erro ao atualizar perfil:', err);
      throw err;
    }
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
      console.error('Erro ao buscar publicações:', err);
      return [];
    }
  },

  salvarPublicacao: async (pub) => {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/publicacoes`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(pub)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Erro ao salvar publicação.');
      }

      return await response.json();
    } catch (err) {
      console.error('Erro ao salvar publicação:', err);
      throw err;
    }
  }
};