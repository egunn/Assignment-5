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

//*************change once scaling function is set up *****************************
    .center(bostonLngLat)  //change the projection center to Boston
    .translate([width/2-70,height/2])     //Center the projection on the screen
    .scale(200000); //from documentation page - may need to change back to a simple multiple

//set up a path generator function that uses the mercator projection function
var pathGenerator = d3.geo.path().projection(projection);

//TODO: create a color scale
//Color scale
//****************use d3.max to calculate a more fitting scale range**********************
var colorScale = d3.scale.linear().domain([0,250000]).range(['white','red']); //range 0-1 is too broad; redefine for max 20% unemployment

//TODO: create a d3.map() to store the value of median HH income per block group
var medianHhIncome = d3.map();

//TODO: import data, parse, and draw
//import data
queue()
    .defer(d3.json, "data/bos_census_blk_group.geojson")
    .defer(d3.json, "data/bos_neighborhoods.geojson")
    .defer(d3.csv, "data/acs2013_median_hh_income.csv", parseData)
    //wait for a variable to be returned for each file loaded: blocks from blk_group file, neighborhoods from bos_neighborhoods, and income from the parsed acs.csv.
    .await(function(err, blocks, neighborhoods) {

        //console.log(neighborhoods);

        draw(neighborhoods, blocks);

    });

function parseData(d){
    //console.log(d);

    //populate the lookup table for medianHhIncome using set.(idcolumn, datacolumn)
    //Could also link id to an object using {prop1:prop1data, prop2:prop2data}, but that doesn't appear necessary here.
    medianHhIncome.set(d.geoid, +d.B19013001);

    //console.log(medianHhIncome);
    return(medianHhIncome);

}

function draw(neighborhoods, blocks){


    var test = map.append('g')
        .attr('class','block-groups')
        .selectAll('.block-group')
        .data(blocks.features)
        .enter()
        .append('path')
        .attr('class','block-group')
        .attr('d', pathGenerator)
        .style('fill', function(d){

            //console.log(d);

            //return "white";
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

    console.log(neighborhoods);
    //console.log(neighborhoods.features[0].properties.Name);

    d3.select('.map')
        .append('g')
        .attr('class','neighborhoods');


    //console.log(pathGenerator.centroid(neighborhoods)[0]);

    //Label each neighborhood with its name

    neighborhoods.features.forEach(addLabel);

    function addLabel(d,index) {
        selectNeighborhoods = d3.select('.neighborhoods');

        neighborhoodGroup = selectNeighborhoods.append('g')
            .attr('class','neighborhood');

        neighborhoodGroup.append('text')
        .attr('class','label')
        .attr("text-anchor", "middle")
        .attr("x", function(d) {
            //console.log(pathGenerator.centroid(neighborhoods.features[index])[0]);
            return pathGenerator.centroid(neighborhoods.features[index])[0];})
        .attr("y", function(d) { return pathGenerator.centroid(neighborhoods.features[index])[1];})
        .text( function (d) {
            //console.log(neighborhoods.features[index].properties.Name);
            return neighborhoods.features[index].properties.Name})
        .attr("font-family", "sans-serif")
        .attr("font-size", "14px")
        .attr("fill", "black");

        //******************Switch to data method instead? appears to be appending the whole map************************
        neighborhoodGroup.append('path')
            .datum(neighborhoods)
            .attr('class','boundary')
            .attr('d', pathGenerator)
            .style('stroke-width','2px')
            .style('fill','none')
            .style('stroke','gray');
}

}
