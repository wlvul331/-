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
        if (progress < 90) { // **最多到 90%，避免 API 太慢時卡住**
            progress += 2;
            updateLoadingBar(progress);
        }
    }, 80);
}

function updateLoadingBar(value) {
    document.getElementById('loading-bar-fill').style.width = value + '%';
    document.getElementById('loading-percentage').textContent = value + '%';
}

async function fetchPrice() {
    startLoadingBar();
    try {
        const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=baby-doge-coin&vs_currencies=usd,twd");
        if (!response.ok) throw new Error("API 回應錯誤");

        const data = await response.json();
        const usdPrice = data['baby-doge-coin']['usd'];
        const twdPrice = data['baby-doge-coin']['twd'];

        // 更新 UI
        document.getElementById('price-usd').textContent = formatSmallNumber(usdPrice);
        const totalValue = totalQuantity * twdPrice;
        document.getElementById('total-value').textContent = totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 });

        const unrealizedProfit = totalValue - totalPurchasePriceTWD;
        document.getElementById('profit').textContent = unrealizedProfit.toLocaleString(undefined, { minimumFractionDigits: 2 });
        document.getElementById('profit-percentage').textContent = ((unrealizedProfit / totalPurchasePriceTWD) * 100).toFixed(2) + '%';

        // 設置盈虧顏色
        const profitClass = unrealizedProfit >= 0 ? 'positive' : 'negative';
        document.getElementById('profit').className = `profit ${profitClass}`;
        document.getElementById('profit-percentage').className = `profit ${profitClass}`;

        // **API 回應後，快速完成進度條**
        isDataLoaded = true;
        completeLoadingBar();

    } catch (error) {
        console.error("Error fetching price: ", error);
        document.getElementById('price-usd').textContent = "載入失敗";
        document.getElementById('total-value').textContent = "載入失敗";
        document.getElementById('profit').textContent = "載入失敗";
        document.getElementById('profit-percentage').textContent = "載入失敗";

        completeLoadingBar();
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

// ✅ **修正格式化小數方式**
function formatSmallNumber(num) {
    if (num >= 0.01) return `$${num.toFixed(8)}`;

    const numStr = num.toFixed(12);
    const match = numStr.match(/^0\.0+(.*)/);
    
    if (match) {
        const zeroCount = numStr.match(/0/g).length - 2; // 計算 0 的數量
        return `0.0{${zeroCount}}${match[1]}`;
    }
    
    return `$${numStr}`;
}

// **初次載入**
fetchPrice();

// **每 10 秒更新一次**
setInterval(fetchPrice, 10000);
