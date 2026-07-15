

let estado = [[8, 7, 6, 5, 4, 3, 2, 1], [], []];
let historicoMovimentos = []; 
let reproduzindo = false;
let modalConfirmacao = null;
let nomeJogadorAtual = localStorage.getItem('nomeJogadorAtual') || '';

const drag = {
    ativo: false,
    elemento: null,
    origem: null,
    alvo: null,
    offsetX: 0,
    offsetY: 0,
    x: 0,
    y: 0,
    ultimoX: 0,
    angulo: 0,
    velocidadeAngular: 0,
    frameAnimacao: null
};





//Sisteminha de som quando move o disco 
let audioContext = null;

function tocarSomMovimento() {
    if (!audioContext) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        audioContext = new AudioCtx();
    }

    const duration = 0.4;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = 'triangle';   //formato da onda / som 
    oscillator.frequency.value = 520; //agudo ou não (frequencai)

    gain.gain.setValueAtTime(0.0001, audioContext.currentTime);                     //volume inicial
    gain.gain.exponentialRampToValueAtTime(0.15, audioContext.currentTime + 0.01);  //volume final
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration); //som diminuindo dps

    oscillator.connect(gain);//liga o som
    gain.connect(audioContext.destination);//joga no site

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);//inicia e para esses e o de cima
}





//cores do disco
const cores = ['#3c5874', '#4a69bd', '#1e3799', '#05c46b', '#0be881', '#ffc048', '#ff5e57', '#ff3f34'];

function inicializarJogo() {
    const jogador = localStorage.getItem('nomeJogadorAtual');
    if (!jogador) {
        window.location.href = 'login.html';
        return;
    }

    nomeJogadorAtual = jogador;
    const display = document.getElementById('display-jogador');
    if (display) {
        display.innerHTML = `<strong>Jogador:</strong> ${nomeJogadorAtual}`;
    }

    renderizar();
}



// regra de movimento
function movimentoEValido(origem, destino) {
    let pilhaOrigem = estado[origem];
    let pilhaDestino = estado[destino];
    
    if (pilhaOrigem.length === 0) return false;
    
    let discoArrastado = pilhaOrigem[pilhaOrigem.length - 1];
    let discoTopoDestino = pilhaDestino[pilhaDestino.length - 1];
    
    return pilhaDestino.length === 0 || discoTopoDestino > discoArrastado;
}


//movimentar disco
function efetuarMovimento(origem, destino) {
    if (movimentoEValido(origem, destino)) {
        let disco = estado[origem].pop();
        estado[destino].push(disco);
        adicionarAoHistorico(origem, destino, disco);
        tocarSomMovimento();
        return true;
    }
    return false;
}




//renderiza os discos e colunas
function renderizar() {
    for (let i = 0; i < 3; i++) {
        let colunaEl = document.getElementById('c' + i);
        colunaEl.innerHTML = ''; // Limpa a coluna para re-renderizar
        
        estado[i].forEach((tamanhoDisco, index) => {
            let discoEl = document.createElement('div');
            discoEl.className = 'd';
            discoEl.style.width = (tamanhoDisco * 16 + 30) + 'px'; 
            discoEl.style.background = cores[tamanhoDisco - 1];   
            
            let ehDiscoDoTopo = index === estado[i].length - 1;
            
            if (ehDiscoDoTopo && !reproduzindo) {
                discoEl.classList.add('movable');
                discoEl.addEventListener('mousedown', (ev) => iniciarArrasto(ev, i, discoEl));
                discoEl.addEventListener('touchstart', (ev) => iniciarArrasto(ev.touches[0], i, discoEl), {passive: false});
            }
            colunaEl.appendChild(discoEl); 
        });
    }

    checarVitoria();
    
    document.getElementById('btn-replay').disabled = historicoMovimentos.length === 0 || reproduzindo;
    document.getElementById('btn-reset').disabled = reproduzindo;
}



// interações quando segura e arrasta
function iniciarArrasto(ev, indiceColuna, elemento) {
    if (reproduzindo) return; 
    
    
    drag.ativo = true;
    drag.elemento = elemento;
    drag.origem = indiceColuna;
    drag.alvo = null;
    
    let rect = elemento.getBoundingClientRect(); 
    drag.offsetX = ev.clientX - rect.left;
    drag.offsetY = ev.clientY - rect.top;
    
    drag.x = drag.ultimoX = ev.clientX; 
    drag.y = ev.clientY; 
    
    drag.angulo = 0; 
    drag.velocidadeAngular = 0; 
    
    elemento.classList.add('dragging'); 
    elemento.style.transformOrigin = '50% 0%'; 
    
    // iniciar a fisica do treco
    cancelAnimationFrame(drag.frameAnimacao);
    loopFisicaAnimacao(); 
}



// att mouse
function atualizarPosicaoMouse(ev) {
    if (!drag.ativo) return;
    drag.x = ev.touches ? ev.touches[0].clientX : ev.clientX;
    drag.y = ev.touches ? ev.touches[0].clientY : ev.clientY;
}




//interações quando solta o disco
function finalizarArrasto() {
    if (!drag.ativo) return;
    drag.ativo = false;
    cancelAnimationFrame(drag.frameAnimacao); //cancela animacao
    
    //remove os efeitos de destaque das colunas
    document.querySelectorAll('.c').forEach(col => col.classList.remove('over')); 
    
    //se soltou em uma coluna valida diferente da original, tenta mover
    if (drag.alvo !== null && drag.alvo !== drag.origem) {
        efetuarMovimento(drag.origem, drag.alvo);
    }
    
    //reseta estado visual e referências
    if (drag.elemento) {
        drag.elemento.classList.remove('dragging');
        drag.elemento.style.transform = '';
    }
    
    drag.elemento = null;
    drag.origem = null;
    drag.alvo = null; 
    
    renderizar(); 
}


//mensagem de vitoria
function checarVitoria() {
    const mensagemEl = document.getElementById('m');
    if (estado[1].length === 8 || estado[2].length === 8) {
        mensagemEl.innerText = 'Parabéns! Você venceu!';
    } else {
        mensagemEl.innerText = '';
    }
}






//efeitos e fisica do treco
function loopFisicaAnimacao() {
    if (!drag.ativo || !drag.elemento) return; 
    
    //Animacao do discozinho
        let velocidadeMouseX = drag.x - drag.ultimoX;
        drag.ultimoX = drag.x; 
        
        drag.velocidadeAngular -= velocidadeMouseX * 0.15;
        drag.velocidadeAngular -= drag.angulo * 0.12;
        drag.velocidadeAngular *= 0.84; // Atrito
        
        drag.angulo += drag.velocidadeAngular; 
        drag.angulo = Math.max(-45, Math.min(45, drag.angulo)); // Limita rotação
    //-------------------------
    
    
    // aplicar efeitos no disco
        let posX = drag.x - drag.offsetX;
        let posY = drag.y - drag.offsetY;
        drag.elemento.style.transform = `translate(${posX}px, ${posY}px) rotate(${drag.angulo}deg)`;
    //-----------------------    



    //hoverzin da coluna
        drag.alvo = null;
        for (let i = 0; i < 3; i++) {
            let colEl = document.getElementById('c' + i);
            let cRect = colEl.getBoundingClientRect();
            
            if (drag.x >= cRect.left && drag.x <= cRect.right && drag.y >= cRect.top && drag.y <= cRect.bottom) {
                drag.alvo = i;
                colEl.classList.add('over'); 
            } else {
                colEl.classList.remove('over');
            }
        }
    //----------------------

    
    drag.frameAnimacao = requestAnimationFrame(loopFisicaAnimacao);
}




// guardar os movs no historico
function adicionarAoHistorico(de, para, disco) {
    historicoMovimentos.push({ de, para, disco });

    const caixa = document.getElementById('history-box');
    const msgVazia = document.getElementById('empty-msg');
    if (msgVazia) msgVazia.remove();

    const item = document.createElement('div');
    item.className = 'history-item';
    item.innerText = `Jogada ${historicoMovimentos.length}: Disco ${disco} (Pino ${de + 1} ➔ Pino ${para + 1})`;
    caixa.appendChild(item);
    caixa.scrollTop = caixa.scrollHeight;
}



//replay
function iniciarReplay() {
    if (historicoMovimentos.length === 0 || reproduzindo) return;
    reproduzindo = true;

    estado = [[8, 7, 6, 5, 4, 3, 2, 1], [], []];
    renderizar();

    let passo = 0;
    let intervalo = setInterval(() => {
        if (passo >= historicoMovimentos.length) {
            clearInterval(intervalo);
            reproduzindo = false;
            renderizar();
            return;
        }

        let movimento = historicoMovimentos[passo];
        estado[movimento.para].push(estado[movimento.de].pop());
        tocarSomMovimento();

        let colDestinoEl = document.getElementById('c' + movimento.para);
        if (colDestinoEl) {
            colDestinoEl.classList.add('over');
            setTimeout(() => colDestinoEl.classList.remove('over'), 250);
        }

        renderizar();
        passo++;
    }, 700);
}


//resetar
function reiniciarJogo() {
    if (reproduzindo) return;
    estado = [[8, 7, 6, 5, 4, 3, 2, 1], [], []];
    historicoMovimentos = [];

    const caixa = document.getElementById('history-box');
    if (caixa) {
        caixa.innerHTML = '<div style="color: #7f8c8d; font-size: 13px; text-align: center; margin-top: 20px;" id="empty-msg">Nenhuma jogada realizada</div>';
    }

    renderizar();
}


//----------------------
// CAMPO DOS MODAIS
    
function abrirModalConfirmacao(titulo, mensagem, callback) {
    const title = document.getElementById('modal-title');
    const description = document.getElementById('modal-description');
    const overlay = document.getElementById('modal-overlay');

    if (!title || !description || !overlay) return;

    title.textContent = titulo;
    description.textContent = mensagem;
    modalConfirmacao = callback;
    overlay.classList.remove('hidden');
}


function fecharModalConfirmacao() {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) {
        overlay.classList.add('hidden');
    }
    modalConfirmacao = null;
}


function abrirModalReplay() {
    abrirModalConfirmacao('Repetir jogadas', 'Deseja assistir o replay das jogadas realizadas?', () => iniciarReplay());
}


function abrirModalReset() {
    abrirModalConfirmacao('Reiniciar jogo', 'Deseja reiniciar a partida e limpar o histórico?', () => reiniciarJogo());
}


function abrirModalSair() {
    abrirModalConfirmacao('Sair do jogo', 'Deseja voltar para a tela de login?', () => {
        localStorage.removeItem('nomeJogadorAtual');
        window.location.href = 'login.html';
    });
}


//--------------------------------



window.addEventListener('mousemove', atualizarPosicaoMouse);
window.addEventListener('touchmove', atualizarPosicaoMouse, { passive: false });
window.addEventListener('mouseup', finalizarArrasto);
window.addEventListener('touchend', finalizarArrasto);



//modais
const modalCancel = document.getElementById('modal-cancel');
const modalConfirm = document.getElementById('modal-confirm');
const modalOverlay = document.getElementById('modal-overlay');


if (modalCancel) {
    modalCancel.addEventListener('click', fecharModalConfirmacao);
}

if (modalConfirm) {
    modalConfirm.addEventListener('click', () => {
        if (modalConfirmacao) {
            modalConfirmacao();
        }
        fecharModalConfirmacao();
    });
}

if (modalOverlay) {
    modalOverlay.addEventListener('click', (event) => {
        if (event.target.id === 'modal-overlay') {
            fecharModalConfirmacao();
        }
    });
}







inicializarJogo();