var mapkeep = mapkeep || {};

/**
 * A form helper for form creation and dom manipulation
 * @param app Mapkeep app, map manipulation
 * @param auth
 * @constructor
 */
mapkeep.FormManager = function(app, auth) {
  /** List of all user's albums */
  this.albums = {};
  /** Current opened form */
  this.curForm = null;
  /** For valid form submission */
  this.authToken = auth;

  /** @type mapkeep.App */
  this.app = app;
};

/**
 * One time set up for form click/keyup functions that never change
 * included cancel, delete, and keyup for title input
 * @param albums All of the user's albums
 */
mapkeep.FormManager.prototype.init = function(albums) {
  // Index albums by id to name
  for (var i = 0; i < albums.length; i++) {
    this.albums[albums[i].id] = albums[i].title;
  }

  var overlay = $('#overlay');

  // Cancel either removes not/marker or undos changes made
  overlay.on('click', '#cancel-button', function() {
    if (this.curForm.hasClass('new_note')) {
      // Remove note and marker
      overlay.find('form').remove();
      overlay.addClass('hide');
      this.app.curMarker.setMap(null);
      this.app.curWindow.setMap(null);
    } else {
      // Undo changes the user made
      this.makeReadonly();
      var lat = overlay.find('input[name=note\\[latitude\\]]').val();
      var lng = overlay.find('input[name=note\\[longitude\\]]').val();
      this.app.curMarker.setPosition(new google.maps.LatLng(lat, lng));
    }
  }.bind(this));

  // Sync title input with info window title
  overlay.on('change paste keyup', 'input[name=note\\[title\\]]', function() {
    this.app.curWindow.setContent(
      overlay.find('input[name=note\\[title\\]]').val());
  }.bind(this));

  // Change form method to delete before submission (for rails)
  overlay.on('click', '#delete-button', function() {
    overlay.find('input[name=_method]').val('delete');
  });

  // Star button click
  overlay.on('click', '#star', function() {
    // if was empty, add { star - userid, noteid }
    // if was full, delete star
    // update star count ?
  });

  // Album button click
  var self = this;
  overlay.on('click', '#album-dropdown a', function() {
    self.albumPrepend($(this).attr('value'));
  });
};

/**
 * Whether current form is editable or not
 * @returns {boolean}
 */
mapkeep.FormManager.prototype.isEditable = function() {
  var overlay = $('#overlay');
  return overlay.find('input[readonly]').length === 0 &&
    !overlay.hasClass('hide');
};

/**
 * Creates a hidden input with corresponding name and value
 * @param name
 * @param value
 * @returns {*|jQuery}
 */
mapkeep.FormManager.prototype.hiddenInput = function(name, value) {
  return $('<input/>')
    .attr('name', name)
    .attr('type', 'hidden')
    .val(value);
};

/**
 * Create album id comma separated string
 * @param albums (Note form ie [{id:x},{id:y},...])
 * @returns {string}
 */
mapkeep.FormManager.prototype.albumIdString = function(albums) {
  return albums.reduce(function(prev, cur) {
    return prev + cur.id + ',';
  }, '');
};

/**
 * Creates a form for a note that is tied to a marker
 * @param note Note to use title and body for if existing
 * @param nonUser Only show the note, no editable features
 * @returns {Number} identifier for form
 */
mapkeep.FormManager.prototype.createNoteView =
  function(note, nonUser) {
    var holder = nonUser ? $('<div/>') : $('<form/>');
    holder
      .attr('id', 'noteView')
      .append(this.createTextGroup(note))
      .append(this.createAlbumHtml(note));

    if (!nonUser) {
      // add form attributes and hidden inputs
      holder
        .addClass(note ? '' : 'new_note')
        .attr('action', note ? '/notes/' + note.id : '/notes')
        .attr('method', 'post')
        .attr('data-remote', 'true')
        .attr('accept-charset', 'UTF-8')
        .append(this.hiddenInput('note[latitude]', note ? note.latitude : ''))
        .append(this.hiddenInput('note[longitude]', note ? note.longitude : ''))
        .append(this.hiddenInput('authenticity_token', this.authToken))
        .append(this.hiddenInput('note[album_ids][]',
          note ? this.albumIdString(note.albums) : ''))
        .append(this.createRadioGroup(note))
        .append(this.createFormButtons(note ? true : false))
        .append(this.hiddenInput('_method', note ? 'patch' : 'post'));
    } else {
      holder.find('.group').append('<span id="star">☆</span>');
    }

    if (note) {
      holder.find('input, textarea').attr('readonly', 'readonly');
    }

    return holder;
  };

/**
 * Creates title and body fields for note
 * @param note
 * @returns {*|jQuery}
 */
mapkeep.FormManager.prototype.createTextGroup = function(note) {
  var title = $('<input/>')
    .attr('name', 'note[title]')
    .attr('placeholder', 'Title')
    .attr('value', note ? note.title : '')
    .attr('type', 'text');

  var textarea = $('<textarea/>')
    .attr('name', 'note[body]')
    .attr('rows', '10')
    .attr('placeholder', 'Write anything you want about this location!')
    .text(note ? note.body : '');

  return $('<div/>')
    .append(title)
    .append('<br/>')
    .append(textarea);
};

/**
 * Creates radio buttons for public/private options
 * @param note
 * @returns {*|jQuery}
 */
mapkeep.FormManager.prototype.createRadioGroup = function(note) {
  var isPrivate = !note || note.private;

  var privateRadio = $('<input' + (isPrivate ? ' checked ' : '') + '/>')
    .attr('type', 'radio')
    .attr('name', 'note[private]')
    .attr('id', 'privateTrue')
    .val('true');

  var privateLabel = $('<label/>')
    .attr('for', 'privateTrue')
    .html('Private');

  var publicRadio = $('<input' + (isPrivate ? '' : ' checked ') + '/>')
    .attr('type', 'radio')
    .attr('name', 'note[private]')
    .attr('id', 'privateFalse')
    .val('false');

  var publicLabel = $('<label/>')
    .attr('for', 'privateFalse')
    .html('Public');

  return $('<div/>')
    .attr('id', 'radio-group')
    .addClass(note ? 'hide' : '')
    .append(privateRadio).append(privateLabel)
    .append(publicRadio).append(publicLabel);
};

/**
 * If readonly, submit button toggles the form
 * @param readonly
 * @returns {*|jQuery}
 */
mapkeep.FormManager.prototype.createFormButtons = function(readonly) {
  var holder = $('<div/>');

  var submit = $('<button/>')
    .text(readonly ? 'Edit' : 'Save')
    .addClass('button tiny right')
    .attr('id', 'submit-edit-button')
    .attr('type', 'submit');

  var deleteButton = $('<button/>')
    .text('Delete')
    .addClass('alert tiny right hide')
    .attr('type', 'submit')
    .attr('id', 'delete-button');

  var cancelButton = $('<button/>')
    .text('Cancel')
    .addClass('secondary tiny right hide')
    .attr('type', 'button')
    .attr('id', 'cancel-button');

  return holder
    .append(submit)
    .append(deleteButton)
    .append(cancelButton);
};

/**
 * Makes the current form readonly and resets to default values
 */
mapkeep.FormManager.prototype.makeReadonly = function() {
  this.app.curMarker.setOptions({
    draggable: false
  });

  this.resetForm();

  // Make fields readonly
  this.curForm.find('input[name=note\\[title\\]], textarea')
    .attr('readonly', 'readonly');

  // Prevent submit and change button text to 'Edit'
  this.turnOffSubmit();
  $('#submit-edit-button').text('Edit');

  // Hide delete and dropdown button and radio buttons
  $('#delete-button, #album-button, #cancel-button, #radio-group')
    .addClass('hide')
    .removeClass('button');

  // Hide album delete labels
  this.curForm.find('span.alert')
    .addClass('hide')
    .removeClass('label');
};

/**
 * Makes current form editable and marker draggable
 */
mapkeep.FormManager.prototype.makeEditable = function() {
  this.app.curMarker.setOptions({
    draggable: true
  });

  // Make fields editable
  this.curForm.find('input[name=note\\[title\\]], textarea')
    .removeAttr('readonly');

  // Remove submit blocking, change text to 'Save'
  this.turnOnSubmit();
  $('#submit-edit-button').text('Save');

  // Show delete and dropdown button
  $('#delete-button, #cancel-button, #album-button')
    .removeClass('hide')
    .addClass('button');

  // Show album delete labels
  this.curForm.find('span.alert')
    .removeClass('hide')
    .addClass('label');

  // Show public/private radio buttons
  this.curForm.find('#radio-group').removeClass('hide');

  // Focus on input
  this.curForm.find('input[name=note\\[title\\]]').focus();
};

/**
 * Creates checkboxes for present labels, or empty input if none
 * for form submission
 * @returns {Array}
 */
mapkeep.FormManager.prototype.createAlbumCheckboxes = function() {
  var elements = [];
  var empty = true;

  for (var id in this.albums) {
    if (this.albums.hasOwnProperty(id)) {
      var album = this.curForm.find('.group[value=' + id + ']').not('.hide');
      if (album.length > 0) {
        empty = false;
        elements.push(
          this.hiddenInput('note[album_ids][]', id)
            .attr('type', 'checkbox')
            .addClass('hide')
            .prop('checked', album.length > 0));
      }
    }
  }

  if (empty) {
    elements.push(this.hiddenInput('note[album_ids][]', ''));
  }

  return elements;
};

/**
 * Update album ids input before save
 * Make current for submittable
 */
mapkeep.FormManager.prototype.turnOnSubmit = function() {
  $('#overlay')
    .off('click', '#submit-edit-button')
    .on('click', '#submit-edit-button', function() {

      // Update album ids input(s)
      $('#overlay').find('input[name=note\\[album_ids\\]\\[\\]]').remove();
      this.curForm.append.apply(this.curForm, this.createAlbumCheckboxes());

      // Update lat/lng with marker coordinates
      this.curForm.find('input[name=note\\[latitude\\]]')
        .val(this.app.curMarker.position.lat());
      this.curForm.find('input[name=note\\[longitude\\]]')
        .val(this.app.curMarker.position.lng());
    }.bind(this));
};

/**
 * Make current form editable on click
 */
mapkeep.FormManager.prototype.turnOffSubmit = function() {
  $('#overlay')
    .off('click', '#submit-edit-button')
    .on('click', '#submit-edit-button', function() {
      this.makeEditable();
      return false;
    }.bind(this));
};

/**
 * Resets form including inputs, textarea, album labels
 */
mapkeep.FormManager.prototype.resetForm = function() {
  // Reset normal inputs
  this.curForm.get(0).reset();

  // Set info window title to default value
  if (this.app.curWindow) {
    this.app.curWindow.setContent(
      this.curForm.find('input[name=note\\[title\\]]').val());
  }

  // Reset album labels
  this.removeAlbumLabels();
};

/**
 * Close last form and open new one as well as info window with title
 * @param note
 * @param timeout For info window open
 */
mapkeep.FormManager.prototype.showForm = function(note, timeout) {
  var overlay = $('#overlay');

  // Create note view if we haven't yet
  if (note && !note.view) {
    note.view = this.createNoteView(note, note.user_id != this.app.user.id);
    this.curForm = note.view;
  } else if (!note) {
    // This is a new note
    this.curForm = this.createNoteView(null, false);
  } else {
    this.curForm = note.view;
  }

  // Open info window for note title at corresponding marker after timeout
  setTimeout(function() {
    this.app.openInfoWindow(
      this.curForm.find('input[name=note\\[title\\]]').val(),
      this.app.curMarker // TODO: index marker by note id ?
    );
  }.bind(this), timeout);

  // Remove previous form and show specified form
  overlay.find('#noteView').remove();
  overlay.append(this.curForm).removeClass('hide');

  var hasForm = overlay.find('form').length > 0;
  if (!this.curForm.hasClass('new_note') && hasForm) {
    // Force form to be readonly if not a new note
    this.makeReadonly();
  } else if (hasForm) {
    // Hide delete button if it is a new note
    this.makeEditable();
    this.curForm.find('#delete-button').addClass('hide').removeClass('button');
  }

  // Initialize foundation components
  $(document).foundation();
};

/**
 * On click function for album dropdown click
 * @param albumId
 */
mapkeep.FormManager.prototype.albumPrepend = function(albumId) {
  var group = this.curForm.find('span[value=' + albumId + ']');
  if (!group.length) {
    // Append label if it doesn't exist and is not hidden
    $('#album-button').before(this.makeLabelGroup({
      id: albumId,
      title: this.albums[albumId]
    }, true));
  } else {
    // Otherwise just unhide the label
    group.removeClass('hide');
  }
};

/**
 * Creates html for album label creation and deletion
 * and displays albums the note belongs to
 * @param note
 * @returns {*|jQuery}
 */
mapkeep.FormManager.prototype.createAlbumHtml = function(note) {
  var albumHtml = $('<div/>');

  // Add label groups for albums the note belongs in currently
  if (note && note.albums.length > 0) {
    for (var i = 0; i < note.albums.length; i++) {
      albumHtml.append(this.makeLabelGroup(note.albums[i]));
    }
  }

  // Create dropdown button and list
  var clz = note ? 'hide' : 'button';
  var dropDownButton = $('<button/>')
    .addClass('secondary tiny dropdown ' + clz)
    .attr('id', 'album-button')
    .attr('data-dropdown', 'album-dropdown')
    .attr('aria-controls', 'album-dropdown')
    .attr('aria-expanded', 'false')
    .attr('type', 'button')
    .attr('href', '#')
    .html('+ Album');
  albumHtml.append(dropDownButton);
  albumHtml.append(this.createAlbumDropDown());

  return albumHtml;
};

/**
 * Creates dropdown of all the user's current albums
 * Re-uses dropdown since it will never change functionality
 * @returns {*|jQuery}
 */
mapkeep.FormManager.prototype.createAlbumDropDown = function() {
  if (!this.dropDown) {
    this.dropDown = ($('<ul data-dropdown-content/>')
      .addClass('f-dropdown')
      .attr('id', 'album-dropdown')
      .attr('aria-hidden', 'true'));

    // Add links that represent the user's albums
    // On click it adds a label group
    for (var id in this.albums) {
      if (this.albums.hasOwnProperty(id)) {
        var link = $('<a/>')
          .attr('href', '#')
          .attr('value', id)
          .html(this.albums[id]);
        this.dropDown.append($('<li/>').append(link));
      }
    }
  }

  return this.dropDown.clone();
};

/**
 * Removes any album labels not in albumIds input
 * which correspond to labels added but not *saved*
 */
mapkeep.FormManager.prototype.removeAlbumLabels = function() {
  this.curForm.find('.group').removeClass('hide');

  var albumIds = this.curForm.find(
    'input[name=note\\[album_ids\\]\\[\\]]').val().split(',');
  var albumLabels = this.curForm.find('.group');
  for (var i = 0; i < albumLabels.length; i++) {
    if (albumIds.indexOf($(albumLabels[i]).attr('value')) < 0) {
      $(albumLabels[i]).remove();
    }
  }
};

/**
 * Creates a label group:
 *    - the album name label (tagged with album id as value)
 *    - a delete X alert label
 * @param album
 * @param showDelete Whether or not to show the delete button
 * @returns {*|jQuery}
 */
mapkeep.FormManager.prototype.makeLabelGroup = function(album, showDelete) {
  var label = $('<span/>')
    .addClass('label')
    .html(album.title);

  // Hide label on delete, remove on save
  var deleteLabel = $('<span/>').addClass('alert').html('X');
  $('#overlay').on('click', 'span.alert', function() {
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
    .append(deleteLabel)
    .attr('value', album.id);
};

/**
 * Callback for form submission
 * Updates default values to the server response (note)
 * @param note
 */
mapkeep.FormManager.prototype.formSubmitted = function(note) {
  this.resetDefaultValuesTo(note);
  this.makeReadonly();
};

/**
 * Updates form action to "update" vs create
 * @param note
 */
mapkeep.FormManager.prototype.updateFormAction = function(note) {
  // Add method and change action so future submits are updated
  this.curForm.append('<input type="hidden" name="_method" value="patch">');
  this.curForm.attr('action', '/notes/' + note.id);
  this.curForm.removeClass('new_note');
};

/**
 * Resets default values of inputs to fresh values from note
 * @param note
 */
mapkeep.FormManager.prototype.resetDefaultValuesTo = function(note) {
  this.curForm.find('input[name=note\\[title\\]]')
    .prop('defaultValue', note.title);
  this.curForm.find('textarea')
    .prop('defaultValue', note.body);
  this.curForm.find('input[name=latitude]')
    .prop('defaultValue', '' + note.latitude);
  this.curForm.find('input[name=latitude]')
    .prop('defaultValue', '' + note.latitude);
  this.curForm.find('input[name=note\\[album_ids\\]\\[\\]]').remove();
  this.curForm.append(this.hiddenInput(
    'note[album_ids][]', this.albumIdString(note.albums)));
  this.curForm.find('#privateTrue')
    .prop('defaultChecked', note.private);
  this.curForm.find('#privateFalse')
    .prop('defaultChecked', !note.private);
};
