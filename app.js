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

  // 固定參數（假設總成本與持有量固定）
  const totalCost = 1690000;  // 總成本 (TWD)
  const totalQuantity = 21235769401342.17;  // 總持有量

  // API 參數：透過 CORS 代理取得 CoinGecko 數據
  const proxyUrl = "https://corsproxy.io/?";
  const apiUrl = "https://api.coingecko.com/api/v3/simple/price?ids=baby-doge-coin&vs_currencies=usd,twd";

  // 開始載入進度條
  let progress = 0;
  startLoadingBar();

  function startLoadingBar() {
    progress = 0;
    loadingBarFill.style.width = "0%";
    loadingPercentage.textContent = "0%";
    // 模擬進度條（直到 API 資料回來）
    let interval = setInterval(() => {
      if (progress < 80) {
        progress += 10;
        updateLoadingBar(progress);
      }
    }, 200);
  }

  function updateLoadingBar(value) {
    loadingBarFill.style.width = value + "%";
    loadingPercentage.textContent = value + "%";
  }

  async function fetchPrice() {
    try {
      // 透過代理取得 API 數據
      const response = await fetch(proxyUrl + apiUrl);
      if (!response.ok) throw new Error("API 回應錯誤");
      const data = await response.json();
      
      // 從 API 取得 BabyDoge 價格（USD 與 TWD）
      const usdPrice = data["baby-doge-coin"]["usd"];
      const twdPrice = data["baby-doge-coin"]["twd"];

      // 更新當前價格：使用 formatPrice 格式化
      priceElement.textContent = formatPrice(usdPrice);
      
      // 根據與上次的價格比對，動態調整顏色：上漲為綠色，下跌為紅色
      if (lastUsdPrice !== null) {
        if (usdPrice > lastUsdPrice) {
          priceElement.style.color = "#0f0"; // 上漲顯示綠色
        } else if (usdPrice < lastUsdPrice) {
          priceElement.style.color = "red"; // 下跌顯示紅色
        } else {
          priceElement.style.color = "white"; // 無變化顯示預設顏色
        }
      }
      lastUsdPrice = usdPrice;
      
      // 更新總持有量（使用 toLocaleString() 加入千分位）
      totalQuantityElement.textContent = totalQuantity.toLocaleString();

      // 更新當前持幣總價值 (TWD)
      totalValueElement.textContent = (totalQuantity * twdPrice).toFixed(2);

      // 計算盈虧與盈虧率
      const unrealizedProfit = totalQuantity * twdPrice - totalCost;
      const profitPercentage = ((unrealizedProfit / totalCost) * 100).toFixed(2);

      profitElement.textContent = `NT$${unrealizedProfit.toLocaleString()}`;
      profitPercentageElement.textContent = `${profitPercentage}%`;

      // 設置盈虧顏色：盈餘為綠色，虧損為紅色
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

      completeLoadingBar();
    } catch (error) {
      console.error("Error fetching price:", error);
      priceElement.textContent = "數據加載失敗";
      completeLoadingBar();
    }
  }

  function completeLoadingBar() {
    progress = 100;
    updateLoadingBar(progress);
    setTimeout(() => {
      loadingContainer.style.display = "none";
      statsContainer.style.display = "block";
      // 顯示當前價格區塊
      priceElement.style.display = "inline";
    }, 500);
  }

  // 格式化價格：若大於 0.01 則顯示 8 位小數，否則以 0.0{N}xxxx 格式顯示
  function formatPrice(num) {
    if (num >= 0.01) return `$${num.toFixed(8)}`;
    const numStr = num.toFixed(12);
    const match = numStr.match(/^0\.(0+)([1-9]\d*)$/);
    return match ? `0.0{${match[1].length}}${match[2]}` : `$${numStr}`;
  }

  // 初次獲取價格
  fetchPrice();
  // 每 90 秒更新一次
  setInterval(fetchPrice, 90000);
});
