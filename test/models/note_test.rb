require 'test_helper'

class NoteTest < ActiveSupport::TestCase

  test 'coordinates must be numbers' do
    note = notes(:all_fields)

    note.latitude = 'lat'
    note.longitude = 'lng'
    assert note.invalid?

    note.latitude = 123.123
    assert note.invalid?

    note.longitude = 123.123
    assert note.valid?
  end

  test 'needs valid user id' do
    note = notes(:all_fields)

    note.user_id = nil
    assert note.invalid?

    note.user_id = 'user'
    assert note.invalid?

    note.user_id = 1
    assert note.valid?
  end

  test 'note needs non-empty fields' do
    note = notes(:all_fields)

    note.title = ''
    assert note.invalid?

    note.title = 'title'
    note.body = ''
    assert note.invalid?

    note.body = 'body'
    assert note.valid?
  end
end
