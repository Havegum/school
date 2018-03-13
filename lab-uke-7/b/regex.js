// Når dokumentet er lastet inn:
window.onload = function() {
  document.getElementsByClassName('skjema')[0].style.display='';
  getEmailAndPassword();
  asyncImage();
}

function getEmailAndPassword() {
  var url, regex, query, skjema, email, password;

  try {
    url = decodeURIComponent(window.location.href); // hent og dekode adresse
  } catch (e) {
    console.error(e);
  }

  regex = /\?epost=(.*)&passord=(.*)/;
  query = url.match(regex); // ["epost", "passord"]

  if (query ==  null) {
    // Hvis ingen query:
    playSlideInAnimation();
    return;
  }

  email = query[1];
  password = query[2];

  console.log(password);

  skjema = document.getElementsByClassName('skjema')[0];
  skjema.children[0].value = email;
  skjema.children[1].value = password;
  if (email == '' || !validateEmail(email)) {
    // Hvis vi mangler epost eller epost ikke er gyldig:
    skjema.children[0].classList.add('invalid');
    errorShake();

  } else if (password == ''){
    // Hvis vi mangler passord:
    skjema.children[1].classList.add('invalid');
    errorShake();
  } else {
    formValidated();
  }
}

function validateEmail(email) {
  var regex = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;
  // Forklaring nedenfor

  var validEmail = regex.test(email);
  // validEmail er en boolsk verdi
  if(validEmail) {
    console.log('Gyldig epost!');
  }

  return validEmail;

  // Mønster:
  // START
  //    (NOT: space or "@")
  //    @
  //    (NOT: space, "@", or ".")
  //    .
  //    (NOT: space, "@", or ".")
  // END

  // Gyldige eksempler:
  //    a@b.c
  //    delta+echo@foxtrot.golf.co.uk
  //    my.great-email_2000@yahoo.com

  // Ugyldige eksempler:
  //    too_m@ny@signs.at
  //    not.enough(a)signs.com
  //    no.domain@found
}

function playSlideInAnimation(){
  var skjema = document.getElementsByClassName('skjema')[0];

  skjema.classList.add('slide-in');

  setTimeout(() => {
    skjema.classList.remove('slide-in');
  }, 500);
}

function asyncImage() {
  var img = new Image();
  img.onload = function() {
    document.body.insertBefore(img, document.body.firstChild);
  }
  img.src = './Mount-Hallwill-Norway-Spitsbergen-20180120.jpg';
  img.classList.add('background', 'blur-in');
}

function errorShake(){
  var skjema = document.getElementsByClassName('skjema')[0];

  skjema.classList.add('shake');

  setTimeout(() => {
    skjema.classList.remove('shake');
  }, 600);
}

function formValidated() {
  setTimeout(() => {
    var skjema = document.getElementsByClassName('skjema')[0];
    skjema.classList.add('slide-out');

    var img = document.createElement('img')
    img.src="https://media.giphy.com/media/111ebonMs90YLu/giphy.gif";

    var godkjentBoks = document.createElement('div');
    godkjentBoks.classList.add('godkjent', 'slide-in');
    godkjentBoks.textContent = 'Godkjent innlogging!';
    godkjentBoks.appendChild(img);

    setTimeout(() => {
      skjema.parentNode.replaceChild(godkjentBoks, skjema);
    }, 500)
  }, 200);
}
