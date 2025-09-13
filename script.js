// script.js

// --- 1. クイズのデータを作成 ---
// 問題、選択肢、正解、解説をオブジェクトの配列として用意
const quizData = [
    {
        question: "主語が「I」のときのbe動詞は？",
        options: ["am", "are", "is"],
        answer: "am",
        explanation: "主語が「I」のbe動詞は必ず am になります。これは英語の基本ルールです。"
    },
    {
        question: "主語が「You」のときのbe動詞は？",
        options: ["am", "are", "is"],
        answer: "are",
        explanation: "主語が「You」のbe動詞は必ず are になります。「I am」と「You are」はセットで覚えましょう。"
    },
    {
        question: "「You are happy.」を疑問文にすると？",
        options: ["Happy you are?", "You are happy?", "Are you happy?"],
        answer: "Are you happy?",
        explanation: "be動詞の文を疑問文にするときは、be動詞を主語の前に移動させます。"
    }
];

// --- 2. HTML要素を取得 ---
const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const feedbackText = document.getElementById('feedback-text');
const explanationText = document.getElementById('explanation-text');
const nextBtn = document.getElementById('next-btn');
const quizContainer = document.getElementById('quiz-container');
const resultContainer = document.getElementById('result-container');
const scoreText = document.getElementById('score-text');
const totalText = document.getElementById('total-text');
const retryBtn = document.getElementById('retry-btn');

// --- 3. ゲームの状態を管理する変数 ---
let currentQuestionIndex = 0; // 現在の問題のインデックス
let score = 0;                // 正解数

// --- 4. ゲームのロジックを関数として定義 ---

// クイズを開始/リセットする関数
function startQuiz() {
    currentQuestionIndex = 0;
    score = 0;
    quizContainer.style.display = 'block';
    resultContainer.style.display = 'none';
    showQuestion();
}

// 問題を表示する関数
function showQuestion() {
    // 前回のフィードバックをクリア
    feedbackText.textContent = '';
    explanationText.textContent = '';
    explanationText.style.display = 'none';
    nextBtn.style.display = 'none';
    
    // 選択肢ボタンをクリア
    optionsContainer.innerHTML = '';

    const currentQuestion = quizData[currentQuestionIndex];
    questionText.textContent = currentQuestion.question;

    currentQuestion.options.forEach(option => {
        const button = document.createElement('button');
        button.textContent = option;
        button.classList.add('option-btn');
        button.addEventListener('click', () => selectAnswer(option));
        optionsContainer.appendChild(button);
    });
}

// 回答を選択したときの処理
function selectAnswer(selectedOption) {
    const currentQuestion = quizData[currentQuestionIndex];
    const optionButtons = document.querySelectorAll('.option-btn');

    // すべてのボタンを無効化
    optionButtons.forEach(btn => btn.disabled = true);

    if (selectedOption === currentQuestion.answer) {
        feedbackText.textContent = "✅ 正解！";
        feedbackText.style.color = 'green';
        score++;
    } else {
        feedbackText.textContent = "❌ 不正解...";
        feedbackText.style.color = 'red';
    }
    
    // 解説を表示
    explanationText.textContent = currentQuestion.explanation;
    explanationText.style.display = 'block';
    
    // 「次の問題へ」ボタンを表示
    nextBtn.style.display = 'block';
}

// 「次の問題へ」ボタンを押したときの処理
nextBtn.addEventListener('click', () => {
    currentQuestionIndex++;
    if (currentQuestionIndex < quizData.length) {
        showQuestion();
    } else {
        showResult();
    }
});

// 「もう一度」ボタンを押したときの処理
retryBtn.addEventListener('click', startQuiz);

// 結果を表示する関数
function showResult() {
    quizContainer.style.display = 'none';
    resultContainer.style.display = 'block';
    scoreText.textContent = score;
    totalText.textContent = quizData.length;
}

// --- 5. ゲームを開始 ---
startQuiz();