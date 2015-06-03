class Note < ActiveRecord::Base
  include Geokit::Geocoders

  belongs_to :user
  has_many :collections, :dependent => :destroy
  has_many :albums, :through => :collections

  has_many :stars, :dependent => :destroy
  has_many :users, :through => :stars

  before_save :set_point
  before_update :set_point

  validates :title, :body, :user_id, presence: true
  validates :latitude, :longitude, :user_id, numericality: true

  # Finds all public and user's notes close to location to certain degree
  scope :find_by_proximity,
        lambda { |location, current_user, bounds = nil|
          if bounds.nil?
            linestring_text = get_linestring__by_loc(location)
            pub_notes = []
          else
            linestring_text = get_linestring_by_bounds(bounds)
            pub_notes = Note.find_by_sql("
            SELECT id, latitude, longitude, user_id
            FROM notes
            WHERE
              private=false AND user_id!=#{current_user.id} AND
              MBRContains(GeomFromText( '#{linestring_text}' ), notes.latlon)
            ORDER BY LEFT(created_at, 10) DESC, star_count DESC LIMIT 30")
          end

          # TODO: prevent double user load on index page
          user_notes = Note.find_by_sql("
            SELECT id, latitude, longitude, user_id
            FROM notes
            WHERE
              user_id=#{current_user.id} AND
              MBRContains(GeomFromText( '#{linestring_text}' ), notes.latlon)")
          # order first by day (not time), then by star count

          user_notes + pub_notes
        }

  # By default, use the GEOS implementation for spatial columns
  self.rgeo_factory_generator = RGeo::Geos.method(:factory)

  # But use a geographic implementation for the :latlon column.
  set_rgeo_factory_for_column(:latlon, RGeo::Geographic.spherical_factory)

  # Uses lat and lng to create and set point within note
  def set_point
    if self.latitude_was != self.latitude || self.longitude_was != self.longitude
      self[:latlon] = RGeo::Geographic.spherical_factory(:srid => 4326)
                          .point(self[:longitude], self[:latitude])
    end
  end

  # Gets text representation of linestring centered around location
  def Note.get_linestring__by_loc(location)
    unless location and location.lng and location.lat
      location = MultiGeocoder.geocode('75.82.170.180')
    end
    "LINESTRING(#{location.lng - 1} #{location.lat - 0.5},
                #{location.lng + 1} #{location.lat + 0.5})"
  end

  # Gets text representation of linestring based on map bounds
  def Note.get_linestring_by_bounds(bounds)
    "LINESTRING(#{bounds[:ne][:lng]} #{bounds[:ne][:lat]},
                #{bounds[:sw][:lng]} #{bounds[:sw][:lat]})"
  end
end
