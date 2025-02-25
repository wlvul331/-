// 定義全域變數，保存上一次的美元價格，以及 ticker 更新數據
let lastUsdPrice = null;
let ws = null;
const reconnectInterval = 5000; // 重連間隔 (毫秒)
let tickersData = {}; // 用來存放多個幣種的行情數據
let mainLoaded = false;
let tickersLoaded = false;
let loadingComplete = false;
let showingTickers = false; // 當前是否在顯示行情頁面

document.addEventListener("DOMContentLoaded", function () {
  // DOM 元素
  const priceElement = document.getElementById("price-usd");
  const statsContainer = document.getElementById("stats-container");
  const loadingContainer = document.getElementById("loading-container");
  const loadingBarFill = document.getElementById("loading-bar-fill");
  const loadingPercentage = document.getElementById("loading-percentage");
  const actionButtons = document.querySelector(".action-buttons");
  const statsBox = document.querySelector(".stats-box");
  const buyButton = document.getElementById("buy-button");
  const sellButton = document.getElementById("sell-button");

  statsBox.style.display = "none";
  statsContainer.style.display = "none";
  actionButtons.style.display = "none";
  priceElement.style.display = "none";

  let progress = 0;
  startLoadingBar();
  loadTickers();
  connectWebSocket();

  function startLoadingBar() {
    progress = 0;
    loadingBarFill.style.width = "0%";
    loadingPercentage.textContent = "0%";
    let interval = setInterval(() => {
      if (progress < 90) {
        progress += Math.random() * 10; // 模擬不規則加速
        updateLoadingBar(Math.min(progress, 90));
      } else {
        clearInterval(interval);
      }
    }, 300);
  }

  function updateLoadingBar(value) {
    loadingBarFill.style.width = value + "%";
    loadingPercentage.textContent = Math.floor(value) + "%";
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

  function loadTickers() {
    const symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "ADAUSDT", "BNBUSDT", "DOGEUSDT"];
    const requests = symbols.map(sym =>
      fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${sym}`)
        .then(response => response.json())
    );
    Promise.all(requests)
      .then(results => {
        results.forEach(result => {
          tickersData[result.symbol] = parseFloat(result.price);
        });
        tickersLoaded = true;
        tryCompleteLoading();
      })
      .catch(error => {
        console.error("Error fetching tickers:", error);
        tickersLoaded = true;
        tryCompleteLoading();
      });
  }

  function connectWebSocket() {
    ws = new WebSocket('wss://stream.binance.com:9443/ws/1mbabydogeusdt@ticker');
    ws.onmessage = function(event) {
      try {
        const data = JSON.parse(event.data);
        const usdPrice = parseFloat(data.c);
        priceElement.textContent = `$${usdPrice.toFixed(7)}`;
        lastUsdPrice = usdPrice;
        mainLoaded = true;
        tryCompleteLoading();
      } catch (error) {
        console.error("處理 WebSocket 訊息錯誤:", error);
      }
    };
    ws.onclose = function() {
      setTimeout(connectWebSocket, reconnectInterval);
    };
  }

  function showTickers() {
    if (showingTickers) return;
    showingTickers = true;
    statsContainer.style.display = "none";
    let tickerContainer = document.createElement("div");
    tickerContainer.id = "ticker-container";
    tickerContainer.className = "ticker-container";
    statsBox.appendChild(tickerContainer);
    connectTickersWebSocket(tickerContainer);
  }

  function connectTickersWebSocket(tickerContainer) {
    const streams = "btcusdt@ticker/ethusdt@ticker/solusdt@ticker/adausdt@ticker/bnbusdt@ticker/dogeusdt@ticker";
    const wsTickers = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);
    wsTickers.onmessage = function(event) {
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
    wsTickers.onclose = function() {
      setTimeout(() => connectTickersWebSocket(tickerContainer), reconnectInterval);
    };
  }

  function updateTickerDisplay(tickerContainer) {
    let html = '';
    const symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "ADAUSDT", "BNBUSDT", "DOGEUSDT"];
    symbols.forEach(sym => {
      let price = tickersData[sym] ? tickersData[sym].toFixed(2) : "Loading...";
      let coin = sym.slice(0, sym.length - 4);
      html += `<div class="ticker-item">
                 <span class="ticker-coin">${coin}</span><span class="ticker-suffix">/USDT</span>: 
                 <span class="ticker-price">${price}</span>
               </div>`;
    });
    tickerContainer.innerHTML = html;
  }

  buyButton.addEventListener("click", function(e) {
    e.preventDefault();
    showTickers();
  });

  sellButton.addEventListener("click", function(e) {
    e.preventDefault();
    showingTickers = false;
    let tickerContainer = document.getElementById("ticker-container");
    if (tickerContainer) tickerContainer.remove();
    statsContainer.style.display = "block";
  });
});
