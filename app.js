document.addEventListener("DOMContentLoaded", function () {
  // 取得 DOM 元素
  const priceElement = document.getElementById("price-usd");
  const totalQuantityElement = document.getElementById("total-quantity");
  const totalValueElement = document.getElementById("total-value");
  const profitElement = document.getElementById("profit");
  const profitPercentageElement = document.getElementById("profit-percentage");
  const loadingContainer = document.getElementById("loading-container");
  const statsContainer = document.getElementById("stats-container");
  const loadingBarFill = document.getElementById("loading-bar-fill");
  const loadingPercentage = document.getElementById("loading-percentage");
  const statsBox = document.querySelector(".stats-box");
  const buyButton = document.getElementById("buy-button");
  const sellButton = document.getElementById("sell-button");

  let lastUsdPrice = null;
  let ws = null;
  let progress = 0;

  // 固定參數
  const totalCost = 1690000; // 總成本 (TWD)
  const totalQuantity = 21235769401342.17; // 持有量
  const conversionRate = 32.8; // 美元轉台幣匯率

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
    }, 300);
  }

  function connectWebSocket() {
    ws = new WebSocket("wss://stream.binance.com:9443/ws/1mbabydogeusdt@ticker");

    ws.onopen = function () {
      console.log("已連線到 Binance WebSocket (1mbabydogeusdt@ticker)");
    };

    ws.onmessage = function (event) {
      try {
        const data = JSON.parse(event.data);
        const usdPrice = parseFloat(data.c);
        priceElement.textContent = `$${usdPrice.toFixed(7)}`;
        priceElement.style.color = usdPrice < lastUsdPrice ? "orangered" : "#00A67D";
        lastUsdPrice = usdPrice;

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

        completeLoadingBar();
      } catch (error) {
        console.error("處理 WebSocket 訊息錯誤:", error);
      }
    };

    ws.onerror = function (error) {
      console.error("WebSocket 錯誤:", error);
    };

    ws.onclose = function () {
      console.log("WebSocket 連線已關閉，將在 5 秒後重試");
      setTimeout(connectWebSocket, 5000);
    };
  }

  // **如果數據已經載入，則不顯示讀條**
  if (priceElement.textContent !== "Loading...") {
    loadingContainer.style.display = "none";
    statsBox.style.display = "block";
    statsContainer.style.display = "block";
    priceElement.style.display = "inline";
  } else {
    loadingContainer.style.display = "block";
    connectWebSocket();
  }

  // === 行情切換功能 ===
  function showTickers() {
    let existingTicker = document.getElementById("ticker-container");
    if (existingTicker) return;

    statsContainer.classList.remove("visible");
    statsContainer.classList.add("hidden");

    setTimeout(() => {
      statsContainer.style.display = "none";

      const tickerContainer = document.createElement("div");
      tickerContainer.id = "ticker-container";
      tickerContainer.className = "ticker-container hidden";

      statsBox.appendChild(tickerContainer);

      void tickerContainer.offsetWidth;

      tickerContainer.classList.remove("hidden");
      tickerContainer.classList.add("visible");

      connectTickersWebSocket(tickerContainer);
    }, 500);
  }

  function connectTickersWebSocket(tickerContainer) {
    const streams = "btcusdt@ticker/ethusdt@ticker/solusdt@ticker/adausdt@ticker/bnbusdt@ticker/dogeusdt@ticker";
    const wsTickers = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);

    wsTickers.onmessage = function (event) {
      try {
        const message = JSON.parse(event.data);
        if (message.data && message.data.s && message.data.c) {
          const symbol = message.data.s;
          const price = parseFloat(message.data.c).toFixed(2);
          document.querySelector(`#ticker-${symbol}`).textContent = price;
        }
      } catch (error) {
        console.error("行情 WebSocket 訊息錯誤:", error);
      }
    };
  }

  buyButton.addEventListener("click", function (e) {
    e.preventDefault();
    showTickers();
  });

  sellButton.addEventListener("click", function (e) {
    e.preventDefault();
    let tickerContainer = document.getElementById("ticker-container");
    if (tickerContainer) {
      tickerContainer.parentNode.removeChild(tickerContainer);
    }
    statsContainer.style.display = "block";
  });
});
