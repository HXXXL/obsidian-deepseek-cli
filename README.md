# DeepSeek CLI Chat

An Obsidian plugin that lets you chat with DeepSeek models, supporting both Anthropic and OpenAI-compatible APIs.

## Features

- 🐋 Chat with DeepSeek models directly in Obsidian
- 📝 History sidebar — toggle to browse and switch between conversations
- 🌐 Supports Anthropic protocol and OpenAI-compatible APIs
- ✨ Markdown rendering, code blocks with copy buttons
- 🔄 Regenerate, copy, and delete messages
- 🗂️ Context files — attach vault files for AI context
- 📋 Plan mode — AI outlines approach before executing
- ✨ Polish prompt — AI improves your prompts
- 🔒 Permission modes — read-only / read-write
- 📊 Token tracking — per-message and total token counts

## Installation

### Manual

1. Download `main.js`, `manifest.json`, and `styles.css`
2. Copy them to `.obsidian/plugins/deepseek-cli/` in your vault
3. Enable the plugin in Obsidian Settings → Community Plugins

## Configuration

1. Open Obsidian Settings → DeepSeek CLI Chat
2. Set your **Provider Type** (Anthropic or OpenAI)
3. Set the **Base URL** (e.g., `https://api.deepseek.com/anthropic`)
4. Enter your **API Key**
5. Choose the **Model**

## Usage

- Use the command `DeepSeek CLI Chat: Open` or click the bot icon in the ribbon
- **History**: Click the clock icon in the header to toggle the conversation sidebar
- **Model**: Select the model from the dropdown in the header
- **+ Menu**: Access context files, plan mode, polish prompt, and permission toggles

## License

MIT
