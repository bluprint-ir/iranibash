// modules/chatgpt/chatgpt.js
console.log("اسکریپت ایرانی‌ساز برای ChatGPT بارگذاری شد.");

function applyChatGptFixes() {
  console.log("اعمال اصلاحات مخصوص ChatGPT...");

  // مثال: تغییر placeholder تکست‌اریا
  const textarea = document.querySelector('textarea[data-id="root"]');
  if (textarea && textarea.placeholder.toLowerCase().includes("message chatgpt")) {
    textarea.placeholder = "پیام خود را به ChatGPT بنویسید...";
  }

  // استفاده از MutationObserver برای اعمال تغییرات روی محتوای داینامیک (پیام‌های جدید)
  // این بخش برای اطمینان از اینکه پیام‌های جدید هم استایل می‌گیرند مهم است
  const chatContainer = document.querySelector('main [class^="react-scroll-to-bottom--css"]'); // سلکتور والد پیام‌ها

  if (chatContainer) {
    const observer = new MutationObserver((mutationsList, observer) => {
      for (const mutation of mutationsList) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // برای هر پیام جدیدی که اضافه می‌شود، می‌توانیم بررسی‌های بیشتری انجام دهیم
              // یا اطمینان حاصل کنیم که استایل‌های CSS به درستی اعمال شده‌اند.
              // مثال: اگر نیاز به تغییر خاصی در متن پیام‌ها باشد
              // node.querySelectorAll('.markdown p').forEach(p => {
              //   // p.style.direction = 'rtl'; // اگر CSS کافی نیست
              // });
            }
          });
        }
      }
    });

    observer.observe(chatContainer, { childList: true, subtree: true });
    console.log("MutationObserver برای مانیتور کردن پیام‌های جدید ChatGPT فعال شد.");
  } else {
    console.warn("کانتینر اصلی چت ChatGPT برای MutationObserver پیدا نشد.");
  }
}

// اجرای اصلاحات
// منتظر می‌مانیم تا عناصر اصلی صفحه بارگذاری شوند
if (document.readyState === "complete" || document.readyState === "interactive") {
  setTimeout(applyChatGptFixes, 500); // کمی تاخیر برای اطمینان از بارگذاری کامل چت جی پی تی
} else {
  document.addEventListener("DOMContentLoaded", () => setTimeout(applyChatGptFixes, 500));
}
