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
  }
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

// Socket connection
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  let userProject = {
    files: {},
    activeFile: null
  };

  socket.on('sendMessage', async (data) => {
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
      socket.emit('aiResponse', {
        type: 'error',
        message: `Error: ${error.message}`
      });
    }
  });

  socket.on('toggleAgent', () => {
    aiService.toggleMode();
    socket.emit('agentModeChanged', aiService.agentMode);
  });

  socket.on('switchModel', (model) => {
    aiService.switchModel(model);
    socket.emit('modelChanged', model);
  });

  socket.on('updateFile', (data) => {
    userProject.files[data.fileName] = data.content;
    userProject.activeFile = data.fileName;
    socket.emit('projectUpdate', userProject);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 AI App Builder running on http://localhost:${PORT}`);
  console.log(`📁 Open your browser and go to: http://localhost:${PORT}`);
  console.log(`🤖 Features: Gemini, Qwen Coder, Mistral models available`);
  console.log(`🔧 Agent Mode: Toggle to enable autonomous app building`);
});