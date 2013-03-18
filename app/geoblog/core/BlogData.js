define([],
	function()
	{
		/**
		 * BlogView
		 * @class BlogView
		 *
		 * Blog data model
		 */

		return function BlogData(reverseOrder)
		{
			var _this = this;

			//All blog posts
			var _blogData = null;
			var _blogDataObjectIdField = null;
			var _selectedPost = null;
			var _selectedPostIndex = 0;

			this.setBlogData = function(featureArray,OIdField)
			{
				if ($.isArray(featureArray)){
					if (reverseOrder){
						_blogData = featureArray.reverse();
					}
					else{
						_blogData = featureArray;
					}
					_blogData = featureArray;
					_blogDataObjectIdField = OIdField;
					if(!_selectedPost){
						_selectedPost = _blogData[0];
					}
				}
				else{
					console.log("Blog data must be array of graphics");
				}
			}

			this.getBlogLength = function()
			{
				return _blogData.length;
			}

			this.getCurrentBlogSet = function()
			{
				return _blogData;
				//TODO: Select data by page
			}
		}

	}
);