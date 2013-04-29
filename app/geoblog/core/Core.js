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

		var isBuilder = false,
			blogSelector = "#blog";

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
				blog: new BlogView(blogSelector,"title","content")
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
			app.blogData.init(app.blogLayer);

			//Add post editor
			if(isBuilder){
				require(["storymaps/geoblog/builder/BlogEditor"], function(BlogEditor){
					app.editor = new BlogEditor(blogSelector,app.map,function(blog){
						var graphic,
							pt;
						
						if ($.parseJSON(blog.geometry)){
							pt = $.parseJSON(blog.geometry);
						}
						else{
							pt = new esri.geometry.Point(0, 0);
						}

						graphic = new esri.Graphic(pt,null,blog);

						console.log(blog);

						app.blogData.saveNewBlogPost(graphic,function(){;
							app.editor.discardEditor();
						});
					});
				});

				app.editor.init();
			}
		}

		function initializeApp(response)
		{			
			loadBlog();
			setupBanner(response.itemInfo.item.title,response.itemInfo.item.snippet);
			$(".loader").fadeOut();
		}

		return {
			init: init
		}
	}
);