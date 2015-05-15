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
  /** The user's current location */
  this.userLoc = null;
  /** The current session token */
  this.authToken = auth;

  this.formManager = new mapkeep.FormManager(this, auth);
};

mapkeep.NotesViewer.prototype.initMap = function () {
  // Initialize the map at UCLA
  var mapOptions = {
    zoom: 10,
    mapTypeControl: false,
    streetViewControl: false,
    minZoom: 4,
    center: new google.maps.LatLng(34.0722, -118.4441)  // center at UCLA
  };

  this.userLoc = mapOptions.center;
  this.map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
};

mapkeep.NotesViewer.prototype.updateForm = function(note, albums) {
  this.userLoc = new google.maps.LatLng(note.latitude, note.longitude);

  this.noteForm.prop('action', '/notes/' + note.id);
  this.noteForm.find('input[name=note\\[title\\]]')
    .val(note.title);
  this.noteForm.find('textarea')
    .html(note.body);
  this.noteForm.find('input[name=latitude]')
    .val('' + note.latitude);
  this.noteForm.find('input[name=longitude]')
    .val('' + note.longitude);
  this.noteForm.find('input[name=authenticity_token]')
    .val('' + this.authToken);
  this.noteForm.find('input[name=album_ids]')
    .val(this.formManager.albumIdString(note.albums));
  this.noteForm.find('#privateTrue')
    .prop('defaultChecked', note.private);
  this.noteForm.find('#privateFalse')
    .prop('defaultChecked', !note.private);
};

mapkeep.NotesViewer.prototype.centerMap = function() {
  google.maps.event.trigger(this.map, 'resize');
  this.map.panTo(this.userLoc);
};

mapkeep.NotesViewer.prototype.updatePin = function() {
  // Delete last pin
  if (this.curMarker)
    this.curMarker.setMap(null);

  // Create and drop pin onto map
  this.curMarker = new google.maps.Marker({
    position: this.map.center,
    map: this.map,
    draggable: true,
    animation: google.maps.Animation.DROP
  });
};


/********* Document *********/
$(document).ready(function() {
  $(document).foundation();

  // Set height the first time. Need to use absolute size to reveal Google Maps
  $('.reveal-modal').css('height', $('html').height() - 120 + 'px'); // 100+20px to keep modal effect visible

  var auth = editModal.data('session');
  var userid = editModal.data('userid');
  notesApp = new mapkeep.NotesViewer(userid, auth);

  google.maps.event.addDomListener(window, 'load', notesApp.initMap());
});

$(window).resize(function() {
  // Reset max-height after window resize. Need to use absolute size to reveal Google Maps
  $('.reveal-modal').css('height', $('html').height() - 120 + 'px');
});

$("a.reveal-link").click(function () {
  var note = $(this).data('note');
  var albums = $(this).data('albums');
  notesApp.updateForm(note, albums);

  editModal.foundation('reveal', 'open');

});

editModal.bind('opened.fndtn.reveal', function() {
  // Otherwise the map will be off center and the wrong size
  notesApp.centerMap();
  notesApp.updatePin();
});
