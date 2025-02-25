// 定義一個全域變數保存上一次的美元價格
let lastUsdPrice = null;

document.addEventListener("DOMContentLoaded", function () {
  // DOM 元素
  const priceElement = document.getElementById("price-usd");
  const totalQuantityElement = document.getElementById("total-quantity");
  const totalValueElement = document.getElementById("total-value");
  const profitElement = document.getElementById("profit");
  const profitPercentageElement = document.getElementById("profit-percentage");
  const loadingContainer = document.getElementById("loading-container");
  const statsContainer = document.getElementById("stats-container");
  const loadingBarFill = document.getElementById("loading-bar-fill");
  const loadingPercentage = document.getElementById("loading-percentage");

  // 固定參數
  const totalCost = 1690000;             // 總成本 (TWD)
  const totalQuantity = 21235769401342.17; // 總持有量

  // 使用 CORS 代理取得 CoinGecko 數據
  const proxyUrl = "https://corsproxy.io/?";
  const apiUrl =
    "https://api.coingecko.com/api/v3/simple/price?ids=baby-doge-coin&vs_currencies=usd,twd";

  // 進度條初始化
  let progress = 0;
  startLoadingBar();

  function startLoadingBar() {
    progress = 0;
    loadingBarFill.style.width = "0%";
    loadingPercentage.textContent = "0%";
    let interval = setInterval(() => {
      if (progress < 80) {
        progress += 10;
        updateLoadingBar(progress);
      }
    }, 200);
  }

  function updateLoadingBar(value) {
    loadingBarFill.style.width = value + "%";
    loadingPercentage.textContent = value + "%";
  }

  async function fetchPrice() {
    try {
      const response = await fetch(proxyUrl + apiUrl);
      if (!response.ok) throw new Error("API 回應錯誤");
      const data = await response.json();

      // 取得 USD 與 TWD 價格
      const usdPrice = data["baby-doge-coin"]["usd"];
      const twdPrice = data["baby-doge-coin"]["twd"];

      // 格式化並顯示當前價格
      priceElement.textContent = formatPrice(usdPrice);
      // 更新顏色：初始、上漲或持平時均為綠色，僅下跌時顯示紅色
      if (lastUsdPrice !== null && usdPrice < lastUsdPrice) {
        priceElement.style.color = "red";
      } else {
        priceElement.style.color = "#0f0";
      }
      lastUsdPrice = usdPrice;

      // 更新其他數據
      totalQuantityElement.textContent = totalQuantity.toLocaleString();
      totalValueElement.textContent = (totalQuantity * twdPrice).toFixed(2);
      const unrealizedProfit = totalQuantity * twdPrice - totalCost;
      const profitPercentage = ((unrealizedProfit / totalCost) * 100).toFixed(2);

      profitElement.textContent = `NT$${unrealizedProfit.toLocaleString()}`;
      profitPercentageElement.textContent = `${profitPercentage}%`;

      // 盈虧上色：盈餘為綠色，虧損為紅色
      if (unrealizedProfit >= 0) {
        profitElement.classList.add("positive");
        profitElement.classList.remove("negative");
        profitPercentageElement.classList.add("positive");
        profitPercentageElement.classList.remove("negative");
      } else {
        profitElement.classList.add("negative");
        profitElement.classList.remove("positive");
        profitPercentageElement.classList.add("negative");
        profitPercentageElement.classList.remove("positive");
      }

      completeLoadingBar();
    } catch (error) {
      console.error("Error fetching price:", error);
      // 若數據加載失敗，不更新價格，保留上次成功讀取的數值
      completeLoadingBar();
    }
  }

  function completeLoadingBar() {
    progress = 100;
    updateLoadingBar(progress);
    setTimeout(() => {
      loadingContainer.style.display = "none";
      statsContainer.style.display = "block";
      priceElement.style.display = "inline";
    }, 500);
  }

  // 格式化價格：若大於 0.01 則顯示 8 位小數，否則依據情況格式化
  function formatPrice(num) {
    if (num >= 0.01) return `$${num.toFixed(8)}`;
    const numStr = num.toFixed(12);
    const match = numStr.match(/^0\.(0+)([1-9]\d*)$/);
    return match ? `0.0{${match[1].length}}${match[2]}` : `$${numStr}`;
  }

  // 初次抓取價格
  fetchPrice();
  // 每 90 秒更新一次
  setInterval(fetchPrice, 90000);
});
