var REGEX = {};

function storeQuery() {
  if(window.location.search.match(/\w+=\w+/g) == null) {
    return;
  }

  window.location.search
    .match(/\w+=\w+/g)
    .forEach((str) => {
      let query = str.split('=');
      REGEX[query[0]] = query[1];
  });
}

function validateForm() {
  if(REGEX.epost == null || REGEX.pw == null) {
    return;
  }

  var textbox = document.getElementById('outtext');
  textbox.parentNode.classList.remove('hidden');
}

function testRegEx() {
  REGEX.string = "Tingen veide 20,25 kg. Den var 5 000 m høy";
  REGEX.regex = /(?:\d+\s)*(\d+)(,\d+)?\s((k|h|d|c|m)?(g|l|m))/gi;

  console.log(REGEX.string);
  console.log(REGEX.string.match(REGEX.regex));
}


function submitForm() {
  storeQuery();
  validateForm();
  console.log("submitted");
}
