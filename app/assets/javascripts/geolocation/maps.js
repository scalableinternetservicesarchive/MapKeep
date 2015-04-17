var map;
$('#create_note').click(dropPin);

function initialize() {
  var mapOptions = {
      center: new google.maps.LatLng(notes[0].latitude, notes[0].longitude),
      zoom: 10
  };

  map = new google.maps.Map(document.getElementById('map-canvas'),
      mapOptions);

  for (var i = 0; i < notes.length; i++) {
    var title = notes[i].title;
    var infowindow = new google.maps.InfoWindow({
      content: '<h3>' + title + '</h3>' + notes[i].body + '<br/><button class="button tiny">Edit</button>'
    });
    var marker = new google.maps.Marker({
      position: new google.maps.LatLng(notes[i].latitude, notes[i].longitude),
      map: map,
      title: title,
      draggable: true
    });
    google.maps.event.addListener(marker, 'click', function() {
      infowindow.open(map, marker);
    });
  }
}

function dropPin() {
  var infowindow = new google.maps.InfoWindow({
    content: ''
  });
  var marker = new google.maps.Marker({
    position: map.center,
    map: map,
    draggable: true,
    animation: google.maps.Animation.DROP
  });
  google.maps.event.addListener(marker, 'click', function() {
    infowindow.open(map, marker);
  });
}