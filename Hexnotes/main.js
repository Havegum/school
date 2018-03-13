console.log("Hei, verden");
function resizeTag(e) {
  e.style.width = '';
  e.parentNode.children[0].textContent = e.value;
  e.style.width = e.scrollWidth + 'px';
}

function confirmTag(e) {
  e.style.display='none'
  e.parentNode.children[1].style.display='none'
  e.parentNode.children[0].textContent = e.parentNode.children[1].value;
  e.parentNode.children[0].classList.remove('hidden');
}

function editTag(e) {
  e.parentNode.children[2].style.display='';
  e.parentNode.children[1].style.display='';
  e.classList.add('hidden');
  resizeTag(e.parentNode.children[1]);
}

function edit(tag) {
  tag.open = true;

  if(tag.open) {
    tag.classList = "tag edit";
    tag.children[1].style.display = '';
    tag.children[2].style.display = '';
  }
}

function closeTag(tag) {
  tag.open = false;

  tag.classList = "tag passive";
  tag.children[1].style.display = 'none';
  tag.children[2].style.display = 'none';
}

window.onload = function() {

}
