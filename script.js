// script.js

const APP_VERSION = "v1.3"; // バージョンアップ！

const quizData = [
    { question: "主語が「I」のときのbe動詞は？", options: ["am", "are", "is"], answer: "am", explanation: "主語が「I」のbe動詞は必ず am になります。これは英語の基本ルールです。" },
    { question: "主語が「You」のときのbe動詞は？", options: ["am", "are", "is"], answer: "are", explanation: "主語が「You」のbe動詞は必ず are になります。「I am」と「You are」はセットで覚えましょう。" },
    { question: "「You are happy.」を疑問文にすると？", options: ["Happy you are?", "You are happy?", "Are you happy?"], answer: "Are you happy?", explanation: "be動詞の文を疑問文にするときは、be動詞を主語の前に移動させます。" }
];

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
const retryBtn = document.getElementById('retry-btn');
const detailedResultsList = document.getElementById('detailed-results-list');
// ▼▼▼ ここから追加 ▼▼▼
const shareBtn = document.getElementById('share-btn');
const copyBtn = document.getElementById('copy-btn');
const emailBtn = document.getElementById('email-btn');
const copyFeedback = document.getElementById('copy-feedback');
// ▲▲▲ ここまで追加 ▲▲▲

let currentQuestionIndex = 0;
let score = 0;
let sessionResults = [];

function initializeApp() {
    versionInfo.textContent = APP_VERSION;
    startQuiz();
}

function startQuiz() {
    currentQuestionIndex = 0;
    score = 0;
    sessionResults = [];
    quizContainer.style.display = 'block';
    resultContainer.style.display = 'none';
    copyFeedback.textContent = ''; // フィードバックをリセット
    showQuestion();
}

function showQuestion() {
    // ... (この関数に変更はありません) ...
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
    // ... (この関数に変更はありません) ...
    const currentQuestion = quizData[currentQuestionIndex];
    const optionButtons = document.querySelectorAll('.option-btn');
    optionButtons.forEach(btn => btn.disabled = true);
    const isCorrect = selectedOption === currentQuestion.answer;
    if (isCorrect) {
        feedbackText.textContent = "✅ 正解！";
        feedbackText.style.color = 'green';
        score++;
    } else {
        feedbackText.textContent = "❌ 不正解...";
        feedbackText.style.color = 'red';
    }
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

retryBtn.addEventListener('click', startQuiz);

// ▼▼▼ ここからが大幅な変更・追加箇所 ▼▼▼

// 共有用のテキストを生成するヘルパー関数
function generateResultsSummaryText() {
    let summary = `クイズの結果: ${score} / ${quizData.length} 正解！\n\n`;
    sessionResults.forEach((result, index) => {
        const icon = result.isCorrect ? '✅' : '❌';
        summary += `${icon} 問題 ${index + 1}: ${result.question}\n`;
        summary += `  あなたの回答: ${result.userAnswer}\n`;
        if (!result.isCorrect) {
            summary += `  正解: ${result.correctAnswer}\n`;
        }
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
        if (!result.isCorrect) {
            resultHTML += `<p>正解: ${result.correctAnswer}</p>`;
        }
        resultItem.innerHTML = resultHTML;
        detailedResultsList.appendChild(resultItem);
    });

    // --- 共有ボタンのセットアップ ---
    setupShareButtons();
}

// 共有ボタンのイベントリスナーを設定する関数
function setupShareButtons() {
    const summaryText = generateResultsSummaryText();

    // 1. Web Share API ボタン
    if (navigator.share) {
        shareBtn.style.display = 'inline-block';
        shareBtn.onclick = () => {
            navigator.share({
                title: 'クイズの結果',
                text: summaryText,
            }).catch(error => console.log('共有に失敗しました', error));
        };
    } else {
        // 対応していないブラウザではボタンを隠す
        shareBtn.style.display = 'none';
    }

    // 2. クリップボードにコピーボタン
    copyBtn.onclick = () => {
        navigator.clipboard.writeText(summaryText).then(() => {
            copyFeedback.textContent = 'コピーしました！';
        }).catch(err => {
            copyFeedback.textContent = 'コピーに失敗しました';
            console.error('コピー失敗:', err);
        });
    };

    // 3. メールボタン
    const mailBody = encodeURIComponent(summaryText);
    emailBtn.href = `mailto:?subject=クイズの結果&body=${mailBody}`;
}

// --- アプリケーションを開始 ---
initializeApp();