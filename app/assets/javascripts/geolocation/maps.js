var MAPKEEP = MAPKEEP || {};
MAPKEEP.ct = 0;
MAPKEEP.lastWindow = null;

MAPKEEP.init = function(notes, auth) {
  MAPKEEP.notes = notes;
  MAPKEEP.authToken = auth;
  $('#create_note').click(MAPKEEP.dropPin);
};

MAPKEEP.initMap = function(lat, lng) {
  // For now, center around ip location || UCLA
  MAPKEEP.userLoc = new google.maps.LatLng(lat, lng);
  var center = lat && lng ?
    new google.maps.LatLng(lat, lng) :
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

/**
 * Adds info window representing note to specified marker
 * @param note For info
 * @param marker To add window to
 */
MAPKEEP.addInfoWindowToNote = function(note, marker) {
  var infoWindow = new google.maps.InfoWindow({
    content:  MAPKEEP.createNoteForm(marker, true, note)
  });

  google.maps.event.addListener(marker, 'click', function() {
    MAPKEEP.openWindow(infoWindow, marker, false, MAPKEEP.ct);
  });

  MAPKEEP.ct++;
};

/**
 * Drops pin in center of map with editable form
 */
MAPKEEP.dropPin = function() {
  var ct = MAPKEEP.ct;

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
  var listener = google.maps.event.addListener(infoWindow,'closeclick',
    function() {
      marker.setMap(null);
    });

  // Clear listener when user clicks save
  $('#map-canvas').on('click', '#bi' + ct, function() {
    google.maps.event.removeListener(listener);
    $('#map-canvas').off('click', '#bi' + ct);
  });

  // Show info window after pin drops down
  setTimeout(function() {
    MAPKEEP.openWindow(infoWindow, marker, true, ct);
    var form = $('#i' + ct);
    form.find('input[name=note\\[title\\]]').focus();
  }, 500);

  // Open info window on click
  google.maps.event.addListener(marker, 'click', function() {
    MAPKEEP.openWindow(infoWindow, marker, false, ct)
  });

  // Update coords on pin drag
  google.maps.event.addListener(marker, 'dragend', function() {
    var form = $('#i' + ct);
    form.find('input[name=note\\[latitude\\]]').val(marker.position.lat());
    form.find('input[name=note\\[longitude\\]]').val(marker.position.lng());
    console.log('dragged', ct);
  });

  MAPKEEP.ct++;
};

/**
 * Close last info window and open new one
 * @param infoWindow To open
 * @param marker To open info window at
 * @param newNote Whether or not new note
 * @returns {Function}
 */
MAPKEEP.openWindow = function(infoWindow, marker, newNote, ct) {
  if (MAPKEEP.lastWindow) {
    MAPKEEP.lastWindow.close();
  }
  infoWindow.open(MAPKEEP.map, marker);
  MAPKEEP.lastWindow = infoWindow;
  // force form to be readonly if not a new note
  if (!newNote) {
    MAPKEEP.toggleForm('i' + ct, true);
  }
};

/**
 * @param marker The note belongs to for coordinates
 * @param readonly Whether or not this is a new note (readonly means it is an existing note)
 * @param note Note to use title and body for if existing
 * @returns {string}
 */
MAPKEEP.createNoteForm = function(marker, readonly, note) {
  readonly = readonly ? 'readonly' : '';
  var formId = 'i' + MAPKEEP.ct;

  var title = $('<input/>')
    .attr('name', 'note[title]')
    .attr('placeholder', 'Title')
    .attr('value', readonly ? note.title : '')
    .attr('type', 'text');

  var submit = $('<button/>')
    .text(readonly ? 'Edit' : 'Save')
    .addClass('button tiny right')
    .attr('id', 'bi' + MAPKEEP.ct)
    .attr('type', 'submit');

  var deleteButton = $('<button/>')
    .text('Delete')
    .addClass('alert tiny left hide')
    .attr('type', 'submit')
    .click(function() {
      form.find('input[name=_method]').val('delete');
    });

  var textarea = $('<textarea/>')
    .attr('name', 'note[body]')
    .attr('rows', '4')
    .attr('placeholder', 'Write anything you want about this location!')
    .text(readonly ? note.body : '');

  var form = $('<form/>')
    .addClass('new_note')
    .attr('id', formId)
    .attr('action', readonly ? '/notes/' + note.id : '/notes')
    .attr('method', 'post')
    .attr('data-remote', 'true')
    .attr('accept-charset', 'UTF-8')
    .append(title)
    .append($('<br/>'))
    .append(textarea)
    .append('<input name="note[latitude]" type="hidden" value="' + marker.position.lat() + '"/>')
    .append('<input name="note[longitude]" type="hidden" value="' + marker.position.lng() + '"/>')
    .append('<input name="authenticity_token" type="hidden" value=' + MAPKEEP.authToken + ' />')
    .append('<input name="form_id" type="hidden" value=' + formId + ' />')
    .append(submit).append(deleteButton);

  if (readonly) {
    textarea.attr('readonly', 'readonly');
    title.attr('readonly', 'readonly');
    form.append('<input type="hidden" name="_method" value="patch">');
    MAPKEEP.addEditClick(formId);
  }

  return  form[0];
};

/**
 * Clicking edit toggles the form and prevents form submission
 * @param formId To add click function to (button inside)
 */
MAPKEEP.addEditClick = function(formId) {
  $('#map-canvas').on('click', '#b' + formId, function() {
    MAPKEEP.toggleForm(formId);
    return false;
  });
};

/**
 * Toggles form readonly status
 * @param formId Form to toggle
 * @param readonly Whether to force readonly status
 */
MAPKEEP.toggleForm = function(formId, readonly) {
  var form = $('#' + formId);
  var title = form.find('input[type!="hidden"]');
  var textarea = form.find('textarea');
  var submit = form.find('button').not('.alert');
  var deleteButton = form.find('button.alert');

  if (submit.text() == 'Edit' && !readonly) {
    // Make fields editable
    title.removeAttr('readonly');
    textarea.removeAttr('readonly');
    // Remove submit blocking
    $('#map-canvas').off('click', '#b' + formId);
    submit.text('Save');
    deleteButton.removeClass('hide');
    deleteButton.addClass('button');

  }  else if (submit.text() == 'Save') {
    // Make fields readonly
    title.attr('readonly', 'readonly');
    title.css('background', 'none');
    textarea.attr('readonly', 'readonly');
    // Prevent submit, only toggle form
    MAPKEEP.addEditClick(formId);
    submit.text('Edit');
    deleteButton.addClass('hide');
  }
};
