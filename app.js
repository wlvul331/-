const totalQuantity = 21235769401342.17;
const totalPurchasePriceTWD = 1690000;
let progress = 0;
let progressInterval;
let isAvgPriceLoaded = false;

function startLoadingBar() {
    progressInterval = setInterval(() => {
        if (progress < 80) { // 載入時慢慢增加到 80%
            progress += 2;
            document.getElementById('loading-bar-fill').style.width = progress + '%';
            document.getElementById('loading-percentage').textContent = progress + '%';
        }
    }, 100);
}

// 轉換小數格式為 0.0{N}X
function formatSmallNumber(num) {
    const str = num.toFixed(12);  // 轉成 12 位小數
    const trimmed = str.replace(/0+$/, ""); // 移除尾端不必要的 0
    const match = trimmed.match(/^0\.0+(.*?)$/);

    if (match) {
        const zeroCount = match[0].length - 3; // 減掉 "0.0"
        return `0.0{${zeroCount}}${match[1]}`;
    }
    return num.toFixed(12); // 若非極小數，正常顯示
}


// 取得即時 USD/TWD 匯率
async function fetchExchangeRate() {
    try {
        const response = await fetch("https://v6.exchangerate-api.com/v6/YOUR_API_KEY/latest/USD");
        const data = await response.json();
        return data.conversion_rates.TWD;
    } catch (error) {
        console.error("獲取匯率失敗:", error);
        return null; // API 失敗時回傳 null
    }
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

        // 計算購入均價 (USD)
        const exchangeRate = await fetchExchangeRate();
        if (exchangeRate) {
            const totalCostUSD = totalPurchasePriceTWD / exchangeRate;
            const avgPriceUSD = totalCostUSD / totalQuantity;
            document.getElementById("avg-price").textContent = formatSmallNumber(avgPriceUSD);
        } else {
            document.getElementById("avg-price").textContent = "N/A";
        }

        // 標記購入均價已完成讀取
        isAvgPriceLoaded = true;

        // 進度條完成
        clearInterval(progressInterval);
        document.getElementById('loading-bar-fill').style.width = '100%';
        document.getElementById('loading-percentage').textContent = '100%';

        // 確保所有數據加載完成後才隱藏進度條
        setTimeout(() => {
            if (isAvgPriceLoaded) {
                document.getElementById('loading-container').style.display = 'none';
                document.getElementById('stats-container').style.display = 'block';
            }
        }, 500);
    } catch (error) {
        console.error("Error fetching price: ", error);
    }
}

// 設定輪詢機制，每 5 秒更新一次數據
setInterval(fetchPrice, 5000);
fetchPrice();
