// popup/popup.js
document.addEventListener('DOMContentLoaded', async () => {
    const siteNameElement = document.getElementById('current-site-name');
    const toggleSwitch = document.getElementById('toggle-site');
    const toggleWrapper = document.getElementById('toggle-wrapper');
    const statusTextElement = document.getElementById('status-text');
    const notSupportedMessage = document.getElementById('not-supported-message');
    const errorMessageElement = document.getElementById('error-message');
  
    let currentDomainKey = null;
  
    function updateStatusText(enabled) {
      statusTextElement.textContent = enabled ? 'فعال' : 'غیرفعال';
      statusTextElement.style.color = enabled ? '#28a745' : '#dc3545';
    }
  
    // دریافت وضعیت سایت فعلی از background script
    try {
      // اطمینان از اینکه chrome.runtime وجود دارد (برای تست در مرورگر عادی)
      if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
        const response = await chrome.runtime.sendMessage({ action: "getSiteStatus" });
        if (response) {
          if (response.domain) { // سایت پشتیبانی می‌شود
            currentDomainKey = response.domain;
            siteNameElement.textContent = response.name || 'سایت فعلی';
            toggleSwitch.checked = response.enabled;
            updateStatusText(response.enabled);
            toggleWrapper.style.display = 'flex';
            notSupportedMessage.style.display = 'none';
            errorMessageElement.style.display = 'none';
          } else { // سایت پشتیبانی نمی‌شود
            siteNameElement.textContent = 'سایت فعلی';
            toggleWrapper.style.display = 'none';
            notSupportedMessage.style.display = 'block';
            errorMessageElement.style.display = 'none';
          }
        } else {
          throw new Error("پاسخی از background دریافت نشد.");
        }
      } else {
          // برای حالتی که در یک محیط غیر اکستنشن اجرا می‌شود (مثلا تست HTML ساده)
          siteNameElement.textContent = "محیط تست";
          notSupportedMessage.textContent = "اکستنشن در این محیط فعال نیست.";
          notSupportedMessage.style.display = 'block';
          toggleWrapper.style.display = 'none';
      }
    } catch (e) {
      console.error("Error getting site status from popup:", e);
      siteNameElement.textContent = "خطا";
      toggleWrapper.style.display = 'none';
      notSupportedMessage.style.display = 'none';
      errorMessageElement.textContent = `خطا: ${e.message}`;
      errorMessageElement.style.display = 'block';
    }
  
    toggleSwitch.addEventListener('change', async () => {
      if (currentDomainKey && chrome && chrome.runtime && chrome.runtime.sendMessage) {
        const newStatus = toggleSwitch.checked;
        try {
          const response = await chrome.runtime.sendMessage({
            action: "toggleSiteStatus",
            domain: currentDomainKey,
            newStatus: newStatus
          });
          if (response && response.success) {
            updateStatusText(newStatus);
            console.log(`Status for ${currentDomainKey} updated to ${newStatus}`);
          } else {
            throw new Error(response.error || "خطا در تغییر وضعیت.");
          }
        } catch (e) {
          console.error("Error toggling site status from popup:", e);
          // بازگرداندن وضعیت toggle در صورت خطا
          toggleSwitch.checked = !newStatus;
          updateStatusText(!newStatus);
          errorMessageElement.textContent = `خطا در تغییر وضعیت: ${e.message}`;
          errorMessageElement.style.display = 'block';
        }
      }
    });
  });
  