// Scroll Button from Intro to About Section
document.getElementById('scrollBtn').addEventListener('click', () => {
  document.getElementById('about').scrollIntoView({ behavior: 'smooth' });
});

const skillsContainer = document.getElementById('skills');
const initialSkillsHTML = skillsContainer.innerHTML;
let board = Array(9).fill('');
let draggedElem = null;
const cells = document.querySelectorAll('.cell');

// Drag and Drop for Skills (Tic Tac Toe)
document.querySelectorAll('.skill-box').forEach(s => {
  s.addEventListener('dragstart', e => {
    draggedElem = s;
    e.dataTransfer.setData('text/html', s.innerHTML);
  });
});

cells.forEach(cell => {
  cell.addEventListener('dragover', e => {
    e.preventDefault();
  });
  cell.addEventListener('drop', e => {
    e.preventDefault();
    const idx = +cell.dataset.index;
    if (board[idx] || !draggedElem) return;
    const data = e.dataTransfer.getData('text/html');
    board[idx] = 'X';
    cell.innerHTML = data + '<span class="x-mark">X</span>';
    draggedElem.remove();
    draggedElem = null;
    if (checkWin('X')) return showModal('Congratulations, you win!');
    setTimeout(aiMove, 300);
  });
});

function aiMove() {
  const wins = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  for (let i = 0; i < 9; i++) {
    if (!board[i]) {
      board[i] = 'O';
      if (checkWin('O')) return renderMove(i, 'O', true);
      board[i] = '';
    }
  }
  for (let i = 0; i < 9; i++) {
    if (!board[i]) {
      board[i] = 'X';
      if (checkWin('X')) {
        board[i] = 'O';
        return renderMove(i, 'O');
      }
      board[i] = '';
    }
  }
  const avail = board.map((v, i) => v === '' ? i : null).filter(i => i !== null);
  const idx = avail[Math.floor(Math.random() * avail.length)];
  board[idx] = 'O';
  renderMove(idx, 'O');
  if (checkWin('O')) return showModal('AI wins!');
  if (board.every(v => v)) return showModal("It's a draw!");
}

function renderMove(idx, player, showWin = false) {
  const cell = cells[idx];
  cell.innerHTML = `<span class="o-mark">${player}</span>`;
  if (showWin) showModal('AI wins!');
}

function checkWin(p) {
  const wins = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  return wins.some(c => c.every(i => board[i] === p));
}

function showModal(msg) {
  document.getElementById('modal-message').textContent = msg;
  document.getElementById('modal').style.display = 'flex';
}

document.getElementById('modal-close').addEventListener('click', () => {
  document.getElementById('modal').style.display = 'none';
});

document.getElementById('reset').addEventListener('click', resetGame);

function resetGame() {
  board.fill('');
  cells.forEach(c => {
    c.innerHTML = '';
  });
  skillsContainer.innerHTML = initialSkillsHTML;
  document.querySelectorAll('.skill-box').forEach(s => {
    s.addEventListener('dragstart', e => {
      draggedElem = s;
      e.dataTransfer.setData('text/html', s.innerHTML);
    });
  });
  document.getElementById('game').scrollIntoView({ behavior: 'auto' });
}

function openLink(url) {
  window.open(url, '_blank');
}


// Scroll-triggered fade-in animations
const sections = document.querySelectorAll('.section-hidden');
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if(entry.isIntersecting) {
      entry.target.classList.add('section-visible');
      entry.target.classList.remove('section-hidden');
    }
  });
}, { threshold: 0.1 });

sections.forEach(section => {
  observer.observe(section);
});
