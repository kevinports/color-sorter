
//DOM ready
$(document).ready(function(){

	window.uiDataModel = Backbone.Model.extend({
		defaults: {
			image: 'cabins.jpg',
			imageColor: [],
			res: 100,
			cWidth: 0,
			cHeight: 0
		}
	});

	window.canvasModel = Backbone.Model.extend({
		defaults: {
			data: null
		}
	});

	window.vent = _.extend({}, Backbone.Events); //event aggregator object

	window.bufferCanvasView = Backbone.View.extend({
		tagName: 'canvas', 
		className: 'buffer-canvas',
		initialize: function(options){
			_.bindAll(this, 'render');
		},
		render: function(){
			var canvas = this.el,
			ctx = canvas.getContext("2d"),
			model = this.model,
			width = model.get('cWidth'),
			height = model.get('cHeight'),
			url = '../img/'+ model.get('image');

			$(canvas).attr({
				'width': width,
				'height': height
			})

			var image = new Image(); 
			image.onload = function() {
				ctx.drawImage(image, 0, 0, width, height);
				imageData = ctx.getImageData(0, 0, width, height);	
				var color = imageData;	
				model.set({imageColor: color})	
			}
			image.src = url;

			return this;
		}
	});

	window.controlView = Backbone.View.extend({
    tagName: 'div', 
    className: 'controls',
		template: $('#controls-template').html(),
		events: {
    'change .control-group': 'updateUI',
    'change #resolution': 'resolution'
  	},
    initialize: function(options){
      _.bindAll(this, 'render','resolution');
      this.vent = options.vent;
    },
    render: function(){
	  	$(this.el).html(Mustache.to_html(this.template, this.model.toJSON()));

	  	var h = $(window).height(),
					w = $(window).width() - 260;
			this.model.set({cWidth: w, cHeight: h});

			var bufferCanvas = new bufferCanvasView({model: this.model});
      $(this.el).append(bufferCanvas.render().el)

      return this; 
    },
    updateUI: function(){
    	this.vent.trigger('updateUI', this.model);
    },
    resolution: function(evt){
    	var target = $(evt.currentTarget),
    	resolution = target.val();
    	this.model.set({res: resolution});
    }
  });

	window.canvasView = Backbone.View.extend({
    tagName: 'canvas', 
    template: $('#canvas-template').html(),
    initialize: function(options){
      _.bindAll(this, 'render','updateUI'); 
			options.vent.bind('updateUI', this.updateUI);
			// this.on('pageLoadUpdate', this.updateUI, this);
    },

	  render: function(){
	  	$(this.el).html(Mustache.to_html(this.template, this.model.toJSON()));

	    var canvas = this.el,
			ctx = canvas.getContext("2d"),
			colorGrid = [];

			if(this.model.get('data')){
				var data = this.model.get('data'),
						width = data.get('cWidth'),
						height = data.get('cHeight'),
						color = data.get('imageColor').data,
						res = data.get('res');

				$(canvas).attr({
					'width': width,
					'height': height
				})

				var tileCount = res,
						tempW = width / tileCount,
						tempH = height / tileCount,
						rectWidth = Math.floor(tempW),
						rectHeight =Math.floor(tempH);

				// get colors from image
				var i = 0;
				for (var gridY=0; gridY<tileCount; gridY++) {
				  for (var gridX=0; gridX<tileCount; gridX++) {
				    var px = Math.floor((gridX * rectWidth)),
				    		py = Math.floor((gridY * rectHeight))
				    		index = ((py ) * (width * 4)) + ((px ) * 4);
				    colorGrid[i] = [color[index], color[index + 1], color[index +2]]
				    i++;
				  }
				}

				// draw grid
				i = 0;
				for (var gridY=0; gridY<tileCount; gridY++) {
				  for (var gridX=0; gridX<tileCount; gridX++) {
				  	var rgb = colorGrid[i],
				  			r = rgb[0],
				  			g = rgb[1],
				  			b = rgb[2];

				    ctx.fillStyle ='rgb('+r+','+g+','+b+')';
				    ctx.fillRect(gridX*tempW, gridY*tempH, tempW+1, tempH+1);
				    i++;
				  }
				}
			}
	    return this;
	  },

	  updateUI: function(UIdata){
	    this.model.set({data: UIdata});
	    this.render();
	  }
  });


	window.appView = Backbone.View.extend({
		el: 'body',
		initialize: function(){
			this.render();
		},
  	render: function(){
			var controls = new controlView({model: new uiDataModel, vent: vent});
      $(this.el).append(controls.render().el);

			var canvas = new canvasView({model: new canvasModel, vent: vent});
      $(this.el).append(canvas.render().el);

      controls.trigger('pageLoadUpdate');
    }

	});

  var app = new appView();

});
