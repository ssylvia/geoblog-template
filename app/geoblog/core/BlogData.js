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
				_selectedGraphic,
				_selectedElement,
				_selctedIndex,
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

			this.setBlogElements = function(elements,index,onSelect)
			{
				_blogPostElements = elements;
				if(index != undefined){
					_selectedElement = _blogPostElements.eq(index);
					_selectedGraphic = _blogPostGraphics[index];
					_selctedIndex = index;

					onSelect(_selctedIndex,_blogPostGraphics,_blogPostElements);
				}
			}

			this.setPostByIndex = function(index,onSelect)
			{
				if(index != undefined){
					_selectedElement = _blogPostElements.eq(index);
					_selectedGraphic = _blogPostGraphics[index];
					_selctedIndex = index;

					onSelect(_selctedIndex,_blogPostGraphics,_blogPostElements);
				}
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