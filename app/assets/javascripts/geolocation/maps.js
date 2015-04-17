var MAPKEEP = MAPKEEP || {};
MAPKEEP.infoWindows = [];

MAPKEEP.init = function(notes, auth) {
  MAPKEEP.notes = notes;
  MAPKEEP.authToken = auth;
  $('#create_note').click(MAPKEEP.dropPin);
};

MAPKEEP.initMap = function() {
  // For now, center around first note || UCLA
  var center = MAPKEEP.notes.length > 0 ?
    new google.maps.LatLng(MAPKEEP.notes[0].latitude, MAPKEEP.notes[0].longitude) :
    new google.maps.LatLng(34.0722, -118.4441);

  var mapOptions = {
      center: center,
      zoom: 10
  };

  MAPKEEP.map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);

  // Draw notes on map
  for (var i = 0; i < MAPKEEP.notes.length; i++) {
    var marker = new google.maps.Marker({
      position: new google.maps.LatLng(MAPKEEP.notes[i].latitude, MAPKEEP.notes[i].longitude),
      map: MAPKEEP.map,
      title: MAPKEEP.notes[i].title,
      draggable: true
    });
    MAPKEEP.addInfoWindowToNote(MAPKEEP.notes[i], marker);
  }
};

MAPKEEP.addInfoWindowToNote = function(note, marker) {
  var infoWindow = new google.maps.InfoWindow({
    content:  '<h3>' + note.title + '</h3>' + note.body + '<br/>' +
              '<button class="button tiny right">Edit</button>'
  });
  MAPKEEP.infoWindows.push(infoWindow);

  google.maps.event.addListener(marker, 'click', function() {
    infoWindow.open(MAPKEEP.map, marker);
  });
};

MAPKEEP.dropPin = function() {
  var marker = new google.maps.Marker({
    position: MAPKEEP.map.center,
    map: MAPKEEP.map,
    draggable: true,
    animation: google.maps.Animation.DROP
  });

  var infoWindow = new google.maps.InfoWindow({
    content:
    '<form class="new_note" action="/notes" id="i' + MAPKEEP.infoWindows.length + '"' +
      'accept-charset="UTF-8" method="post" data-remote="true">' +
    '<label for="note_title">Title</label><input type="text" name="note[title]" id="note_title" /><br/>' +
    '<label for="note_body">Body</label><textarea rows="5" name="note[body]" id="note_body"></textarea>' +
    '<input name="note[latitude]" type="hidden" value="' + marker.position.lat() + '" />' +
    '<input name="note[longitude]" type="hidden" value="' + marker.position.lng() + '" />' +
    '<input name="authenticity_token" type="hidden" value=' + MAPKEEP.authToken + ' />' +
    '<input name="form_id" type="hidden" value=i' + MAPKEEP.infoWindows.length + ' />' +
    '<button class="button tiny right" type="submit">Save</button>' +
    '</form>'
  });

  // Show info window after pin drops down
  setTimeout(function() {
    infoWindow.open(MAPKEEP.map, marker);
  }, 500);

  // Open info window on click
  google.maps.event.addListener(marker, 'click', function() {
    infoWindow.open(MAPKEEP.map, marker);
  });

  // Update coords on pin drag
  google.maps.event.addListener(marker, 'dragend', function() {
    var form = $('#i' + MAPKEEP.infoWindows.length);
    form.find('input[name=note\\[latitude\\]]').val(marker.position.lat());
    form.find('input[name=note\\[longitude\\]]').val(marker.position.lng());
  });

  MAPKEEP.infoWindows.push(infoWindow);
};

MAPKEEP.toggleForm = function(formId) {

};
