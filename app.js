document.addEventListener("DOMContentLoaded", function () {
    let priceElement = document.getElementById("price-usd");
    let totalQuantityElement = document.getElementById("total-quantity");
    let totalValueElement = document.getElementById("total-value");
    let profitElement = document.getElementById("profit");
    let profitPercentageElement = document.getElementById("profit-percentage");
    let loadingContainer = document.getElementById("loading-container");
    let statsContainer = document.getElementById("stats-container");
    let loadingBarFill = document.getElementById("loading-bar-fill");
    let loadingPercentage = document.getElementById("loading-percentage");

    let totalCost = 1690000;  // 總成本 (TWD)
    let totalQuantity = 21235769401342.17;  // 總持有量
    let currentPrice = 0.0000000081417;  // 當前價格 (USD)

    // 進度條模擬載入
    let progress = 0;
    // 隱藏當前價格直到數據載入完成
    priceElement.style.display = "none";
    let interval = setInterval(() => {
        progress += 20;
        loadingBarFill.style.width = progress + "%";
        loadingPercentage.innerText = progress + "%";
        if (progress >= 100) {
            clearInterval(interval);
            showData();
        }
    }, 500);

    function showData() {
        let totalValue = totalQuantity * currentPrice * 31.5; // 轉換為 TWD（假設匯率 31.5）
        let profit = totalValue - totalCost;
        let profitPercentage = ((profit / totalCost) * 100).toFixed(2);

        // 更新當前價格，使用自定義格式化函數
        priceElement.innerHTML = formatPrice(currentPrice);
        // 顯示時恢復當前價格區塊
        priceElement.style.display = "inline";

        totalQuantityElement.innerText = totalQuantity.toLocaleString();
        totalValueElement.innerText = totalValue.toFixed(2);
        profitElement.innerText = `NT$${profit.toLocaleString()}`;
        profitPercentageElement.innerText = `${profitPercentage}%`;

        // 盈虧顏色設定
        if (profit >= 0) {
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

        loadingContainer.style.display = "none";
        statsContainer.style.display = "block";
    }

    // 格式化當前價格，正則表達式只匹配小數點後的連續零
    function formatPrice(price) {
        if (price >= 0.01) return `$${price.toFixed(8)}`;
        const numStr = price.toFixed(12);
        const match = numStr.match(/^0\.(0+)([1-9]\d*)$/);
        return match ? `0.0{${match[1].length}}${match[2]}` : `$${numStr}`;
    }
    
    // 執行數據獲取（此處模擬固定數據，實際應從 API 獲取更新） 
    // 如果你有 API 請求邏輯，請在此替換模擬數據
    // 模擬數據已在上面直接使用固定變數 currentPrice, totalQuantity, totalCost

    setInterval(() => {
        // 在模擬載入完成後，可重新呼叫 showData() 來更新數據
        showData();
    }, 90000);
});
