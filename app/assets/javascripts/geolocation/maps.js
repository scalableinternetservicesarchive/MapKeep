var MAPKEEP = MAPKEEP || {};

MAPKEEP.init = function(notes, userId, auth) {
  MAPKEEP.notes = notes;
  MAPKEEP.userId = userId;
  MAPKEEP.authToken = auth;
  $('#create_note').click(MAPKEEP.dropPin);
};

MAPKEEP.initMap = function() {
  var center = MAPKEEP.notes.length > 0 ?
    new google.maps.LatLng(MAPKEEP.notes[0].latitude, MAPKEEP.notes[0].longitude) :
    new google.maps.LatLng(30, -90);

  var mapOptions = {
      center: center,
      zoom: 10
  };

  MAPKEEP.map = new google.maps.Map(document.getElementById('map-canvas'),
      mapOptions);

  for (var i = 0; i < MAPKEEP.notes.length; i++) {
    var title = MAPKEEP.notes[i].title;
    var infowindow = new google.maps.InfoWindow({
      content: '<h3>' + title + '</h3>' + MAPKEEP.notes[i].body + '<br/><button class="button tiny right">Edit</button>'
    });
    var marker = new google.maps.Marker({
      position: new google.maps.LatLng(MAPKEEP.notes[i].latitude, MAPKEEP.notes[i].longitude),
      map: MAPKEEP.map,
      title: title,
      draggable: true
    });
    google.maps.event.addListener(marker, 'click', function() {
      infowindow.open(MAPKEEP.map, marker);
    });
  }
};

MAPKEEP.dropPin = function() {
  var marker = new google.maps.Marker({
    position: MAPKEEP.map.center,
    map: MAPKEEP.map,
    draggable: true,
    animation: google.maps.Animation.DROP
  });

  var infowindow = new google.maps.InfoWindow({
    content:  '<form class="new_note" id="new_note" action="/notes" accept-charset="UTF-8" method="post">' +
    '<label for="note_title">Title</label><input type="text" name="note[title]" id="note_title" /><br/>' +
    '<label for="note_body">Body</label><textarea rows="5" name="note[body]" id="note_body"></textarea>' +
    '<input name="note[latitude]" type="hidden" value="' + marker.position.lat() + '" />' +
    '<input name="note[longitude]" type="hidden" value="' + marker.position.lng() + '" />' +
    '<input name="authenticity_token" type="hidden" value=' + MAPKEEP.authToken + ' />' +
    '<input name="note[user_id]" type="hidden" value=' + MAPKEEP.userId + ' />' +
    '<button class="button tiny right" type="submit" data-remote="true">Save</button>' +
    '</form>'
  });

  google.maps.event.addListener(marker, 'click', function() {
    infowindow.open(MAPKEEP.map, marker);
  });
};
