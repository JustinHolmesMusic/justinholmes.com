import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';
import 'spotlight.js';
import '../styles/fonts.css';
import '../styles/styles-common.css';
import $ from 'jquery';

$(document).ready(function() {
    var video = $('video.bg');  // Get the video element
    var height = $(window).height();  // Get the window height

    $(window).on('scroll', function() {
        var scrollTop = $(this).scrollTop();  // Get current scroll position
        var opacity = 1 - (scrollTop / height);  // Calculate new opacity (fades out at the height of one screen)
        video.css('opacity', opacity);  // Set the new opacity of the video
    });
});