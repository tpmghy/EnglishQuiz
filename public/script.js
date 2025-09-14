// script.js

const APP_VERSION = "v3.2 (Final Stable)";

// 変数宣言
let appVersionSpan, htmlVersionSpan, cssVersionSpan, csvVersionSpan,
    selectionContainer, quizContainer, resultContainer,
    questionText, optionsContainer, feedbackText, explanationText,
    scoreText, totalText, detailedResultsList, copyFeedback,
    hintText, hintBtn, nextBtn, reviewBtn, currentTopicName,
    progressText, progressFill, resumeContainer, resumeMessage, newQuizContainer;

// グローバル変数
let allQuestions = [];
let quizData = [];
let currentTopic = '';
let currentQuestionIndex = 0;
let score = 0;
let sessionResults = [];
let hintWasViewedForCurrentQuestion = false;

// DOMが完全に読み込まれてから、すべての処理を開始する
window.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing app...');
    
    // HTML要素の取得
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
    resumeContainer = document.getElementById('resume-container');
    resumeMessage = document.getElementById('resume-message');
    newQuizContainer = document.getElementById('new-quiz-container');

    // 要素の存在確認
    if (!selectionContainer) {
        console.error('selectionContainer not found');
        return;
    }
    if (!quizContainer) {
        console.error('quizContainer not found');
        return;
    }
    if (!resultContainer) {
        console.error('resultContainer not found');
        return;
    }

    console.log('All elements found, starting initialization...');
    initializeApp();
});

async function initializeApp() {
    console.log('Initializing app...');
    await displayFileVersions();
    allQuestions = await loadAllQuizData();
    console.log('Loaded questions:', allQuestions.length);
    
    if (allQuestions.length > 0) {
        console.log('Setting up event listeners...');
        
        // イベントリスナーの設定
        if (selectionContainer) {
            selectionContainer.addEventListener('click', handleSelectionScreenClick);
            console.log('Selection container event listener added');
        }
        
        if (hintBtn) {
            hintBtn.addEventListener('click', showHint);
            console.log('Hint button event listener added');
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', handleNextButtonClick);
            console.log('Next button event listener added');
        }
        
        if (resultContainer) {
            resultContainer.addEventListener('click', handleResultScreenClick);
            console.log('Result container event listener added');
        }
        
        showSelectionScreen();
        console.log('App initialization complete');
    } else {
        console.error('No questions loaded, app cannot start');
    }
}

async function displayFileVersions(fileName) {
    if (appVersionSpan) {
        appVersionSpan.textContent = `App: ${APP_VERSION}`;
    }
    
    try {
        const headers = { method: 'HEAD', cache: 'no-cache' };
        const htmlResponse = await fetch('index.html', headers);
        const cssResponse = await fetch('style.css', headers);
        const csvPath = fileName || 'quiz.csv';
        const csvResponse = await fetch(csvPath, headers);
        
        if (htmlVersionSpan) {
            htmlVersionSpan.textContent = `HTML: ${new Date(htmlResponse.headers.get('Last-Modified')).toLocaleString('ja-JP')}`;
        }
        if (cssVersionSpan) {
            cssVersionSpan.textContent = `CSS: ${new Date(cssResponse.headers.get('Last-Modified')).toLocaleString('ja-JP')}`;
        }
        if (csvVersionSpan) {
            csvVersionSpan.textContent = `CSV: ${new Date(csvResponse.headers.get('Last-Modified')).toLocaleString('ja-JP')}`;
        }
    } catch (error) { 
        console.error("ファイルバージョンの取得に失敗:", error); 
    }
}

function parseCSV(text) {
    const data = [];
    const lines = text.trim().split('\n').filter(line => line.trim() !== '' && !line.trim().startsWith('#'));
    
    if (lines.length < 2) { 
        console.error("CSVファイルが空か、ヘッダーしかありません。"); 
        return []; 
    }
    
    const headers = lines.shift().split(',').map(h => h.trim().toLowerCase());
    
    lines.forEach((line, index) => {
        const values = line.split(',');
        if (values.length !== headers.length) { 
            console.warn(`CSVの ${index + 2} 行目は列の数が合わないためスキップしました:`, line); 
            return; 
        }
        
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
    console.log('クイズデータの読み込みを開始...');
    try {
        const response = await fetch('quiz.csv', { cache: 'no-cache' });
        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);
        
        if (!response.ok) {
            throw new Error(`ファイルの読み込みに失敗: ${response.status} ${response.statusText}`);
        }
        
        const csvText = await response.text();
        console.log('CSVテキストの長さ:', csvText.length);
        console.log('CSVテキストの最初の100文字:', csvText.substring(0, 100));
        
        const parsedData = parseCSV(csvText);
        console.log('解析されたデータの数:', parsedData.length);
        
        if (parsedData.length === 0) {
            throw new Error("CSVの解析後、有効なデータが0件でした。ファイルの内容を確認してください。");
        }
        
        console.log('クイズデータの読み込み完了:', parsedData.length, '件');
        return parsedData;
    } catch (error) {
        console.error('クイズデータの読み込みエラー:', error);
        if (selectionContainer) {
            selectionContainer.innerHTML = `
                <h1>クイズデータの読み込みに失敗しました</h1>
                <p style="color:red;">エラー: ${error.message}</p>
                <p>以下を確認してください：</p>
                <ul>
                    <li>quiz.csvファイルがpublicフォルダに存在するか</li>
                    <li>ファイルの形式が正しいか</li>
                    <li>ネットワーク接続が正常か</li>
                </ul>
                <button onclick="location.reload()" style="margin-top: 10px; padding: 10px;">再読み込み</button>
            `;
        }
        return [];
    }
}

function showSelectionScreen() {
    console.log('Showing selection screen...');
    const progress = loadProgress();
    if (progress && newQuizContainer) {
        newQuizContainer.style.display = 'none';
        resumeContainer.style.display = 'block';
        const topicName = progress.topic === 'iamyouare' ? 'I am / You are' : 'He is / She is';
        resumeMessage.textContent = `「${topicName}」の続きがあります (${progress.currentQuestionIndex + 1}問目から)。`;
    } else if (newQuizContainer) {
        newQuizContainer.style.display = 'block';
        resumeContainer.style.display = 'none';
    }
    quizContainer.style.display = 'none';
    resultContainer.style.display = 'none';
    selectionContainer.style.display = 'block';
}

function startQuizForTopic(topic) {
    console.log('Starting quiz for topic:', topic);
    currentTopic = topic;
    quizData = allQuestions.filter(question => question.topic === topic);
    console.log('Filtered questions for topic:', quizData.length);
    
    if (quizData.length > 0) {
        setTopicName(topic);
        selectionContainer.style.display = 'none';
        startQuiz();
    } else {
        alert("この単元の問題が見つかりませんでした。");
    }
}

function startQuiz() {
    console.log('Starting quiz...');
    currentQuestionIndex = 0;
    score = 0;
    sessionResults = [];
    quizContainer.style.display = 'block';
    resultContainer.style.display = 'none';
    if (copyFeedback) {
        copyFeedback.textContent = '';
    }
    showQuestion();
}

function startReviewQuiz(reviewQuestions) {
    console.log('Starting review quiz...');
    quizData = reviewQuestions;
    currentTopic = 'review';
    setTopicName(currentTopic);
    startQuiz();
}

function showQuestion() {
    console.log('Showing question:', currentQuestionIndex + 1);
    
    if (feedbackText) feedbackText.textContent = '';
    if (explanationText) explanationText.style.display = 'none';
    if (nextBtn) nextBtn.style.display = 'none';
    if (optionsContainer) optionsContainer.innerHTML = '';
    if (hintText) hintText.style.display = 'none';
    if (hintBtn) {
        hintBtn.style.display = 'block';
        hintBtn.disabled = false;
    }
    hintWasViewedForCurrentQuestion = false;
    
    const currentQuestion = quizData[currentQuestionIndex];
    if (questionText) {
        questionText.textContent = currentQuestion.question;
    }
    updateProgress();
    
    currentQuestion.options.forEach(option => {
        const button = document.createElement('button');
        button.textContent = option;
        button.classList.add('option-btn');
        button.addEventListener('click', (event) => selectAnswer(option, event.target));
        if (optionsContainer) {
            optionsContainer.appendChild(button);
        }
    });
}

function showHint() {
    console.log('Showing hint...');
    const currentQuestion = quizData[currentQuestionIndex];
    if (hintText) {
        hintText.innerHTML = addTranslationToText(currentQuestion.hint, currentQuestion.question);
        hintText.style.display = 'block';
    }
    if (hintBtn) {
        hintBtn.disabled = true;
    }
    hintWasViewedForCurrentQuestion = true;
}

function selectAnswer(selectedOption, selectedButton) {
    console.log('Answer selected:', selectedOption);
    
    const optionButtons = document.querySelectorAll('.option-btn');
    optionButtons.forEach(btn => btn.disabled = true);
    if (hintBtn) hintBtn.style.display = 'none';
    selectedButton.classList.add('selected');
    
    setTimeout(() => {
        const currentQuestion = quizData[currentQuestionIndex];
        const correctAnswer = currentQuestion.answer;
        const isCorrect = selectedOption === correctAnswer;
        
        optionButtons.forEach(button => {
            if (button.textContent === correctAnswer) {
                button.classList.add('correct');
            } else {
                button.classList.add('wrong');
            }
        });
        
        if (feedbackText) {
            feedbackText.textContent = isCorrect ? "✅ 正解！" : "❌ 不正解...";
            feedbackText.style.color = isCorrect ? 'green' : 'red';
        }
        
        if (isCorrect) score++;
        
        sessionResults.push({
            question: currentQuestion.question,
            userAnswer: selectedOption,
            correctAnswer: correctAnswer,
            isCorrect: isCorrect,
            hintViewed: hintWasViewedForCurrentQuestion
        });
        
        saveProgress();
        if (explanationText) {
            explanationText.innerHTML = addTranslationToText(currentQuestion.explanation, currentQuestion.question);
            explanationText.style.display = 'block';
        }
        if (nextBtn) {
            nextBtn.style.display = 'block';
        }
    }, 700);
}

function handleNextButtonClick() {
    console.log('Next button clicked');
    currentQuestionIndex++;
    if (currentQuestionIndex < quizData.length) {
        showQuestion();
    } else {
        showResult();
    }
}

async function submitResultsToServer(results) {
    const dataToSend = {
        answers: results.map(r => ({
            question: r.question,
            userAnswer: r.userAnswer
        }))
    };
    
    try {
        const serverUrl = 'https://english-quiz-app-i6m2.onrender.com/submit';
        const response = await fetch(serverUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dataToSend)
        });
        const result = await response.json();
        console.log('サーバーからの応答:', result.message);
    } catch (error) {
        console.error('結果の送信に失敗しました:', error);
    }
}

function showResult() {
    console.log('Showing result...');
    if (quizContainer) quizContainer.style.display = 'none';
    if (resultContainer) resultContainer.style.display = 'block';
    if (scoreText) scoreText.textContent = score;
    if (totalText) totalText.textContent = quizData.length;
    if (detailedResultsList) detailedResultsList.innerHTML = '';
    
    sessionResults.forEach((result, index) => {
        const resultItem = document.createElement('div');
        resultItem.classList.add('result-item', result.isCorrect ? 'correct' : 'wrong');
        
        let resultHTML = `<p><strong>問題 ${index + 1}:</strong> ${result.question}</p><p>あなたの回答: ${result.userAnswer}</p>`;
        if (!result.isCorrect) {
            resultHTML += `<p>正解: ${result.correctAnswer}</p>`;
        }
        if (result.hintViewed) {
            resultHTML += `<p class="hint-indicator">💡 ヒントを見ました</p>`;
        }
        
        resultItem.innerHTML = resultHTML;
        if (detailedResultsList) {
            detailedResultsList.appendChild(resultItem);
        }
    });
    
    const reviewQuestions = sessionResults
        .filter(result => !result.isCorrect || result.hintViewed)
        .map(result => allQuestions.find(q => q.question === result.question));
    const uniqueReviewQuestions = [...new Set(reviewQuestions)];
    
    if (reviewBtn) {
        if (uniqueReviewQuestions.length > 0) {
            reviewBtn.style.display = 'inline-block';
        } else {
            reviewBtn.style.display = 'none';
        }
    }
    
    submitResultsToServer(sessionResults);
    clearProgress();
}

function handleSelectionScreenClick(event) {
    console.log('Selection screen clicked:', event.target);
    const target = event.target;
    if (target.classList.contains('selection-btn')) {
        const topic = target.dataset.topic;
        console.log('Topic selected:', topic);
        startQuizForTopic(topic);
    } else if (target.id === 'resume-btn') {
        const progress = loadProgress();
        if (progress) {
            currentTopic = progress.topic;
            quizData = allQuestions.filter(question => question.topic === currentTopic);
            currentQuestionIndex = progress.currentQuestionIndex;
            score = progress.score;
            sessionResults = progress.sessionResults;
            selectionContainer.style.display = 'none';
            quizContainer.style.display = 'block';
            setTopicName(currentTopic);
            showQuestion();
        }
    } else if (target.id === 'clear-progress-btn') {
        clearProgress();
        showSelectionScreen();
    }
}

function handleResultScreenClick(event) {
    console.log('Result screen clicked:', event.target);
    const target = event.target;
    if (target.id === 'retry-btn') {
        clearProgress();
        showSelectionScreen();
    } else if (target.id === 'review-btn') {
        const reviewQuestions = sessionResults
            .filter(result => !result.isCorrect || result.hintViewed)
            .map(result => allQuestions.find(q => q.question === result.question));
        const uniqueReviewQuestions = [...new Set(reviewQuestions)];
        startReviewQuiz(uniqueReviewQuestions);
    } else if (target.id === 'share-btn' || target.id === 'copy-btn' || target.closest('#email-btn')) {
        const summaryText = generateResultsSummaryText();
        if (target.id === 'share-btn') {
            if (navigator.share) {
                navigator.share({
                    title: 'クイズの結果',
                    text: summaryText
                }).catch(error => console.log('Share failed:', error));
            } else {
                alert('お使いのブラウザは共有機能に対応していません。');
            }
        } else if (target.id === 'copy-btn') {
            navigator.clipboard.writeText(summaryText).then(() => {
                if (copyFeedback) copyFeedback.textContent = 'コピーしました！';
            }).catch(err => {
                if (copyFeedback) copyFeedback.textContent = 'コピーに失敗しました';
            });
        } else if (target.closest('#email-btn')) {
            const mailBody = encodeURIComponent(summaryText);
            target.href = `mailto:?subject=クイズの結果&body=${mailBody}`;
        }
    }
}

function saveProgress() {
    const progress = {
        topic: currentTopic,
        currentQuestionIndex: currentQuestionIndex,
        score: score,
        sessionResults: sessionResults
    };
    localStorage.setItem('quizProgress', JSON.stringify(progress));
}

function loadProgress() {
    const savedProgress = localStorage.getItem('quizProgress');
    if (savedProgress) {
        return JSON.parse(savedProgress);
    }
    return null;
}

function clearProgress() {
    localStorage.removeItem('quizProgress');
}

function setTopicName(topic) {
    const topicNames = {
        'iamyouare': 'I am / You are',
        'heshe': 'He is / She is',
        'review': '復習'
    };
    if (currentTopicName) {
        currentTopicName.textContent = topicNames[topic] || topic;
    }
}

function updateProgress() {
    if (progressText && progressFill && quizData.length > 0) {
        const currentNum = currentQuestionIndex + 1;
        const totalNum = quizData.length;
        const progressPercentage = (currentNum / totalNum) * 100;
        progressText.textContent = `問題 ${currentNum} / ${totalNum}`;
        progressFill.style.width = `${progressPercentage}%`;
    }
}

function addTranslationToText(text, question) {
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
    
    const englishMatches = question.match(/「([^」]+)」/g);
    if (englishMatches) {
        let result = text;
        englishMatches.forEach(match => {
            const english = match.replace(/「|」/g, '');
            const translation = translations[english] || '';
            if (translation) {
                result += `<br><br>📝 <strong>${english}</strong><br>→ ${translation}`;
            }
        });
        return result;
    }
    return text;
}

function generateResultsSummaryText() {
    let summary = `クイズの結果: ${score} / ${quizData.length} 正解！\n\n`;
    sessionResults.forEach((result, index) => {
        const icon = result.isCorrect ? '✅' : '❌';
        summary += `${icon} 問題 ${index + 1}: ${result.question}\n  あなたの回答: ${result.userAnswer}\n`;
        if (!result.isCorrect) {
            summary += `  正解: ${result.correctAnswer}\n`;
        }
        if (result.hintViewed) {
            summary += `  (ヒントを見ました)\n`;
        }
        summary += '\n';
    });
    return summary;
}