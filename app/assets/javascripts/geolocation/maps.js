// TODO: reuse form elements

/**
 * Constructor for mapkeep application
 * @param notes
 * @param albums
 * @param auth
 * @constructor
 */
var mapkeep = function(notes, albums, auth) {
  /** Notes and albums belonging to current user */
  this.notes = notes;
  this.albums = albums;
  /** For valid form submission */
  this.authToken = auth;
  /** Form identifier */
  this.formNum = 0;
  /** Last open info window */
  this.curWindow = null;
  /** Markers corresponding to note location */
  this.markers = {};
  this.forms = {};
  /** The google map object */
  this.map = null;
  /** The user's current location */
  this.userLoc = null;

  $('#create_note').click(this.dropPin.bind(this));
  $('#close-overlay').click(function() {
    // TODO: remove marker if new note
    // TODO: remake labels based on saved state
    $('#overlay').addClass('hide').find('form').remove();
  });
};

/**
 * Initializes map at input coordinates with user notes
 * @param lat
 * @param lng
 */
mapkeep.prototype.initMap = function(lat, lng) {
  // For now, center around ip location || UCLA
  this.userLoc = new google.maps.LatLng(lat, lng);
  var center = lat && lng ?
    new google.maps.LatLng(lat, lng) :
    new google.maps.LatLng(34.0722, -118.4441);

  var mapOptions = {
    center: center,
    mapTypeControl: false,
    streetViewControl: false,
    zoom: 10
  };

  this.map = new google.maps.Map(
    document.getElementById('map-canvas'), mapOptions);

  // Draw notes on map
  for (var i = 0; i < this.notes.length; i++) {
    var note = this.notes[i];
    var marker = new google.maps.Marker({
      position: new google.maps.LatLng(note.latitude, note.longitude),
      map: this.map,
      title: note.title,
      draggable: true
    });
    this.createNoteForm(marker, true, note);
  }

  this.map.controls[google.maps.ControlPosition.TOP_RIGHT]
    .push($('#overlay').get(0));
};

/**
 * Drops pin in center of map with editable form
 */
mapkeep.prototype.dropPin = function() {
  // create and drop pin onto map
  var marker = new google.maps.Marker({
    position: this.map.center,
    map: this.map,
    draggable: true,
    animation: google.maps.Animation.DROP
  });

  // Show note window and focus on title input
  var formNum = this.formNum;
  this.createNoteForm(marker, false);
  this.openWindow(formNum, true, 450);

  this.forms[formNum].find('input[name=note\\[title\\]]').focus();
};

/**
 * Opens info window with specified title at the marker
 * @param title
 * @param marker
 */
mapkeep.prototype.openInfoWindow = function(title, marker) {
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
 * @param formNum
 */
mapkeep.prototype.addMarkerListener = function(marker, formNum) {
  google.maps.event.addListener(marker, 'click', function() {
    this.openWindow(formNum, 0);
  }.bind(this));
};

/**
 * Close last form and open new one
 * @param formNum Form identifier
 * @param newNote Whether or not new note
 * @param timeout For info window open
 */
mapkeep.prototype.openWindow = function(formNum, newNote, timeout) {
  var overlay = $('#overlay');

  // Open info window for note title
  setTimeout(function() {
    this.openInfoWindow(
      this.forms[formNum].find('input[name=note\\[title\\]]').val(),
      this.markers[formNum]
    );
  }.bind(this), timeout);

  // remove previous form and show specified form
  overlay.find('form').remove();
  overlay.append(this.forms[formNum]).removeClass('hide');
  overlay.find('.group').removeClass('hide');

  // force form to be readonly if not a new note
  if (!newNote && !this.forms[formNum].hasClass('new_note')) {
    this.toggleForm(formNum, true);
  }

  $(document).foundation();
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

  var title = $('<input/>')
    .attr('name', 'note[title]')
    .attr('placeholder', 'Title')
    .attr('value', readonly ? note.title : '')
    .attr('type', 'text')
    .keyup(function() {
      this.curWindow.setContent(title.val());
    }.bind(this));

  var submit = $('<button/>')
    .text(readonly ? 'Edit' : 'Save')
    .addClass('button tiny right')
    .attr('id', getButtonId(this.formNum).substr(1)) // remove # sign here
    .attr('type', 'submit')
    .click(function() {
      // TODO: fix this and only run when saving
      var albumIds = $(formId).find('input[name=note\\[album_ids\\]\\[\\]]');
      var idsString = '';
      var albums = $('#overlay').find('.label').not('.alert');
      albums.each(function(x, al) {
        var album = $(al);
        if (album.is(':visible')) {
          idsString += $(al).attr('value') + ',';
        }
      });
      albumIds.val(idsString);
    });

  var deleteButton = $('<button/>')
    .text('Delete')
    .addClass('alert tiny right hide')
    .attr('type', 'submit')
    .click(function() {
      form.find('input[name=_method]').val('delete');
    });

  var textarea = $('<textarea/>')
    .attr('name', 'note[body]')
    .attr('rows', '10')
    .attr('placeholder', 'Write anything you want about this location!')
    .text(readonly ? note.body : '');

  var formId = getFormId(this.formNum);
  var form = $('<form/>')
    .addClass(readonly ? '' : 'new_note')
    .attr('id', formId.substr(1)) // remove # sign here
    .attr('action', readonly ? '/notes/' + note.id : '/notes')
    .attr('method', 'post')
    .attr('data-remote', 'true')
    .attr('accept-charset', 'UTF-8')
    .append(title)
    .append($('<br/>'))
    .append(textarea)
    .append(this.createAlbumHtml(note, readonly))
    .append(hiddenInput('note[latitude]', marker.position.lat()))
    .append(hiddenInput('note[longitude]', marker.position.lng()))
    .append(hiddenInput('authenticity_token', this.authToken))
    .append(hiddenInput('form_id', this.formNum))
    .append(hiddenInput('note[album_ids][]', ''))
    .append(submit)
    .append(deleteButton);

  if (readonly) {
    textarea.attr('readonly', 'readonly');
    title.attr('readonly', 'readonly');
    form.append(hiddenInput('_method', 'patch'));
    this.addEditClick(this.formNum);
  }

  // Save marker and form for deletion
  this.markers[this.formNum] = marker;
  this.forms[this.formNum] = form;

  // Update coords on pin drag
  // TODO: make dragging only possible on new notes and notes in edit mode
  var formNum = this.formNum;
  google.maps.event.addListener(marker, 'dragend', function() {
    var form = this.forms[formNum];
    form.find('input[name=note\\[latitude\\]]').val(marker.position.lat());
    form.find('input[name=note\\[longitude\\]]').val(marker.position.lng());
  }.bind(this));

  this.addMarkerListener(marker, this.formNum++);
  return form[0];
};

/**
 * Creates html for album label creation and deletion
 * and displays albums the note belongs to
 * @param note
 * @param readonly
 * @returns {*|jQuery}
 */
mapkeep.prototype.createAlbumHtml = function(note, readonly) {
  var albumHtml = $('<div/>').html('Albums: ');

  /**
   * Creates a label group:
   *    - the album name label (tagged with album id as value)
   *    - a delete X alert label
   * @param album For title and id
   * @param showDelete Whether or not to show the delete button
   * @returns {*|jQuery}
   */
  function makeLabelGroup(album, showDelete) {
    var label = $('<span/>')
      .addClass('label')
      .html(album.title)
      .attr('value', album.id);

    // Hide label on delete, remove on save
    var deleteLabel = $('<span/>').addClass('alert').html('X');
    deleteLabel.click(function() {
      $(this).parent().addClass('hide');
    });

    // Show delete button next to label or not
    if (showDelete) {
      deleteLabel.addClass('label');
    } else {
      deleteLabel.addClass('hide');
    }

    return $('<span/>')
      .addClass('group')
      .append(label)
      .append(deleteLabel);
  }

  /** On click function for album dropdown click */
  function albumPrepend(album) {
    return function() {
      // append label if it doesn't exist and is not hidden
      // otherwise just unhide the label
      var labels = albumHtml.find('span[value=' + album.id + ']');
      if (!labels.length) {
        dropDownButton.before(makeLabelGroup(album, true));
      } else if (labels.parent().hasClass('hide')) {
        labels.parent().removeClass('hide');
      }
    }
  }

  var dropDownId = getDropDownId(this.formNum);
  var dropDown = ($('<ul data-dropdown-content/>')
    .addClass('f-dropdown')
    .attr('id', dropDownId)
    .attr('aria-hidden', 'true'));

  // Add label groups for albums the note belongs in
  if (note) {
    for (var i = 0; i < note.albums.length; i++) {
      var album = note.albums[i];
      albumHtml.append(makeLabelGroup(album));
    }
  }

  var clz = readonly ? 'hide' : 'button';
  var dropDownButton = $('<button/>')
    .addClass('secondary tiny dropdown ' + clz)
    .attr('data-dropdown', dropDownId)
    .attr('aria-controls', dropDownId)
    .attr('aria-expanded', 'false')
    .attr('type', 'button')
    .attr('href', '#')
    .html('+ Album');

  // Add links that represent the user's albums, on click it adds a label group
  for (i = 0; i < this.albums.length; i++) {
    album = this.albums[i];
    var link = $('<a/>')
      .attr('href', '#')
      .html(album.title)
      .click(albumPrepend(album));
    dropDown.append($('<li/>').append(link));
  }

  albumHtml.append(dropDownButton);
  albumHtml.append(dropDown);

  return albumHtml;
};

/**
 * Updates format of form to update (patch) vs create
 * @param formNum
 * @param noteId
 */
mapkeep.prototype.formSubmitted = function(formNum, noteId) {
  var form = this.forms[formNum];
  form.append('<input type="hidden" name="_method" value="patch">');
  form.attr('action', '/notes/' + noteId);
  form.removeClass('new_note');
  this.toggleForm(formNum);
};

/**
 * Clicking edit toggles the form and prevents form submission
 * @param formNum To add click function to (button inside)
 */
mapkeep.prototype.addEditClick = function(formNum) {
  $('#map-canvas').on('click', getButtonId(formNum), function() {
    this.toggleForm(formNum);
    return false;
  }.bind(this));
};

/**
 * Toggles form readonly status
 * @param formNum Form to toggle
 * @param readonly Whether to force readonly status
 */
mapkeep.prototype.toggleForm = function(formNum, readonly) {
  var form = this.forms[formNum];
  var title = form.find('input[type!="hidden"]');
  var textarea = form.find('textarea');
  var submit = form.find('button').not('.alert').not('.secondary');
  var deleteDropButtons = form.find('button.alert, button.dropdown');
  var alertSpans = form.find('span.alert');

  if (submit.text() == 'Edit' && !readonly) {
    // Make fields editable
    title.removeAttr('readonly');
    textarea.removeAttr('readonly');
    // Remove submit blocking
    $('#map-canvas').off('click', getButtonId(formNum));
    submit.text('Save');
    deleteDropButtons.removeClass('hide');
    deleteDropButtons.addClass('button');
    alertSpans.removeClass('hide');
    alertSpans.addClass('label');

  }  else if (submit.text() == 'Save') {
    // Make fields readonly
    title.attr('readonly', 'readonly');
    title.css('background', 'none');
    textarea.attr('readonly', 'readonly');
    // Prevent submit, only toggle form
    this.addEditClick(formNum);
    submit.text('Edit');
    deleteDropButtons.addClass('hide');
    deleteDropButtons.removeClass('button');
    alertSpans.addClass('hide');
    alertSpans.removeClass('label');
  }
};

function getFormId(formNum) {
  return '#i' + formNum;
}

function getButtonId(formNum) {
  return '#b' + formNum;
}

function getDropDownId(formNum) {
  return 'd' + formNum;
}
