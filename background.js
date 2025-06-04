// background.js
import allModulesConfig from './modules/_load_modules.js'; // <--- تغییر اصلی اینجا

// پیکربندی سایت‌های پشتیبانی شده حالا به صورت پویا از ماژول‌ها می‌آید
const supportedSitesConfig = allModulesConfig; //

// --- توابع کمکی ---
// ... (getCurrentTab بدون تغییر باقی می‌ماند) ...

function getSiteModuleConfig(url) { // نام تابع را برای وضوح بیشتر تغییر می‌دهیم
  if (!url) return null;
  for (const siteKey in supportedSitesConfig) {
    const moduleConfig = supportedSitesConfig[siteKey];
    if (moduleConfig.domains && moduleConfig.domains.some(domain => url.includes(domain))) {
      return { config: moduleConfig, key: siteKey }; // برگرداندن خود کانفیگ و کلید اصلی آن
    }
  }
  return null;
}

async function applyModifications(tabId, siteModule) { // پارامتر ورودی تغییر می‌کند
  const siteConfig = siteModule.config; //
  const siteDomainKey = siteModule.key; // کلیدی که در supportedSitesConfig استفاده شده

  if (!siteConfig) {
    console.warn(`No configuration found for site module.`);
    return;
  }

  const siteStorageKey = `siteEnabled_${siteDomainKey}`; //
  const data = await chrome.storage.local.get([siteStorageKey]);
  // ... بقیه منطق applyModifications تقریبا بدون تغییر باقی می‌ماند ...
  // فقط مطمئن شوید که از siteConfig.name، siteConfig.css، siteConfig.js استفاده می‌کنید
}

// --- شنوندگان رویداد ---

// 1. هنگام به‌روزرسانی یک تب
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const siteModuleInfo = getSiteModuleConfig(tab.url); // استفاده از تابع جدید
    if (siteModuleInfo) {
      console.log(`Site detected: ${siteModuleInfo.config.name} on tab ${tabId}`);
      await applyModifications(tabId, siteModuleInfo); // ارسال آبجکت اطلاعات ماژول
    }
  }
});

// 2. هنگام نصب یا آپدیت اکستنشن
chrome.runtime.onInstalled.addListener(async (details) => { //
  if (details.reason === "install" || details.reason === "update") {
    console.log(`ایرانی‌باش ${details.reason === "install" ? 'نصب شد' : 'به‌روزرسانی شد'}.`);
    const initialSiteStates = {};
    const currentStorage = await chrome.storage.local.get(null);
    let needsUpdate = false;

    for (const domainKey in supportedSitesConfig) { //
      const storageKey = `siteEnabled_${domainKey}`;
      // اگر اولین نصب است یا سایت جدیدی اضافه شده که در storage نیست
      if (details.reason === "install" || currentStorage[storageKey] === undefined) {
        initialSiteStates[storageKey] = supportedSitesConfig[domainKey].enabled; //
        needsUpdate = true;
      }
    }
    if (needsUpdate) {
      await chrome.storage.local.set(initialSiteStates);
      console.log("وضعیت اولیه/به‌روز شده سایت‌ها در storage ذخیره شد.");
    }
  }
});

// 3. گوش دادن به پیام‌ها از popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => { //
  if (request.action === "getSiteStatus") {
    (async () => {
      const tab = await getCurrentTab(); //
      if (tab && tab.url) {
        const siteModuleInfo = getSiteModuleConfig(tab.url);
        if (siteModuleInfo) {
          const siteConfig = siteModuleInfo.config; //
          const siteDomainKey = siteModuleInfo.key;
          const siteStorageKey = `siteEnabled_${siteDomainKey}`; //
          const data = await chrome.storage.local.get([siteStorageKey]);
          const isEnabled = data[siteStorageKey] !== undefined ? data[siteStorageKey] : siteConfig.enabled; //
          sendResponse({ name: siteConfig.name, enabled: isEnabled, domain: siteDomainKey }); //
        } else {
          sendResponse({ name: null, enabled: false, domain: null }); //
        }
      } else {
        sendResponse({ name: null, enabled: false, domain: null }); //
      }
    })();
    return true;
  } else if (request.action === "toggleSiteStatus") {
    (async () => {
      const { domain: siteDomainKeyFromPopup, newStatus } = request; //
      if (!siteDomainKeyFromPopup) {
        sendResponse({ success: false, error: "Domain key not provided" }); //
        return;
      }
      const siteStorageKey = `siteEnabled_${siteDomainKeyFromPopup}`; //
      await chrome.storage.local.set({ [siteStorageKey]: newStatus }); //
      sendResponse({ success: true, newStatus }); //

      const tab = await getCurrentTab(); //
      // پیدا کردن اطلاعات ماژول بر اساس کلیدی که از پاپ آپ آمده
      const currentModuleConfig = supportedSitesConfig[siteDomainKeyFromPopup];
      if (tab && tab.url && currentModuleConfig && currentModuleConfig.domains.some(d => tab.url.includes(d))) {
        if (newStatus) {
          await applyModifications(tab.id, { config: currentModuleConfig, key: siteDomainKeyFromPopup }); //
        } else {
          chrome.tabs.reload(tab.id); //
        }
      }
    })();
    return true;
  }
});

console.log("سرویس‌ورکر ایرانی‌باش فعال شد."); //