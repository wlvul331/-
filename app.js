// 定義全域變數，保存價格與行情數據
let lastUsdPrice = null;
let ws = null;
const reconnectInterval = 5000; // WebSocket 重連間隔 (毫秒)
let tickersData = {}; // 儲存行情數據

// 讀條狀態變數
let mainLoaded = false;
let tickersLoaded = false;
let loadingComplete = false;

document.addEventListener("DOMContentLoaded", function () {
  // DOM 元素
  const priceElement = document.getElementById("price-usd");
  const totalQuantityElement = document.getElementById("total-quantity");
  const totalValueElement = document.getElementById("total-value");
  const profitElement = document.getElementById("profit");
  const profitPercentageElement = document.getElementById("profit-percentage");
  const loadingBarFill = document.getElementById("loading-bar-fill");
  const loadingPercentage = document.getElementById("loading-percentage");
  const buyButton = document.getElementById("buy-button");
  const sellButton = document.getElementById("sell-button");
  const statsContainer = document.getElementById("stats-container");
  const tickerContainer = document.getElementById("ticker-container");

  // 固定參數
  const totalCost = 1690000; // 總成本 (TWD)
  const totalQuantity = 21235769401342.17; // 總持有量
  const conversionRate = 32.8; // 美元轉台幣匯率

  // 讀條初始化
  let progress = 0;
  startLoadingBar();

  function startLoadingBar() {
    progress = 0;
    loadingBarFill.style.width = "0%";
    loadingPercentage.textContent = "0%";
    let interval = setInterval(() => {
      if (progress < 95) {
        progress += Math.floor(Math.random() * 10) + 5;
        if (progress > 95) progress = 95;
        updateLoadingBar(progress);
      } else {
        clearInterval(interval);
      }
    }, 300);
  }

  function updateLoadingBar(value) {
    loadingBarFill.style.width = value + "%";
    loadingPercentage.textContent = value + "%";
  }

  function tryCompleteLoading() {
    if (!loadingComplete && mainLoaded && tickersLoaded) {
      completeLoadingBar();
      loadingComplete = true;
    }
  }

  function completeLoadingBar() {
    progress = 100;
    updateLoadingBar(progress);
    setTimeout(() => {
      document.getElementById("loading-container").style.display = "none";
      statsContainer.style.display = "block";
    }, 500);
  }

  function formatPrice(num) {
    return `$${num.toFixed(7)}`;
  }

  function connectWebSocket() {
    ws = new WebSocket('wss://stream.binance.com:9443/ws/1mbabydogeusdt@ticker');
    ws.onopen = () => console.log("已連線到 Binance WebSocket");
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const usdPrice = parseFloat(data.c);
        priceElement.textContent = formatPrice(usdPrice);
        lastUsdPrice = usdPrice;
        const twdPrice = usdPrice * conversionRate;
        totalValueElement.textContent = (totalQuantity * twdPrice / 1e6).toLocaleString(undefined, { minimumFractionDigits: 2 });
        const unrealizedProfit = Math.round(totalQuantity * twdPrice / 1e6 - totalCost);
        profitElement.textContent = `NT$${unrealizedProfit.toLocaleString()}`;
        profitPercentageElement.textContent = `${((unrealizedProfit / totalCost) * 100).toFixed(2)}%`;
        mainLoaded = true;
        tryCompleteLoading();
      } catch (error) {
        console.error("WebSocket 訊息錯誤:", error);
      }
    };
    ws.onclose = () => setTimeout(connectWebSocket, reconnectInterval);
  }

  function loadTickers() {
    const symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "ADAUSDT", "BNBUSDT", "DOGEUSDT"];
    Promise.all(symbols.map(sym => fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${sym}`).then(res => res.json())))
      .then(results => {
        results.forEach(result => {
          tickersData[result.symbol] = parseFloat(result.price);
        });
        tickersLoaded = true;
        tryCompleteLoading();
      })
      .catch(error => {
        console.error("載入行情錯誤:", error);
        tickersLoaded = true;
        tryCompleteLoading();
      });
  }

  function updateTickerDisplay() {
    tickerContainer.innerHTML = "";
    Object.keys(tickersData).forEach(sym => {
      const price = tickersData[sym].toFixed(2);
      const coin = sym.replace("USDT", "");
      tickerContainer.innerHTML += `<div class="ticker-item">${coin}/USDT: ${price}</div>`;
    });
  }

  buyButton.addEventListener("click", function () {
    if (tickerContainer.style.display === "block") return;
    statsContainer.style.display = "none";
    tickerContainer.style.display = "block";
    updateTickerDisplay();
  });

  sellButton.addEventListener("click", function () {
    tickerContainer.style.display = "none";
    statsContainer.style.display = "block";
  });

  loadTickers();
  connectWebSocket();
});
