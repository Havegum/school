// Custom prototypes;
Element.prototype.appendAfter = function(element) {
  element.parentNode.insertBefore(this, element.nextSibling);
},false;

function conditionalSlide(element, slide){
  element.style.display='';

  if(slide) {
    element.classList.add('slide-in');
    setTimeout(() => {
      element.classList.remove('slide-in');
    }, 500);
  }
}

function slideOut(element) {
  element.classList.add('slide-out');
  return setTimeout(() => { return true; }, 500);
}

function errorShake(){
  var skjema = document.getElementsByClassName('skjema')[0];

  skjema.classList.add('shake');

  setTimeout(() => {
    skjema.classList.remove('shake');
  }, 600);
}

function asyncImage() {
  var img = new Image();
  img.src = './img/Mount-Hallwill-Norway-Spitsbergen-20180120.jpg';
  img.classList.add('background', 'blur-in');

  img.onload = function() {
    let bgImg = document.getElementById('background');
    img.appendAfter(bgImg);
    bgImg.id = '';
    img.id = 'background';

    setTimeout(() => {
      bgImg.remove();
      img.classList.remove('blur-in');
    }, 1000);
  }
}
