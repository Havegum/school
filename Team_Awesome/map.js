/*
  @Author Halvard A. Vegum
  @Date 27.02.2018

  This handles markers in the google map.
*/

window.onload = function() {
};

function loadCSV() {
  return new Promise(resolve => {
    var CSVArray;
    var CSVRequest = new XMLHttpRequest();
    CSVRequest.open('GET', './dokart.csv');
    CSVRequest.onload = function() {
      CSVArray = this.response.split(/\r\n/g);
      CSVArray[0] = CSVArray[0].split(';');

      for(let i = 1; i < CSVArray.length; i++) {
        CSVArray[i] = CSVArray[i].split(';');
        let data = {};
        for(let j = 0; j < CSVArray[i].length; j++) {
          data[CSVArray[0][j]] = CSVArray[i][j];
        }

        data.position = {};
        try {
          data.position.lat = Number(data.latitude);
          data.position.lng = Number(data.longitude);
          delete data.latitude;
          delete data.longitude;
        } catch (e) { console.error(e); }

        data.placename = data.place;
        delete data.place;

        CSVArray[i] = data;

      }
      // On completion:
      CSVArray.unshift();
      CSVArray.pop();
      resolve(CSVArray);
    }
    CSVRequest.send();
  });
}

async function initMap() {
    var markers = await loadCSV();

    var mapOptions = {
      zoom: 14,
      center: { lat: 60.390475, lng: 5.328369 }
    };
    var map = new google.maps.Map(document.getElementById('map'), mapOptions);

    markers.forEach(marker => {
      marker.infowindow = new google.maps.InfoWindow({content:'<p>hello world!</p>'});
      var gMarker = new google.maps.Marker(marker);
      gMarker.setMap(map);

      gMarker.addListener('mouseover', function() {
        this.infowindow.open(map, this);
      });

      gMarker.addListener('mouseout', function() {
        this.infowindow.close();
      });
    });
}
