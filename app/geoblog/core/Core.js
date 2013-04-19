define(["esri/map",
		"esri/arcgis/utils",
		"esri/layout",
		"esri/widgets",
		"storymaps/utils/Helper",
		"storymaps/geoblog/core/BlogData",
		"storymaps/geoblog/ui/BlogView",
		"dojo/has"],
	function(
		Map,
		Utils,
		Layout,
		Widgets,
		Helper,
		BlogData,
		BlogView,
		Has)
	{
		/**
		 * Core
		 * @class Core
		 *
		 * Geoblog viewer Main class
		 */

		//
		// Initialization
		//

		var isBuilder = false;

		$(window).resize(function(){
			Helper.resetLayout();
		});

		$(document).ready(function(){
			Helper.resetLayout();
			$(".loader").fadeIn();
		});

		function init()
		{
			app = {
				//Esri map variable
				map: null,
				//Feature services layer holding blog posts
				blogLayer: new esri.layers.FeatureLayer(configOptions.featureService),
				blogData: new BlogData(configOptions.reverseOrder),
				blog: new BlogView("#inner-blog","title","content",function(){
					if(app.blogScroll){
						$("img").load(function(){
							app.blogScroll.refresh();
						});
					}
				}),
				blogScroll: null
			}

			if (!configOptions.sharingurl) {
				if(location.host.match("localhost") || location.host.match("storymaps.esri.com") || location.host.match("c9.io"))
					configOptions.sharingurl = "http://www.arcgis.com/sharing/rest/content/items";
				else
					configOptions.sharingurl = location.protocol + '//' + location.host + "/sharing/content/items";
			}

			if (configOptions.geometryserviceurl && location.protocol === "https:")
				configOptions.geometryserviceurl = configOptions.geometryserviceurl.replace('http:', 'https:');

			esri.arcgis.utils.arcgisUrl = configOptions.sharingurl;
			esri.config.defaults.io.proxyUrl = configOptions.proxyurl;
			esri.config.defaults.geometryService = new esri.tasks.GeometryService(configOptions.geometryserviceurl);

			var urlObject = esri.urlToObject(document.location.href);
			urlObject.query = urlObject.query || {};

			if (urlObject.query.edit || urlObject.query.edit === "") {
				isBuilder = true;
			}

			loadMap();
			loadBlog();
		}

		function setupBanner(title,subtitle)
		{
			$("#title").html(configOptions.title || title);
			$("#subtitle").html(configOptions.subtitle || subtitle);
		}

		function loadMap()
		{
			var mapDeferred = esri.arcgis.utils.createMap(configOptions.webmap,"map",{
				mapOptions: {
					sliderPosition: "top-right"
				}
			});

			mapDeferred.addCallback(function(response){
				app.map = response.map;

				if (app.map.loaded){
					initializeApp(response);
				}
				else {
					dojo.connect(app.map, "onLoad", function() {
						initializeApp(response);
					});
				}

			});
		}

		function loadBlog()
		{


			if(Has("ie") <= 8){
				//TODO: IE 7/8 Scrolling method
			}
			else{
				app.blogScroll = new iScroll("blog",{
					useTransform: false
				});
				//Change wheel event to increase scroll speed
				app.blogScroll._wheel = function (e) {
					var that = this,
						wheelDeltaX, wheelDeltaY,
						deltaX, deltaY,
						deltaScale;

					if ('wheelDeltaX' in e) {
						wheelDeltaX = e.wheelDeltaX / 12;
						wheelDeltaY = e.wheelDeltaY / 12;
					} else if('wheelDelta' in e) {
						wheelDeltaX = wheelDeltaY = e.wheelDelta / 12;
					} else if ('detail' in e) {
						wheelDeltaX = wheelDeltaY = -e.detail * 3;
					} else {
						return;
					}
					
					deltaX = that.x + wheelDeltaX;
					deltaY = that.y + (wheelDeltaY * 5);

					if (deltaX > 0) deltaX = 0;
					else if (deltaX < that.maxScrollX) deltaX = that.maxScrollX;

					if (deltaY > that.minScrollY) deltaY = that.minScrollY;
					else if (deltaY < that.maxScrollY) deltaY = that.maxScrollY;

					if (that.maxScrollY < 0) {
						that.scrollTo(deltaX, deltaY, 0);
					}
				}
			}

			//Add post editor
			if(isBuilder){
				require(["storymaps/geoblog/builder/BlogEditor"], function(BlogEditor){
					app.editor = new BlogEditor("#inner-blog");
				});

				app.editor.init();
			}
		}

		function initializeApp(response)
		{
			setupBanner(response.itemInfo.item.title,response.itemInfo.item.snippet);
			$(".loader").fadeOut();
		}

		return {
			init: init
		}
	}
);