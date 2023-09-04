import tippy from 'tippy.js';

document.addEventListener("DOMContentLoaded", () => {
    console.log("Firing DOM Content Loaded");

    tippy('#user-amount', {
        triggerTarget: document.getElementById('min-preset'),
        content: ".1 is the minimum to qualify for an Artifact",
        placement: "top"
    });

    tippy('#user-amount', {
        triggerTarget: document.getElementById('ten-preset'),
        content: "The top 10 bidders will receive NFT artifacts bound to a unique painting by a Nashville artist",
        placement: "top"
    });

    tippy('#user-amount', {
        triggerTarget: document.getElementById('leader-preset'),
        content: "The top bidder will receive the #1 artifact bound to unique painting by a Nashville artist",
        placement: "top"
    });

    tippy('#user-amount', {
        triggerTarget: document.getElementById('combine-contribution-div'),
        content: "Combine this contribution with your first bid",
        placement: "top"
    });
});


