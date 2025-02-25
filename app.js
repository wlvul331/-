// 定義全域變數，保存上一次的美元價格，以及 ticker 更新數據
let lastUsdPrice = null;
let ws = null;
const reconnectInterval = 5000; // 重連間隔 (毫秒)
let tickersData = {};           // 用來存放多個幣種的行情數據

// 用來判斷初始數據是否已經載入完成
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

  // 初始隱藏整個灰色方框、盈虧資訊區、即時價格與按鈕
  statsBox.style.display = "none";
  statsContainer.style.display = "none";
  actionButtons.style.display = "none";
  priceElement.style.display = "none";

  // 固定參數（以台幣計算）
  const totalCost = 1690000;             // 總成本 (TWD)
  const totalQuantity = 21235769401342.17; // 總持有量
  const conversionRate = 32.8;           // 預設美元轉台幣匯率

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

  // 當所有初始數據載入完成後，呼叫 completeLoadingBar()
  function tryCompleteLoading() {
    if (!loadingComplete && mainLoaded && tickersLoaded) {
      completeLoadingBar();
      loadingComplete = true;
    }
  }

  // 載入多個幣種行情（透過 REST API）作為初始數據
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
        console.error("Error fetching initial tickers:", error);
        tickersLoaded = true;
        tryCompleteLoading();
      });
  }

  // 建立並連線 Binance 主 WebSocket (訂閱 1MBABYDOGEUSDT 的 ticker)
  function connectWebSocket() {
    ws = new WebSocket('wss://stream.binance.com:9443/ws/1mbabydogeusdt@ticker');
    ws.onopen = function() {
      console.log("已連線到 Binance WebSocket (1mbabydogeusdt@ticker)");
    };
    ws.onmessage = function(event) {
      try {
        const data = JSON.parse(event.data);
        const usdPrice = parseFloat(data.c); // "c" 為最新成交價格
        priceElement.textContent = formatPrice(usdPrice);
        if (lastUsdPrice !== null && usdPrice < lastUsdPrice) {
          priceElement.style.color = "orangered";
        } else {
          priceElement.style.color = "#00A67D";
        }
        lastUsdPrice = usdPrice;
        const twdPrice = usdPrice * conversionRate;
        totalQuantityElement.textContent = totalQuantity.toLocaleString();
        totalValueElement.textContent = (totalQuantity * twdPrice / 1e6)
          .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const unrealizedProfit = totalQuantity * twdPrice / 1e6 - totalCost;
        const profitPercentage = ((unrealizedProfit / totalCost) * 100).toFixed(2);
        profitElement.textContent = `NT$${Math.round(unrealizedProfit).toLocaleString()}`;
        profitPercentageElement.textContent = `${profitPercentage}%`;
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
        if (!mainLoaded) {
          mainLoaded = true;
          tryCompleteLoading();
        }
      } catch (error) {
        console.error("處理 WebSocket 訊息錯誤:", error);
      }
    };
    ws.onerror = function(error) {
      console.error("WebSocket 錯誤:", error);
    };
    ws.onclose = function() {
      console.log("WebSocket 連線已關閉，將在 " + reconnectInterval / 1000 + " 秒後嘗試重新連線");
      setTimeout(connectWebSocket, reconnectInterval);
    };
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

  function formatPrice(num) {
    return `$${num.toFixed(7)}`;
  }

  // 使用組合 WebSocket 流更新行情（實時更新多個幣種行情）
  function connectTickersWebSocket(tickerContainer) {
    const streams = "btcusdt@ticker/ethusdt@ticker/solusdt@ticker/adausdt@ticker/bnbusdt@ticker/dogeusdt@ticker";
    const wsTickers = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);
    wsTickers.onmessage = function(event) {
      try {
        const message = JSON.parse(event.data);
        if (message.data && message.data.s && message.data.c) {
          const symbol = message.data.s;
          tickersData[symbol] = parseFloat(message.data.c);
          updateTickerDisplay(tickerContainer);
        }
      } catch (error) {
        console.error("處理行情 WebSocket 訊息錯誤:", error);
      }
    };
    wsTickers.onerror = function(error) {
      console.error("行情 WebSocket 錯誤:", error);
    };
    wsTickers.onclose = function() {
      console.log("行情 WebSocket 連線已關閉，將在 " + reconnectInterval / 1000 + " 秒後嘗試重新連線");
      setTimeout(() => connectTickersWebSocket(tickerContainer), reconnectInterval);
    };
  }

  function updateTickerDisplay(tickerContainer) {
    let html = '';
    const symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "ADAUSDT", "BNBUSDT", "DOGEUSDT"];
    symbols.forEach(sym => {
      let price;
      if (tickersData[sym] === undefined) {
        price = "Loading...";
      } else {
        price = `$${tickersData[sym].toFixed(2)}`;
      }
      // 將主幣與 "/USDT" 連在一起，然後顯示冒號及價格
      const coin = sym.slice(0, sym.length - 4);
      html += `<div class="ticker-item">
                 <span class="ticker-coin">${coin}</span><span class="ticker-suffix">/USDT</span>: 
                 <span class="ticker-price">${price}</span>
               </div>`;
    });
    tickerContainer.innerHTML = html;
  }

  // 顯示行情資訊區：當買入按鈕被按下時，隱藏原本的盈虧資訊，並建立 ticker 區塊
  function showTickers() {
    let existingTicker = document.getElementById("ticker-container");
    if (existingTicker) {
      existingTicker.parentNode.removeChild(existingTicker);
    }
    const tickerContainer = document.createElement("div");
    tickerContainer.id = "ticker-container";
    tickerContainer.className = "ticker-container";
    statsContainer.style.display = "none";
    statsBox.appendChild(tickerContainer);
    // 啟動行情 WebSocket 更新（實時更新）
    connectTickersWebSocket(tickerContainer);
  }

  // 當買入按鈕被按下時，顯示行情資訊區
  buyButton.addEventListener("click", function(e) {
    e.preventDefault();
    showTickers();
  });

  // 當賣出按鈕被按下時，清除行情區域並恢復原本盈虧資訊
  sellButton.addEventListener("click", function(e) {
    e.preventDefault();
    // 若存在 ticker 區塊，將其移除
    let tickerContainer = document.getElementById("ticker-container");
    if (tickerContainer) {
      tickerContainer.parentNode.removeChild(tickerContainer);
    }
    statsContainer.style.display = "block";
  });

  // 開始兩個數據載入流程
  connectWebSocket();
  loadTickers();
});
