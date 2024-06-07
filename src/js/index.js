import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';
import 'spotlight.js';
import '../styles/fonts.css';
import '../styles/styles-common.css';
import $ from 'jquery';

$(document).ready(function () {
    // load assets/slogans.json
    $.getJSON('/assets/slogans.json', function (data) {
        const weightedChoices = [];
        for (const [weight, strings] of Object.entries(data)) {
            for (const string of strings) {
                for (let i = 0; i < weight; i++) {
                    weightedChoices.push(string);
                }
            }
        }
        const randomIndex = Math.floor(Math.random() * weightedChoices.length);
        $('#slogan').text(weightedChoices[randomIndex]);

    });

    var video = $('video.bg');  // Get the video element
    var height = $(window).height();  // Get the window height

    $(window).on('scroll', function () {
        var scrollTop = $(this).scrollTop();  // Get current scroll position
        var opacity = 1 - ((scrollTop * 1.5) / height);  // Calculate new opacity (fades out at the height of one screen)
        video.css('opacity', opacity);  // Set the new opacity of the video
    });

    $('.nav-link.exclusive').on('click', function () {
        let group_name = $(this).data('group');
        let group_element = $('.' + group_name);

        let group_links = $('.nav-link.exclusive[data-group=' + group_name + ']');

        group_links.removeClass('active');
        $(this).addClass('active');

        let target_name = $(this).data('show');
        let target_element = $('#' + target_name);

        // Hide members whose class names match the group variable.
        group_element.hide(0, function() {
            target_element.show();
        });
    });
});