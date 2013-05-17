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

		return function BlogData(orderBy,queryCount)
		{
			var _this = this,
				_featureLayer,
				_featureIds,
				_queryIndex = 0,
				_queryCount = queryCount,
				_blogPostGraphics,
				_blogPostElements,
				_selectedGraphic,
				_selectedElement,
				_selctedIndex,
				_events = {
					onQueryComplete: null
				};

			this.init = function(featureLayer,onQueryComplete)
			{
				_featureLayer = featureLayer;
				_events.onQueryComplete = onQueryComplete;

				queryFeatureIds();
			}

			function queryFeatureIds()
			{
				var query = new esri.tasks.Query();
					query.where = "1=1";
					query.orderByFields = [orderBy];

				_featureLayer.queryIds(query,function(objectIds){
					_featureIds = objectIds;
					queryFeatureService();
				},
				function(error){
					console.log("Error: " + error.message);
				});
			}

			function queryFeatureService()
			{
				var query = new esri.tasks.Query();
					query.returnGeometry = true;
					query.outFields = ["*"];
					query.orderByFields = [orderBy];
					query.objectIds = _featureIds.slice(_queryIndex,_queryIndex + _queryCount);

				_featureLayer.queryFeatures(query,function(result){
					_blogPostGraphics = result.features;
					_events.onQueryComplete(_blogPostGraphics);
				},
				function(error){
					console.log("Error: " + error.details);
				});

			}

			this.goToNextPage = function()
			{
				nextPage();
			}

			function nextPage()
			{
				if(_queryIndex + _queryCount >= _featureIds.length){
					_queryIndex = 0;
				}
				else{
					_queryIndex+=_queryCount;
				}
				queryFeatureService();
			}

			this.goToPrevPage = function()
			{
				prevPage();
			}

			function prevPage()
			{
				if(_queryIndex - _queryCount < 0){
					_queryIndex = _featureIds.length - _queryCount;
				}
				else{
					_queryIndex-=_queryCount;
				}
				queryFeatureService();
			}

			this.goToPageByItem = function(OID,scrollItem)
			{
				pageByItem(OID,scrollItem);
			}

			function pageByItem(OID,scrollItem)
			{
				var index = $.inArray(OID,_featureIds);

				if(index < _queryIndex || index >= _queryIndex + _queryCount){
					_queryIndex = index;
					queryFeatureService();
				}
				else{
					var newItem = index - _queryIndex;
					scrollItem(newItem);
				}
			}			

			this.setBlogElements = function(elements,index,onSet)
			{
				_blogPostElements = elements;
			}

			this.setPostByIndex = function(index,editing,onSelect)
			{
				if(index != undefined && index !== _selctedIndex){
					_selectedElement = _blogPostElements.eq(index);
					_selectedGraphic = _blogPostGraphics[index];
					_selctedIndex = index;

					onSelect(_selctedIndex,_blogPostGraphics,_blogPostElements,editing);
				}
			}

			this.saveNewBlogPost = function(feature,onComplete)
			{
				if(_featureLayer.getEditCapabilities().canCreate){
					_featureLayer.applyEdits([feature],null,null,function(){

						var newIndex = 0;

						if(_featureIds.length - _queryCount - 1 > newIndex){
							newIndex = _featureIds.length - _queryCount - 1
						}

						_queryIndex = newIndex;
						
						onComplete();

						queryFeatureIds();
					},function(error){
						console.log("Error: " + error.details);
					});
				}
				else{
					//TODO: apply bootstrap modal
					alert("Error: Your feature service layer is not editable!");
				}
			}

			this.getSelectedIndex = function()
			{
				return _selctedIndex;
			}
		}

	}
);