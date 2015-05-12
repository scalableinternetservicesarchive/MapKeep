class IndexController < ApplicationController
  include Geokit::Geocoders

  def index
    if request.remote_ip == '127.0.0.1'
      @location = MultiGeocoder.geocode('75.82.170.180')
    else
      @location = MultiGeocoder.geocode(request.remote_ip)
    end

    @notes = Note.find_by_proximity(@location, 1, current_user)
  end
end
