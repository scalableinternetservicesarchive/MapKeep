class ChangeBodyFormatInNote < ActiveRecord::Migration
  def up
      change_column :notes, :body, :text
  end

  def down
      change_column :notes, :body, :string
  end
end
