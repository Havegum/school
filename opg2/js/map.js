/*
  @Author Halvard A. Vegum
  @Date 06.03.2018

  This handles markers in the google map.
*/

 // Vi lagrer kartet
var map;

if(!String.prototype.includes) {
  // Hvis metoden ikke finnes, definerer vi en egen:
  String.prototype.includes = String.prototype.contains || function (s) {
    return this.indexOf(s) !== -1;
  };
}

window.onload = function() {
  // Vi begynner å laste ned JSON-filen
  var json = loadJSON();

  // Vi laster inn google maps script etter alt er lastet ned for å
  // garantere at vår kode kjører etter google maps er klar
  var googleMapScript = document.createElement('script');
  googleMapScript.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyAX-zK3v0QB69Ewp8O6mMh2s21RHTZKf7g';
  document.getElementsByTagName('head')[0].appendChild(googleMapScript);

  // Vi laster inn google-scriptet separat slik at vi garanterer
  // at google-metodene er klare når vi kjører koden vår.
  googleMapScript.onload = async function() {
    // initMap viser kartet på siden
    initMap();

    // map.markers får verdi av initMarkers, som venter på (await) loadJSON
    map.markers = new Promise(resolve => resolve(initMarkers(json)));

    // drawMarkers kalles, men må venter på (await) map.markers
    drawMarkers();

    // Hvis vi venter på loadJSON kan vi like gjerne hente dagens dato ...
    let now = new Date();
    document.getElementById('hour').placeholder = now.getHours();
    document.getElementById('minute').placeholder = now.getMinutes();
  }
};

function loadJSON() {
  return new Promise((resolve, reject) => {
    // XMLHttpRequest kjører async, så vi returnerer et promise med resolve og reject som callback
    var jsonRequest = new XMLHttpRequest();
    jsonRequest.overrideMimeType('application/json');
    // jsonRequest.open('GET', '../data/dokart.json', true);
    jsonRequest.open('GET', 'http://hotell.difi.no/api/json/bergen/dokart?', true);
    jsonRequest.onload = function() {
      if(jsonRequest.status == '200') {
        // Hvis alt i orden (200 OK), parse & resolve
        resolve(JSON.parse(jsonRequest.responseText).entries);
      } else {
        // Ellers: vis feilmeldingen
        reject(jsonRequest.status + ': ' + jsonRequest.statusText);
      }
    }
    jsonRequest.send(null);
  });
}

function initMap() {
  // den globale variabelen map er nå et google.maps.Map-objekt der
  // elementet er html-elementet med id "map"
  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 14,
    center: { lat: 60.390475, lng: 5.328369 }
  });
}

async function initMarkers(json) {
  var list = document.createElement('ol');

  try {
    var markers = await json;
  } catch (e) {
    console.error(e);
    return;
  }

  map.markers = markers
    .map(marker => cleanupMarker(marker))
    .map(marker => {

      // HTML listeelement
      let listElement = document.createElement('li');

      let header = document.createElement('h6');
      header.innerHTML = '<span class="list-numbering">' + marker.id + ': </span>' + marker.sted;

      let address = document.createElement('p');
      address.textContent = marker.adresse;

      listElement.appendChild(header);
      listElement.appendChild(address);

      list.appendChild(listElement);
      return marker;
    })
    .map(marker => {
      // Google Maps Marker
      marker = new google.maps.Marker(marker);
      marker.infowindow = new google.maps.InfoWindow({content:
          '<p>' + marker.sted + '</p>'
        + '<p>' + marker.adresse + '</p>'
        + '<p>Pris: '+ (marker.pris === 0 ? 'gratis' : marker.pris + ',-') + '</p>'
      });
      marker.addListener('mouseover', () => marker.infowindow.open(map, marker));
      marker.addListener('mouseout', () => marker.infowindow.close());
      marker.setMap(map);
      return marker;
    });

  document.getElementById('legend').appendChild(list);
}

function cleanupMarker(marker) {
  marker.pris = numberOr(marker.pris);
  marker.dame = /^[1]$/.test(marker.dame);
  marker.herre = /^[1]$/.test(marker.herre);
  marker.rullestol = /^[1]$/.test(marker.rullestol);
  marker.stellerom = /^[1]$/.test(marker.stellerom);
  marker.no_pissoir_only = !/^[1]$/.test(marker.pissoir_only);
  delete marker.pissoir_only;

  marker.tid_hverdag = parseTimeRange(marker.tid_hverdag);
  marker.tid_lordag = parseTimeRange(marker.tid_lordag);
  marker.tid_sondag = parseTimeRange(marker.tid_sondag);
  marker.getOpenings = function(day) {
    // Dersom undefined:
    day = Number(day) % 7 || new Date().getDay();

    if(day == 5) {
      return this.tid_lordag;
    } else if (day == 6) {
      return this.tid_sondag;
    } else {
      return this.tid_hverdag;
    }
  }

  // disse variablene blir brukt av google.maps.Marker-objekter
  // position er koordinatene til markøren
  marker.position = {
    lat: numberOr(marker.latitude),
    lng: numberOr(marker.longitude)
  };
  // vi lagrer place til sted for å unngå konflikter
  marker.sted = marker.place;
  delete marker.place;
  // Google Map bruker label for å lage merkelapper på markørene
  marker.label = marker.id;

  return marker;
}

async function drawMarkers(skipQuery) {
  // Vi kan hente query selv om map.markers ikke er klar
  var query = getQuery();
  // Så venter vi på map.markers ...
  await map.markers;

  if(query === null || skipQuery) {
    // Dersom ingen query, vis alle og returner
    map.markers.forEach(marker => marker.setVisible(true));
    return;
  }

  // Skjul alle, filtrer markører etter query, og vis de resterende
  map.markers
    .map(marker => { marker.setVisible(false); return marker; })
    .filter(marker => filterMarkers(query, marker))
    .forEach(marker => marker.setVisible(true));
}

function getQuery() {
  var search = window.location.search.replace('?', '').split('&');
  if(search[0] === '') return null;

  var searchCriteria = {};

  // Vi deler søket i sine navn-verdi par, returnerer null dersom
  // søket er tomt, og gjør klart et objekt til å lagre søket i.

  search.forEach(query => {

    // For hvert navn-verdi-par, del opp paret i en array, og
    // se hvor dataen kom fra. Variabelnavnet skal korrespondere
    // med ID-en til elementet på siden.

    query = query.split('=');
    if(query[1] === '') return; // Vi hopper over emptystring queries
    let elem = document.getElementById(query[0]);

    // Skjekk så hvilken type input variabelen kom fra
    // Dette brukes til å bestemme hvilken type variabelen
    // skal castes til.


    if(elem.type === 'checkbox') {
      // Checkbox dukker opp kun dersom verdien er true
      query[1] = true;
      elem.checked = true;

    } else if(elem.type === 'text') {
      // Vi dekoder URI-enkodingen
      query[1] = decodeURIComponent(query[1].replace(/[+]/g, ' '));

      let quickSearch = query[1].match(/\b(\W)+:(\W)\b/gi);
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
      // Hvis inputet ikke kan gjenkjennes hopper vi bare over søket
      return;
    }

    searchCriteria[query[0]] = query[1];
    // F.eks.: searchCriteria['fritekst'] = 'galleriet';
  });

  return searchCriteria;
}

function filterMarkers(query, marker) {
  // Hvis søk finnes og markøren ikke stemmer med søket, return false.
  if(
    matchSimpleQueries(query, marker) &&
    matchTextQuery(query, marker) &&
    isOpen(marker, [query.hour, query.minute], query.date)) {
    return true;
  } else {
    return false;
  }
  // if(['kjønn:mann', 'pris:2'].reduce((search, bool) => {
  //   if(bool && searchValid(marker, search))
  //       return true;
  //     else {
  //       return false;
  //     }
  // })) return true;
}

function matchSimpleQueries(query, marker) {
  return (
    (query.pris === undefined || marker.pris <= query.pris) &&
    (query.dame === undefined || marker.dame === query.dame) &&
    (query.herre === undefined || marker.herre === query.herre) &&
    (query.stellerom === undefined || marker.stellerom === query.stellerom) &&
    (query.rullestol === undefined || marker.rullestol === query.rullestol) &&
    (query.no_pissoir_only === undefined || marker.no_pissoir_only === query.no_pissoir_only)
  );
   // For hvert felt: hvis undefined eller gyldig verdi, returner true
}

function matchTextQuery(query, marker) {
  if(query.fritekst === undefined ||
        (marker.plassering.toUpperCase().includes(query.fritekst.toUpperCase())
      || marker.adresse.toUpperCase().includes(query.fritekst.toUpperCase())
      || marker.sted.toUpperCase().includes(query.fritekst.toUpperCase())
  )) {
    return quickSearch(query, marker) //Quicksearch
  } else {
    return false;
  }
}

function updatePriceQuery(element) {
  element.nextSibling.textContent = element.value;
}

function parseTimeRange(time){
  if(typeof time !== 'string') {
    console.error('Missing argument to parse');
    return;
  }

  if(time.match(/^ALL$/i)) {
    time = true;
  } else if(time.match(/^NULL$/i)) {
    time = false;

  } else if(/\d\d\.\d\d - \d\d\.\d\d/.test(time)){
    time = time
      .match(/(\d\d\.\d\d) - (\d\d\.\d\d)/) // finn første instans f.eks.: "00.00 - 99.99"
      .slice(1, 3) // Bevar kun gruppene
      .map(string => string.split('.').map(n => Number(n))); // split på . og konverter til Number
  } else {
    console.error('Could not parse time');
  }
  return time; // f.eks: [[0, 30], [23, 59]]
}

function quickSearch() {
  // TODO
  return true;
}

// isOpen can be called from query, or from quickSearch
// Query calls isOpen(marker, time, date)
// quickSearch calls isOpen(marker [, time])
function isOpen(marker, time, date) {
  if(true) return true;
  // Hvis dato ikke er definert, bruk i dag
  date = date || new Date();

  if(!time) {
    // Hvis time ikke er definert, bruk nå
    time = [date.getHours(), now.getMinutes()];

  } else if(date.getHours() > time[0] || (time[0] === date.getHours() && time[1] > date.getMinutes())) {
    // Hvis time er definert men tidspunktet har passert:
    date.setDate(date.getDate() + 1); // øke dag med en
  } // Hvis time er definert og innenfor scope trenger vi ikke gjøre mer her

  // Vi henter åpningstidene til toalettet
  // getOpenings sørger for at vi får riktig dag
  var opening = marker.getOpenings(date.getDay());
  if(opening[0][0] <= time[0] && time[1] >= opening[0][1]
   && (time[1] < opening[1][0] || time[1] === opening[1][0]));
}

function numberOr(n, fallback) {
  // Vil returnere 0 dersom n er NaN og fallback er undefined
  return Number(n) || fallback || 0;
}
