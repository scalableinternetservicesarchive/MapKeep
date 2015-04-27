/**
 * Constructor for mapkeep application
 * @param notes
 * @param auth
 * @constructor
 */
var mapkeep = function(notes, auth) {
  /** Notes belonging to current user */
  this.notes = notes;
  /** For valid form submission */
  this.authToken = auth;
  /** Form identifier */
  this.ct = 0;
  /** Last open info window */
  this.lastWindow = null;
  /** Markers corresponding to note location */
  this.markers = {};
  /** The google map object */
  this.map = null;
  /** The user's current location */
  this.userLoc = null;

  $('#create_note').click(this.dropPin.bind(this));
};

mapkeep.prototype.initMap = function(lat, lng) {
  // For now, center around ip location || UCLA
  this.userLoc = new google.maps.LatLng(lat, lng);
  var center = lat && lng ?
    new google.maps.LatLng(lat, lng) :
    new google.maps.LatLng(34.0722, -118.4441);

  var mapOptions = {
      center: center,
      zoom: 10
  };

  this.map = new google.maps.Map(
    document.getElementById('map-canvas'), mapOptions);

  // Draw notes on map
  for (var i = 0; i < this.notes.length; i++) {
    var marker = new google.maps.Marker({
      position: new google.maps.LatLng(
        this.notes[i].latitude, this.notes[i].longitude),
      map: this.map,
      title: this.notes[i].title,
      draggable: true
    });
    this.addInfoWindowToNote(this.notes[i], marker);
  }
};

/**
 * Adds info window representing note to specified marker
 * @param note For info
 * @param marker To add window to
 */
mapkeep.prototype.addInfoWindowToNote = function(note, marker) {
  var infoWindow = new google.maps.InfoWindow({
    content:  this.createNoteForm(marker, true, note)
  });

  var ct = this.ct, self = this;
  google.maps.event.addListener(marker, 'click', function() {
    self.openWindow(infoWindow, marker, ct);
  });

  this.ct++;
};

/**
 * Drops pin in center of map with editable form
 */
mapkeep.prototype.dropPin = function() {
  var ct = this.ct;

  var marker = new google.maps.Marker({
    position: this.map.center,
    map: this.map,
    draggable: true,
    animation: google.maps.Animation.DROP
  });

  var infoWindow = new google.maps.InfoWindow({
    content: this.createNoteForm(marker, false)
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
  var self = this;
  setTimeout(function() {
    self.openWindow(infoWindow, marker, ct, true);
    var form = $('#i' + ct);
    form.find('input[name=note\\[title\\]]').focus();
  }, 500);

  // Open info window on click
  google.maps.event.addListener(marker, 'click', function() {
    self.openWindow(infoWindow, marker, ct);
  });

  this.ct++;
};

/**
 * Close last info window and open new one
 * @param infoWindow To open
 * @param marker To open info window at
 * @param ct Form identifier
 * @param newNote Whether or not new note
 * @returns {Function}
 */
mapkeep.prototype.openWindow = function(infoWindow, marker, ct, newNote) {
  if (this.lastWindow) {
    this.lastWindow.close();
  }
  infoWindow.open(this.map, marker);
  this.lastWindow = infoWindow;
  // force form to be readonly if not a new note
  if (!newNote && !$('#i' + ct).hasClass('new_note')) {
    this.toggleForm('i' + ct, true);
  }
};

/**
 * @param marker The note belongs to for coordinates
 * @param readonly Whether or not this is a new note
 * @param note Note to use title and body for if existing
 * @returns {string}
 */
mapkeep.prototype.createNoteForm = function(marker, readonly, note) {
  function hiddenInput(name, value) {
    return $('<input/>')
      .attr('name', name)
      .attr('type', 'hidden')
      .val(value);
  }

  var formId = 'i' + this.ct;

  var title = $('<input/>')
    .attr('name', 'note[title]')
    .attr('placeholder', 'Title')
    .attr('value', readonly ? note.title : '')
    .attr('type', 'text');

  var submit = $('<button/>')
    .text(readonly ? 'Edit' : 'Save')
    .addClass('button tiny right')
    .attr('id', 'bi' + this.ct)
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
    .append(hiddenInput('note[latitude]', marker.position.lat()))
    .append(hiddenInput('note[longitude]', marker.position.lng()))
    .append(hiddenInput('authenticity_token', this.authToken))
    .append(hiddenInput('form_id', formId))
    .append(submit)
    .append(deleteButton);

  if (readonly) {
    textarea.attr('readonly', 'readonly');
    title.attr('readonly', 'readonly');
    form.append(hiddenInput('_method', 'patch'));
    this.addEditClick(formId);
  }

  // Save marker for deletion
  this.markers[formId] = marker;

  // Update coords on pin drag
  // TODO: make dragging only possible on new notes and notes in edit mode
  google.maps.event.addListener(marker, 'dragend', function() {
    var form = $('#' + formId);
    form.find('input[name=note\\[latitude\\]]').val(marker.position.lat());
    form.find('input[name=note\\[longitude\\]]').val(marker.position.lng());
  });

  return  form[0];
};

/**
 * Updates format of form to update (patch) vs create
 * @param formId
 * @param noteId
 */
mapkeep.prototype.formSubmitted = function(formId, noteId) {
  var form = $(formId);
  form.append('<input type="hidden" name="_method" value="patch">');
  form.attr('action', '/notes/' + noteId);
  form.removeClass('new_note');
  this.toggleForm(formId);
};

/**
 * Clicking edit toggles the form and prevents form submission
 * @param formId To add click function to (button inside)
 */
mapkeep.prototype.addEditClick = function(formId) {
  var self = this;
  $('#map-canvas').on('click', '#b' + formId, function() {
    self.toggleForm(formId);
    return false;
  });
};

/**
 * Toggles form readonly status
 * @param formId Form to toggle
 * @param readonly Whether to force readonly status
 */
mapkeep.prototype.toggleForm = function(formId, readonly) {
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
    this.addEditClick(formId);
    submit.text('Edit');
    deleteButton.addClass('hide');
    deleteButton.removeClass('button');
  }
};
