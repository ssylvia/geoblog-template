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

		return function BlogView(selector,map,blogLayer,earliestYear,cumulativeTime,statusAttr,titleAttr,contentAttr,timeAttr,mapAttr,dataAttr,iconHeight,loadCallback)
		{
			var _mapTips = null,
				_homeExtent = null,
				_homeMapState = null;

			this.update = function(blogPosts) 
			{
				_blogPostGraphics = blogPosts;

				$(".geoblog-post").remove();

				var editEl = $(selector).children().first();

				dojo.forEach(blogPosts,function(post){
					createBlogPost(editEl,post.attributes[statusAttr],post.attributes[contentAttr],post.attributes[titleAttr],post.attributes[blogLayer.objectIdField]);
				});

				stButtons.makeButtons();

				loadCallback();
			}

			this.getHomeExtent = function()
			{
				return _homeExtent;
			}

			this.goToHomeState = function()
			{
				goToMapState(_homeMapState.mapState,_homeMapState.displayPoints,_homeMapState.homeState,_homeMapState.time);
			}

			this.getMultiTips = function()
			{
				return _mapTips;
			}

			function createBlogPost(editEl,status,blogContent,title,blogId)
			{
				var content = unescape(blogContent);
				
				var shareTitle = title || app.shareSettings.title;
				var shareSummary = app.shareSettings.summary;
				var shareURL = app.shareSettings.url + blogId;

				var elementStr;
				if(status === "Draft"){
					elementStr = '<div class="geoblog-post draft-post">'+content+'</div>';
				}
				else if(status === "Hidden"){
					elementStr = '<div class="geoblog-post hidden-post">'+content+'</div>';
				}
				else{
					elementStr = '<div class="geoblog-post">\
						'+content+'\
						<div class="blog-post-social-wrapper blog-item">\
							<span class="st_facebook" st_title="'+shareTitle+'" st_summary="'+shareSummary+'" st_url="'+shareURL+'" displayText="Facebook"></span>\
							<span class="st_twitter" st_title="'+shareTitle+'" st_summary="'+shareSummary+'" st_url="'+shareURL+'" st_via="" displayText="Tweet"></span>\
							<span class="st_googleplus" st_title="'+shareTitle+'" st_summary="'+shareSummary+'" st_url="'+shareURL+'" displayText="Google +"></span>\
							<span class="st_sharethis" st_title="'+shareTitle+'" st_summary="'+shareSummary+'" st_url="'+shareURL+'" displayText="Other"></span>\
						</div>\
					</div>';
				}

				if(editEl.length > 0){
					editEl.before(elementStr);
				}
				else{
					$(selector).append(elementStr);
				}
			}

			this.selectPost = function(index,graphics,elements,alwaysDisplayPoints,editing)
			{
				if(!editing){

					var selectedEl = elements.eq(index),
						selectedGrp = graphics[index],
						mapState = $.parseJSON(selectedGrp.attributes[mapAttr]),
						data = $.parseJSON(selectedGrp.attributes[dataAttr]),
						speed = 200,
						defaultTime = selectedGrp.attributes[timeAttr];

					//Set Blog State
					elements.removeClass("active");
					selectedEl.addClass("active");

					if(_mapTips != null){
						_mapTips.clean();
					}
					if(selectedGrp.attributes.geometry != "false"){
						_mapTips = new MultiTips({
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

					$(".map-state-link").unbind("click");
					$(".map-state-link").click(function(){
						goToMapState(data.textLinks[$(this).attr("data-map-state-link")].mapState,alwaysDisplayPoints,false,defaultTime);
					});

					goToMapState(mapState,alwaysDisplayPoints,true,defaultTime);

					_homeMapState = {
						mapState: mapState,
						displayPoints: alwaysDisplayPoints,
						homeState: true,
						time: defaultTime
					}

					$(".post-index-bullet").removeClass("active");
					$(".post-index-bullet").eq(index).addClass("active");

				}

			}

			function goToMapState(mapState,alwaysDisplayPoints,homeExtent,defaultTime)
			{
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

				toggleVisibleLayers(mapState.visibleLayers);

				var timeStamp = defaultTime;
				if(mapState.timeStamp){
					timeStamp = mapState.timeStamp;
				}

				//Set TimeExtent
				if(cumulativeTime){
					map.setTimeExtent(new esri.TimeExtent(new Date(earliestYear),new Date(timeStamp)));
				}
				else{
					map.setTimeExtent(new esri.TimeExtent(new Date(timeStamp),new Date(timeStamp)));
				}

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
					
				if(homeExtent){
					_homeExtent = extent;
				}
			}

			function toggleVisibleLayers(visibleLayers)
			{
				//TODO: fade layers
				if (visibleLayers){

					dojo.forEach(map.layerIds,function(id){
						if ($.inArray(id,visibleLayers) >= 0){
							map.getLayer(id).show();
						}
						else{
							map.getLayer(id).hide();
						}
					});

					dojo.forEach(map.graphicsLayerIds,function(id){
						if ($.inArray(id,visibleLayers) >= 0){
							map.getLayer(id).show();
						}
						else{
							map.getLayer(id).hide();
						}
					});

				}
				else{
					dojo.forEach(map.layerIds,function(id){
						map.getLayer(id).hide();
					});

					dojo.forEach(map.graphicsLayerIds,function(id){
						map.getLayer(id).hide();
					});
				}
			}
		}

	}
);