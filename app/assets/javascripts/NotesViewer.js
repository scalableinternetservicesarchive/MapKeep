var mapkeep = mapkeep || {};

//mapkeep.NotesViewer.prototype = new mapkeep.App();

var map = null;

$(document).ready(function() {
  $(document).foundation();

  // Set height the first time. Need to use absolute size to reveal Google Maps
  $('.reveal-modal').css('height', $('html').height() - 120 + 'px'); // 100+20px to keep modal effect visible

  function initialize() {
    var mapOptions = {
      zoom: 10,
      mapTypeControl: false,
      streetViewControl: false,
      center: new google.maps.LatLng(34.0722, -118.4441)  // center at UCLA
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

$("a.reveal-link").click(function () {
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
  var center = (note && note.latitude && note.longitude) ?
    new google.maps.LatLng(note.latitude, note.longitude) :
    new google.maps.LatLng(34.0722, -118.4441);
  map.setCenter(center);
});
