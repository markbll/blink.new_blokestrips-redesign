<?php
/**
 * BlokesTrips Theme Functions
 *
 * @package blokestrips
 */

if ( ! function_exists( 'blokestrips_setup' ) ) :
    /**
     * Sets up theme defaults and registers support for various WordPress features.
     */
    function blokestrips_setup() {
        // Add support for block styles.
        add_theme_support( 'wp-block-styles' );

        // Enqueue editor styles.
        add_editor_style( 'style.css' );
    }
endif;
add_action( 'after_setup_theme', 'blokestrips_setup' );

/**
 * Register Custom Post Types
 */
function blokestrips_register_cpts() {
    $labels = array(
        'name'                  => _x( 'Trip Packages', 'Post Type General Name', 'blokestrips' ),
        'singular_name'         => _x( 'Trip Package', 'Post Type Singular Name', 'blokestrips' ),
        'menu_name'             => __( 'Trip Packages', 'blokestrips' ),
        'name_admin_bar'        => __( 'Trip Package', 'blokestrips' ),
        'archives'              => __( 'Package Archives', 'blokestrips' ),
        'attributes'            => __( 'Package Attributes', 'blokestrips' ),
        'parent_item_colon'     => __( 'Parent Package:', 'blokestrips' ),
        'all_items'             => __( 'All Packages', 'blokestrips' ),
        'add_new_item'          => __( 'Add New Package', 'blokestrips' ),
        'add_new'               => __( 'Add New', 'blokestrips' ),
        'new_item'              => __( 'New Package', 'blokestrips' ),
        'edit_item'             => __( 'Edit Package', 'blokestrips' ),
        'update_item'           => __( 'Update Package', 'blokestrips' ),
        'view_item'             => __( 'View Package', 'blokestrips' ),
        'view_items'            => __( 'View Packages', 'blokestrips' ),
        'search_items'          => __( 'Search Package', 'blokestrips' ),
        'not_found'             => __( 'Not found', 'blokestrips' ),
        'not_found_in_trash'    => __( 'Not found in Trash', 'blokestrips' ),
        'featured_image'        => __( 'Featured Image', 'blokestrips' ),
        'set_featured_image'    => __( 'Set featured image', 'blokestrips' ),
        'remove_featured_image' => __( 'Remove featured image', 'blokestrips' ),
        'use_featured_image'    => __( 'Use as featured image', 'blokestrips' ),
        'insert_into_item'      => __( 'Insert into package', 'blokestrips' ),
        'uploaded_to_this_item' => __( 'Uploaded to this package', 'blokestrips' ),
        'items_list'            => __( 'Packages list', 'blokestrips' ),
        'items_list_navigation' => __( 'Packages list navigation', 'blokestrips' ),
        'filter_items_list'     => __( 'Filter packages list', 'blokestrips' ),
    );
    $args = array(
        'label'                 => __( 'Trip Package', 'blokestrips' ),
        'description'           => __( 'Custom post type for golf, fishing, and bucks trip packages.', 'blokestrips' ),
        'labels'                => $labels,
        'supports'              => array( 'title', 'editor', 'thumbnail', 'excerpt', 'custom-fields' ),
        'taxonomies'            => array( 'category' ),
        'hierarchical'          => false,
        'public'                => true,
        'show_ui'               => true,
        'show_in_menu'          => true,
        'menu_position'         => 5,
        'menu_icon'             => 'dashicons-location-alt',
        'show_in_admin_bar'     => true,
        'show_in_nav_menus'     => true,
        'can_export'            => true,
        'has_archive'           => true,
        'exclude_from_search'   => false,
        'publicly_queryable'    => true,
        'show_in_rest'          => true, // Required for Block Editor (Gutenberg)
        'capability_type'       => 'post',
    );
    register_post_type( 'trip_package', $args );
}
add_action( 'init', 'blokestrips_register_cpts', 0 );
