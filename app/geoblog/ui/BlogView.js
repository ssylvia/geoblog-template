define(["storymaps/utils/multiTips/MultiTips"],
	function(MultiTips)
	{
		/**
		 * BlogView
		 * @class BlogView
		 *
		 * Class to compile blog attributes into DOM Display
		 *
		 *REQUIRES: Jquery 1.9.1 or above
		 */

		return function BlogView(selector,map,blogLayer,cumulativeTime,contentAttr,timeAttr,mapAttr,iconHeight,loadCallback)
		{
			var mapTips = null;

			this.update = function(blogPosts) 
			{
				_blogPostGraphics = blogPosts;

				$(".geoblog-post").remove();

				var editEl = $(selector).children().first();

				dojo.forEach(blogPosts,function(post){
					createBlogPost(editEl,post.attributes[contentAttr]);
				});

				loadCallback();
			}

			this.selectPost = function(index,graphics,elements,alwaysDisplayPoints,editing)
			{
				if(!editing){

					var selectedEl = elements.eq(index),
						selectedGrp = graphics[index],
						mapState = $.parseJSON(selectedGrp.attributes[mapAttr]),
						speed = 200;

					//Set Blog State
					elements.removeClass("active");
					selectedEl.addClass("active");

					if(mapTips != null){
						mapTips.clean();
					}
					if(selectedGrp.attributes.geometry != "false"){
						mapTips = new MultiTips({
							map: map,
							content: selectedGrp.attributes.title,
							pointArray: [selectedGrp],
							labelDirection: "auto",
							backgroundColor: "#444444",
							pointerColor: "#444444",
							textColor: "#ffffff",
							offsetTop: iconHeight - 8
						});
					}	

					//Set TimeExtent
					if(cumulativeTime){
						map.setTimeExtent(new esri.TimeExtent(new Date(0),new Date(selectedGrp.attributes[timeAttr])));
					}
					else{
						map.setTimeExtent(new esri.TimeExtent(new Date(selectedGrp.attributes[timeAttr]),new Date(selectedGrp.attributes[timeAttr])));
					}

					//TODO: is there a way to query graphic for popup
					map.infoWindow.clearFeatures();
					map.infoWindow.hide();
					if(mapState.infoWindow){
						if(mapState.infoWindow.content !== undefined){
							map.infoWindow.setContent(unescape(mapState.infoWindow.content));
							map.infoWindow.setTitle("");
							map.infoWindow.show(mapState.infoWindow.location);
						}
						else{
							if(mapState.infoWindow.url != undefined){
								var queryTask = new esri.tasks.QueryTask(mapState.infoWindow.url);
								var query = new esri.tasks.Query();
									query.objectIds = [mapState.infoWindow.feature];
									query.returnGeometry = true;
									query.outFields = ["*"];

								queryTask.execute(query,function(result){
									ftr = result.features[0];
									if(ftr.infoTemplate === undefined){
										ftr.setInfoTemplate(map.getLayer(mapState.infoWindow.layerId).infoTemplate);
									}
									map.infoWindow.setFeatures([ftr]);
									map.infoWindow.show(mapState.infoWindow.location);
								});

							}
							else{
								var graphic;
								dojo.forEach(map.getLayer(mapState.infoWindow.layerId).graphics,function(g){
									if(g.attributes[mapState.infoWindow.objectIdField] === mapState.infoWindow.feature){
										graphic = g;
									}
								});

								if(graphic != undefined){
									if(graphic.infoTemplate === undefined){
										graphic.setInfoTemplate(map.getLayer(mapState.infoWindow.layerId).infoTemplate);
									}
									map.infoWindow.setFeatures([graphic]);
									map.infoWindow.show(mapState.infoWindow.location);
								}
							}
						}
					}

					toggleVisibleLayers(mapState.hiddenLayers);

					if(alwaysDisplayPoints){
						blogLayer.show();
					}

					//Set map state
					var extent = new esri.geometry.Extent({
						"xmin":mapState.extent.xmin,
						"ymin":mapState.extent.ymin,
						"xmax":mapState.extent.xmax,
						"ymax":mapState.extent.ymax, 
						"spatialReference":{
							"wkid":mapState.extent.spatialReference.wkid}
						});
					map.setExtent(extent);

					$(".post-index-bullet").removeClass("active");
					$(".post-index-bullet").eq(index).addClass("active");

				}

			}

			function createBlogPost(editEl,blogContent)
			{
				var content = unescape(blogContent);

				if(editEl.length > 0){
					editEl.before('<div class="geoblog-post">'+content+'</div>');
				}
				else{
					$(selector).append('<div class="geoblog-post">'+content+'</div>');
				}
			}

			function toggleVisibleLayers(hiddenLayers)
			{
				//TODO: fade layers
				if (hiddenLayers){

					dojo.forEach(map.layerIds,function(id){
						if ($.inArray(id,hiddenLayers) >= 0){
							map.getLayer(id).hide();
						}
						else{
							map.getLayer(id).show();
						}
					});

					dojo.forEach(map.graphicsLayerIds,function(id){
						if ($.inArray(id,hiddenLayers) >= 0){
							map.getLayer(id).hide();
						}
						else{
							map.getLayer(id).show();
						}
					});

				}
				else{
					dojo.forEach(map.layerIds,function(id){
						map.getLayer(id).show();
					});

					dojo.forEach(map.graphicsLayerIds,function(id){
						map.getLayer(id).show();
					});
				}
			}
		}

	}
);