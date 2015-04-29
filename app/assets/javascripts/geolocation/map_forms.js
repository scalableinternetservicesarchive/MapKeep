var mapkeep = mapkeep || {};

/**
 * Inits a form helper for form creation and dom manipulation
 * @param app Mapkeep app, map manipulation
 * @param albums For listing in the form
 */
mapkeep.formHelper = function(app, albums) {
  this.formNum = 0;
  this.forms = {};
  this.albums = albums;
  /** @type mapkeep.app */
  this.app = app;
};

/**
 * Creates a hidden input with corresponding name and value
 * @param name
 * @param value
 * @returns {*|jQuery}
 */
mapkeep.formHelper.prototype.hiddenInput = function(name, value) {
  return $('<input/>')
    .attr('name', name)
    .attr('type', 'hidden')
    .val(value);
};

/**
 * Creates a form for a note that is tied to a marker
 * @param marker The note belongs to for coordinates
 * @param readonly Whether or not this is a new note
 * @param note Note to use title and body for if existing
 * @returns {*|jQuery}
 */
mapkeep.formHelper.prototype.createNoteForm =
  function(marker, readonly, note) {
    var overlay = $('#overlay');

    var title = $('<input/>')
      .attr('name', 'note[title]')
      .attr('placeholder', 'Title')
      .attr('value', readonly ? note.title : '')
      .attr('type', 'text');

    // Sync title input with info window title
    overlay.on('keyup', 'input[name=note\\[title\\]]', function() {
      this.app.curWindow.setContent(
        overlay.find('input[name=note\\[title\\]]').val());
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
      .attr('type', 'submit');

    // Change form method to delete before submission (for rails)
    overlay.on('click', 'button.alert', function() {
      form.find('input[name=_method]').val('delete');
    });

    var textarea = $('<textarea/>')
      .attr('name', 'note[body]')
      .attr('rows', '10')
      .attr('placeholder', 'Write anything you want about this location!')
      .text(readonly ? note.body : '');

    // Get and set album ids input
    var albumIds = '';
    if (readonly) {
      for (var i = 0; i < note.albums.length; i++) {
        albumIds += note.albums[i].id + ', ';
      }
    }

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
      .append(this.hiddenInput('note[latitude]', marker.position.lat()))
      .append(this.hiddenInput('note[longitude]', marker.position.lng()))
      .append(this.hiddenInput('authenticity_token', this.authToken))
      .append(this.hiddenInput('form_id', this.formNum))
      .append(this.hiddenInput('note[album_ids][]', albumIds))
      .append(submit)
      .append(deleteButton);

    if (readonly) {
      textarea.attr('readonly', 'readonly');
      title.attr('readonly', 'readonly');
      form.append(this.hiddenInput('_method', 'patch'));
      this.addEditClick(this.formNum);
    }

    // Save marker and form for deletion
    this.app.markers[this.formNum] = marker;
    this.forms[this.formNum] = form;

    // Update coords on pin drag
    // TODO: make dragging only possible on new notes and notes in edit mode
    var formNum = this.formNum;
    google.maps.event.addListener(marker, 'dragend', function() {
      var form = this.forms[formNum];
      form.find('input[name=note\\[latitude\\]]').val(marker.position.lat());
      form.find('input[name=note\\[longitude\\]]').val(marker.position.lng());
    }.bind(this));

    this.app.addMarkerListener(marker, this.formNum++);
    return formNum;
  };

/**
 * Creates a label group:
 *    - the album name label (tagged with album id as value)
 *    - a delete X alert label
 * @param album For title and id
 * @param showDelete Whether or not to show the delete button
 * @returns {*|jQuery}
 */
mapkeep.formHelper.prototype.makeLabelGroup = function(album, showDelete) {
  var label = $('<span/>')
    .addClass('label')
    .html(album.title)
    .attr('value', album.id);

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
    .append(deleteLabel);
};

/**
 * On click function for album dropdown click
 * @param album
 * @param albumHtml
 * @param dropDownButton
 * @returns {Function}
 */
mapkeep.formHelper.prototype.albumPrepend =
  function(album, albumHtml, dropDownButton) {
    return function() {
      // append label if it doesn't exist and is not hidden
      // otherwise just unhide the label
      var labels = albumHtml.find('span[value=' + album.id + ']');
      if (!labels.length) {
        dropDownButton.before(this.makeLabelGroup(album, true));
      } else if (labels.parent().hasClass('hide')) {
        labels.parent().removeClass('hide');
      }
    }.bind(this);
  };

/**
 * Creates html for album label creation and deletion
 * and displays albums the note belongs to
 * @param note
 * @param readonly
 * @returns {*|jQuery}
 */
mapkeep.formHelper.prototype.createAlbumHtml = function(note, readonly) {
  var albumHtml = $('<div/>').html('Albums: ');
  var dropDownId = getDropDownId(this.formNum);
  var dropDown = ($('<ul data-dropdown-content/>')
    .addClass('f-dropdown')
    .attr('id', dropDownId)
    .attr('aria-hidden', 'true'));

  // Add label groups for albums the note belongs in
  if (note) {
    for (var i = 0; i < note.albums.length; i++) {
      var album = note.albums[i];
      albumHtml.append(this.makeLabelGroup(album));
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
      .click(this.albumPrepend(album, albumHtml, dropDownButton));
    dropDown.append($('<li/>').append(link));
  }

  albumHtml.append(dropDownButton);
  albumHtml.append(dropDown);

  return albumHtml;
};

/**
 * Makes the form readonly
 * @param formNum
 */
mapkeep.formHelper.prototype.makeReadonly = function(formNum) {
  var form = this.forms[formNum];

  // Make fields readonly
  form.find('input[name=note\\[title\\]]')
    .attr('readonly', 'readonly')
    .css('background', 'none');

  form.find('textarea')
    .attr('readonly', 'readonly');

  // Prevent submit and change button text to 'Edit'
  this.addEditClick(formNum);
  form.find('button').not('.alert').not('.secondary').text('Edit');

  // hide delete and dropdown button
  form.find('button.alert, button.dropdown')
    .addClass('hide')
    .removeClass('button');

  // hide album delete labels
  form.find('span.alert')
    .addClass('hide')
    .removeClass('label');
};

/**
 * Makes form editable
 * @param formNum
 */
mapkeep.formHelper.prototype.makeEditable = function(formNum) {
  var form = this.forms[formNum];

  // Make fields editable
  form.find('input[name=note\\[title\\]]')
    .removeAttr('readonly');

  form.find('textarea')
    .removeAttr('readonly');

  // Remove submit blocking, change text to 'Save'
  $('#map-canvas').off('click', getButtonId(formNum));
  form.find('button').not('.alert').not('.secondary').text('Save');

  // show delete and dropdown button
  form.find('button.alert, button.dropdown')
    .removeClass('hide')
    .addClass('button');

  // show album delete labels
  form.find('span.alert')
    .removeClass('hide')
    .addClass('label');
};

/**
 * Clicking edit toggles the form on and prevents form submission
 * @param formNum To add click function to (button inside)
 */
mapkeep.formHelper.prototype.addEditClick = function(formNum) {
  $('#map-canvas').on('click', getButtonId(formNum), function() {
    this.makeEditable(formNum);
    return false;
  }.bind(this));
};

/**
 * Close last form and open new one as well as info window with title
 * @param formNum Form identifier
 * @param newNote Whether or not new note
 * @param timeout For info window open
 */
mapkeep.formHelper.prototype.showForm = function(formNum, newNote, timeout) {
  var overlay = $('#overlay');

  // Open info window for note title
  setTimeout(function() {
    this.app.openInfoWindow(
      this.forms[formNum].find('input[name=note\\[title\\]]').val(),
      this.app.markers[formNum]
    );
  }.bind(this), timeout);

  // Remove previous form and show specified form
  overlay.find('form').remove();
  overlay.append(this.forms[formNum]).removeClass('hide');
  overlay.find('.group').removeClass('hide');

  // Remove any albums not in albumIds
  var albumIds = overlay.find(
    'input[name=note\\[album_ids\\]\\[\\]]').val().split(',');
  var albumLabels = overlay.find('.group');
  for (var i = 0; i < albumLabels.length; i++) {
    if (albumIds.indexOf($(albumLabels[i]).find('.label').attr('value')) < 0) {
      $(albumLabels[i]).remove();
    }
  }

  // Force form to be readonly if not a new note
  if (!newNote && !this.forms[formNum].hasClass('new_note')) {
    this.makeReadonly(formNum);
  } else {
    this.makeEditable(formNum);
    this.forms[formNum].find('input[name=note\\[title\\]]').focus();
  }

  $(document).foundation();
};

/**
 * Updates format of form to update (patch) vs create
 * @param formNum
 * @param noteId
 */
mapkeep.formHelper.prototype.formSubmitted = function(formNum, noteId) {
  var form = this.forms[formNum];
  form.append('<input type="hidden" name="_method" value="patch">');
  form.attr('action', '/notes/' + noteId);
  form.removeClass('new_note');
  this.makeReadonly(formNum);
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
