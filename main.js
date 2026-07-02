const { Plugin, ItemView, Notice, requestUrl, MarkdownRenderer, PluginSettingTab, Setting } = require('obsidian');

const VIEW_TYPE = 'copilot-cli-chat';

// ====== Default settings ======
const DEFAULT_SETTINGS = {
    providerType: 'anthropic',
    baseUrl: 'https://api.deepseek.com/anthropic',
    apiKey: 'sk-14a5e1375ab64630a519aa18ea5a8dcd',
    model: 'deepseek-v4-pro',
};

// ====== Helpers ======
function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
function buildAnthropicHeaders(apiKey) {
    return { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' };
}
function buildOpenAIHeaders(apiKey) {
    return { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' };
}
function toAnthropicMessages(messages) {
    return messages.filter(m => m.content).map(m => ({ role: m.role, content: m.content }));
}
function toOpenAIMessages(messages) {
    return messages.filter(m => m.content).map(m => ({ role: m.role, content: m.content }));
}

// ====== SVG Icons ======
const ICONS = {
    send: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>',
    trash: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>',
    settings: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>',
    history: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
    plus: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>',
    copy: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>',
    refresh: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>',
    trashSmall: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>',
    check: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
    codeCopy: '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>',
    codeCheck: '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
    sidebarOpen: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>',
    sidebarClose: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="9" x2="9" y2="15"></line></svg>',
};

// ====== Chat View ======
class CopilotChatView extends ItemView {
    constructor(leaf, plugin) {
        super(leaf);
        this.plugin = plugin;
    }

    getViewType() { return VIEW_TYPE; }
    getDisplayText() { return 'Copilot CLI'; }
    getIcon() { return 'bot'; }

    async onOpen() {
        const container = this.containerEl.children[1];
        container.empty();
        container.addClass('copilot-cli-container');

        // === Top-level layout: sidebar + main ===
        const layout = container.createDiv('copilot-cli-layout');

        // ---- History Sidebar ----
        this.sidebar = layout.createDiv('copilot-cli-sidebar');
        const sidebarHeader = this.sidebar.createDiv('copilot-cli-sidebar-header');
        sidebarHeader.createSpan({ text: 'History', cls: 'copilot-cli-sidebar-title' });
        const newChatBtn = sidebarHeader.createEl('button', { cls: 'copilot-cli-new-chat-btn' });
        newChatBtn.innerHTML = ICONS.plus + ' New';
        newChatBtn.addEventListener('click', () => this.newConversation());
        this.convList = this.sidebar.createDiv('copilot-cli-sidebar-list');

        // ---- Main Chat Panel ----
        this.mainPanel = layout.createDiv('copilot-cli-main');

        // Header bar
        this.header = this.mainPanel.createDiv('copilot-cli-header');
        const headerLeft = this.header.createDiv('copilot-cli-header-left');
        this.toggleBtn = headerLeft.createEl('button', { cls: 'copilot-cli-icon-btn', attr: { 'aria-label': 'Show history' } });
        this.toggleBtn.innerHTML = ICONS.history;
        this.toggleBtn.addEventListener('click', () => this.toggleSidebar());
        this.headerStatus = headerLeft.createSpan('copilot-cli-header-status');

        const headerRight = this.header.createDiv('copilot-cli-header-right');
        const clearBtn = headerRight.createEl('button', { cls: 'copilot-cli-icon-btn', attr: { 'aria-label': 'Clear chat' } });
        clearBtn.innerHTML = ICONS.trash;
        clearBtn.addEventListener('click', () => this.clearChat());
        const settingsBtn = headerRight.createEl('button', { cls: 'copilot-cli-icon-btn', attr: { 'aria-label': 'Settings' } });
        settingsBtn.innerHTML = ICONS.settings;
        settingsBtn.addEventListener('click', () => {
            this.app.setting.open();
            this.app.setting.openTabById('copilot-cli');
        });

        // Chat area
        this.chatArea = this.mainPanel.createDiv('copilot-cli-chat');

        // Loading indicator
        this.loadingEl = this.mainPanel.createDiv('copilot-cli-loading');
        this.loadingEl.createDiv('copilot-cli-loading-dot');
        this.loadingEl.createDiv('copilot-cli-loading-dot');
        this.loadingEl.createDiv('copilot-cli-loading-dot');
        this.loadingEl.style.display = 'none';

        // Input area
        const inputArea = this.mainPanel.createDiv('copilot-cli-input-area');
        const inputRow = inputArea.createDiv('copilot-cli-input-row');
        this.inputEl = inputRow.createEl('textarea', {
            placeholder: 'Ask Copilot...',
            cls: 'copilot-cli-input',
            attr: { rows: '2' }
        });
        this.sendBtn = inputRow.createEl('button', { cls: 'copilot-cli-send-btn' });
        this.sendBtn.innerHTML = ICONS.send;
        this.sendBtn.addEventListener('click', () => this.sendMessage());

        this.inputEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        this.inputEl.addEventListener('input', () => {
            this.inputEl.style.height = 'auto';
            this.inputEl.style.height = Math.min(this.inputEl.scrollHeight, 120) + 'px';
        });

        // Load state
        this.conversation = this.plugin.getActiveConversation();
        this.sidebarVisible = false;
        this.sidebar.style.display = 'none';
        this.renderSidebar();
        this.renderAllMessages();
        this.updateStatus();
        this.scrollToBottom();
    }

    async onClose() {
        await this.plugin.saveDataFull();
    }

    // ===== Sidebar =====
    toggleSidebar() {
        this.sidebarVisible = !this.sidebarVisible;
        this.sidebar.style.display = this.sidebarVisible ? 'flex' : 'none';
        if (this.toggleBtn) {
            this.toggleBtn.innerHTML = this.sidebarVisible ? ICONS.sidebarClose : ICONS.history;
            this.toggleBtn.setAttribute('aria-label', this.sidebarVisible ? 'Hide history' : 'Show history');
            if (this.sidebarVisible) {
                this.toggleBtn.addClass('copilot-cli-toggle-active');
            } else {
                this.toggleBtn.removeClass('copilot-cli-toggle-active');
            }
        }
    }

    renderSidebar() {
        this.convList.empty();
        const conversations = this.plugin.conversations || [];
        const activeId = this.conversation?.id;

        conversations.forEach(conv => {
            const item = this.convList.createDiv('copilot-cli-sidebar-item');
            if (conv.id === activeId) item.addClass('copilot-cli-sidebar-item-active');

            const info = item.createDiv('copilot-cli-sidebar-item-info');
            info.createDiv({ text: conv.title || 'New Chat', cls: 'copilot-cli-sidebar-item-title' });
            info.createDiv({ text: this.formatTime(new Date(conv.updatedAt)), cls: 'copilot-cli-sidebar-item-time' });

            item.addEventListener('click', () => this.switchConversation(conv.id));

            // Delete button
            const delBtn = item.createEl('button', { cls: 'copilot-cli-sidebar-del-btn', attr: { 'aria-label': 'Delete' } });
            delBtn.innerHTML = ICONS.trashSmall;
            delBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteConversation(conv.id);
            });
        });
    }

    // ===== Conversation Management =====
    async newConversation() {
        this.conversation = this.plugin.createConversation();
        this.renderSidebar();
        this.renderAllMessages();
        this.updateStatus();
        await this.plugin.saveDataFull();
    }

    async switchConversation(id) {
        await this.plugin.saveDataFull();
        const conv = this.plugin.conversations.find(c => c.id === id);
        if (!conv) return;
        this.conversation = conv;
        this.plugin.activeConversationId = id;
        this.renderSidebar();
        this.renderAllMessages();
        this.updateStatus();
        this.scrollToBottom();
        await this.plugin.saveDataFull();
    }

    async deleteConversation(id) {
        this.plugin.conversations = this.plugin.conversations.filter(c => c.id !== id);
        if (this.plugin.activeConversationId === id) {
            if (this.plugin.conversations.length > 0) {
                this.plugin.activeConversationId = this.plugin.conversations[0].id;
                this.conversation = this.plugin.conversations[0];
            } else {
                this.conversation = this.plugin.createConversation();
            }
        }
        this.renderSidebar();
        this.renderAllMessages();
        this.updateStatus();
        await this.plugin.saveDataFull();
    }

    async clearChat() {
        if (!this.conversation) return;
        this.conversation.messages = [];
        this.conversation.title = '';
        this.conversation.totalTokens = 0;
        this.renderAllMessages();
        this.updateStatus();
        await this.plugin.saveDataFull();
    }

    // ===== Header / Status =====
    updateStatus() {
        this.headerStatus.empty();
        const s = this.plugin.settings;
        const isConfigured = s.apiKey && s.baseUrl && s.model;
        if (isConfigured) {
            const label = s.providerType === 'anthropic' ? 'Anthropic' : 'OpenAI';
            this.headerStatus.setText(`✨ ${label} · ${s.model}`);
        } else {
            this.headerStatus.setText('⚠ Configure API settings');
        }
    }

    // ===== Message Rendering =====
    renderAllMessages() {
        this.chatArea.empty();
        const messages = this.conversation?.messages || [];
        if (messages.length === 0) {
            this.renderWelcome();
            return;
        }
        messages.forEach(msg => this.renderMessage(msg));
    }

    renderWelcome() {
        const welcome = this.chatArea.createDiv('copilot-cli-welcome');
        welcome.createEl('div', { cls: 'copilot-cli-welcome-icon', text: '🤖' });
        welcome.createEl('h3', { text: 'Copilot CLI Chat' });
        welcome.createEl('p', { text: `Connected via ${this.plugin.settings.providerType === 'anthropic' ? 'Anthropic protocol' : 'OpenAI protocol'} · ${this.plugin.settings.model}` });
        const hints = welcome.createDiv('copilot-cli-welcome-hints');
        hints.createEl('div', { text: '💡 Ask questions about your notes', cls: 'copilot-cli-hint' });
        hints.createEl('div', { text: '✏️ Get help with writing and editing', cls: 'copilot-cli-hint' });
        hints.createEl('div', { text: '💻 Get code explanations and snippets', cls: 'copilot-cli-hint' });
    }

    renderMessage(msg) {
        const wrapper = this.chatArea.createDiv(`copilot-cli-msg copilot-cli-msg-${msg.role}`);

        // Header
        const msgHeader = wrapper.createDiv('copilot-cli-msg-header');
        const avatar = msgHeader.createDiv('copilot-cli-avatar');
        if (msg.role === 'user') {
            avatar.createSpan({ text: '👤', cls: 'copilot-cli-avatar-icon' });
            msgHeader.createSpan({ text: 'You', cls: 'copilot-cli-msg-name' });
        } else {
            avatar.createSpan({ text: '🤖', cls: 'copilot-cli-avatar-icon' });
            msgHeader.createSpan({ text: 'Copilot', cls: 'copilot-cli-msg-name' });
            if (msg.model) msgHeader.createSpan({ text: msg.model, cls: 'copilot-cli-model-tag' });
        }
        if (msg.timestamp) msgHeader.createSpan({ text: this.formatTime(new Date(msg.timestamp)), cls: 'copilot-cli-msg-time' });

        // Body
        const body = wrapper.createDiv('copilot-cli-msg-body');
        const content = body.createDiv('copilot-cli-msg-content');
        if (msg.role === 'assistant' && msg.content) {
            MarkdownRenderer.render(this.app, msg.content, content, '', this.plugin);
            // add code copy buttons after render (next tick)
            setTimeout(() => this.addCodeCopyButtons(body), 0);
        } else {
            content.setText(msg.content);
        }

        // Action buttons for assistant
        if (msg.role === 'assistant' && msg.content && !msg.content.startsWith('**Error:**')) {
            const actions = wrapper.createDiv('copilot-cli-msg-actions');
            this.createActionBtn(actions, ICONS.copy, 'Copy', () => this.copyMessageContent(msg.content));
            this.createActionBtn(actions, ICONS.refresh, 'Regenerate', () => this.regenerateMessage(msg));
            this.createActionBtn(actions, ICONS.trashSmall, 'Delete', () => this.deleteMessage(msg));
        }
    }

    createActionBtn(container, iconHtml, tooltip, onClick) {
        const btn = container.createEl('button', { cls: 'copilot-cli-action-btn', attr: { 'aria-label': tooltip } });
        btn.innerHTML = iconHtml;
        btn.addEventListener('click', () => onClick());
    }

    formatTime(date) {
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();
        if (isToday) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }

    addCodeCopyButtons(container) {
        const preEls = container.querySelectorAll('pre');
        preEls.forEach(pre => {
            if (pre.closest('.copilot-cli-code-block')) return;
            const wrapper = document.createElement('div');
            wrapper.className = 'copilot-cli-code-block';
            pre.parentNode.insertBefore(wrapper, pre);
            wrapper.appendChild(pre);

            const codeEl = pre.querySelector('code');
            let lang = '';
            if (codeEl) {
                const cls = codeEl.className.match(/language-(\w+)/);
                if (cls) lang = cls[1];
            }

            const header = document.createElement('div');
            header.className = 'copilot-cli-code-header';
            const langLabel = document.createElement('span');
            langLabel.className = 'copilot-cli-code-lang';
            langLabel.textContent = lang || 'code';
            header.appendChild(langLabel);

            const copyBtn = document.createElement('button');
            copyBtn.className = 'copilot-cli-code-copy-btn';
            copyBtn.innerHTML = ICONS.codeCopy + ' Copy';
            copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(pre.textContent || '').then(() => {
                    copyBtn.innerHTML = ICONS.codeCheck + ' Copied';
                    setTimeout(() => { copyBtn.innerHTML = ICONS.codeCopy + ' Copy'; }, 2000);
                });
            });
            header.appendChild(copyBtn);
            wrapper.insertBefore(header, pre);
        });
    }

    // ===== Message Actions =====
    async copyMessageContent(content) {
        await navigator.clipboard.writeText(content);
        new Notice('Copied');
    }

    async regenerateMessage(msg) {
        const messages = this.conversation.messages;
        const idx = messages.indexOf(msg);
        if (idx === -1) return;
        this.conversation.messages = messages.slice(0, idx);
        await this.plugin.saveDataFull();
        this.renderAllMessages();
        this.scrollToBottom();
        const lastUser = messages.filter(m => m.role === 'user').pop();
        if (lastUser) {
            this.inputEl.value = lastUser.content;
            this.sendMessage();
        }
    }

    async deleteMessage(msg) {
        const idx = this.conversation.messages.indexOf(msg);
        if (idx === -1) return;
        this.conversation.messages.splice(idx, 1);
        await this.plugin.saveDataFull();
        this.renderAllMessages();
        this.updateStatus();
        this.scrollToBottom();
    }

    // ===== Send Message =====
    scrollToBottom() {
        setTimeout(() => { this.chatArea.scrollTop = this.chatArea.scrollHeight; }, 50);
    }

    showLoading() { this.loadingEl.style.display = 'flex'; this.scrollToBottom(); }
    hideLoading() { this.loadingEl.style.display = 'none'; }

    async sendMessage() {
        const text = this.inputEl.value.trim();
        if (!text) return;
        const s = this.plugin.settings;
        if (!s.apiKey || !s.baseUrl) {
            new Notice('Please configure API settings.');
            return;
        }

        this.inputEl.value = '';
        this.inputEl.style.height = 'auto';
        this.sendBtn.disabled = true;

        // Ensure conversation exists
        if (!this.conversation) this.conversation = this.plugin.createConversation();

        // Set title from first message
        if (!this.conversation.title) {
            this.conversation.title = text.slice(0, 50) + (text.length > 50 ? '...' : '');
        }

        // Remove welcome
        const welcomeEl = this.chatArea.querySelector('.copilot-cli-welcome');
        if (welcomeEl) welcomeEl.remove();

        // Append user message
        const userMsg = { role: 'user', content: text, timestamp: Date.now() };
        this.conversation.messages.push(userMsg);
        this.renderMessage(userMsg);
        this.scrollToBottom();

        this.showLoading();

        const assistantMsg = { role: 'assistant', content: '', model: s.model, timestamp: Date.now() };

        try {
            let response, data;
            const apiMessages = this.conversation.messages.filter(m => m.content);

            if (s.providerType === 'anthropic') {
                response = await requestUrl({
                    url: s.baseUrl.replace(/\/$/, '') + '/v1/messages',
                    method: 'POST',
                    headers: buildAnthropicHeaders(s.apiKey),
                    body: JSON.stringify({ model: s.model, max_tokens: 4096, messages: toAnthropicMessages(apiMessages), stream: false }),
                });
                data = response.json;
                assistantMsg.content = data.content?.map(c => c.text).join('') || '';
            } else {
                response = await requestUrl({
                    url: s.baseUrl.replace(/\/$/, '') + '/v1/chat/completions',
                    method: 'POST',
                    headers: buildOpenAIHeaders(s.apiKey),
                    body: JSON.stringify({ model: s.model, messages: toOpenAIMessages(apiMessages), stream: false, temperature: 0.7 }),
                });
                data = response.json;
                assistantMsg.content = data.choices?.[0]?.message?.content || '';
            }
            if (!assistantMsg.content) assistantMsg.content = '_(empty response)_';
        } catch (err) {
            assistantMsg.content = `**Error:** ${err.message}`;
            console.error('API error:', err);
        }

        this.hideLoading();
        assistantMsg.timestamp = Date.now();
        this.conversation.messages.push(assistantMsg);
        this.conversation.updatedAt = Date.now();
        this.renderMessage(assistantMsg);
        this.scrollToBottom();

        this.sendBtn.disabled = false;
        this.renderSidebar();
        this.plugin.activeConversationId = this.conversation.id;
        await this.plugin.saveDataFull();
    }
}

// ====== Settings Tab ======
class CopilotCLISettingTab extends PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display() {
        const { containerEl } = this;
        containerEl.empty();
        containerEl.createEl('h2', { text: 'Copilot CLI Chat Settings' });
        containerEl.createEl('p', { text: 'Configure the API provider. These settings should match your Copilot CLI environment variables.', cls: 'setting-item-description' });

        new Setting(containerEl)
            .setName('Protocol')
            .setDesc('Anthropic for DeepSeek Anthropic API, OpenAI for OpenAI-compatible APIs')
            .addDropdown(d => d.addOption('anthropic', 'Anthropic').addOption('openai', 'OpenAI')
                .setValue(this.plugin.settings.providerType)
                .onChange(async v => { this.plugin.settings.providerType = v; await this.plugin.saveSettings(); }));

        new Setting(containerEl)
            .setName('Base URL').setDesc('API base URL (e.g. https://api.deepseek.com/anthropic)')
            .addText(t => t.setPlaceholder('https://api.deepseek.com/anthropic').setValue(this.plugin.settings.baseUrl)
                .onChange(async v => { this.plugin.settings.baseUrl = v; await this.plugin.saveSettings(); }));

        new Setting(containerEl)
            .setName('API Key').setDesc('Your API key')
            .addText(t => {
                t.setPlaceholder('sk-...').setValue(this.plugin.settings.apiKey)
                    .onChange(async v => { this.plugin.settings.apiKey = v; await this.plugin.saveSettings(); });
                t.inputEl.type = 'password';
                t.inputEl.addClass('copilot-cli-api-key-input');
            })
            .addExtraButton(btn => btn.setIcon('eye').setTooltip('Show API key').onClick(() => {
                const inputEl = containerEl.querySelector('.copilot-cli-api-key-input');
                const isPw = inputEl.type === 'password';
                inputEl.type = isPw ? 'text' : 'password';
                btn.setIcon(isPw ? 'eye-off' : 'eye');
                btn.setTooltip(isPw ? 'Hide API key' : 'Show API key');
            }));

        new Setting(containerEl)
            .setName('Model').setDesc('Model name (e.g. deepseek-v4-pro)')
            .addText(t => t.setPlaceholder('deepseek-v4-pro').setValue(this.plugin.settings.model)
                .onChange(async v => { this.plugin.settings.model = v; await this.plugin.saveSettings(); }));

        containerEl.createEl('hr');
        containerEl.createEl('p', { text: 'Tip: Your Copilot CLI settings come from ~/.zshrc environment variables (COPILOT_PROVIDER_TYPE, COPILOT_PROVIDER_BASE_URL, COPILOT_PROVIDER_API_KEY, COPILOT_MODEL). Keep them in sync.', cls: 'setting-item-description' });
    }
}

// ====== Plugin ======
class CopilotCLIPlugin extends Plugin {
    async onload() {
        console.log('Loading Copilot CLI Chat plugin');
        await this.loadSettings();
        this.conversations = [];
        this.activeConversationId = null;
        await this.loadConversations();

        this.addSettingTab(new CopilotCLISettingTab(this.app, this));
        this.registerView(VIEW_TYPE, (leaf) => new CopilotChatView(leaf, this));

        this.addRibbonIcon('bot', 'Open Copilot CLI Chat', () => this.activateView());
        this.addCommand({ id: 'open-copilot-cli-chat', name: 'Open Copilot CLI Chat', callback: () => this.activateView() });

        this.app.workspace.onLayoutReady(() => this.activateView());
    }

    async onunload() { console.log('Unloading Copilot CLI Chat plugin'); }

    // ===== Settings =====
    async loadSettings() {
        const data = await this.loadData();
        this.settings = Object.assign({}, DEFAULT_SETTINGS);
        if (data) {
            this.conversations = data.conversations || [];
            this.activeConversationId = data.activeConversationId || null;
            for (const key of Object.keys(DEFAULT_SETTINGS)) {
                if (key in data) this.settings[key] = data[key];
            }
        }
    }

    async saveSettings() {
        await this.saveDataFull();
        const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE);
        for (const leaf of leaves) {
            if (leaf.view instanceof CopilotChatView) leaf.view.updateStatus();
        }
    }

    // ===== Conversations =====
    async loadConversations() {
        const data = await this.loadData();
        if (data) {
            this.conversations = data.conversations || [];
            this.activeConversationId = data.activeConversationId || null;
        }
    }

    async saveDataFull() {
        await this.saveData({
            conversations: this.conversations,
            activeConversationId: this.activeConversationId,
            ...this.settings,
        });
    }

    createConversation() {
        const conv = {
            id: uid(),
            title: '',
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
        this.conversations.unshift(conv);
        this.activeConversationId = conv.id;
        return conv;
    }

    getActiveConversation() {
        if (!this.activeConversationId && this.conversations.length > 0) {
            this.activeConversationId = this.conversations[0].id;
        }
        if (!this.activeConversationId) return null;
        return this.conversations.find(c => c.id === this.activeConversationId) || null;
    }

    async activateView() {
        const { workspace } = this.app;
        let leaf = workspace.getLeavesOfType(VIEW_TYPE)[0];
        if (!leaf) {
            leaf = workspace.getRightLeaf(false);
            await leaf.setViewState({ type: VIEW_TYPE, active: true });
        }
        workspace.revealLeaf(leaf);
    }
}

module.exports = CopilotCLIPlugin;
