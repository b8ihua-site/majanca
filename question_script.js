
        const items = document.querySelectorAll('.text-item');
        let currentIndex = 0;

        function changeText() {
            // 現在の要素を取得
            const currentItem = items[currentIndex];
            
            // 1. 下からフェードイン
            currentItem.classList.add('active');

            // 2. 2秒間表示させた後、上にフェードアウト
            setTimeout(() => {
                currentItem.classList.remove('active');
                currentItem.classList.add('exit');

                // 3. 次の要素へ（アニメーションが終わる頃に実行）
                setTimeout(() => {
                    currentItem.classList.remove('exit'); // 次の周回のためにリセット
                    
                    currentIndex = (currentIndex + 1) % items.length;
                    changeText(); // 再帰的に呼び出し
                }, 600); // transitionの時間(0.6s)と合わせる

            }, 3000); // 2秒間表示
        }

        // 最初の実行
        window.onload = changeText;

        const toggleButton = document.getElementById('theme-toggle');
        const body = document.body;

        // ローカルストレージからテーマ設定を読み込む
        const currentTheme = localStorage.getItem('theme');
        // 保存されたテーマが 'dark' なら、初期表示時に dark-mode クラスを付与
        if (currentTheme === 'dark') {
            body.classList.add('dark-mode');
        }

        // ボタンクリック時の処理
        toggleButton.addEventListener('click', () => {
            // dark-mode クラスを切り替える (ついていれば外す、なければつける)
            body.classList.toggle('dark-mode');

            // 現在の状態をローカルストレージに保存
            if (body.classList.contains('dark-mode')) {
                localStorage.setItem('theme', 'dark');
            } else {
                localStorage.setItem('theme', 'light');
            }
        });

/* ===== 状態管理 ===== */
let data = []; // 外部から読み込むデータ
let currentUnit = null;
let questions = [];
let index = 0;

/* ===== データ読み込み ===== */
async function loadAppData() {
  try {
    // pcs.jsonを読み込み（ファイル名がjasonなら適宜修正してください）
    const response = await fetch('pcs.json');
    if (!response.ok) throw new Error('データの読み込みに失敗しました');
    
    data = await response.json();
    
    // データが準備できたら初期画面を表示
    showStart();
  } catch (error) {
    console.error('Error:', error);
    document.getElementById('app').innerHTML = `
      <div class="card">
        <p style="color:red;">データの読み込みに失敗しました。</p>
        <p><small>適切なファイルが存在するか確認してください。</small></p>
      </div>`;
  }
}

/* ===== Utility ===== */
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
  let i = 0;
  let ready = false;

  // 次のイベントループから有効化（ダブルクリック防止等）
  setTimeout(() => { ready = true; }, 0);

  document.onclick = () => {
    if (!ready) return;
    if (i < masks.length) {
      masks[i].classList.add('revealed');
      i++;
    }
  };
}

/* ===== View / Controller ===== */
const app = document.getElementById('app');
const nav = document.getElementById('nav');

function clearNav() { nav.innerHTML = ''; }

/* JS内の showStart 関数を書き換え */
function showStart() {
  clearNav();
  app.innerHTML = `
    <div class="card">
      <div class="exp">演習する単元を選択</div>
      <select id="unitSelect">
        <option value="">単元を選択</option>
        ${data.map((u, i) => `<option value="${i}">${u.unit}</option>`).join('')}
      </select>
      
      <div class="exp">出題順</div>
      <div class="segmented-control">
        <input type="checkbox" id="orderToggle">
        <label for="orderToggle" class="control-label">
          <span class="label-text left">問題番号順</span>
          <span class="label-text right">ランダム</span>
          <div class="selection-bg"></div>
        </label>
      </div>

      <button class="btn-start" style="margin-top:30px;" onclick="startFromSelect()">開始</button>
    </div>
  `;
}
function startFromSelect() {
  const u = document.getElementById('unitSelect').value;
  // チェックボックスの状態を取得
  const isRandom = document.getElementById('orderToggle').checked;
  
  if (u === "") return;

  currentUnit = data[u];
  questions = [...currentUnit.questions];
  
  // ロジックの切り替え
  if (isRandom) {
    questions.sort(() => Math.random() - 0.5);
  }
  
  index = 0;
  showQuestion();
}

function showQuestion() {
  if (index >= questions.length) {
    showFinish();
    return;
  }
  
  const q = questions[index];
  app.innerHTML = `
    <div class="card">
      <div class="sub">${q.no}</div>
      <div class="progress">${index + 1} / ${questions.length}</div>
      <h2>${q.title}</h2>
      <p style="line-height:21px; font-size:14px;">${maskText(q.answer)}</p>
    </div>`;
    
  nav.innerHTML = `
    <div class="bottom-nav">
      <button onclick="prev()">戻る</button>
      <button class="primary2" onclick="next()" style="background: var(--btn-hover-bg); color: var(--btn-hover-text);">
        進む
      </button>
    </div>`;
    
  initReveal();
}

function showFinish() {
  clearNav();
  app.innerHTML = `
    <div class="card" style="text-align:center">
      <h2>お疲れさまでした</h2>
      <p class="sub">すべての問題が終了しました</p>
      <button class="primary" onclick="showStart()">ホームに戻る</button>
    </div>`;
}

function prev() {
  if (index > 0) {
    index--;
    showQuestion();
  }
}

function next() {
  index++;
  showQuestion();
}

/* アプリ起動 */
loadAppData();

