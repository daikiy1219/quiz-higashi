/**
 * Math Kahoot! - Main Application Controller (Student Gamification + Teacher Features)
 */
class App {
    constructor() {
        this.role = null; // 'host' or 'student'
        this.roomCode = null;
        this.playerName = '';
        this.selectedAvatar = '🦁';
        // ★ Fix: networkManagerのIDと統一（別々に生成していたのが0点バグの原因）
        this.playerId = null; // initNetwork()でnetworkManager.myPlayerIdに統一
        
        this.players = []; // [{ id, name, avatar, score, streak, correctCount, maxStreak, exp, level, title }]
        this.currentQuestionIndex = 0;
        this.totalQuestions = 10;
        this.selectedCategory = 'all';
        this.customCategoryText = '';
        
        this.timeLimit = 20; // seconds per question
        this.timer = null;
        this.timeRemaining = 20;
        this.isTimerPaused = false;
        
        this.currentQuestion = null;
        this.answersReceived = new Map(); // playerId -> { answerIndex, timeRemaining }
        this.hasAnsweredCurrent = false;

        this.achievementsUnlocked = new Set();

        this.initDOM();
        this.initNetwork();
    }

    initDOM() {
        this.screens = {
            home: document.getElementById('screen-home'),
            hostLobby: document.getElementById('screen-host-lobby'),
            hostGame: document.getElementById('screen-host-game'),
            hostLeaderboard: document.getElementById('screen-host-leaderboard'),
            hostPodium: document.getElementById('screen-host-podium'),
            hostFullRanking: document.getElementById('screen-host-full-ranking'),
            studentJoin: document.getElementById('screen-student-join'),
            studentWait: document.getElementById('screen-student-wait'),
            studentGame: document.getElementById('screen-student-game'),
            studentFeedback: document.getElementById('screen-student-feedback')
        };
    }

    showScreen(screenName) {
        Object.keys(this.screens).forEach(key => {
            if (this.screens[key]) {
                this.screens[key].classList.remove('active');
            }
        });
        if (this.screens[screenName]) {
            this.screens[screenName].classList.add('active');
        }
    }

    initNetwork() {
        // ★ Fix: networkManagerのIDをAppのIDとして統一使用
        this.playerId = window.networkManager.myPlayerId;

        window.networkManager.onMessage((data) => this.handleNetworkMessage(data));

        const urlParams = new URLSearchParams(window.location.search);
        const roomFromUrl = urlParams.get('room');
        if (roomFromUrl) {
            document.getElementById('input-room-code').value = roomFromUrl;
            this.selectRole('student');
        }
    }

    selectRole(role) {
        window.soundEngine.init();
        this.role = role;

        if (role === 'host') {
            this.roomCode = window.networkManager.createRoom();
            document.getElementById('display-room-code').innerText = this.roomCode;
            
            const joinUrl = `${window.location.origin}${window.location.pathname}?room=${this.roomCode}`;
            const qrContainer = document.getElementById('qrcode');
            qrContainer.innerHTML = '';
            if (window.QRCode) {
                new QRCode(qrContainer, {
                    text: joinUrl,
                    width: 160,
                    height: 160
                });
            }

            this.showScreen('hostLobby');
            window.soundEngine.startBGM();
        } else {
            this.showScreen('studentJoin');
        }
    }

    selectAvatar(avatar, elem) {
        this.selectedAvatar = avatar;
        document.querySelectorAll('.avatar-option').forEach(el => el.classList.remove('selected'));
        if (elem) elem.classList.add('selected');
        window.soundEngine.playClick();
    }

    // Host: Start Game
    startHostGame() {
        const qCountInput = parseInt(document.getElementById('input-question-count').value);
        this.totalQuestions = (isNaN(qCountInput) || qCountInput < 1) ? 5 : qCountInput;
        this.selectedCategory = document.getElementById('select-category').value || 'all';
        this.customCategoryText = document.getElementById('input-custom-category').value.trim() || '自由指定分野';

        // 出題済みの履歴をクリア
        if (window.mathGenerator && window.mathGenerator.usedQuestions) {
            window.mathGenerator.usedQuestions.clear();
        }

        this.currentQuestionIndex = 0;
        this.answersReceived.clear();

        window.networkManager.broadcast({
            type: 'GAME_START',
            totalQuestions: this.totalQuestions
        });

        this.nextQuestion();
    }

    // Host: Generate and Send Next Question
    nextQuestion() {
        if (this.currentQuestionIndex >= this.totalQuestions) {
            this.showPodium();
            return;
        }

        this.currentQuestionIndex++;
        this.answersReceived.clear();

        // Hide math explanation box for next question
        const expBox = document.getElementById('host-explanation-container');
        if (expBox) expBox.style.display = 'none';

        // Generate Math Question with explanation
        this.currentQuestion = window.mathGenerator.generateQuestion(this.selectedCategory, this.customCategoryText);

        // Update Host UI
        document.getElementById('host-q-num').innerText = `${this.currentQuestionIndex} / ${this.totalQuestions}`;
        document.getElementById('host-q-category').innerText = this.currentQuestion.categoryName;
        document.getElementById('host-q-text').innerText = this.currentQuestion.question;
        
        const shapes = ['▲', '◆', '●', '■'];
        this.currentQuestion.options.forEach((optText, idx) => {
            const btn = document.getElementById(`host-opt-${idx}`);
            if (btn) {
                btn.innerHTML = `<span class="option-shape">${shapes[idx]}</span> ${optText}`;
            }
        });

        document.getElementById('host-answer-count').innerText = `回答数: 0 / ${this.players.length}`;

        // Broadcast Question to Students
        window.networkManager.broadcast({
            type: 'NEW_QUESTION',
            questionIndex: this.currentQuestionIndex,
            totalQuestions: this.totalQuestions,
            categoryName: this.currentQuestion.categoryName,
            timeLimit: this.timeLimit
        });

        this.showScreen('hostGame');
        window.soundEngine.startBGM();
        this.startTimer(this.timeLimit);
    }

    // Host Timer Control & Pausing
    startTimer(seconds) {
        if (this.timer) clearInterval(this.timer);
        this.timeRemaining = seconds;
        this.isTimerPaused = false;
        
        const timerElem = document.getElementById('host-timer');
        if (timerElem) timerElem.innerText = this.timeRemaining;

        this.timer = setInterval(() => {
            if (this.isTimerPaused) return;

            this.timeRemaining--;
            if (timerElem) timerElem.innerText = this.timeRemaining;

            window.soundEngine.playTick(this.timeRemaining <= 5);

            if (this.timeRemaining <= 0 || this.answersReceived.size >= this.players.length) {
                clearInterval(this.timer);
                this.revealQuestionResult();
            }
        }, 1000);
    }

    togglePauseTimer() {
        this.isTimerPaused = !this.isTimerPaused;
        const btn = document.getElementById('btn-pause-timer');
        if (btn) {
            btn.innerText = this.isTimerPaused ? '▶️ 再開する' : '⏸️ 一時停止（解説タイム）';
        }
    }

    toggleExplanation() {
        const expBox = document.getElementById('host-explanation-container');
        if (expBox) {
            if (expBox.style.display === 'none' || !expBox.style.display) {
                expBox.innerHTML = this.currentQuestion.explanation || '解説準備中';
                expBox.style.display = 'block';
            } else {
                expBox.style.display = 'none';
            }
        }
    }

    // Host Reveals Answer & Scores
    revealQuestionResult() {
        if (this.timer) clearInterval(this.timer);
        window.soundEngine.stopBGM();

        // Calculate Scores & EXP Level for each player
        this.players.forEach(p => {
            const answerData = this.answersReceived.get(p.id);
            // ★ Fix: parseIntを用いて、文字列・数値の型不一致があっても正しく判定する
            if (answerData && parseInt(answerData.answerIndex) === parseInt(this.currentQuestion.correctIndex)) {
                p.streak = (p.streak || 0) + 1;
                p.correctCount = (p.correctCount || 0) + 1;
                p.maxStreak = Math.max(p.maxStreak || 0, p.streak);

                // Speed bonus (安全のためparseIntを使用)
                const tr = parseInt(answerData.timeRemaining) || 0;
                const speedBonus = Math.floor(1000 * (tr / this.timeLimit));
                
                // Fever Mode bonus (x1.5 score if streak >= 3)
                const isFever = p.streak >= 3;
                const multiplier = isFever ? 1.5 : 1.0;
                
                const streakBonus = (p.streak - 1) * 200;
                const pointsEarned = Math.floor((1000 + speedBonus + streakBonus) * multiplier);

                p.score += pointsEarned;
                p.exp = p.score;

                // Level calculation
                const newLevel = Math.floor(p.exp / 2000) + 1;
                if (newLevel > (p.level || 1)) {
                    p.levelUp = true;
                }
                p.level = newLevel;
                p.title = this.getTitleForLevel(p.level);
            } else {
                p.streak = 0;
            }
        });

        this.players.sort((a, b) => b.score - a.score);

        window.networkManager.broadcast({
            type: 'QUESTION_RESULT',
            correctIndex: this.currentQuestion.correctIndex,
            correctText: this.currentQuestion.correctText,
            explanation: this.currentQuestion.explanation,
            players: this.players
        });

        this.renderLeaderboard();
        this.showScreen('hostLeaderboard');
    }

    getTitleForLevel(lvl) {
        if (lvl >= 10) return '👑 数学神';
        if (lvl >= 7) return '⚡ 関数マスター';
        if (lvl >= 5) return '🔥 方程式ハッカー';
        if (lvl >= 3) return '🎯 計算スナイパー';
        return '🌱 見習い数学者';
    }

    renderLeaderboard() {
        const listElem = document.getElementById('leaderboard-list');
        listElem.innerHTML = '';

        this.players.slice(0, 5).forEach((p, idx) => {
            const row = document.createElement('div');
            row.className = `leaderboard-row rank-${idx + 1}`;
            row.innerHTML = `
                <span>${idx + 1}. ${p.avatar || '👤'} ${p.name} <small style="font-size: 0.8rem; color: #00F0FF;">[${p.title || 'Lv.1'}]</small> ${p.streak > 2 ? '🔥 FEVER!' : ''}</span>
                <span>${p.score.toLocaleString()} pt</span>
            `;
            listElem.appendChild(row);
        });
    }

    showFullRanking() {
        const tbody = document.getElementById('full-ranking-tbody');
        if (!tbody) return;
        tbody.innerHTML = '';

        this.players.forEach((p, idx) => {
            const rank = idx + 1;
            const row = document.createElement('tr');
            
            let badgeClass = 'rank-badge-other';
            if (rank === 1) badgeClass = 'rank-badge-1';
            else if (rank === 2) badgeClass = 'rank-badge-2';
            else if (rank === 3) badgeClass = 'rank-badge-3';

            const accuracy = `${p.correctCount || 0} / ${this.totalQuestions}`;

            row.innerHTML = `
                <td><span class="rank-badge ${badgeClass}">${rank} 位</span></td>
                <td style="font-weight: 800; color: #FFF;">${p.avatar || '👤'} ${p.name} <span style="font-size: 0.8rem; color: #00F0FF;">(${p.title})</span></td>
                <td style="color: var(--color-accent); font-weight: 800;">${p.score.toLocaleString()} pt</td>
                <td>${accuracy}</td>
                <td>🔥 ${p.maxStreak || 0} 連勝</td>
            `;
            tbody.appendChild(row);
        });

        this.showScreen('hostFullRanking');
    }

    // Teacher CSV Export Feature 📥
    exportCSV() {
        let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
        csvContent += "順位,アバター,ニックネーム,称号,合計スコア,正解数,全問題数,正答率(%),最高ストリーク\n";

        this.players.forEach((p, idx) => {
            const rank = idx + 1;
            const accPercent = Math.round(((p.correctCount || 0) / this.totalQuestions) * 100);
            csvContent += `${rank},"${p.avatar || ''}","${p.name}","${p.title || ''}",${p.score},${p.correctCount || 0},${this.totalQuestions},${accPercent}%,${p.maxStreak || 0}\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `math_kahoot_results_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    showPodium() {
        window.soundEngine.stopBGM();
        window.soundEngine.playFanfare();

        const top3 = this.players.slice(0, 3);
        
        ['1', '2', '3'].forEach((rankStr, idx) => {
            const player = top3[idx];
            const nameElem = document.getElementById(`podium-name-${rankStr}`);
            if (nameElem) {
                nameElem.innerText = player ? `${player.avatar || ''} ${player.name} (${player.score.toLocaleString()}pt)` : '-';
            }
        });

        window.networkManager.broadcast({
            type: 'FINAL_PODIUM',
            top3: top3,
            fullRanking: this.players,
            totalQuestions: this.totalQuestions
        });

        this.showScreen('hostPodium');

        if (window.confetti) {
            window.confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
        }
    }

    submitStudentJoin() {
        const nameInput = document.getElementById('input-student-name').value.trim();
        const codeInput = document.getElementById('input-room-code').value.trim();

        if (!nameInput || !codeInput) {
            alert('名前とルームコードを入力してください');
            return;
        }

        this.playerName = nameInput;
        this.roomCode = codeInput;

        window.soundEngine.init();
        window.soundEngine.playClick();

        // ★ Fix: アバターをJOIN_REQUESTに含めて送信
        window.networkManager.joinRoom(this.roomCode, this.playerName, this.selectedAvatar);

        document.getElementById('student-status-text').innerText = `${this.selectedAvatar} ${this.playerName} さん、対戦開始を待っています...`;
        this.showScreen('studentWait');
    }

    submitStudentAnswer(answerIndex) {
        if (this.hasAnsweredCurrent) return;
        this.hasAnsweredCurrent = true;

        window.soundEngine.playClick();

        // ★ Fix: 生徒側ローカルに自分の回答を保存しておく（正誤判定の表示用）
        this.lastAnswerIndex = answerIndex;

        // タイマーがあれば停止
        if (this.timer) clearInterval(this.timer);

        // ★ Fix: networkManager.myPlayerIdを使用（JOIN_REQUESTと同じIDで送信）
        window.networkManager.broadcast({
            type: 'SUBMIT_ANSWER',
            playerId: window.networkManager.myPlayerId,
            playerName: this.playerName,
            avatar: this.selectedAvatar,
            answerIndex: answerIndex,
            timeRemaining: this.timeRemaining
        });

        document.getElementById('student-status-text').innerText = '回答送信完了！結果発表を待っています...';
        this.showScreen('studentWait');
    }

    handleNetworkMessage(data) {
        switch (data.type) {
            case 'JOIN_REQUEST':
                if (this.role === 'host') {
                    if (!this.players.find(p => p.id === data.playerId)) {
                        this.players.push({
                            id: data.playerId,
                            name: data.playerName,
                            avatar: data.avatar || '👤',
                            score: 0,
                            streak: 0,
                            correctCount: 0,
                            maxStreak: 0,
                            exp: 0,
                            level: 1,
                            title: '🌱 見習い数学者'
                        });
                    }

                    const listElem = document.getElementById('lobby-player-list');
                    listElem.innerHTML = '';
                    this.players.forEach(p => {
                        const tag = document.createElement('div');
                        tag.className = 'player-tag';
                        tag.innerText = `${p.avatar || '👤'} ${p.name}`;
                        listElem.appendChild(tag);
                    });

                    document.getElementById('host-player-count').innerText = `参加生徒 (${this.players.length}名)`;

                    window.networkManager.broadcast({
                        type: 'JOIN_ACCEPTED',
                        playerId: data.playerId,
                        players: this.players
                    });
                }
                break;

            case 'SUBMIT_ANSWER':
                if (this.role === 'host') {
                    this.answersReceived.set(data.playerId, {
                        answerIndex: data.answerIndex,
                        timeRemaining: data.timeRemaining
                    });

                    document.getElementById('host-answer-count').innerText = `回答数: ${this.answersReceived.size} / ${this.players.length}`;

                    if (this.answersReceived.size >= this.players.length) {
                        if (this.timer) clearInterval(this.timer);
                        this.revealQuestionResult();
                    }
                }
                break;

            case 'JOIN_ACCEPTED':
                if (this.role === 'student' && data.playerId === this.playerId) {
                    document.getElementById('student-status-text').innerText = '先生のゲーム開始を待っています！';
                }
                break;

            case 'NEW_QUESTION':
                if (this.role === 'student') {
                    this.hasAnsweredCurrent = false;
                    this.timeLimit = data.timeLimit;
                    this.timeRemaining = data.timeLimit; // ★ 生徒側の残り時間を初期化
                    this.showScreen('studentGame');

                    // ★ Fix: 生徒側でも時間ボーナスのためにタイマーを動かす
                    if (this.timer) clearInterval(this.timer);
                    this.timer = setInterval(() => {
                        if (this.timeRemaining > 0) {
                            this.timeRemaining--;
                        } else {
                            clearInterval(this.timer);
                        }
                    }, 1000);
                }
                break;

            case 'QUESTION_RESULT':
                if (this.role === 'student') {
                    const myData = data.players.find(p => p.id === this.playerId);
                    const myScore = myData ? myData.score : 0;
                    const myStreak = myData ? myData.streak : 0;
                    
                    const feedbackOverlay = document.getElementById('feedback-box');
                    const feedbackTitle = document.getElementById('feedback-title');
                    const feedbackDesc = document.getElementById('feedback-desc');

                    // ★ Fix: answersReceivedではなく、生徒側ローカルに保存した lastAnswerIndex を使って正誤判定
                    if (this.lastAnswerIndex !== undefined && parseInt(this.lastAnswerIndex) === parseInt(data.correctIndex)) {
                        feedbackOverlay.className = 'feedback-overlay feedback-correct';
                        
                        if (myStreak >= 3) {
                            feedbackTitle.innerText = `🔥 FEVER! コンボ ${myStreak} 連勝！ 🎉`;
                            window.soundEngine.startBGM(true); // Fever BGM
                        } else {
                            feedbackTitle.innerText = '正解！ 🎉';
                            window.soundEngine.playCorrect();
                        }

                        if (myData && myData.levelUp) {
                            window.soundEngine.playLevelUp();
                            feedbackTitle.innerText = `✨ LEVEL UP! [${myData.title}] 🎉`;
                        }
                    } else {
                        feedbackOverlay.className = 'feedback-overlay feedback-wrong';
                        feedbackTitle.innerText = '残念... ❌';
                        window.soundEngine.playWrong();
                    }

                    feedbackDesc.innerHTML = `
                        正解: ${data.correctText}<br>
                        スコア: ${myScore.toLocaleString()} pt | 称号: ${myData ? myData.title : '🌱'}
                    `;
                    this.showScreen('studentFeedback');
                }
                break;

            case 'FINAL_PODIUM':
                if (this.role === 'student') {
                    const fullList = data.fullRanking || [];
                    const myIdx = fullList.findIndex(p => p.id === this.playerId);
                    const feedbackTitle = document.getElementById('feedback-title');
                    const feedbackDesc = document.getElementById('feedback-desc');

                    if (myIdx !== -1) {
                        const myRank = myIdx + 1;
                        const myData = fullList[myIdx];
                        const totalCount = fullList.length;

                        feedbackTitle.innerText = myRank <= 3 ? `🏆 第 ${myRank} 位！ おめでとうございます！` : `全対戦終了！ 第 ${myRank} 位`;
                        feedbackDesc.innerHTML = `
                            参加人数: ${totalCount} 名中 ${myRank} 位<br>
                            最終スコア: ${myData.score.toLocaleString()} pt | 称号: ${myData.title || ''}<br>
                            正解率: ${myData.correctCount || 0} / ${data.totalQuestions || 5} 問正解
                        `;
                    } else {
                        feedbackTitle.innerText = `ゲーム終了！お疲れ様でした！`;
                    }

                    this.showScreen('studentFeedback');
                }
                break;
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
