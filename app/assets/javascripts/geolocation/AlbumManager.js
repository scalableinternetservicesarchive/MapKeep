var mapkeep = mapkeep || {};

/**
 * A form helper for form creation and dom manipulation
 * @param app Mapkeep app, map manipulation
 * @param auth
 * @constructor
 */
mapkeep.AlbumManager = function(formMan, auth) {
  // A copy of the form manager.
  this.formManager = formMan;
  // Counter for form identification
  this.formNum = 0;
  // All forms created so far
  this.forms = {};
  // Album info for title naming
  this.curAlbumId = 0;
  // Current opened form
  this.curForm = null;
  // For valid form submission
  this.authToken = auth;
};

/**
 * Initial set up: album size used for album title
 * @param albums - All of the user's albums
 */
mapkeep.AlbumManager.prototype.init = function(albums) {
  // Index albums by id to name
  if (albums.length > 0) {
    this.curAlbumId = albums[albums.length-1].id + 1;
  } else {
    this.curAlbumId = 1;
  }
};

/**
 * Set up the html for the album creation form, giving the
 * title and description inputs with Save and Cancel buttons.
 */
mapkeep.AlbumManager.prototype.createAlbumView = function() {
  // Create the html for the form of the album
  var holder = $('<form/>');
  holder
    .attr('id', 'albumView')
    .append(this.createAlbumGroup())
    .addClass('new_album')
    .attr('action', '/albums')
    .attr('method', 'post')
    .attr('data-remote', 'true')
    .attr('accept-charset', 'UTF-8')
    .append(this.formManager.hiddenInput('authenticity_token', this.authToken))
    .append(this.formManager.hiddenInput('form_id', this.formNum))
    .append(this.createFormButtons());

  // Save form for manipulation
  this.forms[this.formNum] = holder;

  return this.formNum++;
};

/**
 * Specifies the html for the title and description,
 * which are always shown and each required.
 */
mapkeep.AlbumManager.prototype.createAlbumGroup = function() {
  var title = $('<input/>')
    .attr('name', 'album[title]')
    .attr('id', 'albumtitle')
    .attr('value', 'Album ' + this.curAlbumId)
    .attr('type', 'text');

  var textarea = $('<textarea/>')
    .attr('name', 'album[description]')
    .attr('id', 'albumdes')
    .attr('rows', '3')
    .attr('placeholder', 'Description of the album!')
    .text('');

  return $('<div/>')
    .attr('id', 'album-box')
    .append(title)
    .append('<br/>')
    .append(textarea);
};

/**
 * Specifies the html for the Save and Cancel buttons,
 * which are always shown
 */
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
    .attr('id', 'album-cancel-button');

  return holder
    .append(submit)
    .append(cancel);
};

/**
 * Close last form and open new one as well as info window with title
 * @param formNum - used as a form identifier
 */
mapkeep.AlbumManager.prototype.showForm = function(formNum) {
  var overlay = $('#album-overlay');
  this.curForm = this.forms[formNum];

  // Remove previous form
  overlay.find('#albumView').remove();
  // Show specified form
  overlay.append(this.curForm).removeClass('hide');

  this.submitForm();
  this.closeForm();

  // Initialize foundation components
  $(document).foundation();
};

/**
 * Adds to the album size and hides overlay upon clicking submit
 * Ensures that the title and description always have some value
 */
mapkeep.AlbumManager.prototype.submitForm = function() {
  $('#album-submit-create-button')
    .click(function() {
      // Ensure that album and description fields are supplied.
      if ($('#albumtitle').val().length == 0) {
        $('#albumtitle').val('Album ' + this.curAlbumId);
      }
      if ($('#albumdes').val().length == 0) {
        $('#albumdes').text('None');
      }

      this.curAlbumId++;
      // Remove the form from view
      $('#album-overlay').append(this.curForm).addClass('hide');
    }.bind(this));
};

/**
 * Removes div and hides overlay upon clicking cancel
 */
mapkeep.AlbumManager.prototype.closeForm = function() {
  var overlay = $('#album-overlay');
  $('#album-cancel-button')
    .click(function() {
      // Remove the form and hide from view
      overlay.find('#albumView').remove();
      overlay.addClass('hide');
    }.bind(this));
};

/**
 * The sidebar callback to display new album after saving
 * @param album - the object containing the new album
 */
mapkeep.AlbumManager.prototype.addAlbum = function(album) {
  var href = '/albums/' + album.id;
  var title = album.title;
  var htmlAlbum = '<li><a href="' + href + '">' + title + '</a></li>';

  // Find the album tab of sidebar and append new album to the end
  var album = $('#side-albums.side-nav')
    .append(htmlAlbum);
};
