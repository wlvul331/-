// 定義一個全域變數保存上一次的美元價格
let lastUsdPrice = null;
let ws = null;
const reconnectInterval = 5000; // 重連間隔 (毫秒)

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

  // 建立並連線 Binance WebSocket 的函式
  function connectWebSocket() {
    // 注意：WebSocket 訂閱時的 symbol 全部使用小寫，並採用新 symbol 1mbabydogeusdt
    ws = new WebSocket('wss://stream.binance.com:9443/ws/1mbabydogeusdt@ticker');

    ws.onopen = function() {
      console.log("已連線到 Binance WebSocket (1mbabydogeusdt@ticker)");
    };

    ws.onmessage = function(event) {
      try {
        const data = JSON.parse(event.data);
        // 從 ticker 流中，"c" 欄位代表最新成交價格
        const usdPrice = parseFloat(data.c);

        // 格式化並顯示當前價格
        priceElement.textContent = formatPrice(usdPrice);
        // 若上次價格存在且新價格下跌，顯示紅色；否則一律綠色
        if (lastUsdPrice !== null && usdPrice < lastUsdPrice) {
          priceElement.style.color = "red";
        } else {
          priceElement.style.color = "#00A67D";
        }
        lastUsdPrice = usdPrice;

        // 計算台幣價格：因為價格為 1M 份的價格，故需除以 1,000,000
        const twdPrice = usdPrice * conversionRate;
        // 更新持幣總價值時除以 1,000,000
        totalQuantityElement.textContent = totalQuantity.toLocaleString();
        totalValueElement.textContent = (totalQuantity * twdPrice / 1e6).toFixed(2);
        // 未實現盈虧也除以 1,000,000
        const unrealizedProfit = totalQuantity * twdPrice / 1e6 - totalCost;
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

        // 第一次收到數據時完成進度條
        if (progress < 100) {
          completeLoadingBar();
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

  // 呼叫函式以建立 WebSocket 連線
  connectWebSocket();

  function completeLoadingBar() {
    progress = 100;
    updateLoadingBar(progress);
    setTimeout(() => {
      loadingContainer.style.display = "none";
      statsContainer.style.display = "block";
      priceElement.style.display = "inline";
    }, 500);
  }

  // 格式化價格函數：
  // 若價格大於 0.01 則顯示 8 位小數；
  // 否則，若小數部分開頭的 0 個數 >= 6 則用 0.0{n} 格式，否則直接顯示正常數字
  function formatPrice(num) {
    if (num >= 0.01) return `$${num.toFixed(8)}`;
    const numStr = num.toFixed(12);
    const match = numStr.match(/^0\.(0+)([1-9]\d*)$/);
    if (match && match[1].length >= 6) {
      return `0.0{${match[1].length}}${match[2]}`;
    } else {
      return `$${numStr}`;
    }
  }
});
