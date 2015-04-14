var lat = document.getElementById('note_latitude');
var lng = document.getElementById('note_longitude');
navigator.geolocation.getCurrentPosition(function(pos) {
    var coords = pos.coords;
    lat.value = coords.latitude;
    lng.value = coords.longitude;
});