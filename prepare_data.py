#!/usr/bin/env python3
# File: prepare_data.py
# Date: 2017/10/09
#
# Read in .csv files exported from the DC MetroMetrics data page
# Prepare a json file with information about which units match which status category by date.
#################################################################################################

import pandas as pd 
from datetime import datetime, date, timedelta
import itertools
import json


# Read in the units
units = pd.read_csv('dcmetrometrics/units.csv')
units = units.sort_values('unit_id').reset_index(drop=True).reset_index().\
  rename(columns = {'index' : 'unit_index'})
statuses = pd.read_csv('dcmetrometrics/unit_statuses.csv')
statuses = pd.merge(statuses, units[['unit_id', 'unit_index']], on = 'unit_id')
stations = pd.read_csv('dcmetrometrics/stations.csv').fillna("")

statuses.loc[:,'time'] = pd.to_datetime(statuses.time)
statuses.loc[:,'end_time'] = pd.to_datetime(statuses.end_time)

# Fix some missing end_time's.
g = statuses.sort_values(['unit_id', 'time']).\
  groupby('unit_id')

statuses['start_time_next'] = g['time'].shift(-1)
statuses = statuses.sort_values(['unit_id', 'time'])
statuses.loc[statuses.end_time.isnull(),'end_time'] = statuses.loc[statuses.end_time.isnull(),'start_time_next']

num_units = len(statuses['unit_id'].unique())
assert(statuses.end_time.isnull().sum() == num_units)

# Fill intoday as the end_time of the most recent status
statuses.loc[statuses.end_time.isnull(),'end_time'] = datetime.now()


# Assign dates
statuses.loc[:,'start_date'] = statuses.time.dt.date
statuses.loc[:,'end_date'] = statuses.end_time.dt.date

# Look for instances of a 12 hour gap between statuses. Ignore these dates as part of the visualization.
statuses_time_sort = statuses.sort_values('time')
statuses_time_sort.loc[:,'time_next'] = statuses_time_sort.time.shift(-1)
statuses_time_sort['delta'] = statuses_time_sort.time_next - statuses_time_sort.time

ind_gap = statuses_time_sort.delta > timedelta(hours = 12)
gaps = statuses_time_sort[ind_gap]

def gen_dates(start_date, end_date):
  d = start_date
  while d <= end_date:
    yield d
    d = d + timedelta(days = 1)

gap_dates = [d for (i, r) in gaps.iterrows() \
  for d in gen_dates(r.start_date, r.end_date)]

gap_dates = sorted(list(set(gap_dates)))

first_date = statuses.start_date.min()
last_date = statuses.end_date.max()


# Take each unique day/unit/category
status_category = statuses[['unit_index', 'symptom_category', 'start_date', 'end_date']].\
  sort_values(['unit_index', 'start_date']).\
  drop_duplicates()
status_category = status_category[status_category.symptom_category != "ON"].copy()

def row_to_dates(row):
  dates = list(gen_dates(row.start_date, row.end_date))
  ret = pd.DataFrame({'dates' : dates})
  ret['unit_index'] = row.unit_index
  ret['symptom_category'] = row.symptom_category
  return ret

categories = status_category.symptom_category.unique()
dates = list(gen_dates(first_date, last_date))

def get_units_with_date(d, my_date):
  ind = (d.start_date <= my_date) & \
        (d.end_date >= my_date)
  units = sorted([int(v) for v in d.unit_index[ind].unique()])
  return(units)

def build_units_with_category_by_date(category, dates):
  d = status_category[status_category.symptom_category == category].copy()
  units_by_date = [get_units_with_date(d, my_date) for my_date in dates]
  return units_by_date

#########################################################
# Build the json output
json_out = {}
json_out['dates'] = dates
category_by_date = {}
for category in categories:
  print("Working on category %s"%category)
  start_time = datetime.now()
  units_by_date = build_units_with_category_by_date(category, dates)
  category_by_date[category] = units_by_date
  end_time = datetime.now()
  print("Done on category %s. %.2f elapsed"%(category, (end_time - start_time).total_seconds()))
json_out['category_by_date'] = category_by_date

unit_tuples = list(tuple(v) for v in units.drop('unit_index', axis=1).itertuples(index = False))
json_out['units'] = unit_tuples
json_out['units_slots'] = list(units.drop('unit_index', axis=1).columns)

station_tuples = list(tuple(v) for v in stations.itertuples(index = False))
json_out['stations'] = station_tuples
json_out['stations_slots'] = list(stations.columns)

def json_date_serializer(obj):
    """JSON serializer for objects not serializable by default json code"""

    if isinstance(obj, (date)):
        return obj.strftime("%Y-%m-%d")
    raise TypeError ("Type %s not serializable" % type(obj))

with open('unit_by_date.json', 'w') as fout:
  json.dump(json_out, fout, default = json_date_serializer)
