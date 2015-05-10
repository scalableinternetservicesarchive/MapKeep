var mapkeep = mapkeep || {};

/**
 * Constructor for mapkeep application
 * @param auth
 * @constructor
 */
mapkeep.App = function(auth) {
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
  /** Fully populated notes by id */
  this.notes = {};

  /** @type mapkeep.FormManager */
  this.formManager = new mapkeep.FormManager(this, auth);
};

/**
 * Initializes map at input coordinates with user's notes
 * Initializes form helper
 * @param user
 * @param notes
 * @param albums
 */
mapkeep.App.prototype.init = function(user, notes, albums) {

  if (user.location.lat && user.location.lng) {
    this.userLoc = new google.maps.LatLng(user.location.lat, user.location.lng);
  }

  this.formManager.init(albums);
  this.initMap();
  this.setUpClicks();
  this.user = user;

  // Draw user and public notes on map
  for (var i = 0; i < notes.length; i++) {
    var note = notes[i];
    var marker = new google.maps.Marker({
      position: new google.maps.LatLng(note.latitude, note.longitude),
      map: this.map,
      draggable: false
    });

    if (note.user_id != user.id) {
      marker.setIcon('http://www.googlemapsmarkers.com/v1/7777e1/');
    }

    this.markers[note.id] = marker;
    this.addMarkerListener(marker, note.id);
  }

  this.map.controls[google.maps.ControlPosition.TOP_RIGHT]
    .push($('#overlay').get(0));
};

/**
 * Initializes map and user coordinates || UCLA
 */
mapkeep.App.prototype.initMap = function() {
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
mapkeep.App.prototype.setUpClicks = function() {
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
mapkeep.App.prototype.dropPin = function() {

  // Prevent pin drop if currently editing a note
  if (this.formManager.isEditable()) {
    this.bounceMarker(350);
    return;
  }

  // Create and drop pin onto map
  this.curMarker = new google.maps.Marker({
    position: this.map.center,
    map: this.map,
    draggable: true,
    animation: google.maps.Animation.DROP
  });

  this.formManager.showForm(null, 450);
};

/**
 * Opens info window with specified title at the marker
 * @param title
 * @param marker
 */
mapkeep.App.prototype.openInfoWindow = function(title, marker) {
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
 * @param marker
 * @param noteId
 */
mapkeep.App.prototype.addMarkerListener = function(marker, noteId) {
  google.maps.event.addListener(marker, 'click', function() {

    // Prevent marker click if user currently editing a note
    if (this.formManager.isEditable()) {
      this.bounceMarker(350);
      return;
    }

    // Turn off dragging on last marker
    if (this.curMarker) {
      this.curMarker.setOptions({
        draggable: false
      });
    }

    this.curMarker = marker;
    this.map.panTo(this.curMarker.getPosition());

    if (this.notes[noteId]) {
      this.formManager.showForm(this.notes[noteId], 0);
    } else {
      $.getJSON('/notes/' + noteId + '.json', function(data) {
        // TODO: error ?
        this.notes[noteId] = data;
        this.formManager.showForm(this.notes[noteId], 0);
      }.bind(this));
    }
  }.bind(this));
};

/**
 * Bounce marker for certain time
 * @param time
 */
mapkeep.App.prototype.bounceMarker = function(time) {
  this.curMarker.setAnimation(google.maps.Animation.BOUNCE);
  setTimeout(function() {
    this.curMarker.setAnimation(null);
  }.bind(this), time);
};

/**
 * Callback for note creation
 * @param note
 */
mapkeep.App.prototype.noteCreated = function(note) {
  this.formManager.updateFormAction(note);
  this.formManager.formSubmitted(note);
};

/**
 * Callback for note updates
 * @param note
 */
mapkeep.App.prototype.noteUpdated = function(note) {
  this.formManager.formSubmitted(note);
};

/**
 * Callback for note deletion
 */
mapkeep.App.prototype.noteDeleted = function() {
  this.curWindow.close();
  this.curMarker.setMap(null);
  $('#overlay').addClass('hide');
};
