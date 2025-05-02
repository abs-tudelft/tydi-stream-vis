<?php
/**
 * Plugin Name: Vue Embed
 */

function vue_embed_shortcode() {
    return '<div id="tydi-stream-vis-app"></div>';
}
add_shortcode('vue_app', 'vue_embed_shortcode');

function vue_embed_enqueue_scripts() {
    if (has_shortcode(get_post()->post_content, 'vue_app')) {
        wp_enqueue_style('vue-app-style', plugin_dir_url(__FILE__) . 'dist/style.css');
        wp_enqueue_script('vue-app-script', plugin_dir_url(__FILE__) . 'dist/app.js', [], null, true);
    }
}
add_action('wp_enqueue_scripts', 'vue_embed_enqueue_scripts');
