/**
 * Created by hen on 3/8/14.
 */

var margin = {
    top: -200,
    right: 50,
    bottom: 50,
    left: 50
};

var bbDetail = {
    x: 300,
    y: 0,
    w: 400,
    h: 300,
    p: 20
};

var loadedGraph = false;

var width = 960 - margin.left - margin.right;
var height = 800 - margin.bottom - margin.top;
var selected;

var bbVis = {
    x: 100,
    y: 10,
    w: width - 100,
    h: 300,
    p: 8
};

var detailVis = d3.select("#detailVis").append("svg").attr({
    width:500,
    height:500,
})


tooltip = d3.select('#vis').append("div").attr({id:'tooltip'}).style("position", "absolute")
  .style("z-index", "10")
  .style("visibility", "hidden")
  .text("a simple tooltip");

var canvas = d3.select("#vis").append("svg").attr({
    width: width + margin.left + margin.right,
    height: height + margin.top + margin.bottom
    })


var svg = canvas.append("g").attr({
        transform: "translate(" + margin.left + "," + margin.top + ")"
    });


var projection = d3.geo.albersUsa().translate([width / 2, height / 2]);//.precision(.1);
var path = d3.geo.path().projection(projection);

var colors = {};
var colorDomains = {};
var factors = {};
var mins = {};
var maxs = {};
var tooltip;
var xDetailAxis, xDetailAxis, yDetailAxis, yDetailScale;

function loadFactor(factor) {
    svg.selectAll("path")
      .style("fill", function(d) {
        if(d["properties"]["name"] in factors[factor]) {
          // save most recent color
          colors[d["properties"]["name"]] = colorDomains[factor](factors[factor][d["properties"]["name"]]["rate_per_pop"]);
          return colors[d["properties"]["name"]];
        }
      })
      .style("stroke", "white");

    factors.loaded = [factor];

    // UPDATE GRAPH

    // update scales and axes
    xDetailScale.domain([mins[factor], parseInt(maxs[factor]) + 1]);
    yDetailScale.domain([maxs[factor],mins[factor]]);
    xDetailAxis.scale(xDetailScale);
    yDetailAxis.scale(yDetailScale);

    detailVis.select("g.x.axis").call(xDetailAxis)
          .selectAll("text") 
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", function(d) {
                return "rotate(-65)" 
                });

    detailVis.select("g.y.axis").call(yDetailAxis);



    // load data for selected factor
    var dataSet = [];
    Object.keys(factors[factor]).forEach(function(id) {

      dataSet.push(factors[factor][id]);
    });
    
    console.log(factor, dataSet)
    // update title
    detailVis.select('text.title').text(factor);

    detailVis.selectAll("circle").remove();
    // REMOVE CIRCLES


    // add bars
    var bars = detailVis.append("g")
       .selectAll("circle")
       .data(dataSet)
       .enter()
       .append("circle")
       .attr("class", "stateDot")
       .attr("cx", function(d) {
          return xDetailScale(d["rate_per_pop"]);
       })
       .attr("cy", function(d) {
          return yDetailScale(d["rate_per_pop"]);
       })
       .attr("r", 5);
       



}

function loadStats() {
  // file names for each of the factors

  var dataFiles = ["cly", "gon", "syp", "teen", "creampie", "teen-tag"];

  // iterate over all factors
  dataFiles.forEach(function(factor) {
    var filePath = "../data/" + factor + "_data.csv";

    d3.csv(filePath, function(error,data){
      // find min and max
      var min;
      var max;

      // create factor array
      factors[factor] = {}

      Object.keys(data).forEach(function(id) {
          data[id]["rate_per_pop"] = parseFloat(data[id]["rate_per_pop"]);
          factors[factor][data[id]["state"]] = data[id];

          // update min and max
          if(!min || data[id]["rate_per_pop"] < min)
              min = data[id]["rate_per_pop"];
          if(!max || data[id]["rate_per_pop"] > max)
              max = data[id]["rate_per_pop"];
      });

      // save min and max
      mins[factor] = min;
      maxs[factor] = max;

      // create color scale
      colorDomains[factor] = d3.scale.linear()
          .domain([min, max])
          .range(["pink", "red"]);
    });
  });

  d3.text("../data/porn_prefs.csv", function(text) {
    var data = d3.csv.parseRows(text);
    var headers = data.shift();
    console.log(data, headers)
    var header_len = headers.length;
    var time_formatter = d3.time.format("%H:%M:%S");

    factors["avg_time"] = {};
    var avg_times = data.shift();
    avg_times.splice(1).forEach(function(t,i) {
      factors["avg_time"][headers[i+1]] = {"state": headers[i+1], "rate_per_pop": time_formatter.parse(t)};
    });

    data.forEach(function(factor) {
      var factor_name = "porn_"+factor[0];
      factors[factor_name] = {};
      var min, max;
      for (var st=1; st<header_len; st++ ) {
        var rank = 0;
        if (factor[st]) { rank = parseInt(factor[st]);}
        factors[factor_name][headers[st]] = {"state": headers[st], "rate_per_pop": rank}
        if (!min || min > rank) { min = rank; }
        if (!max || max < rank) { max = rank; }
        
      }
      mins[factor_name] = min;
      maxs[factor_name] = max;

    })


  })


    

  // set radio button toggle
  d3.select("input[value=\"cly\"]").
    on("click", function() {
      loadFactor("cly");
    });
  d3.select("input[value=\"gon\"]").
    on("click", function() {
      loadFactor("gon");
    });
  d3.select("input[value=\"teen\"]").
    on("click", function() {
      loadFactor("teen");
    });
  d3.select("input[value=\"creampie\"]").
    on("click", function() {
      loadFactor("creampie");
    });
  d3.select("input[value=\"teen-tag\"]").
    on("click", function() {
      loadFactor("teen-tag");
    });
  d3.select("input[value=\"syp\"]").
    on("click", function() {
      loadFactor("syp");
    });
}


d3.json("../data/us-named.json", function(error, data) {
    var usMap = topojson.feature(data,data.objects.states).features
    
    svg.selectAll(".country").data(usMap).enter().append("path").attr("d", path).attr("class","state")
      .on("mousemove", movetip)
      .on("mouseover", hover)
      .on("mouseout", hover);

    loadStats();
    createDetailVis();

});

function hover(d) {
  selected = (d && selected !== d) ? d : null;

  svg.selectAll("path")
      .style("fill", function(d) {
        return (selected && d === selected) ? "orange" : colors[d["properties"]["name"]];
      });

  movetip(d);
}

function movetip(d) {
  if (selected) {
    var tipHTML = d.properties.name;
    if (factors.loaded) {
      tipHTML += "<br/>"+factors.loaded[0]+": "+factors[factors.loaded[0]][d.properties.name].rate_per_pop; 
    }

    var tXY = d3.mouse(d3.select('#vis')[0][0]);
    tooltip.html(tipHTML)
      .style({visibility: 'visible'})
      .style("left",(tXY[0]+bbVis.p)+'px')
      .style("top", function() { return(tXY[1]+bbVis.x-bbVis.p)+'px';} ); 
  }
  else {
    tooltip.style({visibility: 'hidden'});
  }

}

function createDetailVis(){

    xDetailScale = d3.scale.linear().range([10, bbDetail.w]);
    

    yDetailScale = d3.scale.linear().range([10, bbDetail.h]);

    xDetailAxis = d3.svg.axis()
        .orient("bottom")
        .ticks(5);

    yDetailAxis = d3.svg.axis()
        .orient("left")
        .ticks(6);

    detailVis.append("svg");

    // add x axis
    detailVis.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate("+bbDetail.p/2+"," + (bbDetail.h+bbDetail.p)  + ")")

    // add y axis
    detailVis.append("g")
          .attr("class", "y axis")
          .attr("transform", "translate("+ bbDetail.p +","+bbDetail.p+")");

    // add title
    detailVis.append("text")
       .attr("fill", "teal")
       .attr("dy", 10)
       .attr("dx", 50);
}