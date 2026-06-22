const header = document.querySelector(".site-header");
const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");
const toast = document.querySelector(".toast");

function updateHeader() {
  header?.classList.toggle("is-scrolled", window.scrollY > 12);
}

window.addEventListener("scroll", updateHeader, { passive: true });
updateHeader();

navToggle?.addEventListener("click", () => {
  const open = navLinks.classList.toggle("is-open");
  navToggle.setAttribute("aria-expanded", String(open));
});

navLinks?.addEventListener("click", (event) => {
  if (event.target.closest("a")) {
    navLinks.classList.remove("is-open");
    navToggle?.setAttribute("aria-expanded", "false");
  }
});

let toastTimer;
function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2800);
}

document.querySelectorAll("[data-copy]").forEach((button) => {
  button.addEventListener("click", async () => {
    const value = button.dataset.copy;
    try {
      await navigator.clipboard.writeText(value);
      showToast("클립보드에 복사했습니다.");
    } catch {
      showToast(value);
    }
  });
});

const downloadLists = [...document.querySelectorAll("[data-download-list]")];
if (downloadLists.length) {
  fetch("/data/downloads.json")
    .then((response) => response.json())
    .then((downloads) => {
      downloadLists.forEach((downloadList) => {
        const group = downloadList.dataset.downloadList;
        const filtered = downloads.filter((item) => item.group === group);
        downloadList.innerHTML = filtered.map((item) => `
          <article class="download-item">
            <div class="download-main">
              <div class="download-name">${item.name}</div>
              <div class="download-file">${item.filename}</div>
              <div class="hash" title="SHA-256">SHA-256 · ${item.sha256}</div>
            </div>
            <div class="download-meta">
              <span class="file-size">${formatBytes(item.size)}</span>
              <a class="download-button" href="/downloads/${encodeURIComponent(item.filename)}" download aria-label="${item.name} 다운로드">
                <img src="/assets/icon-download.svg" alt="">
              </a>
            </div>
          </article>
        `).join("");
      });
    })
    .catch(() => {
      downloadLists.forEach((downloadList) => {
        downloadList.innerHTML = `<div class="notice">다운로드 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</div>`;
      });
    });
}

function formatBytes(bytes) {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} GiB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(2)} MiB`;
  return `${(bytes / 1024).toFixed(1)} KiB`;
}

const productSearch = document.querySelector("[data-product-search]");
if (productSearch) {
  const products = [...document.querySelectorAll("[data-product]")];
  productSearch.addEventListener("input", () => {
    const query = productSearch.value.trim().toLowerCase();
    products.forEach((product) => {
      product.hidden = !product.textContent.toLowerCase().includes(query);
    });
  });
}
