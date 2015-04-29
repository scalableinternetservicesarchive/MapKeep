var mapkeep = mapkeep || {};

/**
 * Constructor for mapkeep application
 * @param notes
 * @param albums
 * @param auth
 * @constructor
 */
mapkeep.app = function(notes, albums, auth) {
  /** Notes and albums belonging to current user */
  this.notes = notes;
  /** For valid form submission */
  this.authToken = auth;
  /** Last open info window */
  this.curWindow = null;
  /** Last clicked marker */
  this.curMarker = null;
  /** Markers corresponding to note locations */
  this.markers = {};
  /** The google map object */
  this.map = null;
  /** The user's current location */
  this.userLoc = null;

  /** @type mapkeep.formHelper */
  this.formHelper = new mapkeep.formHelper(this, albums);
};

/**
 * Initializes map at input coordinates with user notes
 * Initializes form helper
 * @param lat
 * @param lng
 */
mapkeep.app.prototype.init = function(lat, lng) {

  if (lat && lng) {
    this.userLoc = new google.maps.LatLng(lat, lng);
  }

  this.formHelper.init();
  this.initMap();
  this.setUpClicks();

  // Draw notes on map
  for (var i = 0; i < this.notes.length; i++) {
    var note = this.notes[i];
    var marker = new google.maps.Marker({
      position: new google.maps.LatLng(note.latitude, note.longitude),
      map: this.map,
      title: note.title,
      draggable: false
    });
    this.formHelper.createNoteForm(marker, true, note);
  }

  this.map.controls[google.maps.ControlPosition.TOP_RIGHT]
    .push($('#overlay').get(0));
};

/**
 * Initializes map and user coordinates || UCLA
 */
mapkeep.app.prototype.initMap = function() {
  var center = this.userLoc ?
    new google.maps.LatLng(this.userLoc.lat(), this.userLoc.lng()) :
    new google.maps.LatLng(34.0722, -118.4441);

  var mapOptions = {
    center: center,
    mapTypeControl: false,
    streetViewControl: false,
    zoom: 10
  };

  this.map = new google.maps.Map(
    document.getElementById('map-canvas'), mapOptions);
};

/**
 * Create note and close overlay click listeners
 */
mapkeep.app.prototype.setUpClicks = function() {
  // Drop pin button
  $('#create_note').click(this.dropPin.bind(this));

  // Close button on note overlay
  $('#close-overlay').click(function() {
    // Reset and remove form
    var overlay = $('#overlay');
    overlay.addClass('hide');

    // Close info window and make marker un-draggable
    this.curWindow.setMap(null);
    this.curMarker.setOptions({
      draggable: false
    });

    // If new note not saved, clear marker
    if (overlay.find('form').hasClass('new_note')) {
      this.curMarker.setMap(null);
    }
  }.bind(this));
};

/**
 * Drops pin in center of map with editable form unless they already
 * have a new note to edit
 */
mapkeep.app.prototype.dropPin = function() {

  // Prevent pin drop if currently editing a note
  if (this.formHelper.isEditable()) {
    this.bounceMarker(350);
    return;
  }

  // Create and drop pin onto map
  var marker = new google.maps.Marker({
    position: this.map.center,
    map: this.map,
    draggable: true,
    animation: google.maps.Animation.DROP
  });

  // Show note in overlay with a new form
  this.curMarker = marker;
  var num = this.formHelper.createNoteForm(marker, false);
  this.formHelper.showForm(num, 450);
};

/**
 * Opens info window with specified title at the marker
 * @param title
 * @param marker
 */
mapkeep.app.prototype.openInfoWindow = function(title, marker) {
  var infoWindow = new google.maps.InfoWindow({
    content: title
  });

  if (this.curWindow) {
    this.curWindow.setMap(null);
  }

  this.curWindow = infoWindow;
  infoWindow.open(this.map, marker);
};

/**
 * Adds a listener to a marker to open a certain form
 * @param formNum
 */
mapkeep.app.prototype.addMarkerListener = function(formNum) {
  google.maps.event.addListener(this.markers[formNum], 'click', function() {

    // Prevent marker click if user currently editing a note
    if (this.formHelper.isEditable()) {
      this.bounceMarker(350);
      return;
    }

    // Turn off dragging on last marker
    if (this.curMarker) {
      this.curMarker.setOptions({
        draggable: false
      });
    }

    this.curMarker = this.markers[formNum];
    this.formHelper.showForm(formNum, 0);
    this.map.panTo(this.curMarker.getPosition());
  }.bind(this));
};

/**
 * Bounce marker for certain time
 * @param time
 */
mapkeep.app.prototype.bounceMarker = function(time) {
  this.curMarker.setAnimation(google.maps.Animation.BOUNCE);
  setTimeout(function() {
    this.curMarker.setAnimation(null);
  }.bind(this), time);
};

/**
 * Callback for note creation
 * @param note
 */
mapkeep.app.prototype.noteCreated = function(note) {
  this.formHelper.updateFormAction(note);
  this.formHelper.formSubmitted(note);
};

/**
 * Callback for note updates
 * @param note
 */
mapkeep.app.prototype.noteUpdated = function(note) {
  this.formHelper.formSubmitted(note);
};

/**
 * Callback for note deletion
 */
mapkeep.app.prototype.noteDeleted = function() {
  this.curWindow.close();
  this.curMarker.setMap(null);
  $('#overlay').addClass('hide');
};
