class IndexController < ApplicationController
  include Geokit::Geocoders

  def index
    # TODO: find by proximity to location as well
    user_notes = current_user.nil? ? [] : current_user.notes - %w(user_id latlon)
    public_notes = Note.where(private: false).all
    @notes = { :user_notes => user_notes, :public_notes => public_notes }
    if request.remote_ip == '127.0.0.1'
      @location = MultiGeocoder.geocode('75.82.170.180')
    else
      @location = MultiGeocoder.geocode(request.remote_ip)
    end
  end
end
