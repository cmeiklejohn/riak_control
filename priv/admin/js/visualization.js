minispade.register('visualization', function() {

  RiakControl.VisualizationView = Ember.View.extend({
    templateName: 'visualization',

    ringStructure: function() {
      this.rerender();
    }.observes('controller.ringStructure'),

    didInsertElement: function() {
      var data = this.get('controller.ringStructure');

      var width = 960,
          height = 700,
          radius = Math.min(width, height) / 2,
          color = d3.scale.category20();

      var innerRadius = function(d) {
        return Math.sqrt(d.y);
      };

      var outerRadius = function(d) {
        return Math.sqrt(d.y + d.dy);
      };

      var startAngle = function(d) {
        return d.x;
      };

      var endAngle = function(d) {
        return d.x + d.dx;
      };

      var vis = d3.select("#chart").append("svg")
          .attr("width", width)
          .attr("height", height)
        .append("g")
          .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

      var partition = d3.layout.partition()
          .sort(null)
          .size([2 * Math.PI, radius * radius])
          .value(function(d) { return 1; });

      var arc = d3.svg.arc()
          .startAngle(startAngle)
          .endAngle(endAngle)
          .innerRadius(innerRadius)
          .outerRadius(outerRadius);

      var group = vis.data([data]).selectAll("group")
            .data(partition.nodes)
          .enter().append("g");

      var path = group.append("path")
          .attr("display", function(d) { return d.depth ? null : "none"; }) // hide inner ring
          .attr("d", arc)
          .attr("fill-rule", "evenodd")
          .style("stroke", "#fff")
          .style("fill", function(d) { return color(d.node); });

      var nodeText = group.append("text")
          .attr("display", function(d) { return d.depth ? null : "none"; }) // hide inner ring
          .attr("class", "label node")
          .each(function(d) { d.angle = (startAngle(d) + endAngle(d)) / 2; })
          .attr("dy", ".35em")
          .attr("text-anchor", function(d) { return d.angle > Math.PI ? "end" : null; })
          .attr("transform", function(d) {
            return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")"
                + "translate(" + (Math.sqrt(d.y) + 15) + ")"
                + (d.angle > Math.PI ? "rotate(180)" : "");
          })
          .text(function(d) { return d.node; });
    }
  });

  RiakControl.VisualizationController = Ember.ArrayController.extend({
    init: function() {
      this.load();
    },

    load: function() {
      $.ajax({
        url: '/admin/ring/partitions',
        dataType: 'json',
        context: this,
        success: function (data) {
          this.set('content', data.partitions);
        }
      });
    },

    startInterval: function() {
      this._intervalId = setInterval($.proxy(this.load, this), 500);
    },

    cancelInterval: function() {
      if(this._intervalId) {
        clearInterval(this._intervalId);
      }
    },

    ringStructure: function() {
      var content = this.get('content');

      return {
        name: 'ring',
        children: content
      };
    }.property('content')
  });

});
