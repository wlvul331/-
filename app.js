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

        const avgPrice = (totalPurchasePriceTWD / totalQuantity) / twdPrice;

        document.getElementById('price-usd').textContent = formatSmallNumber(usdPrice);
        document.getElementById('avg-price').textContent = formatSmallNumber(avgPrice);
        document.getElementById('total-value').textContent = (totalQuantity * twdPrice).toFixed(2);

        const unrealizedProfit = totalQuantity * twdPrice - totalPurchasePriceTWD;
        document.getElementById('profit').textContent = `NT$${unrealizedProfit.toFixed(2)}`;
        document.getElementById('profit-percentage').textContent = `${((unrealizedProfit / totalPurchasePriceTWD) * 100).toFixed(2)}%`;

        completeLoadingBar();
    } catch (error) {
        console.error("Error fetching price:", error);
    }
}

setInterval(fetchPrice, 60000);
fetchPrice();
