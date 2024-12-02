const searchInput = document.getElementById('search-input');
const clickedCrypto= document.getElementById('clicked-crypto');
const listElement = document.getElementsByName('li');

function handleInput() {

    fetch('/search-input', {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify({query: searchInput.value})
    })
        .then(response => response.json())
        .then(data => {
            const results = document.getElementById('results');
            results.innerHTML = '';
            document.getElementById('cryptoChart').innerHTML = '';

            data.forEach((item) => {
                const listItem = document.createElement('li');

                listItem.innerHTML = `
                ${item.name}
                <img src="${item.image.small}" alt="${item.name}"/>
                `;

                listItem.addEventListener('click', () => {
                    handleClick(item.id);
                    results.innerHTML = ''
                })

                document.getElementById('results').appendChild(listItem);
            })
        })
        .catch(error => console.log(error));
}

function handleClick(id) {
    fetch('/handle-click', {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify({id: id})
    })
        .then(response => response.json())
        .then(data => {

            if (data.length === 0) {
                document.getElementById('results').innerHTML = `No results found. (happens a lot with the free version)`
                return;
            }
            data.forEach((item) => {
                document.getElementById('results').innerHTML = `
                <div class="details">
                    <img class="detail-img" src="${item.image}">
                    <div class="info-crypto">
                        <div class="upper-buttons">
                            <button class="fav-button" id="fav-button"><i class="fas fa-heart"></i></button>
                            <button class='close-button' id="close-button"><i class="fas fa-times"></i></button>
                        </div>
                        <h3>${item.name}</h3>
                        <p>Current Price: $${item.current_price?.toLocaleString('en-US') || 'N/A'}</p>
                        <h4>${item.name} Statistics</h4>
                        <p>Market Cap: $${item.market_cap?.toLocaleString('en-US') || 'N/A'}</p>
                        <p>Fully Diluted Valuation: $${item.fully_diluted_valuation?.toLocaleString('en-US') || 'N/A'}</p>
                        <p>Circulating Supply: ${item.circulating_supply?.toLocaleString('en-US') || 'N/A'}</p>
                        <p>Totaly Supply: ${item.total_supply?.toLocaleString('en-US') || 'N/A'}</p>
                        <p>Max Supply: ${item.max_supply?.toLocaleString('en-US') || 'N/A'}</p>
                    </div>
                </div>
                <div class="buttons">
                    <button class="graph-button" data-days="1">24 Hours</button>
                    <button class="graph-button" data-days="30">30 Days</button>  
                    <button class="graph-button" data-days="90">3 Months</button>  
                    <button class="graph-button" data-days="180">6 Months</button>  
                </div>
                `
                document.getElementById('close-button').addEventListener('click', () => {
                    document.getElementById('results').innerHTML = '';
                    document.getElementById('cryptoChart').innerHTML = '';
                    document.getElementById('search-input').value = '';
                })

                document.getElementById('fav-button').addEventListener('click', () => {
                    document.getElementById('fav-button').classList.toggle('selected');
                })

                const buttons = document.querySelectorAll('.graph-button');
                buttons.forEach(button => {
                    button.addEventListener('click', (event) => {
                        const days = button.getAttribute('data-days');
                        const id = item.id;
                        showGraph(days, id)
                    });
                })
            })
        })
}

function showGraph(days, id) {
    fetch('/show-graph', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ days: days, id: id })
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.log(data.error);
                document.getElementById('cryptoChart').innerHTML = `<p>Error: ${data.error}</p>`;
                return;
            }

            const formattedData = data.date.map((date, index) => {
                const price = data.prices[index];
                if (!price || isNaN(price)) return null; // Filtre les points invalides
                const [day, month, hour] = date.match(/(\d{2})\/(\d{2}) (\d{2}):\d{2}/).slice(1);
                const timestamp = new Date(2024, month - 1, day, hour).getTime();
                return [timestamp, price];
            }).filter(point => point !== null);

            Highcharts.chart('cryptoChart', {
                chart: {
                    zooming: { type: 'x' }
                },
                title: {
                    text: `${id.charAt(0).toUpperCase() + id.slice(1)} Price Evolution (${days} Days)`,
                    align: 'left'
                },
                xAxis: {
                    type: 'datetime',
                    title: { text: 'Date and Time' },
                    minRange: 3600 * 1000
                },
                yAxis: {
                    title: { text: 'Price (CAD)' }
                },
                tooltip: {
                    shared: true,
                    xDateFormat: '%d/%m/%Y %H:%M',
                    valueDecimals: 2,
                    valuePrefix: '$'
                },
                legend: { enabled: false },
                series: [{
                    type: 'line',
                    name: 'Exchange Rate',
                    data: formattedData,
                    marker: {
                        enabled: true,
                        radius: 2
                    }
                }],
                plotOptions: {
                    series: {
                        turboThreshold: 0,
                        dataGrouping: { enabled: false }
                    }
                }
            });
        })
        .catch(error => console.log(error));
}

function closeCrypto() {

}



searchInput.addEventListener('input', handleInput);
