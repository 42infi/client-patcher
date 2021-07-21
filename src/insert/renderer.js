var request = new XMLHttpRequest();
request.open('GET', 'https://y9x.github.io/userscripts/loader.user.js', false);
request.send();
new Function(request.responseText)();