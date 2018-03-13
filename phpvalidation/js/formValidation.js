// Når dokumentet er lastet inn:
window.onload = function() {
  conditionalSlide(document.getElementsByClassName('skjema')[0], document.getElementById('firstload').value == 1);
  asyncImage();
}

function localValidate(form) {
  var email = document.getElementById('email');
  var password = document.getElementById('password')
  var formValidated = false;

  if(validateInput(email) & validateInput(password)) {
    return slideOut(form);
  } else {
    return false;
  }
}

function validateInput(element) {
  if(!element.value || element.value.length === 0 || !element.validity.valid) {
    errorShake();
    element.parentNode.classList.add('errordot');
    element.onfocus = function() {
      element.parentNode.classList.remove('errordot');
      element.onfocus = "";
    }
    return false;
  } else {
    return true;
  }
}
