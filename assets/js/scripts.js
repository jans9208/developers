window.jumpTo = function(whereTo) {
  $('html, body').animate({
    scrollTop: ( $('' + whereTo + '').offset().top - 60 )
  }, 75);
};

$(function() {
  
  if(window.location.hash) {
    var goTo = window.location.hash;
    window.jumpTo(goTo);
  }
  
  $('a[href^=#]').click(function(e) {
    var goTo = $(this).attr('href');
    window.jumpTo(goTo);
  });
  
});