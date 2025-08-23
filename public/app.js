class AIAppBuilder {
    constructor() {
        this.socket = io();
        this.project = { files: {}, activeFile: null };
        this.agentMode = false;
        this.selectedModel = 'gemini';
        
        this.initializeElements();
        this.setupEventListeners();
        this.setupSocketListeners();
    }

    initializeElements() {
        this.elements = {
            agentToggle: document.getElementById('agentToggle'),
            modelSelect: document.getElementById('modelSelect'),
            messageInput: document.getElementById('messageInput'),
            sendBtn: document.getElementById('sendBtn'),
            chatMessages: document.getElementById('chatMessages'),
            fileList: document.getElementById('fileList'),
            codeEditor: document.getElementById('codeEditor'),
            activeFileName: document.getElementById('activeFileName'),
            previewFrame: document.getElementById('previewFrame'),
            refreshPreview: document.getElementById('refreshPreview')
        };
    }

    setupEventListeners() {
        // Agent toggle
        this.elements.agentToggle.addEventListener('click', () => {
            this.socket.emit('toggleAgent');
        });

        // Model selection
        this.elements.modelSelect.addEventListener('change', (e) => {
            this.socket.emit('switchModel', e.target.value);
        });

        // Send message
        this.elements.sendBtn.addEventListener('click', () => {
            this.sendMessage();
        });

        this.elements.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        // Code editor
        this.elements.codeEditor.addEventListener('input', () => {
            if (this.project.activeFile) {
                this.project.files[this.project.activeFile] = this.elements.codeEditor.value;
                this.socket.emit('updateFile', {
                    fileName: this.project.activeFile,
                    content: this.elements.codeEditor.value
                });
                this.updatePreview();
            }
        });

        // Refresh preview
        this.elements.refreshPreview.addEventListener('click', () => {
            this.updatePreview();
        });
    }

    setupSocketListeners() {
        this.socket.on('aiResponse', (data) => {
            this.addMessage(data, 'ai');
        });

        this.socket.on('projectUpdate', (project) => {
            this.project = project;
            this.updateFileList();
            this.updatePreview();
        });

        this.socket.on('agentModeChanged', (agentMode) => {
            this.agentMode = agentMode;
            this.elements.agentToggle.textContent = `Agent: ${agentMode ? 'ON' : 'OFF'}`;
            this.elements.agentToggle.className = agentMode ? 'btn agent-on' : 'btn';
        });

        this.socket.on('modelChanged', (model) => {
            this.selectedModel = model;
            this.elements.modelSelect.value = model;
        });
    }

    sendMessage() {
        const message = this.elements.messageInput.value.trim();
        if (!message) return;

        this.addMessage({ message, type: 'chat' }, 'user');
        this.socket.emit('sendMessage', { message });
        this.elements.messageInput.value = '';
    }

    addMessage(data, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;

        if (data.type === 'tools') {
            messageDiv.className = 'message tools';
            messageDiv.innerHTML = `
                <div><strong>🔧 ${data.message}</strong></div>
                <div class="tools-executed">
                    ${data.tools.map(tool => `• ${tool.tool}: ${tool.params.file_path || 'N/A'}`).join('<br>')}
                </div>
            `;
        } else {
            messageDiv.textContent = sender === 'user' ? `You: ${data.message}` : `AI: ${data.message}`;
        }

        this.elements.chatMessages.appendChild(messageDiv);
        this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
    }

    updateFileList() {
        const fileList = this.elements.fileList;
        const files = Object.keys(this.project.files);

        if (files.length === 0) {
            fileList.innerHTML = '<div class="no-files">No files yet. Start building!</div>';
            return;
        }

        fileList.innerHTML = files.map(fileName => `
            <div class="file-item ${fileName === this.project.activeFile ? 'active' : ''}" 
                 onclick="appBuilder.selectFile('${fileName}')">
                📄 ${fileName}
            </div>
        `).join('');
    }

    selectFile(fileName) {
        this.project.activeFile = fileName;
        this.elements.activeFileName.textContent = fileName;
        this.elements.codeEditor.value = this.project.files[fileName] || '';
        this.updateFileList();
    }

    updatePreview() {
        const htmlFile = this.project.files['index.html'];
        if (!htmlFile) return;

        let html = htmlFile;
        const css = this.project.files['style.css'] || '';
        const js = this.project.files['script.js'] || this.project.files['app.js'] || '';

        // Inject CSS and JS into HTML
        if (css && !html.includes('<style>')) {
            html = html.replace('</head>', `<style>${css}</style></head>`);
        }
        if (js && !html.includes('<script>')) {
            html = html.replace('</body>', `<script>${js}</script></body>`);
        }

        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        this.elements.previewFrame.src = url;
    }
}

// Initialize the app
const appBuilder = new AIAppBuilder();