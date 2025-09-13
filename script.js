// script.js

const APP_VERSION = "v1.11"; // バージョンアップ！

// --- HTML要素を取得 (変更なし) ---
const appVersionSpan = document.getElementById('app-version');
const htmlVersionSpan = document.getElementById('html-version');
const cssVersionSpan = document.getElementById('css-version');
const csvVersionSpan = document.getElementById('csv-version');
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

// --- グローバル変数 (変更なし) ---
let quizData = [];
let currentQuestionIndex = 0;
let score = 0;
let sessionResults = [];

// --- ファイル読み込み、初期化 (変更なし) ---
async function displayFileVersions() {
    appVersionSpan.textContent = `App: ${APP_VERSION}`;
    try {
        const headers = { method: 'HEAD', cache: 'no-cache' };
        const htmlResponse = await fetch('index.html', headers);
        const cssResponse = await fetch('style.css', headers);
        const csvResponse = await fetch('quiz.csv', headers);
        htmlVersionSpan.textContent = `HTML: ${new Date(htmlResponse.headers.get('Last-Modified')).toLocaleString('ja-JP')}`;
        cssVersionSpan.textContent = `CSS: ${new Date(cssResponse.headers.get('Last-Modified')).toLocaleString('ja-JP')}`;
        csvVersionSpan.textContent = `CSV: ${new Date(csvResponse.headers.get('Last-Modified')).toLocaleString('ja-JP')}`;
    } catch (error) {
        console.error("ファイルバージョンの取得に失敗:", error);
    }
}
async function loadQuizData() {
    try {
        const response = await fetch('quiz.csv', { cache: 'no-cache' });
        if (!response.ok) throw new Error('Network response was not ok.');
        const csvText = await response.text();
        const lines = csvText.trim().split('\n');
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
async function initializeApp() {
    await displayFileVersions();
    hintBtn.addEventListener('click', showHint);
    nextBtn.addEventListener('click', handleNextButtonClick);
    quizData = await loadQuizData();
    if (quizData.length > 0) startQuiz();
}

// --- ゲームロジック (一部変更) ---

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
        // ▼▼▼ 変更点: クリック時にボタン要素自身も渡すように変更 ▼▼▼
        button.addEventListener('click', (event) => selectAnswer(option, event.target));
        optionsContainer.appendChild(button);
    });
}

function showHint() {
    const currentQuestion = quizData[currentQuestionIndex];
    hintText.textContent = `ヒント: ${currentQuestion.hint}`;
    hintText.style.display = 'block';
    hintBtn.disabled = true;
}

// ▼▼▼ ここが今回の修正の最重要ポイント ▼▼▼
function selectAnswer(selectedOption, selectedButton) {
    // 1. まず、すべてのボタンを操作不能にし、ヒントボタンを隠す
    const optionButtons = document.querySelectorAll('.option-btn');
    optionButtons.forEach(btn => btn.disabled = true);
    hintBtn.style.display = 'none';

    // 2. 自分が選んだボタンを即座に黄色で縁取る
    selectedButton.classList.add('selected');

    // 3. 少し間を置いてから、正解・不正解の全体表示を行う (演出のため)
    setTimeout(() => {
        const currentQuestion = quizData[currentQuestionIndex];
        const correctAnswer = currentQuestion.answer;
        const isCorrect = selectedOption === correctAnswer;

        // 全てのボタンをチェックし、正解・不正解の色をつける
        optionButtons.forEach(button => {
            if (button.textContent === correctAnswer) {
                button.classList.add('correct');
            } else {
                button.classList.add('wrong');
            }
        });

        // フィードバックとスコアの更新
        if (isCorrect) {
            feedbackText.textContent = "✅ 正解！";
            feedbackText.style.color = 'green';
            score++;
        } else {
            feedbackText.textContent = "❌ 不正解...";
            feedbackText.style.color = 'red';
        }
        
        // 結果を記録
        sessionResults.push({
            question: currentQuestion.question,
            userAnswer: selectedOption,
            correctAnswer: correctAnswer,
            isCorrect: isCorrect
        });

        // 解説と「次の問題へ」ボタンを表示
        explanationText.textContent = currentQuestion.explanation;
        explanationText.style.display = 'block';
        nextBtn.style.display = 'block';

    }, 700); // 0.7秒後に結果を表示
}
// ▲▲▲ ここまでが修正の重要ポイント ▲▲▲


function handleNextButtonClick() {
    currentQuestionIndex++;
    if (currentQuestionIndex < quizData.length) {
        showQuestion();
    } else {
        showResult();
    }
}

// --- (以降の関数に変更はありません) ---
function generateResultsSummaryText() { let summary = `クイズの結果: ${score} / ${quizData.length} 正解！\n\n`; sessionResults.forEach((result, index) => { const icon = result.isCorrect ? '✅' : '❌'; summary += `${icon} 問題 ${index + 1}: ${result.question}\n  あなたの回答: ${result.userAnswer}\n`; if (!result.isCorrect) summary += `  正解: ${result.correctAnswer}\n`; summary += '\n'; }); return summary; }
function showResult() { quizContainer.style.display = 'none'; resultContainer.style.display = 'block'; scoreText.textContent = score; totalText.textContent = quizData.length; detailedResultsList.innerHTML = ''; sessionResults.forEach((result, index) => { const resultItem = document.createElement('div'); resultItem.classList.add('result-item', result.isCorrect ? 'correct' : 'wrong'); let resultHTML = `<p><strong>問題 ${index + 1}:</strong> ${result.question}</p><p>あなたの回答: ${result.userAnswer}</p>`; if (!result.isCorrect) resultHTML += `<p>正解: ${result.correctAnswer}</p>`; resultItem.innerHTML = resultHTML; detailedResultsList.appendChild(resultItem); }); }
resultContainer.addEventListener('click', (event) => { const target = event.target; const summaryText = generateResultsSummaryText(); if (target.id === 'share-btn') { if (navigator.share) { navigator.share({ title: 'クイズの結果', text: summaryText }).catch(error => console.log('Share failed:', error)); } else { alert('お使いのブラウザは共有機能に対応していません。'); } } else if (target.id === 'copy-btn') { navigator.clipboard.writeText(summaryText).then(() => { copyFeedback.textContent = 'コピーしました！'; }).catch(err => { copyFeedback.textContent = 'コピーに失敗しました'; }); } else if (target.closest('#email-btn')) { const mailBody = encodeURIComponent(summaryText); target.href = `mailto:?subject=クイズの結果&body=${mailBody}`; } else if (target.id === 'retry-btn') { startQuiz(); } });

initializeApp();