# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the rake db:seed (or created alongside the db with db:setup).
#
# Examples:
#
#   cities = City.create([{ name: 'Chicago' }, { name: 'Copenhagen' }])
#   Mayor.create(name: 'Emanuel', city: cities.first)
num_users = 99
num_users.times do |n|
	u = User.new({
		email: "example_#{n+1}@example.com",
		password: 'password',
		password_confirmation: 'password'
		})
	u.save
end

1000.times do |n|
	title = Faker::Lorem.sentence
	body = Faker::Lorem.paragraph
	lat = Faker::Address.latitude
	long = Faker::Address.longitude
	user_id = 1

	Note.create(
		title: title,
		body: body,
		user_id: 1,
		latitude: lat,
		longitude: long
		)
end