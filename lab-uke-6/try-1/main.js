var elems;
fitWords = function() {
  var elems = document.getElementsByTagName('h1');
  for(let i = 0; i < elems.length; i++) {
    elems[i].innerText = elems[i].textContent
        .replace(/\s(?=\S+$)/,  // all spaces at the end sentences
          String.fromCharCode(160));  // non-breaking whitespace
  }
  console.log('Fitting done');
}
