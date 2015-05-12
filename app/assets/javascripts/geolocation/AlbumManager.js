var mapkeep = mapkeep || {};

/**
 * A form helper for form creation and dom manipulation
 * @param app Mapkeep app, map manipulation
 * @param auth
 * @constructor
 */
mapkeep.AlbumManager = function(app, auth) {
  /** Counter for form identification */
  this.formNum = 0;
  /** All forms and views created so far */
  this.forms = {};
  this.views = {};
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
mapkeep.AlbumManager.prototype.init = function() {

  var overlay = $('#album-overlay');

  // Change form method to delete before submission (for rails)
  //overlay.on('click', '#delete-button', function() {
  //  overlay.find('input[name=_method]').val('delete');
  //});

};

/**
 * Whether current form is editable or not
 * @returns {boolean}
 */
mapkeep.AlbumManager.prototype.isEditable = function() {
  var overlay = $('#album-overlay');
  return overlay.find('input[readonly]').length === 0 &&
    !overlay.hasClass('hide');
};

mapkeep.AlbumManager.prototype.hiddenInput = function(name, value) {
  return $('<input/>')
    .attr('name', name)
    .attr('type', 'hidden')
    .val(value);
};

mapkeep.AlbumManager.prototype.createAlbumView = function() {
  var holder = $('<form/>');
  holder
    .attr('id', 'albumView')
    .append(this.createAlbumGroup());

  //if (!nonUser) {
    // add form attributes and hidden inputs
    holder
      .addClass('new_album')
      .attr('action', '/albums')
      .attr('method', 'post')
      .attr('data-remote', 'true')
      .attr('accept-charset', 'UTF-8')
      .append(this.hiddenInput('authenticity_token', this.authToken))
      .append(this.hiddenInput('form_id', this.formNum))
      .append(this.createFormButtons(false));
  //}

  //if (album) {
  //  holder.find('input, textarea').attr('readonly', 'readonly');
  //}

  // Save marker and form for deletion / manipulation
//    if (nonUser) {
//      this.views[this.formNum] = holder;
//    } else {
      this.forms[this.formNum] = holder;
//    }

//    this.app.addMarkerListener(this.formNum);
  return this.formNum++;
};

mapkeep.AlbumManager.prototype.createAlbumGroup = function(note) {
  var title = $('<input/>')
    .attr('name', 'album[name]')
    .attr('placeholder', 'Title')
    .attr('value', 'Album ' + (this.formNum + 1))
    .attr('type', 'text');

  var textarea = $('<textarea/>')
    .attr('name', 'album[description]')
    .attr('id', 'albumdes')
    .attr('rows', '3')
    .attr('placeholder', 'Description of the album!')
    .text('');

  //later album[note_ids] with value = "#"

  return $('<div/>')
    .attr('id', 'album-box')
    .append(title)
    .append('<br/>')
    .append(textarea);
};

mapkeep.AlbumManager.prototype.createFormButtons = function(readonly) {
  var holder = $('<div/>');

  var submit = $('<button/>')
    .text(readonly ? 'Edit' : 'Save')
    .addClass('album button tiny right')
    .attr('id', 'submit-edit-button')
    .attr('type', 'submit');

  var deleteButton = $('<button/>')
    .text('Delete')
    .addClass('album alert tiny right hide')
    .attr('type', 'submit')
    .attr('id', 'delete-button');

  var cancelButton = $('<button/>')
    .text('Cancel')
    .addClass('album secondary tiny right hide')
    .attr('type', 'button')
    .attr('id', 'cancel-button');

  return holder
    .append(submit)
    .append(deleteButton)
    .append(cancelButton);
};

/**
 * Close last form and open new one as well as info window with title
 * @param formNum Form identifier
 * @param timeout For info window open
 */
mapkeep.AlbumManager.prototype.showForm = function(formNum) {
  var overlay = $('#album-overlay');
  //var nonUser = this.forms[formNum] ? false : true;
  this.curForm = this.forms[formNum]; //nonUser ? this.views[formNum] : this.forms[formNum];

  // Remove previous form and show specified form
  overlay.find('#noteView').remove();
  overlay.append(this.curForm).removeClass('hide');

  // Initialize foundation components
  $(document).foundation();
};