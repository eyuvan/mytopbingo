document.addEventListener("DOMContentLoaded", () => {
  const socket = io();
  const tg = window.Telegram?.WebApp;
  let currentUserId = "guest_123";

  if (tg) {
    tg.ready();
    tg.expand();
    if (tg.initDataUnsafe?.user) {
      currentUserId = String(tg.initDataUnsafe.user.id);
      document.getElementById('prof-id').innerText = @${tg.initDataUnsafe.user.username || currentUserId};
    }
  }

  // 3ኛ ጥያቄ፡ ነባሪ ዋሌት (Main = 0, Play = 10)
  let userWallet = { main: 0, play: 10 };
  let selectedCartelas = [];
  let generatedCardsData = {};
  let countdown = 49;
  let timerInterval = null;

  // 1ኛ ጥያቄ፡ 1 - 600 ካርቴላዎችን በራስ-ሰር ማመንጨት
  const cartelaContainer = document.getElementById('cartela-container');
  cartelaContainer.innerHTML = '';
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
      generatedCardsData[id] = generateMatrix();
    }
    document.getElementById('selected-count').innerText = selectedCartelas.length;
    renderLobbyCards();
  }

  function generateMatrix() {
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
      let html = <div class="bingo-card-wrapper"><div class="cartela-header">ካርቴላ #${id}</div><div class="cartela-5x5">;
      const cols = ['B', 'I', 'N', 'G', 'O'];
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          if (r === 2 && c === 2) {
            html += <div class="cell free">FREE</div>;
          } else {
            const val = generatedCardsData[id][cols[c]][r];
            html += <div class="cell" id="card-${id}-${val}">${val}</div>;
          }
        }
      }
      html += </div></div>;
      container.innerHTML += html;
    });
  }

  // 1-75 ቦርድ ማዘጋጀት
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

  // 2ኛ ጥያቄ፡ ቆጣሪው ወደ ታች እንዲቆጥር ማድረግ (Standalone + Socket Sync)
  function runFallbackTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      countdown--;
      if (countdown < 0) countdown = 49;
      document.getElementById('countdown').innerText = countdown;
    }, 1000);
  }
  runFallbackTimer();

  // Socket Events
  socket.emit("join_game", { user_id: currentUserId });

  socket.on("sync_state", (state) => {
    countdown = state.countdown;
    document.getElementById('countdown').innerText = countdown;
    updateWalletUI(state.wallets);
  });

  socket.on("timer_update", (d) => {
    countdown = d.countdown;
    document.getElementById('countdown').innerText = countdown;
    document.getElementById('current-game-id').innerText = #${String(d.game_id).padStart(4, '0')};
  });
  socket.on("number_called", (d) => {
    document.getElementById('current-call').innerText = d.full;
    const pill = document.getElementById(pill-${d.number});
    if (pill) pill.classList.add('called');
  });

  socket.on(wallet_update_${currentUserId}, (w) => {
    updateWalletUI(w);
  });

  function updateWalletUI(w) {
    if (!w) return;
    document.getElementById('top-main-wallet').innerText = w.main.toFixed(2);
    document.getElementById('top-play-wallet').innerText = w.play.toFixed(2);
    document.getElementById('wallet-main').innerText = ${w.main.toFixed(2)} ETB;
    document.getElementById('wallet-play').innerText = ${w.play.toFixed(2)} ETB;
    document.getElementById('prof-main').innerText = ${w.main.toFixed(2)} ETB;
    document.getElementById('prof-play').innerText = ${w.play.toFixed(2)} ETB;
  }

  // 5ኛ ጥያቄ፡ Navigation Bar በትክክል እንዲሰራ ማድረግ
  document.querySelectorAll('.bottom-nav .nav-item').forEach(button => {
    button.addEventListener('click', () => {
      const targetTab = button.getAttribute('data-tab');
      
      document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
      document.querySelectorAll('.bottom-nav .nav-item').forEach(b => b.classList.remove('active'));

      document.getElementById(targetTab).classList.add('active');
      button.classList.add('active');
    });
  });
});