const totalQuantity = 21235769401342.17;
const totalPurchasePriceTWD = 1690000;
let progress = 0;
let progressInterval;
let isDataLoaded = false;

function startLoadingBar() {
    progress = 0;
    document.getElementById('loading-bar-fill').style.width = '0%';
    document.getElementById('loading-percentage').textContent = '0%';

    progressInterval = setInterval(() => {
        if (progress < 80) { // 讀取時緩慢增加到 80%
            progress += 2;
            updateLoadingBar(progress);
        }
    }, 100);
}

function updateLoadingBar(value) {
    document.getElementById('loading-bar-fill').style.width = value + '%';
    document.getElementById('loading-percentage').textContent = value + '%';
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

        // **進度條快速填滿 100%**
        isDataLoaded = true;
        completeLoadingBar();

    } catch (error) {
        console.error("Error fetching price: ", error);
    }
}

function completeLoadingBar() {
    clearInterval(progressInterval);
    progress = 100;
    updateLoadingBar(progress);

    setTimeout(() => {
        document.getElementById('loading-container').style.display = 'none';
        document.getElementById('stats-container').style.display = 'block';
    }, 500);
}

// ✅ 修正 `{N}` 顯示方式
function formatSmallNumber(num) {
    if (num >= 0.01) {
        return `$${num.toFixed(12)}`;
    }

    const numStr = num.toFixed(12);
    const match = numStr.match(/^0\.0+(.*)/);

    if (match) {
        const zeroCount = numStr.split('0').length - 2;
        return `0.0{${zeroCount}}${match[1]}`;
    }

    return `$${numStr}`;
}

// 執行價格獲取
fetchPrice();
setInterval(fetchPrice, 5000);
