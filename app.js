const totalQuantity = 21235769401342.17;
const totalPurchasePriceTWD = 1690000;
let progress = 0;
let progressInterval;
let isDataLoaded = false;

const proxyUrl = "https://corsproxy.io/?";
const apiUrl = "https://api.coingecko.com/api/v3/simple/price?ids=baby-doge-coin&vs_currencies=usd,twd";

function startLoadingBar() {
    progress = 0;
    progressInterval = setInterval(() => {
        if (progress < 80) {
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
        const response = await fetch(proxyUrl + apiUrl);
        if (!response.ok) throw new Error("API 回應錯誤");

        const data = await response.json();
        const usdPrice = data['baby-doge-coin']['usd'];
        const twdPrice = data['baby-doge-coin']['twd'];

        // ✅ 更新數據顯示
        document.getElementById('price-usd').textContent = formatSmallNumber(usdPrice);
        document.getElementById('total-quantity').textContent = totalQuantity.toLocaleString();
        document.getElementById('total-value').textContent = `NT$${(totalQuantity * twdPrice).toLocaleString()}`;
        document.getElementById('total-cost').textContent = `NT$${totalPurchasePriceTWD.toLocaleString()}`;

        // 📌 計算盈虧
        const unrealizedProfit = totalQuantity * twdPrice - totalPurchasePriceTWD;
        const profitPercentage = ((unrealizedProfit / totalPurchasePriceTWD) * 100).toFixed(2);

        document.getElementById('profit').textContent = `NT$${unrealizedProfit.toLocaleString()}`;
        document.getElementById('profit-percentage').textContent = `${profitPercentage}%`;

        // ✅ 設置盈虧顏色
        const profitElement = document.getElementById('profit');
        const percentageElement = document.getElementById('profit-percentage');

        if (unrealizedProfit >= 0) {
            profitElement.classList.add('positive');
            percentageElement.classList.add('positive');
            profitElement.classList.remove('negative');
            percentageElement.classList.remove('negative');
        } else {
            profitElement.classList.add('negative');
            percentageElement.classList.add('negative');
            profitElement.classList.remove('positive');
            percentageElement.classList.remove('positive');
        }

        isDataLoaded = true;
        completeLoadingBar();

    } catch (error) {
        console.error("Error fetching price:", error);
        document.getElementById('price-usd').textContent = "數據加載失敗";
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

// ✅ 修正顯示小數格式
function formatSmallNumber(num) {
    if (num >= 0.01) return num.toFixed(8);

    const numStr = num.toFixed(12);
    const match = numStr.match(/^0\.0+(.*)/);

    if (match) {
        const zeroCount = match[0].length - 3;
        return `0.0{${zeroCount}}${match[1]}`;
    }

    return numStr;
}

// ⏳ 執行價格獲取
fetchPrice();
setInterval(fetchPrice, 90000); // ✅ 90 秒更新一次
