// Function that takes an url and returns a Promise
// The promise resolves to a parsed JSON-object.
// If the url isn't given, the request fails,
// or json can't be parsed, the function returns null.
function getJsonFrom(url) {
  if(url === undefined || url === '') {
    console.error('No url given for method getJsonFrom');
    return null;
  }

  return new Promise({
    let xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.overrideMimeType('application/json');
    xhr.onreadystatechange = function() {
      if(xhr.readyState === 4) {
        if(xhr.status === 200) {
          try {
            let response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (e) {
            console.error(e);
            reject(null);
          }
        } else {
          console.error(xhr.status + ' ' + xhr.statusText);
          reject(null);
        }
      }
    }
    xhr.send();
  });
}
