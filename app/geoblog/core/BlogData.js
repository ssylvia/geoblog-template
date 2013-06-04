define([],
	function()
	{
		/**
		 * BlogView
		 * @class BlogData
		 *
		 * Blog data model
		 *
		 *REQUIRES: Jquery 1.9.1 or above
		 */

		return function BlogData(isBuilder,draftVisible,hiddenVisible,orderBy,queryCount)
		{
			var _this = this,
				_featureLayer,
				_featureIds,
				_upddateFromSave = false,
				_queryIndex = 0,
				_queryCount = queryCount,
				_blogPostGraphics,
				_blogPostElements,
				_selectedGraphic,
				_selectedElement,
				_selctedIndex,
				_startPosition = 0;
				_events = {
					onQueryComplete: null
				};

			this.init = function(featureLayer,onQueryComplete)
			{
				_featureLayer = featureLayer;
				_events.onQueryComplete = onQueryComplete;

				queryFeatureIds();
			}

			this.updateQuery = function()
			{
				queryFeatureIds();
			}

			function queryFeatureIds()
			{
				var date = new Date();
				var dateVal = date.valueOf();
				var query = new esri.tasks.Query();
					if(isBuilder && hiddenVisible() && draftVisible()){
						query.where = "status='Published' OR status='Draft' OR status='Hidden' OR ISNUMERIC(status)=1";
					}
					else if(isBuilder && draftVisible()){
						query.where = "status='Published' OR status='Draft' OR ISNUMERIC(status)=1";
					}
					else if(isBuilder && hiddenVisible()){
						query.where = "status='Published' OR status='Hidden' OR ISNUMERIC(status)=1";
					}
					else if(isBuilder){
						query.where = "status='Published' OR ISNUMERIC(status)=1";
					}
					else{
						query.where = "status='Published' OR (ISNUMERIC(status)=1 AND status<=" + dateVal + ")";
					}
					query.orderByFields = [orderBy];

				_featureLayer.queryIds(query,function(objectIds){
					_featureIds = objectIds;
					queryFeatureService();
				},
				function(error){
					dojo.forEach(error.details,function(message){
						console.log("Error: " + message);
					});
				});
			}

			function queryFeatureService()
			{
				_selctedIndex = null;

				if (_upddateFromSave){
					if(typeof _upddateFromSave === 'number' && isFinite(_upddateFromSave)){
						_startPosition = _upddateFromSave;
					}
					else{
						if(orderBy.search("DESC") >= 0){
							_queryIndex = 0;
							_startPosition = 0;
						}
						else{
							var remainder = _featureIds.length % _queryCount;
							_queryIndex = _featureIds.length - remainder;
							_startPosition = "bottom";
						}
					}
					_upddateFromSave = false;
				}

				if(_queryIndex === 0){
					$(".page-button.page-up").hide();
					if(_featureIds.length < _queryCount){
						$(".page-button.page-down").hide();
					}
					else{
						$(".page-button.page-down").show();
					}
				}
				else if(_featureIds.length - _queryIndex <= _queryCount){
					$(".page-button.page-up").show();
					$(".page-button.page-down").hide();
				}
				else{
					$(".page-button.page-up").show();
					$(".page-button.page-down").show();
				}

				var query = new esri.tasks.Query();
					query.returnGeometry = true;
					query.outFields = ["*"];
					query.orderByFields = [orderBy];
					query.objectIds = _featureIds.slice(_queryIndex,_queryIndex + _queryCount);

				_featureLayer.queryFeatures(query,function(result){
					_blogPostGraphics = result.features;
					if(_startPosition === "bottom"){
						_startPosition = _blogPostGraphics.length - 1;
					}
					_events.onQueryComplete(_blogPostGraphics,_startPosition);
					_startPosition = 0;
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
				if(_queryIndex + _queryCount < _featureIds.length){
					_queryIndex+=_queryCount;
					queryFeatureService();
				}
			}

			this.goToPrevPage = function()
			{
				prevPage();
			}

			function prevPage()
			{
				if(_queryIndex != 0){
					if(_queryIndex - _queryCount < 0){
						_queryIndex = 0;
					}
					else{
						_queryIndex-=_queryCount;
					}
					_startPosition = "bottom";
					queryFeatureService();
				}
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
				_blogPostElements.each(function(i){
					$(this).data("graphicAttributes",_blogPostGraphics[i].attributes)
				});
			}

			this.setPostByIndex = function(index,editing,onSelect)
			{
				if(index != undefined && index != _selctedIndex){
					_selectedElement = _blogPostElements.eq(index);
					_selectedGraphic = _blogPostGraphics[index];
					_selctedIndex = index;
					onSelect(_selctedIndex,_blogPostGraphics,_blogPostElements,editing);
				}
			}

			this.editBlogPosts = function(adds,edits,deletes,position,onComplete)
			{
				_featureLayer.applyEdits(adds,edits,deletes,function(){

					if(adds){
						_upddateFromSave = true;
					}
					else if(position){
						_upddateFromSave = position;
					}
					else{
						_upddateFromSave = false;
					}
					
					onComplete();
					queryFeatureIds();
				},function(error){
					console.log("Error: " + error.details);
				});

				if(!_featureLayer.getEditCapabilities().canCreate && adds){
					alert("Error: You do not have permissions to add new blog posts.");
				}
				if(!_featureLayer.getEditCapabilities().canUpdate && edits){
					alert("Error: You do not have permissions to edit this blog post.");
				}
				if(!_featureLayer.getEditCapabilities().canDelete && deletes){
					alert("Error: You do not have permissions to delete this blog post.");
				}
			}

			this.getSelectedIndex = function()
			{
				return _selctedIndex;
			}

			this.getBlogElements = function()
			{
				return _blogPostElements;
			}
		}

	}
);