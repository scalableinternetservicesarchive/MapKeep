navigator.geolocation.getCurrentPosition(
  function(pos) {
    $('#note_latitude').val(pos.coords.latitude);
    $('#note_longitude').val(pos.coords.longitude);
  },
  function(err) {
    alert("Couldn't receive location!");
  }
);
