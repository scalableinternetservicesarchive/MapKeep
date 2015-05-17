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
  /** List of all user's albums */
  //this.albums = {};
  this.albumSize = 0;
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
mapkeep.AlbumManager.prototype.init = function(albums) {

  // Index albums by id to name
  this.albumSize = albums.length;

  //for (var i = 0; i < this.albumSize; i++) {
    //this.albums[albums[i].id] = albums[i].title;
  //}

  //var overlay = $('#album-overlay');

  // Change form method to delete before submission (for rails)
  //overlay.on('click', '#delete-button', function() {
  //  overlay.find('input[name=_method]').val('delete');
  //});
  /*overlay.on('click', '#album-cancel-button', function() {
    if (this.curForm.hasClass('new_album')) {
      // Remove hide
      overlay.addClass('hide');
    }
  }.bind(this);

  overlay.on('click', '#cancel-button', function() {
  }.bind(this);
  */
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
      .append(this.createFormButtons());
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
    .attr('name', 'album[title]')
    .attr('placeholder', 'Title')
    .attr('value', 'Album ' + (this.albumSize + 1))
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

mapkeep.AlbumManager.prototype.createFormButtons = function() {
  var holder = $('<div/>')
    .attr('id', 'album-create-buttons');

  var submit = $('<button/>')
    .text('Save')
    .addClass('album button tiny right')
    .attr('id', 'album-submit-create-button')
    .attr('type', 'submit');

  var cancel = $('<button/>')
    .text('Cancel')
    .addClass('album secondary tiny right')
    //.attr('type', 'button')
    .attr('id', 'album-cancel-button');

  return holder
    .append(submit)
    .append(cancel);
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
  overlay.find('#albumView').remove();
  overlay.append(this.curForm).removeClass('hide');

  this.submitForm();
  this.closeForm();

  // Initialize foundation components
  $(document).foundation();
};

// Submit the form creation.
mapkeep.AlbumManager.prototype.submitForm = function() {
  $('#album-overlay')
    .off('click', '#album-submit-create-button')
    .on('click', '#album-submit-create-button', function() {
      this.albumSize++;
      overlay.append(this.curForm).addClass('hide');
    }.bind(this));
};

mapkeep.AlbumManager.prototype.closeForm = function() {
  overlay = $('#album-overlay');
  overlay
    //.off('click', '#album-cancel-button')
    .on('click', '#album-cancel-button', function() {
      // Remove the form
      overlay.find('#albumView').remove();
      overlay.append(this.curForm).addClass('hide');
    }.bind(this));
};

mapkeep.AlbumManager.prototype.addAlbum = function() {
  var href = 'albums/32';
  var title = 'My Title';
  var htmlAlbum = '<li><a href="' + href + '">' + title + '</a></li>';

  var album = $('#side-albums.side-nav')
    .append(htmlAlbum);
};
