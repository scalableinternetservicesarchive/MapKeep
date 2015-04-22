require 'test_helper'

class AlbumTest < ActiveSupport::TestCase

  test 'needs non-empty fields' do
    album = albums(:all_fields)

    album.title = ''
    assert album.invalid?

    album.title = 'title'
    album.description = ''
    assert album.invalid?

    album.description = 'desc'
    assert album.valid?
  end

  test 'needs valid user id' do
    album = albums(:all_fields)

    album.user_id = 'user'
    assert album.invalid?

    album.user_id = 1
    assert album.valid?
  end
end
