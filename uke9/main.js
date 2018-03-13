function Range(from, to) {
  this.from = from;
  this.to = to;
}

Range.prototype.includes = function(x) {
  return this.from <= x && x <= this.to;
};

Range.prototype.toString = function() {
  return "(" + this.from + " ... " + this.to + ")";
};


// ################################### Dagens opg:

function Liste() {
  this.root = null;
}
Liste.prototype = {
  add: function(element) {
    var newNode = {
      next:null,
      value: element
    }

    if(this.root === null) {
      this.root = newNode;
    } else {
      this.last.next = newNode;
    }
  },

  get last() {
    var current = this.root;
    if(current === null) return null;

    while(current.next != null) {
      current = current.next;
    }

    return current;
  }
}

// function Valuta(value, name) {
//   this.value = value;
//   this.name = name;
// }
//
// (async function() {
//   var a = await loadTSV();
//   console.log(a);
// })();
//
// function loadTSV() {
//   return new Promise((resolve, reject) => {
//     var data;
//     request = new XMLHttpRequest();
//     request.open('GET', './valuta.tsv');
//     request.onload = function() {
//       data = request.response;
//       data = data.split('\\n');
//       data = data.map(row => {
//         new Valuta();
//       });
//       resolve(data);
//     }
//     request.send();
//   });
// }
