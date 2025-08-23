# 🤖 AI App Builder

An autonomous web application builder powered by AI that creates complete apps through natural language conversation.

## Features

- **Autonomous Building**: Describe what you want, AI builds it automatically
- **Real-time Preview**: See your app come to life as it's being built
- **Multi-Model Support**: Choose between Gemini, Qwen Coder, or Mistral
- **Agent Mode**: Toggle between normal chat and autonomous building
- **Live Editing**: Edit code and see changes instantly
- **File Management**: Full project structure with multiple files

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start the Server**
   ```bash
   npm start
   ```

3. **Open Browser**
   ```
   http://localhost:3001
   ```

## How to Use

### Normal Mode
- Chat with AI like a regular assistant
- Ask questions, get explanations
- No file operations

### Agent Mode (Click "Agent: OFF" to enable)
- AI can create and modify files
- Builds complete applications
- Shows tool execution in real-time

### Example Commands

**Simple Apps:**
- "Build a todo app"
- "Create a calculator"
- "Make a weather dashboard"

**Modifications:**
- "Add dark mode"
- "Make it responsive"
- "Add animations"

**Complex Apps:**
- "Build a chat application with real-time messaging"
- "Create a portfolio website with multiple pages"
- "Make a game with score tracking"

## Architecture

```
├── server.js              # Express server with Socket.IO
├── services/
│   └── aiService.js       # AI model integration
├── public/
│   ├── index.html         # Main interface
│   ├── style.css          # UI styling
│   └── app.js             # Frontend logic
└── package.json           # Dependencies
```

## AI Models

- **Gemini**: Google's latest model, great for creative apps
- **Qwen Coder**: Specialized coding model via OpenRouter
- **Mistral**: Fast and efficient for quick prototypes

## Tools Available to AI

- `create_file(file_path, content)` - Create new files
- `read_file(file_path)` - Read existing files
- `update_file(file_path, content)` - Modify files
- `list_files()` - Show all project files

## Development

```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

## Examples

The AI can build:
- **Frontend Apps**: HTML/CSS/JS applications
- **Interactive Games**: Canvas-based games
- **Dashboards**: Data visualization apps
- **Utilities**: Calculators, converters, tools
- **Websites**: Multi-page sites with navigation

## Tips

1. **Be Specific**: "Build a todo app with drag-and-drop" vs "Make an app"
2. **Iterate**: Ask for modifications after initial build
3. **Use Agent Mode**: Enable for autonomous building
4. **Check Preview**: Live preview updates automatically
5. **Edit Code**: Manual editing is supported alongside AI

## Troubleshooting

- **No Preview**: Make sure `index.html` exists
- **AI Errors**: Check API keys in `services/aiService.js`
- **Connection Issues**: Restart server and refresh browser

Built with ❤️ for autonomous app development!