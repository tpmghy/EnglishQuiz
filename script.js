// script.js

const APP_VERSION = "v1.5"; // バージョンアップ！

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
// retryBtn はイベント委譲で処理するため、個別の取得は不要になりました
const detailedResultsList = document.getElementById('detailed-results-list');
const copyFeedback = document.getElementById('copy-feedback');

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

    // ▼▼▼ 変更点: メールリンクのhrefだけをここで動的に設定 ▼▼▼
    const summaryText = generateResultsSummaryText();
    const mailBody = encodeURIComponent(summaryText);
    const emailLink = document.getElementById('email-btn');
    emailLink.href = `mailto:?subject=クイズの結果&body=${mailBody}`;
}


// ▼▼▼ ここからが今回の修正の最重要ポイント ▼▼▼
// --- イベント委譲を使って、親要素でクリックを待ち受ける ---

resultContainer.addEventListener('click', (event) => {
    const targetId = event.target.id;
    const summaryText = generateResultsSummaryText();

    // 共有ボタンが押された場合
    if (targetId === 'share-btn') {
        if (navigator.share) {
            navigator.share({
                title: 'クイズの結果',
                text: summaryText,
            }).catch(error => console.log('Share failed:', error));
        } else {
            alert('お使いのブラウザは共有機能に対応していません。');
        }
    }

    // コピーボタンが押された場合
    if (targetId === 'copy-btn') {
        navigator.clipboard.writeText(summaryText).then(() => {
            copyFeedback.textContent = 'コピーしました！';
        }).catch(err => {
            copyFeedback.textContent = 'コピーに失敗しました';
            console.error('Copy failed:', err);
        });
    }

    // もう一度挑戦ボタンが押された場合
    if (targetId === 'retry-btn') {
        startQuiz();
    }
});
// ▲▲▲ ここまでが修正の最重要ポイント ▲▲▲

// --- アプリケーションを開始 ---
initializeApp();