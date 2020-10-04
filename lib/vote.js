"use strict";

console.log('vote')

$(function() {
    function postFetch(url, data) {
        return fetch(window.location.protocol + '//' + window.location.host + '/' + url, {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json'},
            body: JSON.stringify(data),
            method: 'POST'
        }).then(res => res.json());
    }
    $(document).on('click', 'a.upvote:not(.vote-disabled)', async function(e) {
        const mainPid = this.getAttribute('data-main-pid');
        const isUpvote = !this.classList.contains('upvoted');
        const res = await postFetch('cryptofrv2/vote', {
            toPid: mainPid,
            isUpvote
        });
        if (res.error && res.error === '[[error:self-vote]]') {
            console.log('Error self vote');
        } else {
            const $this = $(this);
            $this.toggleClass('upvoted');
            const $span = $this.siblings('span[data-votes-count]');
            const count = parseInt($span.text(), 10);
            const $siblingDownvoted = $this.siblings('.downvoted');
            const isDownvoted = $siblingDownvoted.length === 1;
            if (isUpvote) {
                if (isDownvoted) {
                    $span.text(count + 2);
                    $siblingDownvoted.toggleClass('downvoted');
                } else {
                    $span.text(count + 1);
                }
            } else {
                $span.text(count - 1);
            }
        }
    });

    $(document).on('click', 'a.downvote:not(.vote-disabled)', async function(e) {
        const mainPid = this.getAttribute('data-main-pid');
        const isDownvote = !this.classList.contains('downvoted');
        const res = await postFetch('cryptofrv2/downvote', {
            toPid: mainPid,
            isDownvote
        });
        if (res.error && res.error === '[[error:self-vote]]') {
            console.log('Error self vote');
        } else {
            const $this = $(this);
            $this.toggleClass('downvoted');
            const $span = $this.siblings('span[data-votes-count]');
            const count = parseInt($span.text(), 10);
            const $siblingUpvoted = $this.siblings('.upvoted');
            const isUpvoted = $siblingUpvoted.length === 1;
            if (isDownvote) {
                if (isUpvoted) {
                    $span.text(count - 2);
                    $siblingUpvoted.toggleClass('upvoted');
                } else {
                    $span.text(count - 1);
                }
            } else {
                $span.text(count + 1);
            }
        }
    });
});