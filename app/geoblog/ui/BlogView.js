define(["storymaps/utils/multiTips/MultiTips","storymaps/utils/Helper"],
	function(MultiTips,Helper)
	{
		/**
		 * BlogView
		 * @class BlogView
		 *
		 * Class to compile blog attributes into DOM Display
		 *
		 *REQUIRES: Jquery 1.9.1 or above
		 */

		return function BlogView(mapWrapper,selector,map,blogLayer,earliestYear,cumulativeTime,statusAttr,titleAttr,contentAttr,timeAttr,mapAttr,dataAttr,iconHeight,loadCallback)
		{
			var _mapTips = null,
				_homeExtent = null,
				_homeMapState = null,
				_originalMap = map;

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
				arrangeMaps(_homeMapState.mapState.webmap).then(function(){
					goToMapState(_homeMapState.mapState,_homeMapState.displayPoints,_homeMapState.homeState,_homeMapState.time);
				});
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
				if(!editing && graphics[index]){

					var selectedEl = elements.eq(index),
						selectedGrp = graphics[index],
						mapState = $.parseJSON(selectedGrp.attributes[mapAttr]),
						data = $.parseJSON(selectedGrp.attributes[dataAttr]),
						speed = 200,
						defaultTime = selectedGrp.attributes[timeAttr];

					//Set Blog State
					elements.removeClass("active");
					selectedEl.addClass("active");
					

					arrangeMaps(mapState.webmap).then(function(){

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
							var index = $(this).attr("data-map-state-link");
							var webmap = data.textLinks[index].mapState.webmap;
							arrangeMaps(webmap).then(function(){
								goToMapState(data.textLinks[index].mapState,alwaysDisplayPoints,false,defaultTime);
							});
						});
						goToMapState(mapState,alwaysDisplayPoints,true,defaultTime);
					});

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

			function arrangeMaps(mapId)
			{
				var deferred = new dojo.Deferred();

				if(mapId){
					if($("#map-" + mapId).length > 0){
						$(".map").removeClass("active");
						$("#map-" + mapId).addClass("active");
						if(!app.editor){
							$(".legend").hide();
							$("#legend-" + mapId).show();
						}
						map = $("#map-" + mapId).data("map");
						if(app.editor){
							app.editor.refreshEditor(map);
						}
						deferred.resolve();
					}
					else{
						loadNewMap(mapId).then(function(){
							$(".map").removeClass("active");
							$("#map-" + mapId).addClass("active");
							if(!app.editor){
								$(".legend").hide();
								$("#legend-" + mapId).show();
							}
							map = $("#map-" + mapId).data("map");
							if(app.editor){
								app.editor.refreshEditor(map);
							}
							deferred.resolve();
						});
					}
				}
				else{
					$(".map").removeClass("active");
					$("#map").addClass("active");
					$(".legend").hide();
					$("#legend").show();
					map = _originalMap;
					if(app.editor){
						app.editor.refreshEditor(map);
					}
					deferred.resolve();
				}

				return deferred;
			}

			function loadNewMap(mapId)
			{
				var deferred = new dojo.Deferred();

				$(".loader").fadeIn();

				$(mapWrapper).append('<div id="map-' + mapId + '" class="map region-center" webmap="' + mapId + '"></div>');

				Helper.resetLayout();

				var popup = $("#application-window").width() > 768 ? null : new esri.dijit.PopupMobile(null,dojo.create("div"));

				var mapDeferred = esri.arcgis.utils.createMap(mapId,"map-" + mapId,{
					mapOptions: {
						sliderPosition: "top-right",
						infoWindow: popup
					}
				});

				mapDeferred.addCallback(function(response){
					var map = response.map;
					if($("#application-window").width() <= 768){
						dojo.place(popup.domNode, map.root);
					}

					map.blogLayer = blogLayer;
					//map.addLayer(map.blogLayer);

					$("#map-" + mapId).data("map",map);

					dojo.connect(map,"onUpdateEnd",function(){
						if($(".loader").is(":visible")){
							$(".loader").fadeOut();
						}
					});

					var layers = esri.arcgis.utils.getLegendLayers(response);

					if (map.loaded){
						deferred.resolve();
						addDijits(map,layers,mapId);
					}
					else {
						dojo.connect(map, "onLoad", function() {
							deferred.resolve();
							addDijits(map,layers,mapId);
						});
					}
				});

				return deferred;
			}

			function addDijits(map,layers,mapId)
			{

				if(!app.editor){
					$(".legend-content").append('<div id="legend-' + mapId + '" class="legend"></div>');
					$("#legend-" + mapId).show();

					if (layers.length > 0) {
						var legend = new esri.dijit.Legend({
							map:map,
							layerInfos: layers
						},"legend-" + mapId);
						legend.startup();
					}
					else{
						$("#legend-" + mapId).html("No legend");
					}
				}

				$(".esriSimpleSliderIncrementButton").each(function(){
					if(!$(this).hasClass("zoomButtonIn") && !$(this).hasClass("initExtentButton")){
						$(this).addClass("zoomButtonIn");
						$(".zoomButtonIn").last().after("<div class='esriSimpleSliderIncrementButton initExtentButton'><img style='margin-top:5px' src='resources/images/app/home.png'></div>");
						$(".initExtentButton").click(function(){
							app.blog.goToHomeState();
						});
					}
				});
			}

			function addLayerSelector()
			{
				$(legendToggleSelector).html("CHOOSE VISIBLE LAYERS");

				$(legendContentSelector).empty();

				dojo.forEach(map.layerIds,function(id){
					var visible = map.getLayer(id).visible;

					$(legendContentSelector).last().prepend(
						'<label class="checkbox">\
							<input type="checkbox" class="layer-select" value="'+id+'"> '+id+'\
						</label><br>');

					if(map.getLayer(id).visible)
						$(".layer-select").first().prop("checked",visible);

					$(".layer-select").first().click(function(){
						if($(this).is(":checked")){
							map.getLayer($(this).val()).show();
						}
						else{
							map.getLayer($(this).val()).hide();
						}
					});
				});

				dojo.forEach(map.graphicsLayerIds,function(id){
					var visible = map.getLayer(id).visible;

					$(legendContentSelector).last().prepend(
						'<label class="checkbox">\
							<input type="checkbox" class="layer-select" value="'+id+'"> '+id+'\
						</label><br>');

					if(map.getLayer(id).visible)
						$(".layer-select").first().prop("checked",visible);

					$(".layer-select").first().click(function(){
						if($(this).is(":checked")){
							map.getLayer($(this).val()).show();
						}
						else{
							map.getLayer($(this).val()).hide();
						}
					});
				});
			}
		}

	}
);