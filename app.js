const totalQuantity = 21235769401342.17;
const totalPurchasePriceTWD = 1690000;
let progress = 0;
let progressInterval;
let isDataLoaded = false;
let lastUsdPrice = null;

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

        const priceElement = document.getElementById('price-usd');
        priceElement.textContent = formatSmallNumber(usdPrice);
        priceElement.classList.remove("price-up", "price-down");

        if (lastUsdPrice !== null) {
            if (usdPrice > lastUsdPrice) {
                priceElement.classList.add("price-up");
            } else if (usdPrice < lastUsdPrice) {
                priceElement.classList.add("price-down");
            }
        }
        lastUsdPrice = usdPrice;

        document.getElementById('total-quantity').textContent = totalQuantity.toString();
        document.getElementById('total-value').textContent = (totalQuantity * twdPrice).toFixed(2);

        const unrealizedProfit = totalQuantity * twdPrice - totalPurchasePriceTWD;
        const profitPercentage = ((unrealizedProfit / totalPurchasePriceTWD) * 100).toFixed(2);

        document.getElementById('profit').textContent = `NT$${unrealizedProfit.toFixed(2)}`;
        document.getElementById('profit-percentage').textContent = `${profitPercentage}%`;

        document.getElementById('profit').className = `profit ${unrealizedProfit >= 0 ? 'positive' : 'negative'}`;
        document.getElementById('profit-percentage').className = `profit ${unrealizedProfit >= 0 ? 'positive' : 'negative'}`;

        completeLoadingBar();

    } catch (error) {
        console.error("Error fetching price:", error);
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

function formatSmallNumber(num) {
    if (num >= 0.01) return `$${num.toFixed(8)}`;

    const numStr = num.toFixed(12);
    const match = numStr.match(/^0\.(0+)([1-9]\d*)$/);
    return match ? `0.0{${match[1].length}}${match[2]}` : `$${numStr}`;
}

fetchPrice();
setInterval(fetchPrice, 90000);
