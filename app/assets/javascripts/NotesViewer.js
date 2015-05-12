var mapkeep = mapkeep || {};

var map = null;

$(document).ready(function() {
  $(document).foundation();

  // Set height the first time. Need to use absolute size to reveal Google Maps
  $('.reveal-modal').css('height', $('html').height() - 120 + 'px'); // 100+20px to keep modal effect visible

  function initialize() {
    var center = this.userLoc ?
      new google.maps.LatLng(this.userLoc.lat(), this.userLoc.lng()) :
      new google.maps.LatLng(34.0722, -118.4441);

    var mapOptions = {
      zoom: 8,
      center: new google.maps.LatLng(-34.397, 150.644)
    };
    map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
  }

  google.maps.event.addDomListener(window, 'load', initialize);
});

$(window).resize(function() {
  // Reset max-height after window resize. Need to use absolute size to reveal Google Maps
  $('.reveal-modal').css('height', $('html').height() - 120 + 'px');
});

var note = null;
var albums = null;
var app = null;

$("#editModalLauncher").click(function () {
  $('#editModal').foundation('reveal', 'open');
  note = $(this).data('note');
  albums = $(this).data('albums');

  /*
  //TODO: move session token to html page
  app = new mapkeep.App('<%= session[:_csrf_token] %>');
  google.maps.event.addDomListener(window, 'load', function() {
    app.init({lat: note.latitude, lng: note.longitude}, [note], albums);
  });
  */
});


$('#editModal').bind('opened.fndtn.reveal', function() {
  google.maps.event.trigger(map, 'resize');
});

$('#editModal').on('opened.fndtn.reveal', function() {

});