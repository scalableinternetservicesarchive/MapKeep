FactoryGirl.define do
	factory :note do
		title 		'test'
		body		'body'
		latitude	9.9
		longitude	9.9
		user_id		1
	end

	factory :album do
		title		 	'test_album'
		description  	'test_description'
		user_id 		1
	end
end
