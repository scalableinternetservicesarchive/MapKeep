FactoryGirl.define do
  factory :note do
    title 'test'
    body 'body'
    latitude 9.9
    longitude 9.9
    latlon RGeo::Geographic.spherical_factory(:srid => 4326).point(-118, 34)
    user_id 1
  end

  factory :album do
    title 'test_album'
    description 'test_description'
    user_id 1
  end

  factory :user do
    email 'test@example.com'
    password 'password'
    password_confirmation 'password'
  end
end
