// modules/_load_modules.js
import chatgptConfig from './chatgpt/module_config.js';
import anotherSiteConfig from './another_site/module_config.js'; // مثال برای سایت دیگر

const allModules = {
  // از اولین دامنه به عنوان کلید اصلی استفاده می‌کنیم یا یک شناسه یکتا می‌سازیم
  [chatgptConfig.domains[0]]: chatgptConfig,
  [anotherSiteConfig.domains[0]]: anotherSiteConfig,
  // ... ماژول‌های دیگر به همین ترتیب import و اضافه می‌شوند
};

export default allModules;