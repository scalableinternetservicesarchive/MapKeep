# Miscellaneous notes

## Timing of seeding data
In trying to seed data for our application, the seed data is mildy important
metric in terms of how efficiently we can insert data into the system in bulk.

One simple way to speed up the data is to use ActiveRecord::Base.transactions to
prevent each insert to become its own transaction. This leads to mild speed ups,
which makes this data bearable enough for deployment by adding a few minutes.

Below are results from Benchmark.measure.

Results from inserting User, Notes, and Albums
 44.490000   2.380000  46.870000 ( 61.196182)
 41.350000   1.010000  42.360000 ( 49.805789)

 Results from making associations between Albums and Notes
 11.520000   0.840000  12.360000 ( 18.974681)
  8.760000   0.510000   9.270000 ( 10.904103)