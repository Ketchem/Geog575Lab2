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
        var width = window.innerWidth * 0.66,
            //height = 640;
            height = window.innerHeight * .66;

        // Create new svg container for the map
        var map = d3.select("body")
            .append("svg")
            .attr("class", "map")
            .attr("width", width)
            .attr("height", height);

        // Create the projection
        var projection = d3.geoEqualEarth()
            // .rotate([-10, 0])
            .center([-0,0])
            .translate([width / 2, height / 2])
            // .center([-40,25])
            // .scale(230);
            .scale(width/5.5);

        var path = d3.geoPath()
            .projection(projection);

        // Load the data sets
        var dataSets = [];
        dataSets.push(d3.csv("assets/data/medalsByCountry.csv"));
        dataSets.push(d3.json("assets/data/worldCountries.topojson"));

        // Work with the data sets
        Promise.all(dataSets).then(function(values){

           // Create map background
           setGraticule(map, path);

           var csvData = values[0];
           var worldCountries = topojson.feature(values[1], values[1].objects.worldCountries);

            var countries = map.append("path")
                .datum(worldCountries)
                .attr("class", "countries")
                .attr("d", path);

            // Join data together
            worldCountries = joinData(worldCountries.features, csvData);
            // console.log(worldCountries);
            // Create the color scale
            var colorScale = makeColorScale(csvData);
            // Draw the countries
            setEnumerationUnits(worldCountries, map, path, colorScale);
            // Add chart
            // Create interface elements

        });

    };

    function setGraticule(map, path){
        var graticule = d3.geoGraticule()
            .step([10, 10]);

        var gratBackground = map.append("path")
            .datum(graticule.outline()) //bind graticule background
            .attr("class", "gratBackground") //assign class for styling
            .attr("d", path) //project graticule

        var gratLines = map.selectAll(".gratLines") //select graticule elements that will be created
            .data(graticule.lines()) //bind graticule lines to each element to be created
            .enter() //create an element for each datum
            .append("path") //append each element to the svg as a path element
            .attr("class", "gratLines") //assign class for styling
            .attr("d", path); //project graticule lines
    };

    // Join the data file to the features
    function joinData(worldCountries, csvData){

        for (var i=0; i<csvData.length; i++){

            var csvCountry = csvData[i]; //the current Column
            var csvKey = csvCountry.NOC; //the CSV primary key

            //loop through geojson regions to find correct NOC
            for (var a=0; a<worldCountries.length; a++){

                var geojsonProps = worldCountries[a].properties; //the current region geojson properties;
                var geojsonKey = geojsonProps.ADM0_A3; //the geojson primary key

                //where primary keys match, transfer csv data to geojson properties object
                if (geojsonKey == csvKey){

                    //assign all attributes and values
                    attrArray.forEach(function(attr){
                        var val = parseFloat(csvCountry[attr]); //get csv attribute value
                        geojsonProps[attr] = val; //assign attribute and value to geojson properties
                    });
                };
            };
        };

        return worldCountries;
    };

    // Set the variable
    function setEnumerationUnits(worldCountries, map, path, colorScale){
        var regions = map.selectAll(".regions")
            .data(worldCountries)
            .enter()
            .append("path")
            .attr("class", function(d){
                return "regions " + d.properties.NOC;
            })
            .attr("d", path)
            .style("fill", function(d){
                return choropleth(d.properties, colorScale);
            });

    };

    // Create the map color scale
    function makeColorScale(data){
        var colorClasses = [
            "#66D6F2",
            "#00A1C7",
            "#0086A6",
            "#00596E",
            "#002F3B"
        ];

        //create color scale generator
        var colorScale = d3.scaleQuantile()
            .range(colorClasses);

        //build array of all values of the expressed attribute
        var domainArray = [];
        for (var i=0; i<data.length; i++){
            var val = parseFloat(data[i][expressed]);
            domainArray.push(val);
        };

        //assign array of expressed values as scale domain
        colorScale.domain(domainArray);

        return colorScale;
    };

    function choropleth(props, colorScale){
        //make sure attribute value is a number
        var val = parseFloat(props[expressed]);
        //if attribute value exists and is  > 0, assign a color; otherwise assign gray
        if (val === 0){
            return "#CCC";
        }
        else if (typeof val == 'number' && !isNaN(val)){
            return colorScale(val);
        } else {
            return "#CCC";
        };
    };

    function setChart(csvData, colorScale){

    };

    function changeAttribute(attribute, csvData){

    };

    function updateChart(bars, n, colorScale){

    };

}) ();