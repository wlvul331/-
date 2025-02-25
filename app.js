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
  const conversionRate = 32.8;             // 預設美元轉台幣匯率

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

  // 建立 Binance WebSocket 連線，訂閱 babydogeusdt 的 24 小時 ticker 流（所有 symbol 皆為小寫）
  const ws = new WebSocket('wss://stream.binance.com:9443/ws/babydogeusdt@ticker');

  ws.onopen = function() {
    console.log("已連線到 Binance WebSocket (babydogeusdt@ticker)");
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
    console.log("WebSocket 連線已關閉");
  };

  function completeLoadingBar() {
    progress = 100;
    updateLoadingBar(progress);
    setTimeout(() => {
      loadingContainer.style.display = "none";
      statsContainer.style.display = "block";
      priceElement.style.display = "inline";
    }, 500);
  }

  // 格式化價格函數：若價格大於 0.01 則顯示 8 位小數，否則依情況格式化
  function formatPrice(num) {
    if (num >= 0.01) return `$${num.toFixed(8)}`;
    const numStr = num.toFixed(12);
    const match = numStr.match(/^0\.(0+)([1-9]\d*)$/);
    return match ? `0.0{${match[1].length}}${match[2]}` : `$${numStr}`;
  }
});
