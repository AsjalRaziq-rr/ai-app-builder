const { GoogleGenerativeAI } = require('@google/generative-ai');
const OpenAI = require('openai');

class AIService {
  constructor() {
    this.agentMode = false;
    this.chatHistory = [];
    this.selectedModel = 'gemini';
    
    // Initialize AI clients
    this.genai = new GoogleGenerativeAI('AIzaSyDO1JK-WAkSOjafV3cC5KCXt-DQdpB-T5U');
    this.openrouter = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: "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"
    });
  }

  async processMessage(message, project) {
    if (this.agentMode) {
      return await this.executeTools(message, project);
    } else {
      return await this.normalChat(message);
    }
  }

  async normalChat(message) {
    const prompt = `You are a helpful AI assistant. Respond naturally to: "${message}"`;
    
    try {
      let response;
      if (this.selectedModel === 'gemini') {
        const model = this.genai.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(prompt);
        response = result.response.text();
      } else if (this.selectedModel === 'qwen') {
        const completion = await this.openrouter.chat.completions.create({
          model: "qwen/qwen3-coder:free",
          messages: [{ role: "user", content: prompt }]
        });
        response = completion.choices[0].message.content;
      } else if (this.selectedModel === 'mistral') {
        const completion = await this.openrouter.chat.completions.create({
          model: "mistralai/codestral-latest",
          messages: [{ role: "user", content: prompt }]
        });
        response = completion.choices[0].message.content;
      }

      return { type: 'chat', content: response };
    } catch (error) {
      return { type: 'chat', content: `Error: ${error.message}` };
    }
  }

  async executeTools(message, project) {
    const decision = await this.decideTools(message, project);
    const results = [];
    
    if (!Array.isArray(decision)) {
      return { type: 'chat', content: 'Invalid tool decision format' };
    }

    for (const tool of decision) {
      try {
        switch (tool.tool) {
          case 'create_file':
            project.files[tool.params.file_path] = tool.params.content;
            project.activeFile = tool.params.file_path;
            results.push(`Created ${tool.params.file_path}`);
            break;
          case 'read_file':
            const content = project.files[tool.params.file_path] || 'File not found';
            results.push(`Read ${tool.params.file_path}: ${content.substring(0, 100)}...`);
            break;
          case 'update_file':
            if (project.files[tool.params.file_path]) {
              project.files[tool.params.file_path] = tool.params.content;
              results.push(`Updated ${tool.params.file_path}`);
            } else {
              results.push(`File ${tool.params.file_path} not found`);
            }
            break;
          case 'list_files':
            const fileList = Object.keys(project.files);
            results.push(`Files: ${fileList.join(', ')}`);
            break;
          default:
            results.push(`Unknown tool: ${tool.tool}`);
        }
      } catch (error) {
        results.push(`Error executing ${tool.tool}: ${error.message}`);
      }
    }

    return {
      type: 'tools',
      decision,
      results,
      project
    };
  }

  async decideTools(message, project) {
    const context = Object.keys(project.files).length > 0 
      ? `Current files: ${Object.keys(project.files).join(', ')}\n` 
      : '';

    const prompt = `${context}You are an autonomous app builder. Available tools:
- create_file(file_path, content) - Create new files
- read_file(file_path) - Read existing files  
- update_file(file_path, content) - Update existing files
- list_files() - List all files

CRITICAL: Respond ONLY with valid JSON array. No explanations.

Examples:
[{"tool": "create_file", "params": {"file_path": "index.html", "content": "<!DOCTYPE html><html><head><title>App</title></head><body><h1>Hello</h1></body></html>"}}]

[{"tool": "create_file", "params": {"file_path": "index.html", "content": "..."}}, {"tool": "create_file", "params": {"file_path": "style.css", "content": "body{font-family:Arial;}"}}]

User: "${message}"`;

    try {
      let response;
      if (this.selectedModel === 'gemini') {
        const model = this.genai.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(prompt);
        response = result.response.text();
      } else if (this.selectedModel === 'qwen') {
        const completion = await this.openrouter.chat.completions.create({
          model: "qwen/qwen3-coder:free",
          messages: [{ role: "user", content: prompt }]
        });
        response = completion.choices[0].message.content;
      } else if (this.selectedModel === 'mistral') {
        const completion = await this.openrouter.chat.completions.create({
          model: "mistralai/codestral-latest",
          messages: [{ role: "user", content: prompt }]
        });
        response = completion.choices[0].message.content;
      }

      // Clean and parse JSON
      let cleanResponse = response.trim();
      if (cleanResponse.includes('```json')) {
        cleanResponse = cleanResponse.split('```json')[1].split('```')[0].trim();
      } else if (cleanResponse.includes('```')) {
        cleanResponse = cleanResponse.split('```')[1].split('```')[0].trim();
      }

      // Find JSON boundaries
      const start = cleanResponse.search(/[\[{]/);
      if (start === -1) throw new Error('No JSON found');
      
      let brackets = 0;
      let end = cleanResponse.length;
      for (let i = start; i < cleanResponse.length; i++) {
        if (cleanResponse[i] === '[' || cleanResponse[i] === '{') brackets++;
        if (cleanResponse[i] === ']' || cleanResponse[i] === '}') brackets--;
        if (brackets === 0) {
          end = i + 1;
          break;
        }
      }

      const jsonStr = cleanResponse.substring(start, end);
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error('Tool decision error:', error);
      return [{ tool: 'create_file', params: { file_path: 'error.txt', content: `Error: ${error.message}` } }];
    }
  }

  toggleMode() {
    this.agentMode = !this.agentMode;
    return this.agentMode;
  }

  switchModel(model) {
    this.selectedModel = model;
    return model;
  }
}

module.exports = AIService;