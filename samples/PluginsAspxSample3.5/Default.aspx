<%@ Page Title="Home Page" Language="C#" MasterPageFile="~/Site.master" AutoEventWireup="true" CodeBehind="Default.aspx.cs" Inherits="PluginsAspxSample.Default" %>
<%@ Import Namespace="System.Linq" %>

<asp:Content ID="HeaderContent" runat="server" ContentPlaceHolderID="HeadContent">
	<link rel="stylesheet" href="/Styles/trustpilot.box.css"/>
</asp:Content>

<asp:Content ID="BodyContent" runat="server" ContentPlaceHolderID="MainContent">
	<h1>Welcome</h1>
	<div class="tp-box" id="tp-iframe-widget">
		<header>
			<h1><%= Feed.TrustScore.Human %></h1>
			<img src='<%= Feed.TrustScore.StarsImageUrls["large"] %>' alt="stars"/>
			<p class="review-count"><%= Feed.ReviewCount.Total %> customers has written a review on Trustpilot</p>
		</header>
		<h2>Latest reviews</h2>
		<section class="reviews">
			<% foreach (var review in Feed.Reviews.Take(3)) { %>
				<article>
					<img src='<%= review.TrustScore.StarsImageUrls["small"] %>' alt="review stars"/>
					<time datetime='<%= review.Created %>'></time>
					<h3><%= review.Title %></h3>
					<p class="desc"><%= Shorten(review.Content, 150) %></p>
					<img src='<%= review.User.ImageUrls["i24"] %>' alt='<%= review.User.Name %>' class="user-img" />
					<p class="author">
						<%= review.User.Name %>
						<% if (!string.IsNullOrEmpty(review.User.City)) { %>
							,
							<br />
							<%= review.User.City %>
						<% } %>
					</p>
					<div class="clear"></div>
				</article>
			<% } %>
		</section>
		<a class="footer" href='<%= Feed.ReviewPageUrl %>' target="_blank">
			<span class="logo"></span>
			<span class="trust">Trust</span>
			<span class="pilot">pilot</span>
		</a>
	</div>

</asp:Content>
