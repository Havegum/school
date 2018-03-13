var map = {};

window.onload = async function() {
  map.markers = (await loadJson()).entries;
  initMarkers();
  testSingleQuickSearch();
  testQueryArray();
}

function testSingleQuickSearch(q) {
  var test;
  test = checkSingleQuery('kjønn:mann', map.markers[0]);

  if(test) {
    console.log('Test 1: OK');
  } else {
    console.log('Test 1: Failed');
  }
}

function testQueryArray() {
  var queries = ['kjønn:mann', 'pris:12'];

  var test = true;
  for(let x in queries) {
    test = test ? checkSingleQuery(queries[x], map.markers[0]) : false;
  }

  if(test) {
    console.log('Test 2: OK');
  } else {
    console.log('Test 2: Failed');
  }
}

function loadJson() {
  return new Promise((resolve, reject) => {
    // XMLHttpRequest kjører async, så vi returnerer et promise med resolve og reject som callback
    var jsonRequest = new XMLHttpRequest();
    jsonRequest.overrideMimeType('application/json');
    jsonRequest.open('GET', 'dokart.json', true);
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
    // hvis loadJson sitt promise ble rejected:
    console.error(e); // skriv ut feilmelding
    return; // avslutt funksjonen
  }

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

    return marker;
  });
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
