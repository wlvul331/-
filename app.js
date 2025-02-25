const totalQuantity = 21235769401342.17;
const totalPurchasePriceTWD = 1690000;
let lastUsdPrice = null;
let progress = 0;
let progressInterval;

function startLoadingBar() {
    progressInterval = setInterval(() => {
        if (progress < 80) { // 載入時慢慢增加到 80%
            progress += 2;
            document.getElementById('loading-bar-fill').style.width = progress + '%';
            document.getElementById('loading-percentage').textContent = progress + '%';
        }
    }, 100);
}

// 取得即時 USD/TWD 匯率
async function fetchExchangeRate() {
    try {
        const response = await fetch("https://v6.exchangerate-api.com/v6/YOUR_API_KEY/latest/USD");
        const data = await response.json();
        return data.conversion_rates.TWD;
    } catch (error) {
        console.error("獲取匯率失敗:", error);
        return 31.5; // API 失敗時使用預設值
    }
}

async function fetchPrice() {
    startLoadingBar();
    try {
        const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=baby-doge-coin&vs_currencies=usd,twd");
        const data = await response.json();
        const usdPrice = data['baby-doge-coin']['usd'];
        const twdPrice = data['baby-doge-coin']['twd'];

        document.getElementById('price-usd').textContent = `$${usdPrice.toFixed(12)}`;
        document.getElementById('total-value').textContent = (totalQuantity * twdPrice).toFixed(2);

        const unrealizedProfit = totalQuantity * twdPrice - totalPurchasePriceTWD;
        document.getElementById('profit').textContent = unrealizedProfit.toFixed(2);
        document.getElementById('profit-percentage').textContent = ((unrealizedProfit / totalPurchasePriceTWD) * 100).toFixed(2) + '%';

        // 變色
        document.getElementById('profit').className = `profit ${unrealizedProfit >= 0 ? 'positive' : 'negative'}`;
        document.getElementById('profit-percentage').className = `profit ${unrealizedProfit >= 0 ? 'positive' : 'negative'}`;

        // 計算購入均價 (USD)
        const exchangeRate = await fetchExchangeRate();
        const totalCostUSD = totalPurchasePriceTWD / exchangeRate;
        const avgPriceUSD = totalCostUSD / totalQuantity;
        document.getElementById("avg-price").textContent = `$${avgPriceUSD.toFixed(10)}`;

        // 快速跑滿 100%
        clearInterval(progressInterval);
        document.getElementById('loading-bar-fill').style.width = '100%';
        document.getElementById('loading-percentage').textContent = '100%';

        // 顯示數據
        setTimeout(() => {
            document.getElementById('loading-container').style.display = 'none';
            document.getElementById('stats-container').style.display = 'block';
        }, 500);
    } catch (error) {
        console.error("Error fetching price: ", error);
    }
}

setInterval(fetchPrice, 5000);
fetchPrice();
