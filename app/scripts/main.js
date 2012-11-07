
//DOM ready
$(document).ready(function(){

	window.uiDataModel = Backbone.Model.extend({
		defaults: {
			image: localStorage.img,
			imageColor: [],
			sortMode: 'no-sort',
			res: 100,
			remix: 1,
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
			_.bindAll(this, 'render','updatePhoto');
			this.vent = options.vent;
			this.bind('progress', this.progress);
			this.bind('complete', this.complete);
			options.vent.bind("updatePhoto", this.updatePhoto);
		},
		render: function(){
			var that = this,
			canvas = this.el,
			ctx = canvas.getContext("2d"),
			model = this.model,
			width = model.get('cWidth'),
			height = model.get('cHeight'),
			url = model.get('image');

			$(canvas).attr({
				'width': width,
				'height': height
			})

			var image = new Image(); 
			image.onload = function() {
				ctx.drawImage(image, 0, 0, width, height);
				imageData = ctx.getImageData(0, 0, width, height).data;

				var colors = [];

				for (var i=0; i<imageData.length; i += 4) {
						
					var rgb = [imageData[i], imageData[i +1], imageData[i+2]];
					var hsl = RGBToHSL(rgb);

					colors[i] = hsl[0];
					colors[i+1] = hsl[1];
					colors[i+2] = hsl[2];
					colors[i+3] = 1;
				}

				model.set({imageColor: colors})	

				that.trigger('complete')
			}


			image.src = url;
			this.trigger('progress')

			function RGBToHSL(rgb){
				var r = rgb[0], g = rgb[1], b = rgb[2];

				 r /= 255, g /= 255, b /= 255;
				    var max = Math.max(r, g, b), min = Math.min(r, g, b);
				    var h, s, l = (max + min) / 2;

				    if(max == min){
				        h = s = 0; // achromatic
				    }else{
				        var d = max - min;
				        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
				        switch(max){
				            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
				            case g: h = (b - r) / d + 2; break;
				            case b: h = (r - g) / d + 4; break;
				        }
				        h /= 6;
				    }

				    return [Math.floor(h * 360), Math.floor(s * 100), Math.floor(l * 100)];
			}

			return this;
		},
		progress: function(){
			this.vent.trigger("progress", this.model);
			console.log('progress')

		},
		complete: function(){
			this.vent.trigger("complete", this.model);
			console.log('complete')
		},
		updatePhoto: function(){
			this.render();
		}
	});

	window.controlView = Backbone.View.extend({
    tagName: 'div', 
    className: 'controls',
	template: $('#controls-template').html(),
	events: {
	    'mouseup #resolution': 'resolution',
	    'mouseup #remix': 'remix',
	    'click #save-image': 'saveImage',
	    'dragover #dropzone': 'zoneDragover',
	    'drop #dropzone': 'zoneDrop',
	    'change #sort-by': 'sortBy'
  	},
    initialize: function(options){
      _.bindAll(this, 'render','resolution','progress','complete','zoneDrop');
      options.vent.bind("progress", this.progress);
      options.vent.bind("complete", this.complete);
      this.bind('updatePhoto', this.updatePhoto);
      this.vent = options.vent;
    },
    render: function(){
	  	$(this.el).html(Mustache.to_html(this.template, this.model.toJSON()));

	  	var h = $(window).height(),
			w = $(window).width() - 260;
			this.model.set({cWidth: w, cHeight: h});

			var bufferCanvas = new bufferCanvasView({model: this.model, vent: vent});
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
    	this.vent.trigger('updateUI', this.model);
    },
    remix: function(evt){
    	var target = $(evt.currentTarget),
    	remix = target.val();
    	this.model.set({remix: remix});
    	this.vent.trigger('updateUI', this.model);
    },
    saveImage: function(){
    	this.vent.trigger('saveImage', this.model);
    },
    zoneDragover:function(event){
		event.stopPropagation();
	  	event.preventDefault();
    },
    zoneDrop: function(e){
    	e.stopPropagation();
		e.preventDefault();

		this.trigger("zoneDrop", e.originalEvent.dataTransfer);
		var files = e.originalEvent.dataTransfer.files,
			that = this;

	    // Loop through the FileList and render image files as thumbnails.
	    for (var i = 0, f; f = files[i]; i++) {

	      // Only process image files.
	      if (!f.type.match('image.*')) {
	        continue;
	      }

	      var reader = new FileReader();

	      // Closure to capture the file information.
	      reader.onload = (function(theFile) {
	        return function(e) {
	          // Render thumbnail.
	          // var span = document.createElement('span');
	          // span.html().remove();
	          // span.innerHTML = ['<img class="thumb" src="', e.target.result,
	          //                   '" title="', escape(theFile.name), '"/>'].join('');

	          // document.getElementById('list').insertBefore(span, null);
	          
	          localStorage.setItem('img', e.target.result);
	          that.render();
	          	
	        };
	      })(f);

	      // Read in the image file as a data URL.
	      reader.readAsDataURL(f);


	    }
	    this.trigger('updatePhoto')
	    this.vent.trigger('updateUI', that.model);
	    this.render();

    },
	updatePhoto: function(){
		this.vent.trigger('updatePhoto', this.model);
		console.log('update photo')
	},
    sortBy: function(evt){
    	var target = $(evt.currentTarget),
    		checked = target.find(':checked'),
    		sortMode = checked.attr('value')
    	this.model.set({sortMode: sortMode});
    	this.vent.trigger('updateUI', this.model);
    },
    progress: function(){
    	$(this.el).find('#thumbnail').addClass('load').prepend('<span class="loadingText">Loading...</span>');
    },
    complete: function(){
    	$(this.el).find('#thumbnail').removeClass('load');
    	$(this.el).find('.loadingText').addClass('hide');
    	this.vent.trigger('updateUI', this.model);
    }
  });

	window.canvasView = Backbone.View.extend({
    tagName: 'canvas', 
    template: $('#canvas-template').html(),
    initialize: function(options){
      	_.bindAll(this, 'render','updateUI','saveImage'); 
		options.vent.bind('updateUI', this.updateUI);
		options.vent.bind('saveImage', this.saveImage);
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
						color = data.get('imageColor'),
						sortMode = data.get('sortMode'),
						res = data.get('res'),
						remix = data.get('remix');

				$(canvas).attr({
					'width': width,
					'height': height
				})

				var tileCount = res,
						tempW = width / tileCount,
						tempH = height / tileCount,
						rectWidth = Math.floor(tempW),
						rectHeight = Math.floor(tempH),
						colorSort = [];

				// if (remix>1){
				// 	width = width/(remix*.05);
				// }

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

				var c;

				switch(sortMode){
					case 'no-sort': c = 3 ; break;
					case 'hue': c = 0 ; break;
					case 'saturation': c = 1 ; break;
					case 'lightness': c = 2 ; break;
						
				}
				colorSort = colorGrid.sort(function (one, other) {
						   		return other[c] - one[c];
							});

				// draw grid
				i = 0;
				for (var gridY=0; gridY<tileCount; gridY++) {
				  for (var gridX=0; gridX<tileCount; gridX++) {
				  	var hsl = colorSort[i],
				  			h = hsl[0],
				  			s = hsl[1],
				  			l = hsl[2];

				    ctx.fillStyle ='hsl('+h+','+s+'%,'+l+'%)';
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
	  },
	  saveImage: function(){
	  	var oCanvas = this.el;
	  	Canvas2Image.saveAsPNG(oCanvas);
	  }
  });


	window.appView = Backbone.View.extend({
		el: 'body',
		initialize: function(options){
			_.bindAll(this, "progress", "complete");
			options.vent.bind("progress", this.progress);
			options.vent.bind("complete", this.complete);
			this.render();
		},
  		render: function(){
			var controls = new controlView({model: new uiDataModel, vent: vent});
      		$(this.el).append(controls.render().el);

			var canvas = new canvasView({model: new canvasModel, vent: vent});
      			$(this.el).append(canvas.render().el);
    	},
    	progress: function(){
    		$(this.el).addClass('loading')
    	},
    	complete: function(){
    		$(this.el).removeClass('loading')
    	}

	});

  var app = new appView({vent: vent});

});
