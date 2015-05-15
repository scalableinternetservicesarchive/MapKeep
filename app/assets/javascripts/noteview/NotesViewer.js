var mapkeep = mapkeep || {};

var editModal = $('#editModal');

var notesApp = null;

mapkeep.NotesViewer = function(userid, auth) {
  /** The google map object */
  this.map = null;
  /** Last clicked marker */
  this.curMarker = null;
  /** The note form */
  this.noteForm = $('#noteView');
  /** The user id */
  this.userid = userid;
  /** The current note's location */
  this.curLoc = null;
  /** The current session token */
  this.authToken = auth;

  /** @type mapkeep.FormManager */
  this.formManager = new mapkeep.FormManager(this, auth);
  this.formManager.curForm = this.noteForm;
};

/**
 * One time set up for form click/keyup functions that never change
 * included cancel, delete, and keyup for title input
 * @param albums All of the user's albums
 */
mapkeep.NotesViewer.prototype.init = function(albums) {
  this.initMap();
  // Index albums by id to name
  for (var i = 0; i < albums.length; i++) {
    this.formManager.albums[albums[i].id] = albums[i].title;
  }

  var overlay = $('#overlay');

  // Cancel either removes not/marker or undos changes made
  overlay.on('click', '#cancel-button', function() {
    // Undo changes the user made
    this.formManager.makeReadonly();
    var lat = overlay.find('input[name=note\\[latitude\\]]').val();
    var lng = overlay.find('input[name=note\\[longitude\\]]').val();
    this.curMarker.setPosition(new google.maps.LatLng(lat, lng));
  }.bind(this));

  // Change form method to delete before submission (for rails)
  overlay.on('click', '#delete-button', function() {
    overlay.find('input[name=_method]').val('delete');

    // Confirm if user wants to delete
    var confirmDelete = confirm('Are you sure you want to delete the note?');
    // Change form method back to post
    if (!confirmDelete)
      overlay.find('input[name=_method]').val('post');
  });

  // Album button click
  overlay.on('click', '#album-dropdown a', function() {
    self.albumPrepend($(this).attr('value'));
  });
};

/**
 * Initializes map at UCLA
 */
mapkeep.NotesViewer.prototype.initMap = function () {
  var mapOptions = {
    zoom: 10,
    mapTypeControl: false,
    streetViewControl: false,
    minZoom: 4,
    center: new google.maps.LatLng(34.0722, -118.4441)  // center at UCLA
  };

  this.curLoc = mapOptions.center;
  this.map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
};

/**
 * Updates form data to contents of note
 * @param note
 */
mapkeep.NotesViewer.prototype.updateForm = function(note) {
  this.curLoc = new google.maps.LatLng(note.latitude, note.longitude);

  this.noteForm.prop('action', '/notes/' + note.id);
  this.noteForm.find('input[name=note\\[title\\]]')
    .val('' + note.title);
  this.noteForm.find('input[name=note\\[title\\]]')
    .attr('value', '' + note.title);
  this.noteForm.find('textarea')
    .html(note.body);
  this.noteForm.find('input[name=note\\[latitude\\]]')
    .val('' + note.latitude);
  this.noteForm.find('input[name=note\\[longitude\\]]')
    .val('' + note.longitude);
  this.noteForm.find('input[name=authenticity_token]')
    .val('' + this.authToken);
  this.noteForm.find('input[name=note\\[album_ids\\]\\[\\]]')
    .val(this.formManager.albumIdString(note.albums));
  this.noteForm.find('#privateTrue')
    .prop('defaultChecked', note.private);
  this.noteForm.find('#privateFalse')
    .prop('defaultChecked', !note.private);
};

mapkeep.NotesViewer.prototype.centerMap = function() {
  google.maps.event.trigger(this.map, 'resize');
  this.map.panTo(this.curLoc);
};

mapkeep.NotesViewer.prototype.updatePin = function() {
  // Delete last pin
  if (this.curMarker)
    this.curMarker.setMap(null);

  // Create and drop pin onto map
  this.curMarker = new google.maps.Marker({
    position: this.curLoc,
    map: this.map,
    draggable: true
  });
};


/********* Document *********/
$(document).ready(function() {
  $(document).foundation();

  // Set height the first time. Need to use absolute size to reveal Google Maps
  $('.reveal-modal').css('height', $('html').height() - 120 + 'px'); // 100+20px to keep modal effect visible

  var auth = editModal.data('session');
  var userid = editModal.data('userid');
  var albums = editModal.data('albums');
  notesApp = new mapkeep.NotesViewer(userid, auth);

  google.maps.event.addDomListener(window, 'load', notesApp.init(albums));
});

$(window).resize(function() {
  // Reset max-height after window resize. Need to use absolute size to reveal Google Maps
  $('.reveal-modal').css('height', $('html').height() - 120 + 'px');
});

$("a.reveal-link").click(function () {
  var note = $(this).data('note');
  notesApp.updateForm(note);
  notesApp.updatePin();
  notesApp.formManager.makeReadonly();

  editModal.foundation('reveal', 'open');
});

editModal.bind('opened.fndtn.reveal', function() {
  // Otherwise the map will be off center and the wrong size
  notesApp.centerMap();

  // Animate the pin. Stop after 750ms -> 1 or 2 bounces
  notesApp.curMarker.setAnimation(google.maps.Animation.BOUNCE);
  setTimeout(function(){ notesApp.curMarker.setAnimation(null); }, 750);

  $(document).foundation();
});
