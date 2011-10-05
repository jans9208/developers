<?php
  // The JSON feed is gzipped. This is needed to unpack it before using
  require('inc/gzdecode.php');
  
  // Get the JSON feed and gzunpack
  $file = gzdecode( file_get_contents("http://s.trustpilot.com/tpelements/917278/f.json.gz") );
  
  // JSON decode the string
  $json = json_decode($file);
  
  $settings['review_amount'] = 3;
  $settings['review_max_length'] = 150;
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Trustpilot sample plugin</title>
  <link rel="stylesheet" href="assets/css/sample.css" />
</head>

<body>
  <div class="tp-box" id="tp-iframe-widget">
    <header>
      <h1><?php echo $json->TrustScore->Human; ?></h1>
      <img src="<?php echo $json->TrustScore->StarsImageUrls->large; ?>" alt="stars"/>
      <p class="review-count"><?php echo $json->ReviewCount->Total; ?> customers has written a review on Trustpilot</p>
    </header>
  
    <h2>Latest reviews</h2>
    <section class="reviews">
    <?php for($i = 1; $i <= $settings['review_amount']; $i++) : ?>
      <?php $review = $json->Reviews[$i]; ?>
      <article>
        <img src="<?php echo $review->TrustScore->StarsImageUrls->small; ?>" alt="review stars"/>
        <time datetime="<?php echo $review->Created->UnixTime; ?>"></time>
        <h3><?php echo $review->Title; ?></h3>
        <p class="desc"><?php echo substr($review->Content, 0, $settings['review_max_length']); ?></p>
        <img src="<?php echo $review->User->ImageUrls->i24; ?>" alt="<?php echo $review->User->Name; ?>" class="user-img" />
        <p class="author">
          <?php echo $review->User->Name; ?><br />
          <?php echo $review->User->City; ?>
        </p>
        <div class="clear"></div>
      </article>
    <?php endfor; ?>
    </section>
    <a class="footer" href="<?php echo $json->ReviewPageUrl; ?>" target="_blank">
      <span class="logo"></span>
      <span class="trust">Trust</span>
      <span class="pilot">pilot</span>
    </a>
  </div>
</body>
</html>
