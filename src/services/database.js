export const BancoDeDados = {
  getUsuarioLogado: () => {
    const salvo = localStorage.getItem('usuario_perfil_real');
    return salvo ? JSON.parse(salvo) : null;
  },

  salvarPerfil: (dadosPerfil) => {
    localStorage.setItem('usuario_perfil_real', JSON.stringify(dadosPerfil));
  },

  fazerLogout: () => {
    localStorage.removeItem('usuario_perfil_real');
  },

  getPerfisCadastrados: () => {
    const salvos = localStorage.getItem('perfis_comunidade_db');
    if (salvos) {
      try {
        const perfis = JSON.parse(salvos);
        const temGeovani = perfis.some(p => p.username === 'geovanilobo');
        if (temGeovani) return perfis;
      } catch (e) {}
    }

    const padrao = [
      {
        id: 'user_geovani',
        username: 'geovanilobo',
        senha: '123',
        nome: 'Geovani da Silva Lobo',
        biografia: 'desenvolvedor do site',
        foto: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
        dataNascimento: '1998-06-09',
        amigos: ['anasouza'],
        pedidosEnviados: [],
        pedidosRecebidos: []
      },
      {
        id: 'user_ana',
        username: 'anasouza',
        senha: '123',
        nome: 'Ana Souza',
        biografia: 'Praticando a fé e o amor ao próximo.',
        foto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        dataNascimento: '1995-03-12',
        amigos: ['geovanilobo'],
        pedidosEnviados: [],
        pedidosRecebidos: []
      }
    ];
    localStorage.setItem('perfis_comunidade_db', JSON.stringify(padrao));
    return padrao;
  },

  salvarNovoPerfilNaRede: (novoPerfil) => {
    let perfis = BancoDeDados.getPerfisCadastrados();
    if (!perfis.some(p => p.username === novoPerfil.username)) {
      perfis.push({
        ...novoPerfil,
        amigos: novoPerfil.amigos || [],
        pedidosEnviados: novoPerfil.pedidosEnviados || [],
        pedidosRecebidos: novoPerfil.pedidosRecebidos || []
      });
      localStorage.setItem('perfis_comunidade_db', JSON.stringify(perfis));
    }
  },

  validarLogin: (username, senha) => {
    const perfis = BancoDeDados.getPerfisCadastrados();
    const limpoUser = username.trim().toLowerCase().replace('@', '');
    const limpaSenha = senha.trim();
    return perfis.find(p => p.username === limpoUser && p.senha === limpaSenha);
  },

  enviarPedidoAmizade: (usernameRemetente, usernameDestinatario) => {
    let perfis = BancoDeDados.getPerfisCadastrados();
    perfis = perfis.map(p => {
      if (p.username === usernameRemetente && !p.pedidosEnviados.includes(usernameDestinatario)) {
        p.pedidosEnviados.push(usernameDestinatario);
      }
      if (p.username === usernameDestinatario && !p.pedidosRecebidos.includes(usernameRemetente)) {
        p.pedidosRecebidos.push(usernameRemetente);
        BancoDeDados.adicionarNotificacao(usernameDestinatario, `@${usernameRemetente} enviou um pedido de amizade.`, 'amizade');
      }
      return p;
    });
    localStorage.setItem('perfis_comunidade_db', JSON.stringify(perfis));
  },

  aceitarPedidoAmizade: (meuUsername, amigoUsername) => {
    let perfis = BancoDeDados.getPerfisCadastrados();
    perfis = perfis.map(p => {
      if (p.username === meuUsername) {
        p.pedidosRecebidos = p.pedidosRecebidos.filter(n => n !== amigoUsername);
        if (!p.amigos.includes(amigoUsername)) p.amigos.push(amigoUsername);
      }
      if (p.username === amigoUsername) {
        p.pedidosEnviados = p.pedidosEnviados.filter(n => n !== meuUsername);
        if (!p.amigos.includes(meuUsername)) p.amigos.push(meuUsername);
      }
      return p;
    });
    localStorage.setItem('perfis_comunidade_db', JSON.stringify(perfis));
    BancoDeDados.adicionarNotificacao(amigoUsername, `@${meuUsername} aceitou seu pedido de amizade! 🎉`, 'amizade');
  },

  rejeitarPedidoAmizade: (meuUsername, amigoUsername) => {
    let perfis = BancoDeDados.getPerfisCadastrados();
    perfis = perfis.map(p => {
      if (p.username === meuUsername) {
        p.pedidosRecebidos = p.pedidosRecebidos.filter(n => n !== amigoUsername);
      }
      if (p.username === amigoUsername) {
        p.pedidosEnviados = p.pedidosEnviados.filter(n => n !== meuUsername);
      }
      return p;
    });
    localStorage.setItem('perfis_comunidade_db', JSON.stringify(perfis));
  },

  getNotificacoes: (username) => {
    const salvo = localStorage.getItem(`notificacoes_${username}`);
    return salvo ? JSON.parse(salvo) : [];
  },

  adicionarNotificacao: (destinatarioUsername, texto, tipo) => {
    const atuais = BancoDeDados.getNotificacoes(destinatarioUsername);
    const nova = { id: Date.now(), texto, tipo, lida: false, horario: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    localStorage.setItem(`notificacoes_${destinatarioUsername}`, JSON.stringify([nova, ...atuais]));
  },

  marcarNotificacoesLidas: (username) => {
    const atuais = BancoDeDados.getNotificacoes(username);
    const atualizadas = atuais.map(n => ({ ...n, lida: true }));
    localStorage.setItem(`notificacoes_${username}`, JSON.stringify(atualizadas));
  },

  getPublicacoes: () => {
    const salvos = localStorage.getItem('publicacoes_comunidade_db');
    return salvos ? JSON.parse(salvos) : [
      {
        id: 101,
        autor: 'Ana Souza',
        username: 'anasouza',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        tema: 'A Paz que Excede o Entendimento',
        texto: 'Mesmo quando as circunstâncias tentam roubar nossa alegria, a presença de Deus é o nosso refúgio seguro.',
        imagem: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
        curtidas: 5,
        comentarios: [{ autor: 'Geovani da Silva Lobo', texto: 'Amém! Palavra edificante.' }]
      }
    ];
  },

  salvarPublicacao: (pub) => {
    const atual = BancoDeDados.getPublicacoes();
    const atualizado = [pub, ...atual];
    localStorage.setItem('publicacoes_comunidade_db', JSON.stringify(atualizado));
    return atualizado;
  },

  atualizarPublicacao: (id, novoTexto, novoTema) => {
    const atual = BancoDeDados.getPublicacoes();
    const atualizado = atual.map(p => p.id === id ? { ...p, texto: novoTexto, tema: novoTema } : p);
    localStorage.setItem('publicacoes_comunidade_db', JSON.stringify(atualizado));
    return atualizado;
  },

  excluirPublicacao: (id) => {
    const atual = BancoDeDados.getPublicacoes();
    const atualizado = atual.filter(p => p.id !== id);
    localStorage.setItem('publicacoes_comunidade_db', JSON.stringify(atualizado));
    return atualizado;
  },

  curtirPublicacao: (id) => {
    const atual = BancoDeDados.getPublicacoes();
    const atualizado = atual.map(p => p.id === id ? { ...p, curtidas: p.curtidas + 1 } : p);
    localStorage.setItem('publicacoes_comunidade_db', JSON.stringify(atualizado));
    return atualizado;
  },

  adicionarComentarioPub: (id, comentario) => {
    const atual = BancoDeDados.getPublicacoes();
    const atualizado = atual.map(p => p.id === id ? { ...p, comentarios: [...p.comentarios, comentario] } : p);
    localStorage.setItem('publicacoes_comunidade_db', JSON.stringify(atualizado));
    return atualizado;
  },

  getStories: () => {
    const salvos = localStorage.getItem('stories_comunidade_db');
    return salvos ? JSON.parse(salvos) : [];
  },

  salvarStory: (story) => {
    const atual = BancoDeDados.getStories();
    const atualizado = [story, ...atual];
    localStorage.setItem('stories_comunidade_db', JSON.stringify(atualizado));
    return atualizado;
  },

  registrarVisualizacaoStory: (storyId, usernameLeitor, usernameAutorStory) => {
    let stories = BancoDeDados.getStories();
    stories = stories.map(s => {
      if (s.id === storyId && !s.visualizadores.includes(usernameLeitor)) {
        s.visualizadores.push(usernameLeitor);
        if (usernameLeitor !== usernameAutorStory) {
          BancoDeDados.adicionarNotificacao(usernameAutorStory, `@${usernameLeitor} visualizou seu story.`, 'story');
        }
      }
      return s;
    });
    localStorage.setItem('stories_comunidade_db', JSON.stringify(stories));
  },

  getMensagensChat: (user1, user2) => {
    const chave = `chat_${[user1, user2].sort().join('_')}`;
    const salvo = localStorage.getItem(chave);
    return salvo ? JSON.parse(salvo) : [];
  },

  enviarMensagemChat: (remetenteUsername, destinatarioUsername, conteudo, tipo = 'texto') => {
    const chave = `chat_${[remetenteUsername, destinatarioUsername].sort().join('_')}`;
    const mensagens = BancoDeDados.getMensagensChat(remetenteUsername, destinatarioUsername);
    const novaMsg = {
      id: Date.now(),
      remetente: remetenteUsername,
      destinatario: destinatarioUsername,
      conteudo,
      tipo,
      horario: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    mensagens.push(novaMsg);
    localStorage.setItem(chave, JSON.stringify(mensagens));
    BancoDeDados.adicionarNotificacao(destinatarioUsername, `@${remetenteUsername} enviou uma mensagem no chat.`, 'chat');
    return mensagens;
  }
};