<?php
/**
 * Title: Hero
 * Slug: blokestrips/hero
 * Categories: featured
 */
?>
<!-- wp:cover {"url":"<?php echo get_template_directory_uri(); ?>/assets/images/hero-golf.jpg","dimRatio":60,"overlayColor":"primary","minHeight":100,"minHeightUnit":"vh","align":"full","style":{"spacing":{"padding":{"top":"100px","bottom":"100px"}}}} -->
<div class="wp-block-cover alignfull" style="padding-top:100px;padding-bottom:100px;min-height:100vh"><span aria-hidden="true" class="wp-block-cover__background has-primary-background-color has-background-dim-60 has-background-dim"></span><img class="wp-block-cover__image-background" alt="" src="<?php echo get_template_directory_uri(); ?>/assets/images/hero-golf.jpg" data-object-fit="cover"/><div class="wp-block-cover__inner-container">
<!-- wp:group {"layout":{"type":"constrained"}} -->
<div class="wp-block-group">
    <!-- wp:paragraph {"style":{"typography":{"letterSpacing":"0.2em","fontWeight":"700","textTransform":"uppercase"}},"backgroundColor":"accent","textColor":"primary","className":"inline-block px-4 py-1 rounded-full text-xs"} -->
    <p class="inline-block px-4 py-1 rounded-full text-xs has-primary-color has-accent-background-color has-text-color has-background" style="font-weight:700;letter-spacing:0.2em;text-transform:uppercase">Australia's #1 Group Trip Organiser</p>
    <!-- /wp:paragraph -->

    <!-- wp:heading {"level":1,"style":{"typography":{"fontSize":"clamp(3rem, 10vw, 6rem)","fontWeight":"900","fontStyle":"italic","lineHeight":"0.9"}},"textColor":"white"} -->
    <h1 class="has-white-color has-text-color" style="font-style:italic;font-weight:900;line-height:0.9;font-size:clamp(3rem, 10vw, 6rem)">GUYS WEEKENDS <br><span class="has-accent-color">SORTED.</span></h1>
    <!-- /wp:heading -->

    <!-- wp:paragraph {"style":{"typography":{"fontSize":"20px"}},"textColor":"white"} -->
    <p class="has-white-color has-text-color" style="font-size:20px">Golf trips, fishing getaways, bucks parties — fully organised end-to-end. You bring the crew. We handle absolutely everything else.</p>
    <!-- /wp:paragraph -->

    <!-- wp:buttons {"style":{"spacing":{"margin":{"top":"40px"}}}} -->
    <div class="wp-block-buttons" style="margin-top:40px">
        <!-- wp:button {"backgroundColor":"accent","textColor":"primary","style":{"typography":{"fontWeight":"900","fontStyle":"italic"}}} -->
        <div class="wp-block-button"><a class="wp-block-button__link has-primary-color has-accent-background-color has-text-color has-background" href="#packages" style="font-style:italic;font-weight:900">VIEW PACKAGES</a></div>
        <!-- /wp:button -->

        <!-- wp:button {"variant":"outline","style":{"border":{"color":"rgba(255,255,255,0.2)"},"typography":{"fontWeight":"700"}},"textColor":"white"} -->
        <div class="wp-block-button is-style-outline"><a class="wp-block-button__link has-white-color has-text-color" href="#register" style="border-color:rgba(255,255,255,0.2);font-weight:700">START A TRIP</a></div>
        <!-- /wp:button -->
    </div>
    <!-- /wp:buttons -->
</div>
<!-- /wp:group -->
</div></div>
<!-- /wp:cover -->
