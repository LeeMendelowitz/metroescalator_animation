var get_units_by_status_date = function(date_index, status) {
  var my_date = outage_data.dates[date_index];
  var unit_index = outage_data.category_by_date[status];
  unit_index = unit_index  && unit_index[date_index];

  // For each unit, convert it to a dictionary
  
  var units = unit_index.map(function(ind) {
    return outage_data.units[ind];
  });

  return units;
};