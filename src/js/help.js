import tippy from 'tippy.js';

document.addEventListener("DOMContentLoaded", () => {
    tippy('#min-preset', {
        content: ".1 ETH is the minimum",
        placement: "bottom"
    });

    tippy('#ten-preset', {
        content: "The top 10 bidders will receive NFT artifacts bound to a unique painting by a Nashville artist",
        placement: "bottom"
    });

    tippy('#leader-preset', {
        content: "The top bidder will receive the #1 artifact bound to unique painting by a Nashville artist",
        placement: "bottom"
    });

    tippy('#combine-contribution-div', {
        content: "Combine this contribution with your first bid",
        placement: "bottom"
    });
});


