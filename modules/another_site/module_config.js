// modules/chatgpt/module_config.js
export default {
    domains: ["chat.openai.com", "ask.ai"], // دامنه‌هایی که این ماژول پشتیبانی می‌کند
    name: "ChatGPT & Ask.ai",
    js: ["modules/chatgpt/chatgpt.js"],
    css: ["modules/common/common.css", "modules/chatgpt/chatgpt.css"],
    enabled: true,
    // onDOMContentLoaded: true (اختیاری)
  };