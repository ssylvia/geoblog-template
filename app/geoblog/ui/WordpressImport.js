define([],
	function()
	{
		/**
		 * Wordpress Importer
		 * @class WordpressImport
		 *
		 * Class to import and manage blogpost from Wordpress
		 */

		return function WordpressImport(blogDomain,number,order,order_by,callback)
		{
			var _title = null,
				_description = null,
				_posts = null;

			$.ajax({
				type: 'GET',
				url: 'https://public-api.wordpress.com/rest/v1/sites/' + blogDomain,
				dataType: "jsonp",
				success: function(data){
					if(data){
						_title = data.name;
						_description = data.description
						callback(_title,_description);
					}
				}
			});

			this.init = function(initCallback) 
			{
				var requestOptions = {
					number: number || 10,
					order: order || "DESC",
					order_by: order_by || "date"
				}

				var requestString = "";

				for (item in requestOptions){
					if (requestString = "")
						requestString = requestString + requestOptions[item];
					else
						requestString = requestString + "&" + requestOptions[item];
				}

				console.log(requestString);

				$.ajax({
					type: 'GET',
					url: 'https://public-api.wordpress.com/rest/v1/sites/' + blogDomain + '/posts/?' + requestString,
					dataType: "jsonp",
					success: function(data){
						if(data){
							_posts = data.posts;
							console.log(_posts);
							initCallback();
						}
					}
				});
			}

			this.getCurrentPosts = function()
			{
				return _posts;
				//TODO: Select data by page
			}

		}

	}
);