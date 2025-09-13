// script.js

const APP_VERSION = "v2.0 (Stable)"; // 安定版

// --- HTML要素を取得 ---
const appVersionSpan = document.getElementById('app-version');
const htmlVersionSpan = document.getElementById('html-version');
const cssVersionSpan = document.getElementById('css-version');
const csvVersionSpan = document.getElementById('csv-version');
const selectionContainer = document.getElementById('selection-container');
const quizContainer = document.getElementById('quiz-container');
const resultContainer = document.getElementById('result-container');
const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const feedbackText = document.getElementById('feedback-text');
const explanationText = document.getElementById('explanation-text');
const scoreText = document.getElementById('score-text');
const totalText = document.getElementById('total-text');
const detailedResultsList = document.getElementById('detailed-results-list');
const copyFeedback = document.getElementById('copy-feedback');
const hintText = document.getElementById('hint-text');
const hintBtn = document.getElementById('hint-btn');
const nextBtn = document.getElementById('next-btn');

// --- グローバル変数 ---
let allQuestions = [];
let quizData = [];
let currentQuestionIndex = 0;
let score = 0;
let sessionResults = [];

// --- ファイルの最終更新日時を取得して表示 ---
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
    } catch (error) { console.error("ファイルバージョンの取得に失敗:", error); }
}

// --- CSVファイルを安全に解析 ---
function parseCSV(text) {
    const data = [];
    const lines = text.trim().split('\n').filter(line => line.trim() !== '' && !line.trim().startsWith('#'));
    if (lines.length < 2) { console.error("CSVファイルが空か、ヘッダーしかありません。"); return []; }
    const headers = lines.shift().split(',').map(h => h.trim().toLowerCase());
    lines.forEach((line, index) => {
        const values = line.split(',');
        if (values.length !== headers.length) { console.warn(`CSVの ${index + 2} 行目は列の数が合わないためスキップしました:`, line); return; }
        const entry = {};
        entry.topic = values[0].trim().replace(/^"|"$/g, '');
        entry.question = values[1].trim().replace(/^"|"$/g, '');
        entry.options = values[2].trim().replace(/^"|"$/g, '').split('|');
        entry.answer = values[3].trim().replace(/^"|"$/g, '');
        entry.explanation = values[4].trim().replace(/^"|"$/g, '');
        entry.hint = values[5] ? values[5].trim().replace(/^"|"$/g, '') : "この問題のヒントはありません。";
        data.push(entry);
    });
    return data;
}
async function loadAllQuizData() {
    try {
        const response = await fetch('quiz.csv', { cache: 'no-cache' });
        if (!response.ok) throw new Error(`Network response was not ok: ${response.statusText}`);
        const csvText = await response.text();
        const parsedData = parseCSV(csvText);
        if (parsedData.length === 0) throw new Error("CSVの解析後、有効なデータが0件でした。ファイルの内容を確認してください。");
        return parsedData;
    } catch (error) {
        console.error('Failed to load quiz data:', error);
        selectionContainer.innerHTML = `<h1>クイズデータの読み込みに失敗しました。</h1><p style="color:red;">エラー: ${error.message}</p>`;
        return [];
    }
}

// --- アプリケーションの初期化と画面遷移 ---
async function initializeApp() {
    await displayFileVersions();
    allQuestions = await loadAllQuizData();
    if (allQuestions.length > 0) {
        selectionContainer.addEventListener('click', handleTopicSelection);
        hintBtn.addEventListener('click', showHint);
        nextBtn.addEventListener('click', handleNextButtonClick);
        resultContainer.addEventListener('click', handleResultScreenClick);
        showSelectionScreen();
    }
}
function showSelectionScreen() { quizContainer.style.display = 'none'; resultContainer.style.display = 'none'; selectionContainer.style.display = 'block'; }
function startQuizForTopic(topic) {
    quizData = allQuestions.filter(question => question.topic === topic);
    if (quizData.length > 0) { selectionContainer.style.display = 'none'; startQuiz(); } 
    else { alert("この単元の問題が見つかりませんでした。"); }
}

// --- ゲームロジック ---
function startQuiz() { currentQuestionIndex = 0; score = 0; sessionResults = []; quizContainer.style.display = 'block'; resultContainer.style.display = 'none'; copyFeedback.textContent = ''; showQuestion(); }
function showQuestion() { feedbackText.textContent = ''; explanationText.style.display = 'none'; nextBtn.style.display = 'none'; optionsContainer.innerHTML = ''; hintText.style.display = 'none'; hintBtn.style.display = 'block'; hintBtn.disabled = false; const currentQuestion = quizData[currentQuestionIndex]; questionText.textContent = currentQuestion.question; currentQuestion.options.forEach(option => { const button = document.createElement('button'); button.textContent = option; button.classList.add('option-btn'); button.addEventListener('click', (event) => selectAnswer(option, event.target)); optionsContainer.appendChild(button); }); }
function showHint() { const currentQuestion = quizData[currentQuestionIndex]; hintText.textContent = `ヒント: ${currentQuestion.hint}`; hintText.style.display = 'block'; hintBtn.disabled = true; }
function selectAnswer(selectedOption, selectedButton) { const optionButtons = document.querySelectorAll('.option-btn'); optionButtons.forEach(btn => btn.disabled = true); hintBtn.style.display = 'none'; selectedButton.classList.add('selected'); setTimeout(() => { const currentQuestion = quizData[currentQuestionIndex]; const correctAnswer = currentQuestion.answer; const isCorrect = selectedOption === correctAnswer; optionButtons.forEach(button => { if (button.textContent === correctAnswer) button.classList.add('correct'); else button.classList.add('wrong'); }); feedbackText.textContent = isCorrect ? "✅ 正解！" : "❌ 不正解..."; feedbackText.style.color = isCorrect ? 'green' : 'red'; if (isCorrect) score++; sessionResults.push({ question: currentQuestion.question, userAnswer: selectedOption, correctAnswer: correctAnswer, isCorrect: isCorrect }); explanationText.textContent = currentQuestion.explanation; explanationText.style.display = 'block'; nextBtn.style.display = 'block'; }, 700); }
function handleNextButtonClick() { currentQuestionIndex++; if (currentQuestionIndex < quizData.length) { showQuestion(); } else { showResult(); } }
function generateResultsSummaryText() { let summary = `クイズの結果: ${score} / ${quizData.length} 正解！\n\n`; sessionResults.forEach((result, index) => { const icon = result.isCorrect ? '✅' : '❌'; summary += `${icon} 問題 ${index + 1}: ${result.question}\n  あなたの回答: ${result.userAnswer}\n`; if (!result.isCorrect) summary += `  正解: ${result.correctAnswer}\n`; summary += '\n'; }); return summary; }
function showResult() { quizContainer.style.display = 'none'; resultContainer.style.display = 'block'; scoreText.textContent = score; totalText.textContent = quizData.length; detailedResultsList.innerHTML = ''; sessionResults.forEach((result, index) => { const resultItem = document.createElement('div'); resultItem.classList.add('result-item', result.isCorrect ? 'correct' : 'wrong'); let resultHTML = `<p><strong>問題 ${index + 1}:</strong> ${result.question}</p><p>あなたの回答: ${result.userAnswer}</p>`; if (!result.isCorrect) resultHTML += `<p>正解: ${result.correctAnswer}</p>`; resultItem.innerHTML = resultHTML; detailedResultsList.appendChild(resultItem); }); }
function handleTopicSelection(event) { if (event.target.classList.contains('selection-btn')) { const topic = event.target.dataset.topic; startQuizForTopic(topic); } }
function handleResultScreenClick(event) { const target = event.target; if (target.id === 'retry-btn') { showSelectionScreen(); } else if (target.id === 'share-btn' || target.id === 'copy-btn' || target.closest('#email-btn')) { const summaryText = generateResultsSummaryText(); if (target.id === 'share-btn') { if (navigator.share) navigator.share({ title: 'クイズの結果', text: summaryText }).catch(error => console.log('Share failed:', error)); else alert('お使いのブラウザは共有機能に対応していません。'); } else if (target.id === 'copy-btn') { navigator.clipboard.writeText(summaryText).then(() => { copyFeedback.textContent = 'コピーしました！'; }).catch(err => { copyFeedback.textContent = 'コピーに失敗しました'; }); } else if (target.closest('#email-btn')) { const mailBody = encodeURIComponent(summaryText); target.href = `mailto:?subject=クイズの結果&body=${mailBody}`; } } }

// --- アプリケーションを開始 ---
initializeApp();