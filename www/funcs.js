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

var units_by_station = function(units) {
  var station_to_units = {};
  var stations = [];
  var i,u;
  var ret;
  for(i = 0; i < units.length; i++) {
    u = units[i];
    if(station_to_units.hasOwnProperty(u.station_name)) {
      station_to_units[u.station_name].push(u);
    } else {
      station_to_units[u.station_name] = [u];
      stations.push(u.station_name);
    }
  }
  stations = stations.sort();
  var ret = stations.map(function(s) {
    return { 
      station: s,
      units: station_to_units[s]
    };
  });
  return ret;
}