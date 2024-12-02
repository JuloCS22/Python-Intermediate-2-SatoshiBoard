import requests
from flask import Flask, render_template, request, jsonify
from datetime import datetime

"""
5. Création de la DB en local
5. Création du compte et ajout ou non des favoris
"""


app = Flask(__name__)

API_KEY = 'CG-6KQErSQSJsQzaSk3c3Dyv89p'
URL_LIST = 'https://api.coingecko.com/api/v3/asset_platforms'
LIST_CRYPTO = requests.get(URL_LIST).json()
FILTERED_CRYPTO = []

for crypto in LIST_CRYPTO:
    if crypto.get('image') and crypto['image'].get('small'):
        FILTERED_CRYPTO.append(crypto)


@app.route('/search-input', methods=['POST'])
def search_input():
    data = request.json
    search_input = data.get('query', '').lower()

    filtered_list = [
        crypto for crypto in FILTERED_CRYPTO
        if search_input
        if crypto.get('name', '').lower().startswith(search_input)
    ]

    return jsonify(filtered_list)

@app.route('/handle-click', methods=['POST'])
def handle_click():
    # APPEL POUR LE DÉTAIL DE LA CRYPTO
    data = request.json
    clicked_crypto = data.get('id', '').lower()
    if clicked_crypto == 'ordinals':
        clicked_crypto = 'bitcoin'
    url_details = f"https://api.coingecko.com/api/v3/coins/markets?vs_currency=cad&ids={clicked_crypto}&x_cg_demo_api_key={API_KEY}"
    detailed_crypto = requests.get(url_details).json()


    return jsonify(detailed_crypto)

@app.route('/show-graph', methods=['POST'])
def show_graph():
    # APPEL POUR L'HISTORIQUE DE LA CRYPTO SUR X JOURS
    data = request.json
    clicked_crypto = data.get('id', '').lower()
    days = data.get('days', 7)
    url_history = f"https://api.coingecko.com/api/v3/coins/{clicked_crypto}/market_chart"
    params = {
        'vs_currency': 'cad',
        'days': days
    }

    response = requests.get(url_history, params=params)
    chart_data = response.json()

    price_history = {
        'date': [datetime.fromtimestamp(item[0] / 1000).strftime('%d/%m %H:00') for item in chart_data['prices']],
        'prices': [item[1] for item in chart_data['prices']]
    }


    return jsonify(price_history)

@app.route('/')
def hello_world():  # put application's code here
    return render_template('home.html')


if __name__ == '__main__':
    app.run()
