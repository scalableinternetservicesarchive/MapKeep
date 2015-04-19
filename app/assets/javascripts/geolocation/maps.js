var MAPKEEP = MAPKEEP || {};
MAPKEEP.ct = 0;
MAPKEEP.lastWindow = null;

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
    content:  MAPKEEP.createNoteForm(marker, true, note)
  });

  google.maps.event.addListener(marker, 'click',
    MAPKEEP.openWindow(infoWindow, marker));
};

MAPKEEP.dropPin = function() {
  var marker = new google.maps.Marker({
    position: MAPKEEP.map.center,
    map: MAPKEEP.map,
    draggable: true,
    animation: google.maps.Animation.DROP
  });

  var infoWindow = new google.maps.InfoWindow({
    content: MAPKEEP.createNoteForm(marker, false)
  });

  // Cancel note if user closes info window before saving
  google.maps.event.addListener(infoWindow,'closeclick', function(){
    marker.setMap(null);
  });

  // Show info window after pin drops down
  setTimeout(MAPKEEP.openWindow(infoWindow, marker), 500);

  // Open info window on click
  google.maps.event.addListener(marker, 'click',
    MAPKEEP.openWindow(infoWindow, marker));

  // Update coords on pin drag
  var len = MAPKEEP.ct++;
  google.maps.event.addListener(marker, 'dragend', function() {
    var form = $('#i' + len);
    form.find('input[name=note\\[latitude\\]]').val(marker.position.lat());
    form.find('input[name=note\\[longitude\\]]').val(marker.position.lng());
  });
};

// Close last info window and open new one
MAPKEEP.openWindow = function(infoWindow, marker) {
  return function() {
    if (MAPKEEP.lastWindow) {
      MAPKEEP.lastWindow.close();
    }
    infoWindow.open(MAPKEEP.map, marker);
    MAPKEEP.lastWindow = infoWindow;
  }
};

/**
 * TODO: make jquery elements, edit button should toggle form, then become submit
 * @param marker The note belongs to for coordinates
 * @param readonly Whether or not this is a new note (readonly means it is an existing note)
 * @param note Note to use title and body for if existing
 * @returns {string}
 */
MAPKEEP.createNoteForm = function(marker, readonly, note) {
  readonly = readonly ? 'readonly' : '';
  var title = '<input type="text" name="note[title]" placeholder="Title" ' + readonly;
  var body = '<textarea rows="4" name="note[body]" ' + readonly +
             ' placeholder="Write anything you want about this location!">';
  var buttonText = readonly ? 'Edit' : 'Save';
  var formAction = readonly ? '/notes/' + note.id : '/notes';
  var patch = readonly ? '<input type="hidden" name="_method" value="patch">' : '';

  if (readonly) {
    title += ' value="' + note.title + '"';
    body += note.body;
  }

  return  '<form class="new_note" action="' + formAction + '" id="i' + MAPKEEP.ct + '"' +
            'accept-charset="UTF-8" method="post" data-remote="true">' + patch +
            title + ' /><br/>' + body + '</textarea>' +
            '<input name="note[latitude]" type="hidden" value="' + marker.position.lat() + '"/>' +
            '<input name="note[longitude]" type="hidden" value="' + marker.position.lng() + '"/>' +
            '<input name="authenticity_token" type="hidden" value=' + MAPKEEP.authToken + ' />' +
            '<input name="form_id" type="hidden" value=i' + MAPKEEP.ct + ' />' +
            '<button class="button tiny right" type="submit">' + buttonText + '</button>' +
          '</form>';
};

