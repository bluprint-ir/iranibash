// background.js

// پیکربندی سایت‌های پشتیبانی شده
// کلید: بخشی از URL یا یک شناسه یکتا برای سایت
// مقدار: اطلاعات ماژول مربوط به آن سایت
const supportedSitesConfig = {
    "chat.openai.com": {
      name: "ChatGPT",
      js: ["modules/chatgpt/chatgpt.js"],
      css: ["modules/common/common.css", "modules/chatgpt/chatgpt.css"],
      enabled: true, // وضعیت پیش‌فرض
      // onDOMContentLoaded: true // اگر می‌خواهید زودتر از 'complete' تزریق شود
    }
    // سایت‌های جدید به اینجا اضافه می‌شوند
    // "example.com": {
    //   name: "Example Site",
    //   js: ["modules/example/example.js"],
    //   css: ["modules/common/common.css", "modules/example/example.css"],
    //   enabled: true,
    // }
  };
  
  // --- توابع کمکی ---
  async function getCurrentTab() {
    try {
      let queryOptions = { active: true, currentWindow: true };
      let [tab] = await chrome.tabs.query(queryOptions);
      return tab;
    } catch (error) {
      console.error("Error getting current tab:", error);
      return null;
    }
  }
  
  function getSiteDomainKey(url) {
    if (!url) return null;
    for (const domainKey in supportedSitesConfig) {
      if (url.includes(domainKey)) {
        return domainKey;
      }
    }
    return null;
  }
  
  async function applyModifications(tabId, siteDomainKey) {
    const siteConfig = supportedSitesConfig[siteDomainKey];
    if (!siteConfig) {
      console.warn(`No configuration found for domain key: ${siteDomainKey}`);
      return;
    }
  
    // بررسی اینکه آیا کاربر این سایت را فعال کرده (از storage)
    const siteStorageKey = `siteEnabled_${siteDomainKey}`;
    const data = await chrome.storage.local.get([siteStorageKey]);
    const isEnabledByUser = data[siteStorageKey] !== undefined ? data[siteStorageKey] : siteConfig.enabled;
  
    if (!isEnabledByUser) {
      console.log(`Modifications for ${siteConfig.name} are disabled by the user.`);
      return;
    }
  
    console.log(`Applying modifications for ${siteConfig.name} on tab ${tabId}`);
  
    try {
      // تزریق CSS
      if (siteConfig.css && siteConfig.css.length > 0) {
        const cssFiles = siteConfig.css.map(cssFile => chrome.runtime.getURL(cssFile));
        await chrome.scripting.insertCSS({
          target: { tabId: tabId },
          files: cssFiles
        });
        console.log(`CSS injected for ${siteConfig.name}:`, cssFiles);
      }
  
      // اجرای JS
      if (siteConfig.js && siteConfig.js.length > 0) {
        const jsFiles = siteConfig.js.map(jsFile => chrome.runtime.getURL(jsFile));
        await chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: jsFiles
          // world: "MAIN" // در صورت نیاز به اجرا در کانتکست اصلی صفحه (با احتیاط)
        });
        console.log(`JS executed for ${siteConfig.name}:`, jsFiles);
      }
    } catch (error) {
      console.error(`Failed to apply modifications for ${siteConfig.name} on tab ${tabId}:`, error);
      // اگر به خاطر context invalidation بود، ممکن است تب بسته شده باشد
      if (error.message.includes("Invalid context") || error.message.includes("No tab with id")) {
          console.warn("Tab was likely closed or navigated away before scripting could complete.");
      }
    }
  }
  
  // --- شنوندگان رویداد ---
  
  // 1. هنگام به‌روزرسانی یک تب (تغییر URL یا بارگذاری مجدد)
  chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    // منتظر می‌مانیم تا صفحه کامل لود شود
    if (changeInfo.status === 'complete' && tab.url) {
      const siteDomainKey = getSiteDomainKey(tab.url);
      if (siteDomainKey) {
        console.log(`Site detected: ${supportedSitesConfig[siteDomainKey].name} on tab ${tabId}`);
        await applyModifications(tabId, siteDomainKey);
      }
    }
  });
  
  // 2. هنگام نصب یا آپدیت اکستنشن برای تنظیمات اولیه
  chrome.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === "install") {
      console.log("ایرانی‌ساز سایت‌ها نصب شد.");
      // ذخیره وضعیت پیش‌فرض فعال بودن برای همه سایت‌ها در storage
      const initialSiteStates = {};
      for (const domainKey in supportedSitesConfig) {
        initialSiteStates[`siteEnabled_${domainKey}`] = supportedSitesConfig[domainKey].enabled;
      }
      await chrome.storage.local.set(initialSiteStates);
      console.log("وضعیت اولیه سایت‌ها در storage ذخیره شد.");
    } else if (details.reason === "update") {
      console.log("ایرانی‌ساز سایت‌ها به نسخه " + chrome.runtime.getManifest().version + " به‌روزرسانی شد.");
      // منطق آپدیت تنظیمات: اطمینان از وجود کلیدهای جدید در storage
      const currentStorage = await chrome.storage.local.get(null);
      const updatedSiteStates = {};
      let needsUpdate = false;
      for (const domainKey in supportedSitesConfig) {
        const storageKey = `siteEnabled_${domainKey}`;
        if (currentStorage[storageKey] === undefined) { // اگر سایت جدیدی اضافه شده و در storage نیست
          updatedSiteStates[storageKey] = supportedSitesConfig[domainKey].enabled;
          needsUpdate = true;
        }
      }
      if (needsUpdate) {
        await chrome.storage.local.set(updatedSiteStates);
        console.log("تنظیمات سایت‌های جدید به storage اضافه شد.");
      }
    }
  });
  
  // 3. گوش دادن به پیام‌ها از popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getSiteStatus") {
      (async () => {
        const tab = await getCurrentTab();
        if (tab && tab.url) {
          const domainKey = getSiteDomainKey(tab.url);
          if (domainKey) {
            const siteConfig = supportedSitesConfig[domainKey];
            const siteStorageKey = `siteEnabled_${domainKey}`;
            const data = await chrome.storage.local.get([siteStorageKey]);
            const isEnabled = data[siteStorageKey] !== undefined ? data[siteStorageKey] : siteConfig.enabled;
            sendResponse({ name: siteConfig.name, enabled: isEnabled, domain: domainKey });
          } else {
            sendResponse({ name: null, enabled: false, domain: null });
          }
        } else {
          sendResponse({ name: null, enabled: false, domain: null });
        }
      })();
      return true; // برای پاسخ آسنکرون
    } else if (request.action === "toggleSiteStatus") {
      (async () => {
        const { domain, newStatus } = request;
        if (!domain) {
          sendResponse({ success: false, error: "Domain not provided" });
          return;
        }
        const siteStorageKey = `siteEnabled_${domain}`;
        await chrome.storage.local.set({ [siteStorageKey]: newStatus });
        console.log(`Status for ${domain} set to ${newStatus}`);
        sendResponse({ success: true, newStatus });
  
        // اعمال یا لغو تغییرات در تب فعال اگر مربوط به همین دامنه است
        const tab = await getCurrentTab();
        if (tab && tab.url && tab.url.includes(domain)) {
          if (newStatus) {
            // اگر فعال شده، تغییرات را اعمال کن
            await applyModifications(tab.id, domain);
          } else {
            // اگر غیرفعال شده، صفحه را رفرش کن تا تغییرات CSS و JS تزریق شده برداشته شوند
            // یا یک اسکریپت برای revert تغییرات بنویسید (پیچیده‌تر)
            chrome.tabs.reload(tab.id);
          }
        }
      })();
      return true; // برای پاسخ آسنکرون
    }
  });
  
  console.log("سرویس‌ورکر ایرانی‌ساز سایت‌ها فعال شد.");