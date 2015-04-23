class IndexController < ApplicationController
  include Geokit::Geocoders

  def index
    @notes = current_user.notes unless current_user.nil?
    if request.remote_ip == '127.0.0.1'
      @location = MultiGeocoder.geocode('131.179.15.65')
    else
      @location = MultiGeocoder.geocode(request.remote_ip)
    end
  end
end
