/*
  @Author Halvard A. Vegum
  @Date 28.01.2018

  This handles markers in the google map.
*/
console.log("test");

function initMap() {

    //  #TODO: replace hardcoded position-url pairs with json file or something ...
    var markers = [
    {
      position: {lat: 60.391294, lng: 5.317271},
      title:  'my great title',
      url: '../oppdag/index.html#streetart'
    }, {
      position: {lat: 60.392442, lng: 5.331943},
      title:  'my great title 2',
      url: '../oppdag/index.html#underlupe'
    }];

    var map = new google.maps.Map(document.getElementById('map'), {
      zoom: 15,
      center: {lat: 60.390475, lng: 5.328369}
    });

    markers.forEach(marker => {
      var newMarker = new google.maps.Marker({
        position: marker.position,
        map: map,
        title: marker.title,
        url: marker.url
      });

      newMarker.addListener('click', function() {
        window.location.href = this.url;
      });
    });
}
