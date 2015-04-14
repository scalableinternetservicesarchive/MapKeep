navigator.geolocation.getCurrentPosition(function(pos) {
    var coords = pos.coords;
    var lat = document.getElementById('note_latitude');
    var lng = document.getElementById('note_longitude');
    lat.value = coords.latitude;
    lng.value = coords.longitude;
});