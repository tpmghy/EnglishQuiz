// script.js

const APP_VERSION = "v1.10"; // バージョンアップ！

// --- HTML要素を取得 ---
const appVersionSpan = document.getElementById('app-version');
const htmlVersionSpan = document.getElementById('html-version');
const cssVersionSpan = document.getElementById('css-version');   // ▼▼▼ 追加 ▼▼▼
const csvVersionSpan = document.getElementById('csv-version');
// ... (他の要素取得は変更なし) ...
const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const feedbackText = document.getElementById('feedback-text');
const explanationText = document.getElementById('explanation-text');
const quizContainer = document.getElementById('quiz-container');
const resultContainer = document.getElementById('result-container');
const scoreText = document.getElementById('score-text');
const totalText = document.getElementById('total-text');
const detailedResultsList = document.getElementById('detailed-results-list');
const copyFeedback = document.getElementById('copy-feedback');
const hintText = document.getElementById('hint-text');
const hintBtn = document.getElementById('hint-btn');
const nextBtn = document.getElementById('next-btn');

// --- グローバル変数を定義 ---
let quizData = [];
let currentQuestionIndex = 0;
let score = 0;
let sessionResults = [];

// --- ファイルの最終更新日時を取得して表示する関数 ---
async function displayFileVersions() {
    appVersionSpan.textContent = `App: ${APP_VERSION}`;
    try {
        const htmlResponse = await fetch('index.html', { method: 'HEAD' });
        const cssResponse = await fetch('style.css', { method: 'HEAD' }); // ▼▼▼ 追加 ▼▼▼
        const csvResponse = await fetch('quiz.csv', { method: 'HEAD' });

        const htmlLastModified = new Date(htmlResponse.headers.get('Last-Modified')).toLocaleString('ja-JP');
        const cssLastModified = new Date(cssResponse.headers.get('Last-Modified')).toLocaleString('ja-JP'); // ▼▼▼ 追加 ▼▼▼
        const csvLastModified = new Date(csvResponse.headers.get('Last-Modified')).toLocaleString('ja-JP');

        htmlVersionSpan.textContent = `HTML: ${htmlLastModified}`;
        cssVersionSpan.textContent = `CSS: ${cssLastModified}`; // ▼▼▼ 追加 ▼▼▼
        csvVersionSpan.textContent = `CSV: ${csvLastModified}`;
        
    } catch (error) {
        console.error("ファイルバージョンの取得に失敗:", error);
        htmlVersionSpan.textContent = "HTML: 取得失敗";
        cssVersionSpan.textContent = "CSS: 取得失敗"; // ▼▼▼ 追加 ▼▼▼
        csvVersionSpan.textContent = "CSV: 取得失敗";
    }
}

// --- CSVファイルを読み込んで解析する関数 ---
async function loadQuizData() {
    // ... (この関数は変更なし) ...
    try {
        const response = await fetch('quiz.csv');
        if (!response.ok) throw new Error('Network response was not ok.');
        const csvText = await response.text();
        const lines = csvText.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const data = [];
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim() === '') continue;
            const values = lines[i].split(',');
            const entry = {};
            entry.question = values[0].trim().replace(/"/g, '');
            entry.options = values[1].trim().replace(/"/g, '').split('|');
            entry.answer = values[2].trim().replace(/"/g, '');
            entry.explanation = values[3].trim().replace(/"/g, '');
            entry.hint = values[4] ? values[4].trim().replace(/"/g, '') : "この問題のヒントはありません。";
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
    await displayFileVersions(); 
    hintBtn.addEventListener('click', showHint);
    nextBtn.addEventListener('click', handleNextButtonClick);
    quizData = await loadQuizData();
    if (quizData.length > 0) {
        startQuiz();
    }
}

// --- (以降のゲームロジックは変更なし) ---
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
function showHint() {
    const currentQuestion = quizData[currentQuestionIndex];
    hintText.textContent = `ヒント: ${currentQuestion.hint}`;
    hintText.style.display = 'block';
    hintBtn.disabled = true;
}
function selectAnswer(selectedOption) {
    const currentQuestion = quizData[currentQuestionIndex];
    const optionButtons = document.querySelectorAll('.option-btn');
    optionButtons.forEach(btn => btn.disabled = true);
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
function handleNextButtonClick() {
    currentQuestionIndex++;
    if (currentQuestionIndex < quizData.length) {
        showQuestion();
    } else {
        showResult();
    }
}
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
resultContainer.addEventListener('click', (event) => {
    const target = event.target;
    const summaryText = generateResultsSummaryText();
    if (target.id === 'share-btn') {
        if (navigator.share) {
            navigator.share({ title: 'クイズの結果', text: summaryText }).catch(error => console.log('Share failed:', error));
        } else {
            alert('お使いのブラウザは共有機能に対応していません。');
        }
    } else if (target.id === 'copy-btn') {
        navigator.clipboard.writeText(summaryText).then(() => { copyFeedback.textContent = 'コピーしました！'; }).catch(err => { copyFeedback.textContent = 'コピーに失敗しました'; });
    } else if (target.closest('#email-btn')) {
        const mailBody = encodeURIComponent(summaryText);
        target.href = `mailto:?subject=クイズの結果&body=${mailBody}`;
    } else if (target.id === 'retry-btn') {
        startQuiz();
    }
});

// --- アプリケーションを開始 ---
initializeApp();