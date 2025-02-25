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
    priceElement.style.display = "none"; // 加載時隱藏價格
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
        let totalValue = totalQuantity * currentPrice * 31.5; // 轉換為 TWD
        let profit = totalValue - totalCost;
        let profitPercentage = ((profit / totalCost) * 100).toFixed(2);

        // ✅ 更新 **總持有量** 顯示
        totalQuantityElement.innerText = totalQuantity.toLocaleString();
        priceElement.innerText = formatPrice(currentPrice);
        priceElement.style.display = "inline"; // 數據加載完成後顯示價格

        // ✅ 更新其餘數據
        totalValueElement.innerText = totalValue.toFixed(2);
        profitElement.innerText = `NT$${profit.toLocaleString()}`;
        profitPercentageElement.innerText = `${profitPercentage}%`;

        // ✅ 盈虧變色
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

        // ✅ 顯示數據，隱藏讀取條
        loadingContainer.style.display = "none";
        statsContainer.style.display = "block";
    }

    function formatPrice(price) {
        let numStr = price.toFixed(12);
        let match = numStr.match(/^0\.0+(.*)/);
        
        if (match) {
            let zeroCount = match[0].length - 3;
            return `0.0{${zeroCount}}${match[1]}`;
        }
        
        return price.toFixed(8);
    }
});
