// script.js

const APP_VERSION = "v2.3 (Final Stable)"; // 最終安定版

// ▼▼▼ 変更点: ここでは変数を宣言するだけにします ▼▼▼
let appVersionSpan, htmlVersionSpan, cssVersionSpan, csvVersionSpan,
    selectionContainer, quizContainer, resultContainer,
    questionText, optionsContainer, feedbackText, explanationText,
    scoreText, totalText, detailedResultsList, copyFeedback,
    hintText, hintBtn, nextBtn, reviewBtn, currentTopicName,
    progressText, progressFill;

// --- グローバル変数 ---
let allQuestions = [];
let quizData = [];
let currentQuestionIndex = 0;
let score = 0;
let sessionResults = [];
let hintWasViewedForCurrentQuestion = false;

// --- ▼▼▼ ここからが今回の修正の最重要ポイント ▼▼▼ ---
// DOMが完全に読み込まれてから、すべての処理を開始する
window.addEventListener('DOMContentLoaded', () => {
    // HTML要素の取得を、この安全な場所で行う
    appVersionSpan = document.getElementById('app-version');
    htmlVersionSpan = document.getElementById('html-version');
    cssVersionSpan = document.getElementById('css-version');
    csvVersionSpan = document.getElementById('csv-version');
    selectionContainer = document.getElementById('selection-container');
    quizContainer = document.getElementById('quiz-container');
    resultContainer = document.getElementById('result-container');
    questionText = document.getElementById('question-text');
    optionsContainer = document.getElementById('options-container');
    feedbackText = document.getElementById('feedback-text');
    explanationText = document.getElementById('explanation-text');
    scoreText = document.getElementById('score-text');
    totalText = document.getElementById('total-text');
    detailedResultsList = document.getElementById('detailed-results-list');
    copyFeedback = document.getElementById('copy-feedback');
    hintText = document.getElementById('hint-text');
    hintBtn = document.getElementById('hint-btn');
    nextBtn = document.getElementById('next-btn');
    reviewBtn = document.getElementById('review-btn');
    currentTopicName = document.getElementById('current-topic-name');
    progressText = document.getElementById('progress-text');
    progressFill = document.getElementById('progress-fill');

    // アプリケーションの初期化を開始
    initializeApp();
});
// --- ▲▲▲ ここまでが修正の最重要ポイント ▲▲▲ ---


// --- アプリケーションの初期化と画面遷移 ---
async function initializeApp() {
    await displayFileVersions();
    allQuestions = await loadAllQuizData();
    if (allQuestions.length > 0) {
        // イベントリスナーの設定
        selectionContainer.addEventListener('click', handleTopicSelection);
        hintBtn.addEventListener('click', showHint);
        nextBtn.addEventListener('click', handleNextButtonClick);
        resultContainer.addEventListener('click', handleResultScreenClick);
        showSelectionScreen();
    }
}

// --- (以降のすべての関数は、以前のバージョンのままで変更ありません) ---
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

function showSelectionScreen() { quizContainer.style.display = 'none'; resultContainer.style.display = 'none'; selectionContainer.style.display = 'block'; }

// 単元名を設定する関数
function setTopicName(topic) {
    const topicNames = {
        'iamyouare': 'I am / You are',
        'heshe': 'He / She'
    };
    if (currentTopicName) {
        currentTopicName.textContent = topicNames[topic] || topic;
    }
}

// 進捗を更新する関数
function updateProgress() {
    if (progressText && progressFill && quizData.length > 0) {
        const currentQuestion = currentQuestionIndex + 1;
        const totalQuestions = quizData.length;
        const progressPercentage = (currentQuestion / totalQuestions) * 100;
        
        progressText.textContent = `問題 ${currentQuestion} / ${totalQuestions}`;
        progressFill.style.width = `${progressPercentage}%`;
    }
}

// 英文を和訳する関数
function translateEnglishToJapanese(english) {
    const translations = {
        "You are happy.": "あなたは幸せです。",
        "Am I a student?": "私は学生ですか？",
        "I am busy.": "私は忙しいです。",
        "Are you tired?": "あなたは疲れていますか？",
        "I'm": "私は〜です",
        "You're": "あなたは〜です",
        "You are not a teacher.": "あなたは教師ではありません。",
        "I am not sleepy.": "私は眠くありません。",
        "Are you hungry?": "あなたはお腹が空いていますか？",
        "I am a tennis player.": "私はテニス選手です。",
        "You are in the classroom.": "あなたは教室にいます。",
        "Am I late?": "私は遅れていますか？",
        "He is busy.": "彼は忙しいです。",
        "Is she tired?": "彼女は疲れていますか？",
        "She is a student.": "彼女は学生です。",
        "He's": "彼は〜です",
        "She isn't": "彼女は〜ではありません",
        "Is he your brother?": "彼はあなたの兄弟ですか？",
        "It is a cat.": "それは猫です。",
        "He is a soccer player.": "彼はサッカー選手です。",
        "That is not my book.": "それは私の本ではありません。",
        "Is she a good singer?": "彼女は歌が上手いですか？"
    };
    return translations[english] || english;
}

// 問題文から英文を抽出して和訳を追加する関数
function addTranslationToText(text, question) {
    // 問題文に含まれる英文を抽出
    const englishMatches = question.match(/「([^」]+)」/g);
    if (englishMatches) {
        let result = text;
        englishMatches.forEach(match => {
            const english = match.replace(/「|」/g, '');
            const translation = translateEnglishToJapanese(english);
            if (translation !== english) {
                result += `\n\n📝 ${english}\n→ ${translation}`;
            }
        });
        return result;
    }
    return text;
}
function startQuizForTopic(topic) { 
    quizData = allQuestions.filter(question => question.topic === topic); 
    if (quizData.length > 0) { 
        // 単元名を設定
        setTopicName(topic);
        selectionContainer.style.display = 'none'; 
        startQuiz(); 
    } else { 
        alert("この単元の問題が見つかりませんでした。"); 
    } 
}
function startQuiz() { 
    currentQuestionIndex = 0; 
    score = 0; 
    sessionResults = []; 
    quizContainer.style.display = 'block'; 
    resultContainer.style.display = 'none'; 
    copyFeedback.textContent = ''; 
    updateProgress(); 
    showQuestion(); 
}
function startReviewQuiz(reviewQuestions) { 
    quizData = reviewQuestions; 
    // 復習クイズの場合は単元名を「復習」に設定
    if (currentTopicName) {
        currentTopicName.textContent = '復習';
    }
    startQuiz(); 
}
function showQuestion() { feedbackText.textContent = ''; explanationText.style.display = 'none'; nextBtn.style.display = 'none'; optionsContainer.innerHTML = ''; hintText.style.display = 'none'; hintBtn.style.display = 'block'; hintBtn.disabled = false; hintWasViewedForCurrentQuestion = false; const currentQuestion = quizData[currentQuestionIndex]; questionText.textContent = currentQuestion.question; currentQuestion.options.forEach(option => { const button = document.createElement('button'); button.textContent = option; button.classList.add('option-btn'); button.addEventListener('click', (event) => selectAnswer(option, event.target)); optionsContainer.appendChild(button); }); }
function showHint() { 
    const currentQuestion = quizData[currentQuestionIndex]; 
    const hintWithTranslation = addTranslationToText(currentQuestion.hint, currentQuestion.question);
    hintText.textContent = `ヒント: ${hintWithTranslation}`; 
    hintText.style.display = 'block'; 
    hintBtn.disabled = true; 
    hintWasViewedForCurrentQuestion = true; 
}
function selectAnswer(selectedOption, selectedButton) { 
    const optionButtons = document.querySelectorAll('.option-btn'); 
    optionButtons.forEach(btn => btn.disabled = true); 
    hintBtn.style.display = 'none'; 
    selectedButton.classList.add('selected'); 
    setTimeout(() => { 
        const currentQuestion = quizData[currentQuestionIndex]; 
        const correctAnswer = currentQuestion.answer; 
        const isCorrect = selectedOption === correctAnswer; 
        optionButtons.forEach(button => { 
            if (button.textContent === correctAnswer) button.classList.add('correct'); 
            else button.classList.add('wrong'); 
        }); 
        feedbackText.textContent = isCorrect ? "✅ 正解！" : "❌ 不正解..."; 
        feedbackText.style.color = isCorrect ? 'green' : 'red'; 
        if (isCorrect) score++; 
        sessionResults.push({ question: currentQuestion.question, userAnswer: selectedOption, correctAnswer: correctAnswer, isCorrect: isCorrect, hintViewed: hintWasViewedForCurrentQuestion }); 
        const explanationWithTranslation = addTranslationToText(currentQuestion.explanation, currentQuestion.question);
        explanationText.textContent = explanationWithTranslation; 
        explanationText.style.display = 'block'; 
        nextBtn.style.display = 'block'; 
    }, 700); 
}
function handleNextButtonClick() { 
    currentQuestionIndex++; 
    if (currentQuestionIndex < quizData.length) { 
        updateProgress(); 
        showQuestion(); 
    } else { 
        showResult(); 
    } 
}
function generateResultsSummaryText() { let summary = `クイズの結果: ${score} / ${quizData.length} 正解！\n\n`; sessionResults.forEach((result, index) => { const icon = result.isCorrect ? '✅' : '❌'; summary += `${icon} 問題 ${index + 1}: ${result.question}\n  あなたの回答: ${result.userAnswer}\n`; if (!result.isCorrect) summary += `  正解: ${result.correctAnswer}\n`; summary += '\n'; }); return summary; }
function showResult() { quizContainer.style.display = 'none'; resultContainer.style.display = 'block'; scoreText.textContent = score; totalText.textContent = quizData.length; detailedResultsList.innerHTML = ''; sessionResults.forEach((result, index) => { const resultItem = document.createElement('div'); resultItem.classList.add('result-item', result.isCorrect ? 'correct' : 'wrong'); let resultHTML = `<p><strong>問題 ${index + 1}:</strong> ${result.question}</p><p>あなたの回答: ${result.userAnswer}</p>`; if (!result.isCorrect) resultHTML += `<p>正解: ${result.correctAnswer}</p>`; if (result.hintViewed) resultHTML += `<p class="hint-indicator">💡 ヒントを見ました</p>`; resultItem.innerHTML = resultHTML; detailedResultsList.appendChild(resultItem); }); const reviewQuestions = sessionResults.filter(result => !result.isCorrect || result.hintViewed).map(result => allQuestions.find(q => q.question === result.question)); const uniqueReviewQuestions = [...new Set(reviewQuestions)]; if (uniqueReviewQuestions.length > 0) { reviewBtn.style.display = 'inline-block'; } else { reviewBtn.style.display = 'none'; } }
function handleTopicSelection(event) { if (event.target.classList.contains('selection-btn')) { const topic = event.target.dataset.topic; startQuizForTopic(topic); } }
function handleResultScreenClick(event) { const target = event.target; if (target.id === 'retry-btn') { showSelectionScreen(); } else if (target.id === 'review-btn') { const reviewQuestions = sessionResults.filter(result => !result.isCorrect || result.hintViewed).map(result => allQuestions.find(q => q.question === result.question)); const uniqueReviewQuestions = [...new Set(reviewQuestions)]; startReviewQuiz(uniqueReviewQuestions); } else if (target.id === 'share-btn' || target.id === 'copy-btn' || target.closest('#email-btn')) { const summaryText = generateResultsSummaryText(); if (target.id === 'share-btn') { if (navigator.share) navigator.share({ title: 'クイズの結果', text: summaryText }).catch(error => console.log('Share failed:', error)); else alert('お使いのブラウザは共有機能に対応していません。'); } else if (target.id === 'copy-btn') { navigator.clipboard.writeText(summaryText).then(() => { copyFeedback.textContent = 'コピーしました！'; }).catch(err => { copyFeedback.textContent = 'コピーに失敗しました'; }); } else if (target.closest('#email-btn')) { const mailBody = encodeURIComponent(summaryText); target.href = `mailto:?subject=クイズの結果&body=${mailBody}`; } } }