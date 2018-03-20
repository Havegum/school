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
    map.markers = initMarkers(json);

    // displayMarkers kalles, men må venter på (await) map.markers
    displayMarkers();

    // Hvis vi venter på loadJSON kan vi like gjerne hente dagens dato ...
    let now = new Date();
    ['hour', 'minute'].forEach(x => {
      let elem = document.getElementById(x);
      elem.placeholder = now['get' + (x === 'hour' ? 'Hours' : 'Minutes')]();
      elem.addEventListener('click', () => {
        elem.value = elem.value || elem.placeholder;
      }, {once:true});
    });
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
  try {
    var markers = await json;
  } catch (e) {
    console.error(e);
    return;
  }

  var list = document.createElement('ol');

  let processedMarkers = markers
    .map(cleanupMarker)
    .map(marker => drawMarker(marker, list))
    .map(toGoogleMarker);

  document.getElementById('legend').appendChild(list);

  return processedMarkers;
}

function drawMarker(marker, list) {
  // HTML listeelement
  let listElement = document.createElement('li');
  listElement.id = "Marker--" + marker.id;

  let header = document.createElement('h6');
  header.innerHTML = '<span class="list-numbering">' + marker.id + ': </span>' + marker.plassering;

  let address = document.createElement('p');
  address.textContent = marker.adresse;

  listElement.appendChild(header);
  listElement.appendChild(address);

  list.appendChild(listElement);
  return marker;
}

function toGoogleMarker(marker) {
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
    if(isNaN(day)) {
      day = new Date().getDay();
    } else {
      day = Number(day) % 7;
    }

    if(day == 6) {
      return this.tid_lordag; // 6 => lørdag

    } else if (day == 0) {
      return this.tid_sondag; // 0 => søndag

    } else {
      return this.tid_hverdag;
    }
  };

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

async function displayMarkers() {
  // Vi kan hente query selv om map.markers ikke er klar
  var query = getQuery();

  // Dersom ingen query, vis alle og returner:
  if(query === null) {
    (await map.markers).forEach(marker => marker.setVisible(true));
    return;
  }

  // Skjul alle, filtrer markører etter query, og vis de resterende
  (await map.markers)
    .map(marker => {
      marker.setVisible(false);
      document.getElementById('Marker--' + marker.id).classList.add('disabled');
      return marker;
    })
    .filter(marker => filterMarkers(query, marker))
    .forEach(marker => {
      marker.setVisible(true)
      document.getElementById('Marker--' + marker.id).classList.remove('disabled');
    });
}

function getQuery() {
  var search = window.location.search.replace('?', '').split('&');
  if(search[0] === '') return null;

  var searchCriteria = {};

  // Vi deler søket i sine navn-verdi par, returnerer null dersom
  // søket er tomt, og gjør klart et objekt til å lagre søket i.

  search.forEach(query => {
    // For hvert 'navn-verdi'-par, del opp paret i en array, og
    // se hvor dataen kom fra. Variabelnavnet skal korrespondere
    // med ID-en til elementet på siden.

    query = query.split('=');
    if(query[1] === '') return; // Vi hopper over emptystring queries
    let elem = document.getElementById(query[0]);

    // Skjekk så hvilken type input variabelen kom fra, dette brukes
    // til å bestemme hvilken type variabelen skal castes til.


    // Checkbox dukker opp kun dersom verdien er sann,
    // så vi returnerer ganske enkelt true
    if(elem.type === 'checkbox') {
      elem.checked = true;
      query[1] = true;

    // fritekstsøk deles må dekodes fra URI-enkoding,
    // så må vi dele søket i fritekst og hurtigsøk
    } else if(elem.type === 'text') {
      // Vi dekoder URI-enkodingen
      query[1] = decodeURIComponent(query[1].replace(/[+]/g, ' '));
      elem.value = query[1];

      let regex = /(?:[^:\s]+):(?:[^:\s])+/g;
      let quickSearch = query[1].match(regex);

      if(quickSearch !== null) {
        quickSearch.forEach(qs => {
          query[1] = query[1].replace(qs, '').trim();
        });
      }
      searchCriteria.quickSearch = quickSearch;

    // range-input referer til makspris-slideren
    // Vi henter verdien, caster til nummer, og oppdaterer teksten
    // som står til høyre for slideren.
    } else if(elem.type === 'range') {
      elem.value = query[1];
      query[1] = Number(query[1]);
      updatePriceQuery(elem);

    // Date castes ganske enkelt til en dato
    } else if(elem.type === 'date') {
      elem.value = query[1];
      query[1] = new Date(query[1]);

    // Nummerinput (time, minutt), castes til nummer
    } else if(elem.type === 'number') {
      elem.value = query[1];
      query[1] = Number(query[1]);

      searchCriteria.time = searchCriteria.time || [];
      searchCriteria.time[elem.id == 'hour' ? 0 : 1] = query[1];
      return;

    // Hvis inputet ikke kan gjenkjennes hopper vi bare over søket
    } else {
      return;
    }

    searchCriteria[query[0]] = query[1];
    // F.eks.: searchCriteria['fritekst'] = 'galleriet';
  });


  if(searchCriteria.time || searchCriteria.date) {
    var today;
    var date = searchCriteria.date;
    var time = searchCriteria.time;

    // Hvis dato ikke er definert, bruk i dag
    if(!date) {
      date = new Date();
      today = true;
    } else {
      today = new Date();
      today = (
        today.getFullYear() == date.getFullYear() &&
        today.getMonth() == date.getMonth() &&
        today.getDate() == date.getDate()
      );
    }

    // Hvis time ikke er definert, bruk nå
    time = time || [];
    time[0] = time[0] || new Date().getHours();
    time[1] = time[1] || new Date().getMinutes();

    // Hvis time har passert og dato er idag:
    if(today && (time[0] < date.getHours() || (time[0] === date.getHours() && time[1] > date.getMinutes()))) {
      date.setDate(date.getDate() + 1); // øk dag med en
    }
    searchCriteria.today = today;
    searchCriteria.date = date;
    searchCriteria.time = time;
  }

  return searchCriteria;
}

function filterMarkers(query, marker) {
  // Hvis søk finnes og markøren ikke stemmer med søket, return false.
  if(
      matchSimpleQueries(query, marker)
   && matchTextQuery(query, marker)
   && isOpen(marker, query)
  ) {
    return true;
  } else {
    return false;
  }
}

function matchSimpleQueries(query, marker) {
  var matchAllQueries = (
    (query.pris === undefined || marker.pris <= query.pris) &&
    (query.dame === undefined || marker.dame === query.dame) &&
    (query.herre === undefined || marker.herre === query.herre) &&
    (query.stellerom === undefined || marker.stellerom === query.stellerom) &&
    (query.rullestol === undefined || marker.rullestol === query.rullestol) &&
    (query.no_pissoir_only === undefined || marker.no_pissoir_only === query.no_pissoir_only)
  );

  return matchAllQueries;
   // For hvert felt: hvis undefined eller gyldig verdi, returner true
}

function matchTextQuery(query, marker) {
  if(query.fritekst === undefined ||
        (marker.plassering.toUpperCase().includes(query.fritekst.toUpperCase())
      || marker.adresse.toUpperCase().includes(query.fritekst.toUpperCase())
      || marker.sted.toUpperCase().includes(query.fritekst.toUpperCase())
  )) {

    if(query.quickSearch !== undefined) {
      var quickSearch = query.quickSearch.reduce((bool, q) => {
        return (bool && checkQuickSearch(q, marker));
      }, true);
      return quickSearch;

    } else {
      return true;
    }

  } else {
    return false;
  }
}

// isOpen can be called from query, or from quickSearch
// Query calls isOpen(marker, time, date)
// quickSearch calls isOpen(marker [, time])
function isOpen(marker, query) {
  if(!query || !query.time || !query.date) return true;

  var today = query.today;
  var date = query.date;
  var time = query.time;

  // Vi henter åpningstidene til toalettet
  // getOpenings sørger for at vi får riktig dag
  var opening = marker.getOpenings(date.getDay());

  if(typeof opening === 'boolean') return opening;

  var start = opening[0];
  var end = opening[1];

  // Vi skjekker om time er etter åpningstid og før stengetid
  // Hvis starttime er mindre enn time[h]
  // eller time[h] er samme som starttidspunkt, OG time[m] er etter eller lik åpnigsminutt:
  if(
    (start[0] < time[0] || (start[0] === time[0] && start[1] <= time[1])) &&
    (end[0]   > time[0] || (end[0]   === time[0] && end[1]   >= time[1]))
  ) {
    return true;
  } else {
    return false;
  }
}

function parseTimeRange(time) {
  if(!time || typeof time !== 'string') {
    console.error('Missing argument to parse');
    return;
  }

  if(time.match(/^ALL$/i)) {
    time = true;
  } else if(time.match(/^NULL$/i)) {
    time = false;

  } else if(/\d\d\.\d\d - \d\d\.\d\d/.test(time)) {
    time = time
      .match(/(\d\d\.\d\d) - (\d\d\.\d\d)/) // finn første instans f.eks.: "00.00 - 99.99"
      .slice(1, 3) // Bevar kun gruppene
      .map(string => string.split('.').map(n => Number(n))); // split på . og konverter til Number
  } else {
    console.error('Could not parse time');
  }
  return time; // f.eks: [[0, 30], [23, 59]]
}

function checkQuickSearch(q, marker) {
  // Hvis ingen quicksearch eller ugyldig format, ignorer søket
  if(!q || !q.match(/:/)) return true;

  query = q.split(':');
  let criteria = query[0];

  if(criteria === 'kjønn') {
    if(query[1] === 'mann') {
      return marker.herre === true;
    } else if(query[1] === 'kvinne') {
      return marker.dame === true;
    }

  } else if(criteria === 'stellerom') {
    return marker.stellerom === true;

  } else if(criteria ==='pissoir') {
    return marker.pissoir_only === true;

  } else if(criteria === 'rullestol') {
    return marker.rullestol === true;

  } else if(criteria === 'pris') {
    if(isNaN(query[1])) {
      if(query[1] === 'gratis') {
        return marker.pris === 0;
      } else {
        return true;
      }
    }
    return marker.pris <= Number(query[1]);

  } else if(criteria === 'åpen') {
    return isOpen(marker);
  } else {
    // Dersom hurtigsøket ikke gjenkjennes ignorerer vi søket:
    return true;
  }
}

function updatePriceQuery(element) {
  element.nextSibling.textContent = element.value;
}

function numberOr(n, fallback) {
  // Vil returnere 0 dersom n er NaN og fallback er undefined
  return Number(n) || fallback || 0;
}
