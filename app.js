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

    function formatPrice(price) {
        let numStr = price.toFixed(12);
        let match = numStr.match(/^0\.0+(.*)/);
        
        if (match) {
            let zeroCount = match[0].length - 3;
            return `0.0{${zeroCount}}${match[1]}`;
        }
        
        return price.toFixed(8);
    }

    function showData() {
        let totalValue = totalQuantity * currentPrice * 31.5; // 轉換為 TWD
        let profit = totalValue - totalCost;
        let profitPercentage = ((profit / totalCost) * 100).toFixed(2);

        priceElement.innerHTML = formatPrice(currentPrice);
        totalValueElement.innerText = totalValue.toFixed(2);
        profitElement.innerText = `NT$${profit.toLocaleString()}`;
        profitPercentageElement.innerText = `${profitPercentage}%`;

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
});
