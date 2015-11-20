console.log("Assignment 5");

var margin = {t:50,r:100,b:50,l:50};
var width = document.getElementById('map').clientWidth - margin.r - margin.l,
    height = document.getElementById('map').clientHeight - margin.t - margin.b;

var map = d3.select('.canvas')
    .append('svg')
    .attr('width',width+margin.r+margin.l)
    .attr('height',height + margin.t + margin.b)
    .append('g')
    .attr('class','map')
    .attr('transform','translate('+margin.l+','+margin.t+')');

//TODO: set up a mercator projection, and a d3.geo.path() generator
//store long/lat for Boston in an array for easy access
var bostonLngLat = [-71.088066,42.315520]; //from http://itouchmap.com/latlong.html

var projection = d3.geo.mercator() //set up a mercator projection function
    .center(bostonLngLat)  //change the projection center to Boston
    .translate([width/2-70,height/2])//Center the projection on the screen (map asymmetrical, better to shift slightly
    .scale(200000); //blow the map up a _lot_

//set up a path generator function that uses the mercator projection function
var pathGenerator = d3.geo.path().projection(projection);

//Color scale
//value chosen based on maximum in data file (should also be able to calculate using d3.max
var colorScale = d3.scale.linear().domain([0,250000]).range(['white','red']);

//create a lookup table to store information about the medianHhIncome
var medianHhIncome = d3.map();

//import data from GeoJSON and csv files. Use parseData function to load the csv (not necessary for JSONs)
queue()
    .defer(d3.json, "data/bos_census_blk_group.geojson")
    .defer(d3.json, "data/bos_neighborhoods.geojson")
    .defer(d3.csv, "data/acs2013_median_hh_income.csv", parseData)
    //wait for a variable to be returned for each file loaded: blocks from blk_group file, neighborhoods from bos_neighborhoods, and income from the parsed acs.csv.
    .await(function(err, blocks, neighborhoods) {

        //console.log(neighborhoods);

        //call the draw function, pass it the loaded data
        draw(neighborhoods, blocks);

    });

function parseData(d){

    //populate the lookup table for medianHhIncome using set.(idcolumn, datacolumn)
    //Could also link id to an object using {prop1:prop1data, prop2:prop2data}, but that doesn't appear necessary here.
    medianHhIncome.set(d.geoid, +d.B19013001);

    return(medianHhIncome);

}

function draw(neighborhoods, blocks){

    //create a variable to hold the block groups selection
    var test = map.append('g')
        .attr('class','block-groups')
        .selectAll('.block-group')
        .data(blocks.features)//use data/enter/append because we want to plot each path separately
        .enter()
        .append('path')
        .attr('class','block-group')
        .attr('d', pathGenerator)  //call the pathGenerator function to draw the blocks
        .style('fill', function(d){

            //set the path style depending on the value of the median income
            var lookUpIncome = medianHhIncome.get(d.properties.geoid);
            if (lookUpIncome == 0){
                return "lightgray"
            }
            else if (lookUpIncome == undefined){
                return "blue"
            }
            else {
                return colorScale(lookUpIncome);
            }
        })
        .style('stroke','white');

    //console.log(neighborhoods);
    //console.log(neighborhoods.features[0].properties.Name);

    //Create a new group, and draw the neighborhoods
    d3.select('.map')
        .append('g')
        .attr('class','neighborhoods')

        //keep neighborhood map outside of recommended DOM structure to allow it to be plotted just once, as a single path.
        .append('path')
        .datum(neighborhoods)  //use datum to make a single path
        .attr('class','boundary')
        .attr('d', pathGenerator)
        .style('stroke-width','2px')
        .style('fill','none')
        .style('stroke','gray');

    //console.log(pathGenerator.centroid(neighborhoods)[0]);

    //Label each neighborhood with its name
    neighborhoods.features.forEach(addLabel);

    function addLabel(d,index) {
        selectNeighborhoods = d3.select('.neighborhoods');

        neighborhoodGroup = selectNeighborhoods.append('g')
            .attr('class','neighborhood');

        //append a label to each group (since the map is drawn as a single entity, it might make more sense to
        //make a single group of labels...
        neighborhoodGroup.append('text')
        .attr('class','label')
        .attr("text-anchor", "middle")  //measure from the center of the text
        .attr("x", function(d) {
            //console.log(pathGenerator.centroid(neighborhoods.features[index])[0]);
            //calculate the centroid for each neighborhood, and use this to place the labels
            return pathGenerator.centroid(neighborhoods.features[index])[0];})
        .attr("y", function(d) { return pathGenerator.centroid(neighborhoods.features[index])[1];})
        .text( function (d) {
            //console.log(neighborhoods.features[index].properties.Name);
            return neighborhoods.features[index].properties.Name})
        .attr("font-family", "sans-serif")
        .attr("font-size", "14px")
        .attr("fill", "black");

}

}
