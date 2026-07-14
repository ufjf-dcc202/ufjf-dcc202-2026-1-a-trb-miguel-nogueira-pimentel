let modalEstado = { tipo: null };


// "banco de dados"  pra guardar os usuarios
function carregarUsuarios() {
    const raw = localStorage.getItem('usuarios');
    try {
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
}


//salvar
function salvarUsuarios(users) {
    localStorage.setItem('usuarios', JSON.stringify(users));
}

//verificar login
function usuarioExiste(nome) {
    const users = carregarUsuarios();
    return users.some(u => u === nome);
}


//registrar
function registrarUsuario(nome) {
    const users = carregarUsuarios();
    users.push(nome);
    salvarUsuarios(users);
}



//MODAISS

    //modal do login
    function abrirModalLogin() {
        abrirModal({
            tipo: 'login',
            titulo: 'Entrar no jogo',
            descricao: 'Informe o nome de usuário para continuar.',
            placeholder: 'Seu usuário',
            textoBotao: 'Entrar'
        });
    }

    //modal do registro
    function abrirModalRegistro() {
        abrirModal({
            tipo: 'registro',
            titulo: 'Criar conta',
            descricao: 'Escolha um nome para começar a jogar.',
            placeholder: 'Novo usuário',
            textoBotao: 'Registrar'
        });
    }

    //modal do guest
    function abrirModalGuest() {
        abrirModal({
            tipo: 'guest',
            titulo: 'Entrar como convidado',
            descricao: 'Você será identificado com um nome automático.',
            textoBotao: 'Entrar como Guest'
        });
    }
//--------



//abrir o modal e criar os elementos com o js
function abrirModal(config) {


    const overlay = document.getElementById('modal-overlay');
    const title = document.getElementById('modal-title');
    const description = document.getElementById('modal-description');
    const input = document.getElementById('modal-input');
    const submitButton = document.getElementById('modal-submit');

    title.textContent = config.titulo || '';
    description.textContent = config.descricao || '';
    description.classList.remove('error');
    input.value = '';
    input.placeholder = config.placeholder || '';
    submitButton.textContent = config.textoBotao || 'OK';

    input.style.display = config.tipo === 'guest' ? 'none' : 'block';

    modalEstado = { tipo: config.tipo };
    overlay.classList.remove('hidden');
    if (input.style.display !== 'none') input.focus();
}





function fecharModal() {
    const overlay = document.getElementById('modal-overlay');
    overlay.classList.add('hidden');
}




function mostrarErro(mensagem) {
    const description = document.getElementById('modal-description');
    description.textContent = mensagem;
    description.classList.add('error');
}




function mostrarMensagemPagina(mensagem) {
    const msgEl = document.getElementById('login-message');
    if (msgEl) {
        msgEl.textContent = mensagem;
        setTimeout(() => { if (msgEl) msgEl.textContent = ''; }, 5000);
    }
}




function gerarNomeGuest() {
    const numeroAleatorio = Math.floor(1000 + Math.random() * 9000);
    return 'Guest' + numeroAleatorio;
}




function liberarJogo(nome) {
    localStorage.setItem('nomeJogadorAtual', nome);
    window.location.href = 'game.html';
}



//regrinhas do modal
function processarModal(event) {
    event.preventDefault();

    if (modalEstado.tipo === 'guest') {
        liberarJogo(gerarNomeGuest());
        return;
    }

    const input = document.getElementById('modal-input');
    const valor = input.value.trim();

    if (!valor) {
        mostrarErro('Digite um nome válido para continuar.');
        return;
    }

    if (modalEstado.tipo === 'login') {
        if (!usuarioExiste(valor)) {
            mostrarErro('Usuário não encontrado. Registre antes de fazer login.');
            return;
        }
        liberarJogo(valor);
        return;
    }

    if (modalEstado.tipo === 'registro') {
        if (usuarioExiste(valor)) {
            mostrarErro('Usuário já existe. Escolha outro nome.');
            return;
        }
        registrarUsuario(valor);
        fecharModal();
        mostrarMensagemPagina('Usuário registrado com sucesso. Agora faça login.');
        return;
    }
}








const modalForm = document.getElementById('modal-form');
const modalCancel = document.getElementById('modal-cancel');
const modalOverlay = document.getElementById('modal-overlay');

if (modalForm) {
    modalForm.addEventListener('submit', processarModal);
}

if (modalCancel) {
    modalCancel.addEventListener('click', fecharModal);
}

if (modalOverlay) {
    modalOverlay.addEventListener('click', (event) => {
        if (event.target.id === 'modal-overlay') {
            fecharModal();
        }
    });
}

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        fecharModal();
    }
});