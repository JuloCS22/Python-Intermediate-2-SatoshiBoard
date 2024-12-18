window.addEventListener('DOMContentLoaded', () => {
    fetch('/get-user-info', {
        method: 'POST',
        headers: {'Content-type': 'application/json'}
    })
        .then(res => res.json())
        .then(data => {
            console.log(data.email)
            console.log(data)
            if (data.email) {
                document.getElementById('login-button').innerHTML = `Account`;
            } else {
                document.getElementById('login-button').innerHTML = 'Login';
            }
        })
        .catch(error => {console.log(error)})
})
login.addEventListener('click', (event) => {
    event.preventDefault();
    if (login.innerHTML === 'Login') {
    mainContent.innerHTML = `
    <h3>Create Account</h3>
    <form id="create-account-form" class="login-form">
        <label for="email">Email Adress : 
            <input type="email" placeholder="" id="email"/>
        </label>
        <label for="password">Password : 
            <input type="password" placeholder="" id="password">
        </label>
        <div class="connection-buttons">
        <button type="submit" id="create-button">Create</button>
        <button class="connect-button" id="connect-button">I have an account</button>
        </div>
        <span class="error" id="error"></span>
    </form>
    `;
    document.getElementById('create-account-form').addEventListener('submit', handleCreateAccount)
    document.getElementById('connect-button').addEventListener('click', handleClickAccount)
    } else {
        fetch('/get-user-info', {
            method: 'POST',
        })
            .then(response => response.json())
            .then(data => {
                if (data.email) {
                    mainContent.innerHTML = `
                    <h3>Account name : ${data.email}</h3>
                    <button id="logout-button">Logout</button>
                    `;
                    document.getElementById('logout-button').addEventListener('click', handleLogout)
                } else {
                    mainContent.innerHTML = `${data.message}`
                }
            })
    }
})

function handleClickAccount(event) {
    event.preventDefault();
    document.getElementById('main-content').innerHTML = `
    <h3>Connect to your account</h3>
    <form id="connect-account-form" class="login-form">
        <label for="email">Email Adress : 
            <input type="email" placeholder="" id="email"/>
        </label>
        <label for="password">Password : 
            <input type="password" placeholder="" id="password">
        </label>
        <div class="connection-buttons">
        <button type="submit" id="connect-account">Connection</button>
        </div>
        <span class="error" id="error"></span>
    </form>
    `
    document.getElementById('connect-account-form').addEventListener('submit', handleConnectAccount)
}

function handleCreateAccount(event) {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const error = document.getElementById('error');

    const passwordPattern = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%/^&*])[A-Za-z\d!@#$%^&*]{8,}$/;

    if (!passwordPattern.test(password)) {
        error.classList.add('invalid');
        error.innerHTML = 'Password must be at least 8 characters long, contain at least one uppercase letter, one digit, and one special character (!@#$%^&*).';
        return
    }

    fetch('/create-account', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                error.classList.remove('invalid');
                error.innerHTML = "Account created successfully";
                document.getElementById('email').value = '';
                document.getElementById('password').value = '';
            } else {
                alert(`Error : ${data.message}`)
            }
        })
        .catch(error => console.log(error));
}

function handleConnectAccount(event) {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const error = document.getElementById('error');

    fetch('/connect-account', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                mainContent.innerHTML = `
                <h3>Welcome ${data.email}</h3>
                <button id="logout-button" >Logout</button>
                `;
                document.getElementById('logout-button').addEventListener('click', handleLogout)
                document.getElementById('login-button').innerHTML = `Account`
            } else {
                error.classList.add('invalid');
                error.innerHTML = 'Incorrect password or login'
            }
        })
        .catch(error => console.log(error));
}

function handleLogout() {
    fetch('/logout', { method: 'POST' })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                handleClickAccount(new Event('click'));
                login.innerHTML = 'Login';
            }
        })
}