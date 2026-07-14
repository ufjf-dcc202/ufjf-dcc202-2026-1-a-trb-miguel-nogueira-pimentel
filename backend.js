

let estado = [[8, 7, 6, 5, 4, 3, 2, 1], [], []];
let historicoMovimentos = []; 
let reproduzindo = false;



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






//cores do disco
const cores = ['#2c3e50', '#4a69bd', '#1e3799', '#05c46b', '#0be881', '#ffc048', '#ff5e57', '#ff3f34'];



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




//reiniciar o jogo
function reiniciarJogo() {
    if (reproduzindo) return; 
    estado = [[8, 7, 6, 5, 4, 3, 2, 1], [], []]; 
    historicoMovimentos = []; 
    
    const caixa = document.getElementById('history-box');
    caixa.innerHTML = '<div style="color: #7f8c8d; font-size: 13px; text-align: center; margin-top: 20px;" id="empty-msg">Nenhuma jogada realizada</div>';
    
    renderizar();
}


window.addEventListener('mousemove', atualizarPosicaoMouse);
window.addEventListener('touchmove', atualizarPosicaoMouse, {passive: false});
window.addEventListener('mouseup', finalizarArrasto);
window.addEventListener('touchend', finalizarArrasto);

renderizar();