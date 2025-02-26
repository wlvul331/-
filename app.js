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
    const actionButtons = document.querySelector('.action-buttons');
    const statsBox = document.querySelector('.stats-box');
    const buyButton = document.getElementById("buy-button");
    const sellButton = document.getElementById("sell-button");

    // 初始隱藏整個灰色方框、盈虧資訊區、即時價格與按鈕
    statsBox.style.display = "none";
    statsContainer.style.display = "none";
    actionButtons.style.display = "none";
    priceElement.style.display = "none";

    fetchMarketData(); // 頁面加載時立即獲取數據
    setInterval(fetchMarketData, 5000); // 每 5 秒刷新一次數據

    buyButton.addEventListener("click", function(e) {
        e.preventDefault();
        showTickers();
    });

    sellButton.addEventListener("click", function(e) {
        e.preventDefault();
        let tickerContainer = document.getElementById("ticker-container");
        if (tickerContainer) {
            tickerContainer.parentNode.removeChild(tickerContainer);
        }
        statsContainer.style.display = "block";
    });
});

function connectWebSocket() {
    ws = new WebSocket('wss://stream.binance.com:9443/ws/1mbabydogeusdt@ticker');
    ws.onopen = function() {
        console.log("已連線到 Binance WebSocket");
    };
    ws.onmessage = function(event) {
        try {
            const data = JSON.parse(event.data);
            const usdPrice = parseFloat(data.c);
            document.getElementById("price-usd").textContent = formatPrice(usdPrice);
            lastUsdPrice = usdPrice;
        } catch (error) {
            console.error("WebSocket 訊息處理錯誤:", error);
        }
    };
    ws.onclose = function() {
        console.log("WebSocket 連線已關閉，5 秒後重新連線");
        setTimeout(connectWebSocket, reconnectInterval);
    };
}

function showTickers() {
    let existingTicker = document.getElementById("ticker-container");
    if (existingTicker) return;
    statsContainer.style.display = "none";
    const tickerContainer = document.createElement("div");
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
            console.error("WebSocket 訊息處理錯誤:", error);
        }
    };
}

function updateTickerDisplay(tickerContainer) {
    let html = '';
    const symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "ADAUSDT", "BNBUSDT", "DOGEUSDT"];
    symbols.forEach(sym => {
        const price = tickersData[sym] ? tickersData[sym].toFixed(2) : "Loading...";
        html += `<div class="ticker-item">${sym}: ${price}</div>`;
    });
    tickerContainer.innerHTML = html;
}

connectWebSocket();
