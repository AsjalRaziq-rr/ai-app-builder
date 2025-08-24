const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const AIService = require('./services/aiService');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const aiService = new AIService();

// Serve main app
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handle favicon
app.get('/favicon.ico', (req, res) => {
  res.status(204).send();
});

// Health check for deployment
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Socket connection
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  let userProject = {
    files: {},
    activeFile: null
  };

  // Send initial connection confirmation
  socket.emit('connected', { status: 'Connected to AI App Builder' });

  socket.on('sendMessage', async (data) => {
    console.log('Received message:', data.message);
    try {
      const response = await aiService.processMessage(data.message, userProject);
      
      if (response.type === 'tools') {
        userProject = response.project;
        socket.emit('projectUpdate', userProject);
        socket.emit('aiResponse', {
          type: 'tools',
          message: `Executed ${response.results.length} tools`,
          tools: response.decision,
          results: response.results
        });
      } else {
        socket.emit('aiResponse', {
          type: 'chat',
          message: response.content
        });
      }
    } catch (error) {
      console.error('Message processing error:', error);
      socket.emit('aiResponse', {
        type: 'error',
        message: `Error: ${error.message}`
      });
    }
  });

  socket.on('toggleAgent', () => {
    aiService.toggleMode();
    socket.emit('agentModeChanged', aiService.agentMode);
    console.log('Agent mode toggled:', aiService.agentMode);
  });

  socket.on('switchModel', (model) => {
    aiService.switchModel(model);
    socket.emit('modelChanged', model);
    console.log('Model switched to:', model);
  });

  socket.on('updateFile', (data) => {
    userProject.files[data.fileName] = data.content;
    userProject.activeFile = data.fileName;
    socket.emit('projectUpdate', userProject);
  });

  socket.on('disconnect', (reason) => {
    console.log('User disconnected:', socket.id, 'Reason:', reason);
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

// Handle server errors
server.on('error', (error) => {
  console.error('Server error:', error);
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 AI App Builder running on http://localhost:${PORT}`);
  console.log(`📁 Open your browser and go to: http://localhost:${PORT}`);
  console.log(`🤖 Features: Gemini, Qwen Coder, Mistral models available`);
  console.log(`🔧 Agent Mode: Toggle to enable autonomous app building`);
});
