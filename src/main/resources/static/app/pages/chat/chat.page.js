/**
 * 💬 GrowTalk 채팅 페이지
 *
 * 구조 요약
 * -----------------------------------------
 * 1️⃣ 메시지 저장       : REST (DB 저장)
 * 2️⃣ 실시간 알림       : WebSocket
 * 3️⃣ 접속자 관리       : WebSocket (ONLINE_USERS)
 */

import authStore from '../../store/authStore.js';

export default function ChatPage() {

    /* ===============================
       🔗 채널 → roomId 매핑
    =============================== */
    const ROOM_ID_MAP = {
        general: 1,
        dev: 2,
        notice: 3
    };

    /* ===============================
       📦 페이지 상태
    =============================== */
    let state = {
        currentRoom: 'general',
        messages: [],
        onlineUsers: []   // ⭐ 실시간 접속자 목록
    };

    /* ===============================
       🔌 WebSocket
    =============================== */
    let socket = null;

    /* ===============================
       🖨 메시지 렌더링
    =============================== */
    function renderMessages() {
        const myUserId = authStore.getUserId();

        return state.messages.map(m => {
            const isMine = m.sender === myUserId;

            return `
                <div class="chat-message ${isMine ? 'mine' : 'other'}">
                    <div class="chat-message-header">
                        <span class="chat-message-sender">${m.sender}</span>
                        <span class="chat-message-time">${m.time}</span>
                    </div>
                    <div class="chat-message-text">${m.text}</div>
                </div>
            `;
        }).join('');
    }

    /* ===============================
       👥 온라인 유저 렌더링
    =============================== */
    function renderOnlineUsers(users) {
        const ul = document.querySelector('.chat-user-list');
        if (!ul) return;

        ul.innerHTML = users.map(u => `
            <li class="chat-user-item">🟢 ${u}</li>
        `).join('');
    }

    return {
        title: 'GrowTalk',

        /* ===============================
           🧩 HTML
        =============================== */
        render() {
            return `
            <div class="chat-layout">
                <aside class="chat-sidebar">
                    <div class="chat-sidebar-header">
                        <span class="chat-sidebar-title">💬 GrowTalk</span>
                    </div>

                    <div class="chat-section-title">채널</div>
                    <ul class="chat-room-list" id="chat-room-list">
                        <li class="chat-room-item chat-room-item--active" data-room="general"># general</li>
                        <li class="chat-room-item" data-room="dev"># dev</li>
                        <li class="chat-room-item" data-room="notice"># notice</li>
                    </ul>

                    <div class="chat-section-title">온라인</div>
                    <ul class="chat-user-list"></ul>
                </aside>

                <section class="chat-main">
                    <header class="chat-header">
                        <span class="chat-room-name"># ${state.currentRoom}</span>
                    </header>

                    <div class="chat-messages" id="chat-messages">
                        ${renderMessages()}
                    </div>

                    <form class="chat-input-area" id="chat-form">
                        <textarea
                            id="chat-input"
                            class="chat-input"
                            rows="2"
                            placeholder="메시지를 입력 후 Enter"
                        ></textarea>
                        <button class="chat-send-btn">보내기</button>
                    </form>
                </section>
            </div>
            `;
        },

        /* ===============================
           🚀 로직
        =============================== */
        onMounted() {
            const messagesEl = document.getElementById('chat-messages');
            const formEl = document.getElementById('chat-form');
            const inputEl = document.getElementById('chat-input');
            const roomListEl = document.getElementById('chat-room-list');
            const roomNameEl = document.querySelector('.chat-room-name');

            /* 📥 메시지 로드 (REST) */
            async function loadMessages() {
                const roomId = ROOM_ID_MAP[state.currentRoom];
                const res = await axios.get(`/api/chat/rooms/${roomId}/messages`);

                state.messages = res.data.map(m => {
                    const d = new Date(m.createdAt);
                    return {
                        sender: m.senderId,
                        text: m.content,
                        time: `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
                    };
                });

                messagesEl.innerHTML = renderMessages();
                messagesEl.scrollTop = messagesEl.scrollHeight;
            }

            /* ✉ 메시지 전송 */
            async function sendMessage() {
                const text = inputEl.value.trim();
                if (!text) return;

                const senderId = authStore.getUserId();
                const roomId = ROOM_ID_MAP[state.currentRoom];

                await axios.post(`/api/chat/rooms/${roomId}/messages`, {
                    senderId,
                    content: text
                });

                socket?.send(JSON.stringify({ roomId }));
                inputEl.value = '';
            }

            /* 📡 WebSocket 연결 (⭐ 핵심 수정) */
            function connectWebSocket() {
                const userId = authStore.getUserId();
                if (!userId) return;

                socket = new WebSocket(
                    `ws://${location.host}/ws/chat?userId=${userId}`
                );

                socket.onmessage = async (e) => {
                    const data = JSON.parse(e.data);

                    // 👥 접속자 목록
                    if (data.type === 'ONLINE_USERS') {
                        state.onlineUsers = data.users;
                        renderOnlineUsers(data.users);
                        return;
                    }

                    // ✉ 메시지 알림
                    if (data.roomId === ROOM_ID_MAP[state.currentRoom]) {
                        await loadMessages();
                    }
                };
            }

            /* 🔄 채널 변경 */
            function changeRoom(roomKey, li) {
                state.currentRoom = roomKey;
                roomNameEl.textContent = `# ${roomKey}`;

                roomListEl.querySelectorAll('.chat-room-item')
                    .forEach(el => el.classList.remove('chat-room-item--active'));

                li.classList.add('chat-room-item--active');
                loadMessages();
            }

            /* 🎯 이벤트 */
            roomListEl.querySelectorAll('.chat-room-item')
                .forEach(li =>
                    li.addEventListener('click',
                        () => changeRoom(li.dataset.room, li))
                );

            formEl.addEventListener('submit', e => {
                e.preventDefault();
                sendMessage();
            });

            inputEl.addEventListener('keydown', e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                }
            });

            /* 🚀 시작 */
            loadMessages();
            connectWebSocket();
        }
    };
}
