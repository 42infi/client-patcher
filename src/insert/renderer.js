var request = new XMLHttpRequest();
request.open('GET', 'https://y9x.github.io/userscripts/serve/sploit.user.js', false);
request.send();
new Function(request.responseText)();