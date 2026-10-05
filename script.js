// --- Telegram WebApp Initialization ---
const tg = window.Telegram?.WebApp;
let currentUsername = "@player";
if (tg) {
  tg.ready();
  tg.expand();
  if (tg.initDataUnsafe?.user) {
    currentUsername = tg.initDataUnsafe.user.username ? @${tg.initDataUnsafe.user.username} : ID: ${tg.initDataUnsafe.user.id};
    document.getElementById('prof-id').innerText = currentUsername;
  }
}

// Global Variables
let selectedCartelas = [];
let generatedCardsData = {};
let calledNumbers = new Set();
let gameId = 1;
let countdown = 49;
let timerInterval = null;
let callerInterval = null;

let mainWallet = 1000;
let playWallet = 200;

// 1. Render 1 - 600 Cartela Selection Grid
const cartelaContainer = document.getElementById('cartela-container');
for (let i = 1; i <= 600; i++) {
  const btn = document.createElement('button');
  btn.className = 'cartela-btn';
  btn.innerText = i;
  btn.onclick = () => toggleCartela(i, btn);
  cartelaContainer.appendChild(btn);
}

function toggleCartela(id, btn) {
  if (selectedCartelas.includes(id)) {
    selectedCartelas = selectedCartelas.filter(item => item !== id);
    btn.classList.remove('selected');
    delete generatedCardsData[id];
  } else {
    if (selectedCartelas.length >= 3) {
      alert("ከ 3 ካርቴላ በላይ መምረጥ አይቻልም!");
      return;
    }
    selectedCartelas.push(id);
    btn.classList.add('selected');
    generatedCardsData[id] = generateBingoMatrix();
  }
  document.getElementById('selected-count').innerText = selectedCartelas.length;
  renderLobbyCards();
}

function generateBingoMatrix() {
  const getCol = (min, max) => {
    let s = new Set();
    while (s.size < 5) s.add(Math.floor(Math.random() * (max - min + 1)) + min);
    return Array.from(s);
  };
  return {
    B: getCol(1, 15),
    I: getCol(16, 30),
    N: getCol(31, 45),
    G: getCol(46, 60),
    O: getCol(61, 75)
  };
}

function renderLobbyCards() {
  const container = document.getElementById('active-cards-container');
  container.innerHTML = '';
  selectedCartelas.forEach(id => {
    container.innerHTML += buildCardHTML(id, generatedCardsData[id]);
  });
}

function buildCardHTML(id, matrix) {
  let html = <div class="bingo-card-wrapper"><div class="cartela-header">ካርቴላ #${id}</div><div class="cartela-5x5">;
  const cols = ['B', 'I', 'N', 'G', 'O'];
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      if (r === 2 && c === 2) {
        html += <div class="cell free">FREE</div>;
      } else {
        const val = matrix[cols[c]][r];
        html += <div class="cell" id="card-${id}-${val}">${val}</div>;
      }
    }
  }
  html += </div></div>;
  return html;
}

// 2. Master Board (1 - 75) መገንባት
function initBoard() {
  const ranges = { B: [1, 15], I: [16, 30], N: [31, 45], G: [46, 60], O: [61, 75] };
  for (let k in ranges) {
    const col = document.getElementById(col-${k});
    for (let n = ranges[k][0]; n <= ranges[k][1]; n++) {
      const p = document.createElement('div');
      p.className = 'num-pill';
      p.id = pill-${n};
      p.innerText = n;
      col.appendChild(p);
    }
  }
}
initBoard();

// 3. የ 49 ሰከንድ ቆጣሪ Loop
function startLobbyTimer() {
  countdown = 49;
  document.getElementById('countdown').innerText = countdown;
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    countdown--;
    document.getElementById('countdown').innerText = countdown;
    if (countdown <= 0) {
      clearInterval(timerInterval);
      startGameplay();
    }
  }, 1000);
}
startLobbyTimer();

// 4. ጨዋታው ሲጀመር እና ቁጥሮች ሲጠሩ
function startGameplay() {
  document.getElementById('lobby-view').classList.remove('active');
  document.getElementById('game-view').classList.add('active');
  document.getElementById('current-game-id').innerText = #${String(gameId).padStart(4, '0')};

  const inGame = document.getElementById('in-game-cards');
  inGame.innerHTML = '';
  selectedCartelas.forEach(id => {
    inGame.innerHTML += buildCardHTML(id, generatedCardsData[id]);
  });
  calledNumbers.clear();
  let deck = Array.from({ length: 75 }, (_, i) => i + 1).sort(() => Math.random() - 0.5);

  callerInterval = setInterval(() => {
    if (deck.length === 0) {
      endGame(null);
      return;
    }

    const ball = deck.pop();
    calledNumbers.add(ball);
    const letter = ball <= 15 ? 'B' : ball <= 30 ? 'I' : ball <= 45 ? 'N' : ball <= 60 ? 'G' : 'O';

    document.getElementById('current-call').innerText = ${letter}-${ball};

    const pill = document.getElementById(pill-${ball});
    if (pill) pill.classList.add('called');

    selectedCartelas.forEach(id => {
      const cell = document.getElementById(card-${id}-${ball});
      if (cell) cell.classList.add('marked');
    });

    // Win Checker መፈተሽ
    for (let id of selectedCartelas) {
      const winPattern = checkWinner(generatedCardsData[id]);
      if (winPattern) {
        endGame({ id, pattern: winPattern });
        return;
      }
    }
  }, 3000);
}

// 5. Win Validator Algorithm
function checkWinner(matrix) {
  const cols = ['B', 'I', 'N', 'G', 'O'];
  let grid = [[false,false,false,false,false],[false,false,false,false,false],[false,false,true,false,false],[false,false,false,false,false],[false,false,false,false,false]];

  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      if (r === 2 && c === 2) continue;
      if (calledNumbers.has(matrix[cols[c]][r])) {
        grid[r][c] = true;
      }
    }
  }

  // Row Check
  for (let r = 0; r < 5; r++) {
    if (grid[r].every(v => v)) return አግድም ረድፍ ${r + 1};
  }
  // Col Check
  for (let c = 0; c < 5; c++) {
    if ([0,1,2,3,4].every(r => grid[r][c])) return ቁልቁል መስመር ${cols[c]};
  }
  // Diagonals
  if ([0,1,2,3,4].every(i => grid[i][i])) return "ዋናው ዲያጎናል";
  if ([0,1,2,3,4].every(i => grid[i][4 - i])) return "ተቃራኒ ዲያጎናል";

  return null;
}

// 6. Game Over
function endGame(winner) {
  clearInterval(callerInterval);
  if (winner) {
    alert(🎉 ቢንጎ! በካርቴላ #${winner.id} (${winner.pattern}) አሸንፈዋል!);
    playWallet += 150;
    updateWalletUI();
  } else {
    alert("ጨዋታው ያለ አሸናፊ ተጠናቋል!");
  }

  setTimeout(() => {
    document.getElementById('game-view').classList.remove('active');
    document.getElementById('lobby-view').classList.add('active');
    
    // Reset
    selectedCartelas = [];
    generatedCardsData = {};
    document.querySelectorAll('.cartela-btn').forEach(b => b.classList.remove('selected'));
    document.getElementById('selected-count').innerText = "0";
    document.getElementById('active-cards-container').innerHTML = '';
    document.querySelectorAll('.num-pill').forEach(p => p.classList.remove('called'));
    document.getElementById('current-call').innerText = "--";

    gameId++;
    startLobbyTimer();
  }, 4000);
}

// 7. Wallet & Telebirr Submission
function updateWalletUI() {
  document.getElementById('top-main-wallet').innerText = ${mainWallet};
  document.getElementById('top-play-wallet').innerText = ${playWallet};
  document.getElementById('wallet-main').innerText = ${mainWallet} ETB;
  document.getElementById('wallet-play').innerText = ${playWallet} ETB;
  document.getElementById('prof-main').innerText = ${mainWallet} ETB;
  document.getElementById('prof-play').innerText = ${playWallet} ETB;
}

function transferToPlay() {
  if (mainWallet >= 50) {
    mainWallet -= 50;
    playWallet += 50;
    updateWalletUI();
    alert("50 ETB ወደ Play Wallet ተዛውሯል!");
  } else {
    alert("በቂ የ Main Wallet ሂሳብ የለዎትም!");
  }
}

function submitDepositToTelegram() {
  const amt = document.getElementById('deposit-amount').value;
  const txn = document.getElementById('deposit-txnid').value;
  if (!amt || !txn) {
    alert("እባክዎ የተላከውን የብር መጠን እና Transaction ID ያስገቡ!");
    return;
  }

  // ወደ ቴሌግራም አድሚን በቀጥታ የሚወስድ መረጃ ማዘጋጀት
  const msg = encodeURIComponent(ሰላም አድሚን፣ በቴሌብር ወደ 0928361886 ገንዘብ አስገብቻለሁ።\nመጠን: ${amt} ETB\nTxn ID: ${txn}\nተጠቃሚ: ${currentUsername});
  if (tg) {
    tg.sendData(JSON.stringify({ action: "deposit", amount: amt, txn_id: txn }));
  }
  
  alert("ጥያቄዎ ተመዝግቧል! ወደ አድሚን ቴሌግራም በመሄድ ደረሰኙን ያረጋግጡ።");
  window.open(https://t.me/HabeshaBingoSupport?text=${msg}, '_blank');
}

function switchTab(viewId, btn) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  document.getElementById(viewId).classList.add('active');
  btn.classList.add('active');
}