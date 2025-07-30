const world = document.getElementById('world');
const hotbar = document.getElementById('hotbar');

const rows = 10;
const cols = 20;
const blockSize = 32;

const blockTypes = ['grass', 'dirt']; // blocos disponíveis

let selectedBlockIndex = 0;

// Inventário — quantidade de cada bloco
const inventory = {
  grass: 5,
  dirt: 10
};

// Mapa para guardar o estado dos blocos
const blocks = [];

// Cria o mundo
for (let y = 0; y < rows; y++) {
  for (let x = 0; x < cols; x++) {
    const block = document.createElement('div');
    block.classList.add('block');

    if (y > 6) {
      block.classList.add(y === 7 ? 'grass' : 'dirt');
    } else {
      block.classList.add('empty');
    }

    block.dataset.x = x;
    block.dataset.y = y;

    block.addEventListener('click', () => {
      if (!block.classList.contains('empty')) {
        // Quebra o bloco, adiciona ao inventário
        const type = getBlockType(block);
        if (type) {
          inventory[type] = (inventory[type] || 0) + 1;
          updateHotbar();
        }
        block.className = 'block empty';
      } else {
        // Coloca bloco só se tiver no inventário
        const type = blockTypes[selectedBlockIndex];
        if (inventory[type] > 0) {
          block.className = `block ${type}`;
          inventory[type]--;
          updateHotbar();
        }
      }
    });

    world.appendChild(block);
    blocks.push(block);
  }
}

function getBlockType(block) {
  for (const type of blockTypes) {
    if (block.classList.contains(type)) return type;
  }
  return null;
}

// Cria o player
const player = document.createElement('div');
player.id = 'player';
world.appendChild(player);

let playerX = 10;
let playerY = 5;

let velocityY = 0; // velocidade vertical do player
const gravity = 0.3;
const jumpStrength = -6;
const maxFallSpeed = 5;

function updatePlayerPosition() {
  player.style.left = playerX * blockSize + 2 + 'px';
  player.style.top = playerY * blockSize + 2 + 'px';
}
updatePlayerPosition();

// Função que verifica se posição (x,y) é bloco sólido
function isSolidBlock(x, y) {
  if (x < 0 || x >= cols || y < 0 || y >= rows) return true;
  const block = blocks[y * cols + x];
  return !block.classList.contains('empty');
}

// Gravidade e movimentação vertical
function gameLoop() {
  velocityY += gravity;
  if (velocityY > maxFallSpeed) velocityY = maxFallSpeed;

  let nextY = playerY + velocityY * 0.1;

  // Verifica colisão embaixo
  if (velocityY > 0) {
    if (isSolidBlock(playerX, Math.floor(nextY + 1))) {
      velocityY = 0;
      playerY = Math.floor(nextY);
    } else {
      playerY = nextY;
    }
  } else if (velocityY < 0) {
    // Subindo: colisão no teto
    if (isSolidBlock(playerX, Math.floor(nextY))) {
      velocityY = 0;
    } else {
      playerY = nextY;
    }
  }

  // Mantém player dentro do mundo verticalmente
  if (playerY > rows - 1) playerY = rows - 1;
  if (playerY < 0) playerY = 0;

  updatePlayerPosition();
  requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);

// Movimento horizontal com setas
window.addEventListener('keydown', e => {
  if (e.repeat) return;

  if (e.key === 'ArrowLeft') {
    const newX = playerX - 1;
    if (newX >= 0 && !isSolidBlock(newX, Math.floor(playerY))) {
      playerX = newX;
      updatePlayerPosition();
    }
  } else if (e.key === 'ArrowRight') {
    const newX = playerX + 1;
    if (newX < cols && !isSolidBlock(newX, Math.floor(playerY))) {
      playerX = newX;
      updatePlayerPosition();
    }
  } else if (e.key === ' ') {
    // Pular se estiver no chão
    if (isSolidBlock(playerX, Math.floor(playerY + 1))) {
      velocityY = jumpStrength;
    }
  } else if (e.key === '1') {
    selectHotbarSlot(0);
  } else if (e.key === '2') {
    selectHotbarSlot(1);
  }
});

// Cria hotbar
function createHotbar() {
  hotbar.innerHTML = '';
  blockTypes.forEach((blockType, i) => {
    const slot = document.createElement('div');
    slot.classList.add('hotbar-slot');
    if (i === selectedBlockIndex) slot.classList.add('selected');

    const blockIcon = document.createElement('div');
    blockIcon.classList.add('hotbar-block', blockType);

    const countLabel = document.createElement('div');
    countLabel.classList.add('count');
    countLabel.textContent = inventory[blockType] || 0;

    slot.appendChild(blockIcon);
    slot.appendChild(countLabel);

    slot.addEventListener('click', () => {
      selectHotbarSlot(i);
    });

    hotbar.appendChild(slot);
  });
}
createHotbar();

function updateHotbar() {
  blockTypes.forEach((blockType, i) => {
    const slot = hotbar.children[i];
    const countLabel = slot.querySelector('.count');
    countLabel.textContent = inventory[blockType] || 0;
  });
}

function selectHotbarSlot(i) {
  if (i < 0 || i >= blockTypes.length) return;
  document.querySelectorAll('.hotbar-slot').forEach(s => s.classList.remove('selected'));
  hotbar.children[i].classList.add('selected');
  selectedBlockIndex = i;
}
