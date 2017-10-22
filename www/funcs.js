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

var hydrate_units = function(items) {
  var u = items.units;
  var u_names = items.units_slots;
  var hyrdated_units = u.map(function(v, unit_index) {
    var ret = {};
    for(var i = 0; i < v.length; i++) {
      ret[u_names[i]] = v[i];
    }
    ret["unit_index"] = unit_index;
    return ret;
  });

  var break_counts = compute_broken_count(items);
  break_counts.map(function(count, ind) {
    hyrdated_units[ind]['break_count'] = count;
  });

  return hyrdated_units;
};


var compute_broken_count = function(items) {
  var ret = Array(items.units.length).fill(0);
  var break_by_dates = items.category_by_date["BROKEN"];
  break_by_dates.map(function(inds) {
    inds.map(function(i) {
      ret[i] += 1;
    })
  })
  return ret;
};