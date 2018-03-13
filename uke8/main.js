var Vehicle = {
  plate:"",
  color:"",
  seats:"",
  set reg(reg) {
    this.plate = reg;
  },
  get reg() {
    return this.plate;
  },
  set seter(n) {
    if(typeof n === "number") {
      this.seats = n;
    } else {
      this.seats = -1;
    }
  },
  get seter() {
    return this.seats;
  },
  set farge(farge) {
    this.color = farge;
  },
  get farge() {
    return this.color;
  }
};

var Car = Object.create(Vehicle);
Car.reg = "RK12345";
Car.seter = 5;

var Taxi = Object.create(Car);
Taxi.taxinummer = "";
Taxi.bestill = function() {
  console.log("Taxi with plate " + this.reg + " has been ordered.");
}

var Buss = Object.create(Vehicle);
Object.defineProperty(Buss, 'route', {
  get: function() {
    return this.busRoute;
  },
  set: function(route) {
    this.busRoute = route;
  }
});

var queryString = "Her er en taxi: ST:13254, her er en annen, SR:90333";
var taxis = queryString
  .match(/[a-z]{2,2}[:]?[1-9]\d{4,4}/gi)
  .map(foundReg => {
    let taxi = Object.create(Taxi);
    taxi.reg = foundReg;
    return taxi;
  });

var stringArray = ["asdf", "sdfh"];
stringArray.forEach(function(string) {
  console.log(string);
});

var newArray = stringArray.map(function(string) {
  return string + " ";
});

console.log("NEW ARRAY:");
console.log(newArray);

var newArrayWithLambda = stringArray.map(string => {
  return string + " ";
});

console.log("NEW ARRAY w/ lambda:");
console.log(newArrayWithLambda);
