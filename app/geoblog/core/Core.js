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
			resizeBlogElements();
		});

		$(document).ready(function(){
			Helper.resetLayout();
			$(".loader").fadeIn();
		});

		function init()
		{
			var orderByFields = configOptions.sortBy + " " + configOptions.order;

			app = {
				//Esri map variable
				map: null,
				//Feature services layer holding blog posts
				blogLayer: new esri.layers.FeatureLayer(configOptions.featureService,{
					outFields: ["*"]
				}),
				blogData: new BlogData(orderByFields,configOptions.postsPerPage),
				blog: null
			}

			//TODO: move before init
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

				app.map.blogLayer = app.blogLayer
				app.map.addLayer(app.map.blogLayer);

				app.map.legendLayers = esri.arcgis.utils.getLegendLayers(response);

				dojo.connect(app.map.blogLayer,"onUpdateEnd",function(){
					dojo.forEach(app.map.blogLayer.graphics,function(g){
						if(g.attributes.geometry === "false"){
							g.hide();
						}
					});
				});

				dojo.connect(app.map.blogLayer,"onMouseOver",function(){
					app.map.setMapCursor("pointer");
				});

				dojo.connect(app.map.blogLayer,"onMouseOut",function(){
					app.map.setMapCursor("defualt");
				});

				dojo.connect(app.map.blogLayer,"onClick",function(event){
					app.blogData.goToPageByItem(event.graphic.attributes[event.graphic.getLayer().objectIdField],function(index){
						$("#blog").mCustomScrollbar("scrollTo",".geoblog-post:eq(" + index + ")");
					});
				});

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
			app.blog = new BlogView(blogSelector,app.map,configOptions.cumulativeTime,"content","time","mapState",configOptions.iconHeight,function(){
				if($("#blog").data("mCustomScrollbarIndex")){
					$("#blog").mCustomScrollbar("destroy");
				}
				$("#blog").mCustomScrollbar({
					theme: "dark-2",
					scrollInertia: 0,
					callbacks: {
						onScroll: selectPostByScrollPosition
					}
				});
				//Hide Loading animation
				$(".loader").fadeOut();

				$(".blog-post-photo").load(function(){
					$("#blog").mCustomScrollbar("update");
				});

				app.blogData.setBlogElements($(".geoblog-post"));

				$(".geoblog-post").click(function(){
					$("#blog").mCustomScrollbar("scrollTo",".geoblog-post:eq(" + $(this).index() + ")");
				})

				resizeBlogElements();
			});

			app.blogData.init(app.blogLayer,function(graphics){
				app.blog.update(graphics);

				addIndexDots(graphics,true);
			});

			//Add post editor
			if(isBuilder){
				require(["storymaps/geoblog/builder/BlogEditor"], function(BlogEditor){
					app.editor = new BlogEditor(blogSelector,app.map,".legend-toggle",".legend-content",function(blog,geo){
						var graphic,
							pt;
						
						if (geo){
							pt = geo;
						}
						else{
							pt = new esri.geometry.Point(0, 0);
						}

						graphic = new esri.Graphic(pt,null,blog);

						app.blogData.saveNewBlogPost(graphic,function(){;
							app.editor.discardEditor();
						});
					});
				});

				app.editor.init(function(){
					$("#blog").mCustomScrollbar("update");
					$("#blog").mCustomScrollbar("scrollTo","bottom");
				});
			}
			else{
				if (app.map.legendLayers.length > 0) {
					var legend = new esri.dijit.Legend({
						map:app.map,
						layerInfos: app.map.legendLayers
					},"legend");
					legend.startup();
				}
				else{
					$(".legend-toggle").hide();
				}
			}

			$(".nav-button").click(function(){
				if($(this).hasClass("prev-post")){					
					var index;

					if(app.blogData.getSelectedIndex() === 0){
						//TODO: Get previous page
						//index = $(".geoblog-post").length - 1;
						app.blogData.goToPrevPage();
					}
					else{
						index = app.blogData.getSelectedIndex() - 1;
						$("#blog").mCustomScrollbar("scrollTo",".geoblog-post:eq(" + index + ")");
					}
				}
				else{
					var index;
					
					if(app.blogData.getSelectedIndex() === $(".geoblog-post").length - 1){
						//TODO: Get next page
						//index = 0;
						app.blogData.goToNextPage();
					}
					else{
						index = app.blogData.getSelectedIndex() + 1;
						$("#blog").mCustomScrollbar("scrollTo",".geoblog-post:eq(" + index + ")");
					}
				}
			});

			$(".legend-toggle").click(function(){
				$(this).next().stop(true,true).slideToggle();
			});
		}

		function initializeApp(response)
		{			
			loadBlog();
			setupBanner(response.itemInfo.item.title,response.itemInfo.item.snippet);
		}

		function selectPostByScrollPosition(){
			var container = $("#blog .mCSB_container"),
				scrollTop = container.position().top,
				buffer = $("#blog").height() / 4,
				selectPosition = {
					top: null,
					bottom: null,
					atTop: null,
					fullyShown: null,
					topQuarter: null,
					bottomQuarter: null
				};

			if(scrollTop === 0){
				selectPosition.top = 0;	
			}
			else if(container.height() + scrollTop - (buffer*4) < 50){
				selectPosition.bottom = $(".geoblog-post").length - 1;
			}
			else{
				$(".geoblog-post").each(function(){					
					if(scrollTop + $(this).position().top === 0){
						selectPosition.atTop = $(this).index();
					}
					if($(this).position().top + $(this).outerHeight() + scrollTop < $(blogSelector).height() && scrollTop + $(this).position().top >= 0){
						selectPosition.fullyShown = $(this).index();
					}
					if(scrollTop + $(this).position().top <= buffer && scrollTop + $(this).position().top >= 0){
						selectPosition.topQuarter = $(this).index();
					}
					if($(this).position().top + $(this).outerHeight() + scrollTop >= $(blogSelector).height() - buffer && $(this).position().top + $(this).outerHeight() + scrollTop < $(blogSelector).height()){
						selectPosition.bottomQuarter = $(this).index();
					}
				});
			}

			var postIndex = null;

			if(selectPosition.top !== null){
				postIndex = selectPosition.top;
			}
			else if(selectPosition.bottom !== null){
				postIndex = selectPosition.bottom;
			}
			else if(selectPosition.atTop !== null){
				postIndex = selectPosition.atTop;
			}
			else if(selectPosition.fullyShown !== null){
				postIndex = selectPosition.fullyShown;
			}
			else if(selectPosition.topQuarter !== null){
				postIndex = selectPosition.topQuarter;
			}
			else if(selectPosition.bottomQuarter !== null){
				postIndex = selectPosition.bottomQuarter;
			}

			if (postIndex !== null){
				app.blogData.setPostByIndex(postIndex,app.blog.selectPost);
			}
		}

		function addIndexDots(graphics,updateAll)
		{

			if(updateAll){
				$("#nav-index-wrapper").empty();
			}
			
			dojo.forEach(graphics,function(g){
				$("#nav-index-wrapper").append('<p class="post-index-bullet" title="' + g.attributes.title + '">&#9679;</p>');
			});

			var bullets = $(".post-index-bullet");			
			bullets.first().css("margin-top",($("#nav-index-wrapper").height() - (bullets.outerHeight() * bullets.length)) / 2);

			if(updateAll){
				$(".post-index-bullet").tooltip({
					placement: "right"
				}).click(function(){
					if(!$(this).hasClass("active")){
						$("#blog").mCustomScrollbar("scrollTo",".geoblog-post:eq(" + $(this).index() + ")");
					}
				});
			}
		}

		function resizeBlogElements()
		{
			//Set embedable content to fill width of blog with a 16:9 ratio
			$(".blog-post-embed-wrapper iframe").height($(".blog-post-embed-wrapper iframe").width() * 0.563);

			//$(".blog-post-photo").width($(".blog-post-embed-wrapper iframe").width() - 10);

			var bullets = $(".post-index-bullet");			
			bullets.first().css("margin-top",($("#nav-index-wrapper").height() - (bullets.outerHeight() * bullets.length)) / 2);

			$("#blog").mCustomScrollbar("update");
		}

		return {
			init: init
		}
	}
);