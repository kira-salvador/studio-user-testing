//DASHBOARD STARTS HERE:

// current time https://www.shecodes.io/athena/72750-how-to-inject-current-day-and-time-into-html 
function updateTime() {
  var now = new Date();
  var hours = String(now.getHours()).padStart(2, "0"); // Ensures two-digit format
  var minutes = String(now.getMinutes()).padStart(2, "0");

  //document.getElementById("datetime").textContent = `${hours}:${minutes}`;
  document.querySelector(".datetime1").textContent = `${hours}:${minutes}`;
  document.querySelector(".datetime2").textContent = `${hours}:${minutes}`;
}

const mediaThresholds = {
  'DVDs': { min_ta: 18, max_ta: 20, min_rh: 30, max_rh: 50, min_lux: 0, max_lux: 100 },
  'Cassettes': { min_ta: 16, max_ta: 22, min_rh: 35, max_rh: 55, min_lux: 0, max_lux: 150 },
  'Vinyl Records': { min_ta: 16, max_ta: 20, min_rh: 40, max_rh: 50, min_lux: 0, max_lux: 50 }
};

//assign zone to media type
function getMediaType(zone) {
  const zoneMap = { 47: 'DVDs', 48: 'Cassettes', 50: 'Vinyl Records' };
  return zoneMap[zone];
}

let matchingRow =[];
let taMessage = [];
let rhMessage = [];
let luxMessage = [];

let selectedZone = null;

//initially this was inside updateSensorData, however since it wasn't global, i couldn't get the warnings to update depending on the user's input/changes when clicking a button.
//then i also needed to make selectedZone global as it is comparing data from only one zone (selected by the user) 
function checkWarnings(selectedZone) { 
  const mediaType = getMediaType(selectedZone);
  const thresholds = mediaThresholds[mediaType];

  const warningMap = {
    ta: document.querySelector(".taWarning"),
    rh: document.querySelector(".rhWarning"),
    lux: document.querySelector(".luxWarning"),
  };

  const typeLabels = {
    ta: "temperature",
    rh: "humidity",
    lux: "light level"
  };

  const currentValues = {
    ta: parseFloat(document.querySelector(".taValueControl").textContent),
    rh: parseFloat(document.querySelector(".rhValueControl").textContent),
    lux: parseFloat(document.querySelector(".luxValueControl").textContent)
  };

  const textChange = {
    ta: ".taBodyDetailed",
    rh: ".rhBodyDetailed",
    lux: ".luxBodyDetailed",
  }

  const typeUnit = {
    ta: "ºC",
    rh: "%",
    lux: "lx"
  }
  function getStatusMessage(type, value, min, max) { // used copilot to help with warning text logic, but most of it's suggestions were bad lol https://copilot.microsoft.com/shares/BpyXkutUzRGi5TixvcLaX
    const targetDiv = document.querySelector(textChange[type]);

    if (!targetDiv) return;
    
    if (value < min)  {
      warningMap[type].textContent = `Warning: ${typeLabels[type]} is too low`;
      warningMap[type].style.display = 'block';

      targetDiv.textContent = `The recommended ${typeLabels[type]} range for ${mediaType} is ${min}-${max}${typeUnit[type]}. Consider turning up the ${typeLabels[type]} to avoid damage to your ${mediaType}.`;
      
    } else if (value > max) {
      warningMap[type].textContent = `Warning: ${typeLabels[type]} is too high`;
      warningMap[type].style.display = 'block';

      targetDiv.textContent = `The recommended ${typeLabels[type]} range for ${mediaType} is ${min}-${max}${typeUnit[type]}. Consider turning down the ${typeLabels[type]} to avoid damage to your ${mediaType}.`;

      console.log("warningMap type: ", warningMap[type])
      console.log(`${typeLabels[type]} minimum threshold: ${min}, maximum threshold: ${max}`);
      console.log("bruh: ", currentValues[type]);
      
    } else {
      warningMap[type].textContent = '';
      warningMap[type].style.display = 'none';
      targetDiv.textContent = `Your ${mediaType} are being stored in great condition!`;

    }
  }

  getStatusMessage('ta', currentValues.ta, thresholds.min_ta, thresholds.max_ta);
  getStatusMessage('rh', currentValues.rh, thresholds.min_rh, thresholds.max_rh);
  getStatusMessage('lux', currentValues.lux, thresholds.min_lux, thresholds.max_lux);
}

function updateSensorData(zone) {
  selectedZone = zone;
  document.querySelector(".taWarning").textContent = '';
  document.querySelector(".rhWarning").textContent = '';
  document.querySelector(".luxWarning").textContent = '';

  return fetch('samba_data.csv')
      .then(response => response.text())
      .then(text => {
        let rows = text.trim().split("\n").map(row =>
          row.split(",").map(cell => cell.trim())
        );

          // get current system time
          let now = new Date();
          let currentDay = now.getDate();
          let minutes = Math.floor(now.getMinutes() / 5) * 5; // Round down to nearest 5 min
          let currentTime = `${now.getHours().toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`; // HH:MM:00 format

          // filter rows based on selected zone
          let filteredRows = rows.filter(row => parseInt(row[2]) === zone);

          // find matching row for that zone
          let matchingRow = filteredRows.reverse().find(row => {
            console.log("Looking for time:", currentTime, "on day:", currentDay);
            console.log("Checking row:", row);
            console.log("Raw time value:", row[6], "Length:", row[6].length);

        
            return parseInt(row[5]) === currentDay && row[6] === currentTime;
        });

        console.log("Raw values:", {
          ta: matchingRow[7],
          rh: matchingRow[8],
          lux: matchingRow[9],
        });

          // update UI based on selected zone
          if (matchingRow) {
              document.querySelector(".taCurrent").textContent = `${Math.round(matchingRow[7])}°C`;
              document.querySelector(".rhCurrent").textContent = `${matchingRow[8]}%`;
              document.querySelector(".luxCurrent").textContent = `${matchingRow[9]} lx`;

              // mirror value in varControl https://copilot.microsoft.com/shares/ofPVyvRwE8bDEyaRwmP7h 
              document.querySelector(".taValueControl").textContent = `${Math.round(matchingRow[7])}°C`;
              document.querySelector(".rhValueControl").textContent = `${matchingRow[8]}%`;
              document.querySelector(".luxValueControl").textContent = `${matchingRow[9]} lx`;

              checkWarnings(selectedZone);

          } else {
              document.querySelector(".taCurrent").textContent = "N/A";
              document.querySelector(".rhCurrent").textContent = "N/A";
              document.querySelector(".luxCurrent").textContent = "N/A";
          }
      })
      .catch(error => console.error("Error fetching data:", error));
}


document.getElementById("zoneSelect").addEventListener("change", function (e) {
  const selectedZone = parseInt(e.target.value);
  updateSensorData(selectedZone);
});

var btn_ta = document.getElementById("btn_ta");
var btn_rh = document.getElementById("btn_rh");
var btn_lux = document.getElementById("btn_lux");

var taDetailedView = document.querySelector(".taDetailedView");
var rhDetailedView = document.querySelector(".rhDetailedView");
var luxDetailedView = document.querySelector(".luxDetailedView");


btn_ta.addEventListener('click', () => {
  taDetailedView.style.display = 'flex';
  rhDetailedView.style.display = 'none';
  luxDetailedView.style.display = 'none';
  checkWarnings(selectedZone);

})

btn_rh.addEventListener('click', () => {
  taDetailedView.style.display = 'none';
  rhDetailedView.style.display = 'flex';
  luxDetailedView.style.display = 'none';
  checkWarnings(selectedZone);

})

btn_lux.addEventListener('click', () => {
  taDetailedView.style.display = 'none';
  rhDetailedView.style.display = 'none';
  luxDetailedView.style.display = 'flex';
  checkWarnings(selectedZone);

})

document.addEventListener("DOMContentLoaded", function () {
  updateTime();

  let defaultZone = 47;
  document.querySelector("#zoneSelect").value = defaultZone;

  // Fetch sensor data first, then preload overview
  updateSensorData(defaultZone).then(() => {
    document.querySelector(".taOverview").click();
  });

});

//show detailed graphs/trends when button is clicked
document.querySelectorAll('.trend-button').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelector('.mainDashboard').style.display = 'none';

    // Show the target graph based on button data-attribute
    document.querySelector('.graphDashboard').style.display = 'flex';
    const graphId = button.getAttribute('graph');
    document.getElementById(graphId).style.display = 'block';
  });
});

// Back to home
document.querySelector('.home_btn').addEventListener('click', () => {
  // Hide all graph containers
  document.querySelectorAll('.graphView > div').forEach(graph => {
    graph.style.display = 'none';
  });

  // Hide graph dashboard and show main dashboard
  document.querySelector('.graphDashboard').style.display = 'none';
  document.querySelector('.mainDashboard').style.display = 'flex';
});


// button increase and decrease https://www.geeksforgeeks.org/javascript/how-to-make-incremental-and-decremental-counter-using-html-css-and-javascript/ 
function decreaseTemp() {
  let currentValue = parseInt(document.querySelector(".taValueControl").textContent);
  newValue = currentValue - 1;
  document.querySelector(".taValueControl").textContent = `${newValue}°C`; 
  checkWarnings(selectedZone);
  
}

function increaseTemp() {
  let currentValue = parseInt(document.querySelector(".taValueControl").textContent);
  newValue = currentValue + 1;
  document.querySelector(".taValueControl").textContent = `${newValue}°C`; 
  checkWarnings(selectedZone);
  
}

function decreaseRH() {
  let currentValue = parseInt(document.querySelector(".rhValueControl").textContent);
  newValue = currentValue - 1;
  document.querySelector(".rhValueControl").textContent = `${newValue}%`; 
  checkWarnings(selectedZone);
}

function increaseRH() {
  let currentValue = parseInt(document.querySelector(".rhValueControl").textContent);
  newValue = currentValue + 1;
  document.querySelector(".rhValueControl").textContent = `${newValue}%`; 
  checkWarnings(selectedZone);
}

function decreaseLux() {
  let currentValue = parseInt(document.querySelector(".luxValueControl").textContent);
  newValue = currentValue - 1;
  document.querySelector(".luxValueControl").textContent = `${newValue}lx`; 
  checkWarnings(selectedZone);
}

function increaseLux() {
  let currentValue = parseInt(document.querySelector(".luxValueControl").textContent);
  newValue = currentValue + 1;
  document.querySelector(".luxValueControl").textContent = `${newValue}lx`; 
  checkWarnings(selectedZone);
}


//GRAPHS START HERE:

const unpack = (data, key) => data.map(row => row[key]?.trim());
const interactivePlotlyDiv = document.getElementById("interactivePlotly");
const heatmapDiv = document.getElementById("luxHeatmap");

Promise.all([
  d3.csv("samba_data.csv"),
  d3.csv("storage_conditions.csv")
]).then(([zoneData, storageConditions]) => {

  // combine the CSV's date and time fields into a valid Date object for every row
  zoneData.forEach(row => {
      let year = row.year_created;
      let month = row.month_created.padStart(2, '0');
      let day = row.day_created.padStart(2, '0');
      // makes the timestamp format correct
      row.timestamp = new Date(`${year}-${month}-${day}T${row.time_created}`);
  });

  console.log("Sample timestamp:", zoneData[0].timestamp);

  // clean up storage conditions data
  const storageConditionsCleaned = storageConditions.map(row => ({
      "media_type": row["media_type"].trim(),
      "min_ta": parseFloat(row["min_ta"]),
      "max_ta": parseFloat(row["max_ta"]),
      "min_rh": parseFloat(row["min_rh"]),
      "max_rh": parseFloat(row["max_rh"]),
      "min_lux": parseFloat(row["min_lux"]),
      "max_lux": parseFloat(row["max_lux"])
  }));

  // function to get storage limits for a given media type
  const getStorageLimits = (mediaType) => {
      const mediaRow = storageConditionsCleaned.find(row => row["media_type"] === mediaType);
      return mediaRow 
        ? { 
            minTa: mediaRow["min_ta"],
            maxTa: mediaRow["max_ta"],
            minRh: mediaRow["min_rh"],
            maxRh: mediaRow["max_rh"],
            minLux: mediaRow["min_lux"],
            maxLux: mediaRow["max_lux"] 
        } 
        : null;
  };

  const mediaOptions = ["DVDs", "Cassettes", "Vinyl Records"];
  let selectedMedia = "DVDs";  // default media selection

  // set an ideal lux  
  const idealLuxMax = 50;

  const updateGraph = () => {
      const storageLimits = getStorageLimits(selectedMedia);
      if (!storageLimits) {
          console.error("Storage limits not found for media:", selectedMedia);
          return;
      }

      // get the custom date range values from the user's calendar inputs
      const startDateInput = document.getElementById("startDate").value;
      const endDateInput = document.getElementById("endDate").value;
      //makes sure that the start and end dates start at the right times. before adding "T:00:00:00" the time started at 11:00
      const startDate = new Date(startDateInput + "T00:00:00");
      const endDate = new Date(endDateInput + "T23:59:59.999");
      
      console.log(`Filtering from ${startDate} to ${endDate}`);  //so i can check if its working properly

      // filters the dataset to include only rows within the selected date range
      let filteredData = zoneData.filter(row => row.timestamp >= startDate && row.timestamp <= endDate);
      console.log(`Custom date range: Found ${filteredData.length} records`);
      
      if(filteredData.length === 0){
          console.warn("No data in selected date range; using full dataset.");
          filteredData = zoneData;
      }
      
      // defines the zones to plot
      const zones = ["47", "48", "50"];
      
      // groups the filtered data by zone_id
      const dataByZone = d3.group(filteredData, d => d.zone_id?.trim());
      zones.forEach(zone => {
          const zoneRows = dataByZone.get(zone) || [];
          console.log(`Zone ${zone} has ${zoneRows.length} records`);
      });
      
      // creates one trace per zone for the temperature graph
      const traces = zones.map(zone => {
          const zoneRows = dataByZone.get(zone) || [];
          zoneRows.sort((a, b) => a.timestamp - b.timestamp);
          const zoneTime = zoneRows.map(row => row.timestamp);
          const zoneTa = zoneRows.map(row => parseFloat(row.ta));
          const zoneSuitability = zoneTa.map(temp =>
              (temp >= storageLimits.minTa && temp <= storageLimits.maxTa) ? "IDEAL" : "NOT IDEAL"
          );
          
          let color;
          if (zone === "47") { color = "#C36375"; }
          else if (zone === "48") { color = "#6393C3"; }
          else if (zone === "50") { color = "#63C3A0"; }
          
          return {
              x: zoneTime,
              y: zoneTa,
              name: `Zone ${zone}`,
              mode: 'lines',
              line: { color: color },
              hovertemplate:
                  '<b>Time:</b> %{x}<br>' +
                  '<b>Air Temperature:</b> %{y:.2f}°C<br>' +
                  `<b>Suitability for ${selectedMedia}:</b> %{text}<extra></extra>`,
              text: zoneSuitability
          };
      });

      const container = document.querySelector(".greetingCard");
      
      let layout = {
        
          title: `Air Temperature Suitability for ${selectedMedia} Storage (${storageLimits.minTa}°C - ${storageLimits.maxTa}°C)`,
          xaxis: {
              title: { text: "Time" },
              type: "date",
              tickformat: "%m/%d %H:%M",
              
          },
          yaxis: { title: { text: "Temperature (°C)" } },
          hovermode: "closest",
          width: container.offsetWidth,
          annotations: [{
              xref: 'paper',
              yref: 'paper',
              x: 0.5,
              y: 1.15,
              text: `Ideal Storage Temp for ${selectedMedia}: ${storageLimits.minTa}°C - ${storageLimits.maxTa}°C`,
              showarrow: false,
              font: { size: 14 }
          }],
          shapes: [{
              type: "rect",
              xref: "paper",
              yref: "y",
              x0: 0,
              x1: 1,
              y0: storageLimits.minTa,
              y1: storageLimits.maxTa,
              fillcolor: "gray",
              opacity: 0.4,
              layer: "middle",
              line: { width: 0 }
          }]
      };
      
      Plotly.newPlot(interactivePlotlyDiv, traces, layout);
      updateLuxHourlyHeatmap(filteredData, zones);
      updateHumidityDensityPlot(filteredData, zones);

  };

  // updates the lux heatmap using the filtered data
  const updateLuxHourlyHeatmap = (filteredData, zones) => {
    // gets storage limits for the chosen media
    const storageLimits = getStorageLimits(selectedMedia);
    if (!storageLimits) {
      console.error("Lux storage limits not found for media:", selectedMedia);
      return;
    }
    const idealLuxMax = storageLimits.maxLux;  // threshold for ideal lux
    
    // helper function to combine separate date fields into a date object
    const combineDateTime = d => {
      const year = d.year_created;
      const month = d.month_created.toString().padStart(2, '0');
      const day = d.day_created.toString().padStart(2, '0');
      const time = d.time_created; 
      return new Date(`${year}-${month}-${day}T${time}`);
    };
  
    if (filteredData.length === 0) {
      console.warn("No data to plot.");
      return;
    }
  
    // determines the overall time range from data using combineDateTime
    const allTimeDates = filteredData.map(d => combineDateTime(d));
    const minTime = new Date(Math.min(...allTimeDates));
    const maxTime = new Date(Math.max(...allTimeDates));
  
    // makes the start and end times to the beginning of the hour
    const startTime = new Date(minTime);
    startTime.setMinutes(0, 0, 0);
    const endTime = new Date(maxTime);
    endTime.setMinutes(0, 0, 0);
  
    // creates hourly bins
    const msPerHour = 3600000;
    // calc number of hours (including last partial hour).
    const totalHours = Math.floor((endTime - startTime) / msPerHour) + 1;
    let bins = [];
    for (let i = 0; i <= totalHours; i++) {
      bins.push(new Date(startTime.getTime() + i * msPerHour));
    }
  
    // create an x-axis using bin centers (one label per bin).
    let xAxis = [];
    for (let i = 0; i < totalHours; i++) {
      // use the midpoint between bin[i] and bin[i+1]
      const centerTime = new Date((bins[i].getTime() + bins[i + 1].getTime()) / 2);
      xAxis.push(centerTime);
    }
  
    // for each zone + hourly bin, calcs the average lux and its ideal status
    // two matrices --> one for the average lux values (zMatrix) and one for the status (customDataMatrix)
    let zMatrix = [];
    let customDataMatrix = [];
    
    zones.forEach(zone => {
      // filter data for the current zone
      const zoneData = filteredData.filter(d => d.zone_id?.trim() === zone);
      let rowData = [];
      let statusRow = [];
      for (let i = 0; i < totalHours; i++) {
        const binStart = bins[i];
        const binEnd = bins[i + 1];
        // for current zone, picks all readings that go into this hourly bin
        const readingsInBin = zoneData.filter(d => {
          const dt = combineDateTime(d);
          return dt >= binStart && dt < binEnd;
        });
        // calc average lux for this bin, or null if there's no data
        const avgLux = readingsInBin.length > 0
          ? d3.mean(readingsInBin, d => parseFloat(d.lux))
          : null;
        rowData.push(avgLux);
        
        // determine status based on ideal max threshold
        let status;
        if (avgLux === null) {
          status = "No Data";
        } else {
          status = (avgLux <= idealLuxMax ? "Ideal" : "Not Ideal");
        }
        statusRow.push(status);
      }
      zMatrix.push(rowData);
      customDataMatrix.push(statusRow);
    });
  
    // makes the heatmap trace
    const heatmapTrace = {
      x: xAxis,                           // X-axis: the hourly bin centers
      y: zones.map(z => `Zone ${z}`),       // Y-axis: one row per zone
      z: zMatrix,                         // Z-values: average lux per zone per hourly bin
      customdata: customDataMatrix,         // Custom data for ideal status
      type: "heatmap",
      colorscale: [
        [0, "blue"],
        [0.25, "green"],
        [0.5, "yellow"],
        [0.75, "orange"],
        [1, "red"]
      ],
      colorbar: { title: "Lux" },
      // hovertemplate with ideal status information
      hovertemplate:
        "<b>Time:</b> %{x}<br>" +
        "<b>Zone:</b> %{y}<br>" +
        "<b>Lux:</b> %{z:.1f}<br>" +
        "<b>Status:</b> %{customdata}<extra></extra>"
    };
  
    // layout for heatmap
    const layout = {
      title: { text: "Hourly Lux Heatmap" },
      xaxis: {
        title: { text: "Time" },
        type: "date",
        tickformat: "%H:%M" // shows hours and minutes
      },
      yaxis: { title: { text: "Zone" } },
     
    };
  
    Plotly.newPlot("luxHeatmap", [heatmapTrace], layout);
  };

  const updateHumidityDensityPlot = (filteredData, zones) => {
    //gets the humidity limits from storage_conditions.csv
    const storageLimitsForMedia = getStorageLimits(selectedMedia);
    if (!storageLimitsForMedia) {
        console.error("Storage limits not found for media:", selectedMedia);
        return;
    }
    const idealRange = {min: storageLimitsForMedia.minRh, max: storageLimitsForMedia.maxRh };

    //groups data according to zone
    const dataByZone = d3.group(filteredData, d => d.zone_id?.trim());

    //array for histogram traces
    let histogramTraces = [];

    zones.forEach(zone => {
        //get humidity for the zone, filters out non-numeric values
        const zoneRows = dataByZone.get(zone) || [];
        let humidityValues = zoneRows.map(row => parseFloat(row.rh)).filter(v => !isNaN(v));

        //separate into ideal and not ideal
        let idealReadings = humidityValues.filter(v => v >= idealRange.min && v <= idealRange.max);
        let notIdealReadings = humidityValues.filter(v => v < idealRange.min || v > idealRange.max);

        //histogram trace for ideal readings
        let traceIdeal = {
            x: idealReadings,
            type: 'histogram',
            histnorm: 'density',
            name: `Zone ${zone} Ideal`,
            marker: { color: 'green'},
            opacity: 0.75
        };

        //histogram trace for not ideal readings
        let traceNotIdeal = {
            x: notIdealReadings,
            type: 'histogram',
            histnorm: 'density',
            name: `Zone ${zone} Not Ideal`,
            marker: { color: 'red'},
            opacity: 0.75
        };

        histogramTraces.push(traceIdeal, traceNotIdeal);
    });

    //histogram layout
    const layout = {
        title: { text: `Humidity Density Histogram for ${selectedMedia} (Ideal: ${idealRange.min}% to ${idealRange.max}%)` },
        xaxis: { title: { text: "Humidity (%)" }, range: [0, 100] },
        yaxis: { title: { text: "Density" } },
        barmode: 'overlay', 
        hovermode: "closest",
        
    };
    

    Plotly.newPlot("humidityDensity", histogramTraces, layout);
  };

  // checks for changes on the media selector and custom date inputs
  document.getElementById("mediaSelector").addEventListener("change", function() {
      selectedMedia = this.value;
      updateGraph();
  });
  
  document.getElementById("startDate").addEventListener("change", updateGraph);
  document.getElementById("endDate").addEventListener("change", updateGraph);
  
  updateGraph();
  console.log("Initial Media:", selectedMedia);

});