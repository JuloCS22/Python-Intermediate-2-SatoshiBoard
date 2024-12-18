const login = document.getElementById('login-button');
const favorites = document.getElementById('favorites');
const home = document.getElementById('home-button');
favorites.innerHTML = `Favorites`

const mainContent = document.getElementById('main-content');

function renderHome() {
    mainContent.innerHTML = `
        <div class="search-input">
            <input type="text" placeholder="Search here..." id="search-input" />
        </div>
        <div class="results" id="results"></div>
    `;
    const searchInput = document.getElementById('search-input');
    const results = document.getElementById('results');
    searchInput.addEventListener('input', () => {
        handleInput(searchInput, results);
    })
}

renderHome();

home.addEventListener('click', () => {
    renderHome();
})

function handleInput(searchInput, results) {
    console.log(searchInput.value);
    fetch('/search-input', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ query: searchInput.value })
    })
        .then(response => response.json())
        .then(data => {
            results.innerHTML = '';

            data.forEach((item) => {
                const listItem = document.createElement('li');
                listItem.innerHTML = `
                ${item.name}
                <img src="${item.image.small}" alt="${item.name}"/>
                `;

                listItem.addEventListener('click', () => {
                    handleClick(item.id);
                    results.innerHTML = ''
                });
                results.appendChild(listItem);
            });
        })
        .catch(error => console.error(error));
}


function handleClick(id, results) {
    fetch('/handle-click', {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify({id: id})
    })
        .then(response => response.json())
        .then(data => {

            if (data.length === 0) {
                results.innerHTML = `No results found. (happens a lot with the free version)`
                return;
            }
            data.detailed_crypto.forEach((item) => {
                document.getElementById('results').innerHTML = `
                <div class="details">
                    <img class="detail-img" src="${item.image}" alt="${item.name}">
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
                <div id="cryptoChart" style="width:100%; height:400px;"></div>
                `
                document.getElementById('close-button').addEventListener('click', () => {
                    document.getElementById('results').innerHTML = '';
                    document.getElementById('search-input').value = '';
                    if (document.getElementById('cryptoChart')) {
                        document.getElementById('cryptoChart').innerHTML = '';
                    }
                })

                if (data.is_favorite) {
                    console.log(data.is_favorite)
                    document.getElementById('fav-button').classList.add('selected')
                }

                document.getElementById('fav-button').addEventListener('click', () => {
                    handleFavorites(id)
                })

                const buttons = document.querySelectorAll('.graph-button');
                buttons.forEach(button => {
                    button.addEventListener('click', () => {
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

favorites.addEventListener('click', (event) => {
    event.preventDefault();
    console.log('You just clicked on favorites');

    fetch('/favorites', {
        method: 'POST',
        headers: {'content-type': 'application/json'},
    })
        .then(response => response.json())
        .then(response => {
            if (response.success) {
                if (response.favorites.length === 0) {
                    mainContent.innerHTML = `
                    <h3>You don't have any favorites crypto young Satoshi-fan boy</h3>
                    `;
                } else {
                    mainContent.innerHTML = `
                <div class="list-favorites" id="list-favorites">Your favorites crypto:</div>
                `
                response.favorites.forEach(favorite => {
                    const fav = document.createElement('li');
                    fav.innerHTML = `
                    ${favorite.name}
                    <img src="${favorite.image.small}" alt="${favorite.name}">
                    `;

                    fav.addEventListener('click', () => {
                        renderHome()
                        handleClick(favorite.id)
                        console.log(favorite.id)
                    })
                    const list_favorites = document.getElementById('list-favorites');
                    console.log(fav)
                    list_favorites.appendChild(fav)
                })
                }

            } else {
                mainContent.innerHTML = `
<p>You're not connected yet, young Satoshi-fan boy</p>
<p>Click on 'Login' to either create an account or log in to an existing one.</p>
`;
                console.log(response.message)
            }
        })
})

function handleFavorites(id) {
    fetch('/handle-favorites', {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify({ id: id })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById('fav-button').classList.toggle('selected');
            } else {
                alert('You need an account in order to do that cutie')
            }
        })
        .catch(error => console.log(error));
}

