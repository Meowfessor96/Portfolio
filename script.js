// script.js

// Smooth scroll to Game
const scrollBtn = document.getElementById('scrollBtn');
if (scrollBtn) scrollBtn.addEventListener('click', () => {
  document.getElementById('game').scrollIntoView({ behavior: 'smooth' });
});

const skillsContainer = document.getElementById('skills');
const initialSkillsHTML = skillsContainer.innerHTML;  // store initial skills markup
let skills = document.querySelectorAll('.skill-box');
const cells = document.querySelectorAll('.cell');
let board = Array(9).fill('');
let draggedElem = null;

// Drag-drop using dataTransfer with HTML
skills.forEach(s => {
  s.addEventListener('dragstart', e => {
    draggedElem = s;
    e.dataTransfer.setData('text/html', s.innerHTML);
    e.dataTransfer.effectAllowed = 'copy';
  });
});

cells.forEach(cell => {
  cell.addEventListener('dragover', e => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  });
  cell.addEventListener('drop', e => {
    e.preventDefault();
    const idx = +cell.dataset.index;
    if (board[idx] || !draggedElem) return;
    const data = e.dataTransfer.getData('text/html');
    if (!data) return;
    // place icon + X
    board[idx] = 'X';
    cell.innerHTML = data + '<span class="x-mark">X</span>';
    cell.classList.add('highlight');
    // remove used skill box
    draggedElem.remove();
    draggedElem = null;
    if (checkWin('X')) return showModal('Congratulations, you win!');
    setTimeout(aiMove, 300);
  });
});

document.getElementById('reset').addEventListener('click', resetGame);

// AI move: win, block, then random
function aiMove() {
  const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  // try win
  for (let i = 0; i < 9; i++) {
    if (!board[i]) {
      board[i] = 'O';
      if (wins.some(c => c.every(j => board[j] === 'O'))) {
        renderMove(i, 'O');
        return showModal('AI wins!');
      }
      board[i] = '';
    }
  }
  // block
  for (let i = 0; i < 9; i++) {
    if (!board[i]) {
      board[i] = 'X';
      if (wins.some(c => c.every(j => board[j] === 'X'))) {
        board[i] = 'O';
        renderMove(i, 'O');
        return;
      }
      board[i] = '';
    }
  }
  // random
  const avail = board.map((v, i) => v === '' ? i : null).filter(i => i !== null);
  const idx = avail[Math.floor(Math.random() * avail.length)];
  board[idx] = 'O';
  renderMove(idx, 'O');
  if (checkWin('O')) return showModal('AI wins!');
  if (board.every(v => v)) return showModal("It's a draw!");
}

function renderMove(idx, player) {
  const cell = cells[idx];
  cell.innerHTML = `<span class="o-mark">${player}</span>`;
}

function checkWin(p) {
  const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  return wins.some(c => c.every(i => board[i] === p));
}

// Modal functions
function showModal(msg) {
  const modal = document.getElementById('modal');
  document.getElementById('modal-message').textContent = msg;
  modal.style.display = 'flex';
}
document.getElementById('modal-close').addEventListener('click', () => {
  document.getElementById('modal').style.display = 'none';
});

// Reset game without page reload, stay on game section
function resetGame() {
  // clear board
  board.fill('');
  cells.forEach(c => {
    c.innerHTML = '';
    c.classList.remove('highlight');
  });
  // restore skill boxes
  skillsContainer.innerHTML = initialSkillsHTML;
  // rebind drag events
  document.querySelectorAll('.skill-box').forEach(s => {
    s.addEventListener('dragstart', e => {
      draggedElem = s;
      e.dataTransfer.setData('text/html', s.innerHTML);
      e.dataTransfer.effectAllowed = 'copy';
    });
  });
  // stay on game section
  document.getElementById('game').scrollIntoView({ behavior: 'auto' });
}
