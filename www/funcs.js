// var get_units_by_status_date = function(date_index, status) {
//   var my_date = outage_data.dates[date_index];
//   var unit_index = outage_data.category_by_date[status];
//   unit_index = unit_index  && unit_index[date_index];

//   // For each unit, convert it to a dictionary
  
//   var units = unit_index.map(function(ind) {
//     return outage_data.units[ind];
//   });

//   return units;
// };

var STATUS_KEYS = ['BROKEN', 'INSPECTION', 'REHAB', 'OFF'];

var hydrate_units = function(data) {
  var u = data.units;
  var u_names = data.units_slots;
  var hyrdated_units = u.map(function(v, unit_index) {
    var ret = {};
    for(var i = 0; i < v.length; i++) {
      ret[u_names[i]] = v[i];
    }
    ret["unit_index"] = unit_index;
    return ret;
  });

  var break_counts = compute_broken_count(data);
  break_counts.map(function(count, ind) {
    hyrdated_units[ind]['break_count'] = count;
  });

  console.log("Preprocessing....", new Date());
  assign_unit_category_to_dates(hyrdated_units, data.category_by_date);
  assign_streaks_to_units(hyrdated_units, data.category_by_date);
  console.log("Done.", new Date());

  return hyrdated_units;
};


var compute_broken_count = function(data) {
  var ret = Array(data.units.length).fill(0);
  var break_by_dates = data.category_by_date["BROKEN"];
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
};

var assign_unit_category_to_dates = function(units, category_by_date) {

  var categories = Object.keys(category_by_date);


  // Create a category to dates for each unit
  units.forEach(function(unit) {
    var val = {};
    categories.forEach(function(category) {
      val[category] = [];
    });
    unit['category_to_dates'] = val;
  });

  // Populate the unit to statuses for each unit
  categories.forEach(function(category) {
    var units_by_date = category_by_date[category];
    units_by_date.forEach(function(unit_index, date_index) {
      unit_index.forEach(function(unit_ind) {
        units[unit_ind]['category_to_dates'][category].push(date_index);
      });
    });
  });

  // Determine the first observation for each unit
  units.forEach(function(unit) {
    var min_obs = undefined;
    categories.forEach(function(category) {
      var cat_dates = unit.category_to_dates[category];
      if (cat_dates.length == 0) {
        return;
      }
      if ((min_obs === undefined) || (cat_dates[0] < min_obs)) {
        min_obs = cat_dates[0];
      }
      unit['first_observed_date'] = min_obs;
    });
  });


};


// Determine how many consecutive days each unit has had the same status
// with regards to a category on a date_index.
// For example, for category === "BROKEN" and date_index = 100,
// For units that are broken, determine how many consecutive days that have been broken for on 100.
// For unites that are working, determine how many consecutive days that they have been working for on 100.
var assign_streaks_to_units = function(units, category_by_date) {

  var categories = Object.keys(category_by_date);
  var n_dates = category_by_date[categories[0]].length;

  // Create a category to dates for each unit
  units.forEach(function(unit) {

    var cat_to_streak = {};
    var cat_to_dates = unit['category_to_dates'];
    categories.forEach(function(category) {

      var active_dates = cat_to_dates[category];
      var date_indicator = Array(n_dates).fill(0);

      active_dates.forEach(function(date_ind) {
        date_indicator[date_ind]=1;
      });

      var streak = Array(n_dates).fill(0);
      var i = unit.first_observed_date;
      streak[unit.first_observed_date] = 1;
      for(i = unit.first_observed_date + 1; i < streak.length; i++) {
        if(date_indicator[i] === date_indicator[i-1]) {
          streak[i] = streak[i-1] + 1;
        } else {
          streak[i] = 1;
        }
      }

      cat_to_streak[category] = streak;

    });

    unit['category_to_streaks'] = cat_to_streak;
  });



};

