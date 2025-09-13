// script.js

const APP_VERSION = "v1.7"; // バージョンアップ！

// --- HTML要素を取得 ---
const versionInfo = document.getElementById('version-info');
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
        // ヘッダー行を小文字にして空白を除去し、より堅牢にする
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const data = [];
        for (let i = 1; i < lines.length; i++) {
            // 空行をスキップ
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
    const hintBtn = document.getElementById('hint-btn'); // ボタンの状態を直接操作するため都度取得
    feedbackText.textContent = '';
    explanationText.style.display = 'none';
    document.getElementById('next-btn').style.display = 'none';
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
        // イベント委譲を使うので、ここではイベントリスナーを追加しない
        optionsContainer.appendChild(button);
    });
}

function showHint() {
    const currentQuestion = quizData[currentQuestionIndex];
    hintText.textContent = `ヒント: ${currentQuestion.hint}`;
    hintText.style.display = 'block';
    document.getElementById('hint-btn').disabled = true; // ヒントは1問につき1回だけ
}

function selectAnswer(selectedOption) {
    const currentQuestion = quizData[currentQuestionIndex];
    const optionButtons = document.querySelectorAll('.option-btn');
    optionButtons.forEach(btn => btn.disabled = true);
    
    document.getElementById('hint-btn').style.display = 'none';

    const isCorrect = selectedOption === currentQuestion.answer;
    feedbackText.textContent = isCorrect ? "✅ 正解！" : "❌ 不正解...";
    feedbackText.style.color = isCorrect ? 'green' : 'red';
    if (isCorrect) score++;
    
    sessionResults.push({ question: currentQuestion.question, userAnswer: selectedOption, correctAnswer: currentQuestion.answer, isCorrect: isCorrect });
    
    explanationText.textContent = currentQuestion.explanation;
    explanationText.style.display = 'block';
    document.getElementById('next-btn').style.display = 'block';
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

// --- イベント委譲 (Event Delegation) ---

// クイズ中の操作（ヒント、回答、次の問題へ）
quizContainer.addEventListener('click', (event) => {
    // 選択肢ボタンがクリックされたかチェック
    if (event.target.classList.contains('option-btn')) {
        selectAnswer(event.target.textContent);
        return; // 他の処理をしないように
    }
    // クリックされた要素のIDで処理を分岐
    switch (event.target.id) {
        case 'hint-btn':
            showHint();
            break;
        case 'next-btn':
            currentQuestionIndex++;
            if (currentQuestionIndex < quizData.length) {
                showQuestion();
            } else {
                showResult();
            }
            break;
    }
});

// 結果画面での操作（共有、コピー、メール、もう一度）
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