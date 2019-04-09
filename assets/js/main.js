// Anonymous function to keep all variables local
(function(){

    // Set array of attributes from the CSV to join to
    var attrArray = ["TotalNumberOfMedals","TotalSummerMedals", "TotalWinterMedals","TotalGold","GoldSummer","GoldWinter","TotalSilver","SilverSummer",
        "SilverWinter", "TotalBronze","BronzeSummer", "BronzeWinter"];
    // Set the default attribute to be displayed
    var expressed = attrArray[0];

    // Create variables for the Chart Dimensions
    var chartWidth = window.innerWidth * 1 - 40,
        chartHeight = chartWidth * .35,
        leftPadding = 40,
        rightPadding = 2,
        topBottomPadding = 5,
        chartInnerWidth = chartWidth - leftPadding - rightPadding,
        chartInnerHeight = chartHeight - (topBottomPadding * 2),
        translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

    // Create the scale for the Y axis
    // Using Log Scale to show values from 1 - 5637
    var yScale = d3.scaleLog()
        .base(Math.E)
        .range([chartInnerHeight - (topBottomPadding * 2), 0])
        .domain([Math.exp(0), Math.exp(9)]);
        // .tickFormat(function(d){return d});

    // Setup the map after the window loads
    window.onload = setMap();


    // Setup the map
    function setMap(){

        // Map frame dimensions
        var width = window.innerWidth - 40,
            height = width * .35;
            //height = window.innerHeight * .66;

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
            .scale((width*2)/15);

        // Set the projection
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
            // Create the color scale
            var colorScale = makeColorScale(csvData);
            // Draw the countries
            setEnumerationUnits(worldCountries, map, path, colorScale);
            // Create interface elements
            createDropdown(csvData);
            // TODO createLegend();
            // Add chart
            setChart(csvData, colorScale);

        });

    };

    // Add the Graticule and map background
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

    // Draw the countries/regions
    function setEnumerationUnits(worldCountries, map, path, colorScale){

        var regions = map.selectAll(".regions")
            .data(worldCountries)
            .enter()
            .append("path")
            .attr("class", function(d){
                // console.log(d);
                return "regions " + d.properties.ADMIN;
            })
            .attr("id", function(d){
                return d.properties.ADM0_A3;
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

    // Appropriately Color the Map
    function choropleth(props, colorScale){
        //make sure attribute value is a number
        var val = parseFloat(props[expressed]);
        //if attribute value exists and is  > 0, assign a color; otherwise assign gray
        if (val === 0){
            return "#66D6F2";
        }
        else if (typeof val == 'number' && !isNaN(val)){
            return colorScale(val);
        } else {
            return "#CCC";
        };
    };

    // Create the chart
    function setChart(csvData, colorScale){

        //create a second svg element to hold the bar chart
        var chart = d3.select("body")
            .append("svg")
            .attr("width", chartWidth)
            .attr("height", chartHeight)
            .attr("class", "chart");


        //Example 2.4 line 8...set bars for each province
        var bars = chart.selectAll(".bar")
            .data(csvData)
            .enter()
            .append("rect")
            .sort(function(a, b){
                return b[expressed]-a[expressed]
            })
            .attr("class", function(d){
                // console.log(d);
                return "bar " + d.NOC;
            })
            .attr("width", chartInnerWidth / csvData.length - 1);

        //set bar positions, heights, and colors
        updateChart(bars, csvData.length, colorScale, chart, csvData);


        // Create a text element for the chart title
        var chartTitle = chart.append("text")
            .attr("x", chartInnerWidth/2)
            .attr("y", 40)
            .attr("class", "chartTitle")
            .text("Number of Medals By Country");
            // .text("Number of Variable " + expressed[3] + " in each region");

        //create vertical axis generator
        var yAxis = chart.append("g")
            .attr("class", "axis")
            .attr("transform", translate)
            .call(d3.axisLeft(yScale)); // Create an axis component with d3.axisLeft


        //create frame for chart border
        var chartFrame = chart.append("rect")
            .attr("class", "chartFrame")
            .attr("width", chartInnerWidth)
            .attr("height", chartInnerHeight)
            .attr("transform", translate);

        //annotate bars with attribute value text
        var numbers = chart.selectAll(".numbers")
            .data(csvData)
            .enter()
            .append("text")
            .sort(function(a, b){
                return b[expressed]-a[expressed]
            })
            .attr("class", function(d){
                return "numbers " + d.NOC.toUpperCase();
            })
            .attr("text-anchor", "right")
            .attr("x", function(d, i){
                var fraction = chartInnerWidth/ csvData.length;
                return (i * fraction + (fraction - 1) / 2) + 40;
            })
            .attr("y", function(d){
                return yScale(parseFloat(d[expressed]));
            })
            .text(function(d){
                return d[expressed];
            });

        // Rewrite the scale to whole numbers
        adjustTicks();
    };

    //dropdown change listener handler
    function changeAttribute(attribute, csvData){
        //change the expressed attribute
        expressed = attribute;

        //recreate the color scale
        var colorScale = makeColorScale(csvData);

        var regions = d3.selectAll(".regions")
            .transition()
            .duration(1000)
            .style("fill", function(d){
                return choropleth(d.properties, colorScale)
            });

        var bars = d3.selectAll(".bar")
        //re-sort bars
            .sort(function(a, b){
                return b[expressed] - a[expressed];
            })
            .transition() //add animation
            .delay(function(d, i){
                return i * 20
            })
            .duration(500);

        var numbers = d3.selectAll(".numbers")
            .sort(function(a, b){
            return b[expressed]-a[expressed]
            })
            .text(function(d){
                return d[expressed];
            });

        updateChart(bars, csvData.length, colorScale, numbers);
    };

    // Change the chart attributes when a user changes the dropdown value
    function updateChart(bars, n, colorScale, numbers){
        //position bars
        bars.attr("x", function(d, i){
            return i * (chartInnerWidth / n) + leftPadding;
        })
        //size/resize bars
            .attr("height", function(d, i){
                if (isNaN(chartInnerHeight - yScale(parseFloat(d[expressed]))) ||
                    chartInnerHeight - yScale(parseFloat(d[expressed])) === Infinity ||
                    chartInnerHeight - yScale(parseFloat(d[expressed])) === -Infinity){
                    return 0;
                }
                else{
                    return chartInnerHeight - yScale(parseFloat(d[expressed]));
                }

            })
            .attr("y", function(d, i){
                if (isNaN(yScale(parseFloat(d[expressed])) + topBottomPadding) ||
                    yScale(parseFloat(d[expressed])) + topBottomPadding === Infinity ||
                    yScale(parseFloat(d[expressed])) + topBottomPadding === -Infinity){
                    return 0;
                }
                else{
                    return yScale(parseFloat(d[expressed])) + topBottomPadding;
                }

            })
            //color/recolor bars
            .style("fill", function(d){
                return choropleth(d, colorScale);
            });

        // Add the number label to the chart (initially hidden)
        //TODO Fix Numbers Y position
        numbers.attr("x", function(d, i){
            var fraction = chartInnerWidth/ n;
            return (i * fraction + (fraction - 1) / 2) + 40;
            });
            // .attr("y", function(d){
            //     return yScale(parseFloat(d[expressed]));
            // });

        setRegionsFunctions();

        // var chartTitle = d3.select(".chartTitle")
        //     .text("Number of Variable " + expressed[3] + " in each region");
    };

    // Create the dropdown for the user
    function createDropdown(csvData){

        var controlDiv = d3.select("body")
            .append("div")
            .attr("class", "controls")

        //add select element
        var dropdown = d3.select(".controls")
            .append("select")
            .attr("class", "dropdown")
            .on("change", function(){
                changeAttribute(this.value, csvData)
            });

        //add initial option
        var titleOption = dropdown.append("option")
            .attr("class", "titleOption")
            .attr("disabled", "true")
            .text("Select Attribute");

        //add attribute name options
        var attrOptions = dropdown.selectAll("attrOptions")
            .data(attrArray)
            .enter()
            .append("option")
            .attr("value", function(d){ return d })
            .text(function(d){ return d });

        var popup = d3.select(".controls")
            .append("div")
            .attr("class", "popup");
    };

    // Set the functionality of the elements
    // TODO Add event listeners to the bars as well
    function setRegionsFunctions(){

        var popup = d3.selectAll(".popup");

        var regions = d3.selectAll(".regions")
            .on("mouseover", highlight)
            .on("mouseout",  unhighlight);

        function highlight(d) {
            var centroid = d3.geoCentroid(d);
            // console.log(centroid);
            var label = d.properties.ADMIN;
            var noc = d.properties.ADM0_A3;
            // console.log(label);
            popup.html(label)
                .attr("left", chartInnerWidth.toString())
                .attr("top", "60");
            $("."+ noc).addClass("highlighted");
            $("#"+ noc).addClass("highlighted");
        };

        function unhighlight(d){
            var noc = d.properties.ADM0_A3;
            $("."+ noc).removeClass("highlighted");
            $("#"+ noc).removeClass("highlighted");
            popup.html("");
        };
    };

    // Adjust the Y scale ticks to whole values
    function adjustTicks(){
        $(".tick text").each(function(){
            var roundedNumber = $(this).text();
            console.log(roundedNumber);
            roundedNumber = Math.round(parseFloat(roundedNumber.replace(/,/g, '')));
            $(this).text(roundedNumber);
        })
    };




}) ();