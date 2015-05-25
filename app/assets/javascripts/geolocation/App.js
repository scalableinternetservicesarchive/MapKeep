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

  /** @type mapkeep.FormManager */
  this.formManager = new mapkeep.FormManager(this, auth);
  this.albumManager = new mapkeep.AlbumManager(this, auth);
};

/**
 * Initializes map at input coordinates with user's notes
 * Initializes form helper
 * @param location
 * @param notes
 * @param albums
 */
mapkeep.App.prototype.init = function(location, notes, albums) {

  if (location.lat && location.lng) {
    this.userLoc = new google.maps.LatLng(location.lat, location.lng);
  }

  this.formManager.init(albums);
  this.albumManager.init(albums);
  this.initMap();
  this.setUpClicks();

  // Draw user and public notes on map
  var allNotes = notes.user_notes.concat(notes.public_notes);
  for (var i = 0; i < allNotes.length; i++) {
    var note = allNotes[i];
    var nonUser = i >= notes.user_notes.length;
    var marker = new google.maps.Marker({
      position: new google.maps.LatLng(note.latitude, note.longitude),
      map: this.map,
      title: note.title,
      draggable: false
    });
    if (nonUser) {
      marker.setIcon('http://www.googlemapsmarkers.com/v1/7777e1/');
    }
    this.formManager.createNoteView(marker, note, nonUser);
  }

  //Push the overlay onto the map also.
  this.map.controls[google.maps.ControlPosition.TOP_RIGHT]
    .push($('#overlay').get(0));

  this.map.controls[google.maps.ControlPosition.TOP_LEFT]
    .push($('#album-overlay').get(0));
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

  // Open an album form
  $('#create_album').click(this.createAlbum.bind(this));
  //$('#create_album').click(function() {
  //  alert('New thing!');
  //})

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

  // Close button on note album overlay
  $('#album-close-overlay').click(function() {
    // Reset and remove form
    var overlay = $('#album-overlay');
    overlay.addClass('hide');

    // Close info window and make marker un-draggable
    this.curWindow.setMap(null);
    this.curMarker.setOptions({
      draggable: false
    });

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
  var marker = new google.maps.Marker({
    position: this.map.center,
    map: this.map,
    draggable: true,
    animation: google.maps.Animation.DROP
  });

  // Show note in overlay with a new form
  this.curMarker = marker;
  var num = this.formManager.createNoteView(marker);
  this.formManager.showForm(num, 450);
};

mapkeep.App.prototype.createAlbum = function() {
  // Show album in overlay with a new form
  var num = this.albumManager.createAlbumView();
  this.albumManager.showForm(num);
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
 * @param formNum
 */
mapkeep.App.prototype.addMarkerListener = function(formNum) {
  google.maps.event.addListener(this.markers[formNum], 'click', function() {

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

    this.curMarker = this.markers[formNum];
    this.formManager.showForm(formNum, 0);
    this.map.panTo(this.curMarker.getPosition());
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


mapkeep.App.prototype.albumCreated = function(album) {
  this.albumManager.addAlbum(album);
};

// TODO: change title of album here & albumSize into album id here and in the albumManager.