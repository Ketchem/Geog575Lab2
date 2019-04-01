// Anonymous function to keep all variables local
(function(){

    //variables for data join
    var attrArray = ["TotalNumberMedals","TotalGold","GoldSummer","GoldWinter","TotalSilver","SilverSummer",
        "SilverWinter", "TotalBronze","BronzeSummer", "BronzeWinter"];
    var expressed = attrArray[0];

    //chart frame dimensions


    //create a scale to size bars proportionally to frame


    //begin script when window loads
    window.onload = setMap();

    // Setup the map
    function setMap(){

        // Map frame dimensions
        var width = window.innerWidth * 0.75,
            height = 690;

        // Create new svg container for the map
        var map = d3.select("body")
            .append("svg")
            .attr("class", "map")
            .attr("width", width)
            .attr("height", height);

        // Create the projection
        var projection = d3.geoCylindricalEqualArea();

        var path = d3.geoPath()
            .projection(projection);

        // Load the data sets
        var dataSets = [];
        dataSets.push(d3.csv("assets/data/medalsByCountry.csv"));
        dataSets.push(d3.json("assets/data/worldCountries.topojson"));

        // Work with the data sets
        console.log(dataSets);
        Promise.all(dataSets).then(function(values){
            console.log(values);
           var csvData = values[0];
           var worldCountries = topojson.feature(values[1], values[1].objects.worldCountries);

            var countries = map.append("path")
                .datum(worldCountries)
                .attr("class", "countries")
                .attr("d", path);
        });

    };
        // Add the data sets
        // Manipulate data sets
            // Create map background
            // Join data together
            // Create the color scale
            // Draw the countries
            // Add chart
            // Create interface elements
}) ();