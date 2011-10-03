namespace PluginsMVC3Sample.Models.Trustpilot
{
	public class Review
	{
		public Time Created { get; set; }
		public string Title { get; set; }
		public string Content { get; set; }
		public TrustScore TrustScore { get; set; }
		public string CompanyReply { get; set; }
		public User User { get; set; }
	}
}
