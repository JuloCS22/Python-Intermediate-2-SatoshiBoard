favorites.addEventListener('click', (event) => {
    event.preventDefault();

    // Vérifie que favorites et mainContent existent
    console.log(favorites);
    console.log(mainContent);

    // Vide le contenu de mainContent
    console.log('Clearing mainContent...');
    mainContent.innerHTML = ``;
    console.log('mainContent cleared.');

    // Fetch vers le serveur
    fetch('/favorites', {
        method: 'POST',
        headers: {'content-type': 'application/json'},
    })
        .then(response => {
            console.log(response); // Vérifie la réponse brute
            return response.json(); // Parse en JSON
        })
        .then(data => {
            console.log(data); // Affiche les données reçues
            // Insère quelque chose dans mainContent pour confirmer que ça fonctionne
            mainContent.innerHTML = `<p>${data.message || 'No message returned'}</p>`;
        })
        .catch(error => {
            console.error('Erreur fetch:', error);
        });
});



export function handleFavorites(id) {
    console.log(id)
}