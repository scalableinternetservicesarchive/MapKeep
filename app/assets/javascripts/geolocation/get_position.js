function getPosInit() {
  navigator.geolocation.getCurrentPosition(
    function (pos) {
      MAPKEEP.initMap(pos.coords);
    },
    function (err) {
      alert("Couldn't receive location!");
      MAPKEEP.initMap();
    }
  );
}
