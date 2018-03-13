var hover = function() {
  document.getElementById('Wildboye').style.WebkitAnimation='shake .1s infinite linear';
  document.body.style.backgroundColor = 'red';
  document.getElementsByTagName('h1')[0].style.color = 'black';
}
var release = function() {
  document.getElementById('Wildboye').style.WebkitAnimation = '';
  document.body.style.backgroundColor = '';
  document.getElementsByTagName('h1')[0].style.color = '';
}

window.onload = function() {
  var linkContainer = document.createElement('section');
  linkContainer.setAttribute('class', 'links');

  var title = document.createElement('h2');
  title.textContent = "Nyttige lenker";
  linkContainer.appendChild(title);
  document.getElementById('TextContainer').appendChild(linkContainer);

  var usernames = {
    Halvard:  'hve014',
    Maren:    'mkn061',
    Maria:    'msa032',
    Sunniva:  'put006'
  }

  for(let key in usernames) {
    let request = new XMLHttpRequest();
    request.open('GET', 'http://wildboy.uib.no/~'+usernames[key]+'/links.json');
    request.responseType = 'json';

    request.onload = function() {
        var navn = document.createElement('h3');
        navn.textContent = key;
        linkContainer.appendChild(navn);

        try {
          if(request.response == null) throw 'Error with fetching data from: ' + key;
        } catch(err) {
          var empty = document.createElement('p');
          empty.textContent = 'Kunne ikke hente fil';
          linkContainer.appendChild(empty);
          console.error(err);
          return;
        }

        request.response.forEach( response => {
          var newLink = document.createElement('a');
          newLink.innerHTML = response[0];
          newLink.setAttribute('href', response[1]);
          linkContainer.appendChild(newLink);
        });
      }

    request.send();
  }

  var img = new Image();
  img.src = './shiba.png';
  img.onload = function() {
    var oldBoye = document.getElementById('Wildboye');
    oldBoye.src = img.src;
  }
}
