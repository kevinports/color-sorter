appView = Backbone.View.extend({

	el: '.container',
	template: $("#canvas-templat").template(),
	initialize: function(){
		template = _.template($('#canvas-template').html()),
		console.log('canvas view in!')
	},
	render: function() {
	    this.$el.html(this.template({}));
	    return this;
  	},
  	render: function() {
      var element = jQuery.tmpl(this.template, this.model.toJSON());
      $(this.el).html(element);
      this.input = this.$(".todo-input");
      return this;
    }
	events: {
		"click body": "logger"
	},
	logger: function(){
		console.log( 'log event!');
	}

});

