class RecreateNotesWithSpatialIndex < ActiveRecord::Migration
  def up
    drop_table :notes if table_exists?(:notes)

    create_table :notes, :options => 'ENGINE=MyISAM' do |t|
      t.string :title
      t.text :body
      t.float :latitude, limit: 53, numericality: true
      t.float :longitude, limit: 53, numericality: true
      t.column :latlon, :point, null: false
      t.timestamps null: false
    end

    add_index :notes, :latlon, spatial: true
    add_reference :notes, :user, index: true

    error_message = ActiveRecord::Base.connection.quote('Foreign Key Constraint Violated!')
    sql = <<-SQL
                CREATE TRIGGER insert_note
                BEFORE INSERT
                ON notes
                FOR EACH ROW
                BEGIN
                  IF (SELECT COUNT(*) FROM users WHERE id=new.user_id)=0
                  THEN INSERT error_msg VALUES (#{error_message});
                  END IF;
                END$$
              SQL
    sql.split('$$').each do |stmt|
      execute(stmt) if (stmt.strip! && stmt.length > 0)
    end
  end

  def down
    raise ActiveRecord::IrreversibleMigration
  end
end
