/**
 * NetworkManager - PeerJS WebRTC P2P + BroadcastChannel Hybrid
 * チューニング版：接続の重複防止・JSONシリアライズ統一・リトライロジック最適化
 */
class NetworkManager {
    constructor() {
        this.peer = null;
        this.connMap = new Map(); // playerID -> dataConnection (host side)
        this.hostConn = null;    // student side: connection to host
        this.roomCode = null;
        this.isHost = false;
        this.onMessageCallback = null;
        this.broadcastChannel = null;

        // 一意のプレイヤーID（App側と共通）
        this.myPlayerId = 'p_' + Math.random().toString(36).substr(2, 9);
    }

    initBroadcastChannel(roomCode) {
        if (this.broadcastChannel) this.broadcastChannel.close();
        this.broadcastChannel = new BroadcastChannel(`quiz_higashi_${roomCode}`);
        this.broadcastChannel.onmessage = (event) => {
            if (this.onMessageCallback) {
                this.onMessageCallback(event.data);
            }
        };
    }

    // ホスト: 部屋を作成する
    createRoom(customRoomCode = null) {
        this.isHost = true;
        this.roomCode = customRoomCode || Math.floor(100000 + Math.random() * 900000).toString();
        this.initBroadcastChannel(this.roomCode);

        if (!window.Peer) return this.roomCode;

        // 既存Peerのクリーンアップ
        if (this.peer) {
            try {
                this.peer.destroy();
            } catch (e) {
                console.warn('[Host] Cleanup old peer failed:', e);
            }
        }

        try {
            const peerId = `quiz-higashi-room-${this.roomCode}`;
            // 接続経路探索(STUN)を強化し、Unified Planで挙動を安定化
            this.peer = new Peer(peerId, {
                config: {
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:stun1.l.google.com:19302' },
                        { urls: 'stun:stun2.l.google.com:19302' },
                        { urls: 'stun:stun3.l.google.com:19302' },
                        { urls: 'stun:stun4.l.google.com:19302' }
                    ],
                    sdpSemantics: 'unified-plan'
                },
                debug: 1
            });

            this.peer.on('open', (id) => {
                console.log('[Host] PeerJS Ready. ID:', id);
            });

            this.peer.on('connection', (conn) => {
                console.log('[Host] New peer connected:', conn.peer);

                conn.on('data', (data) => {
                    // ★ 改善: データ受信時にプレイヤーIDを確認し、古い重複接続があれば即クリーンアップして上書き
                    if (data && data.playerId) {
                        if (this.connMap.has(data.playerId)) {
                            const oldConn = this.connMap.get(data.playerId);
                            if (oldConn && oldConn !== conn) {
                                try {
                                    console.log('[Host] Closing old duplicate connection for player:', data.playerId);
                                    oldConn.close();
                                } catch (e) {}
                            }
                        }
                        this.connMap.set(data.playerId, conn);
                    }
                    if (this.onMessageCallback) {
                        this.onMessageCallback(data);
                    }
                });

                conn.on('close', () => {
                    console.log('[Host] Connection closed:', conn.peer);
                });

                conn.on('error', (err) => {
                    console.warn('[Host] Connection error:', err);
                });
            });

            this.peer.on('error', (err) => {
                console.warn('[Host] PeerJS error:', err);
            });

        } catch (e) {
            console.warn('[Host] PeerJS init failed:', e);
        }

        return this.roomCode;
    }

    // 生徒: 部屋に参加する
    joinRoom(roomCode, playerName, avatar = '👤') {
        this.isHost = false;
        this.roomCode = roomCode;
        this.initBroadcastChannel(this.roomCode);

        const joinData = {
            type: 'JOIN_REQUEST',
            playerId: this.myPlayerId,
            playerName: playerName,
            avatar: avatar
        };

        if (!window.Peer) {
            if (this.broadcastChannel) {
                this.broadcastChannel.postMessage(joinData);
            }
            return;
        }

        // 既存接続のクリーンアップ
        if (this.peer) {
            try {
                this.peer.destroy();
            } catch (e) {}
        }

        let connectionTimer = null;
        let retryCount = 0;
        const maxRetries = 6; // リトライ回数を少し増強

        const connectToHost = () => {
            if (this.hostConn && this.hostConn.open) return;
            console.log(`[Student] Connecting to host (Attempt ${retryCount + 1}/${maxRetries})...`);

            this.peer = new Peer({
                config: {
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:stun1.l.google.com:19302' },
                        { urls: 'stun:stun2.l.google.com:19302' },
                        { urls: 'stun:stun3.l.google.com:19302' },
                        { urls: 'stun:stun4.l.google.com:19302' }
                    ],
                    sdpSemantics: 'unified-plan'
                },
                debug: 1
            });

            this.peer.on('open', (myId) => {
                console.log('[Student] My PeerJS ID:', myId);

                const hostPeerId = `quiz-higashi-room-${roomCode}`;
                
                // ★ 改善: 異なるOSやブラウザ間でのデータ互換性を上げるため、シリアライズを明示的に 'json' に固定
                const conn = this.peer.connect(hostPeerId, {
                    serialization: 'json',
                    reliable: false // 速度重視。再送負荷を減らして接続を安定化
                });
                this.hostConn = conn;

                // タイムアウトを4秒に短縮（より機敏にリトライを回す）
                connectionTimer = setTimeout(() => {
                    if (!conn.open) {
                        console.warn('[Student] Connection timeout. Retrying...');
                        cleanupAndRetry();
                    }
                }, 4000);

                conn.on('open', () => {
                    if (connectionTimer) clearTimeout(connectionTimer);
                    console.log('[Student] Connected to host successfully!');
                    conn.send(joinData);
                    if (this.broadcastChannel) {
                        this.broadcastChannel.postMessage(joinData);
                    }
                });

                conn.on('data', (data) => {
                    if (this.onMessageCallback) {
                        this.onMessageCallback(data);
                    }
                });

                conn.on('error', (err) => {
                    console.warn('[Student] Connection error:', err);
                    cleanupAndRetry();
                });

                conn.on('close', () => {
                    console.log('[Student] Connection closed by host');
                });
            });

            this.peer.on('error', (err) => {
                console.warn('[Student] PeerJS error:', err);
                cleanupAndRetry();
            });
        };

        const cleanupAndRetry = () => {
            if (connectionTimer) clearTimeout(connectionTimer);
            if (this.hostConn && this.hostConn.open) return;

            if (retryCount < maxRetries) {
                retryCount++;
                try {
                    if (this.hostConn) this.hostConn.close();
                    if (this.peer) this.peer.destroy();
                } catch (e) {}

                // 連打衝突を防ぐためのランダムディレイ（1〜2.5秒）
                const delay = 1000 + Math.random() * 1500;
                setTimeout(connectToHost, delay);
            } else {
                console.error('[Student] Max retries reached. Fallback to BroadcastChannel.');
                if (this.broadcastChannel) {
                    this.broadcastChannel.postMessage(joinData);
                }
            }
        };

        connectToHost();
    }

    // ブロードキャスト
    broadcast(data) {
        if (this.broadcastChannel) {
            this.broadcastChannel.postMessage(data);
        }

        if (this.isHost) {
            this.connMap.forEach((conn, playerId) => {
                if (conn && conn.open) {
                    try {
                        conn.send(data);
                    } catch (e) {
                        console.warn('[Host] Failed to send to', playerId, e);
                    }
                }
            });
        } else if (this.hostConn && this.hostConn.open) {
            try {
                this.hostConn.send(data);
            } catch (e) {
                console.warn('[Student] Failed to send to host:', e);
            }
        }
    }

    onMessage(callback) {
        this.onMessageCallback = callback;
    }
}

window.networkManager = new NetworkManager();
