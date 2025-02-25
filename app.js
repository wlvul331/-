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

  // 固定參數（以台幣計算）
  const totalCost = 1690000;             // 總成本 (TWD)
  const totalQuantity = 21235769401342.17; // 總持有量

  // 使用 CORS 代理避免跨域問題（若需要可移除或換用自己的代理服務）
  const proxyUrl = "https://corsproxy.io/?";
  // 派網 API 取得訂單薄行情（以 BABYDOGE_USDT 為例）
  const pionexUrl = "https://api.pionex.com/api/v1/market/bookTickers?symbol=BABYDOGE_USDT";
  
  // 預設美元轉台幣匯率（若需要可自行調整或動態取得）
  const conversionRate = 30;

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
      const response = await fetch(proxyUrl + pionexUrl);
      if (!response.ok) throw new Error("API 回應錯誤");
      const data = await response.json();

      // 從回應資料中取得 tickers 陣列，並找出 BABYDOGE_USDT 的行情資料
      const tickers = data.data.tickers;
      const ticker = tickers.find(t => t.symbol === "BABYDOGE_USDT");
      if (!ticker) throw new Error("找不到 BABYDOGE_USDT 的行情資料");

      // 解析最佳買入價與最佳賣出價，取平均作為即時美元價格
      const bidPrice = parseFloat(ticker.bidPrice);
      const askPrice = parseFloat(ticker.askPrice);
      const usdPrice = (bidPrice + askPrice) / 2;

      // 格式化並顯示當前價格
      priceElement.textContent = formatPrice(usdPrice);
      // 若上次價格存在且新價格下跌，顯示紅色；否則一律綠色
      if (lastUsdPrice !== null && usdPrice < lastUsdPrice) {
        priceElement.style.color = "orangered";
      } else {
        priceElement.style.color = "#0f0";
      }
      lastUsdPrice = usdPrice;

      // 利用匯率換算成台幣價格
      const twdPrice = usdPrice * conversionRate;

      // 更新其他數據（總持有量、持幣總價值及盈虧）
      totalQuantityElement.textContent = totalQuantity.toLocaleString();
      totalValueElement.textContent = (totalQuantity * twdPrice).toFixed(2);
      const unrealizedProfit = totalQuantity * twdPrice - totalCost;
      const profitPercentage = ((unrealizedProfit / totalCost) * 100).toFixed(2);

      profitElement.textContent = `NT$${unrealizedProfit.toLocaleString()}`;
      profitPercentageElement.textContent = `${profitPercentage}%`;

      // 設定盈虧數字顏色：盈餘為綠色，虧損為紅色
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
      // 若數據加載失敗，保留上次成功讀取的價格，不做更新
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

  // 格式化價格函數，若價格大於 0.01 則顯示 8 位小數，否則依情況格式化
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
