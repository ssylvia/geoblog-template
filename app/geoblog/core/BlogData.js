define([],
	function()
	{
		/**
		 * BlogView
		 * @class BlogView
		 *
		 * Blog data model
		 *
		 *REQUIRES: Jquery 1.9.1 or above
		 */

		return function BlogData(reverseOrder)
		{
			var _this = this,
				_featureLayer,
				_blogPostGraphics,
				_blogPostElements,
				_events = {
					onQueryComplete: null
				}

			this.init = function(featureLayer,onQueryComplete)
			{
				_featureLayer = featureLayer;
				_events.onQueryComplete = onQueryComplete;

				queryFeatureService();
			}

			function queryFeatureService()
			{
				var queryTask = new esri.tasks.QueryTask(_featureLayer.url);

				var query = new esri.tasks.Query();
				query.returnGeometry = true;
				query.outFields = ["*"];
				query.where = "1=1";

				queryTask.execute(query,function(result){
					_blogPostGraphics = result.features;
					_events.onQueryComplete(_blogPostGraphics);
				},
				function(error){
					console.log("Error: " + error.details);
				});

			}

			this.setBlogElements = function(elements,index)
			{
				_blogPostElements = elements;
				if(index != undefined){
					selectPost(index);
				}
			}

			function selectPost(index)
			{
				_blogPostElements.removeClass("active");
				_blogPostElements.eq(index).addClass("active").fadeTo(200,1);
				_blogPostElements.not(".active").fadeTo(200,.5);
			}

			this.saveNewBlogPost = function(feature,onComplete)
			{
				if(_featureLayer.capabilities.search("Editing") >= 0){
					_featureLayer.applyEdits([feature],null,null,onComplete,function(error){
						console.log("Error: " + error.details);
					});
				}
				else{
					//TODO: apply bootstrap modal
					alert("Error: Your feature service layer is not editable!");
				}
			}
		}

	}
);