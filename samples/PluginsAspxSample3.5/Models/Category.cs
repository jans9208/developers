using System.Collections.Generic;

namespace PluginsAspxSample.Models
{
	public class Category
	{
		public string Name { get; set; }
		public int Position { get; set; }
		public int Count { get; set; }
        public Dictionary<string, string> ImageUrls { get; set; }
	}
}
