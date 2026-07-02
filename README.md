# GitHub Copilot CLI Chat

An Obsidian plugin that lets you chat with GitHub Copilot using the Copilot CLI API, supporting both Anthropic and OpenAI-compatible providers (like DeepSeek).

## Features

- 🤖 Chat with Copilot models directly in Obsidian
- 📝 History sidebar — toggle to browse and switch between conversations
- 🌐 Supports Anthropic protocol and OpenAI-compatible APIs
- ✨ Markdown rendering, code blocks with copy buttons
- 🔄 Regenerate, copy, and delete messages

## Installation

### Manual

1. Download `main.js`, `manifest.json`, and `styles.css`
2. Copy them to `.obsidian/plugins/copilot-cli/` in your vault
3. Enable the plugin in Obsidian Settings → Community Plugins

## Configuration

1. Open Obsidian Settings → Copilot CLI Chat
2. Set your **Provider Type** (Anthropic or OpenAI)
3. Set the **Base URL** (e.g., `https://api.deepseek.com/anthropic`)
4. Enter your **API Key**
5. Choose the **Model**

## Usage

- Use the command `Copilot CLI Chat: Open` or click the bot icon in the ribbon
- **History**: Click the clock icon in the header to toggle the conversation sidebar
- Start chatting with Copilot in the chat interface

## License

MIT
