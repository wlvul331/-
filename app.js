document.addEventListener("DOMContentLoaded", function () {
    let priceElement = document.getElementById("price-usd");
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

        // ✅ 設定當前價格格式 {數字}
        priceElement.innerHTML = `0.0{${(currentPrice * 1e11).toFixed(0)}}${(currentPrice * 1e14).toFixed(0)}`;

        totalValueElement.innerText = totalValue.toFixed(2);
        profitElement.innerText = `NT$${profit.toLocaleString()}`;
        profitPercentageElement.innerText = `${profitPercentage}%`;

        // ✅ 盈虧變色
        if (profit >= 0) {
            profitElement.classList.add("positive");
            profitPercentageElement.classList.add("positive");
        } else {
            profitElement.classList.add("negative");
            profitPercentageElement.classList.add("negative");
        }

        // ✅ 顯示數據，隱藏讀取條
        loadingContainer.style.display = "none";
        statsContainer.style.display = "block";
    }
});
