// 定義全域變數，保存行情數據
let lastUsdPrice = null;
let ws = null;
const reconnectInterval = 5000; // WebSocket 重新連線間隔
let tickersData = {}; // 存放幣種行情數據

// 判斷數據是否載入完成（控制讀條）
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
  const loadingContainer = document.getElementById("loading-container");
  const statsContainer = document.getElementById("stats-container");
  const loadingBarFill = document.getElementById("loading-bar-fill");
  const loadingPercentage = document.getElementById("loading-percentage");
  const actionButtons = document.querySelector('.action-buttons');
  const statsBox = document.querySelector('.stats-box');
  const buyButton = document.getElementById("buy-button");
  const sellButton = document.getElementById("sell-button");

  // 隱藏內容，先顯示讀條
  statsBox.style.display = "none";
  statsContainer.style.display = "none";
  actionButtons.style.display = "none";
  priceElement.style.display = "none";

  // 讀條進度
  let progress = 0;
  startLoadingBar();

  function startLoadingBar() {
    progress = 0;
    loadingBarFill.style.width = "0%";
    loadingPercentage.textContent = "0%";
    let interval = setInterval(() => {
      if (progress < 95) {
        progress += Math.random() * 10; // 讓讀條更真實
        updateLoadingBar(progress);
      }
    }, 200);
  }

  function updateLoadingBar(value) {
    loadingBarFill.style.width = value + "%";
    loadingPercentage.textContent = Math.min(100, Math.round(value)) + "%";
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
      loadingContainer.style.display = "none";
      statsBox.style.display = "block";
      statsContainer.style.display = "block";
      priceElement.style.display = "inline";
      actionButtons.style.display = "flex";
    }, 500);
  }

  // **🔥 讀條開始時就載入幣種行情**
  loadTickers();
  connectTickersWebSocket();

  // 建立並連線 Binance WebSocket (訂閱 1MBABYDOGEUSDT)
  function connectWebSocket() {
    ws = new WebSocket('wss://stream.binance.com:9443/ws/1mbabydogeusdt@ticker');
    ws.onopen = () => console.log("已連線到 Binance WebSocket (1mbabydogeusdt)");
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const usdPrice = parseFloat(data.c); // "c" 為最新成交價格
        priceElement.textContent = formatPrice(usdPrice);
        priceElement.style.color = (lastUsdPrice !== null && usdPrice < lastUsdPrice) ? "orangered" : "#00A67D";
        lastUsdPrice = usdPrice;

        // 更新盈虧數據
        const conversionRate = 32.8;
        const totalQuantity = 21235769401342.17;
        const totalCost = 1690000;
        const twdPrice = usdPrice * conversionRate;
        totalQuantityElement.textContent = totalQuantity.toLocaleString();
        totalValueElement.textContent = (totalQuantity * twdPrice / 1e6).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const unrealizedProfit = totalQuantity * twdPrice / 1e6 - totalCost;
        const profitPercentage = ((unrealizedProfit / totalCost) * 100).toFixed(2);
        profitElement.textContent = `NT$${Math.round(unrealizedProfit).toLocaleString()}`;
        profitPercentageElement.textContent = `${profitPercentage}%`;

        profitElement.classList.toggle("positive", unrealizedProfit >= 0);
        profitElement.classList.toggle("negative", unrealizedProfit < 0);
        profitPercentageElement.classList.toggle("positive", unrealizedProfit >= 0);
        profitPercentageElement.classList.toggle("negative", unrealizedProfit < 0);

        if (!mainLoaded) {
          mainLoaded = true;
          tryCompleteLoading();
        }
      } catch (error) {
        console.error("處理 WebSocket 訊息錯誤:", error);
      }
    };
    ws.onclose = () => setTimeout(connectWebSocket, reconnectInterval);
  }

  connectWebSocket();

  function formatPrice(num) {
    return `${num.toFixed(7)}`;
  }

  // **🔥 讀條開始時就載入幣種行情**
  function loadTickers() {
    const symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "ADAUSDT", "BNBUSDT", "DOGEUSDT"];
    const requests = symbols.map(sym => fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${sym}`).then(response => response.json()));
    
    Promise.all(requests).then(results => {
      results.forEach(result => tickersData[result.symbol] = parseFloat(result.price));
      tickersLoaded = true;
      tryCompleteLoading();
    }).catch(error => {
      console.error("讀取行情數據錯誤:", error);
      tickersLoaded = true;
      tryCompleteLoading();
    });
  }

  function connectTickersWebSocket() {
    const streams = "btcusdt@ticker/ethusdt@ticker/solusdt@ticker/adausdt@ticker/bnbusdt@ticker/dogeusdt@ticker";
    const wsTickers = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);
    
    wsTickers.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.data && message.data.s && message.data.c) {
          tickersData[message.data.s] = parseFloat(message.data.c);
        }
      } catch (error) {
        console.error("處理行情 WebSocket 訊息錯誤:", error);
      }
    };
    
    wsTickers.onclose = () => setTimeout(connectTickersWebSocket, reconnectInterval);
  }

  buyButton.addEventListener("click", function(e) {
    e.preventDefault();
    if (document.getElementById("ticker-container")) return; // **🔥 如果已經在行情頁面，則不做任何動作**
    showTickers();
  });

  sellButton.addEventListener("click", function(e) {
    e.preventDefault();
    let tickerContainer = document.getElementById("ticker-container");
    if (tickerContainer) {
      tickerContainer.remove();
      statsContainer.style.display = "block";
    }
  });

  function showTickers() {
    let existingTicker = document.getElementById("ticker-container");
    if (existingTicker) return;

    const tickerContainer = document.createElement("div");
    tickerContainer.id = "ticker-container";
    tickerContainer.className = "ticker-container";
    statsContainer.style.display = "none";
    statsBox.appendChild(tickerContainer);
  }
});
