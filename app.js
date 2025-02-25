const totalQuantity = 21235769401342.17;
const totalPurchasePriceTWD = 1690000;
let progress = 0;
let progressInterval;
let isDataLoaded = false; // 追蹤是否數據已載入

function startLoadingBar() {
    progressInterval = setInterval(() => {
        if (progress < 80) { // 載入時慢慢增加到 80%
            progress += 2;
            document.getElementById('loading-bar-fill').style.width = progress + '%';
            document.getElementById('loading-percentage').textContent = progress + '%';
        }
    }, 100);
}

async function fetchPrice() {
    startLoadingBar();
    try {
        const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=baby-doge-coin&vs_currencies=usd,twd");
        const data = await response.json();
        const usdPrice = data['baby-doge-coin']['usd'];
        const twdPrice = data['baby-doge-coin']['twd'];

        document.getElementById('price-usd').textContent = formatSmallNumber(usdPrice);
        document.getElementById('total-value').textContent = (totalQuantity * twdPrice).toFixed(2);

        const unrealizedProfit = totalQuantity * twdPrice - totalPurchasePriceTWD;
        document.getElementById('profit').textContent = unrealizedProfit.toFixed(2);
        document.getElementById('profit-percentage').textContent = ((unrealizedProfit / totalPurchasePriceTWD) * 100).toFixed(2) + '%';

        // 變色
        document.getElementById('profit').className = `profit ${unrealizedProfit >= 0 ? 'positive' : 'negative'}`;
        document.getElementById('profit-percentage').className = `profit ${unrealizedProfit >= 0 ? 'positive' : 'negative'}`;

        // **所有數據載入完成後**
        isDataLoaded = true;
        hideLoadingBar();

    } catch (error) {
        console.error("Error fetching price: ", error);
    }
}

function hideLoadingBar() {
    if (isDataLoaded) {
        clearInterval(progressInterval);
        document.getElementById('loading-bar-fill').style.width = '100%';
        document.getElementById('loading-percentage').textContent = '100%';

        // **確保隱藏進度條，顯示數據**
        setTimeout(() => {
            document.getElementById('loading-container').style.display = 'none';
            document.getElementById('stats-container').style.display = 'block';
        }, 500);
    }
}

// 確保 fetchPrice 執行後，載入完才隱藏進度條
fetchPrice();
setInterval(fetchPrice, 5000);
