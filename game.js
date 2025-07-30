const world = document.getElementById('world');
const hotbar = document.getElementById('hotbar');

const totalCols = 20;   // tamanho real do mundo
const totalRows = 30
;

const viewCols = 20;     // viewport visível fixa
const viewRows = 10;

const blockSize = 32;

const blockTypes = ['grass', 'dirt', 'leaves'];
const inventory = {
  grass: 5,
  dirt: 10,
  leaves: 0,
};

let selectedBlock = 0;
const blocks = [];

let playerX = 0;
let playerY = 0;
let velocityY = 0;

const gravity = 0.3;
const jumpPower = -3.5;
const maxFallSpeed = 5;

// Gera o mundo todo (200x30)
function generateWorld() {
  world.innerHTML = '';
  blocks.length = 0;

  for (let y = 0; y < totalRows; y++) {
    for (let x = 0; x < totalCols; x++) {
      const block = document.createElement('div');
      block.classList.add('block');

      if (y > 26) {
        block.classList.add(y === 27 ? 'grass' : 'dirt');
      } else {
        block.classList.add('empty');
      }

      block.dataset.x = x;
      block.dataset.y = y;
      world.appendChild(block);
      blocks.push(block);
    }
  }

  addTrees();
}

// Adiciona árvores simples, pode adaptar posição para o mundo maior
function addTrees() {
  const positions = [4, 10, 16, 50, 120, 180]; // algumas posições espalhadas
  positions.forEach(x => {
    const baseY = 26;

    setBlock(x, baseY, 'dirt');     // tronco
    setBlock(x, baseY - 1, 'dirt'); // tronco
    setBlock(x, baseY - 2, 'leaves');
    setBlock(x, baseY - 3, 'leaves');
    setBlock(x - 1, baseY - 2, 'leaves');
    setBlock(x + 1, baseY - 2, 'leaves');
  });
}

function getBlock(x, y) {
  if (x < 0 || x >= totalCols || y < 0 || y >= totalRows) return null;
  return blocks[y * totalCols + x];
}

function setBlock(x, y, type) {
  const block = getBlock(x, y);
  if (block) {
    block.className = `block ${type}`;
  }
}

function isSolid(x, y) {
  const block = getBlock(x, y);
  return block && !block.classList.contains('empty');
}

// Posiciona o player no canto esquerdo, no topo do chão
function placePlayer() {
  playerX = 0;
  for (let y = 1; y < totalRows; y++) {
    if (!isSolid(playerX, y) && isSolid(playerX, y + 1)) {
      playerY = y;
      updatePlayer();
      return;
    }
  }
}

// Player DOM
const player = document.createElement('div');
player.id = 'player';
world.appendChild(player);

function updatePlayer() {
  player.style.left = playerX * blockSize + 2 + 'px';
  player.style.top = (playerY - 1) * blockSize + 2 + 'px';

  updateScroll();
}

// Atualiza o scroll (translada o mundo para centralizar o player)
function updateScroll() {
  const viewportWidthPx = viewCols * blockSize;
  const viewportHeightPx = viewRows * blockSize;

  // Calcula o deslocamento para centralizar o player na viewport
  let scrollX = playerX * blockSize - viewportWidthPx / 2 + blockSize / 2;
  let scrollY = playerY * blockSize - viewportHeightPx / 2 + blockSize / 2;

  // Limita scroll para não ultrapassar as bordas do mundo
  const maxScrollX = totalCols * blockSize - viewportWidthPx;
  const maxScrollY = totalRows * blockSize - viewportHeightPx;

  scrollX = Math.max(0, Math.min(scrollX, maxScrollX));
  scrollY = Math.max(0, Math.min(scrollY, maxScrollY));

  // Aplica a transformação
  world.style.transform = `translate(${-scrollX}px, ${-scrollY}px)`;
}

// Física do player
function canMoveTo(x, y) {
  return !isSolid(x, Math.floor(y)) && !isSolid(x, Math.floor(y) - 1);
}

function gameLoop() {
  velocityY += gravity;
  if (velocityY > maxFallSpeed) velocityY = maxFallSpeed;

  let nextY = playerY + velocityY * 0.1;

  if (velocityY > 0) {
    if (!canMoveTo(playerX, Math.floor(nextY) + 1)) {
      velocityY = 0;
      playerY = Math.floor(nextY);
    } else {
      playerY = nextY;
    }
  } else {
    if (!canMoveTo(playerX, Math.floor(nextY))) {
      velocityY = 0;
    } else {
      playerY = nextY;
    }
  }

  updatePlayer();
  requestAnimationFrame(gameLoop);
}

// Entrada do teclado
window.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft') {
    const newX = playerX - 1;
    if (canMoveTo(newX, playerY)) playerX = newX;
  }

  if (e.key === 'ArrowRight') {
    const newX = playerX + 1;
    if (canMoveTo(newX, playerY)) playerX = newX;
  }

  if (e.key === ' ') {
    if (!canMoveTo(playerX, Math.floor(playerY) + 1)) {
      velocityY = jumpPower;
    }
  }

  if (e.key >= '1' && e.key <= '3') {
    selectedBlock = parseInt(e.key) - 1;
    updateHotbar();
  }

  updatePlayer();
});

// Interação de clique (você pode precisar adaptar para lidar com offset da câmera)
world.addEventListener('click', e => {
  // Calcula posição do clique relativa ao mundo real considerando scroll
  const rect = world.getBoundingClientRect();

  // Pegando scroll atual:
  const style = window.getComputedStyle(world);
  const matrix = new WebKitCSSMatrix(style.transform);

  const scrollX = -matrix.m41;
  const scrollY = -matrix.m42;

  const clickX = e.clientX - rect.left + scrollX;
  const clickY = e.clientY - rect.top + scrollY;

  const x = Math.floor(clickX / blockSize);
  const y = Math.floor(clickY / blockSize);

  const block = getBlock(x, y);
  if (!block) return;

  if (!block.classList.contains('empty')) {
    const type = blockTypes.find(t => block.classList.contains(t));
    if (type) {
      inventory[type] = (inventory[type] || 0) + 1;
      setBlock(x, y, 'empty');
      updateHotbar();
    }
  } else {
    const type = blockTypes[selectedBlock];
    if (inventory[type] > 0) {
      if (type === 'leaves') {
        const below = getBlock(x, y + 1);
        if (below && !below.classList.contains('empty')) {
          setBlock(x, y, type);
          inventory[type]--;
          updateHotbar();
        }
      } else {
        setBlock(x, y, type);
        inventory[type]--;
        updateHotbar();
      }
    }
  }
});

// Hotbar
function createHotbar() {
  hotbar.innerHTML = '';
  blockTypes.forEach((type, i) => {
    const slot = document.createElement('div');
    slot.classList.add('hotbar-slot');
    if (i === selectedBlock) slot.classList.add('selected');

    const icon = document.createElement('div');
    icon.classList.add('hotbar-block', type);

    const count = document.createElement('div');
    count.classList.add('count');
    count.textContent = inventory[type] || 0;

    slot.appendChild(icon);
    slot.appendChild(count);
    hotbar.appendChild(slot);

    slot.addEventListener('click', () => {
      selectedBlock = i;
      updateHotbar();
    });
  });
}

function updateHotbar() {
  createHotbar();
}

// Inicialização
generateWorld();
placePlayer();
createHotbar();
gameLoop();
