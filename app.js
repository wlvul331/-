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
        if (progress < 80) {
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

        // 確保所有數據載入完成
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

        setTimeout(() => {
            document.getElementById('loading-container').style.display = 'none';
            document.getElementById('stats-container').style.display = 'block';
        }, 500);
    }
}

// ✅ 修正格式化函數，確保 `{N}` 正確
function formatSmallNumber(num) {
    if (num >= 0.01) {
        return `$${num.toFixed(12)}`;
    }

    const numStr = num.toFixed(12);
    const match = numStr.match(/^0\.0+(.*)/);

    if (match) {
        const zeroCount = numStr.split('0').length - 2; // 計算 0 的數量
        return `0.0{${zeroCount}}${match[1]}`;
    }

    return `$${numStr}`;
}

// 執行價格獲取
fetchPrice();
setInterval(fetchPrice, 5000);
