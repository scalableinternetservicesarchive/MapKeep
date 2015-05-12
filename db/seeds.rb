# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the rake db:seed (or created alongside the db with db:setup).
#
# Examples:
#
#   cities = City.create([{ name: 'Chicago' }, { name: 'Copenhagen' }])
#   Mayor.create(name: 'Emanuel', city: cities.first)

num_users = 		50
num_notes = 		500
num_albums = 		10
notes_per_album = 	20

ActiveRecord::Base.transaction do
	num_users.times do |n|
		user = User.new({
			email: "example_#{n+1}@example.com",
			password: 'password',
			password_confirmation: 'password'
			})
		user.save
		
		num_notes.times do
			Note.create(
				title: Faker::Lorem.sentence,
				body: Faker::Lorem.paragraph,
				user_id: user.id,
				latitude: Faker::Address.latitude,
				longitude: Faker::Address.longitude
				)
		end
		
		num_albums.times do
			Album.create(
				title: Faker::Lorem.sentence,
				description: Faker::Lorem.paragraph,
				user_id: user.id
				)
		end
	end
end

ActiveRecord::Base.transaction do
	User.all.each do |user|
		notes = Note.where(user_id: user.id)
		albums = Album.where(user_id: user.id)
		albums.each do |album|
			notes.sample(notes_per_album).each do |note|
				Collection.create(
					album_id: album.id,
					note_id: note.id
					)
			end
		end
	end
end