/* ============================================================
   1. テキストアニメーション (ヘッダー用)
   ============================================================ */
function initTextAnimation() {
    const items = document.querySelectorAll('.text-item');
    if (items.length === 0) return;
    
    let currentIndex = 0;
    function changeText() {
        const currentItem = items[currentIndex];
        currentItem.classList.add('active');
        setTimeout(() => {
            currentItem.classList.remove('active');
            currentItem.classList.add('exit');
            setTimeout(() => {
                currentItem.classList.remove('exit'); 
                currentIndex = (currentIndex + 1) % items.length;
                changeText(); 
            }, 600); 
        }, 3000); 
    }
    changeText();
}

/* ============================================================
   2. テーマ切り替え & 学習記録 (JST)
   ============================================================ */
function initTheme() {
    const toggleButton = document.getElementById('theme-toggle');
    const body = document.body;
    if (localStorage.getItem('theme') === 'dark') body.classList.add('dark-mode');
    toggleButton.addEventListener('click', () => {
        body.classList.toggle('dark-mode');
        localStorage.setItem('theme', body.classList.contains('dark-mode') ? 'dark' : 'light');
        if (document.getElementById('solvedChart')) {
            const weeklyData = getWeeklyData();
            renderChart(weeklyData);
        }
    });
}

const RECORD_KEY = 'majanca_solve_records';
function getJSTDate() {
    return new Intl.DateTimeFormat('ja-JP', {
        year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Asia/Tokyo'
    }).format(new Date()).replace(/\//g, '-');
}

// 引数に subjectId (例: 'PCf', 'PCs') を追加
function incrementSolveCount(subjectId) {
    const today = getJSTDate();
    let records = JSON.parse(localStorage.getItem(RECORD_KEY) || '{}');
    
    if (!records[subjectId]) records[subjectId] = {};
    records[subjectId][today] = (records[subjectId][today] || 0) + 1;
    
    localStorage.setItem(RECORD_KEY, JSON.stringify(records));
}

function getWeeklyData() {
    const allRecords = JSON.parse(localStorage.getItem(RECORD_KEY) || '{}');
    // PCs のデータだけを抽出
    const records = allRecords['PCs'] || {}; 
    
    const today = new Date();
    const sun = new Date(today);
    sun.setDate(today.getDate() - today.getDay());

    const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dataValues = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(sun);
        d.setDate(sun.getDate() + i);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        dataValues.push(records[dateStr] || 0);
    }
    return { labels, dataValues };
}

/* ============================================================
   3. モチベーションコメント生成 & ヘッダー制御
   ============================================================ */
function getMotivationMessage(weeklyData) {
    const activeDays = weeklyData.dataValues.filter(count => count > 0).length;
    const messages = {
        0: "🌱 今週の学習は今この瞬間から！",
        1: "✨ まずは1日、いいスタート！",
        2: "🔥 学習のリズム、できてきた？",
        3: "🚀 流れ来てるよ！",
        4: "🌠 𝒀𝒐𝒖 𝒂𝒓𝒆 𝒂 𝑺𝒉𝒐𝒐𝒕𝒊𝒏𝒈 𝑺𝒕𝒂𝒓",
        5: "⚡ だれにも止められない！",
        6: "🏆 すごい！すごい！すごい！",
        7: "👑 素晴らしい！完全制覇！"
    };
    return messages[activeDays] || messages[0];
}

function updateHeaderButton(mode) {
    const headerBtn = document.querySelector('.start-btn');
    if (!headerBtn) return;
    
    if (mode === 'top') {
        headerBtn.innerText = '科目選択に戻る';
        headerBtn.onclick = (e) => { 
            e.preventDefault();
            location.href = 'index.html'; 
        };
    } else {
        headerBtn.innerText = '単元選択に戻る';
        headerBtn.onclick = (e) => { 
            e.preventDefault();
            showStart(); 
        };
    }
}

/* ============================================================
   4. 状態管理 & フラグ機能
   ============================================================ */
let data = []; 
let questions = []; 
let index = 0;
let hasCountedThisQuestion = false;
const FLAG_KEY = 'majanca_flags';

function getFlags() { return JSON.parse(localStorage.getItem(FLAG_KEY) || '[]'); }

function toggleFlag(unitName, qNo) {
    const qId = `${unitName}_${qNo}`;
    let flags = getFlags();
    flags = flags.includes(qId) ? flags.filter(id => id !== qId) : [...flags, qId];
    localStorage.setItem(FLAG_KEY, JSON.stringify(flags));
    showQuestion(); 
}

/* ============================================================
   5. Utility (マスク & グラフ描画)
   ============================================================ */
function maskText(text) {
    let r = '', m = false;
    for (const c of text) {
        if (/[一-龯ァ-ヶーA-Za-z0-9α-ωΑ-Ω＋+±-]/.test(c)) {
            if (!m) { r += '<span class="mask">'; m = true; }
            r += c;
        } else {
            if (m) { r += '</span>'; m = false; }
            r += c;
        }
    }
    if (m) r += '</span>';
    return r;
}

function initReveal() {
    const masks = document.querySelectorAll('.mask');
    let i = 0, ready = false;
    setTimeout(() => { ready = true; }, 0);
    document.onclick = (e) => {
        if (e.target.tagName === 'BUTTON' || e.target.classList.contains('material-symbols-outlined') || e.target.closest('.start-btn')) return;
        if (ready && i < masks.length) { masks[i].classList.add('revealed'); i++; }
    };
}

function renderChart(weeklyData) {
    const canvas = document.getElementById('solvedChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (window.myChart instanceof Chart) window.myChart.destroy();

    const isDark = document.body.classList.contains('dark-mode');
    const iconColor = getComputedStyle(document.body).getPropertyValue('--icon-color').trim() || '#0059FF';

    window.myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: weeklyData.labels,
            datasets: [{
                data: weeklyData.dataValues,
                backgroundColor: iconColor,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, grid: { display: false }, ticks: { stepSize: 1, color: isDark ? '#888' : '#666', font: { size: 10 } } },
                x: { grid: { display: false }, ticks: { color: isDark ? '#888' : '#666', font: { size: 10 } } }
            },
            plugins: { legend: { display: false } }
        }
    });
}

/* ============================================================
   6. View Controller
   ============================================================ */
const app = document.getElementById('app');
const nav = document.getElementById('nav');
function clearNav() { nav.innerHTML = ''; }

async function loadAppData() {
    try {
        const response = await fetch('pcs.json');
        data = await response.json();
        showStart();
    } catch (e) { app.innerHTML = `<p style="color:red;">Load Error</p>`; }
}

function showStart() {
    clearNav();
    updateHeaderButton('top'); 
    const weeklyData = getWeeklyData();
    const comment = getMotivationMessage(weeklyData);

    app.innerHTML = `
    <div class="card">
      <div class="exp">演習する単元を選択</div>
      <select id="unitSelect">
        <option value="">単元を選択</option>
        <option value="all">全範囲から出題</option>
        ${data.map((u, i) => `<option value="${i}">${u.unit}</option>`).join('')}
      </select>
      <div class="exp">出題形式</div>
      <div class="segmented-control">
        <input type="radio" name="mode" id="opt-order" value="order" checked>
        <input type="radio" name="mode" id="opt-random" value="random">
        <input type="radio" name="mode" id="opt-flag" value="flag">
        <label for="opt-order" class="control-label">番号順</label>
        <label for="opt-random" class="control-label">ランダム</label>
        <label for="opt-flag" class="control-label">フラグ</label>
        <div class="selection-bg"></div>
      </div>
      <div class="exp">進捗</div>
      <div id="chart-container">
        <canvas id="solvedChart"></canvas>
      </div>
      <div class="motivation-comment">${comment}</div>
      <button class="btn-start" onclick="startFromSelect()">開始</button>
    </div>`;
    
    renderChart(weeklyData);
}

function startFromSelect() {
    const uIdx = document.getElementById('unitSelect').value;
    const mode = document.querySelector('input[name="mode"]:checked').value;
    if (uIdx === "") return;

    let temp = [];
    if (uIdx === "all") {
        data.forEach(u => u.questions.forEach(q => temp.push({ ...q, unitName: u.unit })));
    } else {
        temp = data[uIdx].questions.map(q => ({ ...q, unitName: data[uIdx].unit }));
    }

    if (mode === 'flag') {
        const f = getFlags();
        temp = temp.filter(q => f.includes(`${q.unitName}_${q.no}`));
        if (temp.length === 0) return alert("この条件のフラグはありません");
    }
    if (mode === 'random') temp.sort(() => Math.random() - 0.5);

    questions = temp; index = 0; showQuestion();
}

function showQuestion() {
    hasCountedThisQuestion = false;
    updateHeaderButton('question'); 
    if (index >= questions.length) return showFinish();
    
    const q = questions[index];
    const qId = `${q.unitName}_${q.no}`;
    const isF = getFlags().includes(qId);
    
    app.innerHTML = `
    <div class="card">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div class="sub">${q.no}</div>
        <span class="material-symbols-outlined flag-icon ${isF ? 'active' : ''}" onclick="toggleFlag('${q.unitName}','${q.no}')">flag</span>
      </div>
      <div class="progress">${index + 1} / ${questions.length}</div>
      <h2 style="margin-top:5px;">${q.title}</h2>
      <p style="line-height:21px; font-size:14px;">${maskText(q.answer)}</p>
    </div>`;
    
    // ★ 下のボタンを「戻る（一問前）」と「進む（次へ）」に修正
    nav.innerHTML = `
    <div class="bottom-nav">
        <button onclick="prev()">戻る</button>
        <button class="primary2" onclick="next()" style="background:var(--btn-hover-bg);color:var(--btn-hover-text);">進む</button>
    </div>`;
    
    initReveal();
}

function next() { 
    if (!hasCountedThisQuestion) { 
        // 引数に 'PCs' を渡す！
        incrementSolveCount('PCs'); 
        hasCountedThisQuestion = true; 
    }
    index++; 
    showQuestion(); 
}

function prev() { 
    if (index > 0) { 
        index--; 
        showQuestion(); 
    } 
}

function showFinish() { 
    clearNav(); 
    app.innerHTML = `
    <div class="card" style="text-align:center">
        <h2>お疲れ様でした</h2>
        <button class="primary" onclick="showStart()">単元選択画面へ</button>
    </div>`; 
}

window.onload = () => { initTextAnimation(); initTheme(); loadAppData(); };
