export const Messages = {
    currentChat: null,
    ws: null,

    async loadInbox() {
        const container = document.querySelector('.main-feed');
        if (!container) return;

        try {
            const response = await fetch('/api/messages/inbox', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('pm_token')}` }
            });
            const chats = await response.json();

            container.innerHTML = `
                <div class="messages-container">
                    <div class="chat-sidebar">
                        <div class="chat-search">
                            <input type="text" placeholder="Search messages...">
                        </div>
                        
                        <div class="chat-filters">
                            <span class="chat-filter active">All</span>
                            <span class="chat-filter">Unread</span>
                            <span class="chat-filter">Groups</span>
                            <span class="chat-filter">Locked</span>
                        </div>
                        
                        <div class="chat-contacts" id="chatContacts">
                            ${chats.map(chat => this.renderChatContact(chat)).join('')}
                        </div>
                    </div>
                    
                    <div class="chat-window" id="chatWindow">
                        <div class="chat-placeholder">
                            <i class="fas fa-comments"></i>
                            <h3>Select a chat to start messaging</h3>
                            <p>Choose from your existing conversations or start a new one</p>
                            <button class="btn btn-primary" onclick="Messages.startNewChat()">
                                New Message
                            </button>
                        </div>
                    </div>
                </div>
            `;

            // Add click handlers
            document.querySelectorAll('.chat-contact').forEach(contact => {
                contact.addEventListener('click', () => {
                    const chatId = contact.dataset.chatId;
                    this.openChat(chatId);
                });
            });
        } catch (error) {
            console.error('Failed to load inbox:', error);
        }
    },

    renderChatContact(chat) {
        const lastMessage = chat.lastMessage || {};
        const isLocked = lastMessage.locked || false;
        const hasUnread = chat.unreadCount > 0;

        return `
            <div class="chat-contact ${hasUnread ? 'unread' : ''}" data-chat-id="${chat.id}">
                <div class="chat-avatar">
                    <div class="chat-avatar-img"></div>
                    ${chat.online ? '<span class="online-status"></span>' : ''}
                </div>
                <div class="chat-info">
                    <h4>
                        ${chat.name}
                        <span class="chat-time">${this.formatTime(lastMessage.createdAt)}</span>
                    </h4>
                    <p>
                        ${isLocked ? '<i class="fas fa-lock"></i> ' : ''}
                        ${lastMessage.text || ''}
                    </p>
                </div>
                ${hasUnread ? `<span class="chat-badge">${chat.unreadCount}</span>` : ''}
            </div>
        `;
    },

    async openChat(chatId) {
        this.currentChat = chatId;
        
        try {
            const response = await fetch(`/api/messages/chat/${chatId}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('pm_token')}` }
            });
            const chat = await response.json();

            const chatWindow = document.getElementById('chatWindow');
            chatWindow.innerHTML = this.renderChatWindow(chat);

            // Mark messages as read
            await fetch(`/api/messages/${chatId}/read`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('pm_token')}` }
            });

            // Scroll to bottom
            const messagesContainer = document.getElementById('chatMessages');
            if (messagesContainer) {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }

            // Initialize WebSocket connection
            this.initWebSocket(chatId);

            // Add event listeners
            document.getElementById('sendMessage')?.addEventListener('click', () => {
                this.sendMessage();
            });

            document.getElementById('messageInput')?.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });

            document.getElementById('lockToggle')?.addEventListener('click', (e) => {
                this.toggleMessageLock(e.target);
            });
        } catch (error) {
            console.error('Failed to open chat:', error);
        }
    },

    renderChatWindow(chat) {
        return `
            <div class="chat-header">
                <div class="chat-header-info">
                    <div class="chat-avatar-img small"></div>
                    <div>
                        <h3>${chat.name}</h3>
                        <span class="online-status-text">${chat.online ? 'Online' : 'Offline'}</span>
                    </div>
                </div>
                <div class="chat-header-actions">
                    <i class="fas fa-phone" title="Call"></i>
                    <i class="fas fa-video" title="Video Call"></i>
                    <i class="fas fa-info-circle" title="Chat Info"></i>
                </div>
            </div>
            
            <div class="chat-messages" id="chatMessages">
                ${chat.messages.map(msg => this.renderMessage(msg)).join('')}
            </div>
            
            <div class="chat-footer">
                <div class="message-lock-toggle ${chat.messageLocked ? 'locked' : ''}" id="lockToggle">
                    <i class="fas ${chat.messageLocked ? 'fa-lock' : 'fa-lock-open'}"></i>
                    <span>${chat.messageLocked ? 'Locked' : 'Unlocked'}</span>
                </div>
                
                <input type="text" id="messageInput" placeholder="Type a message...">
                
                <div class="attach-btn">
                    <i class="fas fa-paperclip"></i>
                </div>
                
                <div class="send-btn" id="sendMessage">
                    <i class="fas fa-paper-plane"></i>
                </div>
            </div>
        `;
    },

    renderMessage(message) {
        const isOutgoing = message.senderId === this.currentUserId;
        const isLocked = message.locked || false;
        const isSeen = message.seen || false;

        return `
            <div class="message ${isOutgoing ? 'out' : 'in'} ${isLocked ? 'locked' : ''}" 
                 data-message-id="${message.id}">
                <div class="message-bubble">
                    ${message.media ? `
                        <div class="message-media">
                            ${message.media.type === 'image' ? 
                                `<img src="${message.media.url}" alt="Shared image">` : 
                                `<i class="fas fa-file"></i> ${message.media.name}`
                            }
                        </div>
                    ` : ''}
                    
                    ${isLocked ? `
                        <i class="fas fa-lock"></i>
                        <span>Locked message - click to open</span>
                    ` : `
                        <p>${message.text}</p>
                    `}
                    
                    <div class="message-time">
                        ${this.formatTime(message.createdAt)}
                        ${isOutgoing ? `
                            <span class="message-status">
                                <i class="fas ${isSeen ? 'fa-check-double seen' : 'fa-check'}"></i>
                            </span>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    },

    async sendMessage() {
        const input = document.getElementById('messageInput');
        const text = input.value.trim();
        
        if (!text || !this.currentChat) return;

        try {
            const response = await fetch(`/api/messages/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('pm_token')}`
                },
                body: JSON.stringify({
                    chatId: this.currentChat,
                    text: text,
                    locked: this.messageLocked || false
                })
            });

            if (response.ok) {
                input.value = '';
                // Message will appear via WebSocket
            }
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    },

    async toggleMessageLock(element) {
        const chatId = this.currentChat;
        const isLocked = element.classList.contains('locked');
        
        try {
            await fetch(`/api/messages/${chatId}/lock`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('pm_token')}`
                },
                body: JSON.stringify({ locked: !isLocked })
            });

            element.classList.toggle('locked');
            element.querySelector('i').className = `fas fa-${!isLocked ? 'lock' : 'lock-open'}`;
            element.querySelector('span').textContent = !isLocked ? 'Locked' : 'Unlocked';
            
            this.messageLocked = !isLocked;
        } catch (error) {
            console.error('Failed to toggle message lock:', error);
        }
    },

    initWebSocket(chatId) {
        const token = localStorage.getItem('pm_token');
        this.ws = new WebSocket(`wss://api.primemar.com/ws?token=${token}&chat=${chatId}`);

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            if (data.type === 'message') {
                this.appendMessage(data.message);
            } else if (data.type === 'typing') {
                this.showTypingIndicator(data.user);
            } else if (data.type === 'seen') {
                this.updateMessageStatus(data.messageId);
            }
        };

        this.ws.onclose = () => {
            console.log('WebSocket disconnected');
            setTimeout(() => this.initWebSocket(chatId), 3000);
        };
    },

    appendMessage(message) {
        const container = document.getElementById('chatMessages');
        if (!container) return;

        container.insertAdjacentHTML('beforeend', this.renderMessage(message));
        container.scrollTop = container.scrollHeight;
    },

    formatTime(timestamp) {
        if (!timestamp) return '';
        
        const date = new Date(timestamp);
        const now = new Date();
        
        if (date.toDateString() === now.toDateString()) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    },

    async startNewChat() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>New Message</h3>
                <input type="text" class="form-input" placeholder="Search users..." id="userSearch">
                <div class="user-results" id="userResults"></div>
                <div class="modal-actions">
                    <button class="btn btn-outline" onclick="this.closest('.modal').remove()">Cancel</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('show'), 10);

        // Search users
        document.getElementById('userSearch').addEventListener('input', async (e) => {
            const query = e.target.value;
            if (query.length < 2) return;

            try {
                const response = await fetch(`/api/users/search?q=${query}`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('pm_token')}` }
                });
                const users = await response.json();

                const results = document.getElementById('userResults');
                results.innerHTML = users.map(user => `
                    <div class="user-result" onclick="Messages.createChat('${user.id}')">
                        <div class="avatar-small"></div>
                        <div>
                            <strong>${user.name}</strong>
                            <span>@${user.username}</span>
                        </div>
                    </div>
                `).join('');
            } catch (error) {
                console.error('Failed to search users:', error);
            }
        });
    },

    async createChat(userId) {
        try {
            const response = await fetch('/api/messages/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('pm_token')}`
                },
                body: JSON.stringify({ userId })
            });

            const chat = await response.json();
            
            // Close modal and open chat
            document.querySelector('.modal').remove();
            this.openChat(chat.id);
        } catch (error) {
            console.error('Failed to create chat:', error);
        }
    }
};