// script.js

// --- 1. クイズのデータを作成 ---
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
const detailedResultsList = document.getElementById('detailed-results-list'); // ▼▼▼ 追加 ▼▼▼

// --- 3. ゲームの状態を管理する変数 ---
let currentQuestionIndex = 0;
let score = 0;
let sessionResults = []; // ▼▼▼ 追加 ▼▼▼: 各問題の結果を保存する配列

// --- 4. ゲームのロジックを関数として定義 ---

function startQuiz() {
    currentQuestionIndex = 0;
    score = 0;
    sessionResults = []; // ▼▼▼ 追加 ▼▼▼: 開始時に結果をリセット
    quizContainer.style.display = 'block';
    resultContainer.style.display = 'none';
    showQuestion();
}

function showQuestion() {
    feedbackText.textContent = '';
    explanationText.textContent = '';
    explanationText.style.display = 'none';
    nextBtn.style.display = 'none';
    
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

function selectAnswer(selectedOption) {
    const currentQuestion = quizData[currentQuestionIndex];
    const optionButtons = document.querySelectorAll('.option-btn');

    optionButtons.forEach(btn => btn.disabled = true);

    const isCorrect = selectedOption === currentQuestion.answer; // ▼▼▼ 変更 ▼▼▼

    if (isCorrect) {
        feedbackText.textContent = "✅ 正解！";
        feedbackText.style.color = 'green';
        score++;
    } else {
        feedbackText.textContent = "❌ 不正解...";
        feedbackText.style.color = 'red';
    }
    
    // ▼▼▼ ここから追加 ▼▼▼
    // この問題の結果を保存する
    sessionResults.push({
        question: currentQuestion.question,
        userAnswer: selectedOption,
        correctAnswer: currentQuestion.answer,
        isCorrect: isCorrect
    });
    // ▲▲▲ ここまで追加 ▲▲▲

    explanationText.textContent = currentQuestion.explanation;
    explanationText.style.display = 'block';
    
    nextBtn.style.display = 'block';
}

nextBtn.addEventListener('click', () => {
    currentQuestionIndex++;
    if (currentQuestionIndex < quizData.length) {
        showQuestion();
    } else {
        showResult();
    }
});

retryBtn.addEventListener('click', startQuiz);

// ▼▼▼ ここから変更 ▼▼▼
// 結果を表示する関数 (一覧表示機能を追加)
function showResult() {
    quizContainer.style.display = 'none';
    resultContainer.style.display = 'block';
    scoreText.textContent = score;
    totalText.textContent = quizData.length;

    // 結果一覧を生成
    detailedResultsList.innerHTML = ''; // 前の結果をクリア
    sessionResults.forEach((result, index) => {
        const resultItem = document.createElement('div');
        resultItem.classList.add('result-item');
        resultItem.classList.add(result.isCorrect ? 'correct' : 'wrong');

        let resultHTML = `
            <p><strong>問題 ${index + 1}:</strong> ${result.question}</p>
            <p>あなたの回答: ${result.userAnswer}</p>
        `;
        
        if (!result.isCorrect) {
            resultHTML += `<p>正解: ${result.correctAnswer}</p>`;
        }

        resultItem.innerHTML = resultHTML;
        detailedResultsList.appendChild(resultItem);
    });
}
// ▲▲▲ ここまで変更 ▲▲▲

// --- 5. ゲームを開始 ---
startQuiz();