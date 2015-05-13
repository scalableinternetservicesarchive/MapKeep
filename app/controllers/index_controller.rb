class IndexController < ApplicationController
  include Geokit::Geocoders

  def index
    if request.remote_ip == '127.0.0.1'
      @location = MultiGeocoder.geocode('75.82.170.180')
    else
      @location = MultiGeocoder.geocode(request.remote_ip)
    end

    @notes = Note.find_by_proximity(@location, current_user)
  end

  def update_notes
    bounds = {
        ne: { lat: params['ne_lat'].to_f, lng: params['ne_lng'].to_f },
        sw: { lat: params['sw_lat'].to_f, lng: params['sw_lng'].to_f }
    }
    notes = Note.find_by_proximity(nil, current_user, bounds)
    respond_to do |format|
      format.json { render json: notes, status: :ok }
    end
  end
end
