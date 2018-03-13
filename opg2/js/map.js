/*
  @Author Halvard A. Vegum
  @Date 06.03.2018

  This handles markers in the google map.
*/

var map; // global var

if(!String.prototype.contains) {
  // Hvis metoden ikke finnes, definerer vi en egen:
  // Vi trenger denneU metoden for queries
  String.prototype.contains = function (s) {
    return this.indexOf(s) !== -1;
  };
}

if(!Date.now) {
  Date.now = function() {
    return new Date().getTime();
  };
}

window.onload = function() {
  var googleMapScript = document.createElement('script');
  googleMapScript.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyAX-zK3v0QB69Ewp8O6mMh2s21RHTZKf7g&callback=initMap';
  document.getElementsByTagName('head')[0].appendChild(googleMapScript);
  // Hvis vi laster inn google's script etter vårt, garanterer vi at callback-
  // funksjonen 'initMap' eksisterer når kartet lastes inn.

  let now = new Date();
  document.getElementById('date').value = now.toISOString().replace(/T.+Z/, '');
  document.getElementById('hour').value = now.getHours();
  document.getElementById('minute').value = now.getMinutes();
};

function initMap() {
  // Vi utvider google markers til å ha en toggle-metode
  google.maps.Marker.prototype.toggle = function(on) {
    this.setMap(on ? map : null);
  };

  var mapOptions = {
    zoom: 14,
    center: { lat: 60.390475, lng: 5.328369 }
  };

  map = new google.maps.Map(document.getElementById('map'), mapOptions);
  initMarkers();
}

function loadJson() {
  return new Promise((resolve, reject) => {
    // XMLHttpRequest kjører async, så vi returnerer et promise med resolve og reject som callback
    var jsonRequest = new XMLHttpRequest();
    jsonRequest.overrideMimeType('application/json');
    jsonRequest.open('GET', '../data/dokart.json', true);
    jsonRequest.onload = function() {
      if(jsonRequest.status == '200') {
        // Hvis alt i orden (200 OK), parse og resolve
        resolve(JSON.parse(jsonRequest.responseText.replace(/place/g, 'sted')));
        // Vi erstatter 'place' med 'sted' for å unngå konflikter med googleapis
      } else {
        reject(jsonRequest.status + ': ' + jsonRequest.statusText);
      }
    }
    jsonRequest.send(null);
  });
}

async function initMarkers() {
  try {
    // forsøk å hente json, og lagre entries til markers-variabelen
    var markers = (await loadJson()).entries;
  } catch(e) {
    // hvis loadJson sitt promise ble rejected
    console.error(e); // skriv ut feilmelding
    return; // avslutt funksjonen
  }

  var list = document.createElement('ol');

  map.markers = markers.map(marker => {
    marker.position = {lat:numberOr(marker.latitude), lng:numberOr(marker.longitude)};
    marker.pris = numberOr(marker.pris);
    marker.dame = /[1]/.test(marker.dame);
    marker.herre = /[1]/.test(marker.herre);
    marker.rullestol = /[1]/.test(marker.rullestol);
    marker.stellerom = /[1]/.test(marker.stellerom);
    marker.no_pissoir_only = !/[1]/.test(marker.pissoir_only);
    delete marker.pissoir_only;

    marker.tid_hverdag = getTimestampsFromString(marker.tid_hverdag);
    marker.tid_lordag = getTimestampsFromString(marker.tid_lordag);
    marker.tid_sondag = getTimestampsFromString(marker.tid_sondag);

    marker.label = marker.id; // Google Map nummererte labels

    marker = new google.maps.Marker(marker);
    marker.infowindow = new google.maps.InfoWindow({content:
        '<p>'+marker.sted+'</p>'
      + '<p>'+marker.adresse+'</p>'
      + '<p>Pris: '+(marker.pris==0 ? 'gratis' : marker.pris+',-')+'</p>'
    });

    marker.addListener('mouseover', () => marker.infowindow.open(map, marker));
    marker.addListener('mouseout', () => marker.infowindow.close());

    let listElement = document.createElement('li');

    let header = document.createElement('h6');
    header.innerHTML = '<span class="list-numbering">' + marker.id + ': </span>' + marker.sted;

    let address = document.createElement('p');
    address.textContent = marker.adresse;

    listElement.appendChild(header);
    listElement.appendChild(address);

    list.appendChild(listElement);
    return marker;
  });

  document.getElementById('legend').appendChild(list);
  drawMarkers();
}

function drawMarkers() {
  var query = getQuery();

  if(query === null) {
    map.markers.forEach(marker => marker.toggle(true));
    return;
  } else {
    map.markers.filter(marker => {
        marker.toggle(false);
        return filterMarkers(query, marker)
      })
      .forEach(marker => marker.toggle(true));
  }
}

function getQuery() {
  var search = window.location.search.replace('?', '').split('&');
  if(search[0] === '') return null;

  var searchCriteria = {};

  // Vi deler søket i sine navn-verdi par, returnerer null dersom
  // søket er tomt, og gjør klart et objekt til å lagre søket i.

  search.forEach(query => {

    // For hvert navn-verdi-par, del opp paret i en array, og
    // se hvor dataen kom fra. Variabelnavnet skal korrespondere med
    // ID-en til elementet på siden.

    query = query.split('=');
    let elem = document.getElementById(query[0]);

    // Skjekk så hvilken type input variabelen kom fra
    // Dette brukes til å bestemme hvilken type variabelen
    // skal castes til.

    if(elem.type === 'checkbox') {
      query[1] = true;
      elem.checked = query[1];

    } else if(elem.type === 'text') {
      if(query[1] === '') return;
      // Vi dekoder URI-enkodingen
      query[1] = decodeURIComponent(query[1].replace(/[+]/g, ' '));

      let quickSearch = query[1].match(/\b(\W)+:(\W)\b/gi)
      console.log(query[1]);

      elem.value = query[1];

    } else if(elem.type === 'range') {
      query[1] = Number(query[1]);
      elem.value = query[1];
      updatePriceQuery(elem);

    } else if(elem.type === 'date') {
      query[1] = new Date(query[1]);

    } else if(elem.type === 'number') {
      query[1] = Number(query[1]);

    } else {
      // Hvis inputet ikke kan gjenkjennes
      // hopper vi bare over søket
      return;
    }

    searchCriteria[query[0]] = query[1];
    // F.eks.: searchCriteria['fritekst'] = 'galleriet';
  });

  return searchCriteria;
}

function filterMarkers(query, marker) {
  // Hvis søk finnes og markøren ikke stemmer med søket, return false.
  if(query.pris !== undefined && marker.pris > query.pris
  || query.dame !== undefined && marker.dame != query.dame
  || query.herre !== undefined && marker.herre != query.herre
  || query.stellerom !== undefined && marker.stellerom != query.stellerom
  || query.rullestol !== undefined && marker.rullestol != query.rullestol
  || query.no_pissoir_only !== undefined && marker.no_pissoir_only != query.no_pissoir_only
  || query.fritekst !== undefined && // Hvis fritekstsøk OG ingen treff
      !( marker.plassering.toUpperCase().contains(query.fritekst.toUpperCase())
      || marker.adresse.toUpperCase().contains(query.fritekst.toUpperCase())
      || marker.sted.toUpperCase().contains(query.fritekst.toUpperCase())
  )) {
    return false;
  } else {
    return true;
  }


  if(['kjønn:mann', 'pris:2'].reduce((search, bool) => {
    if(bool && searchValid(marker, search))
        return true;
      else {
        return false;
      }
  })) return true;
}

function updatePriceQuery(element) {
  element.nextSibling.textContent = element.value;
}

function numberOr(n, fallback) {
  return isNaN(Number(n)) ? fallback | 0 : Number(n);
}

function getTimestampsFromString(time){
  if(time.match(/ALL/i)) {
    time = true;
  } else if (time.match(/NULL/i)) {
    time = false;
  } else {
    time = time
      .match(/(\d{2}\.\d{2})(?: - )(\d{2}\.\d{2})/)
      .slice(1, 3)
      .map(str => str.split('.').map(n => Number(n)));
  }
  return time;
}

function isOpen(date, time, marker) {

}
