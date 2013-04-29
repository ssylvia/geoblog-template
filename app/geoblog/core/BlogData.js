define([],
	function()
	{
		/**
		 * BlogView
		 * @class BlogView
		 *
		 * Blog data model
		 */

		return function BlogData(reverseOrder)
		{
			var _this = this,
				_featureLayer,
				_blogPost;

			this.init = function(featureLayer)
			{
				_featureLayer = featureLayer;

				queryFeatureService();
			}

			function queryFeatureService()
			{
				var queryTask = new esri.tasks.QueryTask(_featureLayer.url);

				var query = new esri.tasks.Query();
				query.returnGeometry = false;
				query.outFields = ["*"];
				query.where = "1=1";

				queryTask.execute(query,function(result){
					_blogPost = result.features;
					console.log(_blogPost);
				},
				function(error){
					console.log("Error: " + error.details);
				});

			}

			this.saveNewBlogPost = function(feature,onComplete)
			{
				if(_featureLayer.capabilities.search("Editing") >= 0){
					_featureLayer.applyEdits([feature],null,null,onComplete,function(error){
						console.log("Error: " + error.details);
					});
				}
				else{
					//TODO: make prettier
					alert("Error: Your feature service layer is not editable!");
				}
			}
		}

	}
);