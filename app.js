// 定義全域變數，保存上一次的美元價格，以及 ticker 更新數據
let lastUsdPrice = null;
let ws = null;
const reconnectInterval = 5000; // 重連間隔 (毫秒)
let tickersData = {}; // 用來儲存多個幣種的即時行情數據

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
  const actionButtons = document.querySelector(".action-buttons");
  const statsBox = document.querySelector(".stats-box");
  const buyButton = document.getElementById("buy-button");
  const sellButton = document.getElementById("sell-button");
  const tickerContainer = document.getElementById("ticker-container");

  // 設定初始層級，盈虧計算預設在最上層
  statsContainer.style.zIndex = "2";
  tickerContainer.style.zIndex = "1";

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
      } else {
        clearInterval(interval);
      }
    }, 200);
  }

  function updateLoadingBar(value) {
    loadingBarFill.style.width = value + "%";
    loadingPercentage.textContent = value + "%";
  }

  function completeLoadingBar() {
    progress = 100;
    updateLoadingBar(progress);
    setTimeout(() => {
      loadingContainer.style.display = "none";
      statsBox.style.display = "block";
      statsContainer.style.display = "block";
      priceElement.style.display = "inline";
      actionButtons.style.display = "flex";
      tickerContainer.style.display = "block";
    }, 500);
  }

  // 按鈕點擊事件，切換顯示層級
  buyButton.addEventListener("click", function () {
    tickerContainer.style.zIndex = "2";
    statsContainer.style.zIndex = "1";
  });

  sellButton.addEventListener("click", function () {
    statsContainer.style.zIndex = "2";
    tickerContainer.style.zIndex = "1";
  });

  // WebSocket 連接
  function connectWebSocket() {
    ws = new WebSocket("wss://stream.binance.com:9443/ws/1mbabydogeusdt@ticker");
    ws.onmessage = function (event) {
      try {
        const data = JSON.parse(event.data);
        const usdPrice = parseFloat(data.c);
        priceElement.textContent = `$${usdPrice.toFixed(7)}`;
        lastUsdPrice = usdPrice;
      } catch (error) {
        console.error("WebSocket 錯誤:", error);
      }
    };
  }

  connectWebSocket();
});
