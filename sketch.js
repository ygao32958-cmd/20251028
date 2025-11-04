let questions = [];
let quiz = [];
let current = 0;
let score = 0;
let selected = -1;
let showFeedback = false;
let feedbackText = '';
let state = 'start'; // start | asking | result
let confetti = [];
let rain = [];
let bubbles = [];
let startBtn;

function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont('Microsoft JhengHei');
  loadCSVWithFetch();

  startBtn = createButton('開始測驗');
  styleButton(startBtn);
  positionStartBtn();

  startBtn.mousePressed(() => {
    if (questions.length === 0) {
      alert('questions.csv 未載入成功！請確認檔案位置與伺服器啟動方式。');
      return;
    }
    startBtn.hide();
    // 加入延遲以避免誤觸選項
    setTimeout(() => {
      initQuiz();
    }, 300);
  });
}

// === 載入題庫 CSV ===
function loadCSVWithFetch() {
  fetch('questions.csv', { cache: 'no-store' })
    .then((res) => res.text())
    .then((txt) => {
      parseCSVText(txt);
      console.log('題目載入成功，共 ' + questions.length + ' 題');
    })
    .catch((err) => {
      console.error('載入失敗', err);
      alert('載入題庫失敗，請檢查 questions.csv 是否存在！');
    });
}

// === CSV Parser ===
function parseCSVText(text) {
  const rows = text.trim().split('\n').map(r => r.split(','));
  rows.shift(); // 移除標題列
  for (let r of rows) {
    questions.push({
      question: r[0].replace(/^"|"$/g, ''),
      options: [r[1], r[2], r[3], r[4]].map(opt => opt.replace(/^"|"$/g, '').trim()),
      answer: r[5].replace(/^"|"$/g, '').trim(),
      feedback: (r[6] || '').replace(/^"|"$/g, '').trim()
    });
  }
}

// === 初始化 ===
function initQuiz() {
  quiz = shuffle(questions).slice(0, 5); // ✅ 改成出 5 題
  current = 0;
  score = 0;
  selected = -1;
  showFeedback = false;
  feedbackText = '';
  confetti = [];
  rain = [];
  bubbles = [];
  for (let i = 0; i < 20; i++) bubbles.push(new Bubble());
  state = 'asking';
}

// === draw ===
function draw() {
  drawBackground();
  for (let b of bubbles) b.update(), b.show();

  if (state === 'start') drawStartScreen();
  else if (state === 'asking') drawQuestion();
  else if (state === 'result') drawResult();

  for (let c of confetti) c.update(), c.show();
  for (let r of rain) r.update(), r.show();
}

// === 背景 ===
function drawBackground() {
  let c1 = color(255, 240, 245);
  let c2 = color(230, 255, 250);
  for (let y = 0; y < height; y++) {
    stroke(lerpColor(c1, c2, y / height));
    line(0, y, width, y);
  }
}

// === 起始畫面 ===
function drawStartScreen() {
  textAlign(CENTER, CENTER);
  fill(80);
  textSize(48);
  text('多選題測驗系統', width / 2, height / 2 - 100);
  textSize(22);
  fill(100);
  text('請按「開始測驗」開始作答（每題 20 分，共 5 題）', width / 2, height / 2 - 50);
}

// === 題目顯示 ===
function drawQuestion() {
  let q = quiz[current];
  if (!q) return;

  textAlign(LEFT, TOP);
  fill(60);
  textSize(28);
  text('第 ' + (current + 1) + ' 題 / ' + quiz.length, 40, 40);
  textSize(32);
  fill(50);
  text('《' + q.question + '》', 40, 100, width - 80);

  let colors = ['#BEE3F8', '#C6F6D5', '#FEEBC8', '#E9D8FD'];
  let startY = 220;
  let h = 80, gap = 30;

  for (let i = 0; i < q.options.length; i++) {
    let x = 40;
    let y = startY + i * (h + gap);
    let isHover = mouseX > x && mouseX < x + width - 80 && mouseY > y && mouseY < y + h;
    let bg = color(colors[i]);
    if (isHover) bg = color(red(bg) + 10, green(bg) + 10, blue(bg) + 10);
    if (selected === i) bg = color(255, 255, 255);

    fill(bg);
    stroke(220);
    rect(x, y, width - 80, h, 12);
    fill(60);
    noStroke();
    textSize(22);
    textAlign(LEFT, CENTER);
    text(String.fromCharCode(65 + i) + '. ' + q.options[i], x + 20, y + h / 2);
  }

  if (showFeedback) {
    fill(70);
    textSize(20);
    text(feedbackText, 60, startY + q.options.length * (h + gap) + 20);
  }
}

// === 點擊選項 ===
function mousePressed() {
  if (state !== 'asking' || showFeedback) return;

  let q = quiz[current];
  let startY = 220, h = 80, gap = 30;
  for (let i = 0; i < q.options.length; i++) {
    let x = 40, y = startY + i * (h + gap);
    if (mouseX > x && mouseX < x + width - 80 && mouseY > y && mouseY < y + h) {
      handleAnswer(i);
      break;
    }
  }
}

function handleAnswer(i) {
  selected = i;
  let q = quiz[current];
  let chosen = String.fromCharCode(65 + i);
  // 確保答案比對時不受大小寫影響
  if (chosen.toUpperCase() === q.answer.toUpperCase()) {
    score += 20;
    feedbackText = '✅ 答對！+20 分　' + q.feedback;
    for (let k = 0; k < 20; k++) confetti.push(new Confetti(random(width), random(height / 2)));
  } else {
    feedbackText = '❌ 答錯。正確答案：' + q.answer;
  }
  showFeedback = true;

  setTimeout(() => {
    current++;
    selected = -1;
    showFeedback = false;
    feedbackText = '';
    if (current >= quiz.length) showResult();
    // 新增延遲時間讓使用者有時間看答案回饋
  }, 2000);
}

// === 結果畫面 ===
function showResult() {
  state = 'result';
  if (score === 100) {
    for (let k = 0; k < 100; k++) confetti.push(new Confetti(random(width), random(-200)));
  } else if (score === 0) {
    for (let k = 0; k < 200; k++) rain.push(new Raindrop());
  } else {
    for (let k = 0; k < 60; k++) confetti.push(new Confetti(random(width), random(-100)));
  }
}

function drawResult() {
  // 移除舊的重新開始按鈕（如果有的話）
  const existingBtn = select('button');
  if (existingBtn) existingBtn.remove();
  
  fill(255, 240);
  rect(width / 2 - 300, height / 2 - 200, 600, 400, 20);
  textAlign(CENTER, CENTER);
  fill(60);
  textSize(36);
  text('最終得分：' + score + ' 分', width / 2, height / 2 - 100);
  textSize(24);
  if (score === 100) text('🎆 完美表現！', width / 2, height / 2 - 40);
  else if (score === 0) text('🌧️ 下次再接再厲！', width / 2, height / 2 - 40);
  else text('🎉 表現不錯，加油！', width / 2, height / 2 - 40);

  let btn = createButton('重新開始');
  styleButton(btn);
  btn.position(width / 2 - 60, height / 2 + 100);
  btn.mousePressed(() => {
    btn.remove();
    initQuiz();
  });
}

// === 工具 ===
function shuffle(arr) {
  let a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    let j = floor(random(i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function styleButton(btn) {
  btn.style('font-size', '18px');
  btn.style('padding', '10px 16px');
  btn.style('border-radius', '8px');
  btn.style('background', '#ffffffcc');
  btn.style('color', '#444');
  btn.style('box-shadow', '0 4px 10px rgba(0,0,0,0.1)');
  btn.elt.style.cursor = 'pointer';
}

function positionStartBtn() {
  if (!startBtn) return;
  let w = startBtn.elt.offsetWidth || 150;
  startBtn.position((width - w) / 2, height / 2);
}

// === 特效 ===
class Confetti {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = random(6, 12);
    this.color = color(random(255), random(255), random(255));
    this.vel = createVector(random(-2, 2), random(2, 6));
    this.life = 255;
  }
  update() {
    this.y += this.vel.y;
    this.x += this.vel.x;
    this.life -= 3;
  }
  show() {
    noStroke();
    fill(red(this.color), green(this.color), blue(this.color), this.life);
    rect(this.x, this.y, this.size, this.size / 2, 2);
  }
}

class Raindrop {
  constructor() {
    this.x = random(width);
    this.y = random(-500, 0);
    this.len = random(10, 20);
    this.speed = random(4, 8);
  }
  update() {
    this.y += this.speed;
    if (this.y > height) this.y = random(-100, 0), this.x = random(width);
  }
  show() {
    stroke(100, 100, 255, 180);
    line(this.x, this.y, this.x, this.y + this.len);
  }
}

class Bubble {
  constructor() {
    this.x = random(width);
    this.y = random(height);
    this.r = random(10, 60);
    this.speed = random(0.2, 1);
    this.color = color(random([255, 230, 240]), random([240, 250, 255]), 255, 40);
  }
  update() {
    this.y -= this.speed;
    if (this.y < -this.r) {
      this.y = height + this.r;
      this.x = random(width);
    }
  }
  show() {
    noStroke();
    fill(this.color);
    ellipse(this.x, this.y, this.r);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  positionStartBtn();
}

