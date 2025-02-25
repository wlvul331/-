// 定義全域變數
let lastUsdPrice = null;
let ws = null;
const reconnectInterval = 5000; // WebSocket 重新連線時間
let tickersData = {}; // 存放幣種的行情數據
let isOnTickerPage = false; // 是否在行情頁面

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

  // 固定參數（以台幣計算）
  const totalCost = 1690000; // 總成本 (TWD)
  const totalQuantity = 21235769401342.17; // 總持有量
  const conversionRate = 32.8; // 美元轉台幣匯率

  // **進度條**：初始化
  let progress = 0;
  startLoadingBar();

  function startLoadingBar() {
    progress = 0;
    loadingBarFill.style.width = "0%";
    loadingPercentage.textContent = "0%";

    let interval = setInterval(() => {
      if (progress < 100) {
        progress += Math.floor(Math.random() * 15) + 5; // 模擬更逼真的進度條
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          completeLoadingBar();
        }
        updateLoadingBar(progress);
      }
    }, 300);
  }

  function updateLoadingBar(value) {
    loadingBarFill.style.width = value + "%";
    loadingPercentage.textContent = value + "%";
  }

  function completeLoadingBar() {
    setTimeout(() => {
      loadingContainer.style.display = "none";
      statsBox.style.display = "block";
      statsContainer.style.display = "block";
      priceElement.style.display = "inline";
      actionButtons.style.display = "flex";
    }, 500);
  }

  // **WebSocket：訂閱 1MBABYDOGEUSDT**
  function connectWebSocket() {
    ws = new WebSocket("wss://stream.binance.com:9443/ws/1mbabydogeusdt@ticker");

    ws.onopen = function () {
      console.log("已連線到 Binance WebSocket (1mbabydogeusdt@ticker)");
    };

    ws.onmessage = function (event) {
      try {
        const data = JSON.parse(event.data);
        const usdPrice = parseFloat(data.c); // 最新成交價格
        priceElement.textContent = formatPrice(usdPrice);

        // 變更顏色
        priceElement.style.color = lastUsdPrice && usdPrice < lastUsdPrice ? "orangered" : "#00A67D";
        lastUsdPrice = usdPrice;

        // 計算台幣價格
        const twdPrice = usdPrice * conversionRate;
        totalQuantityElement.textContent = totalQuantity.toLocaleString();
        totalValueElement.textContent = (totalQuantity * twdPrice / 1e6).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });

        // 計算盈虧
        const unrealizedProfit = totalQuantity * twdPrice / 1e6 - totalCost;
        profitElement.textContent = `NT$${Math.round(unrealizedProfit).toLocaleString()}`;
        profitPercentageElement.textContent = `${((unrealizedProfit / totalCost) * 100).toFixed(2)}%`;

        // 盈虧顏色變更
        profitElement.classList.toggle("positive", unrealizedProfit >= 0);
        profitElement.classList.toggle("negative", unrealizedProfit < 0);
        profitPercentageElement.classList.toggle("positive", unrealizedProfit >= 0);
        profitPercentageElement.classList.toggle("negative", unrealizedProfit < 0);
      } catch (error) {
        console.error("處理 WebSocket 訊息錯誤:", error);
      }
    };

    ws.onerror = function (error) {
      console.error("WebSocket 錯誤:", error);
    };

    ws.onclose = function () {
      console.log("WebSocket 連線已關閉，將嘗試重新連線");
      setTimeout(connectWebSocket, reconnectInterval);
    };
  }

  function formatPrice(num) {
    return `$${num.toFixed(7)}`;
  }

  // **WebSocket：訂閱多個行情幣種**
  function connectTickersWebSocket(tickerContainer) {
    const streams = "btcusdt@ticker/ethusdt@ticker/solusdt@ticker/adausdt@ticker/bnbusdt@ticker/dogeusdt@ticker";
    const wsTickers = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);

    wsTickers.onmessage = function (event) {
      try {
        const message = JSON.parse(event.data);
        if (message.data && message.data.s && message.data.c) {
          tickersData[message.data.s] = parseFloat(message.data.c);
          updateTickerDisplay(tickerContainer);
        }
      } catch (error) {
        console.error("處理行情 WebSocket 訊息錯誤:", error);
      }
    };

    wsTickers.onerror = function (error) {
      console.error("行情 WebSocket 錯誤:", error);
    };

    wsTickers.onclose = function () {
      console.log("行情 WebSocket 連線已關閉，將嘗試重新連線");
      setTimeout(() => connectTickersWebSocket(tickerContainer), reconnectInterval);
    };
  }

  function updateTickerDisplay(tickerContainer) {
    let html = "";
    const symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "ADAUSDT", "BNBUSDT", "DOGEUSDT"];
    symbols.forEach((sym) => {
      const price = tickersData[sym] ? tickersData[sym].toFixed(2) : "Loading...";
      html += `<div class="ticker-item">
                 <span class="ticker-coin">${sym.slice(0, -4)}</span><span class="ticker-suffix">/USDT</span>: 
                 <span class="ticker-price">${price}</span>
               </div>`;
    });
    tickerContainer.innerHTML = html;
  }

  // **顯示行情頁面**
  function showTickers() {
    if (isOnTickerPage) return; // 如果已在行情頁面，則不執行
    isOnTickerPage = true;
    
    let tickerContainer = document.getElementById("ticker-container");
    if (!tickerContainer) {
      tickerContainer = document.createElement("div");
      tickerContainer.id = "ticker-container";
      tickerContainer.className = "ticker-container";
      statsBox.appendChild(tickerContainer);
    }

    statsContainer.classList.add("hidden");
    tickerContainer.classList.remove("hidden");
    connectTickersWebSocket(tickerContainer);
  }

  // **回到盈虧頁面**
  sellButton.addEventListener("click", function (e) {
    e.preventDefault();
    isOnTickerPage = false;
    document.getElementById("ticker-container")?.remove();
    statsContainer.classList.remove("hidden");
  });

  // **點擊買入切換到行情頁面**
  buyButton.addEventListener("click", function (e) {
    e.preventDefault();
    showTickers();
  });

  connectWebSocket();
});
