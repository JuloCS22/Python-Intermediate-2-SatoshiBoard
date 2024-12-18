import requests
from flask import Flask, render_template, request, jsonify, session
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)


"""DATABASE SATOSHI"""
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///sastoshi.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

"""GESTION DES COOKIES"""
app.config['SECRET_KEY'] = 'a3F*9jsdfj@93jf930jASDFLkj34#kdjfk!2398JDFKj3J#kd'


db = SQLAlchemy(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(80), nullable=False)
    favorites = db.relationship('Favorite', backref='user', lazy=True)
    def __repr__(self):
        return f"User('{self.id}', '{self.email}')"

class Favorite(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    crypto_id = db.Column(db.String(120), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    def __repr__(self):
        return f"Favorite('{self.crypto_id}', '{self.user_id}')"


"""API"""
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

    is_favorite = False

    if 'user_id' in session:
        user_id = session.get('user_id')
        print('logged')
        if user_id:
            user = User.query.get(user_id)
            print('user_id okay')
            if user:
                favorite_id = {favorite.crypto_id for favorite in user.favorites}
                if clicked_crypto == 'bitcoin':
                    clicked_crypto = 'ordinals'
                if clicked_crypto in favorite_id:
                    is_favorite = True

    return jsonify({'detailed_crypto': detailed_crypto, 'is_favorite': is_favorite})

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

@app.route('/create-account', methods=['POST'])
def create_account():
    data = request.json
    email = data.get('email').lower()
    password = data.get('password')

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({'error': 'Email already exists'}), 400

    hashed_password = generate_password_hash(password)

    new_user = User(email = email, password = hashed_password)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({'success': True}), 201

@app.route('/connect-account', methods=['POST'])
def connect_account():
    data = request.json
    email = data.get('email').lower()
    password = data.get('password')
    user = User.query.filter_by(email=email).first()

    if user and check_password_hash(user.password, password):
        session['user_id'] = user.id
        return jsonify({'success': True,
                        'message':"Logged in successfully",
                        'email': email}), 200

    return jsonify({'success': False}), 400

@app.route('/get-user-info', methods=['POST'])
def get_user_info():
    user_id = session.get('user_id')
    if user_id:
        user = User.query.get(user_id)
        if user:
            return jsonify({'email': user.email,})
        return jsonify({'message': 'User not found'})
    return jsonify({'message': 'User not logged in'})

@app.route('/logout', methods=['POST'])
def logout():
    if 'user_id' in session:
        session.pop('user_id', None)
        return jsonify({'success': True, 'message': "Logged out successfully"}), 200
    return jsonify({'success': False}), 400

@app.route('/handle-favorites', methods=['POST'])
def handle_favorites():
    data = request.json
    crypto_id = data.get('id')
    user_id = session.get('user_id')
    print(user_id, crypto_id)
    if not user_id:
        return jsonify({'success': False}), 401

    favorite = Favorite.query.filter_by(user_id=user_id, crypto_id=crypto_id).first()

    if favorite:
        db.session.delete(favorite)
        db.session.commit()
        return jsonify({'success': True, 'action': "removed"}), 200
    else:
        new_favorite = Favorite(crypto_id=crypto_id, user_id=user_id)
        db.session.add(new_favorite)
        db.session.commit()
        return jsonify({'success': True, 'action': 'added'}), 200

@app.route('/favorites', methods=['POST'])
def favorites():
    if 'user_id' in session:
        user_id = session.get('user_id')
        if user_id:
            user = User.query.get(user_id)
            if user:
                favorites_list = []
                favorite_id = {favorite.crypto_id for favorite in user.favorites}
                for element in FILTERED_CRYPTO:
                    if element['id'] in favorite_id:
                        favorites_list.append(element)
                return jsonify({'success': True, 'favorites' : favorites_list})
            return jsonify({'success': False, 'message': 'User not found'})
        return jsonify({'success': False, 'message': 'User not logged in'})
    return jsonify({'success': False, 'message': 'User not logged in'})
@app.route('/')
def hello_world():  # put application's code here
    return render_template('home.html')


if __name__ == '__main__':
    app.run()
