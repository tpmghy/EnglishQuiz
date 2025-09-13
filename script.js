// script.js

const APP_VERSION = "v1.6"; // バージョンアップ！

// --- HTML要素を取得 ---
const versionInfo = document.getElementById('version-info');
const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const feedbackText = document.getElementById('feedback-text');
const explanationText = document.getElementById('explanation-text');
const nextBtn = document.getElementById('next-btn');
const quizContainer = document.getElementById('quiz-container');
const resultContainer = document.getElementById('result-container');
const scoreText = document.getElementById('score-text');
const totalText = document.getElementById('total-text');
const detailedResultsList = document.getElementById('detailed-results-list');
const copyFeedback = document.getElementById('copy-feedback');
// ▼▼▼ ここから追加 ▼▼▼
const hintBtn = document.getElementById('hint-btn');
const hintText = document.getElementById('hint-text');
// ▲▲▲ ここまで追加 ▲▲▲

// --- グローバル変数を定義 ---
let quizData = [];
let currentQuestionIndex = 0;
let score = 0;
let sessionResults = [];

// --- CSVファイルを読み込んで解析する関数 ---
async function loadQuizData() {
    try {
        const response = await fetch('quiz.csv');
        if (!response.ok) throw new Error('Network response was not ok.');
        const csvText = await response.text();
        const lines = csvText.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        const data = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            const entry = {};
            entry.question = values[0].trim().replace(/"/g, '');
            entry.options = values[1].trim().replace(/"/g, '').split('|');
            entry.answer = values[2].trim().replace(/"/g, '');
            entry.explanation = values[3].trim().replace(/"/g, '');
            entry.hint = values[4] ? values[4].trim().replace(/"/g, '') : "この問題のヒントはありません。"; // ▼▼▼ 変更: hint列を読み込む
            data.push(entry);
        }
        return data;
    } catch (error) {
        console.error('Failed to load quiz data:', error);
        questionText.textContent = "クイズデータの読み込みに失敗しました。";
        return [];
    }
}

// --- アプリケーションの初期化と開始 ---
async function initializeApp() {
    versionInfo.textContent = APP_VERSION;
    
    // ▼▼▼ ヒントボタンにイベントリスナーを一度だけ設定 ▼▼▼
    hintBtn.addEventListener('click', showHint);

    quizData = await loadQuizData();
    if (quizData.length > 0) {
        startQuiz();
    }
}

// --- ゲームロジック ---

function startQuiz() {
    currentQuestionIndex = 0;
    score = 0;
    sessionResults = [];
    quizContainer.style.display = 'block';
    resultContainer.style.display = 'none';
    copyFeedback.textContent = '';
    showQuestion();
}

function showQuestion() {
    feedbackText.textContent = '';
    explanationText.style.display = 'none';
    nextBtn.style.display = 'none';
    optionsContainer.innerHTML = '';
    
    // ▼▼▼ ヒント関連の表示をリセット ▼▼▼
    hintText.style.display = 'none';
    hintBtn.style.display = 'block';
    hintBtn.disabled = false;

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

// ▼▼▼ ヒントを表示する新しい関数 ▼▼▼
function showHint() {
    const currentQuestion = quizData[currentQuestionIndex];
    hintText.textContent = `ヒント: ${currentQuestion.hint}`;
    hintText.style.display = 'block';
    hintBtn.disabled = true; // ヒントは1問につき1回だけ
}

function selectAnswer(selectedOption) {
    const currentQuestion = quizData[currentQuestionIndex];
    const optionButtons = document.querySelectorAll('.option-btn');
    optionButtons.forEach(btn => btn.disabled = true);
    
    // ▼▼▼ 回答を選んだらヒントボタンを隠す ▼▼▼
    hintBtn.style.display = 'none';

    const isCorrect = selectedOption === currentQuestion.answer;
    feedbackText.textContent = isCorrect ? "✅ 正解！" : "❌ 不正解...";
    feedbackText.style.color = isCorrect ? 'green' : 'red';
    if (isCorrect) score++;
    
    sessionResults.push({ question: currentQuestion.question, userAnswer: selectedOption, correctAnswer: currentQuestion.answer, isCorrect: isCorrect });
    
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

function generateResultsSummaryText() {
    let summary = `クイズの結果: ${score} / ${quizData.length} 正解！\n\n`;
    sessionResults.forEach((result, index) => {
        const icon = result.isCorrect ? '✅' : '❌';
        summary += `${icon} 問題 ${index + 1}: ${result.question}\n  あなたの回答: ${result.userAnswer}\n`;
        if (!result.isCorrect) summary += `  正解: ${result.correctAnswer}\n`;
        summary += '\n';
    });
    return summary;
}

function showResult() {
    quizContainer.style.display = 'none';
    resultContainer.style.display = 'block';
    scoreText.textContent = score;
    totalText.textContent = quizData.length;
    detailedResultsList.innerHTML = '';
    sessionResults.forEach((result, index) => {
        const resultItem = document.createElement('div');
        resultItem.classList.add('result-item', result.isCorrect ? 'correct' : 'wrong');
        let resultHTML = `<p><strong>問題 ${index + 1}:</strong> ${result.question}</p><p>あなたの回答: ${result.userAnswer}</p>`;
        if (!result.isCorrect) resultHTML += `<p>正解: ${result.correctAnswer}</p>`;
        resultItem.innerHTML = resultHTML;
        detailedResultsList.appendChild(resultItem);
    });
}

// イベント委譲は resultContainer 内のボタンにのみ適用
resultContainer.addEventListener('click', (event) => {
    const targetId = event.target.id;
    const summaryText = generateResultsSummaryText();

    if (targetId === 'share-btn') {
        if (navigator.share) {
            navigator.share({ title: 'クイズの結果', text: summaryText, }).catch(error => console.log('Share failed:', error));
        } else {
            alert('お使いのブラウザは共有機能に対応していません。');
        }
    }
    if (targetId === 'copy-btn') {
        navigator.clipboard.writeText(summaryText).then(() => { copyFeedback.textContent = 'コピーしました！'; }).catch(err => { copyFeedback.textContent = 'コピーに失敗しました'; });
    }
    if (event.target.closest('#email-btn')) { // メールはaタグなので closest で判定
        const mailBody = encodeURIComponent(summaryText);
        event.target.href = `mailto:?subject=クイズの結果&body=${mailBody}`;
    }
    if (targetId === 'retry-btn') {
        startQuiz();
    }
});

// --- アプリケーションを開始 ---
initializeApp();